/* perfil_tutor.js — Carga dinámica del perfil del tutor */

document.addEventListener('DOMContentLoaded', async function () {
  var params  = new URLSearchParams(window.location.search);
  var tutorId = params.get('id') || params.get('tutor') || '1';

  var tutor = null;

  /* 1. Intentar cargar desde la API real */
  try {
    var res = await fetch('/api/tutores/' + tutorId);
    if (res.ok) {
      var data = await res.json();
      var raw = data.tutor || data;
      if (raw && raw.id) {
        tutor = {
          id:           String(raw.id),
          nombre:       raw.nombre || '',
          foto:         raw.foto_url || '',
          especialidad: raw.especialidad || '',
          ubicacion:    (raw.ciudad || 'Colombia'),
          precio:       raw.precio_min_cop
                          ? Math.round(raw.precio_min_cop/1000)+'k - '+Math.round((raw.precio_max_cop||raw.precio_min_cop*2)/1000)+'k COP'
                          : '15k - 50k COP',
          materias:     Array.isArray(raw.materias)
                          ? raw.materias
                          : (raw.materias ? raw.materias.split(',').map(function(m){ return m.trim(); }) : []),
          /* Soportar tanto el nombre alias (anos_experiencia) como el original (experiencia_años) */
          experiencia:  (raw.anos_experiencia || raw['experiencia_años'] || raw.experiencia_años)
                          ? (raw.anos_experiencia || raw['experiencia_años'] || raw.experiencia_años) + ' años enseñando'
                          : '',
          nivel:        raw.nivel || raw.nivel_educativo || 'Todos los niveles',
          email:        raw.email || '',
          telefono:     raw.telefono || '',
          descripcion:  raw.descripcion || '',
          rating:       raw.rating_promedio ? parseFloat(raw.rating_promedio).toFixed(1) : '5.0',
          ratingPromedio: raw.rating_promedio ? parseFloat(raw.rating_promedio).toFixed(1) : '5.0',
          totalResenas: raw.total_resenas || 0,
          verificado:   !!raw.verificado,
          modalidad:    raw.modalidad || 'virtual',
          resenas:      raw.resenas || []
        };
      }
    }
  } catch(e) {}

  /* 2. Fallback: TUTORES_DB local */
  if (!tutor && typeof getTutorById === 'function') {
    var local = getTutorById(tutorId);
    if (local) tutor = local;
  }
  if (!tutor && typeof getTutorById === 'function') {
    tutor = getTutorById('1');
  }

  if (!tutor) {
    document.getElementById('tutorNombre') && (document.getElementById('tutorNombre').textContent = 'Tutor no encontrado');
    return;
  }

  cargarPerfilTutor(tutor);

  /* 3. Cargar reseñas reales del backend */
  try {
    var resR = await fetch('/api/tutores/' + tutorId + '/resenas');
    if (resR.ok) {
      var dataR = await resR.json();
      if (dataR.resenas && dataR.resenas.length > 0) {
        var listaEl = document.getElementById('resenasList');
        if (listaEl) {
          listaEl.innerHTML = '';
          dataR.resenas.forEach(function(r) { listaEl.appendChild(crearTarjetaResena(r)); });
        }
      }
    }
  } catch(e) {}
});

