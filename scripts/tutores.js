/* =============================================
   tutores.js — Lógica completa de tutores.html
   Funciones: filtros dinámicos en tiempo real,
   renderizado de tarjetas, favoritos en
   localStorage, panel lateral de favoritos.
   Depende de: tutores_data.js
   ============================================= */

/* ── ESTADO GLOBAL ── */
var tutoresFiltrados = [];   /* Array actual de tutores visibles */
var favoritosSet = new Set(); /* IDs marcados como favoritos */

/* ══════════════════════════════════════════════
   INICIALIZACIÓN
   ══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {

  /* 1. Cargar favoritos guardados */
  cargarFavoritos();

  /* 2. Mostrar todos los tutores al inicio */
  tutoresFiltrados = getAllTutores();
  renderizarTutores(tutoresFiltrados);
  renderizarFavoritosSidebar();

  /* 3. Botón lupa: aplicar filtros */
  var btnBuscar = document.getElementById('btnBuscar');
  if (btnBuscar) {
    btnBuscar.addEventListener('click', function () {
      aplicarFiltros();
      /* Animación de pulso */
      btnBuscar.classList.add('buscando');
      setTimeout(function () { btnBuscar.classList.remove('buscando'); }, 600);
    });
  }

  /* 4. Filtrar también en tiempo real al cambiar cualquier select */
  document.querySelectorAll('.filtro-select').forEach(function (sel) {
    sel.addEventListener('change', function () {
      aplicarFiltros();
    });
    /* Y al presionar Enter */
    sel.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') aplicarFiltros();
    });
  });

  /* 5. Pasar filtro de materia desde el panel de inicio si viene en la URL */
  var params = new URLSearchParams(window.location.search);
  var materiaParam = params.get('materia');
  if (materiaParam) {
    var sel = document.getElementById('filtroMateria');
    if (sel) {
      sel.value = materiaParam;
      aplicarFiltros();
    }
  }
});

/* ══════════════════════════════════════════════
   FILTROS
   ══════════════════════════════════════════════ */

/**
 * Lee los 5 filtros y actualiza la lista dinámicamente.
 * No recarga la página.
 */
function aplicarFiltros() {
  var materia   = getSelect('filtroMateria').toLowerCase();
  var nivel     = getSelect('filtroNivel').toLowerCase();
  var precio    = getSelect('filtroPrecio');
  var modalidad = getSelect('filtroModalidad').toLowerCase();
  var ubicacion = getSelect('filtroUbicacion').toLowerCase();

  /* Parsear rango de precio */
  var precioMin = 0;
  var precioMax = Infinity;
  if (precio) {
    var partes = precio.split('-');
    precioMin = parseInt(partes[0], 10) || 0;
    precioMax = parseInt(partes[1], 10) || Infinity;
  }

  tutoresFiltrados = getAllTutores().filter(function (t) {

    /* ── Materia ── */
    if (materia) {
      var alias = MATERIA_ALIAS[materia] || materia;
      var match = (t.materias || []).some(function (m) {
        var ml = m.toLowerCase();
        return ml.includes(materia) || ml.includes(alias);
      });
      if (!match) return false;
    }

    /* ── Nivel ── */
    if (nivel) {
      if (!(t.nivel || '').toLowerCase().includes(nivel)) return false;
    }

    /* ── Precio ── */
    if (precio) {
      var pMin = extraerPrecioMin(t.precio);
      if (pMin < precioMin || pMin > precioMax) return false;
    }

    /* ── Modalidad ── */
    if (modalidad) {
      if ((t.modalidad || 'virtual').toLowerCase() !== modalidad) return false;
    }

    /* ── Ubicación ── */
    if (ubicacion) {
      if (!(t.ubicacion || '').toLowerCase().includes(ubicacion)) return false;
    }

    return true;
  });

  renderizarTutores(tutoresFiltrados);
}

/** Alias para normalizar términos de búsqueda por materia */
var MATERIA_ALIAS = {
  'matematicas': 'matem',
  'ingles':      'inglés',
  'fisica':      'física',
  'biologia':    'biología',
  'programacion':'programación',
  'historia':    'histor',
  'quimica':     'química'
};

