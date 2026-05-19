/* =============================================
   solicitud_enviada.js — Lógica de la página
   de confirmación de solicitud de tutoría
   ============================================= */

document.addEventListener('DOMContentLoaded', async function () {

  /* Datos de la tutoría guardados al agendar */
  var datosTutoria = {};
  try { datosTutoria = JSON.parse(localStorage.getItem('mt_tutoria_pendiente') || '{}'); } catch(e) {}

  /* Mostrar datos del resumen de la tutoría */
  if (datosTutoria.profesor) {
    setTexto('resProfesor', datosTutoria.profesor);
    setTexto('resFecha',    datosTutoria.fecha);
    setTexto('resHora',     datosTutoria.hora);
    setTexto('resDuracion', datosTutoria.duracion);
    setTexto('resModalidad',datosTutoria.modalidad);
    setTexto('resTema',     datosTutoria.tema);
    setTexto('resPrecio',   datosTutoria.precio);
  }

  /* Cargar datos reales del tutor desde la API para la mini-card */
  var profesorId = datosTutoria.profesorId;
  if (profesorId) {
    try {
      var res = await fetch('/api/tutores/' + profesorId);
      if (res.ok) {
        var data = await res.json();
        var t = data.tutor || data;
        if (t && t.id) {
          /* Foto */
          var avatarEl = document.getElementById('tutorMiniAvatar');
          if (avatarEl) {
            if (t.foto_url) { avatarEl.src = t.foto_url; }
            else { avatarEl.style.display = 'none'; avatarEl.parentNode.style.background = '#4a7a30'; }
          }
          /* Verificado */
          var checkEl = document.getElementById('tutorMiniCheck');
          if (checkEl && t.verificado) checkEl.style.display = '';

          setTexto('tutorMiniNombre', t.nombre || datosTutoria.profesor || 'Tutor');
          setTexto('tutorMiniEsp',    t.especialidad || '');
          setTexto('tutorMiniLoc',    t.ciudad || 'Colombia');

          var nivel = t.nivel || t.nivel_educativo || '';
          var email = t.email || '';
          var tel   = t.telefono || '';
          var nivelEl = document.getElementById('tutorMiniNivel');
          var emailEl = document.getElementById('tutorMiniEmail');
          var telEl   = document.getElementById('tutorMiniTel');
          if (nivelEl && nivel) nivelEl.innerHTML = '<strong>Nivel:</strong> ' + nivel;
          if (emailEl && email) emailEl.innerHTML = '<strong>Email:</strong> ' + email;
          if (telEl   && tel)   telEl.innerHTML   = '<strong>Teléfono:</strong> ' + tel;

          /* Materias */
          var materiasContainer = document.getElementById('tutorMiniMaterias');
          if (materiasContainer) {
            var materias = Array.isArray(t.materias)
              ? t.materias
              : (t.materias ? t.materias.split(',').map(function(m){ return m.trim(); }) : []);
            materias.forEach(function(m) {
              var chip = document.createElement('span');
              chip.className = 'mini-chip';
              chip.textContent = m;
              materiasContainer.appendChild(chip);
            });
          }
        }
      }
    } catch(e) {
      /* Si falla la API, al menos mostramos el nombre guardado */
      setTexto('tutorMiniNombre', datosTutoria.profesor || 'Tutor');
    }
  } else {
    /* Sin ID del profesor, sólo mostramos el nombre */
    setTexto('tutorMiniNombre', datosTutoria.profesor || 'Tutor');
  }

  /* Limpiar localStorage después de mostrar los datos */
  localStorage.removeItem('mt_tutoria_pendiente');
});

function setTexto(id, texto) {
  var el = document.getElementById(id);
  if (el && texto) el.textContent = texto;
}
