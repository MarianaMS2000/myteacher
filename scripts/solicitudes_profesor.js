/* =============================================
   solicitudes_profesor.js
   Al aceptar: guarda sesión en mt_sesiones_prof
               y estudiante en mt_estudiantes_prof
               y persiste estado en mt_solicitudes_estado
   ============================================= */

var LS_SESIONES    = 'mt_sesiones_prof';
var LS_ESTUDIANTES = 'mt_estudiantes_prof';
var LS_SOL_ESTADO  = 'mt_solicitudes_estado';

/* Datos estáticos de cada solicitud (para extraer info al aceptar) */
var SOLICITUDES_DATA = {
  'card-pend-1': {
    estudiante: 'Valentina Pérez',  iniciales: 'VP', color: '#059669',
    materia: 'Cálculo Integral',    fecha: '2026-05-02', hora: '3:00 PM',
    tipo: 'virtual',  precio: '$50,000', duracion: 60,  precio_num: 50000
  },
  'card-pend-2': {
    estudiante: 'Santiago López',   iniciales: 'SL', color: '#1d4ed8',
    materia: 'Cálculo Diferencial', fecha: '2026-05-03', hora: '10:00 AM',
    tipo: 'presencial', precio: '$60,000', duracion: 90, precio_num: 60000
  },
  'card-pend-3': {
    estudiante: 'Andrés Castillo',  iniciales: 'AC', color: '#92400e',
    materia: 'Cálculo Diferencial', fecha: '2026-05-05', hora: '7:00 PM',
    tipo: 'virtual',  precio: '$45,000', duracion: 60,  precio_num: 45000
  },
  /* Cards pre-aceptadas en el HTML */
  'card-prox-1': {
    estudiante: 'Carlos Lizarazo',  iniciales: 'CL', color: '#4a7a30',
    materia: 'Cálculo Diferencial', fecha: '2026-04-24', hora: '10:00 AM',
    tipo: 'virtual',  precio: '$55,000', duracion: 90, precio_num: 55000
  },
  'card-prox-2': {
    estudiante: 'María Suárez',     iniciales: 'MS', color: '#7c3aed',
    materia: 'Álgebra Lineal',      fecha: '2026-04-24', hora: '2:30 PM',
    tipo: 'presencial', precio: '$50,000', duracion: 60, precio_num: 50000
  }
};

/* Reseña en curso */
var reseñaActual = { histId: null, estrellas: 0 };

/* ══════════════════════════════════════════════
   PERSISTENCIA DE ESTADOS
   ══════════════════════════════════════════════ */

function cargarEstados() {
  try { return JSON.parse(localStorage.getItem(LS_SOL_ESTADO) || '{}'); } catch(e) { return {}; }
}
function guardarEstado(cardId, estado) {
  var est = cargarEstados();
  est[cardId] = estado;
  localStorage.setItem(LS_SOL_ESTADO, JSON.stringify(est));
}

/* ══════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {

  /* Restaurar estados guardados (para que al recargar no reaparezcan) */
  restaurarEstados();

  /* Tabs */
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      activarTab(btn.getAttribute('data-tab'));
    });
  });

  /* Estrellas del modal */
  inicializarEstrellas();

  /* Cerrar modales al hacer click en el fondo */
  var rm = document.getElementById('ratingModal');
  var cm = document.getElementById('confirmModal');
  if (rm) rm.addEventListener('click', function(e){ if(e.target===this) cerrarModalReseña(); });
  if (cm) cm.addEventListener('click', function(e){ if(e.target===this) cerrarConfirmModal(); });
});

/* Restaura el estado visual de las cards según localStorage */
function restaurarEstados() {
  var estados = cargarEstados();
  Object.keys(estados).forEach(function(cardId) {
    var estado = estados[cardId];
    if (estado === 'aceptada') {
      moverCardAceptada(cardId, false); /* sin animación */
    } else if (estado === 'rechazada') {
      moverCardRechazada(cardId, false);
    }
  });
  recalcularContadores();
}

