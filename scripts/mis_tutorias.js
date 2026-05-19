/* mis_tutorias.js — Tutorías reales del estudiante desde la API */

var reseñaActual = { tutorId: null, estrellas: 0 };
var _tutorias = { proximas: [], solicitudes: [], historial: [] };

/* ── Helpers de formato de fecha/hora ── */
function formatFecha(fechaStr) {
  if (!fechaStr) return '';
  try {
    var iso = String(fechaStr).slice(0, 10);
    var parts = iso.split('-');
    var d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (isNaN(d.getTime())) return fechaStr;
    var dias  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    var meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return dias[d.getDay()] + ' ' + d.getDate() + ' ' + meses[d.getMonth()];
  } catch(e) { return fechaStr; }
}

function formatHora(horaStr) {
  if (!horaStr) return '';
  try {
    var hm = String(horaStr).substring(0, 5);
    var parts = hm.split(':');
    var h = parseInt(parts[0]);
    var m = parts[1] || '00';
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + m + ' ' + ampm;
  } catch(e) { return horaStr; }
}

/* ══════════════════════════════════════════════
   INICIALIZACIÓN
   ══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async function () {
  /* Tabs */
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { activarTab(btn.getAttribute('data-tab')); });
  });

  inicializarEstrellas();

  /* Cerrar modales al clickear fondo */
  var rModal = document.getElementById('ratingModal');
  var cModal = document.getElementById('confirmModal');
  if (rModal) rModal.addEventListener('click', function(e){ if(e.target===this) cerrarModalReseña(); });
  if (cModal) cModal.addEventListener('click', function(e){ if(e.target===this) cerrarConfirmModal(); });

  /* Cargar datos reales */
  await cargarTodoDesdeAPI();

  /* Restaurar favoritos (para tarjetas estáticas HTML en historial) */
  restaurarFavoritos();
});

/* ── Cargar todo desde la API ── */
async function cargarTodoDesdeAPI() {
  var token = typeof getToken === 'function' ? getToken() : null;
  if (!token) {
    mostrarMensajeVacio('tab-proximos', 'Debes iniciar sesión para ver tus tutorías.');
    return;
  }

  try {
    /* Solicitudes */
    var resSol = await fetch('/api/solicitudes', { headers: { 'Authorization': 'Bearer ' + token } });
    var dataSol = await resSol.json();
    var todasSolicitudes = dataSol.solicitudes || [];

    /* Tutorías confirmadas y completadas */
    var resTut = await fetch('/api/tutorias', { headers: { 'Authorization': 'Bearer ' + token } });
    var dataTut = await resTut.json();
    var tutorias = dataTut.tutorias || [];

    var hoy = new Date().toISOString().split('T')[0];

    _tutorias.proximas  = tutorias.filter(function(t){
      var fechaStr = (t.fecha || '').toString().slice(0, 10);
      return t.estado === 'confirmada' && fechaStr >= hoy;
    });
    _tutorias.historial = tutorias.filter(function(t){
      var fechaStr = (t.fecha || '').toString().slice(0, 10);
      return t.estado === 'completada' || (t.estado !== 'confirmada' && fechaStr < hoy);
    });

    /* Las ACEPTADAS pasan al tab "Próximos" con la card completa.
       Solo las pendientes/rechazadas quedan en "Solicitudes". */
    var canceladasLocal = getCanceladasLocal();
    var solicitudesAceptadas = todasSolicitudes.filter(function(s){
      return s.estado === 'aceptada';
    });
    _tutorias.solicitudes = todasSolicitudes.filter(function(s){
      /* Excluir las que el usuario ya canceló localmente aunque el backend las siga como "enviada" */
      if (canceladasLocal.indexOf(String(s.id)) !== -1) return false;
      return s.estado === 'enviada' || s.estado === 'rechazada' || s.estado === 'cancelada';
    });

    /* Fusionar aceptadas en próximas */
    solicitudesAceptadas.forEach(function(s) {
      _tutorias.proximas.push({
        profesor_nombre:     s.profesor_nombre || 'Tutor',
        profesor_foto:       s.profesor_foto   || '',
        profesor_tel:        s.profesor_tel    || s.telefono || '',
        link_virtual:        s.link_virtual    || '',
        profesor_id:         s.profesor_id,
        materia:             s.materia || s.materia_nombre || 'Materia',
        fecha:               s.fecha_prop || s.fecha || '',
        hora_inicio:         s.hora_prop  || s.hora  || '',
        duracion_min:        s.duracion_min || null,
        modalidad:           s.modalidad || 'virtual',
        precio_cop:          s.precio_cop || null,
        estado:              'confirmada',
        mensaje_tutor:       s.mensaje_tutor || '',
        _esSolicitudAceptada: true,
        _solicitudId:        s.id
      });
    });

    renderizarProximas(_tutorias.proximas);
    renderizarSolicitudes(_tutorias.solicitudes);
    renderizarHistorial(_tutorias.historial);

    actualizarContadorTab('proximos',    _tutorias.proximas.length);
    actualizarContadorTab('solicitudes', _tutorias.solicitudes.length);
    actualizarContadorTab('historial',   _tutorias.historial.length);

  } catch(e) {
    console.error('Error cargando tutorías:', e);
    cargarDesdeLocalStorage();
  }
}

