/* =============================================
   manzanita_profesor.js — Chat IA Manzanita
   adaptado para el panel del profesor.
   Misma lógica que panel_estudiante.js pero
   con contexto y respuestas orientadas al docente.
   ============================================= */

/* ── HISTORIAL DE CONVERSACIÓN ── */
var conversacionHistorial = [];

/* ── FLAG para evitar doble envío ── */
var esperandoRespuesta = false;

/* ══════════════════════════════════════════════
   INICIALIZACIÓN
   ══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  var chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensaje();
      }
    });
  }
});

/* ══════════════════════════════════════════════
   CHAT CON MANZANITA — UI
   ══════════════════════════════════════════════ */

/**
 * Maneja click en chips de opciones rápidas.
 * @param {HTMLElement} btn
 */
function sendChip(btn) {
  var text = btn.textContent.trim();
  var chips = btn.closest('.chat-chips');
  if (chips) chips.style.display = 'none';
  procesarMensajeUsuario(text);
}

/* Alias para compatibilidad con onclick en el HTML */
function sendMessage() { enviarMensaje(); }

/**
 * Recoge texto del input y lo procesa.
 */
function enviarMensaje() {
  if (esperandoRespuesta) return;
  var input = document.getElementById('chatInput');
  var text  = input ? input.value.trim() : '';
  if (!text) return;
  input.value = '';
  procesarMensajeUsuario(text);
}

/**
 * Muestra burbuja de usuario y pide respuesta a la IA.
 * @param {string} text
 */
function procesarMensajeUsuario(text) {
  conversacionHistorial.push({ role: 'user', content: text });
  agregarBurbujaUsuario(text);
  pedirRespuestaManzanita();
}

/**
 * Inserta burbuja verde del usuario en el chat.
 * @param {string} text
 */
function agregarBurbujaUsuario(text) {
  var body = document.getElementById('chatBody');
  if (!body) return;
  var row = document.createElement('div');
  row.style.cssText = 'display:flex;justify-content:flex-end;margin-bottom:10px;';
  row.innerHTML =
    '<div style="background:#e8f5e9;border-radius:12px 12px 2px 12px;' +
    'padding:10px 12px;font-size:.83rem;max-width:200px;line-height:1.4;">' +
    escapeHtmlChat(text) + '</div>';
  body.appendChild(row);
  body.scrollTop = body.scrollHeight;
}

/* ══════════════════════════════════════════════
   IA MANZANITA — LÓGICA PARA EL PROFESOR
   ══════════════════════════════════════════════ */

/**
 * Genera la respuesta de Manzanita.
 * Primero intenta la API de Anthropic.
 * Si falla, usa respuestas inteligentes locales.
 */
async function pedirRespuestaManzanita() {
  esperandoRespuesta = true;
  var typingId = mostrarIndicadorEscritura();

  try {
    var respuesta = await llamarApiAnthropic();
    conversacionHistorial.push({ role: 'assistant', content: respuesta });
    reemplazarIndicadorEscritura(typingId, respuesta, true);
  } catch (error) {
    /* Fallback: lógica local inteligente para el profesor */
    var respuestaLocal = generarRespuestaLocalProfesor(
      conversacionHistorial[conversacionHistorial.length - 1].content
    );
    conversacionHistorial.push({ role: 'assistant', content: respuestaLocal.texto });
    reemplazarIndicadorEscritura(typingId, respuestaLocal.texto, false);
  }

  esperandoRespuesta = false;
}

/**
 * Llama a la API de Anthropic con sistema de Manzanita
 * orientado al docente.
 */
async function llamarApiAnthropic() {
  var response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 350,
      system:
        'Eres Manzanita 🍎, la asistente IA amigable de myTeacher, una plataforma colombiana de tutorías. ' +
        'Estás hablando con un PROFESOR/TUTOR registrado en la plataforma, no con un estudiante. ' +
        'Tu personalidad es cálida, motivadora y cercana. SIEMPRE responde en español. ' +
        'Respuestas cortas: máximo 2-3 oraciones + un emoji ocasional. ' +
        'Puedes ayudar al profesor con: consejos pedagógicos, estrategias para atraer más estudiantes, ' +
        'cómo mejorar su perfil, cómo fijar precios competitivos, técnicas de enseñanza efectivas, ' +
        'cómo manejar su agenda, y cualquier duda sobre la plataforma myTeacher. ' +
        'Si el profesor pregunta sobre estadísticas, remítelo a la sección de inicio de su panel. ' +
        'Sé siempre alentador y enfocado en el éxito del docente.',
      messages: conversacionHistorial
    })
  });

  if (!response.ok) throw new Error('API error ' + response.status);
  var data = await response.json();
  var texto = '';
  (data.content || []).forEach(function (b) { if (b.type === 'text') texto += b.text; });
  if (!texto) throw new Error('Respuesta vacía');
  return texto;
}

/**
 * Respuestas locales inteligentes para el profesor
 * cuando la API no está disponible.
 * @param {string} mensaje
 * @returns {{ texto: string }}
 */
