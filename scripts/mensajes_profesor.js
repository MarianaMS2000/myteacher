/* =============================================
   mensajes_profesor.js — Lógica de la pantalla
   de mensajes del profesor. Muestra la lista de
   conversaciones y permite chatear con cada
   estudiante.
   ============================================= */

/* ── CONVERSACIONES SIMULADAS ── */
var CONVERSACIONES = [
  {
    id: 1,
    nombre: 'Valentina Pérez',
    iniciales: 'VP',
    color: '#059669',
    materia: 'Cálculo Integral',
    estado: 'Estudiante activa',
    unread: true,
    mensajes: [
      { tipo: 'recv', texto: 'Hola profe, ¿podemos reagendar la clase del jueves?', hora: '9:45 AM', fecha: 'Hoy' },
      { tipo: 'sent', texto: 'Claro, ¿te viene bien el viernes a las 10 AM?', hora: '10:02 AM', fecha: 'Hoy' },
      { tipo: 'recv', texto: '¡Perfecto! Ahí estaré. Muchas gracias 😊', hora: '10:04 AM', fecha: 'Hoy' },
      { tipo: 'recv', texto: '¿Profe, podemos reagendar la clase del jueves?', hora: 'hace 5 min', fecha: 'Hoy' },
    ]
  },
  {
    id: 2,
    nombre: 'Felipe Gómez',
    iniciales: 'FG',
    color: '#d97706',
    materia: 'Estadística',
    estado: 'Estudiante activo',
    unread: false,
    mensajes: [
      { tipo: 'recv', texto: 'Buenos días profe, tengo una duda sobre la tarea de probabilidad.', hora: '8:00 AM', fecha: 'Ayer' },
      { tipo: 'sent', texto: '¡Hola Felipe! Dime, ¿en qué parte tienes la duda?', hora: '8:15 AM', fecha: 'Ayer' },
      { tipo: 'recv', texto: 'En el ejercicio 3, no entiendo cómo se calcula la varianza del estimador.', hora: '8:18 AM', fecha: 'Ayer' },
      { tipo: 'sent', texto: 'En la clase de hoy lo vemos con detalle. ¡Prepara las preguntas!', hora: '8:25 AM', fecha: 'Ayer' },
      { tipo: 'recv', texto: 'Muchas gracias por la clase de hoy, me quedó todo claro 🙌', hora: '2:30 PM', fecha: 'Ayer' },
    ]
  },
  {
    id: 3,
    nombre: 'Isabella Torres',
    iniciales: 'IT',
    color: '#7c3aed',
    materia: 'Álgebra Lineal',
    estado: 'Estudiante activa',
    unread: true,
    mensajes: [
      { tipo: 'recv', texto: '¿Tiene disponibilidad para el sábado en la mañana?', hora: '7:20 PM', fecha: 'Ayer' },
    ]
  },
  {
    id: 4,
    nombre: 'Carlos Lizarazo',
    iniciales: 'CL',
    color: '#4a7a30',
    materia: 'Cálculo Diferencial',
    estado: 'Estudiante activo',
    unread: false,
    mensajes: [
      { tipo: 'sent', texto: 'Hola Carlos, te recuerdo que mañana tenemos clase a las 10 AM.', hora: '6:00 PM', fecha: 'Ayer' },
      { tipo: 'recv', texto: '¡Anotado profe! Ahí estaré puntual.', hora: '6:35 PM', fecha: 'Ayer' },
    ]
  },
  {
    id: 5,
    nombre: 'Julián Rodríguez',
    iniciales: 'JR',
    color: '#db2777',
    materia: 'Física Mecánica',
    estado: 'Por confirmar sesión',
    unread: true,
    mensajes: [
      { tipo: 'recv', texto: 'Buenas profe, quiero confirmar si la sesión de hoy a las 5 pm sigue en pie.', hora: '11:00 AM', fecha: 'Hoy' },
    ]
  },
];

/* Conversación actualmente seleccionada */
var convActual = CONVERSACIONES[0];

/* ══════════════════════════════════════════════
   INICIALIZACIÓN
   ══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {

  renderConversaciones(CONVERSACIONES);

  /* Abrir la conversación guardada (desde panel o estudiantes), o la primera por defecto */
  var convGuardadaId = localStorage.getItem('mt_conv_abierta');
  var convInicial = CONVERSACIONES[0];
  if (convGuardadaId) {
    var found = CONVERSACIONES.filter(function(c){ return String(c.id) === String(convGuardadaId); });
    if (found.length) convInicial = found[0];
    localStorage.removeItem('mt_conv_abierta');
  }
  seleccionarConversacion(convInicial);

  /* Enter en el input envía el mensaje */
  var input = document.getElementById('msgInput');
  if (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensaje();
      }
    });
  }

  actualizarBadgeNoLeidos();
});

/* ══════════════════════════════════════════════
   LISTA DE CONVERSACIONES
   ══════════════════════════════════════════════ */

/**
 * Renderiza la lista de conversaciones en el panel izquierdo.
 * @param {Array} lista
 */
