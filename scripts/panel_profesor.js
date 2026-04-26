/* =============================================
   panel_profesor.js — Lógica del panel inicio
   del profesor: sesiones de hoy desde
   localStorage, gráfico de ganancias.
   ============================================= */

var LS_SESIONES = 'mt_sesiones_prof';

/* Sesiones de demo para la primera carga */
var SESIONES_DEFAULT = [
  { id: 1,  fecha: getFechaOffset(0), hora: '10:00', duracion: 90, estudiante: 'Carlos Lizarazo',  iniciales: 'CL', color: '#4a7a30', materia: 'Cálculo Diferencial', tipo: 'virtual',    precio: '$35K' },
  { id: 2,  fecha: getFechaOffset(0), hora: '14:30', duracion: 60, estudiante: 'María Suárez',     iniciales: 'MS', color: '#7c3aed', materia: 'Álgebra Lineal',      tipo: 'presencial', precio: '$30K' },
  { id: 3,  fecha: getFechaOffset(0), hora: '17:00', duracion: 90, estudiante: 'Julián Rodríguez', iniciales: 'JR', color: '#db2777', materia: 'Física Mecánica',     tipo: 'pendiente',  precio: '$40K' },
  { id: 4,  fecha: getFechaOffset(1), hora: '09:00', duracion: 60, estudiante: 'Valentina Pérez',  iniciales: 'VP', color: '#059669', materia: 'Cálculo Integral',    tipo: 'virtual',    precio: '$35K' },
  { id: 5,  fecha: getFechaOffset(2), hora: '11:00', duracion: 90, estudiante: 'Felipe Gómez',     iniciales: 'FG', color: '#d97706', materia: 'Estadística',         tipo: 'virtual',    precio: '$30K' },
  { id: 6,  fecha: getFechaOffset(3), hora: '15:00', duracion: 60, estudiante: 'Isabella Torres',  iniciales: 'IT', color: '#7c3aed', materia: 'Álgebra Lineal',      tipo: 'presencial', precio: '$30K' },
  { id: 7,  fecha: getFechaOffset(5), hora: '08:00', duracion: 90, estudiante: 'Santiago López',   iniciales: 'SL', color: '#1d4ed8', materia: 'Cálculo Diferencial', tipo: 'virtual',    precio: '$35K' },
];

