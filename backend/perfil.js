// ============================================================
//  backend/perfil.js
//  Rutas para leer y actualizar el perfil del usuario.
//
//  Rutas:
//    GET   /api/auth/me       → datos completos del usuario autenticado
//    PATCH /api/auth/perfil   → actualizar nombre, teléfono, bio, ciudad
//    POST  /api/auth/foto     → subir foto de perfil (multipart)
// ============================================================

const express  = require('express');
const db       = require('./db');
const auth     = require('./auth');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');

const router = express.Router();

// ── Configuración de multer para subida de fotos ──
// Las fotos se guardan en la carpeta /uploads/fotos
const uploadsDir = path.join(__dirname, '..', 'uploads', 'fotos');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadsDir); },
  filename:    function (req, file, cb) {
    // nombre único: userId_timestamp.ext
    var ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'user_' + req.usuarioId + '_' + Date.now() + ext);
  }
});

const upload = multer({
  storage: storage,
  limits:  { fileSize: 5 * 1024 * 1024 }, // máximo 5 MB
  fileFilter: function (req, file, cb) {
    // Solo imágenes
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  }
});

// ─────────────────────────────────────────────────────────────
//  GET /api/auth/me
//  Devuelve el perfil completo del usuario autenticado.
//  El frontend lo llama al cargar cualquier página del panel
//  para tener siempre datos frescos desde la BD.
// ─────────────────────────────────────────────────────────────
router.get('/me', auth(), async (req, res) => {
  try {
    // Datos base del usuario
    const [rows] = await db.query(
      'SELECT id, nombre, email, rol, foto_url, telefono FROM usuarios WHERE id = ? AND activo = 1',
      [req.usuarioId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const usuario = rows[0];

    // Añadir datos del perfil según el rol
    if (usuario.rol === 'estudiante') {
      const [perfil] = await db.query(
        `SELECT pe.nivel_estudio, pe.institucion, pe.bio, c.nombre AS ciudad
         FROM perfiles_estudiante pe
         LEFT JOIN ciudades c ON c.id = pe.ciudad_id
         WHERE pe.usuario_id = ?`,
        [req.usuarioId]
      );
      if (perfil.length > 0) Object.assign(usuario, perfil[0]);

    } else if (usuario.rol === 'profesor') {
      const [perfil] = await db.query(
        `SELECT pp.especialidad, pp.experiencia_años, pp.modalidad,
                pp.precio_min_cop, pp.precio_max_cop, pp.descripcion,
                pp.rating_promedio, pp.total_resenas, pp.verificado,
                c.nombre AS ciudad
         FROM perfiles_profesor pp
         LEFT JOIN ciudades c ON c.id = pp.ciudad_id
         WHERE pp.usuario_id = ?`,
        [req.usuarioId]
      );
      if (perfil.length > 0) Object.assign(usuario, perfil[0]);
    }

    return res.json({ usuario });
  } catch (err) {
    console.error('[me]', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─────────────────────────────────────────────────────────────
//  PATCH /api/auth/perfil
//  Actualiza los datos del perfil en la BD.
//  Cualquier campo que no venga se ignora (solo actualiza lo que llega).
// ─────────────────────────────────────────────────────────────
router.patch('/perfil', auth(), async (req, res) => {
  const { nombre, telefono, bio, ciudad, especialidad, descripcion, modalidad, precio_min_cop, precio_max_cop, foto_url } = req.body;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Actualizar tabla usuarios (nombre, teléfono, foto_url si viene)
    const camposUsuario = [];
    const valsUsuario   = [];
    if (nombre    !== undefined) { camposUsuario.push('nombre = ?');    valsUsuario.push(nombre); }
    if (telefono  !== undefined) { camposUsuario.push('telefono = ?');  valsUsuario.push(telefono || null); }
    if (foto_url  !== undefined) { camposUsuario.push('foto_url = ?');  valsUsuario.push(foto_url); }

    if (camposUsuario.length > 0) {
      valsUsuario.push(req.usuarioId);
      await conn.query(`UPDATE usuarios SET ${camposUsuario.join(', ')} WHERE id = ?`, valsUsuario);
    }

    // Actualizar perfil según rol
    if (req.rol === 'estudiante') {
      const camposPerfil = [];
      const valsPerfil   = [];
      if (bio    !== undefined) { camposPerfil.push('bio = ?');    valsPerfil.push(bio || null); }

      // Si viene ciudad como texto, buscar su id
      if (ciudad !== undefined && ciudad) {
        const [ciu] = await conn.query('SELECT id FROM ciudades WHERE nombre LIKE ? LIMIT 1', ['%' + ciudad + '%']);
        if (ciu.length > 0) { camposPerfil.push('ciudad_id = ?'); valsPerfil.push(ciu[0].id); }
      }

      if (camposPerfil.length > 0) {
        valsPerfil.push(req.usuarioId);
        await conn.query(`UPDATE perfiles_estudiante SET ${camposPerfil.join(', ')} WHERE usuario_id = ?`, valsPerfil);
      }

    } else if (req.rol === 'profesor') {
      const camposPerfil = [];
      const valsPerfil   = [];
      if (especialidad   !== undefined) { camposPerfil.push('especialidad = ?');   valsPerfil.push(especialidad); }
      if (descripcion    !== undefined) { camposPerfil.push('descripcion = ?');     valsPerfil.push(descripcion || null); }
      if (modalidad      !== undefined) { camposPerfil.push('modalidad = ?');       valsPerfil.push(modalidad); }
      if (precio_min_cop !== undefined) { camposPerfil.push('precio_min_cop = ?'); valsPerfil.push(precio_min_cop); }
      if (precio_max_cop !== undefined) { camposPerfil.push('precio_max_cop = ?'); valsPerfil.push(precio_max_cop); }

      if (ciudad !== undefined && ciudad) {
        const [ciu] = await conn.query('SELECT id FROM ciudades WHERE nombre LIKE ? LIMIT 1', ['%' + ciudad + '%']);
        if (ciu.length > 0) { camposPerfil.push('ciudad_id = ?'); valsPerfil.push(ciu[0].id); }
      }

      if (camposPerfil.length > 0) {
        valsPerfil.push(req.usuarioId);
        await conn.query(`UPDATE perfiles_profesor SET ${camposPerfil.join(', ')} WHERE usuario_id = ?`, valsPerfil);
      }
    }

    await conn.commit();
    return res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    console.error('[perfil PATCH]', err);
    return res.status(500).json({ error: 'Error interno' });
  } finally {
    conn.release();
  }
});

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/foto
//  Sube una foto de perfil. Guarda el archivo en /uploads/fotos
//  y actualiza foto_url en la tabla usuarios.
// ─────────────────────────────────────────────────────────────
router.post('/foto', auth(), upload.single('foto'), async (req, res) => {
  if (!req.file) return res.status(422).json({ error: 'No se recibió ninguna imagen' });

  // La URL pública de la foto (el servidor sirve /uploads estáticamente)
  const fotoUrl = '/uploads/fotos/' + req.file.filename;

  try {
    await db.query('UPDATE usuarios SET foto_url = ? WHERE id = ?', [fotoUrl, req.usuarioId]);
    return res.json({ foto_url: fotoUrl });
  } catch (err) {
    console.error('[foto POST]', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;

// ─────────────────────────────────────────────────────────────
//  DELETE /api/auth/cuenta
//  Elimina la cuenta del usuario marcando activo = 0 (soft-delete).
//  Después de esto, el login rechaza el usuario porque filtra por activo = 1.
// ─────────────────────────────────────────────────────────────
router.delete('/cuenta', auth(), async (req, res) => {
  try {
    /* Marcar como inactivo — soft-delete. El login ya filtra activo = 1 */
    await db.query('UPDATE usuarios SET activo = 0 WHERE id = ?', [req.usuarioId]);

    /* Invalidar todas las sesiones del usuario */
    await db.query('DELETE FROM sesiones_auth WHERE usuario_id = ?', [req.usuarioId]);

    return res.json({ ok: true });
  } catch (err) {
    console.error('[cuenta DELETE]', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─────────────────────────────────────────────────────────────
//  PATCH /api/auth/password
//  Cambia la contraseña del usuario autenticado.
// ─────────────────────────────────────────────────────────────
router.patch('/password', auth(), async (req, res) => {
  const bcrypt = require('bcrypt');
  const { actual, nueva } = req.body;
  if (!actual || !nueva) return res.status(422).json({ error: 'Campos requeridos' });
  if (nueva.length < 8) return res.status(422).json({ error: 'La contraseña debe tener al menos 8 caracteres' });

  try {
    const [rows] = await db.query('SELECT password_hash FROM usuarios WHERE id = ?', [req.usuarioId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const ok = await bcrypt.compare(actual, rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

    const hash = await bcrypt.hash(nueva, 12);
    await db.query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [hash, req.usuarioId]);
    return res.json({ ok: true });
  } catch (err) {
    console.error('[password PATCH]', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});
