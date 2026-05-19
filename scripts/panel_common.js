/* panel_common.js — funciones compartidas de todos los paneles */

/* ── Helper: leer token ── */
function getToken() { return localStorage.getItem('mt_token'); }

/* ── Helper: leer usuario cacheado ── */
function getUser() {
  try { return JSON.parse(localStorage.getItem('mt_user') || 'null'); } catch(e) { return null; }
}

/* ── Cerrar sesión ── */
function cerrarSesion() {
  localStorage.removeItem('mt_token');
  localStorage.removeItem('mt_user');
  localStorage.removeItem('mt_favoritos');
  localStorage.removeItem('mt_last_role');
  sessionStorage.clear();
  window.location.href = 'login.html';
}

function logout() { cerrarSesion(); }

/* ── Verificar que el usuario está autenticado y tiene el rol correcto ── */
function verificarSesion(rolEsperado) {
  var user  = getUser();
  var token = getToken();
  if (!user || !token) { window.location.href = 'login.html'; return null; }
  if (rolEsperado && user.rol !== rolEsperado) {
    window.location.href = user.rol === 'profesor'
      ? 'panel_profesor.html'
      : 'panel_estudiante.html';
    return null;
  }
  return user;
}

/* ── Sincronizar datos frescos del usuario desde el servidor ── */
async function sincronizarUsuario() {
  var token = getToken();
  if (!token) return null;
  try {
    var res = await fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!res.ok) { cerrarSesion(); return null; }
    var data = await res.json();
    localStorage.setItem('mt_user', JSON.stringify(data.usuario));
    return data.usuario;
  } catch(e) {
    return getUser();
  }
}

/* ── Generar avatar gris con inicial cuando no hay foto ── */
function _setearAvatar(usuario) {
  var wrappers = document.querySelectorAll('.user-avatar');
  wrappers.forEach(function (wrap) {
    var inicial = usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : '?';

    if (usuario.foto_url) {
      /* Tiene foto — mostrar imagen */
      wrap.innerHTML = '<img id="headerAvatar" src="' + usuario.foto_url + '" alt="' + usuario.nombre + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
    } else {
      /* Sin foto — avatar gris con inicial */
      wrap.innerHTML = '';
      wrap.style.background = '#9ca3af';
      wrap.style.display    = 'flex';
      wrap.style.alignItems = 'center';
      wrap.style.justifyContent = 'center';
      wrap.style.color      = '#fff';
      wrap.style.fontWeight = '700';
      wrap.style.fontSize   = '1rem';
      wrap.textContent      = inicial;
    }
  });
}

/* ── Aplicar datos del usuario a la UI ── */
function aplicarUsuarioUI(usuario) {
  if (!usuario) return;

  /* Nombre en el header */
  var userNameEl = document.getElementById('userName');
  if (userNameEl) userNameEl.textContent = usuario.nombre;

  /* Saludo dinámico */
  var heroGreeting = document.getElementById('heroBuenos') || document.getElementById('heroGreeting');
  if (heroGreeting) {
    var h      = new Date().getHours();
    var saludo = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
    heroGreeting.textContent = saludo + ', ' + usuario.nombre.split(' ')[0] + '!';
  }

  /* Avatar en el header */
  _setearAvatar(usuario);

  /* Foto en configuración */
  var fotoPreview = document.getElementById('fotoPreview');
  var fotoInicial = document.getElementById('fotoInicial');
  if (fotoPreview) {
    if (usuario.foto_url) {
      fotoPreview.src = usuario.foto_url;
      fotoPreview.style.display = 'block';
      if (fotoInicial) fotoInicial.style.display = 'none';
    } else {
      fotoPreview.src = '';
      fotoPreview.style.display = 'none';
      if (fotoInicial) {
        fotoInicial.style.display = 'flex';
        fotoInicial.textContent   = usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : '?';
      }
    }
  }
}

