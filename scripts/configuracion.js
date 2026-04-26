/* =============================================
   configuracion.js — Lógica del panel de
   configuración (perfil del usuario).
   Misma funcionalidad que perfil_estudiante.js
   ============================================= */

var modoEdicion = false;

document.addEventListener('DOMContentLoaded', function () {

  cargarDatos();

  /* Editar / Guardar */
  var btnEditar = document.getElementById('btnEditar');
  if (btnEditar) {
    btnEditar.addEventListener('click', function () {
      if (!modoEdicion) activarEdicion();
      else guardarCambios();
    });
  }

  /* Subir foto */
  var fotoInput = document.getElementById('fotoInput');
  if (fotoInput) {
    fotoInput.addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file || !file.type.startsWith('image/')) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        var prev = document.getElementById('fotoPreview');
        var inic = document.getElementById('fotoInicial');
        var ha   = document.getElementById('headerAvatar');
        if (prev) { prev.src = ev.target.result; prev.style.display = 'block'; }
        if (inic) inic.style.display = 'none';
        if (ha)   ha.src = ev.target.result;
        try { localStorage.setItem('mt_foto_perfil', ev.target.result); } catch(e){}
      };
      reader.readAsDataURL(file);
    });
  }

  /* Borrar foto */
  var btnBorrar = document.getElementById('btnBorrarFoto');
  if (btnBorrar) {
    btnBorrar.addEventListener('click', function () {
      var prev = document.getElementById('fotoPreview');
      var inic = document.getElementById('fotoInicial');
      if (prev) { prev.src = ''; prev.style.display = 'none'; }
      if (inic) inic.style.display = 'flex';
      try { localStorage.removeItem('mt_foto_perfil'); } catch(e){}
      var fi = document.getElementById('fotoInput');
      if (fi) fi.value = '';
    });
  }

  /* ── TABS ── */
  document.querySelectorAll('.cfg-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.cfg-tab').forEach(function(t) { t.classList.remove('active'); });
      document.querySelectorAll('.cfg-section').forEach(function(s) { s.classList.remove('active'); });
      tab.classList.add('active');
      var sec = document.getElementById('section-' + tab.dataset.section);
      if (sec) sec.classList.add('active');
    });
  });

  /* ── MODAL ELIMINAR CUENTA ── */
  var btnEl   = document.getElementById('btnEliminarCuenta');
  var modal   = document.getElementById('modalEliminar');
  var btnCan  = document.getElementById('btnCancelarEliminar');
  var btnConf = document.getElementById('btnConfirmarEliminar');

  if (btnEl  && modal) btnEl.addEventListener('click', function () { modal.style.display = 'flex'; });
  if (btnCan && modal) btnCan.addEventListener('click', function () { modal.style.display = 'none'; });
  if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) modal.style.display = 'none'; });
  if (btnConf) {
    btnConf.addEventListener('click', function () {
      try { localStorage.removeItem('mt_user'); localStorage.removeItem('mt_foto_perfil'); } catch(e){}
      window.location.href = 'login.html';
    });
  }
});

/* ── CAMBIAR CONTRASEÑA ── */
function cambiarPassword() {
  var actual    = (document.getElementById('passActual')    || {}).value || '';
  var nueva     = (document.getElementById('passNueva')     || {}).value || '';
  var confirmar = (document.getElementById('passConfirmar') || {}).value || '';

  if (!actual)          { alert('Ingresa tu contraseña actual.'); return; }
  if (nueva.length < 6) { alert('La nueva contraseña debe tener al menos 6 caracteres.'); return; }
  if (nueva !== confirmar) { alert('Las contraseñas no coinciden.'); return; }

  /* Aquí iría la llamada al backend; por ahora simulamos éxito */
  var btn = document.querySelector('#section-cuenta .btn-cfg-save');
  if (btn) {
    var orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> ¡Contraseña actualizada!';
    btn.style.background = '#15803d';
    setTimeout(function() {
      btn.innerHTML = orig;
      btn.style.background = '';
      ['passActual','passNueva','passConfirmar'].forEach(function(id) {
        var el = document.getElementById(id); if (el) el.value = '';
      });
    }, 2000);
  }
}

