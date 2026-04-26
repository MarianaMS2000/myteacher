/* =============================================
   panel_common.js — Funciones compartidas que
   usan todas las páginas del panel.
   ============================================= */

/* ── ESTADO DEL CALENDARIO COMPARTIDO ── */
var calCurrentYear  = new Date().getFullYear();
var calCurrentMonth = new Date().getMonth();

document.addEventListener('DOMContentLoaded', function () {

  /* ── NOMBRE DEL USUARIO ── */
  var stored = JSON.parse(localStorage.getItem('mt_user') || '{}');
  var userNameEl = document.getElementById('userName');
  if (userNameEl && stored.nombre) userNameEl.textContent = stored.nombre;

  /* ── SALUDO DINÁMICO ── */
  var heroGreeting = document.getElementById('heroBuenos') || document.getElementById('heroGreeting');
  if (heroGreeting && stored.nombre) {
    var h = new Date().getHours();
    var greeting = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
    heroGreeting.textContent = greeting + ', ' + stored.nombre.split(' ')[0] + '!';
  }

  /* ── DROPDOWN DEL USUARIO ── */
  var userBtn      = document.getElementById('userBtn');
  var dropdownMenu = document.getElementById('dropdownMenu');
  if (userBtn && dropdownMenu) {
    userBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdownMenu.classList.toggle('open');
    });
    document.addEventListener('click', function () { dropdownMenu.classList.remove('open'); });
  }

  /* ── MENÚ HAMBURGER (MÓVIL) ── */
  var hamburger = document.getElementById('hamburgerBtn');
  var sidebar   = document.querySelector('.sidebar');
  var overlay   = document.getElementById('sidebarOverlay');
  if (hamburger && sidebar) {
    hamburger.addEventListener('click', function () {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('visible');
    });
    if (overlay) {
      overlay.addEventListener('click', function () {
        sidebar.classList.remove('open');
        overlay.classList.remove('visible');
      });
    }
    document.querySelectorAll('.nav-item').forEach(function (item) {
      item.addEventListener('click', function () {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('visible');
      });
    });
  }

  /* ── MARCAR ITEM ACTIVO EN EL NAV ── */
  var navItems    = document.querySelectorAll('.nav-item[data-page]');
  var currentPage = document.body.dataset.page;
  navItems.forEach(function (item) {
    if (item.dataset.page === currentPage) item.classList.add('active');
    item.addEventListener('click', function () {
      navItems.forEach(function (n) { n.classList.remove('active'); });
      item.classList.add('active');
    });
  });

  /* ── CALENDARIO DEL PANEL DERECHO ── */
  var calGrid = document.getElementById('calDays');
  if (calGrid) {
    renderCalendar();
    var calNavBtns = document.querySelectorAll('.cal-nav-btn');
    if (calNavBtns.length >= 2) {
      calNavBtns[0].addEventListener('click', function () {
        calCurrentMonth--;
        if (calCurrentMonth < 0) { calCurrentMonth = 11; calCurrentYear--; }
        renderCalendar();
      });
      calNavBtns[1].addEventListener('click', function () {
        calCurrentMonth++;
        if (calCurrentMonth > 11) { calCurrentMonth = 0; calCurrentYear++; }
        renderCalendar();
      });
    }
  }
});

/* ══════════════════════════════════════════════
   CALENDARIO — renderiza el mini-mes
   con puntos verdes en días con sesiones
   ══════════════════════════════════════════════ */
function renderCalendar() {
  var grid = document.getElementById('calDays');
  if (!grid) return;

  var today      = new Date();
  var year       = calCurrentYear;
  var month      = calCurrentMonth;
  var monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  var monthEl = document.getElementById('calMonth');
  if (monthEl) monthEl.textContent = monthNames[month] + ' ' + year;

  var firstDay    = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var offset      = firstDay === 0 ? 6 : firstDay - 1;

  /* Días con sesiones guardadas (para puntos verdes) */
  var sesionesGuardadas = JSON.parse(localStorage.getItem('mt_sesiones_prof') || '[]');
  var diasConSesion = {};
  sesionesGuardadas.forEach(function (s) {
    if (!s.fecha) return;
    var d = new Date(s.fecha + 'T00:00:00');
    if (d.getFullYear() === year && d.getMonth() === month) {
      diasConSesion[d.getDate()] = true;
    }
  });

  grid.innerHTML = '';

  for (var i = 0; i < offset; i++) {
    var empty = document.createElement('div');
    empty.className = 'cal-day empty';
    grid.appendChild(empty);
  }

  for (var d = 1; d <= daysInMonth; d++) {
    var el = document.createElement('div');
    el.className = 'cal-day';
    var num = document.createElement('span');
    num.textContent = d;
    el.appendChild(num);
    if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      el.classList.add('today');
    }
    if (diasConSesion[d]) {
      var dot = document.createElement('span');
      dot.className = 'cal-session-dot';
      el.appendChild(dot);
    }

    /* Click: si estamos en agenda_profesor, navegar al día directamente;
       si estamos en otro panel, guardar el día y redirigir a agenda */
    (function(dayNum) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', function () {
        var mm = String(month + 1).padStart(2, '0');
        var dd = String(dayNum).padStart(2, '0');
        var fechaStr = year + '-' + mm + '-' + dd;

        if (typeof diaSeleccionado !== 'undefined' && typeof renderSessionsList === 'function') {
          /* Estamos en agenda_profesor — actualizar directamente */
          diaSeleccionado = fechaStr;
          document.querySelectorAll('.week-day-col').forEach(function (c) { c.classList.remove('selected'); });
          document.querySelectorAll('.month-cell').forEach(function (c) { c.classList.remove('mc-selected'); });
          var col = document.querySelector('.week-day-col[data-fecha="' + fechaStr + '"]');
          if (col) col.classList.add('selected');
          renderSessionsList(fechaStr);
          /* Actualizar resalte en mini-cal */
          document.querySelectorAll('.cal-day.cal-selected').forEach(function(c){ c.classList.remove('cal-selected'); });
          el.classList.add('cal-selected');
        } else {
          localStorage.setItem('mt_agenda_dia_sel', fechaStr);
         
        }
      });
    })(d);

    grid.appendChild(el);
  }
}

/* ── CERRAR SESIÓN ── */
function logout() { localStorage.removeItem('mt_user'); }
