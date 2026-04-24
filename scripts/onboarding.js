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