function cargarDesdeLocalStorage() {
  var pendiente = null;
  try { pendiente = JSON.parse(localStorage.getItem('mt_tutoria_pendiente') || 'null'); } catch(e) {}
  if (!pendiente) return;
  var contenedor = document.getElementById('tab-solicitudes');
  if (!contenedor) return;
  var realList = contenedor.querySelector('.tutorias-list-real');
  if (!realList) {
    realList = document.createElement('div');
    realList.className = 'tutorias-list-real';
    contenedor.prepend(realList);
  }
  realList.prepend(crearCardSolicitudLocal(pendiente));
  actualizarContadorTab('solicitudes', 1);
}

function crearCardSolicitudLocal(p) {
  var div = document.createElement('div');
  div.className = 'tutoria-card';
  var iniciales = (p.profesor || 'P').split(' ').map(function(x){ return x[0]; }).join('').toUpperCase().slice(0,2);
  div.innerHTML =
    '<div class="tutoria-card-top">' +
      '<div class="tutor-avatar" style="background:#4a7a30;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.1rem;">' + iniciales + '</div>' +
      '<div class="tutoria-info">' +
        '<div class="tutor-name">' + esc(p.profesor || 'Tutor') + '</div>' +
        '<div class="tutoria-subject"><i class="fa-solid fa-circle" style="font-size:.5rem;"></i> ' + esc(p.tema || '') + '</div>' +
        '<div class="tutoria-meta">' +
          '<span class="meta-chip"><i class="fa-regular fa-calendar"></i> ' + esc(p.fecha || '') + '</span>' +
          '<span class="meta-chip"><i class="fa-regular fa-clock"></i> ' + esc(p.hora || '') + '</span>' +
          '<span class="meta-chip"><i class="fa-solid fa-video"></i> ' + esc(p.modalidad || 'Virtual') + '</span>' +
        '</div>' +
        (p.duracion ? '<span class="duration-badge"><i class="fa-solid fa-hourglass-half"></i> ' + esc(String(p.duracion)) + ' min</span>' : '') +
      '</div>' +
      '<div class="tutoria-card-right">' +
        '<span class="badge badge-pendiente"><i class="fa-solid fa-clock"></i> Pendiente</span>' +
        '<div><div class="tutoria-price">' + esc(p.precio || '') + '</div><div class="tutoria-price-label">COP / sesión</div></div>' +
      '</div>' +
    '</div>' +
    '<div class="tutoria-actions" style="margin-top:14px;">' +
      '<button class="btn-action btn-gray" onclick="this.closest(\'.tutoria-card\').remove();localStorage.removeItem(\'mt_tutoria_pendiente\')">' +
        '<i class="fa-solid fa-xmark"></i> Cancelar solicitud</button>' +
    '</div>';
  return div;
}

/* ── Renderizar próximas ── */
function renderizarProximas(lista) {
  var tab = document.getElementById('tab-proximos');
  if (!tab) return;
  var realList = tab.querySelector('.tutorias-list-real');
  if (!realList) {
    realList = document.createElement('div');
    realList.className = 'tutorias-list-real';
    tab.prepend(realList);
  }
  realList.innerHTML = '';
  if (!lista.length) return;
  lista.forEach(function(t){ realList.appendChild(crearCardTutoria(t, 'proxima')); });
}

