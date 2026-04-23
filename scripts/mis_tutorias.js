/* =============================================
   mis_tutorias.js — Lógica completa de la vista
   "Mis Tutorías": tabs, modales, estrellas, favoritos
   ============================================= */

/* ── VARIABLES GLOBALES ──
   Guardamos el estado actual de la reseña en curso */
var reseñaActual = {
  tutorId: null,    /* ID de la card del historial que se está reseñando */
  estrellas: 0      /* Cantidad de estrellas seleccionada */
};

/* ══════════════════════════════════════════════
   SISTEMA DE TABS
   Muestra y oculta el contenido según la pestaña
   activa al hacer click
   ══════════════════════════════════════════════ */

/**
 * Inicializa el comportamiento de los tabs al cargar la página.
 * Asigna eventos click a cada botón de pestaña.
 */
document.addEventListener('DOMContentLoaded', function () {
  var tabButtons = document.querySelectorAll('.tab-btn');

  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetTab = btn.getAttribute('data-tab');
      activarTab(targetTab);
    });
  });

  /* Inicializamos el sistema de estrellas del modal */
  inicializarEstrellas();
});

/**
 * Activa la pestaña indicada y desactiva las demás.
 * @param {string} tabName - Nombre del tab a activar ('proximos', 'solicitudes', 'historial')
 */
function activarTab(tabName) {
  /* Quitamos la clase active de todos los botones y contenidos */
  document.querySelectorAll('.tab-btn').forEach(function (b) {
    b.classList.remove('active');
  });
  document.querySelectorAll('.tab-content').forEach(function (c) {
    c.classList.remove('active');
  });

  /* Activamos el botón y contenido correspondiente */
  var activeBtn = document.querySelector('[data-tab="' + tabName + '"]');
  var activeContent = document.getElementById('tab-' + tabName);

  if (activeBtn) activeBtn.classList.add('active');
  if (activeContent) activeContent.classList.add('active');
}

/* ══════════════════════════════════════════════
   ACCIONES DE LA TAB "PRÓXIMOS"
   ══════════════════════════════════════════════ */

/**
 * Abre WhatsApp con el número de teléfono del tutor.
 * @param {string} telefono - Número en formato internacional
 */
function openWhatsApp(telefono) {
  var url = 'https://wa.me/' + telefono.replace(/\D/g, '');
  window.open(url, '_blank');
}

/**
 * Abre el link de la sesión virtual (Zoom, Meet, Skype, etc.)
 * @param {string} url - URL de la videollamada
 */
function openLink(url) {
  window.open(url, '_blank');
}

/* ══════════════════════════════════════════════
   ACCIONES DE LA TAB "SOLICITUDES"
   ══════════════════════════════════════════════ */

/**
 * Cancela una solicitud de tutoría.
 * Muestra confirmación antes de eliminar la card.
 * @param {string} cardId - ID del elemento HTML de la card
 */
function cancelarSolicitud(cardId) {
  var confirmado = confirm('¿Deseas cancelar esta solicitud de tutoría?');
  if (!confirmado) return;

  var card = document.getElementById(cardId);
  if (!card) return;

  /* Animamos la desaparición de la card antes de eliminarla */
  card.style.transition = 'opacity 0.3s, transform 0.3s';
  card.style.opacity = '0';
  card.style.transform = 'translateX(-20px)';

  setTimeout(function () {
    card.remove();
    actualizarBadgeSolicitudes();
  }, 300);
}

/**
 * Inicia el flujo de edición de una solicitud rechazada.
 * En este prototipo redirige al formulario de agendado.
 * @param {string} cardId - ID del elemento HTML de la card
 */
function editarSolicitud(cardId) {
  /* Aquí se redigiría al formulario de agendamiento con los datos precargados */
  alert('Redirigiendo al formulario de nueva solicitud...');
  /* window.location.href = 'agendar_tutoria.html?edit=' + cardId; */
}

/**
 * Elimina una card de solicitud rechazada cuando el usuario hace click en X.
 * @param {string} cardId - ID del elemento HTML de la card
 */
function eliminarCard(cardId) {
  var card = document.getElementById(cardId);
  if (!card) return;

  card.style.transition = 'opacity 0.3s, transform 0.3s';
  card.style.opacity = '0';
  card.style.transform = 'scale(0.95)';

  setTimeout(function () {
    card.remove();
    actualizarBadgeSolicitudes();
  }, 300);
}

/**
 * Actualiza el número del badge del tab "Solicitudes"
 * contando las cards que quedan visibles.
 */
