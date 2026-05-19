/* =============================================
   estudiantes_profesor.js
   Muestra los estudiantes aceptados via
   solicitudes (mt_estudiantes_prof).
   Sin reseñas — eso va en solicitudes_profesor.
   ============================================= */

var LS_ESTUDIANTES = 'mt_estudiantes_prof';

var busquedaActual = '';

function escapeHtml(str) {
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str || '')));
  return d.innerHTML;
}

function cargarEstudiantes() {
  try { return JSON.parse(localStorage.getItem(LS_ESTUDIANTES) || '[]'); }
  catch(e) { return []; }
}

/* ══════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  renderEstudiantes();


});

function filtrarEstudiantes(query) {
  busquedaActual = query.toLowerCase().trim();
  renderEstudiantes();
}

/* ══════════════════════════════════════════════
   RENDER
   ══════════════════════════════════════════════ */
function renderEstudiantes() {
  var grid    = document.getElementById('estudiantesGrid');
  var countEl = document.getElementById('totalCount');
  if (!grid) return;

  var todos = cargarEstudiantes();

  var filtrados = todos.slice();

  if (busquedaActual) {
    filtrados = filtrados.filter(function(e) {
      return e.nombre.toLowerCase().includes(busquedaActual) ||
             (e.materia || '').toLowerCase().includes(busquedaActual);
    });
  }

  if (countEl) countEl.textContent = filtrados.length;
  grid.innerHTML = '';

  if (filtrados.length === 0) {
    var msg = todos.length === 0
      ? '📭 Aún no tienes estudiantes. Acepta solicitudes para verlos aquí.'
      : '🔍 No se encontraron estudiantes con ese criterio.';
    grid.innerHTML =
      '<div style="grid-column:1/-1;text-align:center;padding:48px 24px;' +
      'color:var(--muted,#6b7280);font-size:.92rem;">' + msg + '</div>';
    return;
  }

  filtrados.forEach(function(est) {
    var horasVal = typeof est.horas === 'number' ? est.horas.toFixed(1) : (est.horas || 0);
    var proximaLabel = '—';
    if (est.proxima && est.proxima !== '—') {
      var partes = est.proxima.split(' · ');
      if (partes.length === 2) {
        var fechaParts = partes[0].split('-');
        if (fechaParts.length === 3) {
          var meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
          var dia = parseInt(fechaParts[2], 10);
          var mes = meses[parseInt(fechaParts[1], 10) - 1] || partes[0];
          proximaLabel = dia + ' ' + mes + ' · ' + partes[1];
        } else { proximaLabel = est.proxima; }
      } else { proximaLabel = est.proxima; }
    }

    var card = document.createElement('div');
    card.className = 'est-card';
    card.setAttribute('data-est-nombre', est.nombre);

    /* Botón Próx. sesión clickable si hay sesión */
    var proximaHTML;
    if (est.proxima && est.proxima !== '—') {
      proximaHTML =
        '<button class="est-prox-sesion-btn" onclick="verDetallePorEstudiante(\'' +
        escapeHtml(est.nombre) + '\')" title="Ver detalle de la sesión">' +
        '<i class="fa-solid fa-video" style="font-size:.7rem;"></i> ' +
        escapeHtml(proximaLabel) + '</button>';
    } else {
      proximaHTML = '<div class="est-stat-num" style="font-size:.75rem;color:var(--muted,#6b7280);">—</div>';
    }

    card.innerHTML =
      '<div class="est-card-top">' +
        '<div class="est-avatar" style="background:' + escapeHtml(est.color || '#4a7a30') + ';color:#fff;">' +
          escapeHtml(est.iniciales || '?') +
        '</div>' +
        '<div class="est-card-info">' +
          '<div class="est-card-name">' + escapeHtml(est.nombre) + '</div>' +
          '<div class="est-card-materia">' + escapeHtml(est.materia || '') + '</div>' +
        '</div>' +
        '<span class="est-badge ' + escapeHtml(est.estado || 'nuevo') + '">' +
          (est.estado === 'activo' ? 'Activo' : 'Nuevo') +
        '</span>' +
      '</div>' +
      '<div class="est-card-stats">' +
        '<div class="est-stat">' +
          '<div class="est-stat-num">' + (est.sesiones || 1) + '</div>' +
          '<div class="est-stat-label">Sesiones</div>' +
        '</div>' +
        '<div class="est-stat">' +
          '<div class="est-stat-num">' + horasVal + 'h</div>' +
          '<div class="est-stat-label">Horas</div>' +
        '</div>' +
        '<div class="est-stat">' +
          proximaHTML +
          '<div class="est-stat-label">Próx. sesión</div>' +
        '</div>' +
      '</div>';

    grid.appendChild(card);
  });
}

/* ══════════════════════════════════════════════
   VER DETALLE DE SESIÓN DESDE CARD DE ESTUDIANTE
   ══════════════════════════════════════════════ */
function verDetallePorEstudiante(nombre) {
  var sesiones;
  try { sesiones = JSON.parse(localStorage.getItem('mt_sesiones_prof') || '[]'); } catch(e) { sesiones = []; }
  /* Buscar la próxima sesión con ese estudiante (fecha >= hoy) */
  var hoy = new Date().toISOString().split('T')[0];
  var proximas = sesiones.filter(function(s) {
    return s.estudiante === nombre && s.fecha >= hoy;
  });
  proximas.sort(function(a,b){
    /* Priorizar sesiones aceptadas (id empieza con 'sol-') sobre las de demo */
    var aSol = String(a.id||'').indexOf('sol-') === 0 ? 0 : 1;
    var bSol = String(b.id||'').indexOf('sol-') === 0 ? 0 : 1;
    if (aSol !== bSol) return aSol - bSol;
    return a.fecha.localeCompare(b.fecha) || (a.hora||'').localeCompare(b.hora||'');
  });
  var sesion = proximas[0];
  if (!sesion) {
    /* Si no hay futura, tomar la más reciente, priorizando las aceptadas */
    var todas = sesiones.filter(function(s){ return s.estudiante === nombre; });
    todas.sort(function(a,b){
      var aSol = String(a.id||'').indexOf('sol-') === 0 ? 0 : 1;
      var bSol = String(b.id||'').indexOf('sol-') === 0 ? 0 : 1;
      if (aSol !== bSol) return aSol - bSol;
      return b.fecha.localeCompare(a.fecha);
    });
    sesion = todas[0];
  }
  if (sesion) {
    abrirSesionDetalle(sesion, 'detalle');
  } else {
    alert('No se encontró información de sesión para este estudiante.');
  }
}
