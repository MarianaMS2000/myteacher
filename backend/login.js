// ============================================================
//  backend/login.js
//  Ruta de inicio de sesión.  POST /api/auth/login
//
//  Este archivo corre en Node.js (servidor), NO en el navegador.
//  Recibe email + password, los verifica contra MySQL,
//  y si son correctos devuelve un token JWT.
//
//  El FRONTEND (login.html) llama a esta ruta con fetch().
//  Al final de este archivo hay el código de frontend comentado
//  que debes copiar a myteacher/scripts/login.js
//
//  Dependencias:  npm install express bcrypt jsonwebtoken
// ============================================================

const express = require('express');
const bcrypt  = require('bcrypt');        // para comparar contraseñas hasheadas
const jwt     = require('jsonwebtoken'); // para generar el token de sesión
const crypto  = require('crypto');       // para hashear el token al guardarlo en BD
const db      = require('./db');

const router = express.Router();

// Clave secreta para firmar tokens — en producción cámbiala por algo como:
// openssl rand -hex 64  →  guárdalo en el archivo .env
const JWT_SECRET  = process.env.JWT_SECRET  || 'myteacher_jwt_secret_2024';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d'; // el token dura 7 días

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/login
//
//  Body que espera recibir (JSON):
//    { "email": "...", "password": "..." }
//
//  Respuestas posibles:
//    200 → { token, usuario: { id, nombre, email, rol, foto_url } }
//    401 → { error: 'Credenciales inválidas' }   (email o password mal)
//    422 → { error: 'Campos requeridos' }         (falta email o password)
//    500 → { error: 'Error interno' }             (fallo en la BD)
//
//  FLUJO:
//    1. Validar que lleguen email y password
//    2. Buscar el usuario en MySQL por email
//    3. Comparar la contraseña enviada con el hash guardado (bcrypt)
//    4. Si todo OK → generar token JWT (contiene id, email, rol, nombre)
//    5. Guardar un registro de la sesión en la tabla sesiones_auth
//    6. Devolver el token + datos básicos del usuario
//       El FRONTEND lee usuario.rol para decidir a dónde redirigir:
//         'profesor'   → panel_profesor.html
//         'estudiante' → panel_estudiante.html
// ─────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // PASO 1: Validar campos obligatorios
  if (!email || !password) {
    return res.status(422).json({ error: 'Email y contraseña son obligatorios' });
  }

  try {
    // PASO 2: Buscar usuario en MySQL
    // Solo buscamos usuarios activos (activo = 1) para respetar soft-delete
    const [rows] = await db.query(
      `SELECT id, nombre, email, password_hash, rol, foto_url
       FROM usuarios
       WHERE email = ? AND activo = 1
       LIMIT 1`,
      [email.trim().toLowerCase()] // normalizamos el email a minúsculas
    );

    // Si no existe el email, devolvemos el mismo error que si la contraseña fuera mala.
    // Esto es importante por seguridad: no le decimos al atacante qué email existe.
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = rows[0];

    // PASO 3: Comparar contraseña con el hash guardado en BD
    // bcrypt.compare() maneja la sal automáticamente — nunca compares en texto plano
    const passwordOk = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // PASO 4: Generar token JWT
    // El payload viaja DENTRO del token (se puede leer pero no falsificar).
    // Incluimos el rol para que el frontend sepa a dónde redirigir sin otra consulta.
    const payload = {
      id:     usuario.id,
      email:  usuario.email,
      rol:    usuario.rol,     // ← 'estudiante' o 'profesor'
      nombre: usuario.nombre,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    // PASO 5: Guardar sesión en la BD
    // Guardamos el SHA-256 del token (no el token en texto plano) para poder
    // invalidar sesiones individuales si el usuario cierra sesión.
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expira    = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // ahora + 7 días

    await db.query(
      `INSERT INTO sesiones_auth (usuario_id, token_hash, user_agent, ip, expira_en)
       VALUES (?, ?, ?, ?, ?)`,
      [usuario.id, tokenHash, req.headers['user-agent'] || null, req.ip, expira]
    );

    // PASO 6: Responder con el token y los datos del usuario
    return res.json({
      token,
      usuario: {
        id:       usuario.id,
        nombre:   usuario.nombre,
        email:    usuario.email,
        rol:      usuario.rol,      // el frontend redirige según esto
        foto_url: usuario.foto_url,
      },
    });

  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;


// ═══════════════════════════════════════════════════════════════
//  CÓDIGO PARA EL FRONTEND — pega esto en myteacher/scripts/login.js
//  Reemplaza TODO el contenido actual del archivo
// ═══════════════════════════════════════════════════════════════

/*
// Guardamos el rol seleccionado en la UI (solo para mostrar el tab activo)
var selectedRole = localStorage.getItem('mt_last_role') || 'estudiante';
setRole(selectedRole);

// Cambia el tab visual Estudiante / Profesor (solo UI, el rol real viene de la BD)
function setRole(role) {
  selectedRole = role;
  document.getElementById('tab-est').classList.toggle('active',  role === 'estudiante');
  document.getElementById('tab-prof').classList.toggle('active', role === 'profesor');
}

// Escuchamos el submit del formulario
var loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    var email    = loginForm.querySelector('input[name="email"]').value.trim();
    var password = loginForm.querySelector('input[name="password"]').value;
    var btn      = loginForm.querySelector('.btn-login');

    // Validación básica en el frontend (el backend también valida)
    if (!email || !password) {
      loginForm.classList.add('shake');
      setTimeout(function () { loginForm.classList.remove('shake'); }, 400);
      return;
    }

    // Desactivar botón mientras esperamos la respuesta del servidor
    btn.textContent = 'Verificando...';
    btn.disabled = true;

    try {
      // Llamamos al backend — este verifica email y contraseña contra MySQL
      var res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email, password: password }),
      });
      var data = await res.json();

      if (!res.ok) {
        // Mostrar el mensaje de error devuelto por el servidor
        var errEl = document.getElementById('loginError');
        if (errEl) errEl.textContent = data.error || 'Error al iniciar sesión';
        loginForm.classList.add('shake');
        setTimeout(function () { loginForm.classList.remove('shake'); }, 400);
        btn.textContent = 'Entrar';
        btn.disabled = false;
        return;
      }

      // Guardar token y datos en localStorage para usarlos en el resto de páginas
      localStorage.setItem('mt_token', data.token);
      localStorage.setItem('mt_user',  JSON.stringify(data.usuario));
      localStorage.setItem('mt_last_role', data.usuario.rol);

      // Feedback visual
      btn.textContent = '✓ Entrando...';
      btn.style.background = '#3a7a28';

      // Redirigir según el rol que devolvió la BD (no lo que eligió el tab)
      // Esto garantiza que un profesor no pueda entrar al panel de estudiante
      setTimeout(function () {
        window.location.href = data.usuario.rol === 'profesor'
          ? 'panel_profesor.html'
          : 'panel_estudiante.html';
      }, 1000);

    } catch (err) {
      console.error('Error de red:', err);
      btn.textContent = 'Entrar';
      btn.disabled = false;
    }
  });
}
*/
