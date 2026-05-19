/* =============================================
   faq.js — Lógica de la página de preguntas
   frecuentes de myTeacher
   ============================================= */

/* ── BOTONES DE "LIKE" EN LAS PREGUNTAS ──
   Cada botón de corazón sube o baja el contador al hacer click */
document.querySelectorAll('.faq-likes').forEach(function (btn) {
  btn.addEventListener('click', function () {
    /* Sacamos el número actual borrando todo lo que no sea dígito */
    var num = parseInt(btn.textContent.replace(/\D/g, '')) || 0;
    /* Revisamos si ya le dimos like antes */
    var liked = btn.dataset.liked === 'true';
    /* Si ya le dimos like, lo quitamos; si no, lo ponemos */
    btn.innerHTML = '<span>❤️</span> ' + (liked ? num - 1 : num + 1);
    btn.dataset.liked = String(!liked);
    /* Cambiamos el color del botón según si está activo o no */
    btn.style.color = liked ? '' : '#ec4899';
  });
});

/* ── BUSCADOR DE PREGUNTAS ──
   Al escribir y presionar Enter o hacer click en el botón,
   simula una búsqueda */
function buscarFAQ() {
  var input = document.getElementById('faq-search');
  var q = input ? input.value.trim() : '';
  if (!q) return; /* Si no hay texto, no hacemos nada */
  var btn = document.querySelector('.btn-preguntar');
  if (btn) {
    /* Cambiamos el texto del botón para dar feedback visual */
    btn.textContent = 'Buscando...';
    setTimeout(function () { btn.textContent = 'Preguntar'; }, 1500);
  }
}

/* Escuchamos la tecla Enter en el buscador */
var faqSearch = document.getElementById('faq-search');
if (faqSearch) {
  faqSearch.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') buscarFAQ();
  });
}

/* ── BOTONES DE "RESPONDER" ──
   Al hacer click, el botón cambia a "✓ Enviada" brevemente */
document.querySelectorAll('.btn-respond').forEach(function (btn) {
  btn.addEventListener('click', function () {
    btn.textContent = '✓ Enviada';
    btn.style.borderColor = '#7a9848';
    btn.style.color = '#7a9848';
    /* Después de 2.5 segundos vuelve al estado original */
    setTimeout(function () {
      btn.textContent = 'Responder';
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 2500);
  });
});