function cargarDatos() {
  var u = {};
  try { u = JSON.parse(localStorage.getItem('mt_user') || '{}'); } catch(e){}

  var partes = (u.nombre || 'Choi San').split(' ');
  setVal('inputNombre',   partes[0] || 'Choi');
  setVal('inputApellido', partes[1] || 'San');
  setVal('inputEmail',    u.email   || 'sanuwu@gmail.com');
  setVal('inputTelefono', u.telefono || '3333333333');
  setVal('inputFecha',    u.fechaNacimiento || '1999-07-10');
  setTxt('userName',      u.nombre  || 'Choi San');

  var nombre = u.nombre || 'Choi San';
  var iniciales = nombre.split(' ').map(function(p){ return p[0]; }).join('').slice(0,2).toUpperCase();
  var inicEl = document.getElementById('fotoInicial');
  if (inicEl) inicEl.textContent = iniciales;

  var foto = null;
  try { foto = localStorage.getItem('mt_foto_perfil'); } catch(e){}
  if (foto) {
    var prev = document.getElementById('fotoPreview');
    var ha   = document.getElementById('headerAvatar');
    var inic = document.getElementById('fotoInicial');
    if (prev) { prev.src = foto; prev.style.display = 'block'; }
    if (ha)   ha.src = foto;
    if (inic) inic.style.display = 'none';
  }
}

function activarEdicion() {
  modoEdicion = true;
  ['inputNombre','inputApellido','inputTelefono','inputEmail','inputFecha'].forEach(function(id){
    var el = document.getElementById(id); if (el) el.disabled = false;
  });
  var btn = document.getElementById('btnEditar');
  if (btn) { btn.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Guardar'; btn.classList.add('guardando'); }
  ocultarMsg();
}

function guardarCambios() {
  var nombre   = getVal('inputNombre').trim();
  var apellido = getVal('inputApellido').trim();
  var email    = getVal('inputEmail').trim();
  var telefono = getVal('inputTelefono').trim();
  var fecha    = getVal('inputFecha').trim();

  if (!nombre || nombre.length < 2)   return mostrarMsg('El nombre debe tener al menos 2 caracteres.', 'error');
  if (!apellido || apellido.length < 2) return mostrarMsg('El apellido debe tener al menos 2 caracteres.', 'error');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return mostrarMsg('Ingresa un correo válido.', 'error');
  if (!telefono || telefono.length < 7) return mostrarMsg('Ingresa un teléfono válido.', 'error');

  var u = {};
  try { u = JSON.parse(localStorage.getItem('mt_user') || '{}'); } catch(e){}
  u.nombre = nombre + ' ' + apellido;
  u.email = email; u.telefono = telefono; u.fechaNacimiento = fecha;
  try { localStorage.setItem('mt_user', JSON.stringify(u)); } catch(e){}

  setTxt('userName', u.nombre);
  modoEdicion = false;
  ['inputNombre','inputApellido','inputTelefono','inputEmail','inputFecha'].forEach(function(id){
    var el = document.getElementById(id); if (el) el.disabled = true;
  });
  var btn = document.getElementById('btnEditar');
  if (btn) { btn.innerHTML = '<i class="fa-regular fa-pen-to-square"></i> Editar'; btn.classList.remove('guardando'); }
  mostrarMsg('¡Cambios guardados correctamente!', 'exito');
}

function getVal(id) { var e = document.getElementById(id); return e ? e.value : ''; }
function setVal(id, v) { var e = document.getElementById(id); if (e) e.value = v; }
function setTxt(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
function mostrarMsg(txt, tipo) {
  var el = document.getElementById('validacionMsg');
  if (!el) return;
  el.textContent = txt; el.className = 'validacion-msg ' + tipo; el.style.display = 'block';
  if (tipo === 'exito') setTimeout(ocultarMsg, 3000);
}
function ocultarMsg() { var el = document.getElementById('validacionMsg'); if (el) el.style.display = 'none'; }