/* ── Renderizar solicitudes ── */
function renderizarSolicitudes(lista) {
  var tab = document.getElementById('tab-solicitudes');
  if (!tab) return;
  var realList = tab.querySelector('.tutorias-list-real');
  if (!realList) {
    realList = document.createElement('div');
    realList.className = 'tutorias-list-real';
    tab.prepend(realList);
  }
  realList.innerHTML = '';

  /* Solicitud local (localStorage) como fallback */
  var pendienteLocal = null;
  try { pendienteLocal = JSON.parse(localStorage.getItem('mt_tutoria_pendiente') || 'null'); } catch(e) {}
  if (pendienteLocal) realList.appendChild(crearCardSolicitudLocal(pendienteLocal));

  lista.forEach(function(s){ realList.appendChild(crearCardSolicitud(s)); });
}

/* ── Renderizar historial ── */
function renderizarHistorial(lista) {
  var tab = document.getElementById('tab-historial');
  if (!tab) return;
  var realList = tab.querySelector('.tutorias-list-real');
  if (!realList) {
    realList = document.createElement('div');
    realList.className = 'tutorias-list-real';
    tab.prepend(realList);
  }
  realList.innerHTML = '';
  if (!lista.length) return;
  lista.forEach(function(t, i){ realList.appendChild(crearCardTutoria(t, 'historial', 'hist-api-' + i)); });
}

/* ── Crear card de tutoría confirmada / completada / historial ── */
function crearCardTutoria(t, tipo, histId) {
  var div = document.createElement('div');
  div.className = 'tutoria-card';
  var nombre = t.profesor_nombre || t.estudiante_nombre || 'Tutor';
  var iniciales = nombre.split(' ').map(function(x){ return x[0]; }).join('').toUpperCase().slice(0,2);
  var foto = t.profesor_foto || t.tutor_foto || '';
  var avatarHtml = foto
    ? '<img src="' + esc(foto) + '" alt="' + esc(nombre) + '" onerror="this.style.display=\'none\';this.parentNode.textContent=\'' + iniciales + '\'">'
    : iniciales;
  var precioFmt = t.precio_cop ? '$' + Number(t.precio_cop).toLocaleString('es-CO') : '';
  var modalidadIcono = (t.modalidad === 'presencial') ? 'fa-house' : 'fa-video';
  var modalidadTexto = (t.modalidad === 'presencial') ? 'Presencial' : 'Virtual';

  var badgeHtml = tipo === 'proxima'
    ? '<span class="badge badge-confirmada"><i class="fa-solid fa-circle-check"></i> Confirmada</span>'
    : '<span class="badge badge-completado"><i class="fa-solid fa-check"></i> Completado</span>';

  var acciones = '';
  if (tipo === 'proxima') {
    /* Siempre mostrar botones de contacto; si no hay datos reales, se ocultan solos */
    var botonesContacto =
      (t.profesor_tel
        ? '<button class="btn-action btn-whatsapp" onclick="openWhatsApp(\'' + esc(t.profesor_tel) + '\')"><i class="fa-brands fa-whatsapp"></i> WhatsApp</button>'
        : '<button class="btn-action btn-whatsapp" onclick="mostrarToast(\'El tutor aún no ha compartido su WhatsApp.\',\'error\')"><i class="fa-brands fa-whatsapp"></i> WhatsApp</button>') +
      (t.link_virtual
        ? '<button class="btn-action btn-link" onclick="openLink(\'' + esc(t.link_virtual) + '\')"><i class="fa-solid fa-video"></i> Link de videollamada</button>'
        : '<button class="btn-action btn-link" onclick="mostrarToast(\'El tutor aún no ha compartido el link.\',\'error\')"><i class="fa-solid fa-video"></i> Link de videollamada</button>');
    acciones = '<div class="tutoria-actions">' + botonesContacto + '</div>';
  } else if (histId) {
    acciones =
      '<div class="tutoria-actions" id="actions-' + histId + '">' +
        '<button class="btn-action btn-fav btn-favorite" data-tutor-id="' + esc(String(t.profesor_id || '')) + '" onclick="toggleFavorito(this)"><i class="fa-solid fa-heart"></i> Favorito</button>' +
        '<button class="btn-action btn-review" onclick="abrirModalReseña(\'' + histId + '\')"><i class="fa-solid fa-star"></i> Dejar reseña</button>' +
      '</div>';
  }

  div.innerHTML =
    '<div class="tutoria-card-top">' +
      '<div class="tutor-avatar" style="background:#4a7a30;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;overflow:hidden;">' + avatarHtml + '</div>' +
      '<div class="tutoria-info">' +
        '<div class="tutor-name">' + esc(nombre) + '</div>' +
        '<div class="tutoria-subject"><i class="fa-solid fa-circle" style="font-size:.5rem;"></i> ' + esc(t.materia || '') + '</div>' +
        '<div class="tutoria-meta">' +
          '<span class="meta-chip"><i class="fa-regular fa-calendar"></i> ' + esc(formatFecha(t.fecha || '')) + '</span>' +
          '<span class="meta-chip"><i class="fa-regular fa-clock"></i> ' + esc(formatHora(t.hora_inicio || '')) + '</span>' +
          '<span class="meta-chip"><i class="fa-solid ' + modalidadIcono + '"></i> ' + modalidadTexto + '</span>' +
        '</div>' +
        (t.duracion_min ? '<span class="duration-badge"><i class="fa-solid fa-hourglass-half"></i> ' + t.duracion_min + ' min</span>' : '') +
      '</div>' +
      '<div class="tutoria-card-right">' +
        badgeHtml +
        (precioFmt ? '<div><div class="tutoria-price">' + precioFmt + '</div><div class="tutoria-price-label">COP / sesión</div></div>' : '') +
      '</div>' +
    '</div>' +
    (tipo === 'proxima' && t.mensaje_tutor ? '<div class="tutor-message-bubble"><strong>' + esc(nombre.split(' ')[0]) + ':</strong> ' + esc(t.mensaje_tutor) + '</div>' : '') +
    acciones;

  return div;
}