function cargarPerfilTutor(tutor) {
  var foto = document.getElementById('tutorFoto');
  if (foto) {
    foto.src = tutor.foto || '';
    foto.alt = tutor.nombre;
    if (!tutor.foto) foto.style.display = 'none';
  }

  setTexto('tutorRating', tutor.rating || tutor.ratingPromedio || '5.0');
  setTexto('tutorPrecio', tutor.precio);

  /* Botón Solicitar tutoría → usa ?id= para que agendar_tutoria.js lo lea bien */
  var btnSolicitar = document.getElementById('btnSolicitar');
  if (btnSolicitar) btnSolicitar.href = 'agendar_tutoria.html?id=' + tutor.id;

  setTexto('tutorNombre', tutor.nombre);
  setTexto('tutorEspecialidad', tutor.especialidad);
  setTexto('tutorUbicacion', tutor.ubicacion);

  var materiasContainer = document.getElementById('tutorMaterias');
  if (materiasContainer && tutor.materias) {
    materiasContainer.innerHTML = '';
    (tutor.materias || []).forEach(function (m) {
      var chip = document.createElement('span');
      chip.className = 'materia-chip';
      chip.textContent = m;
      materiasContainer.appendChild(chip);
    });
  }

  setTexto('tutorExperiencia', tutor.experiencia);
  setTexto('tutorNivel', tutor.nivel);
  setTexto('tutorEmail', tutor.email);
  setTexto('tutorTelefono', tutor.telefono);
  setTexto('tutorDescripcion', tutor.descripcion);
  setTexto('totalResenas', tutor.totalResenas);
  setTexto('ratingPromedio', tutor.ratingPromedio);

  var estrellasEl = document.getElementById('estrellasMostradas');
  if (estrellasEl) estrellasEl.textContent = generarEstrellas(parseFloat(tutor.ratingPromedio || 5));

  var listaEl = document.getElementById('resenasList');
  if (listaEl && tutor.resenas && tutor.resenas.length) {
    listaEl.innerHTML = '';
    tutor.resenas.forEach(function (r) { listaEl.appendChild(crearTarjetaResena(r)); });
  }

  document.title = tutor.nombre + ' — myTeacher';

  /* Botón favorito */
  var btnFav = document.getElementById('btnFavorito');
  if (btnFav) {
    var favs = [];
    try { favs = JSON.parse(localStorage.getItem('mt_favoritos') || '[]'); } catch(e) {}
    var esFav = favs.includes(String(tutor.id));
    actualizarBtnFav(btnFav, esFav);
    btnFav.addEventListener('click', function() { toggleFavoritoPerfil(tutor.id, btnFav); });
  }
}

function toggleFavoritoPerfil(profId, btn) {
  profId = String(profId);
  var favs = [];
  try { favs = JSON.parse(localStorage.getItem('mt_favoritos') || '[]'); } catch(e) {}
  var idx = favs.indexOf(profId);
  var esFav = idx !== -1;
  if (esFav) favs.splice(idx, 1);
  else favs.push(profId);
  try { localStorage.setItem('mt_favoritos', JSON.stringify(favs)); } catch(e) {}
  actualizarBtnFav(btn, !esFav);

  /* Sync con backend */
  var token = typeof getToken === 'function' ? getToken() : null;
  if (token) {
    fetch('/api/favoritos/' + profId, {
      method: esFav ? 'DELETE' : 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    }).catch(function(){});
  }
}

function actualizarBtnFav(btn, esFav) {
  if (!btn) return;
  btn.innerHTML = esFav
    ? '<i class="fas fa-heart" style="color:#e53e3e"></i> Favorito ✓'
    : '<i class="far fa-heart"></i> Guardar favorito';
  btn.classList.toggle('activo', esFav);
}

function crearTarjetaResena(r) {
  var item = document.createElement('div');
  item.className = 'resena-item';
  var stars = generarEstrellas(r.estrellas || r.calificacion || 5);
  var foto  = r.foto || r.estudiante_foto || '';
  var nombre = r.nombre || r.estudiante_nombre || 'Estudiante';
  item.innerHTML =
    '<div class="resena-avatar">' +
      (foto ? '<img src="' + foto + '" alt="' + escapeHtml(nombre) + '" onerror="this.style.display=\'none\'">' : '') +
    '</div>' +
    '<div class="resena-content">' +
      '<div class="resena-header">' +
        '<div class="resena-nombre">' + escapeHtml(nombre) + '</div>' +
        '<div class="resena-meta-right"><span class="resena-stars">' + stars + '</span><span>' + escapeHtml(r.fecha || '') + '</span></div>' +
      '</div>' +
      '<div class="resena-datos">Materia: <strong>' + escapeHtml(r.materia || '') + '</strong>' +
        (r.precio ? ' &nbsp;·&nbsp; Total sesión: <strong>' + escapeHtml(r.precio) + '</strong>' : '') +
      '</div>' +
      '<p class="resena-texto">' + escapeHtml(r.texto || r.comentario || '') + '</p>' +
    '</div>';
  return item;
}

function generarEstrellas(rating) {
  var s = ''; var l = Math.round(rating);
  for (var i = 1; i <= 5; i++) s += i <= l ? '★' : '☆';
  return s;
}
function setTexto(id, texto) { var el = document.getElementById(id); if (el) el.textContent = texto || ''; }
function escapeHtml(str) {
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str || '')));
  return d.innerHTML;
}