/**
 * Extrae el precio mínimo en COP de un string como "15k - 60k COP".
 * @param {string} str
 * @returns {number}
 */
function extraerPrecioMin(str) {
  var m = (str || '').match(/(\d+)k/i);
  return m ? parseInt(m[1], 10) * 1000 : 0;
}

/* ══════════════════════════════════════════════
   RENDERIZADO DE TARJETAS
   ══════════════════════════════════════════════ */

/**
 * Dibuja la lista de tarjetas horizontales de tutores.
 * @param {Array} tutores
 */
function renderizarTutores(tutores) {
  var container = document.getElementById('tutoresList');
  var noResults = document.getElementById('noResultados');
  var countEl   = document.getElementById('listaCount');
  if (!container) return;

  container.innerHTML = '';

  /* Actualizar contador */
  if (countEl) {
    countEl.textContent = tutores.length + (tutores.length === 1 ? ' tutor' : ' tutores');
  }

  if (tutores.length === 0) {
    if (noResults) noResults.style.display = 'flex';
    return;
  }
  if (noResults) noResults.style.display = 'none';

  /* Animar entrada escalonada */
  tutores.forEach(function (tutor, i) {
    var card = crearTarjetaTutor(tutor);
    card.style.animationDelay = (i * 0.04) + 's';
    container.appendChild(card);
  });
}

/**
 * Crea el elemento HTML de una tarjeta horizontal de tutor.
 * @param {Object} tutor
 * @returns {HTMLElement}
 */
function crearTarjetaTutor(tutor) {
  var card = document.createElement('div');
  card.className = 'tutor-card-h';
  card.dataset.tutorId = tutor.id;

  var esFav = favoritosSet.has(String(tutor.id));
  var favClass = esFav ? 'btn-fav-h activo' : 'btn-fav-h';
  var favIcon  = esFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart';

  /* Chips de materias (máx 3) */
  var chips = (tutor.materias || []).slice(0, 3).map(function (m) {
    return '<span class="tutor-h-tag">' + esc(m) + '</span>';
  }).join('');

  /* Badge de modalidad */
  var modalBadge = '';
  if (tutor.modalidad) {
    var modalLabel = tutor.modalidad === 'virtual' ? '📡 Virtual'
                   : tutor.modalidad === 'presencial' ? '📍 Presencial' : '🔄 Híbrida';
    modalBadge = '<span class="tutor-h-modalidad">' + modalLabel + '</span>';
  }

  card.innerHTML =
    /* Avatar */
    '<div class="tutor-h-avatar">' +
      '<img src="' + esc(tutor.foto) + '" alt="' + esc(tutor.nombre) + '" ' +
      'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
      '<div class="tutor-h-avatar-initials" style="display:none;">' +
        iniciales(tutor.nombre) +
      '</div>' +
    '</div>' +

    /* Info central */
    '<div class="tutor-h-info">' +
      '<div class="tutor-h-nombre">' +
        esc(tutor.nombre) +
        '<i class="fa-solid fa-circle-check verificado" title="Verificado"></i>' +
      '</div>' +
      '<div class="tutor-h-especialidad">' + esc(tutor.especialidad) + '</div>' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
        '<div class="tutor-h-rating"><i class="fa-solid fa-star"></i> ' + esc(tutor.rating) + '</div>' +
        modalBadge +
      '</div>' +
      '<div class="tutor-h-tags">' + chips + '</div>' +
    '</div>' +

    /* Acciones: precio, botones */
    '<div class="tutor-h-acciones">' +
      '<div class="tutor-h-precio">' + esc(tutor.precio) + '<span>por sesión</span></div>' +
      '<a href="perfil_tutor.html?id=' + tutor.id + '" class="btn-ver-perfil-h">' +
        '<i class="fa-solid fa-user"></i> Ver perfil' +
      '</a>' +
      '<button class="' + favClass + '" ' +
        'onclick="toggleFavoritoTutor(this,\'' + tutor.id + '\')" ' +
        'title="' + (esFav ? 'Quitar de favoritos' : 'Agregar a favoritos') + '">' +
        '<i class="' + favIcon + '"></i>' +
      '</button>' +
    '</div>';

  return card;
}

