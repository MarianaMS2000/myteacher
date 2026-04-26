/* =============================================
   nueva_sesion_profesor.js — Formulario para
   crear una nueva sesión. Guarda en localStorage
   para que aparezca en la agenda y el calendario.
   ============================================= */

var LS_SESIONES = 'mt_sesiones_prof';

var ESTUDIANTES_DEMO = [
  { nombre: 'Carlos Lizarazo',    iniciales: 'CL', color: '#4a7a30', materia: 'Cálculo Diferencial' },
  { nombre: 'María Suárez',       iniciales: 'MS', color: '#7c3aed', materia: 'Álgebra Lineal'      },
  { nombre: 'Julián Rodríguez',   iniciales: 'JR', color: '#db2777', materia: 'Física Mecánica'     },
  { nombre: 'Valentina Pérez',    iniciales: 'VP', color: '#059669', materia: 'Cálculo Integral'    },
  { nombre: 'Felipe Gómez',       iniciales: 'FG', color: '#d97706', materia: 'Estadística'         },
  { nombre: 'Isabella Torres',    iniciales: 'IT', color: '#7c3aed', materia: 'Álgebra Lineal'      },
  { nombre: 'Santiago López',     iniciales: 'SL', color: '#1d4ed8', materia: 'Cálculo Diferencial' },
  { nombre: 'Camila Moreno',      iniciales: 'CM', color: '#be185d', materia: 'Física Mecánica'     },
  { nombre: 'Andrés Castillo',    iniciales: 'AC', color: '#92400e', materia: 'Cálculo Diferencial' },
  { nombre: 'Luciana Vargas',     iniciales: 'LV', color: '#0e7490', materia: 'Álgebra Lineal'      },
];

var estudianteSeleccionado = null;

document.addEventListener('DOMContentLoaded', function () {
  /* Fecha por defecto = hoy */
  var fechaInput = document.getElementById('fechaInput');
  if (fechaInput) {
    var hoy = new Date();
    fechaInput.value = hoy.toISOString().split('T')[0];
  }

  /* Hora por defecto = hora actual + 1 */
  var horaInput = document.getElementById('horaInput');
  if (horaInput) {
    var hora = new Date();
    hora.setHours(hora.getHours() + 1, 0);
    horaInput.value = hora.toTimeString().slice(0, 5);
  }

  /* Mostrar/ocultar campo link según modalidad */
  var modalidadSelect = document.getElementById('modalidadSelect');
  if (modalidadSelect) {
    modalidadSelect.addEventListener('change', function () {
      var linkGroup = document.getElementById('linkGroup');
      if (linkGroup) linkGroup.style.display = this.value === 'presencial' ? 'none' : '';
    });
  }

  /* Cerrar dropdown al hacer click fuera */
  document.addEventListener('click', function (e) {
    var wrap = document.getElementById('studentSearch');
    if (wrap && !wrap.contains(e.target)) {
      var dd = document.getElementById('studentDropdown');
      if (dd) dd.classList.remove('open');
    }
  });
});

/* ── BÚSQUEDA DE ESTUDIANTE ── */
function buscarEstudiante(query) {
  var dd = document.getElementById('studentDropdown');
  if (!dd) return;
  var q = query.trim().toLowerCase();
  if (!q) { dd.classList.remove('open'); dd.innerHTML = ''; return; }

  var filtrados = ESTUDIANTES_DEMO.filter(function (e) {
    return e.nombre.toLowerCase().includes(q);
  });

  if (filtrados.length === 0) { dd.classList.remove('open'); return; }

  dd.innerHTML = '';
  filtrados.forEach(function (est) {
    var item = document.createElement('div');
    item.className = 'student-drop-item';
    item.innerHTML =
      '<div class="student-drop-avatar" style="background:' + est.color + ';">' + est.iniciales + '</div>' +
      '<div><div class="student-drop-name">' + escapeHtml(est.nombre) + '</div>' +
      '<div class="student-drop-materia">' + escapeHtml(est.materia) + '</div></div>';
    item.addEventListener('click', function () { seleccionarEstudiante(est); });
    dd.appendChild(item);
  });
  dd.classList.add('open');
}

