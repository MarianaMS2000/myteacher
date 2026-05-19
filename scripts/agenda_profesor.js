/* =============================================
   agenda_profesor.js — Lógica completa de la
   agenda: vistas Semana / Mes / Lista,
   sesiones persistidas en localStorage,
   modal de disponibilidad y navegación.
   ============================================= */

/* ── CLAVE DE ALMACENAMIENTO ── */
var LS_SESIONES  = 'mt_sesiones_prof';
var LS_DISPON    = 'mt_disponibilidad_prof';

/* ── DISPONIBILIDAD POR DEFECTO ── */
var DISPON_DEFAULT = [
  { dia: 'Lun', horas: '8:00 AM – 6:00 PM' },
  { dia: 'Mar', horas: '9:00 AM – 5:00 PM' },
  { dia: 'Mié', horas: '10:00 AM – 7:00 PM' },
  { dia: 'Jue', horas: '8:00 AM – 4:00 PM' },
  { dia: 'Vie', horas: '7:00 AM – 2:00 PM' },
];

/* ── ESTADO GLOBAL ── */
var vistaActual     = 'semana';
var semanaOffset    = 0;
var mesOffset       = 0;
var diaSeleccionado = null; /* fecha string YYYY-MM-DD */

/* Helper: devuelve fecha string N días desde hoy */
function getFechaOffset(n) {
  var d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

/* ── SESIONES POR DEFECTO (demo) ── */
var SESIONES_DEFAULT = [
  { id: 1,  fecha: getFechaOffset(1), hora: '10:00', duracion: 90, estudiante: 'Carlos Lizarazo',    iniciales: 'CL', color: '#4a7a30', materia: 'Cálculo Diferencial', tipo: 'virtual',    precio: '$35K' },
  { id: 2,  fecha: getFechaOffset(1), hora: '14:30', duracion: 60, estudiante: 'María Suárez',       iniciales: 'MS', color: '#7c3aed', materia: 'Álgebra Lineal',      tipo: 'presencial', precio: '$30K' },
  { id: 3,  fecha: getFechaOffset(1), hora: '17:00', duracion: 90, estudiante: 'Julián Rodríguez',   iniciales: 'JR', color: '#db2777', materia: 'Física Mecánica',     tipo: 'pendiente',  precio: '$40K' },
  { id: 4,  fecha: getFechaOffset(2), hora: '09:00', duracion: 60, estudiante: 'Valentina Pérez',    iniciales: 'VP', color: '#059669', materia: 'Cálculo Integral',    tipo: 'virtual',    precio: '$35K' },
  { id: 5,  fecha: getFechaOffset(3), hora: '11:00', duracion: 90, estudiante: 'Felipe Gómez',       iniciales: 'FG', color: '#d97706', materia: 'Estadística',         tipo: 'virtual',    precio: '$30K' },
  { id: 6,  fecha: getFechaOffset(4), hora: '15:00', duracion: 60, estudiante: 'Isabella Torres',    iniciales: 'IT', color: '#7c3aed', materia: 'Álgebra Lineal',      tipo: 'presencial', precio: '$30K' },
  { id: 7,  fecha: getFechaOffset(6), hora: '08:00', duracion: 90, estudiante: 'Santiago López',     iniciales: 'SL', color: '#1d4ed8', materia: 'Cálculo Diferencial', tipo: 'virtual',    precio: '$35K' },
];


/* ── MAPA NOMBRE → ID CONVERSACIÓN ── */
var CONV_ID_MAP_AGENDA = {
  'Carlos Lizarazo':  4,
  'María Suárez':     null,
  'Julián Rodríguez': 5,
  'Valentina Pérez':  1,
  'Felipe Gómez':     2,
  'Isabella Torres':  3,
  'Santiago López':   null
};

function abrirMensajeEstudiante(nombreEstudiante) {
  var convId = CONV_ID_MAP_AGENDA[nombreEstudiante] || null;
  if (convId) localStorage.setItem('mt_conv_abierta', convId);
  // Mensajes deshabilitado
}

/* ── CARGAR / GUARDAR SESIONES EN LOCALSTORAGE ── */
function cargarSesiones() {
  var stored = localStorage.getItem(LS_SESIONES);
  if (stored) {
    try {
      var parsed = JSON.parse(stored);
      /* Si todas las sesiones son de más de 7 días atrás, regenerar con fechas nuevas */
      var hoy = new Date(); hoy.setHours(0,0,0,0);
      var limite = new Date(hoy); limite.setDate(hoy.getDate() - 7);
      var limiteStr = limite.toISOString().split('T')[0];
      var todasViejas = parsed.length > 0 && parsed.every(function(s){ return s.fecha < limiteStr; });
      if (!todasViejas) {
        /* Deduplicar: si hay una sesión aceptada (sol-) y una de demo para el
           mismo estudiante+fecha, quitar la de demo para evitar conflictos. */
        var aceptadas = parsed.filter(function(s){ return String(s.id||'').indexOf('sol-') === 0; });
        var claveAcept = {};
        aceptadas.forEach(function(s){ claveAcept[s.estudiante + '|' + s.fecha] = true; });
        parsed = parsed.filter(function(s){
          if (String(s.id||'').indexOf('sol-') === 0) return true; /* siempre conservar aceptadas */
          return !claveAcept[s.estudiante + '|' + s.fecha];        /* quitar demo si ya hay aceptada */
        });
        sincronizarEstudiantesDesde(parsed);
        return parsed;
      }
    } catch(e) {}
  }
  /* Primera vez o datos obsoletos: guardar las de demo con fechas actuales */
  localStorage.setItem(LS_SESIONES, JSON.stringify(SESIONES_DEFAULT));
  sincronizarEstudiantesDesde(SESIONES_DEFAULT);
  return SESIONES_DEFAULT.slice();
}

/* Puebla mt_estudiantes_prof con los estudiantes de las sesiones,
   sin duplicar los que ya estén guardados. */
function sincronizarEstudiantesDesde(sesiones) {
  var LS_EST = 'mt_estudiantes_prof';
  var actuales;
  try { actuales = JSON.parse(localStorage.getItem(LS_EST) || '[]'); } catch(e) { actuales = []; }

  sesiones.forEach(function(s) {
    var existe = actuales.some(function(e) { return e.nombre === s.estudiante; });
    if (!existe) {
      actuales.push({
        id:        'demo-' + s.id,
        nombre:    s.estudiante,
        iniciales: s.iniciales,
        color:     s.color,
        materia:   s.materia,
        sesiones:  1,
        horas:     (s.duracion || 60) / 60,
        estado:    'activo',
        proxima:   s.fecha + ' · ' + s.hora
      });
    }
  });
  localStorage.setItem(LS_EST, JSON.stringify(actuales));
}

function guardarSesiones(arr) {
  localStorage.setItem(LS_SESIONES, JSON.stringify(arr));
}

function cargarDisponibilidad() {
  var stored = localStorage.getItem(LS_DISPON);
  if (stored) { try { return JSON.parse(stored); } catch(e) {} }
  localStorage.setItem(LS_DISPON, JSON.stringify(DISPON_DEFAULT));
  return DISPON_DEFAULT.slice();
}

function guardarDisponibilidad(arr) {
  localStorage.setItem(LS_DISPON, JSON.stringify(arr));
}

/* ── SESIONES ACTUALES ── */
var SESIONES = cargarSesiones();

/* ══════════════════════════════════════════════
   INICIALIZACIÓN
   ══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {

  /* Día seleccionado: si viene del panel (mini-calendario), usarlo; si no, hoy */
  var diaGuardado = localStorage.getItem('mt_agenda_dia_sel');
  if (diaGuardado) {
    diaSeleccionado = diaGuardado;
    localStorage.removeItem('mt_agenda_dia_sel');
    /* Si el día es de otro mes, ajustar offset de mes */
    var dFecha = new Date(diaGuardado + 'T00:00:00');
    var hoyRef  = new Date();
    var diffMes = (dFecha.getFullYear() - hoyRef.getFullYear()) * 12 + (dFecha.getMonth() - hoyRef.getMonth());
    mesOffset = diffMes;
    semanaOffset = Math.round(diffMes * 30 / 7);
  } else {
    diaSeleccionado = new Date().toISOString().split('T')[0];
  }

  renderVista();
  renderAvailSlots();
  actualizarResumenSemana();

  /* Tabs de vista */
  document.querySelectorAll('.view-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.view-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      vistaActual = tab.dataset.view;
      renderVista();
    });
  });

  /* Navegación prev/next de semana/mes */
  document.getElementById('prevWeek').addEventListener('click', function () {
    if (vistaActual === 'semana') semanaOffset--;
    else mesOffset--;
    renderVista();
  });
  document.getElementById('nextWeek').addEventListener('click', function () {
    if (vistaActual === 'semana') semanaOffset++;
    else mesOffset++;
    renderVista();
  });

  /* Modal de disponibilidad */
  var btnAvail = document.getElementById('btnAgregarHorario');
  if (btnAvail) btnAvail.addEventListener('click', abrirModalDisponibilidad);

  document.getElementById('disponModalClose').addEventListener('click', cerrarModalDisponibilidad);
  document.getElementById('disponModalOverlay').addEventListener('click', function (e) {
    if (e.target === this) cerrarModalDisponibilidad();
  });
  document.getElementById('btnGuardarDispon').addEventListener('click', guardarNuevaDisponibilidad);

  /* Delegated click para botones de mensaje en tarjetas de sesión */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.sday-btn[data-est]');
    if (btn) abrirMensajeEstudiante(btn.dataset.est);
  });
});