function actualizarBadgeSolicitudes() {
  var tabContent = document.getElementById('tab-solicitudes');
  var cardsRestantes = tabContent ? tabContent.querySelectorAll('.tutoria-card').length : 0;
  var badge = document.getElementById('badge-solicitudes');
  if (badge) {
    badge.textContent = cardsRestantes;
    /* Si no quedan solicitudes, ocultamos el badge */
    badge.style.display = cardsRestantes > 0 ? '' : 'none';
  }
}

/* ══════════════════════════════════════════════
   ACCIONES DE LA TAB "HISTORIAL"
   ══════════════════════════════════════════════ */

/**
 * Alterna el estado de favorito de un tutor en el historial.
 * Cambia el estilo visual del botón y guarda en localStorage.
 * @param {string} histId - Identificador de la card del historial (ej: 'hist-1')
 */
function toggleFavorito(histId) {
  var btn = document.getElementById('fav-' + histId);
  if (!btn) return;

  var esFavorito = btn.classList.toggle('active');

  /* Actualizamos el texto del botón */
  if (esFavorito) {
    btn.innerHTML = '<i class="fa-solid fa-heart"></i> Favorito ✓';
  } else {
    btn.innerHTML = '<i class="fa-solid fa-heart"></i> Favorito';
  }

  /* Guardamos el estado en localStorage */
  var favoritos = JSON.parse(localStorage.getItem('mt_favoritos') || '{}');
  favoritos[histId] = esFavorito;
  localStorage.setItem('mt_favoritos', JSON.stringify(favoritos));
}

/* ══════════════════════════════════════════════
   MODAL: CALIFICAR TUTOR
   Sistema de 5 estrellas interactivo + textarea
   ══════════════════════════════════════════════ */

/**
 * Abre el modal de reseña para un tutor específico.
 * Precarga el nombre y la foto del tutor.
 * @param {string} nombre   - Nombre del tutor
 * @param {string} imgSrc   - Ruta de la foto del tutor
 * @param {string} histId   - ID de la card del historial
 */
function abrirModalReseña(nombre, imgSrc, histId) {
  /* Guardamos qué tutoría se está reseñando */
  reseñaActual.tutorId = histId;
  reseñaActual.estrellas = 0;

  /* Actualizamos la info del tutor en el modal */
  document.getElementById('modalTutorNombre').textContent = nombre;
  var modalImg = document.getElementById('modalTutorImg');
  modalImg.src = imgSrc;
  modalImg.alt = nombre;

  /* Limpiamos el estado anterior */
  resetearEstrellas();
  document.getElementById('reviewTextarea').value = '';
  document.getElementById('charCounter').textContent = '0/200';
  document.getElementById('charCounter').classList.remove('warning');
  document.getElementById('btnSubmitReview').disabled = true;

  /* Mostramos el modal */
  document.getElementById('ratingModal').classList.add('open');
}

/**
 * Cierra el modal de reseña sin guardar.
 */
function cerrarModalReseña() {
  document.getElementById('ratingModal').classList.remove('open');
  reseñaActual.tutorId = null;
  reseñaActual.estrellas = 0;
}

/**
 * Inicializa los eventos de hover y click en las estrellas.
 * Al hover ilumina estrellas hasta la posición del cursor.
 * Al click guarda la calificación.
 */
function inicializarEstrellas() {
  var estrellas = document.querySelectorAll('.star-btn');

  estrellas.forEach(function (star, index) {

    /* Al pasar el mouse, ilumina del 1 hasta la estrella actual */
    star.addEventListener('mouseenter', function () {
      iluminarEstrellas(index + 1);
    });

    /* Al salir el mouse, vuelve al valor seleccionado */
    star.addEventListener('mouseleave', function () {
      iluminarEstrellas(reseñaActual.estrellas);
    });

    /* Al hacer click, fija la calificación */
    star.addEventListener('click', function () {
      reseñaActual.estrellas = index + 1;
      iluminarEstrellas(reseñaActual.estrellas);
      /* Habilitamos el botón de envío solo si hay al menos 1 estrella */
      document.getElementById('btnSubmitReview').disabled = false;
    });
  });

  /* Actualizamos el contador de caracteres mientras el usuario escribe */
  var textarea = document.getElementById('reviewTextarea');
  if (textarea) {
    textarea.addEventListener('input', actualizarContadorChar);
  }
}

/**
 * Ilumina las primeras N estrellas del sistema de rating.
 * @param {number} n - Número de estrellas a iluminar (0-5)
 */
