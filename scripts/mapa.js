/* =============================================
   mapa.js — Lógica de la vista de mapa.
   Usa Leaflet.js + OpenStreetMap para mostrar
   marcadores reales de tutores.
   Depende de: tutores_data.js, Leaflet 1.9.4
   ============================================= */

/* ── COORDENADAS DE TUTORES (ciudad → lat/lng) ── */
var COORDENADAS_CIUDADES = {
  'Bogotá':       { lat: 4.711,   lng: -74.0721 },
  'Medellín':     { lat: 6.2442,  lng: -75.5812 },
  'Cali':         { lat: 3.4516,  lng: -76.5320 },
  'Barranquilla': { lat: 10.9639, lng: -74.7964 },
  'Cartagena':    { lat: 10.3910, lng: -75.4794 }
};

/* Pequeña variación aleatoria para que los marcadores no se solapen */
function variacion() { return (Math.random() - 0.5) * 0.04; }

/** Instancia del mapa Leaflet */
var mapa = null;

/** Marcadores activos en el mapa */
var marcadores = {};

/** Array de tutores actualmente visibles */
var tutoresMapa = [];

/** ID del tutor seleccionado actualmente */
var tutorActivo = null;

/* ══════════════════════════════════════════════
   INICIALIZACIÓN
   ══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {

  /* 1. Inicializar el mapa Leaflet centrado en Colombia */
  mapa = L.map('mapaContenedor', {
    center: [4.711, -74.0721],
    zoom: 6,
    zoomControl: true
  });

  /* 2. Capa de tiles de OpenStreetMap (gratuita, sin API key) */
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18
  }).addTo(mapa);

  /* 3. Mostrar todos los tutores al inicio */
  tutoresMapa = getAllTutores();
  renderizarListaMapa(tutoresMapa);
  colocarMarcadores(tutoresMapa);

  /* 4. Evento del botón filtrar */
  var btnFiltrar = document.getElementById('btnMapaFiltrar');
  if (btnFiltrar) {
    btnFiltrar.addEventListener('click', function () {
      aplicarFiltrosMapa();
      btnFiltrar.textContent = '✓ Aplicado';
      setTimeout(function () {
        btnFiltrar.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Buscar';
      }, 1200);
    });
  }

  /* 5. Filtrar también en tiempo real al cambiar selects */
  document.querySelectorAll('.mapa-filtro-select').forEach(function (sel) {
    sel.addEventListener('change', aplicarFiltrosMapa);
  });
});

/* ══════════════════════════════════════════════
   FILTROS
   ══════════════════════════════════════════════ */

/**
 * Lee los filtros del panel y actualiza lista + mapa.
 */
function aplicarFiltrosMapa() {
  var ubicacion = getVal('mapaFiltroUbicacion').toLowerCase();
  var nivel     = getVal('mapaFiltroNivel').toLowerCase();
  var materia   = getVal('mapaFiltroMateria').toLowerCase();
  var precioMax = parseInt(getVal('mapaFiltroPrecio'), 10) || Infinity;

  tutoresMapa = getAllTutores().filter(function (t) {

    /* Ubicación */
    if (ubicacion && !(t.ubicacion || '').toLowerCase().includes(ubicacion)) return false;

    /* Nivel */
    if (nivel && !(t.nivel || '').toLowerCase().includes(nivel)) return false;

    /* Materia */
    if (materia) {
      var encontrado = (t.materias || []).some(function (m) {
        return m.toLowerCase().includes(materia) ||
               m.toLowerCase().includes(MATERIA_MAP[materia] || materia);
      });
      if (!encontrado) return false;
    }

    /* Precio máximo */
    if (precioMax < Infinity) {
      var precioMin = extraerPrecioMinimo(t.precio);
      if (precioMin > precioMax) return false;
    }

    return true;
  });

  renderizarListaMapa(tutoresMapa);
  colocarMarcadores(tutoresMapa);

  /* Ajustar el zoom del mapa para mostrar todos los marcadores */
  if (tutoresMapa.length > 0) {
    var bounds = tutoresMapa.map(function (t) {
      var coords = getCoordenadas(t);
      return [coords.lat, coords.lng];
    });
    mapa.fitBounds(bounds, { padding: [40, 40] });
  }
}