/* ══════════════════════════════════════════════
   TABS
   ══════════════════════════════════════════════ */
function activarTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('active'); });
  document.querySelectorAll('.tab-content').forEach(function(c){ c.classList.remove('active'); });
  var btn = document.querySelector('[data-tab="' + tabName + '"]');
  var content = document.getElementById('tab-' + tabName);
  if (btn) btn.classList.add('active');
  if (content) content.classList.add('active');
}

/* ══════════════════════════════════════════════
   ACEPTAR SOLICITUD → genera sesión + estudiante
   ══════════════════════════════════════════════ */
function aceptarSolicitud(cardId) {
  var card = document.getElementById(cardId);
  if (!card) return;

  /* Solo abre el modal. La aceptación real ocurre
     únicamente si el profesor presiona "Confirmar". */
  var data = SOLICITUDES_DATA[cardId] || extraerDatosCard(card);
  if (!data) return;

  var sesionObj = {
    id:         'sol-' + cardId,
    _cardId:    cardId,
    estudiante: data.estudiante,
    iniciales:  data.iniciales,
    color:      data.color,
    materia:    data.materia,
    fecha:      data.fecha,
    hora:       data.hora,
    tipo:       data.tipo,
    precio:     data.precio,
    duracion:   data.duracion || 60
  };
  abrirSesionDetalle(sesionObj, 'confirmar');
}

/* Agrega la sesión al localStorage de agenda */
function agregarSesion(data) {
  var sesiones;
  try { sesiones = JSON.parse(localStorage.getItem(LS_SESIONES) || '[]'); } catch(e) { sesiones = []; }

  /* Evitar duplicados */
  var existe = sesiones.some(function(s) {
    return s.estudiante === data.estudiante && s.fecha === data.fecha && s.hora === data.hora;
  });
  if (existe) return;

  sesiones.push({
    id:         'sol-' + (data._cardId || Date.now()),
    estudiante: data.estudiante,
    iniciales:  data.iniciales,
    color:      data.color,
    materia:    data.materia,
    fecha:      data.fecha,
    hora:       data.hora,
    tipo:       data.tipo,
    precio:     data.precio,
    duracion:   data.duracion || 60
  });
  localStorage.setItem(LS_SESIONES, JSON.stringify(sesiones));
}

/* Agrega el estudiante a mt_estudiantes_prof si no existe */
function agregarEstudiante(data) {
  var estudiantes;
  try { estudiantes = JSON.parse(localStorage.getItem(LS_ESTUDIANTES) || '[]'); } catch(e) { estudiantes = []; }

  var existe = estudiantes.some(function(e) { return e.nombre === data.estudiante; });
  if (existe) {
    /* Incrementar sesiones */
    estudiantes = estudiantes.map(function(e) {
      if (e.nombre === data.estudiante) {
        e.sesiones = (e.sesiones || 0) + 1;
        e.horas    = (e.horas || 0) + ((data.duracion || 60) / 60);
        e.proxima  = data.fecha + ' · ' + data.hora;
      }
      return e;
    });
  } else {
    estudiantes.push({
      id:        Date.now(),
      nombre:    data.estudiante,
      iniciales: data.iniciales,
      color:     data.color,
      materia:   data.materia,
      sesiones:  1,
      horas:     (data.duracion || 60) / 60,
      estado:    'nuevo',
      proxima:   data.fecha + ' · ' + data.hora
    });
  }
  localStorage.setItem(LS_ESTUDIANTES, JSON.stringify(estudiantes));
}