/* ── Crear card de solicitud (enviada/pendiente o rechazada) ── */
function crearCardSolicitud(s) {
  var div = document.createElement('div');
  div.className = 'tutoria-card';
  var nombre = s.profesor_nombre || 'Tutor';
  var iniciales = nombre.split(' ').map(function(x){ return x[0]; }).join('').toUpperCase().slice(0,2);
  var foto = s.profesor_foto || '';
  var avatarHtml = foto
    ? '<img src="' + esc(foto) + '" alt="' + esc(nombre) + '" onerror="this.style.display=\'none\';this.parentNode.textContent=\'' + iniciales + '\'">'
    : iniciales;

  var estado = s.estado || 'enviada';
  var badgeHtml;
  if (estado === 'rechazada') {
    badgeHtml = '<span class="badge badge-rechazada"><i class="fa-solid fa-circle-xmark"></i> Rechazada</span>';
  } else if (estado === 'aceptada') {
    badgeHtml = '<span class="badge badge-confirmada"><i class="fa-solid fa-circle-check"></i> Aceptada</span>';
  } else {
    badgeHtml = '<span class="badge badge-pendiente"><i class="fa-solid fa-clock"></i> Pendiente</span>';
  }

  var precioFmt = s.precio_cop ? '$' + Number(s.precio_cop).toLocaleString('es-CO') : '';
  var modalidadIcono = (s.modalidad === 'presencial') ? 'fa-house' : 'fa-video';
  var modalidadTexto = (s.modalidad === 'presencial') ? 'Presencial' : 'Virtual';

  var accionesHtml = '<div class="tutoria-actions" style="margin-top:14px;">';
  if (estado === 'enviada') {
    accionesHtml +=
      '<button class="btn-action btn-gray" id="btn-cancel-' + s.id + '" onclick="cancelarSolicitudAPI(' + s.id + ', this)">' +
        '<i class="fa-solid fa-xmark"></i> Cancelar solicitud' +
      '</button>';
  } else if (estado === 'rechazada') {
    accionesHtml +=
      '<button class="btn-action btn-gray" onclick="eliminarCardSolicitud(this)">' +
        '<i class="fa-solid fa-trash"></i> Eliminar' +
      '</button>';
  }
  accionesHtml += '</div>';

  div.innerHTML =
    '<div class="tutoria-card-top">' +
      '<div class="tutor-avatar" style="background:#4a7a30;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;overflow:hidden;">' + avatarHtml + '</div>' +
      '<div class="tutoria-info">' +
        '<div class="tutor-name">' + esc(nombre) + '</div>' +
        '<div class="tutoria-subject"><i class="fa-solid fa-circle" style="font-size:.5rem;"></i> ' + esc(s.materia || s.materia_nombre || 'Materia') + '</div>' +
        '<div class="tutoria-meta">' +
          '<span class="meta-chip"><i class="fa-regular fa-calendar"></i> ' + esc(formatFecha(s.fecha_prop || s.fecha || '')) + '</span>' +
          '<span class="meta-chip"><i class="fa-regular fa-clock"></i> ' + esc(formatHora(s.hora_prop || s.hora || '')) + '</span>' +
          '<span class="meta-chip"><i class="fa-solid ' + modalidadIcono + '"></i> ' + modalidadTexto + '</span>' +
        '</div>' +
        (s.duracion_min ? '<span class="duration-badge"><i class="fa-solid fa-hourglass-half"></i> ' + s.duracion_min + ' min</span>' : '') +
        (s.mensaje ? '<div class="tutor-message-bubble" style="margin-top:10px;font-size:.85rem;color:#555;background:#f8f8f8;padding:10px 14px;border-radius:10px;border:1px solid #eee;"><strong>Nota:</strong> ' + esc(s.mensaje) + '</div>' : '') +
      '</div>' +
      '<div class="tutoria-card-right">' +
        badgeHtml +
        (precioFmt ? '<div style="margin-top:8px;"><div class="tutoria-price">' + precioFmt + '</div><div class="tutoria-price-label">COP / sesión</div></div>' : '') +
      '</div>' +
    '</div>' +
    accionesHtml;

  return div;
}

