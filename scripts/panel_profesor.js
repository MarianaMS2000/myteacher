/* panel_profesor.js — Panel del profesor, datos desde la BD */

document.addEventListener('DOMContentLoaded', async function () {

  /* Verificar sesión — solo profesores */
  var user = verificarSesion('profesor');
  if (!user) return;

  /* Cargar sesiones de hoy desde la BD */
  await cargarSesionesHoy();

  /* Cargar estadísticas del profesor */
  await cargarEstadisticas();

  /* Búsqueda en el panel */
  var searchInput = document.querySelector('.header-search input');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      var q = this.value.toLowerCase().trim();
      filtrarSesiones(q);
    });
    var searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', function () {
        filtrarSesiones(searchInput.value.toLowerCase().trim());
      });
    }
  }
});

var _todasLasSesiones = [];

function filtrarSesiones(q) {
  var container = document.getElementById('sessionList') || document.getElementById('listaSesionesHoy');
  if (!container) return;
  var lista = q
    ? _todasLasSesiones.filter(function(s) {
        return (s.estudiante_nombre || '').toLowerCase().includes(q) ||
               (s.materia || '').toLowerCase().includes(q);
      })
    : _todasLasSesiones;
  renderizarSesiones(container, lista);
}

/* ── Sesiones de hoy ── */
async function cargarSesionesHoy() {
  var token = getToken();
  if (!token) return;

  var container = document.getElementById('sessionList') || document.getElementById('listaSesionesHoy');
  if (!container) return;

  try {
    var res  = await fetch('/api/tutorias/hoy', { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await res.json();
    _todasLasSesiones = data.sesiones || [];
    renderizarSesiones(container, _todasLasSesiones);
  } catch(e) {
    console.error('Error cargando sesiones:', e);
    if (container) container.innerHTML = '<p style="color:#888;padding:16px">Error cargando sesiones</p>';
  }
}

function renderizarSesiones(container, sesiones) {
  if (sesiones.length === 0) {
    container.innerHTML = '<p style="color:#888;padding:16px;text-align:center">No tienes sesiones programadas para hoy</p>';
    return;
  }
  container.innerHTML = sesiones.map(function(s) {
    var iniciales = s.estudiante_nombre
      ? s.estudiante_nombre.split(' ').map(function(p){ return p[0]; }).join('').toUpperCase().slice(0,2)
      : '?';
    return '<div class="session-item">' +
      '<div class="session-avatar" style="background:#4a7a30">' + iniciales + '</div>' +
      '<div class="session-info">' +
        '<strong>' + s.estudiante_nombre + '</strong>' +
        '<span>' + (s.materia || 'Sin materia especificada') + '</span>' +
        '<span style="color:#888;font-size:.8rem">' + s.hora_inicio + ' · ' + s.duracion_min + ' min · ' + s.modalidad + '</span>' +
      '</div>' +
      '<div class="session-price">$' + Number(s.precio_cop).toLocaleString('es-CO') + '</div>' +
    '</div>';
  }).join('');
}

/* ── Estadísticas del profesor ── */
async function cargarEstadisticas() {
  var token = getToken();
  if (!token) return;
  try {
    /* Cargar datos del perfil para rating */
    var meRes  = await fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token } });
    var meData = await meRes.json();
    var u      = meData.usuario || {};
    if (u.rating_promedio !== undefined) {
      setText('statRating', parseFloat(u.rating_promedio).toFixed(1));
    }
    if (u.total_resenas !== undefined) {
      setText('statResenas', u.total_resenas + ' reseñas');
    }

    /* Cargar tutorías */
    var res  = await fetch('/api/tutorias', { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await res.json();
    var tutorias = data.tutorias || [];

    var ahora    = new Date();
    var mesActual = ahora.getFullYear() + '-' + String(ahora.getMonth() + 1).padStart(2, '0');

    var completadas   = tutorias.filter(function(t){ return t.estado === 'completada'; });
    var pendientes    = tutorias.filter(function(t){ return t.estado === 'confirmada'; });
    var delMes        = completadas.filter(function(t){ return (t.fecha || '').startsWith(mesActual); });
    var gananciasMes  = delMes.reduce(function(sum, t){ return sum + Number(t.precio_cop || 0); }, 0);
    var estudiantesUnicos = new Set(tutorias.map(function(t){ return t.estudiante_id; })).size;

    setText('statTotalSesiones', completadas.length);
    setText('statPendientes',    pendientes.length + ' pendientes');
    setText('statGanancias',     '$' + Number(gananciasMes).toLocaleString('es-CO'));
    setText('statEstudiantes',   estudiantesUnicos);

    /* Actualizar el total del gráfico también */
    var earningsTotal = document.querySelector('.earnings-total');
    if (earningsTotal) {
      earningsTotal.innerHTML = '$' + Number(gananciasMes).toLocaleString('es-CO') + ' <span>COP</span>';
    }

  } catch(e) { console.error('Error cargando estadísticas:', e); }
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ── Helpers de fecha ── */
function getFechaOffset(n) {
  var d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

/* ── Gráfico de ganancias ── */
async function cargarGraficoGanancias() {
  var token = getToken();
  if (!token) return;
  try {
    var res  = await fetch('/api/tutorias', { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await res.json();
    var completadas = (data.tutorias || []).filter(function(t){ return t.estado === 'completada'; });

    var porMes = {};
    completadas.forEach(function(t) {
      var mes = t.fecha ? t.fecha.slice(0, 7) : 'desconocido';
      porMes[mes] = (porMes[mes] || 0) + Number(t.precio_cop || 0);
    });

    var canvas = document.getElementById('graficoGanancias');
    if (canvas && typeof Chart !== 'undefined' && Object.keys(porMes).length > 0) {
      var labels = Object.keys(porMes).sort();
      var valores = labels.map(function(m){ return porMes[m]; });
      new Chart(canvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{ label: 'Ganancias COP', data: valores, backgroundColor: '#4a7a30' }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
      });
    }
  } catch(e) { console.error('Error cargando gráfico:', e); }
}

document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('graficoGanancias')) cargarGraficoGanancias();
});

/* ── CALENDARIO MINI ── */
var _calOffset = 0; /* meses desde el mes actual: 0 = este mes, -1 = anterior, +1 = siguiente */
var _sesionesFechas = new Set(); /* fechas YYYY-MM-DD que tienen sesión */

function renderCalendar() {
  var calDays  = document.getElementById('calDays');
  var calMonth = document.getElementById('calMonth');
  if (!calDays || !calMonth) return;

  var hoy     = new Date();
  var base    = new Date(hoy.getFullYear(), hoy.getMonth() + _calOffset, 1);
  var anio    = base.getFullYear();
  var mes     = base.getMonth(); /* 0-11 */

  var MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  calMonth.textContent = MESES[mes] + ' ' + anio;

  /* Primer día de la semana (Lunes = 0) */
  var primerDia = new Date(anio, mes, 1).getDay(); /* 0=Dom…6=Sáb */
  var vacios    = (primerDia === 0) ? 6 : primerDia - 1; /* convertir a Lun=0 */
  var diasMes   = new Date(anio, mes + 1, 0).getDate();

  var todayStr  = hoy.toISOString().split('T')[0];
  var html      = '';

  /* Celdas vacías antes del día 1 */
  for (var v = 0; v < vacios; v++) {
    html += '<div class="cal-day-empty"></div>';
  }

  /* Días del mes */
  for (var d = 1; d <= diasMes; d++) {
    var fechaStr = anio + '-' + String(mes + 1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    var esHoy    = (fechaStr === todayStr);
    var tieneSes = _sesionesFechas.has(fechaStr);
    html += '<div class="cal-day' + (esHoy ? ' cal-today' : '') + '" title="' + fechaStr + '">' +
              d +
              (tieneSes ? '<div class="cal-dot"></div>' : '') +
            '</div>';
  }

  calDays.innerHTML = html;

  /* Cargar fechas de sesiones desde la BD para mostrar los puntos */
  cargarFechasSesiones(anio, mes);

  /* Conectar botones de navegación */
  var navBtns = document.querySelectorAll('.cal-nav-btn');
  if (navBtns.length >= 2) {
    navBtns[0].onclick = function () { _calOffset--; renderCalendar(); };
    navBtns[1].onclick = function () { _calOffset++; renderCalendar(); };
  }
}

async function cargarFechasSesiones(anio, mes) {
  var token = getToken();
  if (!token) return;
  try {
    var res  = await fetch('/api/tutorias', { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await res.json();
    var mes2Str = anio + '-' + String(mes + 1).padStart(2, '0');
    _sesionesFechas = new Set(
      (data.tutorias || [])
        .map(function(t){ return t.fecha ? t.fecha.split('T')[0] : null; })
        .filter(function(f){ return f && f.startsWith(mes2Str); })
    );
    /* Volver a renderizar los días con los puntos */
    renderCalendar._pintandoPuntos = true; /* evitar recursión */
    if (!renderCalendar._pintandoPuntos) return;

    var calDays = document.getElementById('calDays');
    if (!calDays) return;
    calDays.querySelectorAll('.cal-day').forEach(function(cel) {
      var fecha = cel.title;
      var dot   = cel.querySelector('.cal-dot');
      if (_sesionesFechas.has(fecha) && !dot) {
        var d = document.createElement('div');
        d.className = 'cal-dot';
        cel.appendChild(d);
      } else if (!_sesionesFechas.has(fecha) && dot) {
        dot.remove();
      }
    });
    renderCalendar._pintandoPuntos = false;
  } catch(e) { /* silencioso */ }
}
