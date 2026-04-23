/* =============================================
   onboarding.js — Lógica del flujo de preguntas
   del onboarding para nuevos profesores
   ============================================= */

/* Función para ir de un paso al siguiente */
function irPaso(mostrar, ocultar) {
  var elOcultar = document.getElementById(ocultar);
  var elMostrar = document.getElementById(mostrar);
  /* Ocultamos el paso actual */
  if (elOcultar) elOcultar.classList.remove('active');
  /* Mostramos el siguiente paso */
  if (elMostrar) elMostrar.classList.add('active');
}

/* Hacemos que las opciones de cada pregunta sean seleccionables */
document.querySelectorAll('.ob-options').forEach(function (group) {
  group.querySelectorAll('.ob-option').forEach(function (opt) {
    opt.addEventListener('click', function () {
      /* Primero deseleccionamos todas las opciones del grupo */
      group.querySelectorAll('.ob-option').forEach(function (o) {
        o.classList.remove('selected');
        o.querySelector('.custom-check').textContent = '';
      });
      /* Luego seleccionamos la que hizo click el usuario */
      opt.classList.add('selected');
      opt.querySelector('.custom-check').textContent = '✓';
    });
  });
});