/* ══════════════════════════════════════════════
   ENRUTADOR DE VISTAS
   ══════════════════════════════════════════════ */
function renderVista() {
  if (vistaActual === 'semana') { renderVistaSemana(); return; }
  if (vistaActual === 'mes')    { renderVistaMes();    return; }
  if (vistaActual === 'lista')  { renderVistaLista();  return; }
}

/* ══════════════════════════════════════════════
   VISTA SEMANA
   ══════════════════════════════════════════════ */
var DIA_NAMES  = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
var MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function getInicioSemana() {
  var today = new Date();
  var dow   = today.getDay() === 0 ? 6 : today.getDay() - 1;
  var mon   = new Date(today);
  mon.setDate(today.getDate() - dow + semanaOffset * 7);
  mon.setHours(0,0,0,0);
  return mon;
}

function renderVistaSemana() {
  actualizarNavLabel();
  var grid = document.getElementById('weekGrid');
  if (!grid) return;
  grid.style.display = 'grid';
  grid.innerHTML = '';

  var today  = new Date(); today.setHours(0,0,0,0);
  var inicio = getInicioSemana();

  DIA_NAMES.forEach(function (dayName, idx) {
    var fecha = new Date(inicio);
    fecha.setDate(inicio.getDate() + idx);
    var fechaStr = fecha.toISOString().split('T')[0];
    var isToday  = fecha.getTime() === today.getTime();
    var isSel    = fechaStr === diaSeleccionado;

    var col = document.createElement('div');
    col.className = 'week-day-col' + (isToday ? ' is-today' : '') + (isSel ? ' selected' : '');
    col.dataset.fecha = fechaStr;

    var dayNumHtml = isToday
      ? '<div class="wdc-day-num"><div class="today-num">' + fecha.getDate() + '</div></div>'
      : '<div class="wdc-day-num">' + fecha.getDate() + '</div>';

    col.innerHTML = '<div class="wdc-day-name">' + dayName + '</div>' + dayNumHtml;

    var sesionesDia = SESIONES.filter(function (s) { return s.fecha === fechaStr; });
    sesionesDia.sort(function(a,b){ return a.hora.localeCompare(b.hora); });

    if (sesionesDia.length === 0) {
      var libre = document.createElement('div');
      libre.className = 'wdc-libre';
      libre.textContent = 'Libre';
      col.appendChild(libre);
    } else {
      sesionesDia.forEach(function (s) {
        var bloque = document.createElement('div');
        bloque.className = 'wdc-session ' + s.tipo;
        bloque.textContent = formatHora12(s.hora) + ' · ' + s.iniciales;
        col.appendChild(bloque);
      });
    }

    col.addEventListener('click', function () {
      diaSeleccionado = fechaStr;
      document.querySelectorAll('.week-day-col').forEach(function (c) { c.classList.remove('selected'); });
      col.classList.add('selected');
      renderSessionsList(fechaStr);
    });

    grid.appendChild(col);
  });

  /* Ocultar contenedor de mes/lista si existiera */
  var altView = document.getElementById('altViewContainer');
  if (altView) altView.style.display = 'none';

  renderSessionsList(diaSeleccionado);
}