/* ═══════════════════════════════════════════════
   INICIALIZACIÓN
   ═══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async function () {

  /* Aplicar datos cacheados de inmediato */
  var userCache = getUser();
  if (userCache) aplicarUsuarioUI(userCache);

  /* Sincronizar con el servidor */
  var userFresco = await sincronizarUsuario();
  if (userFresco) aplicarUsuarioUI(userFresco);

  /* ── Dropdown del usuario ── */
  var userBtn      = document.getElementById('userBtn');
  var dropdownMenu = document.getElementById('dropdownMenu');
  if (userBtn && dropdownMenu) {
    userBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdownMenu.classList.toggle('open');
    });
    document.addEventListener('click', function () { dropdownMenu.classList.remove('open'); });
  }

  /* ── Menú hamburger móvil ── */
  var hamburger = document.getElementById('hamburgerBtn');
  var sidebar   = document.querySelector('.sidebar');
  var overlay   = document.getElementById('sidebarOverlay');
  if (hamburger && sidebar) {
    hamburger.addEventListener('click', function () {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('show');
    });
    if (overlay) {
      overlay.addEventListener('click', function () {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
      });
    }

    /* Cerrar menú al deslizar (swipe left) */
    var touchStartX = null;
    sidebar.addEventListener('touchstart', function(e) {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    sidebar.addEventListener('touchend', function(e) {
      if (touchStartX === null) return;
      var dx = e.changedTouches[0].clientX - touchStartX;
      if (dx < -50) { /* swipe izquierda > 50px → cerrar */
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('show');
      }
      touchStartX = null;
    }, { passive: true });
    /* También cerrar al hacer tap en cualquier nav-item en móvil */
    sidebar.querySelectorAll('.nav-item').forEach(function(item) {
      item.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('open');
          if (overlay) overlay.classList.remove('show');
        }
      });
    });
  }

  /* ── Botón cerrar sesión ── */
  var btnLogout = document.getElementById('btnLogout');
  if (btnLogout) btnLogout.addEventListener('click', cerrarSesion);

  /* ── Tabs de configuración ── */
  document.querySelectorAll('.cfg-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.cfg-tab').forEach(function(t){ t.classList.remove('active'); });
      document.querySelectorAll('.cfg-section').forEach(function(s){ s.classList.remove('active'); });
      tab.classList.add('active');
      var sec = document.getElementById('section-' + tab.dataset.section);
      if (sec) sec.classList.add('active');
    });
  });

  /* ── Calendario compartido ── */
  renderCalendar();
});

/* ══════════════════════════════════════════════
   MINI-CALENDARIO COMPARTIDO
   Renderiza el mes actual en #calDays y #calMonth.
   Marca el día de hoy. Navega con los botones ‹ ›.
   ══════════════════════════════════════════════ */
(function () {
  var MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  var hoy  = new Date();
  var año  = hoy.getFullYear();
  var mes  = hoy.getMonth(); // 0-11

  function renderCalendar() {
    var calDays  = document.getElementById('calDays');
    var calMonth = document.getElementById('calMonth');
    if (!calDays || !calMonth) return;

    calMonth.textContent = MESES[mes] + ' ' + año;
    calDays.innerHTML    = '';

    /* Primer día del mes (0=dom … 6=sáb); ajustamos a lunes-primero */
    var primerDia = new Date(año, mes, 1).getDay();
    primerDia = (primerDia === 0) ? 6 : primerDia - 1; // lun=0 … dom=6

    var diasEnMes = new Date(año, mes + 1, 0).getDate();

    /* Celdas vacías antes del día 1 */
    for (var i = 0; i < primerDia; i++) {
      var vacio = document.createElement('div');
      vacio.className = 'cal-day-empty';
      calDays.appendChild(vacio);
    }

    /* Días del mes */
    for (var d = 1; d <= diasEnMes; d++) {
      var celda = document.createElement('div');
      celda.className = 'cal-day';
      celda.textContent = d;

      var esHoy = (año === hoy.getFullYear() &&
                   mes  === hoy.getMonth()    &&
                   d    === hoy.getDate());
      if (esHoy) celda.classList.add('cal-today');

      calDays.appendChild(celda);
    }

    /* Vincular botones de navegación */
    var btns = document.querySelectorAll('.cal-nav-btn');
    if (btns[0]) btns[0].onclick = function () { cambiarMes(-1); };
    if (btns[1]) btns[1].onclick = function () { cambiarMes( 1); };
  }

  function cambiarMes(delta) {
    mes += delta;
    if (mes < 0)  { mes = 11; año--; }
    if (mes > 11) { mes =  0; año++; }
    renderCalendar();
  }

  /* Exponemos la función para que panel_common la llame */
  window.renderCalendar = renderCalendar;
})();