function getFechaOffset(n) {
  var d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function cargarSesiones() {
  var stored = localStorage.getItem(LS_SESIONES);
  if (stored) {
    try {
      var parsed = JSON.parse(stored);
      var hoy = new Date(); hoy.setHours(0,0,0,0);
      var limite = new Date(hoy); limite.setDate(hoy.getDate() - 7);
      var limiteStr = limite.toISOString().split('T')[0];
      var todasViejas = parsed.length > 0 && parsed.every(function(s){ return s.fecha < limiteStr; });
      if (!todasViejas) { sincronizarEstudiantesDesdePanel(parsed); return parsed; }
    } catch(e) {}
  }
  localStorage.setItem(LS_SESIONES, JSON.stringify(SESIONES_DEFAULT));
  sincronizarEstudiantesDesdePanel(SESIONES_DEFAULT);
  return SESIONES_DEFAULT.slice();
}

function sincronizarEstudiantesDesdePanel(sesiones) {
  var LS_EST = 'mt_estudiantes_prof';
  var actuales;
  try { actuales = JSON.parse(localStorage.getItem(LS_EST) || '[]'); } catch(e) { actuales = []; }
  sesiones.forEach(function(s) {
    var existe = actuales.some(function(e) { return e.nombre === s.estudiante; });
    if (!existe) {
      actuales.push({
        id:        'demo-' + s.id,
        nombre:    s.estudiante,
        iniciales: s.iniciales,
        color:     s.color,
        materia:   s.materia,
        sesiones:  1,
        horas:     (s.duracion || 60) / 60,
        estado:    'activo',
        proxima:   s.fecha + ' · ' + s.hora
      });
    }
  });
  localStorage.setItem(LS_EST, JSON.stringify(actuales));
}

document.addEventListener('DOMContentLoaded', function () {

  /* ── NOMBRE EN TARJETA DE PERFIL ── */
  var stored = JSON.parse(localStorage.getItem('mt_user') || '{}');
  var profileNameEl = document.getElementById('profileName');
  if (profileNameEl && stored.nombre) profileNameEl.textContent = stored.nombre;

  /* ── SESIONES DE HOY (desde localStorage) ── */
  renderSesionesHoy();

  /* ── GRÁFICO DE BARRAS ── */
  var chartBars = document.getElementById('chartBars');
  if (chartBars) {
    var data = [55, 80, 70, 95];
    data.forEach(function (pct, i) {
      var wrap = document.createElement('div');
      wrap.className = 'chart-bar-wrap';
      var bar = document.createElement('div');
      bar.className = 'chart-bar' + (i === 3 ? ' active' : '');
      bar.style.height = pct + '%';
      wrap.appendChild(bar);
      chartBars.appendChild(wrap);
    });
  }
});

/* ══════════════════════════════════════════════
   SESIONES DE HOY — renderiza desde localStorage
   ══════════════════════════════════════════════ */
function renderSesionesHoy() {
  var container = document.getElementById('sessionsList');
  if (!container) return;

  var sesiones = cargarSesiones();
  var hoy = new Date().toISOString().split('T')[0];
  var hoy_sesiones = sesiones
    .filter(function (s) { return s.fecha === hoy; })
    .sort(function (a, b) { return a.hora.localeCompare(b.hora); });

  container.innerHTML = '';

  if (hoy_sesiones.length === 0) {
    container.innerHTML =
      '<div style="text-align:center;padding:24px;color:var(--muted);font-size:.85rem;">' +
      '📅 No tienes sesiones programadas para hoy.<br>' +
      '<a href="nueva_sesion_profesor.html" style="color:var(--green);font-weight:700;text-decoration:none;margin-top:8px;display:inline-block;">+ Crear sesión</a>' +
      '</div>';
    return;
  }

  hoy_sesiones.forEach(function (s) {
    var badgeClass = s.tipo === 'virtual' ? 'badge-virtual' : s.tipo === 'presencial' ? 'badge-presencial' : 'badge-pending';
    var badgeLabel = s.tipo === 'virtual' ? 'Virtual' : s.tipo === 'presencial' ? 'Presencial' : 'Por confirmar';
    var hora12     = formatHora12(s.hora);

    var card = document.createElement('div');
    card.className = 'session-card';
    card.innerHTML =
      '<div class="session-avatar" style="background:' + s.color + ';">' + s.iniciales + '</div>' +
      '<div class="session-info">' +
        '<div class="session-name">' + escapeHtml(s.estudiante) + '</div>' +
        '<div class="session-meta">' + escapeHtml(s.materia) + ' · ' + s.duracion + ' min</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">' +
        '<span class="session-badge ' + badgeClass + '">' + badgeLabel + '</span>' +
        '<div class="session-time">' + hora12 + '</div>' +
        '<div class="session-price">' + s.precio + '</div>' +
      '</div>';
    container.appendChild(card);
  });
}

/* ── UTILIDADES ── */
function formatHora12(hora24) {
  if (!hora24) return '';
  var parts = hora24.split(':');
  var h = parseInt(parts[0]);
  var m = parts[1] || '00';
  var ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + m + ' ' + ampm;
}

function escapeHtml(str) {
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}

/* ══════════════════════════════════════════════
   MINI-CALENDARIO DEL PANEL PROFESOR
   Al hacer clic en un día navega a agenda_profesor
   con el día seleccionado via localStorage
   ══════════════════════════════════════════════ */

var calOffset = 0; /* offset de mes */

function renderMiniCalendario() {
  var hoy = new Date();
  var mesDate = new Date(hoy.getFullYear(), hoy.getMonth() + calOffset, 1);
  var year = mesDate.getFullYear();
  var month = mesDate.getMonth();

  var MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var calMonthEl = document.getElementById('calMonth');
  if (calMonthEl) calMonthEl.textContent = MESES[month] + ' ' + year;

  var calDays = document.getElementById('calDays');
  if (!calDays) return;
  calDays.innerHTML = '';

  var firstDay = new Date(year, month, 1).getDay();
  var offset = firstDay === 0 ? 6 : firstDay - 1;
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var todayStr = new Date().toISOString().split('T')[0];
  var sesiones = cargarSesiones();

  /* Celdas vacías */
  for (var i = 0; i < offset; i++) {
    var empty = document.createElement('div');
    empty.className = 'cal-day-empty';
    calDays.appendChild(empty);
  }

  for (var d = 1; d <= daysInMonth; d++) {
    var cellDate = new Date(year, month, d);
    var fechaStr = cellDate.toISOString().split('T')[0];
    var isToday = fechaStr === todayStr;
    var hasSesion = sesiones.some(function(s){ return s.fecha === fechaStr; });

    var cell = document.createElement('div');
    cell.className = 'cal-day' + (isToday ? ' cal-today' : '');
    cell.dataset.fecha = fechaStr;
    cell.innerHTML = '<span>' + d + '</span>' + (hasSesion ? '<div class="cal-dot"></div>' : '');

    cell.addEventListener('click', function() {
      var f = this.dataset.fecha;
      localStorage.setItem('mt_agenda_dia_sel', f);
      window.location.href = 'agenda_profesor.html';
    });

    calDays.appendChild(cell);
  }
}

/* Redirige los mensajes del panel inicio al estudiante correcto */
function iniciarMensajesPanel() {
  /* Mapa de nombre → id de conversación en mensajes_profesor */
  var convMap = {
    'Valentina Pérez': 1,
    'Felipe Gómez': 2,
    'Isabella Torres': 3
  };

  document.querySelectorAll('.msg-item').forEach(function(item) {
    var nameEl = item.querySelector('.msg-name');
    if (!nameEl) return;
    var nombre = nameEl.textContent.trim();
    item.style.cursor = 'pointer';
    item.addEventListener('click', function() {
      var convId = convMap[nombre] || 1;
      localStorage.setItem('mt_conv_abierta', convId);
      window.location.href = 'mensajes_profesor.html';
    });
  });
}

/* Extender DOMContentLoaded */
document.addEventListener('DOMContentLoaded', function() {
  /* Calendario mini */
  renderMiniCalendario();

  /* Botones nav del calendario */
  var navBtns = document.querySelectorAll('.cal-nav-btn');
  if (navBtns[0]) navBtns[0].addEventListener('click', function() { calOffset--; renderMiniCalendario(); });
  if (navBtns[1]) navBtns[1].addEventListener('click', function() { calOffset++; renderMiniCalendario(); });

  /* Mensajes clickeables */
  iniciarMensajesPanel();
});
