/* =============================================
   registro.js — Lógica del formulario de registro
   de nuevos usuarios (estudiantes y profesores)
   ============================================= */

/* Fotos que se muestran en el panel izquierdo según el rol elegido */
var FOTOS = {
  estudiante: 'images/student.png',
  profesor: 'images/teacher.png'
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

  /* Validamos que las contraseñas coincidan */
  if (pass !== pass2) {
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