/* ══════════════════════════════════════════════
   CANCELAR SOLICITUD — marca como "Cancelada" siempre
   ══════════════════════════════════════════════ */
async function cancelarSolicitudAPI(solicitudId, btn) {
  if (!confirm('¿Estás seguro de que deseas cancelar esta solicitud?\nEsta acción no se puede deshacer.')) return;

  var token = typeof getToken === 'function' ? getToken() : null;

  /* Deshabilitar botón mientras procesa */
  btn.disabled = true;
  var textoOriginal = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cancelando...';

  /* Intentar cancelar en el backend (silencioso si falla) */
  if (token && solicitudId) {
    try {
      await fetch('/api/solicitudes/' + solicitudId, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        }
      });
      /* No nos importa el status: igual marcamos cancelada localmente */
    } catch(e) { /* red caída — igual seguimos */ }
  }

  /* Marcar la card como "Cancelada" visualmente */
  var card = btn.closest('.tutoria-card');
  if (card) {
    /* Cambiar badge a Cancelada */
    var badge = card.querySelector('.badge');
    if (badge) {
      badge.className = 'badge badge-cancelada';
      badge.innerHTML = '<i class="fa-solid fa-ban"></i> Cancelada';
    }
    /* Reemplazar botón por texto informativo */
    var actionsDiv = btn.closest('.tutoria-actions');
    if (actionsDiv) {
      actionsDiv.innerHTML = '<span style="font-size:.82rem;color:#9ca3af;padding:4px 0;"><i class="fa-solid fa-circle-info"></i> Solicitud cancelada</span>';
    }
    /* Atenuar la card */
    card.style.opacity = '0.55';
    card.style.pointerEvents = 'none';

    /* Actualizar contador */
    setTimeout(function() {
      var realList = document.querySelector('#tab-solicitudes .tutorias-list-real');
      var pendientes = realList ? realList.querySelectorAll('.tutoria-card:not([style*="opacity: 0.55"])').length : 0;
      actualizarContadorTab('solicitudes', pendientes);
    }, 100);
  }

  /* Guardar en localStorage para que persista al recargar */
  guardarCanceladaLocal(solicitudId);

  mostrarToast('Solicitud cancelada.', 'success');
}

/* ── Helpers para persistir cancelaciones localmente ── */
function getCanceladasLocal() {
  try { return JSON.parse(localStorage.getItem('mt_solicitudes_canceladas') || '[]'); } catch(e) { return []; }
}
function guardarCanceladaLocal(id) {
  var lista = getCanceladasLocal();
  if (lista.indexOf(String(id)) === -1) lista.push(String(id));
  try { localStorage.setItem('mt_solicitudes_canceladas', JSON.stringify(lista)); } catch(e) {}
}