/* ══════════════════════════════════════════════
   VISTA MES
   ══════════════════════════════════════════════ */
function getInicioMes() {
  var hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth() + mesOffset, 1);
}

function renderVistaMes() {
  actualizarNavLabel();

  /* Ocultar grid de semana */
  var wg = document.getElementById('weekGrid');
  if (wg) wg.style.display = 'none';

  var cont = obtenerAltView();
  cont.innerHTML = '';
  cont.style.display = 'block';

  var inicio      = getInicioMes();
  var year        = inicio.getFullYear();
  var month       = inicio.getMonth();
  var today       = new Date(); today.setHours(0,0,0,0);
  var firstDay    = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var offset      = firstDay === 0 ? 6 : firstDay - 1;

  /* Cabecera de días */
  var header = document.createElement('div');
  header.className = 'month-grid-header';
  ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].forEach(function (d) {
    var h = document.createElement('div');
    h.textContent = d;
    header.appendChild(h);
  });
  cont.appendChild(header);

  var grid = document.createElement('div');
  grid.className = 'month-grid';
  cont.appendChild(grid);

  /* Celdas vacías de relleno */
  for (var i = 0; i < offset; i++) {
    var empty = document.createElement('div');
    empty.className = 'month-cell empty';
    grid.appendChild(empty);
  }

  /* Días del mes */
  for (var d = 1; d <= daysInMonth; d++) {
    var cellDate = new Date(year, month, d);
    var fechaStr = cellDate.toISOString().split('T')[0];
    var isToday  = cellDate.getTime() === today.getTime();
    var isSel    = fechaStr === diaSeleccionado;
    var sesionesDia = SESIONES.filter(function (s) { return s.fecha === fechaStr; });

    var cell = document.createElement('div');
    cell.className = 'month-cell' + (isToday ? ' mc-today' : '') + (isSel ? ' mc-selected' : '');
    cell.dataset.fecha = fechaStr;

    var numEl = document.createElement('div');
    numEl.className = 'mc-num';
    numEl.textContent = d;
    cell.appendChild(numEl);

    sesionesDia.slice(0,2).forEach(function (s) {
      var pill = document.createElement('div');
      pill.className = 'mc-pill ' + s.tipo;
      pill.textContent = formatHora12(s.hora) + ' ' + s.iniciales;
      cell.appendChild(pill);
    });
    if (sesionesDia.length > 2) {
      var more = document.createElement('div');
      more.className = 'mc-more';
      more.textContent = '+' + (sesionesDia.length - 2) + ' más';
      cell.appendChild(more);
    }

    cell.addEventListener('click', function () {
      diaSeleccionado = this.dataset.fecha;
      document.querySelectorAll('.month-cell').forEach(function (c) { c.classList.remove('mc-selected'); });
      this.classList.add('mc-selected');
      renderSessionsList(diaSeleccionado);
    }.bind(cell));

    grid.appendChild(cell);
  }

  renderSessionsList(diaSeleccionado);
}

