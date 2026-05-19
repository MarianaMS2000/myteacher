/* solicitudes_profesor.js — Gestión de solicitudes reales desde la API */

var _solicitudesData = [];
var reseñaActual = { histId: null, estrellas: 0 };

/* ══════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async function () {
  inicializarTabs();
  inicializarEstrellas();
  await cargarSolicitudesAPI();
  await cargarTutoriasProfesor();
});

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

/* ── Cargar solicitudes desde la API ── */
async function cargarSolicitudesAPI() {
  var token = typeof getToken === 'function' ? getToken() : null;
  if (!token) return;

  var containerPend = document.getElementById('tab-pendientes');
  var containerAcep = document.getElementById('tab-proximas') || document.getElementById('tab-aceptadas');

  try {
    var res  = await fetch('/api/solicitudes', { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await res.json();
    var sols = data.solicitudes || [];
    _solicitudesData = sols;

    var pendientes = sols.filter(function(s){ return s.estado === 'enviada' || s.estado === 'pendiente'; });
    var aceptadas  = sols.filter(function(s){ return s.estado === 'aceptada'; });
    var rechazadas = sols.filter(function(s){ return s.estado === 'rechazada'; });

    if (containerPend) {
      var realDiv = containerPend.querySelector('.real-list');
      if (!realDiv) { realDiv = document.createElement('div'); realDiv.className = 'real-list'; containerPend.prepend(realDiv); }
      realDiv.innerHTML = '';
      if (pendientes.length === 0) {
        realDiv.innerHTML = '<p style="color:#9ca3af;padding:20px 0;font-size:.9rem;">No tienes solicitudes pendientes.</p>';
      } else {
        pendientes.forEach(function(s) { realDiv.appendChild(crearCardPendiente(s)); });
      }
    }

    if (containerAcep) {
      var realDivA = containerAcep.querySelector('.real-list');
      if (!realDivA) { realDivA = document.createElement('div'); realDivA.className = 'real-list'; containerAcep.prepend(realDivA); }
      realDivA.innerHTML = '';
      var respondidas = aceptadas.concat(rechazadas);
      if (respondidas.length === 0) {
        realDivA.innerHTML = '<p style="color:#9ca3af;padding:20px 0;font-size:.9rem;">Aún no has respondido ninguna solicitud.</p>';
      } else {
        respondidas.forEach(function(s) { realDivA.appendChild(crearCardRespondida(s)); });
      }
    }

    /* Actualizar contadores en tabs */
    var badgePend = document.getElementById('badge-pendientes');
    if (badgePend) badgePend.textContent = pendientes.length;
    var badgeAcep = document.getElementById('badge-aceptadas');
    if (badgeAcep) badgeAcep.textContent = aceptadas.length;

  } catch(e) {
    console.error('Error cargando solicitudes:', e);
  }
}

/* ── Card de solicitud PENDIENTE ── */
function crearCardPendiente(s) {
  var div = document.createElement('div');
  div.className = 'solicitud-card card-pend';
  div.id = 'sol-' + s.id;

  var nombre = s.estudiante_nombre || 'Estudiante';
  var foto   = s.estudiante_foto || '';
  var iniciales = nombre.split(' ').map(function(x){ return x[0]; }).join('').toUpperCase().slice(0,2);
  var avatarHtml = foto
    ? '<img src="' + esc(foto) + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display=\'none\'">'
    : iniciales;

  var colores = ['#4a7a30','#7c3aed','#db2777','#059669','#d97706','#1d4ed8'];
  var idx = 0; for (var i = 0; i < nombre.length; i++) idx += nombre.charCodeAt(i);
  var color = colores[idx % colores.length];

  var fecha  = formatFecha(s.fecha_prop || s.fecha || '');
  var hora   = formatHora(s.hora_prop  || s.hora  || '');
  var mat    = s.materia || s.materia_nombre || '';
  var mod    = s.modalidad || 'virtual';
  var durMin = s.duracion_min || 60;
  var precio = s.precio_cop ? '$' + Number(s.precio_cop).toLocaleString('es-CO') : '';

  div.innerHTML =
    '<div class="sol-header">' +
      '<div class="sol-avatar" style="background:' + color + ';color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;width:52px;height:52px;border-radius:50%;overflow:hidden;flex-shrink:0;">' + avatarHtml + '</div>' +
      '<div class="sol-info">' +
        '<div class="sol-nombre">' + esc(nombre) + '</div>' +
        (mat ? '<div class="sol-materia"><i class="fa-solid fa-circle" style="color:#4a7a30;font-size:.4rem;vertical-align:middle;"></i> ' + esc(mat) + '</div>' : '') +
        '<div class="sol-meta">' +
          (fecha ? '<span><i class="fa-regular fa-calendar"></i> ' + esc(fecha) + '</span>' : '') +
          (hora  ? '<span><i class="fa-regular fa-clock"></i> '    + esc(hora)  + '</span>' : '') +
          '<span><i class="fa-solid fa-' + (mod === 'presencial' ? 'location-dot' : 'video') + '"></i> ' + esc(mod.charAt(0).toUpperCase() + mod.slice(1)) + '</span>' +
          '<span><i class="fa-solid fa-hourglass-half"></i> ' + durMin + ' min</span>' +
          (precio ? '<span style="color:#4a7a30;font-weight:700;">' + precio + '</span>' : '') +
        '</div>' +
        (s.mensaje ? '<div class="sol-mensaje"><i class="fa-solid fa-quote-left" style="color:#4a7a30;font-size:.75rem;margin-right:6px;"></i>' + esc(s.mensaje) + '</div>' : '') +
      '</div>' +
    '</div>' +
    '<div class="sol-actions">' +
      '<button class="btn-aceptar" onclick="aceptarSolicitud(' + s.id + ', this)">' +
        '<i class="fa-solid fa-check"></i> Aceptar</button>' +
      '<button class="btn-rechazar" onclick="rechazarSolicitud(' + s.id + ', this)">' +
        '<i class="fa-solid fa-xmark"></i> Rechazar</button>' +
    '</div>';

  return div;
}

/* ── Card de solicitud RESPONDIDA (Aceptadas / Rechazadas) — diseño completo ── */
function crearCardRespondida(s) {
  var div = document.createElement('div');
  div.className = 'solicitud-card card-respondida';

  var nombre = s.estudiante_nombre || 'Estudiante';
  var foto   = s.estudiante_foto || '';
  var iniciales = nombre.split(' ').map(function(x){ return x[0]; }).join('').toUpperCase().slice(0,2);
  var avatarHtml = foto
    ? '<img src="' + esc(foto) + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display=\'none\'">'
    : iniciales;

  var colores = ['#4a7a30','#7c3aed','#db2777','#059669','#d97706','#1d4ed8'];
  var idx = 0; for (var i = 0; i < nombre.length; i++) idx += nombre.charCodeAt(i);
  var color = colores[idx % colores.length];

  var mat    = s.materia || s.materia_nombre || '';
  var fecha  = formatFecha(s.fecha_prop || s.fecha || '');
  var hora   = formatHora(s.hora_prop  || s.hora  || '');
  var mod    = s.modalidad || 'virtual';
  var durMin = s.duracion_min;
  var precio = s.precio_cop ? '$' + Number(s.precio_cop).toLocaleString('es-CO') : '';

  var esAceptada = s.estado === 'aceptada';
  var badgeHtml  = esAceptada
    ? '<span class="badge-resp badge-resp-aceptada"><i class="fa-solid fa-circle-check"></i> Aceptada</span>'
    : '<span class="badge-resp badge-resp-rechazada"><i class="fa-solid fa-circle-xmark"></i> Rechazada</span>';

  div.innerHTML =
    '<div style="display:flex;align-items:flex-start;gap:14px;">' +
      '<div style="background:' + color + ';color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;width:50px;height:50px;border-radius:50%;overflow:hidden;flex-shrink:0;">' + avatarHtml + '</div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-weight:700;font-size:.97rem;color:#1f2937;">' + esc(nombre) + '</div>' +
        (mat ? '<div style="font-size:.82rem;color:#4a7a30;margin:2px 0 6px;"><i class="fa-solid fa-circle" style="font-size:.4rem;vertical-align:middle;margin-right:4px;"></i>' + esc(mat) + '</div>' : '') +
        '<div class="sol-meta">' +
          (fecha ? '<span><i class="fa-regular fa-calendar"></i> ' + esc(fecha) + '</span>' : '') +
          (hora  ? '<span><i class="fa-regular fa-clock"></i> '    + esc(hora)  + '</span>' : '') +
          '<span><i class="fa-solid fa-' + (mod === 'presencial' ? 'location-dot' : 'video') + '"></i> ' + esc(mod.charAt(0).toUpperCase() + mod.slice(1)) + '</span>' +
          (durMin ? '<span><i class="fa-solid fa-hourglass-half"></i> ' + durMin + ' min</span>' : '') +
        '</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;">' +
        badgeHtml +
        (precio ? '<div style="text-align:right;"><div style="font-weight:800;font-size:1rem;color:' + (esAceptada ? '#4a7a30' : '#9ca3af') + ';">' + precio + '</div><div style="font-size:.7rem;color:#9ca3af;">COP / sesión</div></div>' : '') +
      '</div>' +
    '</div>';

  return div;
}

/* ── Aceptar solicitud ── */
async function aceptarSolicitud(solId, btn) {
  var token = typeof getToken === 'function' ? getToken() : null;
  if (!token) return;

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';

  try {
    var sol    = _solicitudesData.find(function(x){ return x.id === solId; });
    var precio = (sol && sol.precio_cop) ? sol.precio_cop : 15000;

    var res = await fetch('/api/solicitudes/' + solId + '/aceptar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ precio_cop: precio })
    });
    if (res.ok) {
      var card = document.getElementById('sol-' + solId);
      if (card) {
        card.style.transition = 'opacity .3s, transform .3s';
        card.style.opacity    = '0';
        card.style.transform  = 'translateX(20px)';
        setTimeout(function(){ card.remove(); }, 300);
      }
      mostrarToast('✅ Solicitud aceptada. La tutoría ha sido confirmada.', '#22c55e');
      setTimeout(cargarSolicitudesAPI, 500);
    } else {
      var errData = {}; try { errData = await res.json(); } catch(e) {}
      mostrarToast('❌ ' + (errData.error || 'Error al aceptar la solicitud'), '#ef4444');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Aceptar';
    }
  } catch(e) {
    mostrarToast('❌ Error de conexión', '#ef4444');
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Aceptar';
  }
}

/* ── Rechazar solicitud ── */
async function rechazarSolicitud(solId, btn) {
  if (!confirm('¿Seguro que quieres rechazar esta solicitud?')) return;
  var token = typeof getToken === 'function' ? getToken() : null;
  if (!token) return;

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';

  try {
    var res = await fetch('/api/solicitudes/' + solId + '/rechazar', {
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.ok) {
      var card = document.getElementById('sol-' + solId);
      if (card) {
        card.style.transition = 'opacity .3s, transform .3s';
        card.style.opacity    = '0';
        card.style.transform  = 'translateX(20px)';
        setTimeout(function(){ card.remove(); }, 300);
      }
      mostrarToast('Solicitud rechazada.', '#6b7280');
      setTimeout(cargarSolicitudesAPI, 500);
    } else {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-xmark"></i> Rechazar';
    }
  } catch(e) { btn.disabled = false; }
}

/* ── Toast de notificación ── */
function mostrarToast(mensaje, color) {
  var viejo = document.querySelector('.sol-prof-toast');
  if (viejo) viejo.remove();
  var toast = document.createElement('div');
  toast.className = 'sol-prof-toast';
  toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;background:' + (color || '#333') + ';color:white;padding:12px 20px;border-radius:12px;font-weight:600;font-size:.88rem;box-shadow:0 4px 16px rgba(0,0,0,0.2);opacity:0;transition:opacity .3s;pointer-events:none;';
  toast.textContent = mensaje;
  document.body.appendChild(toast);
  requestAnimationFrame(function(){ toast.style.opacity = '1'; });
  setTimeout(function(){
    toast.style.opacity = '0';
    setTimeout(function(){ toast.remove(); }, 300);
  }, 3500);
}

/* ── Cargar tutorías del profesor ── */
async function cargarTutoriasProfesor() {
  var token = typeof getToken === 'function' ? getToken() : null;
  if (!token) return;

  var container = document.getElementById('listaTutorias') || document.querySelector('#tab-tutorias .tutorias-list');
  if (!container) return;

  try {
    var res  = await fetch('/api/tutorias', { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await res.json();
    var tuts = data.tutorias || [];

    var realDiv = container.querySelector('.real-list');
    if (!realDiv) { realDiv = document.createElement('div'); realDiv.className = 'real-list'; container.prepend(realDiv); }
    realDiv.innerHTML = '';

    if (!tuts.length) {
      realDiv.innerHTML = '<p style="color:#9ca3af;padding:20px 0;font-size:.9rem;">No tienes tutorías registradas aún.</p>';
      return;
    }

    tuts.forEach(function(t) {
      var div = document.createElement('div');
      div.className = 'solicitud-card';
      var nombre = t.estudiante_nombre || 'Estudiante';
      var iniciales = nombre.split(' ').map(function(x){ return x[0]; }).join('').toUpperCase().slice(0,2);
      var estadoBadge = t.estado === 'confirmada'
        ? '<span style="background:#dcfce7;color:#166534;border-radius:100px;padding:4px 12px;font-size:.78rem;font-weight:700;border:1px solid #bbf7d0;white-space:nowrap;">✓ Confirmada</span>'
        : '<span style="background:#f3f4f6;color:#6b7280;border-radius:100px;padding:4px 12px;font-size:.78rem;font-weight:700;white-space:nowrap;">' + esc(t.estado || 'Completada') + '</span>';
      div.innerHTML =
        '<div style="display:flex;align-items:center;gap:14px;">' +
          '<div style="width:46px;height:46px;border-radius:50%;background:#4a7a30;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0;">' + iniciales + '</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-weight:700;">' + esc(nombre) + '</div>' +
            '<div style="font-size:.82rem;color:#9ca3af;">' + esc(t.materia || '') + ' · ' + formatFecha(t.fecha || '') + ' · ' + formatHora(t.hora_inicio || '') + '</div>' +
          '</div>' +
          estadoBadge +
          (t.precio_cop ? '<div style="font-weight:700;color:#4a7a30;white-space:nowrap;">$' + Number(t.precio_cop).toLocaleString('es-CO') + '</div>' : '') +
        '</div>';
      realDiv.appendChild(div);
    });
  } catch(e) { console.error('Error cargando tutorías del profesor:', e); }
}

/* ── Tabs ── */
function inicializarTabs() {
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var t = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('active'); });
      document.querySelectorAll('.tab-content').forEach(function(c){ c.classList.remove('active'); });
      btn.classList.add('active');
      var cont = document.getElementById('tab-' + t);
      if (cont) cont.classList.add('active');
    });
  });
}

function inicializarEstrellas() {
  document.querySelectorAll('.star-btn').forEach(function(star) {
    star.addEventListener('click', function() {
      var val = parseInt(star.dataset.value);
      reseñaActual.estrellas = val;
      document.querySelectorAll('.star-btn').forEach(function(s, i){ s.classList.toggle('selected', i < val); });
    });
  });
}

function abrirModalReseña(histId) {
  reseñaActual.histId = histId;
  reseñaActual.estrellas = 0;
  document.querySelectorAll('.star-btn').forEach(function(s){ s.classList.remove('selected'); });
  var modal = document.getElementById('ratingModal');
  if (modal) modal.classList.add('open');
}

function cerrarModalReseña() {
  var modal = document.getElementById('ratingModal');
  if (modal) modal.classList.remove('open');
}

function cerrarConfirmModal() {
  var modal = document.getElementById('confirmModal');
  if (modal) modal.classList.remove('open');
}

function esc(str) {
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str || '')));
  return d.innerHTML;
}
