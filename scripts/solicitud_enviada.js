/* =============================================
   solicitud_enviada.js — Lógica de la página
   de confirmación de solicitud de tutoría
   ============================================= */

/* Cuando la página carga, mostramos los datos de la tutoría
   que guardamos en la página anterior (agendar_tutoria.html) */
document.addEventListener('DOMContentLoaded', function () {

  /* Buscamos los datos guardados de la tutoría */
  var datosTutoria = JSON.parse(localStorage.getItem('mt_tutoria_pendiente') || '{}');

  /* Si hay datos guardados, los mostramos en la página */
  if (datosTutoria.profesor) {
    setTexto('resProfesor', datosTutoria.profesor);
    setTexto('resFecha', datosTutoria.fecha);
    setTexto('resHora', datosTutoria.hora);
    setTexto('resDuracion', datosTutoria.duracion);
    setTexto('resModalidad', datosTutoria.modalidad);
    setTexto('resTema', datosTutoria.tema);
    setTexto('resPrecio', datosTutoria.precio);
  }

  /* Después de mostrar los datos, los borramos para que no
     queden guardados si el usuario recarga la página */
  localStorage.removeItem('mt_tutoria_pendiente');
});

/* Función pequeña que cambia el texto de un elemento por su ID */
function setTexto(id, texto) {
  var el = document.getElementById(id);
  if (el && texto) el.textContent = texto;
}