/* ══════════════════════════════════════════════
   VISTA LISTA
   ══════════════════════════════════════════════ */
function renderVistaLista() {
  actualizarNavLabel();

  var wg = document.getElementById('weekGrid');
  if (wg) wg.style.display = 'none';

  var cont = obtenerAltView();
  cont.innerHTML = '';
  cont.style.display = 'block';

  /* Agrupar sesiones por fecha, próximas 30 días */
  var hoy   = new Date(); hoy.setHours(0,0,0,0);
  var fin   = new Date(hoy); fin.setDate(hoy.getDate() + 30);
  var futuras = SESIONES.filter(function (s) {
    var d = new Date(s.fecha + 'T00:00:00');
    return d >= hoy && d <= fin;
  }).sort(function(a,b){
    return (a.fecha + a.hora).localeCompare(b.fecha + b.hora);
  });

  if (futuras.length === 0) {
    cont.innerHTML = '<div style="text-align:center;padding:48px;color:var(--muted);font-size:.88rem;">📅 No hay sesiones programadas en los próximos 30 días. Acepta solicitudes de estudiantes para verlas aquí.</div>';
    /* Ocultar sesiones del día */
    var sl = document.getElementById('sessionsList');
    if (sl) sl.innerHTML = '';
    var dt = document.getElementById('selectedDayTitle');
    if (dt) dt.textContent = 'Próximas sesiones';
    return;
  }

  /* Agrupar por fecha */
  var grupos = {};
  futuras.forEach(function (s) { (grupos[s.fecha] = grupos[s.fecha] || []).push(s); });

  var MESES_LARGO = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  Object.keys(grupos).sort().forEach(function (fecha) {
    var d    = new Date(fecha + 'T00:00:00');
    var hdr  = document.createElement('div');
    hdr.className = 'lista-fecha-hdr';
    var dLabel = d.getDate() + ' de ' + MESES_LARGO[d.getMonth()];
    if (d.getTime() === hoy.getTime()) dLabel = 'Hoy — ' + dLabel;
    hdr.textContent = dLabel;
    cont.appendChild(hdr);

    grupos[fecha].forEach(function (s) {
      var card = document.createElement('div');
      card.className = 'lista-card';
      card.innerHTML =
        '<div class="sday-time-col"><div class="sday-hour">' + formatHora12(s.hora) + '</div><div class="sday-duration">' + s.duracion + ' min</div></div>' +
        '<div class="sday-avatar" style="background:' + s.color + ';">' + s.iniciales + '</div>' +
        '<div class="sday-info"><div class="sday-name">' + escapeHtml(s.estudiante) + '</div><div class="sday-meta">' + escapeHtml(s.materia) + '</div></div>' +
        '<div class="sday-actions">' +
          '<span class="sday-badge ' + s.tipo + '">' + capitalizar(s.tipo) + '</span>' +
          '<div class="sday-price">' + s.precio + '</div>' +
          '<button class="sday-btn" data-est="' + escapeHtml(s.estudiante) + '"><i class="fa-regular fa-comment"></i> Mensaje</button>' +
        '</div>';
      cont.appendChild(card);
    });
  });

  /* En lista no mostramos el panel de "Sesiones del día" */
  var sl = document.getElementById('sessionsList');
  if (sl) sl.innerHTML = '';
  var dt = document.getElementById('selectedDayTitle');
  if (dt) dt.textContent = 'Próximas sesiones (30 días)';
}

