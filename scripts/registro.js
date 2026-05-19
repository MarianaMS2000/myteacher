/* registro.js — conectado al backend MySQL */

/* ── UI: mostrar / ocultar contraseña ── */
function togglePass(inputId, btn) {
  var input = document.getElementById(inputId);
  var icon  = btn.querySelector('i');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    input.type = 'password';
    if (icon) icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
}

/* ── UI: fotos decorativas según rol ── */
var FOTOS = { estudiante: 'images/student.png', profesor: 'images/teacher.png' };

function cambiarRol(rol) {
  var tabE = document.getElementById('tab-estudiante');
  var tabP = document.getElementById('tab-profesor');
  var tabME = document.getElementById('tab-mobile-estudiante');
  var tabMP = document.getElementById('tab-mobile-profesor');
  var fotoD = document.getElementById('foto-img-desktop');
  var fotoM = document.getElementById('foto-img-mobile');
  var form  = document.getElementById('registro-form');

  if (tabE)  tabE.classList.toggle('active',  rol === 'estudiante');
  if (tabP)  tabP.classList.toggle('active',  rol === 'profesor');
  if (tabME) tabME.classList.toggle('active', rol === 'estudiante');
  if (tabMP) tabMP.classList.toggle('active', rol === 'profesor');

  var src = FOTOS[rol] || FOTOS.estudiante;
  if (fotoD) fotoD.src = src;
  if (fotoM) fotoM.src = src;
  if (form)  form.dataset.destino = (rol === 'profesor') ? 'onboarding' : 'panel_estudiante';
}

function elegirRol(rol) {
  var bienvenida = document.getElementById('step-bienvenida');
  if (bienvenida) bienvenida.style.display = 'none';
  var stepForm = document.getElementById('step-form');
  if (stepForm) stepForm.style.display = 'block';
  cambiarRol(rol);
}

/* ── URL param ?tipo= ── */
var params = new URLSearchParams(window.location.search);
var tipo   = params.get('tipo');
if (tipo === 'profesor' || tipo === 'estudiante') elegirRol(tipo);

/* ── Validación en tiempo real de contraseñas ── */
document.addEventListener('DOMContentLoaded', function () {
  var inputPass  = document.getElementById('input-password');
  var inputPass2 = document.getElementById('input-password2');
  var errorPass  = document.getElementById('error-password');
  var errorPass2 = document.getElementById('error-password2');

  function validarLongitud() {
    if (!inputPass || !inputPass.value) {
      if (inputPass)  inputPass.classList.remove('input-error', 'input-ok');
      if (errorPass)  errorPass.textContent = '';
      return;
    }
    if (inputPass.value.length < 8) {
      inputPass.classList.add('input-error'); inputPass.classList.remove('input-ok');
      if (errorPass) errorPass.textContent = 'Mínimo 8 caracteres';
    } else {
      inputPass.classList.remove('input-error'); inputPass.classList.add('input-ok');
      if (errorPass) errorPass.textContent = '';
    }
    if (inputPass2 && inputPass2.value) validarCoincidencia();
  }

  function validarCoincidencia() {
    if (!inputPass2 || !inputPass2.value) {
      if (inputPass2)  inputPass2.classList.remove('input-error', 'input-ok');
      if (errorPass2)  errorPass2.textContent = '';
      return;
    }
    if (inputPass.value !== inputPass2.value) {
      inputPass2.classList.add('input-error'); inputPass2.classList.remove('input-ok');
      if (errorPass2) errorPass2.textContent = 'Las contraseñas no coinciden';
    } else {
      inputPass2.classList.remove('input-error'); inputPass2.classList.add('input-ok');
      if (errorPass2) errorPass2.textContent = '';
    }
  }

  if (inputPass)  inputPass.addEventListener('input',  validarLongitud);
  if (inputPass2) inputPass2.addEventListener('input', validarCoincidencia);
});

/* ── Submit del formulario → llama al backend ── */
var regForm = document.getElementById('registro-form');
if (regForm) {
  regForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    var form     = e.target;
    var nombre   = form.nombre.value.trim();
    var email    = form.email.value.trim();
    var password = form.password.value;
    var password2= form.password2.value;
    var errEl    = document.getElementById('errorGeneral');

    /* Detectar rol activo */
    var tabEst = document.getElementById('tab-estudiante');
    var rol    = (tabEst && tabEst.classList.contains('active')) ? 'estudiante' : 'profesor';

    /* Validaciones de UI */
    if (!nombre || !email) {
      form.classList.add('shake');
      setTimeout(function () { form.classList.remove('shake'); }, 400);
      return;
    }
    if (password.length < 8) {
      var ep = document.getElementById('error-password');
      var ip = document.getElementById('input-password');
      if (ep) ep.textContent = 'Mínimo 8 caracteres';
      if (ip) { ip.classList.add('input-error'); ip.classList.remove('input-ok'); }
      form.classList.add('shake');
      setTimeout(function () { form.classList.remove('shake'); }, 400);
      return;
    }
    if (password !== password2) {
      var ep2 = document.getElementById('error-password2');
      var ip2 = document.getElementById('input-password2');
      if (ep2) ep2.textContent = 'Las contraseñas no coinciden';
      if (ip2) { ip2.classList.add('input-error'); ip2.classList.remove('input-ok'); }
      form.classList.add('shake');
      setTimeout(function () { form.classList.remove('shake'); }, 400);
      return;
    }

    var btn = form.querySelector('.btn-submit-registro');
    btn.textContent = 'Creando cuenta...';
    btn.disabled    = true;
    if (errEl) errEl.textContent = '';

    try {
      var res  = await fetch('/api/auth/registro', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nombre: nombre, email: email, password: password, rol: rol })
      });
      var data = await res.json();

      if (!res.ok) {
        /* El backend devuelve el error exacto — ej: "Ya existe una cuenta con ese correo" */
        if (errEl) errEl.textContent = data.error;
        btn.textContent = 'Crear cuenta';
        btn.disabled    = false;
        return;
      }

      /* Guardar sesión */
      localStorage.setItem('mt_token', data.token);
      localStorage.setItem('mt_user',  JSON.stringify(data.usuario));

      btn.textContent      = '✓ ¡Listo!';
      btn.style.background = '#3a7a28';

      setTimeout(function () {
        window.location.href = data.usuario.rol === 'profesor'
          ? 'onboarding.html'
          : 'panel_estudiante.html';
      }, 1000);

    } catch (err) {
      if (errEl) errEl.textContent = 'Error de conexión. ¿Está el servidor corriendo?';
      btn.textContent = 'Crear cuenta';
      btn.disabled    = false;
    }
  });
}
