/* =============================================
   configuracion.js — Lógica del panel de
   configuración. Maneja la navegación entre
   secciones y el guardado de preferencias.
   ============================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* ── NAVEGACIÓN ENTRE SECCIONES ──
     Al hacer click en un item del sub-sidebar,
     se muestra la sección correspondiente */
  var navItems = document.querySelectorAll('.config-nav-item');
  var secciones = document.querySelectorAll('.config-seccion');

  navItems.forEach(function (item) {
    item.addEventListener('click', function () {
      var targetId = 'seccion-' + item.dataset.seccion;

      /* Desactivar todos los items y ocultar todas las secciones */
      navItems.forEach(function (n) { n.classList.remove('active'); });
      secciones.forEach(function (s) { s.style.display = 'none'; });

      /* Activar el item clickeado y mostrar su sección */
      item.classList.add('active');
      var targetSection = document.getElementById(targetId);
      if (targetSection) targetSection.style.display = 'block';
    });
  });

  /* ── CARGAR PREFERENCIAS GUARDADAS ── */
  cargarPreferencias();

  /* ── BOTONES GUARDAR ── */
  /* Guardamos al hacer click en cualquier btn-guardar-config */
  document.querySelectorAll('.btn-guardar-config').forEach(function (btn) {
    btn.addEventListener('click', function () {
      guardarPreferencias();
      mostrarToast();
    });
  });

  /* ── SELECCIÓN DE TEMA ── */
  var themeBtns = document.querySelectorAll('.theme-btn');
  themeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      themeBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
  });
});

/**
 * Guarda todas las preferencias de configuración en localStorage.
 */
function guardarPreferencias() {
  var prefs = {};

  /* General */
  prefs.nombreUsuario = getInputVal('configNombreUsuario');
  prefs.email = getInputVal('configEmail');
  prefs.zona = getInputVal('configZona');
  prefs.resumenSemanal = getCheckVal('toggleResumen');

  /* Notificaciones */
  prefs.notifTutorias = getCheckVal('notifTutorias');
  prefs.notifMensajes = getCheckVal('notifMensajes');
  prefs.notifOfertas  = getCheckVal('notifOfertas');
  prefs.notifPush     = getCheckVal('notifPush');
  prefs.notifEmail    = getCheckVal('notifEmail');

  /* Privacidad */
  prefs.privPerfilPublico = getCheckVal('privPerfilPublico');
  prefs.privHistorial     = getCheckVal('privHistorial');
  prefs.privReputacion    = getCheckVal('privReputacion');
  prefs.privDatos         = getCheckVal('privDatos');

  /* Apariencia */
  prefs.fuente     = getInputVal('configFuente');
  prefs.animaciones = getCheckVal('configAnimaciones');
  /* Tema activo */
  var temaActivo = document.querySelector('.theme-btn.active');
  prefs.tema = temaActivo ? temaActivo.dataset.theme : 'light';

  /* Idioma */
  prefs.idioma        = getInputVal('configIdioma');
  prefs.fechaFormato  = getInputVal('configFechaFormato');
  prefs.moneda        = getInputVal('configMoneda');

  /* Accesibilidad */
  prefs.accLector    = getCheckVal('accLector');
  prefs.accContraste = getCheckVal('accContraste');
  prefs.accSubtitulos = getCheckVal('accSubtitulos');

  /* Actualizar también el nombre en los datos del usuario */
  if (prefs.nombreUsuario) {
    try {
      var user = JSON.parse(localStorage.getItem('mt_user') || '{}');
      user.nombre = prefs.nombreUsuario;
      user.email  = prefs.email;
      localStorage.setItem('mt_user', JSON.stringify(user));
    } catch (e) {}
    /* Actualizar nombre visible en el header */
    var userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = prefs.nombreUsuario;
  }

  /* Guardar todas las preferencias */
  try { localStorage.setItem('mt_config', JSON.stringify(prefs)); } catch (e) {}
}

/**
 * Carga las preferencias guardadas y las aplica a los controles.
 */
function cargarPreferencias() {
  var prefs = {};
  try { prefs = JSON.parse(localStorage.getItem('mt_config') || '{}'); } catch (e) {}

  /* Cargar datos del usuario */
  var user = {};
  try { user = JSON.parse(localStorage.getItem('mt_user') || '{}'); } catch (e) {}

  /* General */
  setInputVal('configNombreUsuario', prefs.nombreUsuario || user.nombre || 'Choi san');
  setInputVal('configEmail', prefs.email || user.email || 'choi@email.com');
  setInputVal('configZona', prefs.zona || 'America/Bogota');
  setCheckVal('toggleResumen', prefs.resumenSemanal !== false);

  /* Notificaciones */
  setCheckVal('notifTutorias', prefs.notifTutorias !== false);
  setCheckVal('notifMensajes', prefs.notifMensajes !== false);
  setCheckVal('notifOfertas', prefs.notifOfertas === true);
  setCheckVal('notifPush', prefs.notifPush !== false);
  setCheckVal('notifEmail', prefs.notifEmail !== false);

  /* Privacidad */
  setCheckVal('privPerfilPublico', prefs.privPerfilPublico !== false);
  setCheckVal('privHistorial', prefs.privHistorial !== false);
  setCheckVal('privReputacion', prefs.privReputacion !== false);
  setCheckVal('privDatos', prefs.privDatos === true);

  /* Apariencia */
  setInputVal('configFuente', prefs.fuente || 'medium');
  setCheckVal('configAnimaciones', prefs.animaciones === true);

  /* Restaurar tema activo */
  if (prefs.tema) {
    var themeBtn = document.querySelector('[data-theme="' + prefs.tema + '"]');
    if (themeBtn) {
      document.querySelectorAll('.theme-btn').forEach(function (b) { b.classList.remove('active'); });
      themeBtn.classList.add('active');
    }
  }

  /* Idioma */
  setInputVal('configIdioma', prefs.idioma || 'es');
  setInputVal('configFechaFormato', prefs.fechaFormato || 'dd/mm/yyyy');
  setInputVal('configMoneda', prefs.moneda || 'COP');

  /* Accesibilidad */
  setCheckVal('accLector', prefs.accLector === true);
  setCheckVal('accContraste', prefs.accContraste === true);
  setCheckVal('accSubtitulos', prefs.accSubtitulos !== false);
}

/**
 * Muestra un toast de confirmación que desaparece solo.
 */
function mostrarToast() {
  var toast = document.getElementById('configToast');
  if (!toast) return;
  toast.classList.add('visible');
  setTimeout(function () {
    toast.classList.remove('visible');
  }, 2800);
}

/* ── UTILIDADES ── */

/** Obtiene el valor de un input/select por ID */
function getInputVal(id) {
  var el = document.getElementById(id);
  return el ? el.value : '';
}

/** Obtiene el estado de un checkbox por ID */
function getCheckVal(id) {
  var el = document.getElementById(id);
  return el ? el.checked : false;
}

/** Asigna un valor a un input/select por ID */
function setInputVal(id, valor) {
  var el = document.getElementById(id);
  if (el) el.value = valor;
}

/** Asigna el estado de un checkbox por ID */
function setCheckVal(id, checked) {
  var el = document.getElementById(id);
  if (el) el.checked = checked;
}
