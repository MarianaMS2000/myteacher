// ============================================================
//  backend/tutorias.js
//  Gestión completa del flujo de tutorías:
//    Solicitud → Aceptación/Rechazo → Tutoría confirmada → Reseña
//
//  Rutas que expone:
//    POST   /api/solicitudes              → estudiante envía solicitud
//    GET    /api/solicitudes              → ver mis solicitudes (ambos roles)
//    PATCH  /api/solicitudes/:id/aceptar  → profesor acepta → crea tutoría
//    PATCH  /api/solicitudes/:id/rechazar → profesor rechaza
//    GET    /api/tutorias                 → mis tutorías completas
//    GET    /api/tutorias/hoy             → sesiones de hoy (panel del profesor)
// ============================================================

const express = require('express');
const db      = require('./db');
const auth    = require('./auth');

const router = express.Router();

// ─────────────────────────────────────────────────────────────
//  POST /api/solicitudes
//  El estudiante pide una tutoría con un profesor.
// ─────────────────────────────────────────────────────────────
router.post('/solicitudes', auth('estudiante'), async (req, res) => {
  const { profesor_id, materia_id, fecha_prop, hora_prop, duracion_min, modalidad, mensaje } = req.body;

  if (!profesor_id || !fecha_prop || !hora_prop) {
    return res.status(422).json({ error: 'Faltan campos obligatorios: profesor, fecha y hora' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO solicitudes
         (estudiante_id, profesor_id, materia_id, fecha_prop, hora_prop, duracion_min, modalidad, mensaje)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.usuarioId,
        profesor_id,
        materia_id || null,
        fecha_prop,
        hora_prop,
        duracion_min || 60,
        modalidad || 'virtual',
        mensaje || null,
      ]
    );

    await db.query(
      `INSERT INTO notificaciones (usuario_id, tipo, titulo, cuerpo, url_accion)
       VALUES (?, 'solicitud_nueva', 'Nueva solicitud de tutoría',
               'Un estudiante quiere agendar una sesión contigo.', '/solicitudes_profesor.html')`,
      [profesor_id]
    );

    return res.status(201).json({ id: result.insertId });

  } catch (err) {
    console.error('[solicitudes POST]', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─────────────────────────────────────────────────────────────
//  GET /api/solicitudes
//  Devuelve las solicitudes del usuario autenticado.
//  Estudiante ve las que envió. Profesor ve las que recibió.
// ─────────────────────────────────────────────────────────────
router.get('/solicitudes', auth(), async (req, res) => {
  const esProfesor = req.rol === 'profesor';
  const columna    = esProfesor ? 'profesor_id' : 'estudiante_id';

  try {
    const [rows] = await db.query(
      `SELECT
         s.*,
         u_est.nombre   AS estudiante_nombre,
         u_est.foto_url AS estudiante_foto,
         u_prof.nombre  AS profesor_nombre,
         u_prof.foto_url AS profesor_foto,
         m.nombre AS materia
       FROM solicitudes s
       JOIN usuarios u_est  ON u_est.id  = s.estudiante_id
       JOIN usuarios u_prof ON u_prof.id = s.profesor_id
       LEFT JOIN materias m ON m.id = s.materia_id
       WHERE s.${columna} = ?
       ORDER BY s.creado_en DESC`,
      [req.usuarioId]
    );
    return res.json({ solicitudes: rows });
  } catch (err) {
    console.error('[solicitudes GET]', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─────────────────────────────────────────────────────────────
//  PATCH /api/solicitudes/:id/aceptar
//  El profesor acepta → crea la tutoría y notifica al estudiante.
// ─────────────────────────────────────────────────────────────
router.patch('/solicitudes/:id/aceptar', auth('profesor'), async (req, res) => {
  const solicitudId = parseInt(req.params.id);
  const { precio_cop, link_virtual, direccion } = req.body;
  /* precio_cop es opcional: si no lo envía el profesor, se usa el de la solicitud */

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [sol] = await conn.query(
      "SELECT * FROM solicitudes WHERE id = ? AND profesor_id = ? AND estado = 'enviada'",
      [solicitudId, req.usuarioId]
    );
    if (sol.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Solicitud no encontrada o ya procesada' });
    }

    const s = sol[0];

    const [tRes] = await conn.query(
      `INSERT INTO tutorias
         (estudiante_id, profesor_id, materia_id, fecha, hora_inicio,
          duracion_min, modalidad, precio_cop, estado, link_virtual, direccion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmada', ?, ?)`,
      [
        s.estudiante_id, s.profesor_id, s.materia_id,
        s.fecha_prop, s.hora_prop, s.duracion_min, s.modalidad,
        precio_cop || 0, link_virtual || null, direccion || null,
      ]
    );

    await conn.query(
      "UPDATE solicitudes SET estado = 'aceptada', tutoria_id = ? WHERE id = ?",
      [tRes.insertId, solicitudId]
    );

    await conn.query(
      `INSERT INTO notificaciones (usuario_id, tipo, titulo, cuerpo, url_accion)
       VALUES (?, 'tutoria_confirmada', '¡Tu tutoría fue confirmada!',
               'El profesor aceptó tu solicitud. Revisa tus próximas tutorías.', '/mis_tutorias.html')`,
      [s.estudiante_id]
    );

    await conn.commit();
    return res.json({ tutoria_id: tRes.insertId });

  } catch (err) {
    await conn.rollback();
    console.error('[solicitudes aceptar]', err);
    return res.status(500).json({ error: 'Error interno' });
  } finally {
    conn.release();
  }
});

// ─────────────────────────────────────────────────────────────
//  PATCH /api/solicitudes/:id/rechazar
// ─────────────────────────────────────────────────────────────
router.patch('/solicitudes/:id/rechazar', auth('profesor'), async (req, res) => {
  const solicitudId = parseInt(req.params.id);
  try {
    const [sol] = await db.query(
      "SELECT * FROM solicitudes WHERE id = ? AND profesor_id = ? AND estado = 'enviada'",
      [solicitudId, req.usuarioId]
    );
    if (sol.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada o ya procesada' });
    }

    await db.query(
      "UPDATE solicitudes SET estado = 'rechazada' WHERE id = ?",
      [solicitudId]
    );

    await db.query(
      `INSERT INTO notificaciones (usuario_id, tipo, titulo, cuerpo)
       VALUES (?, 'solicitud_rechazada', 'Solicitud no disponible',
               'El profesor no pudo aceptar tu solicitud en ese horario. Prueba con otro.')`,
      [sol[0].estudiante_id]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error('[solicitudes rechazar]', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─────────────────────────────────────────────────────────────
//  GET /api/tutorias
//  Todas las tutorías del usuario autenticado.
// ─────────────────────────────────────────────────────────────
router.get('/tutorias', auth(), async (req, res) => {
  const esProfesor = req.rol === 'profesor';
  const filtro     = esProfesor ? 't.profesor_id' : 't.estudiante_id';

  try {
    const [rows] = await db.query(
      `SELECT
         t.*,
         u_est.nombre   AS estudiante_nombre,
         u_est.foto_url AS estudiante_foto,
         u_prof.nombre  AS profesor_nombre,
         u_prof.foto_url AS profesor_foto,
         m.nombre AS materia
       FROM tutorias t
       JOIN usuarios u_est  ON u_est.id  = t.estudiante_id
       JOIN usuarios u_prof ON u_prof.id = t.profesor_id
       LEFT JOIN materias m ON m.id = t.materia_id
       WHERE ${filtro} = ?
       ORDER BY t.fecha DESC, t.hora_inicio DESC`,
      [req.usuarioId]
    );
    return res.json({ tutorias: rows });
  } catch (err) {
    console.error('[tutorias GET]', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─────────────────────────────────────────────────────────────
//  GET /api/tutorias/hoy
//  Solo para el profesor — sesiones confirmadas del día de hoy.
// ─────────────────────────────────────────────────────────────
router.get('/tutorias/hoy', auth('profesor'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         t.id,
         t.hora_inicio,
         t.duracion_min,
         t.modalidad,
         t.precio_cop,
         t.estado,
         u.nombre   AS estudiante_nombre,
         u.foto_url AS estudiante_foto,
         m.nombre   AS materia
       FROM tutorias t
       JOIN usuarios u ON u.id = t.estudiante_id
       LEFT JOIN materias m ON m.id = t.materia_id
       WHERE t.profesor_id = ?
         AND t.fecha = CURDATE()
         AND t.estado IN ('confirmada', 'en_curso')
       ORDER BY t.hora_inicio`,
      [req.usuarioId]
    );
    return res.json({ sesiones: rows });
  } catch (err) {
    console.error('[tutorias hoy]', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