/* ══════════════════════════════════════════════
   FAVORITOS
   ══════════════════════════════════════════════ */

/**
 * Carga los IDs de favoritos desde localStorage.
 */
function cargarFavoritos() {
  try {
    var arr = JSON.parse(localStorage.getItem('mt_favoritos') || '[]');
    favoritosSet = new Set(arr.map(String));
  } catch (e) {
    favoritosSet = new Set();
  }
}

/**
 * Guarda el estado actual de favoritos en localStorage.
 */
function guardarFavoritos() {
  try {
    localStorage.setItem('mt_favoritos', JSON.stringify(Array.from(favoritosSet)));
  } catch (e) {}
}

/**
 * Alterna el estado favorito de un tutor.
 * @param {HTMLElement} btn - Botón del corazón
 * @param {string}      id  - ID del tutor
 */
function toggleFavoritoTutor(btn, id) {
  var icon = btn.querySelector('i');
  id = String(id);

  if (favoritosSet.has(id)) {
    favoritosSet.delete(id);
    btn.classList.remove('activo');
    if (icon) icon.className = 'fa-regular fa-heart';
    btn.title = 'Agregar a favoritos';
  } else {
    favoritosSet.add(id);
    btn.classList.add('activo');
    if (icon) icon.className = 'fa-solid fa-heart';
    btn.title = 'Quitar de favoritos';
    /* Animación breve */
    btn.style.transform = 'scale(1.4)';
    setTimeout(function () { btn.style.transform = ''; }, 220);
  }

  guardarFavoritos();
  renderizarFavoritosSidebar();
}

/**
 * Renderiza el panel lateral de favoritos.
 */
function renderizarFavoritosSidebar() {
  var container = document.getElementById('favoritosSidebar');
  if (!container) return;
  container.innerHTML = '';

  var ids = Array.from(favoritosSet);

  if (ids.length === 0) {
    container.innerHTML =
      '<div class="fav-vacio">' +
        '<i class="fa-regular fa-heart"></i>' +
        '<p>Aún no tienes favoritos.<br>Haz clic en ❤ para agregar.</p>' +
      '</div>';
    return;
  }

  /* Mostrar hasta 5 mini-tarjetas */
  ids.slice(0, 5).forEach(function (id) {
    var tutor = getTutorById(id);
    if (!tutor) return;
    var mini = document.createElement('div');
    mini.className = 'fav-mini-card';
    mini.title = 'Ver perfil de ' + tutor.nombre;
    mini.onclick = function () { window.location.href = 'perfil_tutor.html?id=' + tutor.id; };
    mini.innerHTML =
      '<div class="fav-mini-avatar">' +
        '<img src="' + esc(tutor.foto) + '" alt="' + esc(tutor.nombre) + '" ' +
        'onerror="this.style.display=\'none\'">' +
      '</div>' +
      '<div class="fav-mini-info">' +
        '<div class="fav-mini-nombre">' + esc(tutor.nombre) + '</div>' +
        '<div class="fav-mini-materia">' + esc(tutor.materias[0] || '') + '</div>' +
      '</div>' +
      '<div class="fav-mini-precio">' + esc(tutor.precio.split(' ')[0]) + '</div>';
    container.appendChild(mini);
  });

  /* Si hay más de 5, mostrar indicador */
  if (ids.length > 5) {
    var mas = document.createElement('div');
    mas.style.cssText = 'text-align:center;padding:8px;font-size:0.75rem;color:var(--muted);';
    mas.textContent = '+ ' + (ids.length - 5) + ' más en Favoritos';
    container.appendChild(mas);
  }
}

/* ══════════════════════════════════════════════
   UTILIDADES
   ══════════════════════════════════════════════ */

function getSelect(id) { var e = document.getElementById(id); return e ? e.value : ''; }

function iniciales(nombre) {
  return (nombre || '').split(' ').map(function (p) { return p[0]; }).join('').slice(0, 2).toUpperCase();
}

function esc(str) {
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str || '')));
  return d.innerHTML;
}
