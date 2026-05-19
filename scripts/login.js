/* login.js — conectado al backend MySQL */

var loginForm = document.getElementById('login-form');
var errorEl   = document.getElementById('loginError');

function mostrarError(msg) {
  if (errorEl) errorEl.textContent = msg;
  if (loginForm) {
    loginForm.classList.add('shake');
    setTimeout(function () { loginForm.classList.remove('shake'); }, 400);
  }
}

if (loginForm) {
  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    var email    = (loginForm.querySelector('input[name="email"]') || loginForm.querySelector('#email')).value.trim();
    var password = (loginForm.querySelector('input[name="password"]') || loginForm.querySelector('#password')).value;
    var btn      = loginForm.querySelector('.btn-login');

    if (!email || !password) {
      mostrarError('Completa todos los campos');
      return;
    }

    btn.textContent = 'Verificando...';
    btn.disabled    = true;
    if (errorEl) errorEl.textContent = '';

    try {
      var res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email, password: password })
      });
      var data = await res.json();

      if (!res.ok) {
        mostrarError(data.error || 'Credenciales incorrectas');
        btn.textContent = 'Entrar';
        btn.disabled    = false;
        return;
      }

      /* Guardar token y datos del usuario */
      localStorage.setItem('mt_token', data.token);
      localStorage.setItem('mt_user',  JSON.stringify(data.usuario));

      btn.textContent      = '✓ Entrando...';
      btn.style.background = '#3a7a28';

      /* Redirigir según el rol que devuelve la BD — no el tab */
      setTimeout(function () {
        window.location.href = data.usuario.rol === 'profesor'
          ? 'panel_profesor.html'
          : 'panel_estudiante.html';
      }, 1000);

    } catch (err) {
      mostrarError('Error de conexión. ¿Está el servidor corriendo?');
      btn.textContent = 'Entrar';
      btn.disabled    = false;
    }
  });
}