function iluminarEstrellas(n) {
  document.querySelectorAll('.star-btn').forEach(function (star, idx) {
    if (idx < n) {
      star.classList.add('lit');
    } else {
      star.classList.remove('lit');
    }
  });
}

/**
 * Resetea todas las estrellas a su estado apagado.
 */
function resetearEstrellas() {
  reseñaActual.estrellas = 0;
  iluminarEstrellas(0);
}

/**
 * Actualiza el contador de caracteres en tiempo real.
 * Cambia a rojo cuando llega al límite.
 */
function actualizarContadorChar() {
  var textarea = document.getElementById('reviewTextarea');
  var counter = document.getElementById('charCounter');
  if (!textarea || !counter) return;

  var len = textarea.value.length;
  counter.textContent = len + '/200';

  /* Advertencia visual cuando el texto es largo */
  if (len >= 180) {
    counter.classList.add('warning');
  } else {
    counter.classList.remove('warning');
  }
}

/**
 * Envía la reseña del tutor:
 * 1. Valida que haya estrellas seleccionadas
 * 2. Guarda la reseña en localStorage
 * 3. Actualiza visualmente la card del historial
 * 4. Muestra el modal de confirmación
 */
function enviarReseña() {
  if (reseñaActual.estrellas === 0) {
    alert('Por favor selecciona al menos una estrella.');
    return;
  }

  var histId = reseñaActual.tutorId;
  var texto = document.getElementById('reviewTextarea').value.trim();

  /* Guardamos la reseña en localStorage */
  var reseñas = JSON.parse(localStorage.getItem('mt_reseñas') || '{}');
  reseñas[histId] = {
    estrellas: reseñaActual.estrellas,
    texto: texto,
    fecha: new Date().toISOString()
  };
  localStorage.setItem('mt_reseñas', JSON.stringify(reseñas));

  /* Actualizamos la card del historial visualmente */
  marcarComoReseñado(histId);

  /* Cerramos el modal de calificación */
  document.getElementById('ratingModal').classList.remove('open');

  /* Mostramos el modal de confirmación con un pequeño delay */
  setTimeout(function () {
    document.getElementById('confirmModal').classList.add('open');
  }, 200);
}

/**
 * Cambia el badge de "Completado" a "Reseñado" y oculta
 * el botón "Dejar reseña" de la card correspondiente.
 * @param {string} histId - ID del historial (ej: 'hist-1')
 */
function marcarComoReseñado(histId) {
  /* Actualizamos el badge de estado */
  var badge = document.getElementById('badge-' + histId);
  if (badge) {
    badge.className = 'badge badge-reseñado';
    badge.innerHTML = '<span class="reseñado-star">⭐</span> Reseñado';
  }

  /* Ocultamos el botón "Dejar reseña" de las acciones */
  var actionsDiv = document.getElementById('actions-' + histId);
  if (actionsDiv) {
    var reviewBtn = actionsDiv.querySelector('.btn-review');
    if (reviewBtn) reviewBtn.remove();
  }
}

/**
 * Cierra el modal de confirmación de reseña.
 */
function cerrarConfirmModal() {
  document.getElementById('confirmModal').classList.remove('open');
  reseñaActual.tutorId = null;
  reseñaActual.estrellas = 0;
}

/* ══════════════════════════════════════════════
   CERRAR MODALES AL HACER CLICK EN EL OVERLAY
   ══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {
  /* Cierra el modal de reseña al hacer click en el fondo oscuro */
  document.getElementById('ratingModal').addEventListener('click', function (e) {
    if (e.target === this) cerrarModalReseña();
  });

  /* Cierra el modal de confirmación al hacer click en el fondo oscuro */
  document.getElementById('confirmModal').addEventListener('click', function (e) {
    if (e.target === this) cerrarConfirmModal();
  });

  /* Restauramos los estados de favoritos guardados */
  restaurarFavoritos();
});

/**
 * Al cargar la página, restaura el estado visual de los
 * botones de favorito según lo guardado en localStorage.
 */
function restaurarFavoritos() {
  var favoritos = JSON.parse(localStorage.getItem('mt_favoritos') || '{}');
  Object.keys(favoritos).forEach(function (histId) {
    if (favoritos[histId]) {
      var btn = document.getElementById('fav-' + histId);
      if (btn && !btn.classList.contains('active')) {
        btn.classList.add('active');
        btn.innerHTML = '<i class="fa-solid fa-heart"></i> Favorito ✓';
      }
    }
  });
}
