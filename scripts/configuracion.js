/* configuracion.js — perfil del estudiante, guarda en MySQL */

var modoEdicion = false;

document.addEventListener('DOMContentLoaded', async function () {
  var user = getUser();
  if (!user) { window.location.href = 'login.html'; return; }

  await cargarDatos();

  var btnEditar = document.getElementById('btnEditar');
  if (btnEditar) {
    btnEditar.addEventListener('click', function () {
      if (!modoEdicion) activarEdicion();
      else guardarCambios();
    });
  }

  /* Subir foto de perfil */
  var fotoInput = document.getElementById('fotoInput');
  if (fotoInput) {
    fotoInput.addEventListener('change', async function (e) {
      var file = e.target.files[0];
      if (!file || !file.type.startsWith('image/')) return;

      /* Vista previa inmediata */
      var reader = new FileReader();
      reader.onload = function (ev) {
        var prev = document.getElementById('fotoPreview');
        var inic = document.getElementById('fotoInicial');
        var ha   = document.getElementById('headerAvatar');
        if (prev) { prev.src = ev.target.result; prev.style.display = 'block'; }
        if (inic) inic.style.display = 'none';
        if (ha)   ha.src = ev.target.result;
      };
      reader.readAsDataURL(file);

      /* Subir al servidor */
      await subirFoto(file);
    });
  }

  var btnBorrar = document.getElementById('btnBorrarFoto');
  if (btnBorrar) {
    btnBorrar.addEventListener('click', async function () {
      await guardarCampo({ foto_url: null });
      var prev = document.getElementById('fotoPreview');
      var inic = document.getElementById('fotoInicial');
      var ha   = document.getElementById('headerAvatar');
      if (prev) { prev.src = ''; prev.style.display = 'none'; }
      if (inic) inic.style.display = 'flex';
      if (ha)   ha.src = '';
      var user2 = getUser();
      if (user2) { user2.foto_url = null; localStorage.setItem('mt_user', JSON.stringify(user2)); }
    });
  }
});

/* ── Cargar datos del perfil desde el servidor ── */
async function cargarDatos() {
  var token = getToken();
  if (!token) return;
  try {
    var res  = await fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await res.json();
    var u    = data.usuario || {};

    /* Actualizar localStorage */
    localStorage.setItem('mt_user', JSON.stringify(u));

    /* Llenar campos */
    setText('configNombre',  u.nombre);
    setText('configEmail',   u.email);
    setText('configTelefono',u.telefono || '');
    setText('configCiudad',  u.ciudad   || '');
    setText('configBio',     u.bio      || '');

    /* Foto */
    if (u.foto_url) {
      var prev = document.getElementById('fotoPreview');
      var inic = document.getElementById('fotoInicial');
      if (prev) { prev.src = u.foto_url; prev.style.display = 'block'; }
      if (inic) inic.style.display = 'none';
    }
  } catch(e) {
    /* Si falla, usar caché */
    var user = getUser();
    if (user) {
      setText('configNombre', user.nombre);
      setText('configEmail',  user.email);
    }
  }
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) {
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.value = val || '';
    else el.textContent = val || '';
  }
}

/* ── Modo edición ── */
function activarEdicion() {
  modoEdicion = true;
  var campos = ['configNombre','configTelefono','configCiudad','configBio'];
  campos.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.removeAttribute('readonly');
    if (el) el.removeAttribute('disabled');
  });
  var btn = document.getElementById('btnEditar');
  if (btn) btn.textContent = 'Guardar cambios';
}

/* ── Guardar cambios en la BD ── */
async function guardarCambios() {
  var datos = {
    nombre:   (document.getElementById('configNombre')   || {}).value || '',
    telefono: (document.getElementById('configTelefono') || {}).value || '',
    ciudad:   (document.getElementById('configCiudad')   || {}).value || '',
    bio:      (document.getElementById('configBio')      || {}).value || ''
  };

  var ok = await guardarCampo(datos);
  if (!ok) return;

  modoEdicion = false;
  var campos = ['configNombre','configTelefono','configCiudad','configBio'];
  campos.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) { el.setAttribute('readonly', true); el.setAttribute('disabled', true); }
  });
  var btn = document.getElementById('btnEditar');
  if (btn) btn.textContent = 'Editar perfil';

  mostrarToast('¡Cambios guardados!');

  /* Actualizar nombre en el header de inmediato */
  var userCache = getUser();
  if (userCache && datos.nombre) {
    userCache.nombre = datos.nombre;
    localStorage.setItem('mt_user', JSON.stringify(userCache));
    var userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = datos.nombre;
  }
}