/* Eliminar card de solicitud rechazada del DOM (solo visual) */
function eliminarCardSolicitud(btn) {
  var card = btn.closest('.tutoria-card');
  if (!card) return;
  card.style.transition = 'opacity 0.3s';
  card.style.opacity = '0';
  setTimeout(function(){ card.remove(); }, 300);
}

/* ── Toast de notificación flotante ── */
function mostrarToast(mensaje, tipo) {
  var viejo = document.getElementById('mt-toast');
  if (viejo) viejo.remove();

  var toast = document.createElement('div');
  toast.id = 'mt-toast';
  var bg = tipo === 'success' ? '#4a7a30' : '#dc2626';
  toast.style.cssText =
    'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);' +
    'background:' + bg + ';color:white;padding:12px 24px;border-radius:100px;' +
    'font-family:var(--font,Lato,sans-serif);font-size:.9rem;font-weight:600;' +
    'box-shadow:0 4px 20px rgba(0,0,0,.18);z-index:9999;pointer-events:none;' +
    'opacity:0;transition:opacity .25s;white-space:nowrap;';

  var icono = tipo === 'success'
    ? '<i class="fa-solid fa-circle-check" style="margin-right:8px;"></i>'
    : '<i class="fa-solid fa-circle-xmark" style="margin-right:8px;"></i>';
  toast.innerHTML = icono + esc(mensaje);
  document.body.appendChild(toast);

  requestAnimationFrame(function(){
    toast.style.opacity = '1';
    setTimeout(function(){
      toast.style.opacity = '0';
      setTimeout(function(){ toast.remove(); }, 300);
    }, 3500);
  });
}

/* ── Actualizar contador en tab ── */
function actualizarContadorTab(tabName, count) {
  var btn = document.querySelector('[data-tab="' + tabName + '"]');
  if (!btn) return;
  var badge = btn.querySelector('.tab-badge');
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'tab-badge';
    btn.appendChild(badge);
  }
  badge.textContent  = count;
  badge.style.display = count > 0 ? 'inline-flex' : 'none';
}

/* ── Toggle favorito — acepta elemento DOM ── */
function toggleFavorito(btn) {
  /* Compatibilidad: si se pasa string en lugar de DOM element */
  if (typeof btn === 'string') {
    btn = document.getElementById('fav-' + btn) || document.querySelector('[data-tutor-id]');
    if (!btn) return;
  }

  var tutorId = btn.dataset ? btn.dataset.tutorId : null;
  if (!tutorId) return;

  var favs = [];
  try { favs = JSON.parse(localStorage.getItem('mt_favoritos') || '[]'); } catch(e) {}
  var idx = favs.indexOf(String(tutorId));
  var esFav = idx !== -1;

  if (esFav) {
    favs.splice(idx, 1);
    btn.innerHTML = '<i class="fa-solid fa-heart"></i> Favorito';
    btn.classList.remove('active');
    mostrarToast('Tutor quitado de favoritos', 'error');
  } else {
    favs.push(String(tutorId));
    btn.innerHTML = '<i class="fa-solid fa-heart"></i> Favorito ✓';
    btn.classList.add('active');
    mostrarToast('¡Tutor agregado a favoritos!', 'success');
  }
  try { localStorage.setItem('mt_favoritos', JSON.stringify(favs)); } catch(e) {}

  /* Sync backend */
  var token = typeof getToken === 'function' ? getToken() : null;
  if (token) {
    fetch('/api/favoritos/' + tutorId, {
      method: esFav ? 'DELETE' : 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    }).catch(function(){});
  }
}

function restaurarFavoritos() {
  var favs = [];
  try { favs = JSON.parse(localStorage.getItem('mt_favoritos') || '[]'); } catch(e) {}
  document.querySelectorAll('.btn-favorite[data-tutor-id]').forEach(function(btn) {
    var tid = String(btn.dataset.tutorId || '');
    if (tid && favs.includes(tid)) {
      btn.innerHTML = '<i class="fa-solid fa-heart"></i> Favorito ✓';
      btn.classList.add('active');
    }
  });
}