function seleccionarEstudiante(est) {
  estudianteSeleccionado = est;
  var searchInput = document.getElementById('studentSearch');
  var dd = document.getElementById('studentDropdown');
  var selDiv = document.getElementById('selectedStudent');
  if (searchInput) { searchInput.value = ''; searchInput.style.display = 'none'; }
  if (dd) { dd.classList.remove('open'); dd.innerHTML = ''; }
  if (selDiv) {
    selDiv.style.display = 'flex';
    selDiv.innerHTML =
      '<div class="sel-avatar" style="background:' + est.color + ';">' + est.iniciales + '</div>' +
      '<div class="sel-name">' + escapeHtml(est.nombre) +
        '<div style="font-size:.75rem;color:var(--muted);font-weight:400;">' + escapeHtml(est.materia) + '</div>' +
      '</div>' +
      '<button class="sel-remove" onclick="removerEstudiante()"><i class="fa-solid fa-xmark"></i></button>';
  }
  /* Pre-seleccionar materia */
  var materiaMap = {
    'Cálculo Diferencial': 'calculo-diferencial',
    'Álgebra Lineal':      'algebra-lineal',
    'Física Mecánica':     'fisica-mecanica',
    'Cálculo Integral':    'calculo-integral',
    'Estadística':         'estadistica'
  };
  var sel = document.getElementById('materiaSelect');
  if (sel && materiaMap[est.materia]) sel.value = materiaMap[est.materia];
}

function removerEstudiante() {
  estudianteSeleccionado = null;
  var searchInput = document.getElementById('studentSearch');
  var selDiv = document.getElementById('selectedStudent');
  if (searchInput) { searchInput.style.display = ''; searchInput.value = ''; searchInput.focus(); }
  if (selDiv) { selDiv.style.display = 'none'; selDiv.innerHTML = ''; }
}

/* ── PRECIO ── */
function setPrice(val) {
  var input = document.getElementById('precioInput');
  if (input) input.value = val;
}

/* ── CREAR SESIÓN Y GUARDAR EN LOCALSTORAGE ── */
function crearSesion() {
  var materiaVal  = document.getElementById('materiaSelect').value;
  var fecha       = document.getElementById('fechaInput').value;
  var hora        = document.getElementById('horaInput').value;
  var duracion    = parseInt(document.getElementById('duracionSelect').value);
  var modalidad   = document.getElementById('modalidadSelect').value;
  var precio      = document.getElementById('precioInput').value;

  if (!estudianteSeleccionado) { alert('Por favor selecciona un estudiante.'); return; }
  if (!materiaVal) { alert('Por favor selecciona una materia.'); return; }
  if (!fecha)      { alert('Por favor selecciona una fecha.'); return; }
  if (!hora)       { alert('Por favor selecciona una hora.'); return; }
  if (!precio)     { alert('Por favor ingresa el precio.'); return; }

  /* ──  GUARDAR en localStorage ── */
  var sesiones = JSON.parse(localStorage.getItem(LS_SESIONES) || '[]');
  var precioNum = parseInt(precio);
  var precioFmt = '$' + Math.round(precioNum / 1000) + 'K';

  var nuevaSesion = {
    id:         Date.now(),
    fecha:      fecha,
    hora:       hora,
    duracion:   duracion,
    estudiante: estudianteSeleccionado.nombre,
    iniciales:  estudianteSeleccionado.iniciales,
    color:      estudianteSeleccionado.color,
    materia:    materiaVal.replace(/-/g, ' ').replace(/\b\w/g, function(c){ return c.toUpperCase(); }),
    tipo:       modalidad,
    precio:     precioFmt
  };
  sesiones.push(nuevaSesion);
  localStorage.setItem(LS_SESIONES, JSON.stringify(sesiones));

  /* ── MOSTRAR MODAL DE CONFIRMACIÓN ── */
  var modalText = document.getElementById('nsModalText');
  if (modalText) {
    var meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    var dObj  = new Date(fecha + 'T00:00:00');
    var fechaStr = dObj.getDate() + ' ' + meses[dObj.getMonth()] + ' · ' + formatHora12(hora);
    modalText.textContent =
      'Sesión con ' + estudianteSeleccionado.nombre + ' el ' + fechaStr +
      ' — ' + duracion + ' min — ' + capitalizar(modalidad) + ' — ' + precioFmt;
  }
  document.getElementById('nsModalOverlay').classList.add('open');
}

function cerrarModal() {
  document.getElementById('nsModalOverlay').classList.remove('open');
  removerEstudiante();
  document.getElementById('materiaSelect').value = '';
  document.getElementById('precioInput').value = '';
  document.getElementById('notasInput').value = '';
  var li = document.getElementById('linkInput');
  if (li) li.value = '';
}

/* ── UTILIDADES ── */
function formatHora12(hora24) {
  var parts = hora24.split(':');
  var h = parseInt(parts[0]);
  var m = parts[1] || '00';
  var ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + m + ' ' + ampm;
}

function capitalizar(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

function escapeHtml(str) {
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}
