/* agendar_tutoria.js — Lógica del formulario para agendar una tutoría */

var tutorActual = null;

document.addEventListener('DOMContentLoaded', async function () {

  /* ── 1. Cargar tutor real desde URL params ── */
  var params    = new URLSearchParams(window.location.search);
  var profId    = params.get('id');

  if (profId) {
    await cargarDatosTutor(profId);
  }

  var materiaSelect  = document.getElementById('materiaSelect');
  var duracionSelect = document.getElementById('duracionSelect');
  var precioHoraEl   = document.getElementById('precioHora');
  var totalPrecioEl  = document.getElementById('totalPrecio');
  var btnAgendar     = document.getElementById('btnAgendar');

  function calcularPrecio() {
    var optionSeleccionada = materiaSelect ? materiaSelect.options[materiaSelect.selectedIndex] : null;
    var precioHora = optionSeleccionada ? (parseInt(optionSeleccionada.dataset.precio) || 15) : 15;
    var horas = parseInt(duracionSelect ? duracionSelect.value : 1) || 1;
    if (precioHoraEl) precioHoraEl.value = precioHora + 'k/h';
    if (totalPrecioEl) totalPrecioEl.value = (precioHora * horas) + 'k';
  }

  if (materiaSelect) materiaSelect.addEventListener('change', calcularPrecio);
  if (duracionSelect) duracionSelect.addEventListener('change', calcularPrecio);
  calcularPrecio();

  /* ── 2. Submit: enviar solicitud real al backend ── */
  if (btnAgendar) {
    btnAgendar.addEventListener('click', async function () {
      var fecha     = document.getElementById('fechaInput') ? document.getElementById('fechaInput').value : '';
      var horario   = document.getElementById('horarioSelect') ? document.getElementById('horarioSelect').value : '';
      var materia   = materiaSelect ? materiaSelect.value : '';
      var modalidad = document.getElementById('modalidadSelect') ? document.getElementById('modalidadSelect').value : 'Virtual';
      var total     = totalPrecioEl ? totalPrecioEl.value : '';
      var duracion  = duracionSelect ? duracionSelect.value : '1';
      var mensaje   = document.getElementById('mensajeInput') ? document.getElementById('mensajeInput').value.trim() : '';

      if (!fecha || !horario) {
        alert('Por favor selecciona la fecha y el horario de la tutoría.');
        return;
      }
      if (!materia) {
        alert('Por favor selecciona la materia.');
        return;
      }

      var token = typeof getToken === 'function' ? getToken() : localStorage.getItem('mt_token');
      var nombreProfesor = tutorActual ? tutorActual.nombre : (params.get('nombre') || 'Profesor');
      var idProfesor = profId || (tutorActual ? tutorActual.id : null);

      /* Guardar datos para mostrar en la pantalla de confirmación */
      var datosTutoria = {
        profesor:    nombreProfesor,
        profesorId:  idProfesor,
        fecha:       formatearFecha(fecha),
        hora:        formatearHora(horario),
        duracion:    duracion + ' hora' + (duracion > 1 ? 's' : ''),
        modalidad:   modalidad,
        tema:        materia,
        precio:      total + ' COP',
        mensaje:     mensaje
      };
      localStorage.setItem('mt_tutoria_pendiente', JSON.stringify(datosTutoria));

      btnAgendar.textContent = 'Enviando...';
      btnAgendar.disabled = true;

      /* Guardar en la BD como solicitud real */
      if (token && idProfesor) {
        try {
          var optSelected = materiaSelect ? materiaSelect.options[materiaSelect.selectedIndex] : null;
          var precioHora  = optSelected ? (parseInt(optSelected.dataset.precio) || 15) : 15;
          var precioTotal = precioHora * parseInt(duracion) * 1000;
          /* Buscar materia_id si está disponible */
          var materiaId = optSelected ? (parseInt(optSelected.dataset.materiaId) || null) : null;

          var respSolicitud = await fetch('/api/solicitudes', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body:    JSON.stringify({
              profesor_id:  parseInt(idProfesor),
              materia_id:   materiaId,
              fecha_prop:   fecha,
              hora_prop:    horario,
              duracion_min: parseInt(duracion) * 60,
              modalidad:    modalidad.toLowerCase(),
              precio_cop:   precioTotal,
              mensaje:      mensaje || ''
            })
          });
          if (!respSolicitud.ok) {
            var errData = await respSolicitud.json().catch(function(){return {};});
            console.warn('Error guardando solicitud:', errData.error || respSolicitud.status);
          } else {
            var solData = await respSolicitud.json();
            /* Guardar el id de la solicitud para poder cancelarla */
            datosTutoria.solicitudId = solData.id;
            localStorage.setItem('mt_tutoria_pendiente', JSON.stringify(datosTutoria));
          }
        } catch(e) {
          console.warn('No se pudo guardar la solicitud en el servidor:', e);
        }
      }

      setTimeout(function () {
        window.location.href = 'solicitud_enviada.html';
      }, 800);
    });
  }
});