/* ── Tabs ── */
function activarTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('active'); });
  document.querySelectorAll('.tab-content').forEach(function(c){ c.classList.remove('active'); });
  var btn     = document.querySelector('[data-tab="' + tabName + '"]');
  var content = document.getElementById('tab-' + tabName);
  if (btn)     btn.classList.add('active');
  if (content) content.classList.add('active');
}

/* ── Helpers WhatsApp / Link ── */
function openWhatsApp(tel) { if (tel) window.open('https://wa.me/' + tel.replace(/\D/g,''), '_blank'); }
function openLink(url) { if (url) window.open(url, '_blank'); }

/* Compat: función antigua del HTML estático */
function cancelarSolicitud(cardId) {
  if (!confirm('¿Deseas cancelar esta solicitud de tutoría?')) return;
  var card = document.getElementById(cardId);
  if (!card) return;
  card.style.transition = 'opacity .3s, transform .3s';
  card.style.opacity    = '0';
  card.style.transform  = 'translateX(-20px)';
  setTimeout(function(){ card.remove(); }, 300);
}

function eliminarCard(cardId) {
  var card = document.getElementById(cardId);
  if (!card) return;
  card.style.transition = 'opacity .25s';
  card.style.opacity = '0';
  setTimeout(function(){ card.remove(); }, 250);
}

function editarSolicitud(cardId) {
  /* Placeholder: redirigir a la página de agendar o mostrar modal */
  window.location.href = 'agendar_tutoria.html';
}

/* ── Modal de reseña ── */
function inicializarEstrellas() {
  document.querySelectorAll('.star-btn').forEach(function(star) {
    star.addEventListener('click', function() {
      var val = parseInt(star.dataset.value);
      reseñaActual.estrellas = val;
      document.querySelectorAll('.star-btn').forEach(function(s, i) {
        s.classList.toggle('selected', i < val);
      });
    });
  });
}

function abrirModalReseña(histId, nombre, foto) {
  reseñaActual.tutorId = histId;
  reseñaActual.estrellas = 0;
  document.querySelectorAll('.star-btn').forEach(function(s){ s.classList.remove('selected'); });
  /* Si se pasaron nombre y foto (llamadas desde HTML estático) */
  if (nombre) {
    var el = document.getElementById('modalTutorNombre');
    if (el) el.textContent = nombre;
  }
  if (foto) {
    var img = document.getElementById('modalTutorImg');
    if (img) { img.src = foto; img.style.display = ''; }
  }
  var modal = document.getElementById('ratingModal');
  if (modal) modal.classList.add('open');
}

function cerrarModalReseña() {
  var modal = document.getElementById('ratingModal');
  if (modal) modal.classList.remove('open');
}

async function enviarReseña() {
  if (!reseñaActual.estrellas) {
    alert('Por favor selecciona una calificación');
    return;
  }
  var textarea = document.getElementById('reviewTextarea');
  var comentario = textarea ? textarea.value.trim() : '';
  var token = typeof getToken === 'function' ? getToken() : null;
  if (token && reseñaActual.tutorId) {
    try {
      await fetch('/api/resenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ calificacion: reseñaActual.estrellas, comentario: comentario })
      });
    } catch(e) {}
  }
  marcarComoReseñado(reseñaActual.tutorId);
  cerrarModalReseña();
  setTimeout(function(){
    var c = document.getElementById('confirmModal');
    if (c) c.classList.add('open');
  }, 200);
}

function marcarComoReseñado(histId) {
  var badge = document.getElementById('badge-' + histId);
  if (badge) { badge.className = 'badge badge-reseñado'; badge.innerHTML = '<span>⭐</span> Reseñado'; }
  var actions = document.getElementById('actions-' + histId);
  if (actions) { var rb = actions.querySelector('.btn-review'); if (rb) rb.remove(); }
}

function cerrarConfirmModal() {
  var modal = document.getElementById('confirmModal');
  if (modal) modal.classList.remove('open');
  reseñaActual = { tutorId: null, estrellas: 0 };
}

/* ── Helper escape HTML ── */
function esc(str) {
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str || '')));
  return d.innerHTML;
}

function mostrarMensajeVacio(tabId, msg) {
  var tab = document.getElementById(tabId);
  if (!tab) return;
  var p = document.createElement('p');
  p.style.cssText = 'color:#9ca3af;font-size:.9rem;padding:8px 0;';
  p.textContent = msg;
  tab.prepend(p);
}
