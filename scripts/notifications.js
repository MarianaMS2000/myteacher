/* =============================================
   notifications.js — Sistema de notificaciones
   Datos simulados (mock) y comportamiento
   dinamico del dropdown de la campana
   ============================================= */

/* -- DETECCION DE ROL --
   Determina si la pagina pertenece al profesor o al estudiante */
var _isProfesor = (function () {
  var path = window.location.pathname || '';
  var page = path.split('/').pop() || '';
  var profesorPages = [
    'panel_profesor', 'agenda_profesor', 'configuracion_profesor',
    'estudiantes_profesor', 'solicitudes_profesor', 'nueva_sesion_profesor',
    'mensajes_profesor', 'material_profesor', 'manzanita_profesor'
  ];
  for (var i = 0; i < profesorPages.length; i++) {
    if (page.indexOf(profesorPages[i]) !== -1) return true;
  }
  return false;
}());

/* -- DATOS MOCK PROFESOR -- */
var NOTIF_DATA_PROFESOR = [
  {
    id: 1,
    icon: '\uD83D\uDCE9',
    iconClass: 'blue',
    text: '<strong>Nueva solicitud</strong> de Valentina P\u00e9rez para C\u00e1lculo Integral el viernes 2 de mayo a las 3:00 PM.',
    time: 'Hace 5 minutos',
    unread: true
  },
  {
    id: 2,
    icon: '\u2B50',
    iconClass: 'yellow',
    text: '<strong>Nueva rese\u00f1a</strong>: Carlos Lizarazo te dej\u00f3 5 estrellas \u2014 "El mejor profe que he tenido, explica incre\u00edble".',
    time: 'Hace 40 minutos',
    unread: true
  }
];

/* -- DATOS MOCK ESTUDIANTE -- */
var NOTIF_DATA_ESTUDIANTE = [
  {
    id: 1,
    icon: '\u2705',
    iconClass: 'green',
    text: '<strong>Solicitud aceptada</strong>: El profesor Andr\u00e9s Mart\u00ednez confirm\u00f3 tu tutor\u00eda de F\u00edsica Mec\u00e1nica para el lunes 28 de abril a las 4:00 PM.',
    time: 'Hace 3 minutos',
    unread: true
  },
  {
    id: 2,
    icon: '\u2B50',
    iconClass: 'yellow',
    text: '\u00bfC\u00f3mo te fue con el prof. Hern\u00e1ndez? <strong>Deja tu rese\u00f1a</strong> y ayuda a otros estudiantes a elegir bien.',
    time: 'Ayer',
    unread: false
  },
  {
    id: 3,
    icon: '\uD83D\uDCA1',
    iconClass: 'green',
    text: '<strong>Recomendaci\u00f3n</strong>: Basado en tus materias, la prof. Laura Torres podr\u00eda ser una excelente opci\u00f3n para Estad\u00edstica.',
    time: 'Ayer',
    unread: false
  }
];

/* -- SELECCION DE DATOS SEGUN ROL -- */
var NOTIF_DATA = _isProfesor ? NOTIF_DATA_PROFESOR : NOTIF_DATA_ESTUDIANTE;

/* -- INICIALIZACION --
   Se ejecuta cuando el DOM esta listo */
document.addEventListener('DOMContentLoaded', function () {
  var notifBtn = document.querySelector('.notif-btn');
  if (!notifBtn) return;

  var wrapper = notifBtn.parentElement;
  if (!wrapper) return;

  var oldDot = notifBtn.querySelector('.notif-dot');
  if (oldDot) oldDot.remove();

  var badge = document.createElement('span');
  badge.className = 'notif-badge';
  badge.id = 'notifBadge';
  notifBtn.appendChild(badge);

  var dropdown = buildDropdown();
  wrapper.appendChild(dropdown);

  updateBadge(badge);

  notifBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  document.addEventListener('click', function (e) {
    if (!wrapper.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });

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

/* -- CONSTRUIR DROPDOWN -- */
function buildDropdown() {
  var dropdown = document.createElement('div');
  dropdown.className = 'notif-dropdown';
  dropdown.id = 'notifDropdown';

  dropdown.innerHTML =
    '<div class="notif-dropdown-header">' +
      '<h4>Notificaciones</h4>' +
      '<button class="notif-mark-all">Marcar todo como le\u00eddo</button>' +
    '</div>' +
    '<div class="notif-list" id="notifList"></div>' +
    '<div class="notif-dropdown-footer">' +
      '<a href="#">Ver todas las notificaciones</a>' +
    '</div>';

  refreshList(dropdown);
  return dropdown;
}

/* -- RENDERIZAR LISTA -- */
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

/* -- ACTUALIZAR BADGE -- */
function updateBadge(badge) {
  var unreadCount = NOTIF_DATA.filter(function (n) { return n.unread; }).length;
  if (unreadCount > 0) {
    badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}