/* Fallback: extrae datos de la card HTML */
function extraerDatosCard(card) {
  var nombre   = card.querySelector('.tutor-name')   ? card.querySelector('.tutor-name').textContent.trim()   : 'Estudiante';
  var iniciales= card.querySelector('.tutor-avatar') ? card.querySelector('.tutor-avatar').textContent.trim() : 'ES';
  var materia  = card.querySelector('.tutoria-subject') ? card.querySelector('.tutoria-subject').textContent.trim() : '';
  var chips    = card.querySelectorAll('.meta-chip');
  var fecha    = chips[0] ? chips[0].textContent.trim() : '';
  var hora     = chips[1] ? chips[1].textContent.trim() : '';
  var tipoEl   = chips[2] ? chips[2].textContent.trim().toLowerCase() : 'virtual';
  var tipo     = tipoEl.includes('presencial') ? 'presencial' : 'virtual';
  var estilo   = card.querySelector('.tutor-avatar') ? card.querySelector('.tutor-avatar').style.background : '#4a7a30';
  var precio   = card.querySelector('.tutoria-price') ? card.querySelector('.tutoria-price').textContent.trim() : '$0';
  return { estudiante:nombre, iniciales:iniciales, color:estilo, materia:materia,
           fecha:fecha, hora:hora, tipo:tipo, precio:precio, duracion:60 };
}

/* Mueve visualmente la card a la pestaña "Aceptadas" */
function moverCardAceptada(cardId, animar) {
  var card = document.getElementById(cardId);
  if (!card) return;

  /* Cambiar badge */
  var badge = card.querySelector('.badge');
  if (badge) {
    badge.className = 'badge badge-aceptada';
    badge.innerHTML = '<i class="fa-solid fa-check"></i> Aceptada';
  }

  /* Reemplazar acciones */
  var actions = card.querySelector('.tutoria-actions');
  if (actions) {
    actions.innerHTML =
      '<button class="btn-action btn-ver-detalle" onclick="verDetalleSolicitud(\'' + cardId + '\')">' +
        '<i class="fa-solid fa-circle-info"></i> Ver detalle' +
      '</button>' +
      '<button class="btn-action btn-gray" onclick="cancelarAceptada(\'' + cardId + '\')">' +
        '<i class="fa-solid fa-xmark"></i> Cancelar sesión' +
      '</button>';
  }
  /* Marcar card como clickable */
  card.setAttribute('data-card-id', cardId);
  card.style.cursor = 'pointer';

  var proxTab = document.getElementById('tab-proximas');
  if (!proxTab) return;

  if (animar) {
    card.style.transition = 'opacity 0.3s';
    card.style.opacity = '0';
    setTimeout(function() {
      proxTab.insertBefore(card, proxTab.firstChild);
      card.style.opacity = '1';
      recalcularContadores();
    }, 300);
  } else {
    proxTab.insertBefore(card, proxTab.firstChild);
  }
}

/* ══════════════════════════════════════════════
   RECHAZAR SOLICITUD
   ══════════════════════════════════════════════ */
function rechazarSolicitud(cardId) {
  if (!confirm('¿Deseas rechazar esta solicitud de tutoría?')) return;
  guardarEstado(cardId, 'rechazada');
  moverCardRechazada(cardId, true);
}

function moverCardRechazada(cardId, animar) {
  var card = document.getElementById(cardId);
  if (!card) return;

  var badge = card.querySelector('.badge');
  if (badge) {
    badge.className = 'badge badge-rechazada';
    badge.innerHTML = '<i class="fa-solid fa-xmark-circle"></i> Rechazada';
  }
  var actions = card.querySelector('.tutoria-actions');
  if (actions) actions.innerHTML = '';

  var histTab = document.getElementById('tab-historial');
  if (!histTab) return;

  if (animar) {
    card.style.transition = 'opacity 0.3s';
    card.style.opacity = '0';
    setTimeout(function() {
      histTab.insertBefore(card, histTab.firstChild);
      card.style.opacity = '1';
      recalcularContadores();
    }, 300);
  } else {
    histTab.insertBefore(card, histTab.firstChild);
  }
}

/* ══════════════════════════════════════════════
   CANCELAR SESIÓN ACEPTADA
   ══════════════════════════════════════════════ */
