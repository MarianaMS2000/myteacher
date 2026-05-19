/* mapa.js — Lógica de la vista de mapa. Usa Leaflet.js + OpenStreetMap + TUTORES_DB */

var COORDENADAS_CIUDADES = {
  'Bogotá':       { lat: 4.7110,  lng: -74.0721 },
  'Medellín':     { lat: 6.2442,  lng: -75.5812 },
  'Cali':         { lat: 3.4516,  lng: -76.5320 },
  'Barranquilla': { lat: 10.9639, lng: -74.7964 },
  'Cartagena':    { lat: 10.3910, lng: -75.4794 }
};

var mapa = null;
var marcadores = {};
var tutoresMapa = [];
var tutorActivo = null;

function normalize(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizarTutor(t) {
  return {
    id:           String(t.id),
    nombre:       t.nombre || '',
    foto:         t.foto || t.foto_url || '',
    especialidad: t.especialidad || '',
    ubicacion:    t.ubicacion || t.ciudad || '',
    precio:       t.precio || '',
    materias:     t.materias || [],
    rating:       String(t.ratingPromedio || t.rating || '0'),
    modalidad:    t.modalidad || '',
    nivel:        t.nivel || '',
    _lat:         null,
    _lng:         null
  };
}

function getCoordenadas(tutor) {
  var ciudad = (tutor.ubicacion || '').split(',')[0].trim();
  /* Buscar ciudad normalizando tildes */
  var base = null;
  for (var c in COORDENADAS_CIUDADES) {
    if (normalize(c) === normalize(ciudad)) { base = COORDENADAS_CIUDADES[c]; break; }
  }
  if (!base) base = { lat: 4.711, lng: -74.0721 };
  var seed = parseInt(tutor.id, 10) || 1;
  return {
    lat: base.lat + (seed * 0.013 % 0.04) - 0.02,
    lng: base.lng + (seed * 0.017 % 0.04) - 0.02
  };
}

/* ── Obtener todos los tutores (local + API) ── */
function obtenerTutoresMapa() {
  var base = typeof getAllTutores === 'function' ? getAllTutores().slice() : [];
  if (window._TUTORES_API && window._TUTORES_API.length) {
    var localIds = new Set(base.map(function(t){ return String(t.id); }));
    window._TUTORES_API.forEach(function(t){ if (!localIds.has(String(t.id))) base.push(t); });
  }
  return base.map(normalizarTutor);
}

document.addEventListener('DOMContentLoaded', async function () {
  /* Cargar tutores reales de la API */
  try {
    var res = await fetch('/api/tutores');
    if (res.ok) {
      var data = await res.json();
      window._TUTORES_API = (data.tutores || []).map(function(t) {
        return {
          id: String(t.id), nombre: t.nombre || '', foto_url: t.foto_url || '',
          especialidad: t.especialidad || '',
          ubicacion: (t.ciudad || 'Bogotá') + ', COL',
          precio: t.precio_min_cop ? Math.round(t.precio_min_cop/1000)+'k - '+Math.round((t.precio_max_cop||t.precio_min_cop)/1000)+'k COP' : '15k COP',
          materias: t.materias ? t.materias.split(',').map(function(m){ return m.trim(); }) : [],
          rating: String(t.rating_promedio || 5), modalidad: t.modalidad || 'virtual', nivel: t.nivel || ''
        };
      });
    }
  } catch(e) { window._TUTORES_API = []; }

  mapa = L.map('mapaContenedor', { center: [5.5, -74.5], zoom: 6, zoomControl: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18
  }).addTo(mapa);

  tutoresMapa = obtenerTutoresMapa();
  renderizarListaMapa(tutoresMapa);
  colocarMarcadores(tutoresMapa);

  if (tutoresMapa.length > 0) {
    var bounds = tutoresMapa.map(function(t) { var c = getCoordenadas(t); return [c.lat, c.lng]; });
    mapa.fitBounds(bounds, { padding: [60, 60] });
  }

  /* Botón filtrar escritorio */
  var btnFiltrar = document.getElementById('btnMapaFiltrar');
  if (btnFiltrar) {
    btnFiltrar.addEventListener('click', function () {
      aplicarFiltrosMapa();
      var orig = btnFiltrar.innerHTML;
      btnFiltrar.innerHTML = '<i class="fa-solid fa-check"></i> Aplicado';
      setTimeout(function () { btnFiltrar.innerHTML = orig; }, 1200);
    });
  }

  /* Filtrar en tiempo real */
  document.querySelectorAll('.mapa-filtro-select').forEach(function (sel) {
    sel.addEventListener('change', aplicarFiltrosMapa);
  });

  /* ── MÓVIL: botón para mostrar/ocultar filtros ── */
  var btnFiltroMovil = document.getElementById('btnFiltroMovil');
  var panelMovil     = document.getElementById('mapaFiltrosMovil');
  if (btnFiltroMovil && panelMovil) {
    btnFiltroMovil.addEventListener('click', function() {
      var visible = panelMovil.style.display !== 'none';
      panelMovil.style.display = visible ? 'none' : 'block';
      btnFiltroMovil.innerHTML = visible
        ? '<i class="fa-solid fa-sliders"></i> Filtros'
        : '<i class="fa-solid fa-xmark"></i> Cerrar filtros';
    });
    /* Botón filtrar dentro del panel móvil */
    var btnFiltrarMovil = document.getElementById('btnMapaFiltrarMovil');
    if (btnFiltrarMovil) {
      btnFiltrarMovil.addEventListener('click', function() {
        aplicarFiltrosMapa();
        panelMovil.style.display = 'none';
        if (btnFiltroMovil) btnFiltroMovil.innerHTML = '<i class="fa-solid fa-sliders"></i> Filtros';
      });
    }
    /* Sincronizar selects móvil → escritorio */
    document.querySelectorAll('.mapa-filtro-select-movil').forEach(function(sel) {
      sel.addEventListener('change', function() {
        var targetId = sel.dataset.sync;
        var escritorio = document.getElementById(targetId);
        if (escritorio) escritorio.value = sel.value;
        aplicarFiltrosMapa();
      });
    });
  }

  configurarBusquedaHeader();
});

/* ── Filtros ── */
function aplicarFiltrosMapa() {
  var ubicacion = getVal('mapaFiltroUbicacion').toLowerCase();
  var nivel     = getVal('mapaFiltroNivel').toLowerCase();
  var materia   = normalize(getVal('mapaFiltroMateria'));
  var modalidad = getVal('mapaFiltroModalidad').toLowerCase();

  tutoresMapa = obtenerTutoresMapa().filter(function (t) {
    if (ubicacion) {
      if (!normalize(t.ubicacion).includes(normalize(ubicacion))) return false;
    }
    if (nivel) {
      if (!normalize(t.nivel).includes(normalize(nivel))) return false;
    }
    if (materia) {
      var found = (t.materias || []).some(function (m) {
        return normalize(m).includes(materia);
      });
      if (!found) return false;
    }
    if (modalidad) {
      if (normalize(t.modalidad) !== normalize(modalidad)) return false;
    }
    return true;
  });

  renderizarListaMapa(tutoresMapa);
  colocarMarcadores(tutoresMapa);

  if (tutoresMapa.length > 0) {
    var bounds = tutoresMapa.map(function (t) { var c = getCoordenadas(t); return [c.lat, c.lng]; });
    mapa.fitBounds(bounds, { padding: [60, 60] });
  }
}

/* ── Marcadores ── */
function colocarMarcadores(tutores) {
  Object.values(marcadores).forEach(function (m) { mapa.removeLayer(m); });
  marcadores = {};

  tutores.forEach(function (tutor) {
    var coords = getCoordenadas(tutor);
    var colores = ['#4a7a30','#7c3aed','#db2777','#059669','#d97706','#1d4ed8','#dc2626','#0891b2'];
    var idx = 0;
    for (var i = 0; i < tutor.nombre.length; i++) idx += tutor.nombre.charCodeAt(i);
    var color = colores[idx % colores.length];

    var contenidoMarcador;
    if (tutor.foto) {
      contenidoMarcador = '<img src="' + tutor.foto + '" alt="' + tutor.nombre + '" ' +
        'style="width:44px;height:44px;object-fit:cover;object-position:top;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);" ' +
        'onerror="this.style.display=\'none\';this.parentNode.querySelector(\'.marcador-iniciales\').style.display=\'flex\'">' +
        '<div class="marcador-iniciales" style="display:none;width:44px;height:44px;border-radius:50%;background:' + color + ';align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:1rem;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">' +
          tutor.nombre.split(' ').map(function(p){ return p[0]; }).join('').slice(0,2).toUpperCase() +
        '</div>';
    } else {
      var iniciales = tutor.nombre.split(' ').map(function(p){ return p[0]; }).join('').slice(0,2).toUpperCase();
      contenidoMarcador = '<div style="width:44px;height:44px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:1rem;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">' + iniciales + '</div>';
    }

    var icono = L.divIcon({
      className: '',
      html: '<div class="marcador-tutor" style="width:50px;height:50px;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;">' + contenidoMarcador + '</div>',
      iconSize: [50, 50],
      iconAnchor: [25, 25]
    });

    var marker = L.marker([coords.lat, coords.lng], { icon: icono });
    marker.on('click', function () { seleccionarTutor(tutor.id); });
    marker.addTo(mapa);
    marcadores[tutor.id] = marker;
  });
}

/* ── Lista lateral ── */
function renderizarListaMapa(tutores) {
  var lista   = document.getElementById('mapaTutoresList');
  var countEl = document.getElementById('mapaCount');
  if (!lista) return;

  if (countEl) countEl.textContent = tutores.length + (tutores.length === 1 ? ' tutor encontrado' : ' tutores encontrados');

  lista.innerHTML = '';

  if (tutores.length === 0) {
    lista.innerHTML = '<div class="mapa-sin-resultados"><i class="fa-solid fa-map-pin"></i><p>No hay tutores con esos filtros.</p></div>';
    return;
  }

  tutores.forEach(function (tutor) {
    var item = document.createElement('div');
    item.className = 'mapa-tutor-item';
    item.dataset.tutorId = tutor.id;
    item.id = 'lista-tutor-' + tutor.id;

    var distSim = ((parseInt(tutor.id, 10) * 7) % 12 + 1) + '.' + ((parseInt(tutor.id, 10) * 3) % 9) + ' km';

    var fotoHtml = tutor.foto
      ? '<img src="' + esc(tutor.foto) + '" alt="' + esc(tutor.nombre) + '" style="width:100%;height:100%;object-fit:cover;object-position:top;border-radius:50%;" onerror="this.style.display=\'none\'">'
      : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#4a7a30;color:#fff;font-weight:700;font-size:1rem;border-radius:50%;">' + tutor.nombre.charAt(0).toUpperCase() + '</div>';

    item.innerHTML =
      '<div class="mapa-tutor-avatar" style="overflow:hidden;">' + fotoHtml + '</div>' +
      '<div class="mapa-tutor-info">' +
        '<div class="mapa-tutor-nombre">' + esc(tutor.nombre) + '</div>' +
        '<div class="mapa-tutor-materia">' + esc((tutor.materias || [])[0] || '') + '</div>' +
        '<span class="mapa-tutor-distancia"><i class="fa-solid fa-location-dot"></i> ' + distSim + '</span>' +
      '</div>' +
      '<div class="mapa-tutor-precio">' + esc((tutor.precio || '').split(' - ')[0]) + '</div>';

    item.addEventListener('click', function () { seleccionarTutor(tutor.id); });
    lista.appendChild(item);
  });
}

/* ── Selección de tutor ── */
function seleccionarTutor(id) {
  id = String(id);
  if (tutorActivo && marcadores[tutorActivo]) actualizarEstiloMarcador(tutorActivo, false);
  document.querySelectorAll('.mapa-tutor-item').forEach(function (el) { el.classList.remove('activo'); });

  tutorActivo = id;
  actualizarEstiloMarcador(id, true);

  var itemLista = document.getElementById('lista-tutor-' + id);
  if (itemLista) {
    itemLista.classList.add('activo');
    itemLista.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  if (marcadores[id]) {
    var tutorData = obtenerTutoresMapa().find(function(t){ return t.id === id; }) || { id: id, ubicacion: '' };
    var coords = getCoordenadas(tutorData);
    mapa.flyTo([coords.lat, coords.lng], 13, { duration: 0.8 });
  }

  mostrarPopup(id);
}

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

/* ── Popup ── */
function mostrarPopup(id) {
  var tutor  = obtenerTutoresMapa().find(function(t){ return t.id === String(id); });
  var popup  = document.getElementById('mapaPopup');
  if (!tutor || !popup) return;

  var popupFoto = document.getElementById('popupFoto');
  if (popupFoto) { popupFoto.src = tutor.foto || ''; popupFoto.style.display = tutor.foto ? '' : 'none'; }
  var popupNombre = document.getElementById('popupNombre');
  if (popupNombre) popupNombre.textContent = tutor.nombre;
  var popupEsp = document.getElementById('popupEspecialidad');
  if (popupEsp) popupEsp.textContent = tutor.especialidad;
  var popupPrecio = document.getElementById('popupPrecio');
  if (popupPrecio) popupPrecio.textContent = tutor.precio;
  var popupBtn = document.getElementById('popupBtnPerfil');
  if (popupBtn) popupBtn.href = 'perfil_tutor.html?id=' + tutor.id;

  popup.style.display = 'block';
  popup.style.opacity = '0';
  popup.style.transform = 'translateY(-45%) scale(0.95)';
  setTimeout(function () {
    popup.style.transition = 'opacity 0.2s, transform 0.2s';
    popup.style.opacity = '1';
    popup.style.transform = 'translateY(-50%) scale(1)';
  }, 10);
}

function cerrarPopup() {
  var popup = document.getElementById('mapaPopup');
  if (popup) popup.style.display = 'none';
  if (tutorActivo) actualizarEstiloMarcador(tutorActivo, false);
  document.querySelectorAll('.mapa-tutor-item').forEach(function (el) { el.classList.remove('activo'); });
  tutorActivo = null;
}

/* ── Búsqueda en el header ── */
function configurarBusquedaHeader() {
  var searchInput = document.getElementById('mapaSearchInput') || document.querySelector('.header-search input');
  if (!searchInput) return;

  var dropdown = document.createElement('div');
  dropdown.style.cssText = 'position:absolute;top:100%;left:0;right:0;background:white;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.15);z-index:9999;max-height:320px;overflow-y:auto;display:none;margin-top:6px;';
  var searchWrapper = searchInput.closest('.header-search');
  if (searchWrapper) { searchWrapper.style.position = 'relative'; searchWrapper.appendChild(dropdown); }

  function buscarYMostrar() {
    var q = searchInput.value.trim().toLowerCase();
    if (!q) { dropdown.style.display = 'none'; return; }

    var todos = obtenerTutoresMapa();
    var qn = normalize(q);
    var resultados = todos.filter(function(t) {
      return normalize(t.nombre).includes(qn) || normalize(t.especialidad).includes(qn) ||
             (t.materias || []).some(function(m){ return normalize(m).includes(qn); }) ||
             normalize(t.ubicacion).includes(qn);
    });

    if (resultados.length === 0) {
      dropdown.innerHTML = '<div style="padding:16px;color:#9ca3af;font-size:.88rem;text-align:center">No se encontraron tutores</div>';
      dropdown.style.display = 'block';
      return;
    }

    var colores = ['#4a7a30','#7c3aed','#db2777','#059669','#d97706','#1d4ed8','#dc2626','#0891b2'];
    dropdown.innerHTML = resultados.slice(0, 8).map(function(t) {
      var idx = 0;
      for (var i = 0; i < t.nombre.length; i++) idx += t.nombre.charCodeAt(i);
      var color = colores[idx % colores.length];
      var foto = t.foto
        ? '<img src="' + t.foto + '" alt="' + t.nombre + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;object-position:top" onerror="this.style.display=\'none\'">'
        : '<span style="font-size:.9rem;font-weight:700;color:#fff">' + t.nombre.charAt(0).toUpperCase() + '</span>';
      return '<div onclick="seleccionarTutor(\'' + t.id + '\');this.closest(\'div[style]\').style.display=\'none\'" style="display:flex;align-items:center;gap:12px;padding:10px 16px;cursor:pointer;border-bottom:1px solid #f3f4f6;transition:background .15s" onmouseover="this.style.background=\'#f9fafb\'" onmouseout="this.style.background=\'\'">'+
        '<div style="width:38px;height:38px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">' + foto + '</div>'+
        '<div style="flex:1;min-width:0"><div style="font-weight:700;font-size:.88rem">' + t.nombre + '</div><div style="font-size:.75rem;color:#9ca3af">' + (t.materias || []).slice(0,3).join(' · ') + '</div></div>'+
        '<div style="font-size:.78rem;color:#4a7a30;font-weight:700">' + (t.precio || '').split(' - ')[0] + '</div>'+
      '</div>';
    }).join('');

    dropdown.style.display = 'block';
  }

  searchInput.addEventListener('input', buscarYMostrar);
  searchInput.addEventListener('keydown', function(e) { if (e.key === 'Escape') dropdown.style.display = 'none'; });
  document.addEventListener('click', function(e) {
    if (searchWrapper && !searchWrapper.contains(e.target)) dropdown.style.display = 'none';
  });
}

function getVal(id) { var e = document.getElementById(id); return e ? e.value : ''; }
function esc(str) { var d = document.createElement('div'); d.appendChild(document.createTextNode(String(str || ''))); return d.innerHTML; }
