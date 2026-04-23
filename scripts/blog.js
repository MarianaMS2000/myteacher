/* =============================================
   blog.js — Lógica de la página Blog Docente
   Maneja el menú hamburger para móvil
   ============================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* ── HAMBURGER MENU ──
     En móvil aparecen tres líneas que abren el menú */
  var hamburger = document.getElementById('hamburger');
  var navLinks  = document.getElementById('nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function (e) {
      e.stopPropagation();
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });

    document.addEventListener('click', function (e) {
      if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      }
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
  }

});
