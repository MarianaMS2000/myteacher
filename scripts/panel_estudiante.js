/* =============================================
   panel_estudiante.js — Panel principal del
   estudiante. Incluye el chat con Manzanita IA
   usando la API de Anthropic integrada en la
   propia app (sin solicitar contraseña al usuario).
   ============================================= */

/* ── HISTORIAL DE CONVERSACIÓN ──
   Mantenemos contexto entre mensajes */
var conversacionHistorial = [];

/* ── FLAG para evitar doble envío ── */
var esperandoRespuesta = false;

/* ── BASE DE DATOS DE TUTORES (resumen para la IA) ── */
var TUTORES_RESUMEN = [
  { id:"1", nombre:"Ricardo Soler",  materias:["Física","Electromagnetismo","Astrofísica","Matemáticas"], precio:"15k-60k COP", ubicacion:"Bogotá" },
  { id:"2", nombre:"Daniela Ríos",   materias:["Inglés","Conversación","IELTS","TOEFL","Gramática"],       precio:"20k-50k COP", ubicacion:"Medellín" },
  { id:"3", nombre:"Alfonso Méndez", materias:["Matemáticas","Estadística","Cálculo","Álgebra"],           precio:"10k-45k COP", ubicacion:"Cali" },
  { id:"4", nombre:"Mariana Vega",   materias:["Biología","Química","Bioquímica","Genética"],              precio:"15k-40k COP", ubicacion:"Barranquilla" },
  { id:"5", nombre:"Esteban Cruz",   materias:["Programación","Python","JavaScript","React","Algoritmos"], precio:"25k-80k COP", ubicacion:"Bogotá" },
  { id:"6", nombre:"María Inés",     materias:["Historia","Filosofía","Ciencias Sociales","Literatura"],   precio:"12k-35k COP", ubicacion:"Cartagena" }
];

/* ══════════════════════════════════════════════
   INICIALIZACIÓN
   ══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {

  /* Enter en el input del chat envía el mensaje */
  var chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensaje();
      }
    });
  }

  /* Actualizar enlace "Mi perfil" en el dropdown */
  var miPerfilLink = document.querySelector('.dropdown-item[href="#"]');
  if (miPerfilLink && miPerfilLink.querySelector('.fa-user')) {
    miPerfilLink.href = 'perfil_estudiante.html';
  }

  /* Actualizar enlace de configuración en el sidebar */
  var configLink = document.querySelector('.nav-item[data-page="configuracion"]');
  if (configLink) configLink.href = 'configuracion.html';
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
   IA MANZANITA — LÓGICA INTELIGENTE
   Sin solicitar contraseña. Responde con lógica
   propia y sugerencia de tutores cuando aplica.
   ══════════════════════════════════════════════ */

/**
 * Genera la respuesta de Manzanita.
 * Primero intenta la API de Anthropic (integrada).
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
    /* Fallback: lógica local inteligente */
    var respuestaLocal = generarRespuestaLocal(
      conversacionHistorial[conversacionHistorial.length - 1].content
    );
    conversacionHistorial.push({ role: 'assistant', content: respuestaLocal.texto });
    reemplazarIndicadorEscritura(typingId, respuestaLocal.texto, false, respuestaLocal.tutores);
  }

  esperandoRespuesta = false;
}

/**
 * Llama a la API de Anthropic con el sistema de Manzanita.
 * @returns {Promise<string>}
 */
