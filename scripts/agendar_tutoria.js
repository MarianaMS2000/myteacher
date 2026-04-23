/* =============================================
   agendar_tutoria.js — Lógica del formulario
   para agendar una tutoría con un profesor
   ============================================= */

/* Cuando la página termina de cargar, conectamos los eventos */
document.addEventListener('DOMContentLoaded', function () {

  var materiaSelect  = document.getElementById('materiaSelect');
  var duracionSelect = document.getElementById('duracionSelect');
  var precioHoraEl   = document.getElementById('precioHora');
  var totalPrecioEl  = document.getElementById('totalPrecio');
  var btnAgendar     = document.getElementById('btnAgendar');

  /* Función que calcula el precio automáticamente
     cuando el usuario cambia la materia o la duración */
  function calcularPrecio() {
    var optionSeleccionada = materiaSelect.options[materiaSelect.selectedIndex];
    var precioHora = parseInt(optionSeleccionada.dataset.precio) || 15;
    var horas = parseInt(duracionSelect.value) || 1;

    /* Mostramos el precio por hora */
    precioHoraEl.value = precioHora + 'k/h';
    /* Calculamos el total multiplicando precio x horas */
    totalPrecioEl.value = (precioHora * horas) + 'k';
  }

  /* Cada vez que cambia la materia, recalculamos el precio */
  if (materiaSelect) {
    materiaSelect.addEventListener('change', calcularPrecio);
  }

  /* Cada vez que cambia la duración, recalculamos el precio */
  if (duracionSelect) {
    duracionSelect.addEventListener('change', calcularPrecio);
  }

  /* Calculamos el precio al cargar la página por primera vez */
  calcularPrecio();

  /* Cuando el usuario hace click en "Agendar tutoría"
     guardamos los datos y vamos a la página de confirmación */
  if (btnAgendar) {
    btnAgendar.addEventListener('click', function () {
      var fecha    = document.getElementById('fechaInput').value;
      var horario  = document.getElementById('horarioSelect').value;
      var materia  = materiaSelect.value;
      var modalidad = document.getElementById('modalidadSelect').value;
      var total    = totalPrecioEl.value;
      var duracion = duracionSelect.value;

      /* Verificamos que los campos obligatorios estén llenos */
      if (!fecha || !horario) {
        alert('Por favor selecciona la fecha y el horario de la tutoría.');
        return;
      }

      /* Guardamos los datos de la tutoría en el navegador
         para mostrarlos en la página de confirmación */
      var datosTutoria = {
        profesor: 'Ricardo Soler',
        fecha: formatearFecha(fecha),
        hora: formatearHora(horario),
        duracion: duracion + ' hora' + (duracion > 1 ? 's' : ''),
        modalidad: modalidad,
        tema: materia,
        precio: total + ' COP'
      };
      localStorage.setItem('mt_tutoria_pendiente', JSON.stringify(datosTutoria));

      /* Cambiamos el botón para dar feedback visual */
      btnAgendar.textContent = 'Enviando...';
      btnAgendar.disabled = true;

      /* Esperamos un momento y vamos a la confirmación */
      setTimeout(function () {
        window.location.href = 'solicitud_enviada.html';
      }, 1000);
    });
  }
});

/* Convierte la fecha de formato yyyy-mm-dd a "12 de abril" */
function formatearFecha(fecha) {
  if (!fecha) return 'No seleccionada';
  var partes = fecha.split('-');
  var meses = ['enero','febrero','marzo','abril','mayo','junio',
               'julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return partes[2] + ' de ' + meses[parseInt(partes[1]) - 1];
}

/* Convierte "16:00" a "4:00 PM" */
function formatearHora(hora) {
  if (!hora) return 'No seleccionada';
  var partes = hora.split(':');
  var h = parseInt(partes[0]);
  var ampm = h >= 12 ? 'PM' : 'AM';
  var h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  return h12 + ':' + partes[1] + ' ' + ampm;
}
