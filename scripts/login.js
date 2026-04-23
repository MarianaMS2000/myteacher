/* =============================================
   login.js — Lógica del formulario de inicio de sesión
   ============================================= */

/* Guardamos el rol seleccionado (estudiante o profesor) */
var selectedRole = localStorage.getItem('mt_last_role') || 'estudiante';

/* Aplicamos el rol que se usó la última vez */
setRole(selectedRole);

/* Función para cambiar entre tab Estudiante y Profesor */
function setRole(role) {
  selectedRole = role;
  /* El tab activo se pone verde, el inactivo se queda gris */
  document.getElementById('tab-est').classList.toggle('active', role === 'estudiante');
  document.getElementById('tab-prof').classList.toggle('active', role === 'profesor');
}

/* Lógica del formulario cuando el usuario hace submit */
var loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault(); /* Evitamos que la página se recargue */

    var email = loginForm.querySelector('input[name="email"]').value.trim();
    var pass  = loginForm.querySelector('input[name="password"]').value;

    /* Validamos que ambos campos estén llenos */
    if (!email || !pass) {
      /* Animación de sacudida para indicar error */
      loginForm.classList.add('shake');
      setTimeout(function () { loginForm.classList.remove('shake'); }, 400);
      return;
    }

    /* Creamos un usuario básico a partir del email */
    var name = email.split('@')[0].replace(/[._]/g, ' ');
    localStorage.setItem('mt_user', JSON.stringify({
      nombre: name.charAt(0).toUpperCase() + name.slice(1),
      email: email,
      rol: selectedRole
    }));
    localStorage.setItem('mt_last_role', selectedRole);

    /* Cambiamos el texto del botón para dar feedback visual */
    var btn = loginForm.querySelector('.btn-login');
    btn.textContent = '✓ Entrando...';
    btn.style.background = '#3a7a28';

    /* Esperamos un momento y redirigimos al panel correcto */
    setTimeout(function () {
      if (selectedRole === 'profesor') {
        window.location.href = 'panel_profesor.html';
      } else {
        window.location.href = 'panel_estudiante.html';
      }
    }, 1200);
  });
}