function cancelarAceptada(cardId) {
  if (!confirm('¿Deseas cancelar esta sesión aceptada? Se notificará al estudiante.')) return;

  /* Eliminar la sesión correspondiente del localStorage */
  var data = SOLICITUDES_DATA[cardId];
  if (data) {
    var sesiones;
    try { sesiones = JSON.parse(localStorage.getItem(LS_SESIONES) || '[]'); } catch(e) { sesiones = []; }
    sesiones = sesiones.filter(function(s) {
      return !(s.estudiante === data.estudiante && s.fecha === data.fecha);
    });
    localStorage.setItem(LS_SESIONES, JSON.stringify(sesiones));
  }

  localStorage.removeItem(LS_SOL_ESTADO + '_' + cardId);
  /* Quitar del estado guardado */
  var estados = cargarEstados();
  delete estados[cardId];
  localStorage.setItem(LS_SOL_ESTADO, JSON.stringify(estados));

  var card = document.getElementById(cardId);
  if (!card) return;
  card.style.transition = 'opacity 0.3s, transform 0.3s';
  card.style.opacity = '0';
  card.style.transform = 'translateX(-20px)';
  setTimeout(function() {
    card.remove();
    recalcularContadores();
  }, 300);
}

/* ══════════════════════════════════════════════
   CONTADORES
   ══════════════════════════════════════════════ */
function recalcularContadores() {
  var pendTab  = document.getElementById('tab-pendientes');
  var proxTab  = document.getElementById('tab-proximas');

  var pendCount = pendTab ? pendTab.querySelectorAll('.tutoria-card').length : 0;
  var proxCount = proxTab ? proxTab.querySelectorAll('.tutoria-card').length : 0;

  var badgePend = document.getElementById('badge-pendientes');
  var badgeProx = document.getElementById('badge-proximas');
  if (badgePend) badgePend.textContent = pendCount;
  if (badgeProx) badgeProx.textContent = proxCount;

  var resPend  = document.getElementById('resumen-pendientes');
  var resAcept = document.getElementById('resumen-aceptadas');
  if (resPend)  resPend.textContent  = pendCount;
  if (resAcept) resAcept.textContent = proxCount;
}

/* ══════════════════════════════════════════════
   HISTORIAL
   ══════════════════════════════════════════════ */
function eliminarCard(cardId) {
  var card = document.getElementById(cardId);
  if (!card) return;
  card.style.transition = 'opacity 0.3s';
  card.style.opacity = '0';
  setTimeout(function() { card.remove(); }, 300);
}

/* ══════════════════════════════════════════════
   MODAL DE RESEÑA (para historial)
   ══════════════════════════════════════════════ */
function abrirModalReseña(nombre, iniciales, histId) {
  reseñaActual.histId = histId;
  reseñaActual.estrellas = 0;
  document.getElementById('modalEstNombre').textContent = nombre;
  var avatarEl = document.getElementById('modalEstAvatar');
  if (avatarEl) avatarEl.textContent = iniciales;
  resetearEstrellas();
  document.getElementById('reviewTextarea').value = '';
  document.getElementById('charCounter').textContent = '0/200';
  document.getElementById('charCounter').classList.remove('warning');
  document.getElementById('btnSubmitReview').disabled = true;
  document.getElementById('ratingModal').classList.add('open');
}

function cerrarModalReseña() {
  document.getElementById('ratingModal').classList.remove('open');
  reseñaActual.histId = null;
  reseñaActual.estrellas = 0;
}

function inicializarEstrellas() {
  document.querySelectorAll('.star-btn').forEach(function(star, index) {
    star.addEventListener('mouseenter', function(){ iluminarEstrellas(index + 1); });
    star.addEventListener('mouseleave', function(){ iluminarEstrellas(reseñaActual.estrellas); });
    star.addEventListener('click', function(){
      reseñaActual.estrellas = index + 1;
      iluminarEstrellas(reseñaActual.estrellas);
      document.getElementById('btnSubmitReview').disabled = false;
    });
  });
  var textarea = document.getElementById('reviewTextarea');
  if (textarea) textarea.addEventListener('input', actualizarContadorChar);
}

