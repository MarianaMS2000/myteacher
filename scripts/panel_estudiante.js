/* panel_estudiante.js — Panel del estudiante, datos desde la BD */

/* Historial del chat con Manzanita */
var conversacionHistorial = [];
var esperandoRespuesta    = false;

/* Lista de tutores cargada desde la BD para que la IA la use */
var TUTORES_RESUMEN = [];

/* ══════════════════════════════════════════════
   INICIALIZACIÓN
   ══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async function () {

  /* Verificar sesión — solo estudiantes */
  var user = verificarSesion('estudiante');
  if (!user) return;

  /* Cargar tutores reales desde la BD para que la IA los conozca */
  try {
    var resTutores = await fetch('/api/tutores');
    var dataTutores = await resTutores.json();
    TUTORES_RESUMEN = (dataTutores.tutores || []).map(function (t) {
      return {
        id:        t.id,
        nombre:    t.nombre,
        materias:  t.materias ? t.materias.split(',').map(function(m){ return m.trim(); }) : [],
        precio:    '$' + Number(t.precio_min_cop).toLocaleString('es-CO') + '-' + Number(t.precio_max_cop).toLocaleString('es-CO') + ' COP',
        ubicacion: t.ciudad || 'Colombia',
        modalidad: t.modalidad
      };
    });
  } catch(e) { TUTORES_RESUMEN = []; }

  /* Cargar próximas tutorías del estudiante */
  await cargarProximasTutorias();

  /* Enter en el chat */
  var chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensaje(); }
    });
  }
});

