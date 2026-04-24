/* =============================================
   favoritos.js — Página de tutores favoritos.
   Carga IDs desde localStorage, obtiene datos
   de tutores_data.js y renderiza las tarjetas.
   Permite quitar favoritos con animación.
   ============================================= */

document.addEventListener('DOMContentLoaded', function () {
  renderizarFavoritos();
});

/**
 * Lee los IDs de favoritos desde localStorage
 * y renderiza cada tarjeta de tutor.
 */
function renderizarFavoritos() {
  var grid  = document.getElementById('tutoresFavGrid');
  var vacio = document.getElementById('favVacio');
  if (!grid) return;

  var ids = [];
  try { ids = JSON.parse(localStorage.getItem('mt_favoritos') || '[]'); } catch (e) {}

  /* Sin favoritos: mostrar estado vacío */
  if (!ids || ids.length === 0) {
    grid.style.display = 'none';
    if (vacio) vacio.style.display = 'block';
    return;
  }

  grid.style.display = '';
  if (vacio) vacio.style.display = 'none';
  grid.innerHTML = '';

  /* Crear tarjeta por cada favorito */
  ids.forEach(function (id, index) {
    var tutor = getTutorById(String(id));
    if (!tutor) return;
    var card = crearTarjetaFavorito(tutor);
    /* Animación escalonada de entrada */
    card.style.opacity = '0';
    card.style.transform = 'translateY(12px)';
    grid.appendChild(card);
    setTimeout(function () {
      card.style.transition = 'opacity 0.3s, transform 0.3s';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 60);
  });
}

/**
 * Crea el elemento HTML de una tarjeta de favorito.
 * @param {Object} tutor
 * @returns {HTMLElement}
 */
function crearTarjetaFavorito(tutor) {
  var card = document.createElement('div');
  card.className = 'tutor-fav-card';
  card.dataset.tutorId = tutor.id;

  card.innerHTML =
    /* Botón quitar favorito */
    '<button class="btn-quitar-fav" title="Quitar de favoritos" ' +
      'onclick="quitarFavorito(\'' + tutor.id + '\', this)">' +
      '<i class="fa-solid fa-heart"></i>' +
    '</button>' +

    /* Rating */
    '<div class="tutor-fav-rating">' +
      '<i class="fa-solid fa-star"></i> ' + esc(tutor.rating) +
    '</div>' +

    /* Foto */
    '<div class="tutor-fav-avatar">' +
      '<img src="' + esc(tutor.foto) + '" alt="' + esc(tutor.nombre) + '" ' +
      'onerror="this.style.display=\'none\';this.parentNode.style.background=\'#4a7a30\'">' +
    '</div>' +

    /* Datos */
    '<div class="tutor-fav-nombre">' + esc(tutor.nombre) + '</div>' +
    '<div class="tutor-fav-especialidad">' + esc(tutor.especialidad) + '</div>' +
    '<div class="tutor-fav-ubicacion">' +
      '<i class="fa-solid fa-location-dot"></i> ' + esc(tutor.ubicacion) +
    '</div>' +
    '<div class="tutor-fav-precio">' + esc(tutor.precio) + '</div>' +

    /* Badge modalidad */
    (tutor.modalidad ? '<div class="tutor-fav-modalidad">' +
      (tutor.modalidad === 'virtual' ? '📡 Virtual' :
       tutor.modalidad === 'presencial' ? '📍 Presencial' : '🔄 Híbrida') +
    '</div>' : '') +

    /* Botón perfil */
    '<a href="perfil_tutor.html?id=' + tutor.id + '" class="btn-ver-perfil-fav">Ver perfil</a>';

  return card;
}

/**
 * Quita un tutor de favoritos con animación de salida.
 * @param {string}      id  - ID del tutor
 * @param {HTMLElement} btn - Botón que fue presionado
 */
function quitarFavorito(id, btn) {
  var card = btn.closest('.tutor-fav-card');
  if (!card) return;

  /* Animación de salida */
  card.style.transition = 'opacity 0.25s, transform 0.25s';
  card.style.opacity    = '0';
  card.style.transform  = 'scale(0.9)';

  setTimeout(function () {
    /* Actualizar localStorage */
    var ids = [];
    try { ids = JSON.parse(localStorage.getItem('mt_favoritos') || '[]'); } catch (e) {}
    ids = ids.filter(function (i) { return String(i) !== String(id); });
    try { localStorage.setItem('mt_favoritos', JSON.stringify(ids)); } catch (e) {}
    /* Volver a renderizar todo */
    renderizarFavoritos();
  }, 260);
}

function esc(str) {
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str || '')));
  return d.innerHTML;
}
