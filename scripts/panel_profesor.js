/* =============================================
   panel_profesor.js — Lógica del panel del profesor
   (gráfico de barras de ganancias y nombre de perfil)
   ============================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* ── NOMBRE DEL PROFESOR EN EL PERFIL ──
     Mostramos el nombre también en la tarjeta de perfil del panel derecho */
  var stored = JSON.parse(localStorage.getItem('mt_user') || '{}');
  var profileNameEl = document.getElementById('profileName');
  if (profileNameEl && stored.nombre) {
    profileNameEl.textContent = stored.nombre;
  }

  /* ── GRÁFICO DE BARRAS DE GANANCIAS ──
     Creamos las barras del gráfico usando los porcentajes de altura */
  var chartBars = document.getElementById('chartBars');
  if (chartBars) {
    /* Cada número es el porcentaje de altura de la barra (semana 1 a 4) */
    var data = [55, 80, 70, 95];
    data.forEach(function (pct, i) {
      /* Contenedor de cada barra */
      var wrap = document.createElement('div');
      wrap.className = 'chart-bar-wrap';

      /* La barra en sí, con altura proporcional */
      var bar = document.createElement('div');
      bar.className = 'chart-bar' + (i === 3 ? ' active' : ''); /* La última semana (actual) está resaltada */
      bar.style.height = pct + '%';
      wrap.appendChild(bar);
      chartBars.appendChild(wrap);
    });
  }

  /* ── DÍAS CON SESIÓN EN EL CALENDARIO ──
     Marcamos los días que tienen sesiones con un puntito verde */
  var calGrid = document.getElementById('calDays');
  if (calGrid) {
    /* Días del mes que tienen sesiones programadas */
    var sessionDays = [2, 7, 9, 14, 16, 21, 23];

    /* Volvemos a renderizar el calendario pero marcando los días con sesión */
    var today = new Date();
    var year = today.getFullYear();
    var month = today.getMonth();
    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();

    calGrid.innerHTML = '';
    var offset = firstDay === 0 ? 6 : firstDay - 1;
    for (var i = 0; i < offset; i++) {
      var emptyEl = document.createElement('div');
      emptyEl.className = 'cal-day empty';
      calGrid.appendChild(emptyEl);
    }
    for (var d = 1; d <= daysInMonth; d++) {
      var el = document.createElement('div');
      el.className = 'cal-day';
      el.textContent = d;
      if (d === today.getDate()) el.classList.add('today');
      /* Si el día tiene sesión, le ponemos la clase que agrega el puntito */
      if (sessionDays.indexOf(d) !== -1) el.classList.add('has-event');
      calGrid.appendChild(el);
    }
  }
});