/* ── Cargar datos del tutor desde la API o TUTORES_DB ── */
async function cargarDatosTutor(profId) {
  var tutor = null;

  /* Intentar desde la API primero */
  try {
    var res = await fetch('/api/tutores/' + profId);
    if (res.ok) {
      var data = await res.json();
      if (data && (data.tutor || data.id)) {
        var raw = data.tutor || data;
        tutor = {
          id:           String(raw.id || profId),
          nombre:       raw.nombre || '',
          foto:         raw.foto_url || '',
          especialidad: raw.especialidad || '',
          ubicacion:    raw.ciudad || raw.ubicacion || 'Colombia',
          nivel:        raw.nivel || raw.nivel_educativo || '',
          email:        raw.email || '',
          telefono:     raw.telefono || '',
          materias:     Array.isArray(raw.materias)
                          ? raw.materias
                          : (raw.materias ? raw.materias.split(',').map(function(m){ return m.trim(); }) : []),
          materias_con_id: raw.materias_con_id || [], /* [{id, nombre}] si la API los devuelve */
          precio_min:   raw.precio_min_cop ? Math.round(raw.precio_min_cop / 1000) : 15,
          precio_max:   raw.precio_max_cop ? Math.round(raw.precio_max_cop / 1000) : 50,
          modalidad:    raw.modalidad || 'virtual',
          descripcion:  raw.descripcion || ''
        };
      }
    }
  } catch(e) {}

  /* Fallback: buscar en TUTORES_DB local */
  if (!tutor && typeof getTutorById === 'function') {
    var local = getTutorById(profId);
    if (local) {
      tutor = {
        id:           String(local.id),
        nombre:       local.nombre || '',
        foto:         local.foto || '',
        especialidad: local.especialidad || '',
        ubicacion:    local.ubicacion || '',
        nivel:        local.nivel || '',
        email:        local.email || '',
        telefono:     local.telefono || '',
        materias:     local.materias || [],
        precio_min:   extraerPrecioMinLocal(local.precio),
        precio_max:   extraerPrecioMaxLocal(local.precio),
        modalidad:    local.modalidad || 'virtual'
      };
    }
  }

  if (!tutor) return;
  tutorActual = tutor;

  /* Actualizar mini tarjeta del tutor */
  var miniAvatar = document.querySelector('.tutor-mini-avatar img');
  if (miniAvatar) { miniAvatar.src = tutor.foto || ''; miniAvatar.alt = tutor.nombre; }

  var miniNombre = document.querySelector('.tutor-mini-nombre');
  if (miniNombre) miniNombre.innerHTML = escapeHtml(tutor.nombre) + ' <i class="fa-solid fa-circle-check check" style="color:#22c55e"></i>';

  var miniEsp = document.querySelector('.tutor-mini-esp');
  if (miniEsp) miniEsp.textContent = tutor.especialidad;

  var miniLoc = document.querySelector('.tutor-mini-loc');
  if (miniLoc) miniLoc.innerHTML = '<i class="fa-solid fa-location-dot"></i> ' + escapeHtml(tutor.ubicacion);

  var miniDatos = document.querySelector('.tutor-mini-datos');
  if (miniDatos) miniDatos.innerHTML =
    '<span><strong>Nivel:</strong> ' + escapeHtml(tutor.nivel || 'Todos los niveles') + '</span>' +
    (tutor.email ? '<span><strong>Email:</strong> ' + escapeHtml(tutor.email) + '</span>' : '') +
    (tutor.telefono ? '<span><strong>Teléfono:</strong> ' + escapeHtml(tutor.telefono) + '</span>' : '');

  /* Actualizar chips de materias */
  var miniChips = document.querySelector('.mini-chips');
  if (miniChips && tutor.materias.length > 0) {
    miniChips.innerHTML = tutor.materias.map(function(m) {
      return '<span class="mini-chip">' + escapeHtml(m) + '</span>';
    }).join('');
  }

  /* Actualizar select de materias del formulario con las reales del profesor */
  var materiaSelect = document.getElementById('materiaSelect');
  if (materiaSelect) {
    var materiasDisp = tutor.materias_con_id && tutor.materias_con_id.length
      ? tutor.materias_con_id
      : tutor.materias.map(function(m){ return { id: null, nombre: m }; });

    if (materiasDisp.length > 0) {
      var precioBase = tutor.precio_min || 15;
      materiaSelect.innerHTML = materiasDisp.map(function(m, i) {
        var precio = precioBase + Math.floor(i * 2.5);
        var nombre = typeof m === 'string' ? m : m.nombre;
        var matId  = (typeof m === 'object' && m.id) ? m.id : '';
        return '<option value="' + escapeHtml(nombre) + '" data-precio="' + precio + '" data-materia-id="' + matId + '">' + escapeHtml(nombre) + '</option>';
      }).join('');
    } else {
      /* Fallback si el tutor aún no tiene materias registradas */
      materiaSelect.innerHTML = '<option value="General">General</option>';
    }
  }

  /* Actualizar título de la página */
  var titulo = document.querySelector('h2, .page-title');
  if (titulo && titulo.textContent.includes('Agendar')) {
    titulo.textContent = 'Agendar tutoría con ' + tutor.nombre;
  }
}

function extraerPrecioMinLocal(str) {
  var m = (str || '').match(/(\d+)k/i);
  return m ? parseInt(m[1], 10) : 15;
}
function extraerPrecioMaxLocal(str) {
  var m = (str || '').match(/\d+k\s*-\s*(\d+)k/i);
  return m ? parseInt(m[1], 10) : 50;
}
function escapeHtml(str) {
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str || '')));
  return d.innerHTML;
}
function formatearFecha(fecha) {
  if (!fecha) return 'No seleccionada';
  var partes = fecha.split('-');
  var meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return partes[2] + ' de ' + meses[parseInt(partes[1]) - 1];
}
function formatearHora(hora) {
  if (!hora) return 'No seleccionada';
  var partes = hora.split(':');
  var h = parseInt(partes[0]);
  var ampm = h >= 12 ? 'PM' : 'AM';
  var h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  return h12 + ':' + partes[1] + ' ' + ampm;
}