function generarRespuestaLocalProfesor(mensaje) {
  var msg = mensaje.toLowerCase();

  /* ── SALUDOS ── */
  if (/(hola|buenas|hey|hi|qué tal|que tal)/i.test(msg)) {
    return { texto: '¡Hola profe! Soy Manzanita 🍎 tu asistente en myTeacher. Puedo ayudarte con consejos de enseñanza, cómo mejorar tu perfil o cualquier duda sobre la plataforma. ¿En qué te apoyo hoy?' };
  }

  /* ── ESTADÍSTICAS ── */
  if (/(estadística|estadistica|ganancia|ingreso|reputación|reputacion|calificación|calificacion)/i.test(msg)) {
    return { texto: 'Tus estadísticas están en la parte superior del panel de inicio 📊. Ahí puedes ver tus ganancias del mes, estudiantes activos, reputación y clases impartidas. ¡Todo en tiempo real!' };
  }

  /* ── ATRAER ESTUDIANTES ── */
  if (/(atraer|conseguir|más estudiantes|mas estudiantes|crecer|visibilidad)/i.test(msg)) {
    return { texto: '¡La clave está en tu perfil! 🌟 Un buen foto, descripción detallada y precios competitivos te dan más visibilidad. También responder rápido a los mensajes aumenta mucho tu tasa de conversión.' };
  }

  /* ── PRECIOS ── */
  if (/(precio|costo|cuánto|cuanto|tarifa|valor|cobrar)/i.test(msg)) {
    return { texto: 'En myTeacher los tutores más exitosos cobran entre 30.000 y 80.000 COP por sesión según su experiencia 💰. Te recomiendo empezar con un precio competitivo y subirlo a medida que acumules buenas reseñas.' };
  }

  /* ── CONSEJOS PEDAGOGICOS ── */
  if (/(consejo|tip|técnica|tecnica|enseñar|ensenar|clase|metodología|metodologia)/i.test(msg)) {
    return { texto: 'Un gran tip para clases virtuales: empieza siempre con una pregunta que active los conocimientos previos del estudiante 🎯. Luego usa ejemplos del mundo real. ¡Los estudiantes retienen mucho más así!' };
  }

  /* ── AGENDA / DISPONIBILIDAD ── */
  if (/(agenda|horario|disponibilidad|sesión|sesion|calendario)/i.test(msg)) {
    return { texto: 'Puedes gestionar tu disponibilidad desde "Mi agenda" en el menú lateral 📅. Te recomiendo tener al menos 3 franjas horarias disponibles por semana para no perder solicitudes de nuevos estudiantes.' };
  }

  /* ── PERFIL ── */
  if (/(perfil|descripción|descripcion|foto|presentación|presentacion)/i.test(msg)) {
    return { texto: 'Tu perfil es tu carta de presentación 🌿. Asegúrate de tener una foto profesional, una descripción que muestre tu experiencia y al menos 3 materias bien definidas. ¡Eso triplica las solicitudes!' };
  }

  /* ── MENSAJES ── */
  if (/(mensaje|responder|estudiante me escribió|estudiante me escribio|comunicación)/i.test(msg)) {
    return { texto: 'Responder en menos de 2 horas te da un badge de "Respuesta rápida" en la plataforma 💬. Eso genera mucha más confianza en los estudiantes que están evaluando tutores.' };
  }

  /* ── RESPUESTA GENÉRICA ── */
  return { texto: 'Entendido 😊 Puedo ayudarte con consejos pedagógicos, estrategias para crecer en la plataforma, manejo de tu agenda o cualquier duda sobre myTeacher. ¿Qué necesitas?' };
}

/* ══════════════════════════════════════════════
   ANIMACIONES DEL CHAT
   ══════════════════════════════════════════════ */

function mostrarIndicadorEscritura() {
  var body = document.getElementById('chatBody');
  if (!body) return '';
  var id  = 'typing-' + Date.now();
  var div = document.createElement('div');
  div.className = 'chat-bubble-row';
  div.id = id;
  div.innerHTML =
    '<div class="chat-bubble-apple">' +
      '<img src="images/manzana.png" onerror="this.textContent=\'🍎\'">' +
    '</div>' +
    '<div class="chat-bubble">' +
      '<div class="typing"><span></span><span></span><span></span></div>' +
    '</div>';
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
  return id;
}

function reemplazarIndicadorEscritura(typingId, respuesta, esApiReal) {
  var elem = document.getElementById(typingId);
  var body = document.getElementById('chatBody');
  if (!elem || !body) return;

  elem.innerHTML =
    '<div class="chat-bubble-apple">' +
      '<img src="images/manzana.png" onerror="this.textContent=\'🍎\'">' +
    '</div>' +
    '<div>' +
      '<div style="font-size:.72rem;color:#6b7280;margin-bottom:4px;">Manzanita</div>' +
      '<div class="chat-bubble">' + escapeHtmlChat(respuesta) + '</div>' +
    '</div>';
  elem.removeAttribute('id');
  body.scrollTop = body.scrollHeight;
}

/* ══════════════════════════════════════════════
   UTILIDADES
   ══════════════════════════════════════════════ */

function escapeHtmlChat(str) {
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}
