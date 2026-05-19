// ============================================================
//  backend/favoritos.js
//  Gestión de profesores favoritos guardados por el estudiante.
//
//  Rutas que expone:
//    GET    /api/favoritos          → lista todos los favoritos del estudiante
//    POST   /api/favoritos/:profId  → agrega un profesor a favoritos
//    DELETE /api/favoritos/:profId  → quita un profesor de favoritos
// ============================================================

const express = require('express');
const db      = require('./db');
const auth    = require('./auth');

const router = express.Router();

// ─────────────────────────────────────────────────────────────
//  GET /api/favoritos
//  Devuelve los profesores que el estudiante ha marcado como favorito,
//  con todos los datos necesarios para renderizar las tarjetas.
// ─────────────────────────────────────────────────────────────
router.get('/', auth('estudiante'), async (req, res) => {
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
         pp.total_resenas,
         c.nombre  AS ciudad,
         f.guardado_en
       FROM favoritos f
       JOIN usuarios          u  ON u.id         = f.profesor_id
       JOIN perfiles_profesor pp ON pp.usuario_id = f.profesor_id
       LEFT JOIN ciudades     c  ON c.id          = pp.ciudad_id
       WHERE f.estudiante_id = ?
       ORDER BY f.guardado_en DESC`,
      [req.usuarioId]
    );
    return res.json({ favoritos: rows });
  } catch (err) {
    console.error('[favoritos GET]', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─────────────────────────────────────────────────────────────
//  POST /api/favoritos/:profId
//  Agrega un profesor a favoritos.
//  INSERT IGNORE evita error si el favorito ya existe.
// ─────────────────────────────────────────────────────────────
router.post('/:profId', auth('estudiante'), async (req, res) => {
  const profId = parseInt(req.params.profId);
  if (!profId) return res.status(422).json({ error: 'ID de profesor inválido' });

  try {
    const [check] = await db.query(
      "SELECT id FROM usuarios WHERE id = ? AND rol = 'profesor' AND activo = 1 LIMIT 1",
      [profId]
    );
    if (check.length === 0) {
      return res.status(404).json({ error: 'Profesor no encontrado' });
    }

    await db.query(
      'INSERT IGNORE INTO favoritos (estudiante_id, profesor_id) VALUES (?, ?)',
      [req.usuarioId, profId]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error('[favoritos POST]', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─────────────────────────────────────────────────────────────
//  DELETE /api/favoritos/:profId
//  Quita un profesor de favoritos del estudiante.
// ─────────────────────────────────────────────────────────────
router.delete('/:profId', auth('estudiante'), async (req, res) => {
  const profId = parseInt(req.params.profId);
  if (!profId) return res.status(422).json({ error: 'ID de profesor inválido' });

  try {
    await db.query(
      'DELETE FROM favoritos WHERE estudiante_id = ? AND profesor_id = ?',
      [req.usuarioId, profId]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error('[favoritos DELETE]', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;


// ═══════════════════════════════════════════════════════════════
//  CÓDIGO PARA EL FRONTEND — pega esto en myteacher/scripts/favoritos.js
// ═══════════════════════════════════════════════════════════════

/*
function getToken() {
  return localStorage.getItem('mt_token');
}

async function renderizarFavoritos() {
  var grid  = document.getElementById('tutoresFavGrid');
  var vacio = document.getElementById('favVacio');
  if (!grid) return;

  try {
    var res  = await fetch('/api/favoritos', {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    });
    var data = await res.json();
    var lista = data.favoritos || [];

    if (lista.length === 0) {
      grid.style.display = 'none';
      if (vacio) vacio.style.display = 'block';
      return;
    }

    grid.style.display = '';
    if (vacio) vacio.style.display = 'none';
    grid.innerHTML = '';

    lista.forEach(function (tutor, index) {
      var card = crearTarjetaFavorito(tutor);
      card.style.opacity = '0';
      card.style.transform = 'translateY(12px)';
      grid.appendChild(card);
      setTimeout(function () {
        card.style.transition = 'opacity 0.3s, transform 0.3s';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 60);
    });

  } catch (err) {
    console.error('Error cargando favoritos:', err);
  }
}

async function quitarFavorito(profId, btn) {
  var card = btn.closest('.tutor-fav-card');
  if (!card) return;
  card.style.transition = 'opacity 0.25s, transform 0.25s';
  card.style.opacity = '0';
  card.style.transform = 'scale(0.9)';
  try {
    await fetch('/api/favoritos/' + profId, {
      method:  'DELETE',
      headers: { 'Authorization': 'Bearer ' + getToken() }
    });
  } catch (err) {
    console.error('Error quitando favorito:', err);
  }
  setTimeout(renderizarFavoritos, 260);
}

async function agregarFavorito(profId) {
  try {
    await fetch('/api/favoritos/' + profId, {
      method:  'POST',
      headers: { 'Authorization': 'Bearer ' + getToken() }
    });
  } catch (err) {
    console.error('Error guardando favorito:', err);
  }
}

document.addEventListener('DOMContentLoaded', renderizarFavoritos);
*/
