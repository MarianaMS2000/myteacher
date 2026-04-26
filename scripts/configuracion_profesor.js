/* ── DATOS DEL ONBOARDING → PERFIL ── */
function cargarDatosOnboarding() {
  var LS_KEY = 'mt_onboarding_prof';
  var datos = null;
  try { datos = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch(e) {}

  /* Precargar los selects */
  function setSelect(id, valor) {
    var el = document.getElementById(id);
    if (!el || !valor) return;
    for (var i = 0; i < el.options.length; i++) {
      if (el.options[i].value === valor) { el.selectedIndex = i; break; }
    }
  }

  if (datos) {
    setSelect('nivelFormacionSelect',  datos.nivelFormacion);
    setSelect('experienciaSelect',     datos.experienciaEnsenando);
    setSelect('modalidadSelect',       datos.modalidadConexion);
    renderBadgesOnboarding(datos);
  }

  /* También actualizar badges si el usuario cambia un select */
  ['nivelFormacionSelect','experienciaSelect','modalidadSelect'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('change', function() {
      var d = leerSelectsOnboarding();
      renderBadgesOnboarding(d);
      /* Guardar cambio en localStorage */
      var stored = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
      localStorage.setItem(LS_KEY, JSON.stringify(Object.assign(stored, d)));
    });
  });
}

function leerSelectsOnboarding() {
  function getVal(id) {
    var el = document.getElementById(id);
    return el && el.value ? el.value : null;
  }
  return {
    nivelFormacion:       getVal('nivelFormacionSelect'),
    experienciaEnsenando: getVal('experienciaSelect'),
    modalidadConexion:    getVal('modalidadSelect')
  };
}

function renderBadgesOnboarding(datos) {
  var cont = document.getElementById('onboardingBadges');
  if (!cont) return;
  cont.innerHTML = '';
  var iconos = { nivelFormacion: '🎓', experienciaEnsenando: '⏳', modalidadConexion: '📡' };
  var claves = ['nivelFormacion','experienciaEnsenando','modalidadConexion'];
  claves.forEach(function(k) {
    if (!datos || !datos[k]) return;
    var badge = document.createElement('span');
    badge.style.cssText = 'background:var(--green-light);color:var(--green);padding:4px 12px;border-radius:20px;font-size:.78rem;font-weight:600;';
    badge.textContent = (iconos[k] || '') + ' ' + datos[k];
    cont.appendChild(badge);
  });
}

/* =============================================
   configuracion_profesor.js — Lógica de la
   página de configuración del profesor.
   Maneja tabs, foto de perfil, materias,
   vista previa y toast de confirmación.
   ============================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* ── CARGAR DATOS DEL ONBOARDING ── */
  cargarDatosOnboarding();

  /* ── CARGAR LINK DE ZOOM PREDETERMINADO ── */
  var zoomInput = document.getElementById('videoLinkInput');
  if (zoomInput) {
    try { zoomInput.value = localStorage.getItem('mt_prof_video_link') || ''; } catch(e) {}
  }
  var waInput = document.getElementById('whatsappLinkInput');
  if (waInput) {
    try { waInput.value = localStorage.getItem('mt_prof_whatsapp_link') || ''; } catch(e) {}
  }

  /* ── TABS DE NAVEGACIÓN ── */
  document.querySelectorAll('.cfg-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var section = tab.dataset.section;
      document.querySelectorAll('.cfg-tab').forEach(function (t) { t.classList.remove('active'); });
      document.querySelectorAll('.cfg-section').forEach(function (s) { s.classList.remove('active'); });
      tab.classList.add('active');
      var sectionEl = document.getElementById('section-' + section);
      if (sectionEl) sectionEl.classList.add('active');
    });
  });

  /* ── VISTA PREVIA: sincronizar nombre ── */
  var nombreInput    = document.getElementById('nombreInput');
  var apellidoInput  = document.getElementById('apellidoInput');
  var cppName        = document.getElementById('cppName');
  var profileName    = document.getElementById('profileDisplayName');

  function actualizarNombre() {
    var nombre   = nombreInput   ? nombreInput.value.trim()   : '';
    var apellido = apellidoInput ? apellidoInput.value.trim() : '';
    var completo = (nombre + ' ' + apellido).trim();
    if (cppName)     cppName.textContent    = completo || 'Tu nombre';
    if (profileName) profileName.textContent = nombre  || 'Tu nombre';
  }
  if (nombreInput)   nombreInput.addEventListener('input', actualizarNombre);
  if (apellidoInput) apellidoInput.addEventListener('input', actualizarNombre);
});

