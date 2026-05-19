/* =============================================
   index.js — Lógica del inicio (index.html)
   Maneja el hamburger del nav y las animaciones
   de entrada al hacer scroll
   ============================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* ── HAMBURGER MENU ──
     En móvil aparecen tres líneas que abren el menú */
  var hamburger = document.getElementById('hamburger');
  var navLinks  = document.getElementById('nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function (e) {
      e.stopPropagation(); /* Evitamos que el click cierre el menú inmediatamente */
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });

    /* Si el usuario hace click en cualquier otro lugar, cerramos el menú */
    document.addEventListener('click', function (e) {
      if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      }
    });

    /* Al hacer click en un link del menú, el menú se cierra */
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
  }

 

  /* ── ANIMACIONES DE ENTRADA AL HACER SCROLL ──
     Las secciones aparecen con una animación suave
     cuando el usuario llega a ellas al hacer scroll */
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      /* Si la sección es visible en la pantalla */
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        /* Dejamos de observar esta sección para no repetir la animación */
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });

  /* Aplicamos la animación a todas las secciones principales */
  document.querySelectorAll('section, .map-section, .features-bar, .become-section').forEach(function (el) {
    el.classList.add('reveal');
    observer.observe(el);
  });
});