async function guardarCampo(datos) {
  var token = getToken();
  if (!token) return false;
  try {
    var res = await fetch('/api/auth/perfil', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body:    JSON.stringify(datos)
    });
    return res.ok;
  } catch(e) { return false; }
}

/* ── Subir foto al servidor ── */
async function subirFoto(file) {
  var token = getToken();
  if (!token) return;
  var form = new FormData();
  form.append('foto', file);
  try {
    var res  = await fetch('/api/auth/foto', {
      method:  'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body:    form
    });
    var data = await res.json();
    if (data.foto_url) {
      var userCache = getUser();
      if (userCache) { userCache.foto_url = data.foto_url; localStorage.setItem('mt_user', JSON.stringify(userCache)); }
      mostrarToast('Foto actualizada');
    }
  } catch(e) { console.error('Error subiendo foto:', e); }
}

function mostrarToast(msg) {
  var toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#3a7a28;color:#fff;padding:12px 20px;border-radius:8px;z-index:9999;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,.2)';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  setTimeout(function () { toast.style.opacity = '0'; }, 3000);
}

/* ── Cambiar contraseña ── */
async function cambiarPassword() {
  var actual    = (document.getElementById('passActual')    || {}).value || '';
  var nueva     = (document.getElementById('passNueva')     || {}).value || '';
  var confirmar = (document.getElementById('passConfirmar') || {}).value || '';

  if (!actual || !nueva || !confirmar) {
    mostrarToast('Rellena todos los campos de contraseña');
    return;
  }
  if (nueva !== confirmar) {
    mostrarToast('Las contraseñas nuevas no coinciden');
    return;
  }
  if (nueva.length < 8) {
    mostrarToast('La contraseña debe tener al menos 8 caracteres');
    return;
  }

  var token = getToken();
  if (!token) return;
  try {
    var res = await fetch('/api/auth/password', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body:    JSON.stringify({ actual: actual, nueva: nueva })
    });
    if (res.ok) {
      mostrarToast('¡Contraseña actualizada!');
      document.getElementById('passActual').value    = '';
      document.getElementById('passNueva').value     = '';
      document.getElementById('passConfirmar').value = '';
    } else {
      var data = await res.json();
      mostrarToast(data.error || 'Error al cambiar contraseña');
    }
  } catch(e) {
    mostrarToast('Error de conexión');
  }
}

/* ── Eliminar cuenta permanentemente ── */
document.addEventListener('DOMContentLoaded', function () {
  var btnEliminar   = document.getElementById('btnEliminarCuenta');
  var modalEliminar = document.getElementById('modalEliminar');
  var btnCancelar   = document.getElementById('btnCancelarEliminar');
  var btnConfirmar  = document.getElementById('btnConfirmarEliminar');

  if (btnEliminar && modalEliminar) {
    btnEliminar.addEventListener('click', function () {
      modalEliminar.style.display = 'flex';
    });
  }
  if (btnCancelar && modalEliminar) {
    btnCancelar.addEventListener('click', function () {
      modalEliminar.style.display = 'none';
    });
  }
  if (btnConfirmar) {
    btnConfirmar.addEventListener('click', async function () {
      btnConfirmar.textContent = 'Eliminando...';
      btnConfirmar.disabled    = true;
      var token = getToken();
      if (!token) { window.location.href = 'login.html'; return; }

      try {
        var res = await fetch('/api/auth/cuenta', {
          method:  'DELETE',
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
          /* Limpiar TODA la sesión local — token, usuario, favoritos y cualquier
             dato cacheado — para que no queden rastros de la cuenta eliminada */
          localStorage.removeItem('mt_token');
          localStorage.removeItem('mt_user');
          localStorage.removeItem('mt_favoritos');
          localStorage.removeItem('mt_last_role');
          sessionStorage.clear();
          window.location.href = 'login.html';
        } else {
          var data = await res.json();
          mostrarToast(data.error || 'Error al eliminar cuenta');
          btnConfirmar.textContent = 'Sí, eliminar';
          btnConfirmar.disabled    = false;
          if (modalEliminar) modalEliminar.style.display = 'none';
        }
      } catch(e) {
        mostrarToast('Error de conexión');
        btnConfirmar.textContent = 'Sí, eliminar';
        btnConfirmar.disabled    = false;
      }
    });
  }

  /* Cerrar modal al hacer clic fuera */
  if (modalEliminar) {
    modalEliminar.addEventListener('click', function (e) {
      if (e.target === modalEliminar) modalEliminar.style.display = 'none';
    });
  }
});