function iluminarEstrellas(n) {
  document.querySelectorAll('.star-btn').forEach(function(star, idx){
    star.classList.toggle('lit', idx < n);
  });
}
function resetearEstrellas() {
  reseñaActual.estrellas = 0;
  iluminarEstrellas(0);
}
function actualizarContadorChar() {
  var textarea = document.getElementById('reviewTextarea');
  var counter  = document.getElementById('charCounter');
  if (!textarea || !counter) return;
  var len = textarea.value.length;
  counter.textContent = len + '/200';
  counter.classList.toggle('warning', len >= 180);
}

function enviarReseña() {
  if (reseñaActual.estrellas === 0) { alert('Por favor selecciona al menos una estrella.'); return; }
  var histId = reseñaActual.histId;
  var texto  = document.getElementById('reviewTextarea').value.trim();
  var reseñas = {};
  try { reseñas = JSON.parse(localStorage.getItem('mt_reseñas_prof') || '{}'); } catch(e){}
  reseñas[histId] = { estrellas: reseñaActual.estrellas, texto: texto, fecha: new Date().toISOString() };
  localStorage.setItem('mt_reseñas_prof', JSON.stringify(reseñas));
  marcarComoReseñado(histId);
  document.getElementById('ratingModal').classList.remove('open');
  setTimeout(function(){ document.getElementById('confirmModal').classList.add('open'); }, 200);
}

function marcarComoReseñado(histId) {
  var badge = document.getElementById('badge-' + histId);
  if (badge) { badge.className = 'badge badge-reseñado'; badge.innerHTML = '<span>⭐</span> Reseñado'; }
  var actionsDiv = document.getElementById('actions-' + histId);
  if (actionsDiv) { var rb = actionsDiv.querySelector('.btn-review'); if(rb) rb.remove(); }
}

function cerrarConfirmModal() {
  document.getElementById('confirmModal').classList.remove('open');
  reseñaActual.histId   = null;
  reseñaActual.estrellas = 0;
}

/* ══════════════════════════════════════════════
   VER DETALLE DE SESIÓN ACEPTADA
   ══════════════════════════════════════════════ */
function verDetalleSolicitud(cardId) {
  var data = SOLICITUDES_DATA[cardId];
  if (!data) {
    /* Intentar recuperar desde localStorage de sesiones */
    var sesiones;
    try { sesiones = JSON.parse(localStorage.getItem(LS_SESIONES) || '[]'); } catch(e) { sesiones = []; }
    var card = document.getElementById(cardId);
    if (card) {
      var nombreEl = card.querySelector('.tutor-name');
      var nombre = nombreEl ? nombreEl.textContent.trim() : '';
      var found = sesiones.find(function(s) { return s.estudiante === nombre; });
      if (found) { abrirSesionDetalle(found); return; }
    }
    return;
  }
  /* Buscar en localStorage la sesión guardada */
  var sesiones;
  try { sesiones = JSON.parse(localStorage.getItem(LS_SESIONES) || '[]'); } catch(e) { sesiones = []; }
  var sesion = sesiones.find(function(s) {
    return s.estudiante === data.estudiante && s.fecha === data.fecha;
  });
  if (sesion) {
    abrirSesionDetalle(sesion, 'detalle');
  } else {
    /* Construir objeto sesión desde SOLICITUDES_DATA */
    abrirSesionDetalle({
      id:         cardId,
      estudiante: data.estudiante,
      iniciales:  data.iniciales,
      color:      data.color,
      materia:    data.materia,
      fecha:      data.fecha,
      hora:       data.hora,
      tipo:       data.tipo,
      precio:     data.precio,
      duracion:   data.duracion || 60
    }, 'detalle');
  }
}