function renderConversaciones(lista) {
  var container = document.getElementById('conversacionesContainer');
  if (!container) return;
  container.innerHTML = '';

  lista.forEach(function (conv) {
    var ultimoMsg = conv.mensajes[conv.mensajes.length - 1];
    var item = document.createElement('div');
    item.className = 'conv-item' + (conv.unread ? ' unread' : '') + (conv.id === convActual.id ? ' active' : '');
    item.dataset.convId = conv.id;

    item.innerHTML =
      '<div class="conv-avatar" style="background:' + conv.color + ';">' + conv.iniciales + '</div>' +
      '<div class="conv-info">' +
        '<div class="conv-name">' + escapeHtml(conv.nombre) + '</div>' +
        '<div class="conv-preview">' +
          (ultimoMsg.tipo === 'sent' ? 'Tú: ' : '') +
          escapeHtml(ultimoMsg.texto) +
        '</div>' +
      '</div>' +
      '<div class="conv-meta">' +
        '<div class="conv-time">' + ultimoMsg.hora + '</div>' +
        (conv.unread ? '<div class="conv-unread-dot"></div>' : '') +
      '</div>';

    item.addEventListener('click', function () {
      seleccionarConversacion(conv);
    });

    container.appendChild(item);
  });
}

/**
 * Selecciona una conversación y muestra sus mensajes.
 * @param {Object} conv
 */
function seleccionarConversacion(conv) {
  convActual = conv;

  /* Marcar como leída */
  conv.unread = false;
  actualizarBadgeNoLeidos();

  /* Actualizar encabezado del chat */
  var avatarEl = document.getElementById('cwhAvatar');
  var nameEl   = document.getElementById('cwhName');
  var metaEl   = document.getElementById('cwhMeta');
  if (avatarEl) { avatarEl.textContent = conv.iniciales; avatarEl.style.background = conv.color; }
  if (nameEl)   nameEl.textContent = conv.nombre;
  if (metaEl)   metaEl.textContent = conv.materia + ' · ' + conv.estado;

  /* Marcar activa en la lista */
  document.querySelectorAll('.conv-item').forEach(function (el) {
    el.classList.remove('active', 'unread');
    if (parseInt(el.dataset.convId) === conv.id) el.classList.add('active');
  });

  /* Renderizar mensajes */
  renderMensajes(conv.mensajes);

  /* Enfocar input */
  var input = document.getElementById('msgInput');
  if (input) input.focus();
}

/* ══════════════════════════════════════════════
   MENSAJES DEL CHAT
   ══════════════════════════════════════════════ */

/**
 * Renderiza los mensajes de la conversación activa.
 * @param {Array} mensajes
 */
function renderMensajes(mensajes) {
  var area = document.getElementById('chatMsgs');
  if (!area) return;
  area.innerHTML = '';

  var fechaAnterior = '';
  mensajes.forEach(function (msg) {
    /* Separador de fecha */
    if (msg.fecha !== fechaAnterior) {
      fechaAnterior = msg.fecha;
      var sep = document.createElement('div');
      sep.className = 'msg-date-sep';
      sep.textContent = msg.fecha;
      area.appendChild(sep);
    }

    var wrap = document.createElement('div');
    wrap.className = 'msg-bubble-wrap ' + msg.tipo;
    wrap.innerHTML =
      '<div class="msg-bubble">' + escapeHtml(msg.texto) + '</div>' +
      '<div class="msg-time">' + msg.hora + '</div>';
    area.appendChild(wrap);
  });

  area.scrollTop = area.scrollHeight;
}

/**
 * Envía el mensaje escrito en el input.
 */
function enviarMensaje() {
  var input = document.getElementById('msgInput');
  var text  = input ? input.value.trim() : '';
  if (!text || !convActual) return;
  input.value = '';

  var ahora = new Date();
  var hora  = ahora.getHours() + ':' + String(ahora.getMinutes()).padStart(2, '0') + ' ' + (ahora.getHours() < 12 ? 'AM' : 'PM');

  var nuevoMsg = { tipo: 'sent', texto: text, hora: hora, fecha: 'Hoy' };
  convActual.mensajes.push(nuevoMsg);

  /* Agregar burbuja al área sin re-renderizar todo */
  var area = document.getElementById('chatMsgs');
  if (area) {
    var wrap = document.createElement('div');
    wrap.className = 'msg-bubble-wrap sent';
    wrap.innerHTML =
      '<div class="msg-bubble">' + escapeHtml(text) + '</div>' +
      '<div class="msg-time">' + hora + '</div>';
    area.appendChild(wrap);
    area.scrollTop = area.scrollHeight;
  }

  /* Actualizar preview en lista */
  renderConversaciones(CONVERSACIONES);
}

/* ── BÚSQUEDA DE CONVERSACIONES (global, llamada desde oninput) ── */
function buscarConversaciones(query) {
  var q = query.toLowerCase().trim();
  var filtradas = q
    ? CONVERSACIONES.filter(function (c) { return c.nombre.toLowerCase().includes(q) || c.materia.toLowerCase().includes(q); })
    : CONVERSACIONES;
  renderConversaciones(filtradas);
}

/* ── BADGE DE NO LEÍDOS ── */
function actualizarBadgeNoLeidos() {
  var badge = document.getElementById('unreadCount');
  if (!badge) return;
  var noLeidos = CONVERSACIONES.filter(function (c) { return c.unread; }).length;
  badge.textContent = noLeidos;
  badge.style.display = noLeidos === 0 ? 'none' : '';
}

/* ── UTILIDADES ── */
function escapeHtml(str) {
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}
