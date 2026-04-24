/* =============================================
   notifications.js — Sistema de notificaciones
   Datos simulados (mock) y comportamiento
   dinámico del dropdown de la campana
   ============================================= */

/* ── DATOS MOCK ──
   Lista de notificaciones simuladas */
var NOTIF_DATA = [
  {
    id: 1,
    icon: '📅',
    iconClass: 'blue',
    text: '<strong>Tutoría confirmada</strong> con Sergio Ramírez el sábado 26 de abril a las 4:00 PM.',
    time: 'Hace 5 minutos',
    unread: true
  },
  {
    id: 2,
    icon: '⭐',
    iconClass: 'yellow',
    text: '<strong>Nueva reseña</strong>: Alfonso Duarte te dejó 5 estrellas en tu sesión de Cálculo.',
    time: 'Hace 30 minutos',
    unread: true
  },
  {
    id: 3,
    icon: '💬',
    iconClass: 'purple',
    text: '<strong>Mensaje nuevo</strong> de Lucía Martínez: "¿Podemos reagendar para el jueves?"',
    time: 'Hace 1 hora',
    unread: true
  },
  {
    id: 4,
    icon: '🎉',
    iconClass: 'green',
    text: 'Completaste <strong>10 horas de estudio</strong> esta semana. ¡Sigue así!',
    time: 'Hace 2 horas',
    unread: false
  },
  {
    id: 5,
    icon: '🔔',
    iconClass: 'red',
    text: 'Tu próxima tutoría de <strong>Inglés avanzado</strong> comienza en 1 hora.',
    time: 'Hace 3 horas',
    unread: false
  },
  {
    id: 6,
    icon: '👤',
    iconClass: 'blue',
    text: '<strong>Eugenia Paredes</strong> aceptó tu solicitud de tutoría en Física.',
    time: 'Ayer',
    unread: false
  }
];

/* ── INICIALIZACIÓN ──
   Se ejecuta cuando el DOM está listo */
document.addEventListener('DOMContentLoaded', function () {
  var notifBtn = document.querySelector('.notif-btn');
  if (!notifBtn) return; /* No hay campana en esta página */

  /* Construimos el dropdown e insertamos después del botón */
  var wrapper = notifBtn.parentElement;
  if (!wrapper) return;

  /* El botón necesita position:relative para anclar el dropdown */
  

  /* Eliminamos el notif-dot original y lo reemplazamos por badge */
  var oldDot = notifBtn.querySelector('.notif-dot');
  if (oldDot) oldDot.remove();

  /* Creamos el badge contador */
  var badge = document.createElement('span');
  badge.className = 'notif-badge';
  badge.id = 'notifBadge';
  notifBtn.appendChild(badge);

  /* Creamos el dropdown */
  var dropdown = buildDropdown();
  wrapper.appendChild(dropdown);

  /* Actualizamos el contador */
  updateBadge(badge);

  /* ── TOGGLE DEL DROPDOWN ── */
  notifBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  /* Cerrar al hacer click fuera */
  document.addEventListener('click', function (e) {
    if (!wrapper.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });

  /* ── MARCAR TODAS COMO LEÍDAS ── */
  var markAllBtn = dropdown.querySelector('.notif-mark-all');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      NOTIF_DATA.forEach(function (n) { n.unread = false; });
      refreshList(dropdown);
      updateBadge(badge);
    });
  }
});

/* ── CONSTRUIR DROPDOWN ── */
function buildDropdown() {
  var dropdown = document.createElement('div');
  dropdown.className = 'notif-dropdown';
  dropdown.id = 'notifDropdown';

  dropdown.innerHTML =
    '<div class="notif-dropdown-header">' +
      '<h4>Notificaciones</h4>' +
      '<button class="notif-mark-all">Marcar todo como leído</button>' +
    '</div>' +
    '<div class="notif-list" id="notifList"></div>' +
    '<div class="notif-dropdown-footer">' +
      '<a href="#">Ver todas las notificaciones</a>' +
    '</div>';

  refreshList(dropdown);
  return dropdown;
}

/* ── RENDERIZAR LISTA DE NOTIFICACIONES ── */
function refreshList(dropdown) {
  var list = dropdown.querySelector('.notif-list');
  list.innerHTML = '';

  if (NOTIF_DATA.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:24px;font-size:.85rem;">Sin notificaciones</p>';
    return;
  }

  NOTIF_DATA.forEach(function (notif) {
    var item = document.createElement('div');
    item.className = 'notif-item' + (notif.unread ? ' unread' : '');
    item.dataset.id = notif.id;

    item.innerHTML =
      '<div class="notif-icon-wrap ' + notif.iconClass + '">' + notif.icon + '</div>' +
      '<div class="notif-body">' +
        '<p>' + notif.text + '</p>' +
        '<time>' + notif.time + '</time>' +
      '</div>' +
      '<div class="notif-unread-dot"></div>';

    /* Al hacer click en una notificación, se marca como leída */
    item.addEventListener('click', function (e) {
      e.stopPropagation();
      notif.unread = false;
      item.classList.remove('unread');
      var dot = item.querySelector('.notif-unread-dot');
      if (dot) dot.style.visibility = 'hidden';
      var badge = document.getElementById('notifBadge');
      if (badge) updateBadge(badge);
    });

    list.appendChild(item);
  });
}

/* ── ACTUALIZAR BADGE CONTADOR ── */
function updateBadge(badge) {
  var unreadCount = NOTIF_DATA.filter(function (n) { return n.unread; }).length;
  if (unreadCount > 0) {
    badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}
