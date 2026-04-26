/* =============================================
   onboarding.js — Lógica del flujo de preguntas
   del onboarding para nuevos profesores
   ============================================= */

/* Función para ir de un paso al siguiente — valida que haya selección */
function irPaso(mostrar, ocultar) {
  var elOcultar = document.getElementById(ocultar);
  var elMostrar = document.getElementById(mostrar);

  /* Si vamos hacia adelante (no es botón atrás), validamos selección */
  var esAtras = elMostrar && elOcultar &&
    elMostrar.compareDocumentPosition(elOcultar) & Node.DOCUMENT_POSITION_FOLLOWING;

  if (!esAtras && elOcultar) {
    var grupo = elOcultar.querySelector('.ob-options');
    if (grupo && !grupo.querySelector('.ob-option.selected')) {
      /* Sacudir la tarjeta y mostrar aviso */
      elOcultar.classList.add('shake-card');
      var hint = elOcultar.querySelector('.ob-hint');
      if (hint) {
        hint.textContent = '⚠ Debes seleccionar una opción para continuar';
        hint.classList.add('hint-error');
      }
      setTimeout(function () { elOcultar.classList.remove('shake-card'); }, 400);
      return;
    }
  }

  /* Limpiar aviso si existía */
  if (elOcultar) {
    var hint = elOcultar.querySelector('.ob-hint');
    if (hint) {
      hint.textContent = 'Selecciona una respuesta';
      hint.classList.remove('hint-error');
    }
  }

  if (elOcultar) elOcultar.classList.remove('active');
  if (elMostrar) elMostrar.classList.add('active');
}

/* Hacemos que las opciones de cada pregunta sean seleccionables */
document.querySelectorAll('.ob-options').forEach(function (group) {
  group.querySelectorAll('.ob-option').forEach(function (opt) {
    opt.addEventListener('click', function () {
      group.querySelectorAll('.ob-option').forEach(function (o) {
        o.classList.remove('selected');
        o.querySelector('.custom-check').textContent = '';
      });
      opt.classList.add('selected');
      opt.querySelector('.custom-check').textContent = '✓';

      /* Limpiar el aviso de error al seleccionar */
      var card = group.closest('.ob-card');
      if (card) {
        var hint = card.querySelector('.ob-hint');
        if (hint) {
          hint.textContent = 'Selecciona una respuesta';
          hint.classList.remove('hint-error');
        }
      }
    });
  });
});

/* ── GUARDAR RESPUESTAS DEL ONBOARDING ──
   Se ejecuta cuando el usuario llega al paso final (paso-d)
   y hace clic en el botón "Comenzar". Guardamos en localStorage
   bajo la clave mt_onboarding_prof para que configuracion_profesor
   lo lea y lo muestre en el perfil.
*/
function guardarOnboarding() {
  var ETIQUETAS_FORMACION = {
    universitario: 'Universitario',
    graduado:      'Graduado',
    magister:      'Máster',
    doctorado:     'Doctorado',
    tecnico:       'Técnico / Tecnólogo'
  };
  var ETIQUETAS_EXPERIENCIA = {
    novato:     'Novato (menos de 1 año)',
    intermedio: 'Intermedio (1 a 3 años)',
    avanzado:   'Avanzado (4 a 7 años)',
    senior:     'Senior / Experto (más de 8 años)'
  };
  var ETIQUETAS_MODALIDAD = {
    virtual:     'Virtual',
    presencial:  'Presencial',
    ambas:       'Virtual y presencial'
  };

  function getSeleccion(groupName) {
    var sel = document.querySelector('.ob-options[data-group="' + groupName + '"] .ob-option.selected');
    return sel ? sel.dataset.value : null;
  }

  var formacion  = getSeleccion('formacion');
  var experiencia = getSeleccion('experiencia');
  var modalidad  = getSeleccion('modalidad');

  var datos = {
    nivelFormacion:     formacion  ? ETIQUETAS_FORMACION[formacion]   : null,
    experienciaEnsenando: experiencia ? ETIQUETAS_EXPERIENCIA[experiencia] : null,
    modalidadConexion:  modalidad  ? ETIQUETAS_MODALIDAD[modalidad]   : null
  };

  localStorage.setItem('mt_onboarding_prof', JSON.stringify(datos));
  window.location.href = 'panel_profesor.html';
}

/* Sobreescribir el onclick del botón del paso-d al cargar */
document.addEventListener('DOMContentLoaded', function() {
  var btnFinal = document.querySelector('#paso-d .btn-sig');
  if (btnFinal) {
    btnFinal.removeAttribute('onclick');
    btnFinal.addEventListener('click', guardarOnboarding);
  }
});
