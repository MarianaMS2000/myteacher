/* =============================================
   favoritos.js — Lógica de la página de tutores favoritos
   ============================================= */

/* Función para quitar/poner un tutor de favoritos
   cuando el usuario hace click en el corazón */
function toggleFavorito(btn) {
  /* Buscamos el ícono dentro del botón */
  var icon = btn.querySelector('i');

  /* Alternamos entre corazón lleno y corazón vacío */
  if (icon.classList.contains('fa-solid')) {
    /* Si era sólido (favorito), lo cambiamos a vacío */
    icon.classList.remove('fa-solid');
    icon.classList.add('fa-regular');
    btn.style.color = '#9ca3af'; /* Gris para indicar que ya no es favorito */
    btn.title = 'Agregar a favoritos';
  } else {
    /* Si era vacío, lo volvemos sólido (favorito) */
    icon.classList.remove('fa-regular');
    icon.classList.add('fa-solid');
    btn.style.color = '#e53e3e'; /* Rojo para indicar que es favorito */
    btn.title = 'Quitar de favoritos';
  }
}
