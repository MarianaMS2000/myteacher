/* =============================================
   perfil_tutor.js — Carga dinámica del perfil
   del tutor según el parámetro ?id= en la URL.
   Usa tutores_data.js como base de datos.
   ============================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* Obtener ID desde URL: perfil_tutor.html?id=2 */
  var params = new URLSearchParams(window.location.search);
  var tutorId = params.get('id') || '1';

  /* Intentar leer tutor seleccionado desde localStorage */
  var tutor = null;
  try {
    var stored = localStorage.getItem('mt_tutor_seleccionado');
    if (stored) {
      var parsed = JSON.parse(stored);
      if (String(parsed.id) === String(tutorId)) {
        tutor = parsed;
      }
    }
  } catch (e) {}

  /* Fallback: buscar en la DB de tutores */
  if (!tutor) tutor = getTutorById(tutorId);
  if (!tutor) tutor = getTutorById('1');

  cargarPerfilTutor(tutor);
});

function cargarPerfilTutor(tutor) {
  if (!tutor) return;

  var foto = document.getElementById('tutorFoto');
  if (foto) { foto.src = tutor.foto; foto.alt = tutor.nombre; }

  setTexto('tutorRating', tutor.rating);
  setTexto('tutorPrecio', tutor.precio);

  var btnSolicitar = document.getElementById('btnSolicitar');
  if (btnSolicitar) btnSolicitar.href = 'agendar_tutoria.html?tutor=' + tutor.id;

  setTexto('tutorNombre', tutor.nombre);
  setTexto('tutorEspecialidad', tutor.especialidad);
  setTexto('tutorUbicacion', tutor.ubicacion);

  var materiasContainer = document.getElementById('tutorMaterias');
  if (materiasContainer && tutor.materias) {
    materiasContainer.innerHTML = '';
    tutor.materias.forEach(function (m) {
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
  if (estrellasEl) estrellasEl.textContent = generarEstrellas(parseFloat(tutor.ratingPromedio));

  var listaEl = document.getElementById('resenasList');
  if (listaEl && tutor.resenas) {
    listaEl.innerHTML = '';
    tutor.resenas.forEach(function (r) { listaEl.appendChild(crearTarjetaResena(r)); });
  }

  document.title = tutor.nombre + ' — myTeacher';
}

function crearTarjetaResena(r) {
  var item = document.createElement('div');
  item.className = 'resena-item';
  var stars = generarEstrellas(r.estrellas);
  item.innerHTML =
    '<div class="resena-avatar">' +
      '<img src="' + r.foto + '" alt="' + escapeHtml(r.nombre) + '" onerror="this.style.display=\'none\';this.parentNode.style.background=\'#374151\'">' +
    '</div>' +
    '<div class="resena-content">' +
      '<div class="resena-header">' +
        '<div class="resena-nombre">' + escapeHtml(r.nombre) + '</div>' +
        '<div class="resena-meta-right"><span class="resena-stars">' + stars + '</span><span>' + escapeHtml(r.fecha) + '</span></div>' +
      '</div>' +
      '<div class="resena-datos">Materia: <strong>' + escapeHtml(r.materia) + '</strong> &nbsp;·&nbsp; Total sesión: <strong>' + escapeHtml(r.precio) + '</strong></div>' +
      '<p class="resena-texto">' + escapeHtml(r.texto) + '</p>' +
    '</div>';
  return item;
}

function generarEstrellas(rating) {
  var s = ''; var l = Math.round(rating);
  for (var i = 1; i <= 5; i++) s += i <= l ? '★' : '☆';
  return s;
}

function setTexto(id, texto) {
  var el = document.getElementById(id);
  if (el) el.textContent = texto;
}

function escapeHtml(str) {
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str || '')));
  return d.innerHTML;
}