/** Mapeo de alias para materias */
var MATERIA_MAP = {
  'matematicas': 'matem',
  'ingles':      'inglés',
  'fisica':      'física',
  'programacion':'programación',
  'biologia':    'biología',
  'historia':    'histor'
};

/* ══════════════════════════════════════════════
   MARCADORES EN EL MAPA
   ══════════════════════════════════════════════ */

/**
 * Elimina todos los marcadores del mapa y coloca los nuevos.
 * @param {Array} tutores
 */
function colocarMarcadores(tutores) {
  /* Limpiar marcadores existentes */
  Object.values(marcadores).forEach(function (m) { mapa.removeLayer(m); });
  marcadores = {};

  tutores.forEach(function (tutor) {
    var coords = getCoordenadas(tutor);

    /* Icono personalizado con iniciales del tutor */
    var iniciales = tutor.nombre.split(' ').map(function (p) { return p[0]; }).join('').slice(0, 2);

    var icono = L.divIcon({
      className: '',
      html:
        '<div class="marcador-tutor" style="width:40px;height:40px;">' +
          iniciales +
        '</div>',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    var marker = L.marker([coords.lat, coords.lng], { icon: icono });

    /* Al hacer clic en el marcador: seleccionar tutor */
    marker.on('click', function () {
      seleccionarTutor(tutor.id);
    });

    marker.addTo(mapa);
    marcadores[tutor.id] = marker;
  });
}

/**
 * Obtiene las coordenadas de un tutor según su ciudad.
 * Agrega variación pequeña para evitar solapamiento.
 * @param {Object} tutor
 * @returns {{ lat: number, lng: number }}
 */
function getCoordenadas(tutor) {
  var ciudad = (tutor.ubicacion || '').split(',')[0].trim();
  var base   = COORDENADAS_CIUDADES[ciudad] || { lat: 4.711, lng: -74.0721 };
  /* Usar el ID para generar variación determinista (no aleatoria) */
  var seed = parseInt(tutor.id, 10) || 1;
  return {
    lat: base.lat + (seed * 0.013 % 0.04) - 0.02,
    lng: base.lng + (seed * 0.017 % 0.04) - 0.02
  };
}

/* ══════════════════════════════════════════════
   LISTA EN EL PANEL
   ══════════════════════════════════════════════ */

/**
 * Renderiza la lista de tutores en el panel izquierdo.
 * @param {Array} tutores
 */
function renderizarListaMapa(tutores) {
  var lista   = document.getElementById('mapaTutoresList');
  var countEl = document.getElementById('mapaCount');
  if (!lista) return;

  if (countEl) {
    countEl.textContent = tutores.length + (tutores.length === 1 ? ' tutor encontrado' : ' tutores encontrados');
  }

  lista.innerHTML = '';

  if (tutores.length === 0) {
    lista.innerHTML =
      '<div class="mapa-sin-resultados">' +
        '<i class="fa-solid fa-map-pin"></i>' +
        '<p>No hay tutores con esos filtros.</p>' +
      '</div>';
    return;
  }

  tutores.forEach(function (tutor) {
    var item = document.createElement('div');
    item.className = 'mapa-tutor-item';
    item.dataset.tutorId = tutor.id;
    item.id = 'lista-tutor-' + tutor.id;

    /* Distancia simulada (determinista según ID) */
    var distSim = ((parseInt(tutor.id, 10) * 7) % 12 + 1) + '.' + ((parseInt(tutor.id, 10) * 3) % 9) + ' km';

    item.innerHTML =
      '<div class="mapa-tutor-avatar">' +
        '<img src="' + esc(tutor.foto) + '" alt="' + esc(tutor.nombre) + '" ' +
        'onerror="this.style.display=\'none\'">' +
      '</div>' +
      '<div class="mapa-tutor-info">' +
        '<div class="mapa-tutor-nombre">' + esc(tutor.nombre) + '</div>' +
        '<div class="mapa-tutor-materia">' + esc(tutor.materias[0] || '') + '</div>' +
        '<span class="mapa-tutor-distancia"><i class="fa-solid fa-location-dot"></i> ' + distSim + '</span>' +
      '</div>' +
      '<div class="mapa-tutor-precio">' + esc(tutor.precio.split(' ')[0]) + '</div>';

    item.addEventListener('click', function () {
      seleccionarTutor(tutor.id);
    });

    lista.appendChild(item);
  });
}

/* ══════════════════════════════════════════════
   SELECCIÓN DE TUTOR
   ══════════════════════════════════════════════ */

/**
 * Selecciona un tutor: resalta su marcador en el mapa,
 * lo resalta en la lista y muestra el popup flotante.
 * @param {string} id
 */
function seleccionarTutor(id) {
  id = String(id);

  /* Desactivar el anterior */
  if (tutorActivo && marcadores[tutorActivo]) {
    actualizarEstiloMarcador(tutorActivo, false);
  }
  document.querySelectorAll('.mapa-tutor-item').forEach(function (el) {
    el.classList.remove('activo');
  });

  tutorActivo = id;

  /* Activar el nuevo */
  actualizarEstiloMarcador(id, true);

  var itemLista = document.getElementById('lista-tutor-' + id);
  if (itemLista) {
    itemLista.classList.add('activo');
    itemLista.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* Centrar el mapa en el marcador con animación */
  if (marcadores[id]) {
    var coords = getCoordenadas(getTutorById(id));
    mapa.flyTo([coords.lat, coords.lng], 13, { duration: 0.8 });
  }

  /* Mostrar popup flotante */
  mostrarPopup(id);
}

/**
 * Actualiza la clase CSS del marcador (activo o no).
 * @param {string}  id
 * @param {boolean} activo
 */
function actualizarEstiloMarcador(id, activo) {
  var marker = marcadores[id];
  if (!marker) return;
  var el = marker.getElement();
  if (!el) return;
  var div = el.querySelector('.marcador-tutor');
  if (!div) return;
  if (activo) div.classList.add('activo');
  else        div.classList.remove('activo');
}

/* ══════════════════════════════════════════════
   POPUP FLOTANTE
   ══════════════════════════════════════════════ */

/**
 * Muestra el popup con los datos del tutor seleccionado.
 * @param {string} id
 */
function mostrarPopup(id) {
  var tutor  = getTutorById(id);
  var popup  = document.getElementById('mapaPopup');
  if (!tutor || !popup) return;

  document.getElementById('popupFoto').src           = tutor.foto;
  document.getElementById('popupNombre').textContent  = tutor.nombre;
  document.getElementById('popupEspecialidad').textContent = tutor.especialidad;
  document.getElementById('popupPrecio').textContent  = tutor.precio;
  document.getElementById('popupBtnPerfil').href      = 'perfil_tutor.html?id=' + tutor.id;

  popup.style.display = 'block';
  /* Animación de entrada */
  popup.style.opacity = '0';
  popup.style.transform = 'translateY(-45%) scale(0.95)';
  setTimeout(function () {
    popup.style.transition = 'opacity 0.2s, transform 0.2s';
    popup.style.opacity = '1';
    popup.style.transform = 'translateY(-50%) scale(1)';
  }, 10);
}

/**
 * Cierra el popup flotante.
 */
function cerrarPopup() {
  var popup = document.getElementById('mapaPopup');
  if (popup) popup.style.display = 'none';
  if (tutorActivo) actualizarEstiloMarcador(tutorActivo, false);
  document.querySelectorAll('.mapa-tutor-item').forEach(function (el) {
    el.classList.remove('activo');
  });
  tutorActivo = null;
}

/* ══════════════════════════════════════════════
   UTILIDADES
   ══════════════════════════════════════════════ */

function getVal(id) { var e = document.getElementById(id); return e ? e.value : ''; }

function extraerPrecioMinimo(str) {
  var m = (str || '').match(/(\d+)k/i);
  return m ? parseInt(m[1], 10) * 1000 : 0;
}

function esc(str) {
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str || '')));
  return d.innerHTML;
}