/* ── Contenedor reutilizable para vistas Mes/Lista ── */
function obtenerAltView() {
  var cont = document.getElementById('altViewContainer');
  if (!cont) {
    cont = document.createElement('div');
    cont.id = 'altViewContainer';
    var wg = document.getElementById('weekGrid');
    if (wg && wg.parentNode) wg.parentNode.insertBefore(cont, wg.nextSibling);
    else document.querySelector('.main-content').appendChild(cont);
  }
  return cont;
}

/* ══════════════════════════════════════════════
   LISTA DE SESIONES DEL DÍA
   ══════════════════════════════════════════════ */
function renderSessionsList(fechaStr) {
  var container = document.getElementById('sessionsList');
  var titleEl   = document.getElementById('selectedDayTitle');
  if (!container) return;

  var d      = new Date(fechaStr + 'T00:00:00');
  var today  = new Date(); today.setHours(0,0,0,0);
  var MESES  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  if (titleEl) {
    titleEl.textContent = d.getTime() === today.getTime()
      ? 'Sesiones de hoy'
      : 'Sesiones del ' + d.getDate() + ' de ' + MESES[d.getMonth()];
  }

  var sesiones = SESIONES.filter(function (s) { return s.fecha === fechaStr; });
  sesiones.sort(function(a,b){ return a.hora.localeCompare(b.hora); });
  container.innerHTML = '';

  if (sesiones.length === 0) {
    container.innerHTML =
      '<div style="text-align:center;padding:28px;color:var(--muted);font-size:.88rem;">' +
      '📅 No hay sesiones para este día. ' +
      '📅 No hay sesiones para este día.</div>';
    return;
  }

  sesiones.forEach(function (s) {
    var card = document.createElement('div');
    card.className = 'sday-card';
    card.style.cursor = 'pointer';
    card.title = 'Ver detalle de la sesión';
    card.innerHTML =
      '<div class="sday-time-col">' +
        '<div class="sday-hour">' + formatHora12(s.hora) + '</div>' +
        '<div class="sday-duration">' + s.duracion + ' min</div>' +
      '</div>' +
      '<div class="sday-avatar" style="background:' + s.color + ';">' + s.iniciales + '</div>' +
      '<div class="sday-info">' +
        '<div class="sday-name">' + escapeHtml(s.estudiante) + '</div>' +
        '<div class="sday-meta">' + escapeHtml(s.materia) + '</div>' +
      '</div>' +
      '<div class="sday-actions">' +
        '<span class="sday-badge ' + s.tipo + '">' + capitalizar(s.tipo) + '</span>' +
        '<div class="sday-price">' + s.precio + '</div>' +
        (s.tipo !== 'pendiente'
          ? '<button class="sday-btn sday-btn-detalle" title="Ver detalle"><i class="fa-solid fa-circle-info"></i> Detalle</button>'
          : '<button class="sday-btn" data-est="' + escapeHtml(s.estudiante) + '"><i class="fa-regular fa-comment"></i> Mensaje</button>') +
      '</div>';

    /* Click en la card o en el botón Detalle abre el modal */
    if (s.tipo !== 'pendiente') {
      card.addEventListener('click', function(e) {
        /* Evitar que el click en "Mensaje" también lo abra */
        if (e.target.closest('.sday-btn[data-est]')) return;
        abrirSesionDetalle(s, 'detalle');
      });
    }
    container.appendChild(card);
  });
}

