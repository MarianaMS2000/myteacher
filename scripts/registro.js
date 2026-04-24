/* =============================================
   registro.js — Lógica del formulario de registro
   de nuevos usuarios (estudiantes y profesores)
   ============================================= */

/* Mostrar / ocultar contraseña */
function togglePass(inputId, btn) {
  var input = document.getElementById(inputId);
  var icon  = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
}

/* Validación en tiempo real de contraseñas */
document.addEventListener('DOMContentLoaded', function () {
  var inputPass  = document.getElementById('input-password');
  var inputPass2 = document.getElementById('input-password2');
  var errorPass  = document.getElementById('error-password');
  var errorPass2 = document.getElementById('error-password2');

  function validarLongitud() {
    if (!inputPass.value) {
      inputPass.classList.remove('input-error', 'input-ok');
      errorPass.textContent = '';
      return;
    }
    if (inputPass.value.length < 8) {
      inputPass.classList.add('input-error');
      inputPass.classList.remove('input-ok');
      errorPass.textContent = 'La contraseña debe tener al menos 8 caracteres';
    } else {
      inputPass.classList.remove('input-error');
      inputPass.classList.add('input-ok');
      errorPass.textContent = '';
    }
    /* Si ya escribió algo en el segundo campo, revalidar coincidencia */
    if (inputPass2.value) validarCoincidencia();
  }

  function validarCoincidencia() {
    if (!inputPass2.value) {
      inputPass2.classList.remove('input-error', 'input-ok');
      errorPass2.textContent = '';
      return;
    }
    if (inputPass.value !== inputPass2.value) {
      inputPass2.classList.add('input-error');
      inputPass2.classList.remove('input-ok');
      errorPass2.textContent = 'Las contraseñas no coinciden';
    } else {
      inputPass2.classList.remove('input-error');
      inputPass2.classList.add('input-ok');
      errorPass2.textContent = '';
    }
  }

  if (inputPass)  inputPass.addEventListener('input', validarLongitud);
  if (inputPass2) inputPass2.addEventListener('input', validarCoincidencia);
});

/* Fotos que se muestran en el panel izquierdo según el rol elegido */
var FOTOS = {
  estudiante: '../images/student.png',
  profesor: '../images/teacher.png'
};

/* Función para cambiar entre tabs de Estudiante y Profesor */
function cambiarRol(rol) {
  var tabE = document.getElementById('tab-estudiante');
  var tabP = document.getElementById('tab-profesor');
  var tabME = document.getElementById('tab-mobile-estudiante');
  var tabMP = document.getElementById('tab-mobile-profesor');
  var fotoD = document.getElementById('foto-img-desktop');
  var fotoM = document.getElementById('foto-img-mobile');
  var form  = document.getElementById('registro-form');

  /* Activamos el tab correcto en escritorio y móvil */
  if (tabE) tabE.classList.toggle('active', rol === 'estudiante');
  if (tabP) tabP.classList.toggle('active', rol === 'profesor');
  if (tabME) tabME.classList.toggle('active', rol === 'estudiante');
  if (tabMP) tabMP.classList.toggle('active', rol === 'profesor');

  /* Cambiamos la foto en escritorio y móvil */
  var src = FOTOS[rol] || FOTOS.estudiante;
  if (fotoD) fotoD.src = src;
  if (fotoM) fotoM.src = src;

  /* ── CLAVE: actualizamos el destino según el rol ──
     Profesor → onboarding → panel_profesor
     Estudiante → panel_estudiante */
  if (form) {
    form.dataset.destino = (rol === 'profesor') ? 'onboarding' : 'index';
  }
}

/* elegirRol: compatible con el flujo sin pantalla de bienvenida */
function elegirRol(rol) {
  /* Por si aún existe el step-bienvenida en alguna versión */
  var bienvenida = document.getElementById('step-bienvenida');
  if (bienvenida) bienvenida.style.display = 'none';

  var stepForm = document.getElementById('step-form');
  if (stepForm) stepForm.style.display = 'block';

  cambiarRol(rol);
}

/* Leemos el parámetro "?tipo=" de la URL
   Para que al hacer click en "Conviértete en tutor" desde el index
   ya se abra el formulario con el rol de profesor seleccionado */
var params = new URLSearchParams(window.location.search);
var tipo = params.get('tipo');
if (tipo === 'profesor' || tipo === 'estudiante') {
  elegirRol(tipo);
}

/* Lógica del formulario de registro */
document.getElementById('registro-form').addEventListener('submit', function (e) {
  e.preventDefault();
  var form = e.target;
  var nombre = form.nombre.value.trim();
  var email  = form.email.value.trim();
  var pass   = form.password.value;
  var pass2  = form.password2.value;

  /* Validamos que nombre y email no estén vacíos */
  if (!nombre || !email) {
    form.classList.add('shake');
    setTimeout(function () { form.classList.remove('shake'); }, 400);
    return;
  }

  /* Validamos longitud mínima */
  if (pass.length < 8) {
    var ep = document.getElementById('error-password');
    var ip = document.getElementById('input-password');
    if (ep) ep.textContent = 'La contraseña debe tener al menos 8 caracteres';
    if (ip) { ip.classList.add('input-error'); ip.classList.remove('input-ok'); }
    form.classList.add('shake');
    setTimeout(function () { form.classList.remove('shake'); }, 400);
    return;
  }

  /* Validamos que las contraseñas coincidan */
  if (pass !== pass2) {
    var ep2 = document.getElementById('error-password2');
    var ip2 = document.getElementById('input-password2');
    if (ep2) ep2.textContent = 'Las contraseñas no coinciden';
    if (ip2) { ip2.classList.add('input-error'); ip2.classList.remove('input-ok'); }
    form.classList.add('shake');
    setTimeout(function () { form.classList.remove('shake'); }, 400);
    return;
  }

  /* Detectamos qué rol está activo */
  var activeTab = document.getElementById('tab-estudiante');
  var rol = (activeTab && activeTab.classList.contains('active')) ? 'estudiante' : 'profesor';

  /* Mostramos feedback visual en el botón */
  var btn = form.querySelector('.btn-submit-registro');
  btn.textContent = '✓ Registrado!';
  btn.style.background = '#3a7a28';

  /* Guardamos al usuario en el navegador */
  localStorage.setItem('mt_user', JSON.stringify({ nombre: nombre, email: email, rol: rol }));
  localStorage.setItem('mt_last_role', rol);

  /* Redirigimos según el tipo de usuario */
  setTimeout(function () {
    if (form.dataset.destino === 'onboarding') {
      window.location.href = 'onboarding.html';
    } else {
      window.location.href = 'panel_estudiante.html';
    }
  }, 1200);
});