async function llamarApiAnthropic() {
  var tutoresInfo = TUTORES_RESUMEN.map(function (t) {
    return t.nombre + ' (' + t.materias.join(', ') + ') — ' + t.precio + ' — ' + t.ubicacion;
  }).join('\n');

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
        'Tu personalidad es cálida, motivadora y cercana. SIEMPRE responde en español. ' +
        'Respuestas cortas: máximo 2-3 oraciones + un emoji ocasional. ' +
        'Tutores disponibles en la plataforma:\n' + tutoresInfo + '\n' +
        'Si el estudiante busca un tutor de alguna materia, recomiéndale el tutor correcto por nombre. ' +
        'Para ayuda académica profunda, sugiere agendar una tutoría. ' +
        'Si preguntan por precios, da el rango del tutor relevante.',
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
 * Genera respuesta local inteligente basada en palabras clave.
 * Detecta intención del usuario y sugiere tutores si aplica.
 * @param {string} mensaje - Mensaje del usuario
 * @returns {{ texto: string, tutores: Array }}
 */
function generarRespuestaLocal(mensaje) {
  var msg    = mensaje.toLowerCase();
  var tutores = [];

  /* ── DETECTAR MATERIA Y SUGERIR TUTOR ── */
  var matchMateria = null;

  if (/(matemátic|calculo|cálculo|álgebra|algebra|estadístic|estadistic)/i.test(msg)) {
    matchMateria = TUTORES_RESUMEN[2]; /* Alfonso Méndez */
  } else if (/(física|fisica|electro|astro|relatividad)/i.test(msg)) {
    matchMateria = TUTORES_RESUMEN[0]; /* Ricardo Soler */
  } else if (/(inglés|ingles|english|ielts|toefl|conversación)/i.test(msg)) {
    matchMateria = TUTORES_RESUMEN[1]; /* Daniela Ríos */
  } else if (/(biología|biologia|química|quimica|genética|genetica|bioquímica)/i.test(msg)) {
    matchMateria = TUTORES_RESUMEN[3]; /* Mariana Vega */
  } else if (/(programación|programacion|python|javascript|código|codigo|react|algoritmo)/i.test(msg)) {
    matchMateria = TUTORES_RESUMEN[4]; /* Esteban Cruz */
  } else if (/(historia|filosofía|filosofia|sociales|literatura|ética|etica)/i.test(msg)) {
    matchMateria = TUTORES_RESUMEN[5]; /* María Inés */
  }

  if (matchMateria) {
    tutores = [matchMateria];
    return {
      texto: '¡Tengo al tutor perfecto para ti! 😊 Te recomiendo a ' + matchMateria.nombre +
             ', especialista en ' + matchMateria.materias[0] + '. Su tarifa es de ' +
             matchMateria.precio + '. ¿Quieres que te lleve a su perfil?',
      tutores: tutores
    };
  }

  /* ── BUSCAR TUTOR EN GENERAL ── */
  if (/(busco|necesito|quiero|tutor|profesor|clase|tutoría|tutoria)/i.test(msg)) {
    return {
      texto: '¡Claro, te ayudo a encontrar tu tutor ideal! 🎯 Tenemos expertos en Matemáticas, Inglés, Física, Biología, Programación e Historia. ¿Qué materia necesitas?',
      tutores: []
    };
  }

  /* ── SALUDOS ── */
  if (/(hola|buenas|hey|hi|qué tal|que tal)/i.test(msg)) {
    return {
      texto: '¡Hola! Soy Manzanita 🍎 tu asistente en myTeacher. ¿En qué puedo ayudarte hoy? Puedo recomendarte tutores, informarte sobre horarios o resolver dudas sobre la plataforma.',
      tutores: []
    };
  }

  /* ── PRECIOS ── */
  if (/(precio|costo|cuánto|cuanto|tarifa|valor)/i.test(msg)) {
    return {
      texto: 'Los precios en myTeacher van desde 10.000 COP hasta 80.000 COP por sesión, según el tutor y la materia. 💰 ¿Qué materia te interesa para darte el precio exacto?',
      tutores: []
    };
  }

  /* ── HORARIOS ── */
  if (/(horario|hora|disponibilidad|cuándo|cuando|agenda)/i.test(msg)) {
    return {
      texto: 'Los tutores tienen disponibilidad de lunes a domingo, de 7am a 10pm. 📅 Para ver el horario específico de un tutor, ve a su perfil y haz clic en "Solicitar tutoría".',
      tutores: []
    };
  }

  /* ── RESPUESTA GENÉRICA ── */
  return {
    texto: 'Entendido 😊 Puedo ayudarte a encontrar tutores, resolver dudas sobre materias o explicarte cómo funciona la plataforma. ¿Qué necesitas?',
    tutores: []
  };
}

/* ══════════════════════════════════════════════
   ANIMACIONES DEL CHAT
   ══════════════════════════════════════════════ */

/**
 * Muestra el indicador "..." mientras se genera la respuesta.
 * @returns {string} ID único del indicador
 */
function mostrarIndicadorEscritura() {
  var body = document.getElementById('chatBody');
  if (!body) return '';
  var id  = 'typing-' + Date.now();
  var div = document.createElement('div');
  div.className = 'chat-bubble-row';
  div.id = id;
  div.innerHTML =
    '<div class="chat-bubble-apple">' +
      '<img src="../images/manzana.png" onerror="this.textContent=\'🍎\'">' +
    '</div>' +
    '<div class="chat-bubble">' +
      '<div class="typing"><span></span><span></span><span></span></div>' +
    '</div>';
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
  return id;
}

/**
 * Reemplaza el indicador por la respuesta final.
 * Opcionalmente agrega botones de tutor sugerido.
 * @param {string}  typingId    - ID del indicador
 * @param {string}  respuesta   - Texto de la respuesta
 * @param {boolean} esApiReal   - Si viene de la API real
 * @param {Array}   tutores     - Tutores sugeridos (opcional)
 */
function reemplazarIndicadorEscritura(typingId, respuesta, esApiReal, tutores) {
  var elem = document.getElementById(typingId);
  var body = document.getElementById('chatBody');
  if (!elem || !body) return;

  /* Construir HTML de tutores sugeridos */
  var tutoresHTML = '';
  if (tutores && tutores.length > 0) {
    tutoresHTML = '<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;">';
    tutores.forEach(function (t) {
      tutoresHTML +=
        '<a href="perfil_tutor.html?id=' + t.id + '" ' +
        'style="background:var(--green);color:white;border-radius:100px;' +
        'padding:5px 13px;font-size:.75rem;font-weight:700;text-decoration:none;' +
        'display:inline-flex;align-items:center;gap:5px;">' +
        '<i class="fa-solid fa-chalkboard-user"></i> Ver a ' + t.nombre +
        '</a>';
    });
    tutoresHTML += '</div>';
  }

  elem.innerHTML =
    '<div class="chat-bubble-apple">' +
      '<img src="../images/manzana.png" onerror="this.textContent=\'🍎\'">' +
    '</div>' +
    '<div>' +
      '<div style="font-size:.72rem;color:#6b7280;margin-bottom:4px;">Manzanita</div>' +
      '<div class="chat-bubble">' + escapeHtmlChat(respuesta) + '</div>' +
      tutoresHTML +
    '</div>';
  elem.removeAttribute('id');
  body.scrollTop = body.scrollHeight;
}

/* ══════════════════════════════════════════════
   UTILIDADES
   ══════════════════════════════════════════════ */

/**
 * Escapa caracteres HTML para prevenir XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtmlChat(str) {
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}