/* ── Cargar próximas tutorías desde la BD ── */
async function cargarProximasTutorias() {
  var token = getToken();
  if (!token) return;
  try {
    var res  = await fetch('/api/tutorias', { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await res.json();
    var proximas = (data.tutorias || []).filter(function(t){
      return t.estado === 'confirmada' && t.fecha >= new Date().toISOString().split('T')[0];
    }).slice(0, 3);

    var container = document.getElementById('proximasTutorias');
    if (!container) return;

    if (proximas.length === 0) {
      container.innerHTML = '<p style="color:#888;font-size:.9rem">No tienes tutorías próximas. <a href="tutores.html">Busca un tutor</a></p>';
      return;
    }

    container.innerHTML = proximas.map(function(t){
      return '<div class="sesion-card">' +
        '<div class="sesion-info">' +
          '<strong>' + (t.materia || 'Sin materia') + '</strong>' +
          '<span>' + t.profesor_nombre + '</span>' +
          '<span>' + t.fecha + ' · ' + t.hora_inicio + '</span>' +
        '</div>' +
        '<span class="badge-modalidad">' + t.modalidad + '</span>' +
      '</div>';
    }).join('');
  } catch(e) { console.error('Error cargando tutorías:', e); }
}

/* ══════════════════════════════════════════════
   CHAT CON MANZANITA
   ══════════════════════════════════════════════ */

function sendChip(btn) {
  var text  = btn.textContent.trim();
  var chips = btn.closest('.chat-chips');
  if (chips) chips.style.display = 'none';
  procesarMensajeUsuario(text);
}

function sendMessage() { enviarMensaje(); }

function enviarMensaje() {
  if (esperandoRespuesta) return;
  var input = document.getElementById('chatInput');
  var text  = input ? input.value.trim() : '';
  if (!text) return;
  input.value = '';
  procesarMensajeUsuario(text);
}

function procesarMensajeUsuario(text) {
  conversacionHistorial.push({ role: 'user', content: text });
  agregarBurbujaUsuario(text);
  pedirRespuestaManzanita();
}

function agregarBurbujaUsuario(text) {
  var body = document.getElementById('chatBody');
  if (!body) return;
  var row = document.createElement('div');
  row.style.cssText = 'display:flex;justify-content:flex-end;margin-bottom:10px;';
  row.innerHTML = '<div style="background:#e8f5e9;border-radius:12px 12px 2px 12px;padding:10px 12px;font-size:.83rem;max-width:200px;line-height:1.4;">' + escapeHtmlChat(text) + '</div>';
  body.appendChild(row);
  body.scrollTop = body.scrollHeight;
}

async function pedirRespuestaManzanita() {
  esperandoRespuesta = true;
  var typingId = mostrarIndicadorEscritura();
  try {
    var respuesta = await llamarApiAnthropic();
    conversacionHistorial.push({ role: 'assistant', content: respuesta });
    reemplazarIndicadorEscritura(typingId, respuesta, true);
  } catch (error) {
    var local = generarRespuestaLocal(conversacionHistorial[conversacionHistorial.length - 1].content);
    conversacionHistorial.push({ role: 'assistant', content: local.texto });
    reemplazarIndicadorEscritura(typingId, local.texto, false, local.tutores);
  }
  esperandoRespuesta = false;
}

async function llamarApiAnthropic() {
  /* Construir resumen de tutores desde la BD (no hardcodeado) */
  var tutoresInfo = TUTORES_RESUMEN.map(function (t) {
    return t.nombre + ' (id:' + t.id + ') — materias: ' + t.materias.join(', ') +
           ' — precio: ' + t.precio + ' — ciudad: ' + t.ubicacion + ' — modalidad: ' + t.modalidad;
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
        'Eres Manzanita 🍎, la asistente IA de myTeacher, plataforma colombiana de tutorías. ' +
        'Personalidad cálida, motivadora y cercana. SIEMPRE responde en español. ' +
        'Respuestas cortas: máximo 2-3 oraciones + un emoji. ' +
        'Tutores REALES disponibles ahora mismo en la plataforma:\n' + tutoresInfo + '\n' +
        'Si el estudiante busca un tutor de alguna materia, recomiéndale el tutor correcto por nombre. ' +
        'Para ayuda académica, sugiere agendar una tutoría.',
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

function generarRespuestaLocal(mensaje) {
  var msg = mensaje.toLowerCase();

  /* Buscar tutor por materia en los tutores reales de la BD */
  var mapa = {
    'matemát|cálculo|álgebra|estadístic': ['Matemáticas','Cálculo','Álgebra Lineal','Estadística'],
    'físic|electro|astro': ['Física','Electromagnetismo','Astrofísica'],
    'inglés|english|ielts|toefl': ['Inglés','Conversación','IELTS','TOEFL'],
    'biolog|químic|genétic|bioquím': ['Biología','Química','Genética','Bioquímica'],
    'programac|python|javascript|react|código': ['Programación','Python','JavaScript','React'],
    'histori|filosofí|sociales|literatur': ['Historia','Filosofía','Literatura']
  };

  for (var patron in mapa) {
    if (new RegExp(patron, 'i').test(msg)) {
      var materiasTarget = mapa[patron];
      var tutor = TUTORES_RESUMEN.find(function(t){
        return t.materias.some(function(m){ return materiasTarget.some(function(mt){ return m.toLowerCase().includes(mt.toLowerCase()); }); });
      });
      if (tutor) {
        return {
          texto: '¡Tengo al tutor perfecto! 😊 Te recomiendo a ' + tutor.nombre +
                 ', especialista en ' + tutor.materias[0] + '. Su tarifa es ' + tutor.precio + '. ¿Quieres ver su perfil?',
          tutores: [tutor]
        };
      }
    }
  }

  if (/(hola|buenas|hey)/i.test(msg)) {
    return { texto: '¡Hola! Soy Manzanita 🍎 ¿En qué puedo ayudarte? Puedo recomendarte tutores o resolver dudas sobre la plataforma.', tutores: [] };
  }
  if (/(precio|costo|cuánto|tarifa)/i.test(msg)) {
    return { texto: 'Los precios van desde $10.000 hasta $80.000 COP por sesión según el tutor. 💰 ¿Qué materia te interesa?', tutores: [] };
  }
  if (/(horario|disponibilidad|cuándo)/i.test(msg)) {
    return { texto: 'Los tutores tienen disponibilidad de lunes a domingo de 7am a 10pm. 📅 Revisa el perfil del tutor para ver sus horarios específicos.', tutores: [] };
  }
  return { texto: 'Entendido 😊 Puedo ayudarte a encontrar tutores o responder dudas sobre la plataforma. ¿Qué necesitas?', tutores: [] };
}

function mostrarIndicadorEscritura() {
  var body = document.getElementById('chatBody');
  if (!body) return '';
  var id  = 'typing-' + Date.now();
  var div = document.createElement('div');
  div.className = 'chat-bubble-row';
  div.id = id;
  div.innerHTML =
    '<div class="chat-bubble-apple"><img src="images/manzana.png" onerror="this.textContent=\'🍎\'"></div>' +
    '<div class="chat-bubble"><div class="typing"><span></span><span></span><span></span></div></div>';
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
  return id;
}

function reemplazarIndicadorEscritura(typingId, respuesta, esApiReal, tutores) {
  var elem = document.getElementById(typingId);
  var body = document.getElementById('chatBody');
  if (!elem || !body) return;

  var tutoresHTML = '';
  if (tutores && tutores.length > 0) {
    tutoresHTML = '<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;">';
    tutores.forEach(function (t) {
      tutoresHTML += '<a href="perfil_tutor.html?id=' + t.id + '" style="background:var(--green);color:white;border-radius:100px;padding:5px 13px;font-size:.75rem;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:5px;"><i class="fa-solid fa-chalkboard-user"></i> Ver a ' + t.nombre + '</a>';
    });
    tutoresHTML += '</div>';
  }

  elem.innerHTML =
    '<div class="chat-bubble-apple"><img src="images/manzana.png" onerror="this.textContent=\'🍎\'"></div>' +
    '<div>' +
      '<div style="font-size:.72rem;color:#6b7280;margin-bottom:4px;">Manzanita</div>' +
      '<div class="chat-bubble">' + escapeHtmlChat(respuesta) + '</div>' +
      tutoresHTML +
    '</div>';
  elem.removeAttribute('id');
  body.scrollTop = body.scrollHeight;
}

function escapeHtmlChat(str) {
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}
