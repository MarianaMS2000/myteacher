// ============================================================
//  backend/registro.js
//  Ruta de registro de nuevos usuarios.  POST /api/auth/registro
//
//  Crea el usuario en MySQL con contraseña hasheada y genera
//  automáticamente el perfil correspondiente (estudiante o profesor).
//  Si es profesor, también crea su fila de onboarding pendiente.
//
//  Al final del archivo está el código de frontend comentado
//  que debes copiar a myteacher/scripts/registro.js
// ============================================================

const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('./db');

const router      = express.Router();
const JWT_SECRET  = process.env.JWT_SECRET  || 'myteacher_jwt_secret_2024';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
const SALT_ROUNDS = 12; // cuántas veces bcrypt procesa el hash — 12 es el estándar seguro actual

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/registro
//
//  Body esperado (JSON):
//    { "nombre": "...", "email": "...", "password": "...", "rol": "estudiante"|"profesor" }
//
//  FLUJO:
//    1. Validar que lleguen todos los campos
//    2. Verificar que el email no esté ya registrado
//    3. Hashear la contraseña con bcrypt (nunca guardamos texto plano)
//    4. Dentro de una transacción:
//       a. Crear el usuario base en tabla 'usuarios'
//       b. Si es estudiante → crear fila en 'perfiles_estudiante'
//          Si es profesor   → crear fila en 'perfiles_profesor' + 'onboarding_profesor'
//    5. Generar token JWT para que el usuario quede logueado de inmediato
//    6. Devolver token + datos del usuario
// ─────────────────────────────────────────────────────────────
router.post('/registro', async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  // PASO 1: Validar campos
  if (!nombre || !email || !password || !rol) {
    return res.status(422).json({ error: 'Todos los campos son obligatorios' });
  }
  if (!['estudiante', 'profesor'].includes(rol)) {
    return res.status(422).json({ error: 'Rol inválido — debe ser estudiante o profesor' });
  }
  if (password.length < 8) {
    return res.status(422).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  // Normalizamos para evitar duplicados por mayúsculas o espacios
  const emailNorm  = email.trim().toLowerCase();
  const nombreNorm = nombre.trim();

  try {
    // PASO 2: Verificar email único — solo contamos cuentas ACTIVAS.
    // Una cuenta con activo=0 fue eliminada (soft-delete), por lo que ese
    // email debe quedar libre para un nuevo registro.
    const [existe] = await db.query(
      'SELECT id FROM usuarios WHERE email = ? AND activo = 1 LIMIT 1',
      [emailNorm]
    );
    if (existe.length > 0) {
      // El email ya está en uso por una cuenta activa
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo electrónico' });
    }

    // PASO 2b: Si existe una cuenta eliminada con ese email, la sobreescribimos
    // en lugar de crear un registro duplicado (así la BD no crece con filas huérfanas).
    const [cuentaEliminada] = await db.query(
      'SELECT id FROM usuarios WHERE email = ? AND activo = 0 LIMIT 1',
      [emailNorm]
    );
    const idReutilizado = cuentaEliminada.length > 0 ? cuentaEliminada[0].id : null;

    // PASO 3: Hashear la contraseña
    // bcrypt.hash() genera automáticamente una "sal" aleatoria y la embebe en el hash.
    // Esto significa que aunque dos usuarios tengan la misma contraseña, sus hashes son diferentes.
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    // PASO 4: Transacción — si algo falla, revertimos TODO (no quedan datos a medias)
    const conn = await db.getConnection(); // conexión dedicada para la transacción
    try {
      await conn.beginTransaction(); // inicio de la transacción

      // 4a. Crear o restaurar el usuario base
      let nuevoId;
      if (idReutilizado) {
        // Reutilizar la fila de la cuenta eliminada: actualizamos sus datos y la reactivamos
        await conn.query(
          `UPDATE usuarios
           SET nombre = ?, password_hash = ?, rol = ?, activo = 1,
               foto_url = NULL, creado_en = NOW()
           WHERE id = ?`,
          [nombreNorm, hash, rol, idReutilizado]
        );
        nuevoId = idReutilizado;

        // Limpiar perfiles anteriores para que empiece limpio
        await conn.query('DELETE FROM perfiles_estudiante WHERE usuario_id = ?', [nuevoId]);
        await conn.query('DELETE FROM perfiles_profesor    WHERE usuario_id = ?', [nuevoId]);
        await conn.query('DELETE FROM onboarding_profesor  WHERE usuario_id = ?', [nuevoId]);
      } else {
        // Cuenta nueva: insertar normalmente
        const [result] = await conn.query(
          `INSERT INTO usuarios (nombre, email, password_hash, rol)\n         VALUES (?, ?, ?, ?)`,
          [nombreNorm, emailNorm, hash, rol]
        );
        nuevoId = result.insertId;
      }

      // 4b. Crear el perfil según el rol
      if (rol === 'estudiante') {
        // Perfil de estudiante — comienza vacío, lo completa en configuracion.html
        await conn.query(
          'INSERT INTO perfiles_estudiante (usuario_id) VALUES (?)',
          [nuevoId]
        );
      } else {
        // Perfil de profesor — comienza vacío, se completa en onboarding.html
        await conn.query(
          'INSERT INTO perfiles_profesor (usuario_id) VALUES (?)',
          [nuevoId]
        );
        // Fila de onboarding para registrar que aún no completó el proceso inicial
        await conn.query(
          'INSERT INTO onboarding_profesor (usuario_id, completado) VALUES (?, 0)',
          [nuevoId]
        );
      }

      await conn.commit(); // todo OK — confirmar los cambios en la BD

      // PASO 5: Generar token JWT (mismo payload que en login)
      const token = jwt.sign(
        { id: nuevoId, email: emailNorm, rol, nombre: nombreNorm },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
      );

      // PASO 6: Responder con token y datos del usuario recién creado
      return res.status(201).json({
        token,
        usuario: { id: nuevoId, nombre: nombreNorm, email: emailNorm, rol },
        // El frontend redirige según rol:
        //   'profesor'   → onboarding.html (para completar el perfil)
        //   'estudiante' → panel_estudiante.html
      });

    } catch (txErr) {
      await conn.rollback(); // algo falló — revertir todo para no dejar datos corruptos
      throw txErr;           // relanzar para que lo capture el catch externo
    } finally {
      conn.release(); // devolver la conexión al pool cuando terminemos
    }

  } catch (err) {
    console.error('[registro]', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;


// ═══════════════════════════════════════════════════════════════
//  CÓDIGO PARA EL FRONTEND — pega esto en myteacher/scripts/registro.js
//  Reemplaza el bloque del addEventListener 'submit' (el de abajo del todo)
// ═══════════════════════════════════════════════════════════════

/*
// Las funciones togglePass(), validarLongitud(), cambiarRol(), elegirRol()
// NO cambian — son solo de UI y no tocan la BD.

// Solo reemplaza el addEventListener de submit al final del archivo:

document.getElementById('registro-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  var form = e.target;

  var nombre    = form.nombre.value.trim();
  var email     = form.email.value.trim();
  var password  = form.password.value;
  var password2 = form.password2.value;

  // Detectar cuál tab está activo para saber el rol
  var tabEst = document.getElementById('tab-estudiante');
  var rol    = (tabEst && tabEst.classList.contains('active')) ? 'estudiante' : 'profesor';

  // Validaciones de interfaz (igual que antes — el backend también valida)
  if (!nombre || !email) {
    form.classList.add('shake');
    setTimeout(function () { form.classList.remove('shake'); }, 400);
    return;
  }
  if (password.length < 8) {
    var ep = document.getElementById('error-password');
    var ip = document.getElementById('input-password');
    if (ep) ep.textContent = 'La contraseña debe tener al menos 8 caracteres';
    if (ip) { ip.classList.add('input-error'); ip.classList.remove('input-ok'); }
    form.classList.add('shake');
    setTimeout(function () { form.classList.remove('shake'); }, 400);
    return;
  }
  if (password !== password2) {
    var ep2 = document.getElementById('error-password2');
    var ip2 = document.getElementById('input-password2');
    if (ep2) ep2.textContent = 'Las contraseñas no coinciden';
    if (ip2) { ip2.classList.add('input-error'); ip2.classList.remove('input-ok'); }
    form.classList.add('shake');
    setTimeout(function () { form.classList.remove('shake'); }, 400);
    return;
  }

  var btn = form.querySelector('.btn-submit-registro');
  btn.textContent = 'Creando cuenta...';
  btn.disabled = true;

  try {
    // Llamamos al backend para crear el usuario en MySQL
    var res  = await fetch('/api/auth/registro', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ nombre: nombre, email: email, password: password, rol: rol }),
    });
    var data = await res.json();

    if (!res.ok) {
      // Mostrar el error devuelto por el servidor (ej: email ya registrado)
      var errEl = document.getElementById('errorGeneral');
      if (errEl) errEl.textContent = data.error;
      btn.textContent = 'Crear cuenta';
      btn.disabled = false;
      return;
    }

    // Guardar sesión (igual que en login)
    localStorage.setItem('mt_token', data.token);
    localStorage.setItem('mt_user',  JSON.stringify(data.usuario));
    localStorage.setItem('mt_last_role', data.usuario.rol);

    btn.textContent = '✓ ¡Listo!';
    btn.style.background = '#3a7a28';

    // Redirigir según rol
    setTimeout(function () {
      window.location.href = data.usuario.rol === 'profesor'
        ? 'onboarding.html'        // el profesor completa su perfil primero
        : 'panel_estudiante.html'; // el estudiante va directo al panel
    }, 1000);

  } catch (err) {
    console.error('Error de red:', err);
    btn.textContent = 'Crear cuenta';
    btn.disabled = false;
  }
});
*/
