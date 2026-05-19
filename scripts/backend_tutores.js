// ============================================================
//  backend/tutores.js
//  Búsqueda, perfil y reseñas de tutores.
//
//  Rutas que expone:
//    GET  /api/tutores        → listar/filtrar tutores
//    GET  /api/tutores/mapa   → datos para el mapa
//    GET  /api/tutores/:id    → perfil completo de un tutor
//    POST /api/resenas        → el estudiante crea una reseña
// ============================================================

const express = require('express');
const db      = require('./db');
const auth    = require('./auth');

const router = express.Router();

// ─────────────────────────────────────────────────────────────
//  GET /api/tutores
//  Lista profesores con filtros opcionales por query string.
//  Ejemplos: ?materia=Inglés  ?ciudad=Bogotá  ?modalidad=virtual  ?q=Ricardo
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { materia, ciudad, modalidad, precio_max, q } = req.query;

  let sql = `
    SELECT
      u.id,
      u.nombre,
      u.foto_url,
      pp.especialidad,
      pp.modalidad,
      pp.precio_min_cop,
      pp.precio_max_cop,
      pp.rating_promedio,
      pp.total_resenas,
      pp.verificado,
      c.nombre AS ciudad,
      GROUP_CONCAT(m.nombre ORDER BY m.nombre SEPARATOR ', ') AS materias
    FROM usuarios u
    JOIN perfiles_profesor pp ON pp.usuario_id = u.id
    LEFT JOIN ciudades c      ON c.id          = pp.ciudad_id
    LEFT JOIN profesor_materias pm ON pm.profesor_id = u.id
    LEFT JOIN materias m           ON m.id      = pm.materia_id
    WHERE u.rol = 'profesor' AND u.activo = 1
  `;

  const params = [];

  if (materia) {
    sql += ` AND EXISTS (
      SELECT 1 FROM profesor_materias pm2
      JOIN materias m2 ON m2.id = pm2.materia_id
      WHERE pm2.profesor_id = u.id AND m2.nombre LIKE ?
    )`;
    params.push('%' + materia + '%');
  }
  if (ciudad) {
    sql += ' AND c.nombre LIKE ?';
    params.push('%' + ciudad + '%');
  }
  if (modalidad) {
    sql += ' AND pp.modalidad = ?';
    params.push(modalidad);
  }
  if (precio_max) {
    sql += ' AND pp.precio_min_cop <= ?';
    params.push(parseInt(precio_max));
  }
  if (q) {
    sql += ' AND (u.nombre LIKE ? OR pp.especialidad LIKE ?)';
    params.push('%' + q + '%', '%' + q + '%');
  }

  sql += ' GROUP BY u.id ORDER BY pp.rating_promedio DESC, pp.total_resenas DESC';

  try {
    const [rows] = await db.query(sql, params);
    return res.json({ tutores: rows });
  } catch (err) {
    console.error('[tutores GET]', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─────────────────────────────────────────────────────────────
//  GET /api/tutores/mapa
//  Datos ligeros con lat/lng para los pines del mapa.
// ─────────────────────────────────────────────────────────────
router.get('/mapa', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         u.id,
         u.nombre,
         u.foto_url,
         pp.especialidad,
         pp.modalidad,
         pp.precio_min_cop,
         pp.precio_max_cop,
         pp.rating_promedio,
         c.nombre AS ciudad,
         c.lat,
         c.lng
       FROM usuarios u
       JOIN perfiles_profesor pp ON pp.usuario_id = u.id
       LEFT JOIN ciudades c      ON c.id = pp.ciudad_id
       WHERE u.rol = 'profesor' AND u.activo = 1
         AND c.lat IS NOT NULL
       ORDER BY pp.rating_promedio DESC`
    );
    return res.json({ tutores: rows });
  } catch (err) {
    console.error('[tutores mapa]', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─────────────────────────────────────────────────────────────
//  GET /api/tutores/:id
//  Perfil completo de un profesor: datos + materias + reseñas.
// ─────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const tutorId = parseInt(req.params.id);
  if (!tutorId) return res.status(422).json({ error: 'ID inválido' });

  try {
    const [rows] = await db.query(
      `SELECT
         u.id,
         u.nombre,
         u.email,
         u.foto_url,
         u.telefono,
         pp.especialidad,
         pp.experiencia_años  AS anos_experiencia,
         pp.nivel_educativo   AS nivel,
         pp.modalidad,
         pp.precio_min_cop,
         pp.precio_max_cop,
         pp.descripcion,
         pp.rating_promedio,
         pp.total_resenas,
         pp.verificado,
         c.nombre AS ciudad
       FROM usuarios u
       JOIN perfiles_profesor pp ON pp.usuario_id = u.id
       LEFT JOIN ciudades c      ON c.id = pp.ciudad_id
       WHERE u.id = ? AND u.rol = 'profesor' AND u.activo = 1`,
      [tutorId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Profesor no encontrado' });
    }

    const tutor = rows[0];

    const [materias] = await db.query(
      `SELECT m.id, m.nombre
       FROM materias m
       JOIN profesor_materias pm ON pm.materia_id = m.id
       WHERE pm.profesor_id = ?
       ORDER BY m.nombre`,
      [tutorId]
    );
    tutor.materias        = materias.map(function(m) { return m.nombre; });
    tutor.materias_con_id = materias.map(function(m) { return { id: m.id, nombre: m.nombre }; });

    const [resenas] = await db.query(
      `SELECT
         r.estrellas,
         r.comentario,
         r.creado_en,
         u.nombre   AS estudiante_nombre,
         u.foto_url AS estudiante_foto,
         m.nombre   AS materia
       FROM resenas r
       JOIN usuarios u ON u.id = r.estudiante_id
       LEFT JOIN materias m ON m.id = r.materia_id
       WHERE r.profesor_id = ?
       ORDER BY r.creado_en DESC
       LIMIT 5`,
      [tutorId]
    );
    tutor.resenas = resenas;

    return res.json({ tutor });
  } catch (err) {
    console.error('[tutores/:id]', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─────────────────────────────────────────────────────────────
//  POST /api/resenas
//  El estudiante califica una tutoría completada.
//  El trigger en MySQL actualiza el rating del profesor automáticamente.
// ─────────────────────────────────────────────────────────────
router.post('/resenas', auth('estudiante'), async (req, res) => {
  const { tutoria_id, estrellas, comentario } = req.body;

  if (!tutoria_id || !estrellas) {
    return res.status(422).json({ error: 'tutoria_id y estrellas son obligatorios' });
  }
  if (estrellas < 1 || estrellas > 5) {
    return res.status(422).json({ error: 'Las estrellas deben ser entre 1 y 5' });
  }

  try {
    const [tut] = await db.query(
      "SELECT * FROM tutorias WHERE id = ? AND estudiante_id = ? AND estado = 'completada'",
      [tutoria_id, req.usuarioId]
    );
    if (tut.length === 0) {
      return res.status(403).json({ error: 'No puedes reseñar esta tutoría' });
    }

    await db.query(
      `INSERT INTO resenas (tutoria_id, estudiante_id, profesor_id, materia_id, estrellas, comentario)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tutoria_id, req.usuarioId, tut[0].profesor_id, tut[0].materia_id, estrellas, comentario || null]
    );

    return res.status(201).json({ ok: true });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya dejaste una reseña para esta tutoría' });
    }
    console.error('[resenas POST]', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