/* ══════════════════════════════════════════════
   NAVEGACIÓN LABEL (semana / mes)
   ══════════════════════════════════════════════ */
function actualizarNavLabel() {
  var label = document.getElementById('weekLabel');
  if (!label) return;
  if (vistaActual === 'semana') {
    var inicio = getInicioSemana();
    var fin    = new Date(inicio); fin.setDate(inicio.getDate() + 6);
    label.textContent = inicio.getDate() + ' – ' + fin.getDate() + ' ' + MESES_CORTO[fin.getMonth()] + ' ' + fin.getFullYear();
  } else if (vistaActual === 'mes') {
    var ini = getInicioMes();
    var MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    label.textContent = MESES[ini.getMonth()] + ' ' + ini.getFullYear();
  } else {
    label.textContent = 'Próximas sesiones';
  }
}

/* ══════════════════════════════════════════════
   PANEL DERECHO: DISPONIBILIDAD
   ══════════════════════════════════════════════ */
function renderAvailSlots() {
  var container = document.getElementById('availSlots');
  if (!container) return;
  var dispon = cargarDisponibilidad();
  container.innerHTML = '';
  dispon.forEach(function (slot) {
    var div = document.createElement('div');
    div.className = 'avail-slot';
    div.innerHTML =
      '<span class="avail-slot-day">' + slot.dia + '</span>' +
      '<span class="avail-slot-time">' + slot.horas + '</span>' +
      '<span class="avail-slot-dot"></span>';
    container.appendChild(div);
  });
}

/* ══════════════════════════════════════════════
   RESUMEN DE LA SEMANA
   ══════════════════════════════════════════════ */