/* ── FOTO DE PERFIL ── */
function previewPhoto(input) {
  if (!input.files || !input.files[0]) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    var img = document.getElementById('profilePhotoImg');
    var initials = document.getElementById('profilePhotoInitials');
    var avatar   = document.querySelector('.cpp-avatar');
    if (img) {
      img.src = e.target.result;
      img.style.display = 'block';
    }
    if (initials) initials.style.display = 'none';
    if (avatar) {
      avatar.innerHTML = '<img src="' + e.target.result + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
    }
  };
  reader.readAsDataURL(input.files[0]);
}

/* ── MATERIAS ── */
function eliminarMateria(btn) {
  if (!confirm('¿Eliminar esta materia de tu perfil?')) return;
  var item = btn.closest('.materia-item');
  if (item) {
    item.style.transition = 'opacity .3s, transform .3s';
    item.style.opacity = '0';
    item.style.transform = 'translateX(20px)';
    setTimeout(function () { item.remove(); }, 300);
  }
}

function agregarMateria() {
  var nombre = prompt('Nombre de la nueva materia:');
  if (!nombre || !nombre.trim()) return;
  var nivel  = prompt('Nivel (ej: Universitario, Bachillerato):', 'Universitario') || 'Universitario';
  var precio = prompt('Precio por sesión (COP):', '35000') || '35000';

  var list = document.getElementById('materiasList');
  if (!list) return;

  var iconos = ['📚','📐','🔬','📊','✏️','🧮','⚗️','🌐'];
  var icono  = iconos[Math.floor(Math.random() * iconos.length)];
  var colores = ['#dbeafe','#dcfce7','#fef3c7','#fce7f3','#ede9fe'];
  var color = colores[Math.floor(Math.random() * colores.length)];

  var precioFmt = '$' + parseInt(precio).toLocaleString('es-CO');

  var item = document.createElement('div');
  item.className = 'materia-item';
  item.style.opacity = '0';
  item.innerHTML =
    '<div class="materia-icon" style="background:' + color + ';">' + icono + '</div>' +
    '<div class="materia-info">' +
      '<div class="materia-name">' + escapeHtml(nombre.trim()) + '</div>' +
      '<div class="materia-nivel">' + escapeHtml(nivel) + ' · ' + precioFmt + '/sesión</div>' +
    '</div>' +
    '<button class="materia-del" onclick="eliminarMateria(this)"><i class="fa-solid fa-trash"></i></button>';
  list.appendChild(item);
  requestAnimationFrame(function () {
    item.style.transition = 'opacity .3s';
    item.style.opacity = '1';
  });
}

/* ── GUARDAR CAMBIOS (toast) ── */
function guardarCambios() {
  /* Guardar link de Zoom predeterminado */
  var zoomInput = document.getElementById('videoLinkInput');
  if (zoomInput) {
    localStorage.setItem('mt_prof_video_link', zoomInput.value.trim());
  }
  var toast = document.getElementById('cfgToast');
  if (!toast) return;
  toast.classList.add('show');
  setTimeout(function () { toast.classList.remove('show'); }, 2800);
}

/* ── COMPARTIR PERFIL ── */
function compartirPerfil() {
  var url = window.location.origin + '/perfil_profesor.html';
  if (navigator.share) {
    navigator.share({ title: 'Mi perfil en myTeacher', url: url });
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(function () {
      guardarCambios();
      var toast = document.getElementById('cfgToast');
      if (toast) toast.querySelector('span') && (toast.innerHTML = '<i class="fa-solid fa-circle-check"></i> ¡Enlace copiado al portapapeles!');
    });
  } else {
    prompt('Copia este enlace:', url);
  }
}

/* ── UTILIDADES ── */
function escapeHtml(str) {
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}
