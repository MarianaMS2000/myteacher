/* =============================================
   panel_common.js — Funciones compartidas que
   usan todas las páginas del panel
   ============================================= */

/* Esta función se ejecuta cuando la página termina de cargarse */
document.addEventListener('DOMContentLoaded', function () {

  /* ── NOMBRE DEL USUARIO ──
     Busca si hay un usuario guardado en el navegador
     y actualiza el nombre que se ve en el header */
  var stored = JSON.parse(localStorage.getItem('mt_user') || '{}');
  var userNameEl = document.getElementById('userName');
  if (userNameEl && stored.nombre) {
    userNameEl.textContent = stored.nombre;
  }

  /* ── SALUDO DINÁMICO ──
     Cambia el saludo según la hora del día */
  var heroGreeting = document.getElementById('heroBuenos') || document.getElementById('heroGreeting');
  if (heroGreeting && stored.nombre) {
    var h = new Date().getHours();
    var greeting = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
    heroGreeting.textContent = greeting + ', ' + stored.nombre.split(' ')[0] + '!';
  }

  /* ── DROPDOWN DEL USUARIO ──
     Al hacer click en el nombre/foto del usuario
     aparece o desaparece el menú desplegable */
  var userBtn = document.getElementById('userBtn');
  var dropdownMenu = document.getElementById('dropdownMenu');
  if (userBtn && dropdownMenu) {
    userBtn.addEventListener('click', function (e) {
      e.stopPropagation(); /* Evita que el click se propague y cierre el menú */
      dropdownMenu.classList.toggle('open');
    });
    /* Al hacer click en cualquier otra parte, el menú se cierra */
    document.addEventListener('click', function () {
      dropdownMenu.classList.remove('open');
    });
  }

  /* ── MENÚ HAMBURGER (MÓVIL) ──
     En pantallas pequeñas, el botón hamburger abre/cierra el sidebar */
  var hamburger = document.getElementById('hamburgerBtn');
  var sidebar = document.querySelector('.sidebar');
  var overlay = document.getElementById('sidebarOverlay');

  if (hamburger && sidebar) {
    hamburger.addEventListener('click', function () {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('visible');
    });

    /* Al hacer click en el fondo oscuro, el sidebar se cierra */
    if (overlay) {
      overlay.addEventListener('click', function () {
        sidebar.classList.remove('open');
        overlay.classList.remove('visible');
      });
    }

    /* Al seleccionar un item del sidebar en móvil, el sidebar se cierra */
    document.querySelectorAll('.nav-item').forEach(function (item) {
      item.addEventListener('click', function () {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('visible');
      });
    });
  }

  /* ── MARCAR ITEM ACTIVO EN EL NAV ──
     Resalta el item del sidebar según la página actual */
  var navItems = document.querySelectorAll('.nav-item[data-page]');
  var currentPage = document.body.dataset.page;
  navItems.forEach(function (item) {
    if (item.dataset.page === currentPage) {
      item.classList.add('active');
    }
    /* Al hacer click en un item, lo marca como activo */
    item.addEventListener('click', function () {
      navItems.forEach(function (n) { n.classList.remove('active'); });
      item.classList.add('active');
    });
  });

  /* ── CALENDARIO ──
     Dibuja el calendario del mes actual en el panel derecho */
  var calGrid = document.getElementById('calDays');
  if (calGrid) {
    renderCalendar(calGrid);
  }
});

/* Función que construye el calendario del mes */
function renderCalendar(grid) {
  var today = new Date();
  var year = today.getFullYear();
  var month = today.getMonth();

  /* Actualizamos el título del mes */
  var monthEl = document.getElementById('calMonth');
  var monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  if (monthEl) {
    monthEl.textContent = monthNames[month] + ' ' + year;
  }

  /* Calculamos en qué día de la semana cae el primer día del mes */
  var firstDay = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month + 1, 0).getDate();

  grid.innerHTML = ''; /* Limpiamos el grid antes de dibujarlo */

  /* Ajustamos para que la semana empiece en lunes (0=lunes) */
  var offset = firstDay === 0 ? 6 : firstDay - 1;
  for (var i = 0; i < offset; i++) {
    var empty = document.createElement('div');
    empty.className = 'cal-day empty';
    grid.appendChild(empty);
  }

  /* Dibujamos cada día del mes */
  for (var d = 1; d <= daysInMonth; d++) {
    var el = document.createElement('div');
    el.className = 'cal-day';
    el.textContent = d;
    /* El día de hoy se resalta */
    if (d === today.getDate()) el.classList.add('today');
    grid.appendChild(el);
  }
}

/* Función para cerrar sesión - borra los datos guardados del usuario */
function logout() {
  localStorage.removeItem('mt_user');
}