function actualizarResumenSemana() {
  var inicio = getInicioSemana();
  var fin    = new Date(inicio); fin.setDate(inicio.getDate() + 6);
  var iStr   = inicio.toISOString().split('T')[0];
  var fStr   = fin.toISOString().split('T')[0];

  var sesionesSemana = SESIONES.filter(function (s) {
    return s.fecha >= iStr && s.fecha <= fStr;
  });

  var sesEl = document.querySelector('.ws-row:nth-child(1) strong');
  var hrEl  = document.querySelector('.ws-row:nth-child(2) strong');
  var incEl = document.querySelector('.ws-row:nth-child(3) strong');

  if (sesEl) sesEl.textContent = sesionesSemana.length;
  if (hrEl) {
    var totalMin = sesionesSemana.reduce(function(acc,s){ return acc + (s.duracion||60); }, 0);
    hrEl.textContent = (totalMin / 60).toFixed(1) + ' h';
  }
  if (incEl) {
    var totalInc = sesionesSemana.reduce(function(acc,s){
      var val = parseInt((s.precio||'0').replace(/\D/g,''));
      return acc + (isNaN(val)?0:val);
    }, 0);
    incEl.textContent = '$' + totalInc.toLocaleString('es-CO').replace(',','.') + 'K';
  }
}

/* ══════════════════════════════════════════════
   MODAL DE DISPONIBILIDAD
   ══════════════════════════════════════════════ */
function abrirModalDisponibilidad() {
  var overlay = document.getElementById('disponModalOverlay');
  if (overlay) overlay.classList.add('open');
  renderModalDispon();
}

function cerrarModalDisponibilidad() {
  var overlay = document.getElementById('disponModalOverlay');
  if (overlay) overlay.classList.remove('open');
}

function renderModalDispon() {
  var cont = document.getElementById('disponList');
  if (!cont) return;
  var dispon = cargarDisponibilidad();
  cont.innerHTML = '';
  dispon.forEach(function (slot, idx) {
    var row = document.createElement('div');
    row.className = 'dispon-row';
    row.innerHTML =
      '<span class="dispon-dia">' + slot.dia + '</span>' +
      '<input class="dispon-input" type="text" value="' + slot.horas + '" data-idx="' + idx + '" placeholder="8:00 AM – 6:00 PM">' +
      '<button class="dispon-del" data-idx="' + idx + '"><i class="fa-solid fa-trash"></i></button>';

    /* Listener de borrar en tiempo real */
    row.querySelector('.dispon-del').addEventListener('click', function () {
      var d = cargarDisponibilidad();
      d.splice(idx, 1);
      guardarDisponibilidad(d);
      renderModalDispon();
      renderAvailSlots();
    });

    cont.appendChild(row);
  });
}

function guardarNuevaDisponibilidad() {
  var dispon = cargarDisponibilidad();

  /* Actualizar horas editadas en los inputs visibles */
  document.querySelectorAll('#disponList .dispon-input').forEach(function (inp) {
    var idx = parseInt(inp.dataset.idx);
    if (!isNaN(idx) && dispon[idx]) dispon[idx].horas = inp.value.trim();
  });

  /* Agregar nuevo slot si se llenó el campo de nuevo día */
  var nuevoDia  = document.getElementById('nuevoDisponDia');
  var nuevoHora = document.getElementById('nuevoDisponHora');
  if (nuevoDia && nuevoHora && nuevoDia.value && nuevoHora.value.trim()) {
    dispon.push({ dia: nuevoDia.value, horas: nuevoHora.value.trim() });
    nuevoDia.value  = '';
    nuevoHora.value = '';
  }

  guardarDisponibilidad(dispon);
  renderAvailSlots();
  cerrarModalDisponibilidad();
}

/* ══════════════════════════════════════════════
   UTILIDADES
   ══════════════════════════════════════════════ */
function formatHora12(hora24) {
  if (!hora24) return '';
  var parts = hora24.split(':');
  var h = parseInt(parts[0]);
  var m = parts[1] || '00';
  var ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + m + ' ' + ampm;
}

function escapeHtml(str) {
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}

function capitalizar(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
