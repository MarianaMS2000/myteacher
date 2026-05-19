/* tutores.js — carga tutores desde TUTORES_DB + API real, filtros en tiempo real */

var tutoresFiltrados = [];
var favoritosSet     = new Set();

/* ── Normalizar tildes para comparación ── */
function normalize(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/* ── Cargar favoritos desde localStorage ── */
function cargarFavoritos() {
  try {
    var stored = localStorage.getItem('mt_favoritos');
    var arr = stored ? JSON.parse(stored) : [];
    favoritosSet = new Set(arr.map(String));
  } catch(e) { favoritosSet = new Set(); }
}

/* ── Guardar favoritos en localStorage ── */
function guardarFavoritos() {
  localStorage.setItem('mt_favoritos', JSON.stringify(Array.from(favoritosSet)));
  /* Sincronizar con el backend si hay sesión */
  var token = getToken ? getToken() : null;
  if (token && _lastFavId) {
    /* La sincronización backend se hace en el toggle */
  }
}

var _lastFavId = null;

/* ── Alternar favorito ── */
function toggleFavorito(profId, btn) {
  profId = String(profId);
  var esFav = favoritosSet.has(profId);
  if (esFav) { favoritosSet.delete(profId); }
  else        { favoritosSet.add(profId);   }
  guardarFavoritos();

  /* Sincronizar con backend */
  var token = typeof getToken === 'function' ? getToken() : null;
  if (token) {
    fetch('/api/favoritos/' + profId, {
      method: esFav ? 'DELETE' : 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    }).catch(function(){});
  }

  var icon = btn.querySelector('i');
  if (icon) icon.className = esFav ? 'far fa-heart' : 'fas fa-heart';
  btn.classList.toggle('activo', !esFav);
  btn.title = !esFav ? 'Quitar favorito' : 'Guardar favorito';
  renderizarFavoritosSidebar();
}

/* ── Obtener todos los tutores (local + API) ── */
function obtenerTodosLosTutores() {
  var base = getAllTutores ? getAllTutores().slice() : [];
  if (window._TUTORES_API && window._TUTORES_API.length) {
    var localIds = new Set(base.map(function(t){ return String(t.id); }));
    window._TUTORES_API.forEach(function(t){ if (!localIds.has(String(t.id))) base.push(t); });
  }
  return base;
}

/* ── Filtrar tutores ── */
function obtenerTutoresLocal(filtros) {
  var todos = obtenerTodosLosTutores();
  if (!filtros) return todos;

  return todos.filter(function(t) {
    /* Búsqueda por texto */
    if (filtros.q && filtros.q !== '') {
      var qn = normalize(filtros.q);
      var enNombre       = normalize(t.nombre).includes(qn);
      var enEspecialidad = normalize(t.especialidad).includes(qn);
      var enMaterias     = (t.materias || []).some(function(m){ return normalize(m).includes(qn); });
      var enUbicacion    = normalize(t.ubicacion).includes(qn);
      if (!enNombre && !enEspecialidad && !enMaterias && !enUbicacion) return false;
    }

    /* Filtro materia — normaliza para comparar sin tildes */
    if (filtros.materia && filtros.materia !== '') {
      var mat = normalize(filtros.materia);
      var tieneMateria = (t.materias || []).some(function(m){ return normalize(m).includes(mat); });
      if (!tieneMateria) return false;
    }

    /* Filtro modalidad */
    if (filtros.modalidad && filtros.modalidad !== '') {
      if (normalize(t.modalidad) !== normalize(filtros.modalidad)) return false;
    }

    /* Filtro precio */
    if (filtros.precio && filtros.precio !== '') {
      var partes = filtros.precio.split('-');
      var pMin = parseInt(partes[0], 10);
      var pMax = partes[1] ? parseInt(partes[1], 10) : Infinity;
      var precioTutor = extraerPrecioMinimoStr(t.precio);
      if (precioTutor < pMin || precioTutor > pMax) return false;
    }

    /* Filtro ubicación — normaliza tildes */
    if (filtros.ubicacion && filtros.ubicacion !== '') {
      var ub = normalize(filtros.ubicacion);
      if (!normalize(t.ubicacion).includes(ub)) return false;
    }

    /* Filtro nivel */
    if (filtros.nivel && filtros.nivel !== '') {
      if (!normalize(t.nivel).includes(normalize(filtros.nivel))) return false;
    }

    return true;
  });
}

function extraerPrecioMinimoStr(str) {
  var m = (str || '').match(/(\d+)k/i);
  return m ? parseInt(m[1], 10) * 1000 : 0;
}

/* ── Renderizar tarjetas de tutores ── */
function renderizarTutores(lista) {
  var grid   = document.getElementById('tutoresList');
  var sinRes = document.getElementById('noResultados');
  if (!grid) return;

  if (!lista || lista.length === 0) {
    grid.innerHTML = '';
    if (sinRes) sinRes.style.display = 'block';
    return;
  }
  if (sinRes) sinRes.style.display = 'none';

  grid.innerHTML = '';
  lista.forEach(function (t, i) {
    var id    = String(t.id);
    var esFav = favoritosSet.has(id);

    var estrellas  = parseFloat(t.ratingPromedio || t.rating) || 5;
    var avatarHtml = t.foto
      ? '<img src="' + t.foto + '" alt="' + t.nombre + '">'
      : '<div class="tutor-h-avatar-initials" style="background:' + colorAvatar(t.nombre) + ';">' +
          t.nombre.charAt(0).toUpperCase() + '</div>';

    var materiasHtml = (t.materias || []).slice(0, 3).map(function (m) {
      return '<span class="tutor-h-tag">' + m + '</span>';
    }).join('');

    var card = document.createElement('div');
    card.className = 'tutor-card-h';
    card.style.opacity   = '0';
    card.style.transform = 'translateY(8px)';
    card.innerHTML =
      '<div class="tutor-h-avatar">' + avatarHtml + '</div>' +
      '<div>' +
        '<div class="tutor-h-nombre">' + t.nombre +
          (t.verificado ? ' <i class="fas fa-check-circle" style="color:#22c55e;font-size:.85rem;"></i>' : '') +
        '</div>' +
        '<div class="tutor-h-especialidad">' + (t.especialidad || '') + '</div>' +
        '<div class="tutor-h-rating"><i class="fas fa-star"></i> ' + estrellas.toFixed(1) +
          ' <span style="font-weight:400;opacity:.8">(' + (t.totalResenas || 0) + ')</span></div>' +
        '<div class="tutor-h-tags">' + materiasHtml + '</div>' +
      '</div>' +
      '<div class="tutor-h-acciones">' +
        '<div class="tutor-h-precio">Desde ' + (t.precio || '').split(' - ')[0] +
          '<span>/hora</span></div>' +
        '<a href="perfil_tutor.html?id=' + id + '" class="btn-ver-perfil-h">' +
          '<i class="fas fa-user"></i> Ver perfil</a>' +
        '<button class="btn-fav-h' + (esFav ? ' activo' : '') + '" ' +
          'onclick="toggleFavorito(' + id + ', this)" ' +
          'title="' + (esFav ? 'Quitar favorito' : 'Guardar favorito') + '">' +
          '<i class="fa' + (esFav ? 's' : 'r') + ' fa-heart"></i>' +
        '</button>' +
      '</div>';
    grid.appendChild(card);
    setTimeout(function (c) {
      c.style.transition = 'opacity .3s, transform .3s';
      c.style.opacity    = '1';
      c.style.transform  = 'translateY(0)';
    }.bind(null, card), i * 50);
  });

  var count = document.getElementById('listaCount');
  if (count) count.textContent = lista.length + ' tutor' + (lista.length === 1 ? '' : 'es');
}

function colorAvatar(nombre) {
  var colores = ['#4a7a30','#7c3aed','#db2777','#059669','#d97706','#1d4ed8','#dc2626','#0891b2'];
  var idx = 0;
  for (var i = 0; i < nombre.length; i++) idx += nombre.charCodeAt(i);
  return colores[idx % colores.length];
}

/* ── Renderizar sidebar de favoritos ── */
function renderizarFavoritosSidebar() {
  var sidebar = document.getElementById('favoritosSidebar');
  if (!sidebar) return;

  var favs = obtenerTodosLosTutores().filter(function(t){ return favoritosSet.has(String(t.id)); });
  if (favs.length === 0) {
    sidebar.innerHTML = '<p style="color:#9ca3af;font-size:.85rem;padding:12px 0">Aún no tienes favoritos.<br>Haz clic en el ❤ de un tutor.</p>';
    return;
  }
  sidebar.innerHTML = favs.map(function(t) {
    var avatarInner = t.foto
      ? '<img src="' + t.foto + '" alt="' + t.nombre + '">'
      : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;' +
          'background:' + colorAvatar(t.nombre) + ';border-radius:50%;' +
          'font-size:.85rem;font-weight:700;color:#fff">' + t.nombre.charAt(0).toUpperCase() + '</div>';
    return '<a class="fav-mini-card" href="perfil_tutor.html?id=' + t.id + '">' +
      '<div class="fav-mini-avatar">' + avatarInner + '</div>' +
      '<div class="fav-mini-info">' +
        '<div class="fav-mini-nombre">' + t.nombre + '</div>' +
        '<div class="fav-mini-materia">' + ((t.materias || [])[0] || '') + '</div>' +
      '</div>' +
      '<div class="fav-mini-precio">' + (t.precio || '').split(' - ')[0] + '</div>' +
    '</a>';
  }).join('');
}

/* ── Leer filtros de la UI ── */
function leerFiltros() {
  var q = document.getElementById('searchInput') || document.getElementById('buscadorTexto');
  return {
    materia:   (document.getElementById('filtroMateria')   || {}).value || '',
    modalidad: (document.getElementById('filtroModalidad') || {}).value || '',
    precio:    (document.getElementById('filtroPrecio')    || {}).value || '',
    ubicacion: (document.getElementById('filtroUbicacion') || {}).value || '',
    nivel:     (document.getElementById('filtroNivel')     || {}).value || '',
    q:         q ? q.value.trim() : ''
  };
}

/* ── Aplicar filtros y re-renderizar ── */
function aplicarFiltros() {
  var filtros = leerFiltros();
  var lista = obtenerTutoresLocal(filtros);
  tutoresFiltrados = lista;
  renderizarTutores(lista);
}

/* ── Barra de búsqueda del header ── */
function configurarBusquedaHeader() {
  var searchInput = document.getElementById('searchInput');
  var headerSearchBtn = document.getElementById('headerSearchBtn');
  if (!searchInput) return;

  var dropdown = document.createElement('div');
  dropdown.id = 'searchDropdown';
  dropdown.style.cssText = 'position:absolute;top:100%;left:0;right:0;background:white;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.15);z-index:9999;max-height:320px;overflow-y:auto;display:none;margin-top:6px;';
  var searchWrapper = searchInput.closest('.header-search');
  if (searchWrapper) {
    searchWrapper.style.position = 'relative';
    searchWrapper.appendChild(dropdown);
  }

  function buscarYMostrar() {
    var q = searchInput.value.trim();
    if (!q) { dropdown.style.display = 'none'; return; }

    var resultados = obtenerTutoresLocal({ q: q });
    if (resultados.length === 0) {
      dropdown.innerHTML = '<div style="padding:16px;color:#9ca3af;font-size:.88rem;text-align:center">No se encontraron tutores para "<strong>' + q + '</strong>"</div>';
      dropdown.style.display = 'block';
      return;
    }

    dropdown.innerHTML = resultados.slice(0, 8).map(function(t) {
      var foto = t.foto
        ? '<img src="' + t.foto + '" alt="' + t.nombre + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%">'
        : '<span style="font-size:.9rem;font-weight:700;color:#fff">' + t.nombre.charAt(0).toUpperCase() + '</span>';
      return '<a href="perfil_tutor.html?id=' + t.id + '" style="display:flex;align-items:center;gap:12px;padding:10px 16px;text-decoration:none;color:inherit;border-bottom:1px solid #f3f4f6;transition:background .15s" onmouseover="this.style.background=\'#f9fafb\'" onmouseout="this.style.background=\'\'">'+
        '<div style="width:38px;height:38px;border-radius:50%;background:' + colorAvatar(t.nombre) + ';display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">' + foto + '</div>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-weight:700;font-size:.88rem">' + t.nombre + '</div>'+
          '<div style="font-size:.75rem;color:#9ca3af">' + (t.materias || []).slice(0,3).join(' · ') + '</div>'+
        '</div>'+
        '<div style="font-size:.78rem;color:#4a7a30;font-weight:700">' + (t.precio || '').split(' - ')[0] + '</div>'+
      '</a>';
    }).join('');

    if (resultados.length > 8) {
      dropdown.innerHTML += '<div style="padding:10px 16px;font-size:.8rem;color:#6b7280;text-align:center">' + (resultados.length - 8) + ' más...</div>';
    }
    dropdown.style.display = 'block';
  }

  searchInput.addEventListener('input', buscarYMostrar);
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { dropdown.style.display = 'none'; aplicarFiltros(); }
    if (e.key === 'Escape') dropdown.style.display = 'none';
  });
  if (headerSearchBtn) headerSearchBtn.addEventListener('click', function() { dropdown.style.display = 'none'; aplicarFiltros(); });
  document.addEventListener('click', function(e) {
    if (!searchWrapper || !searchWrapper.contains(e.target)) dropdown.style.display = 'none';
  });
}

/* ── Cargar tutores reales desde la API y mezclar con locales ── */
async function cargarTutoresAPI() {
  try {
    var res = await fetch('/api/tutores');
    if (!res.ok) return;
    var data = await res.json();
    var apiTutores = (data.tutores || []).map(function(t) {
      return {
        id:           String(t.id),
        nombre:       t.nombre || '',
        foto:         t.foto_url || '',
        especialidad: t.especialidad || '',
        ubicacion:    (t.ciudad || 'Colombia') + ', COL',
        precio:       t.precio_min_cop
                        ? (Math.round(t.precio_min_cop / 1000) + 'k' +
                           (t.precio_max_cop ? ' - ' + Math.round(t.precio_max_cop / 1000) + 'k' : '') + ' COP')
                        : '15k - 50k COP',
        materias:     t.materias ? t.materias.split(',').map(function(m){ return m.trim(); }) : [],
        ratingPromedio: parseFloat(t.rating_promedio) || 5,
        totalResenas: t.total_resenas || 0,
        modalidad:    t.modalidad || 'virtual',
        nivel:        t.nivel || '',
        verificado:   !!t.verificado
      };
    });
    window._TUTORES_API = apiTutores;
  } catch(e) {
    window._TUTORES_API = [];
  }
}

/* ── Inicialización ── */
document.addEventListener('DOMContentLoaded', async function () {
  cargarFavoritos();

  /* Cargar favoritos reales del backend si hay sesión */
  var token = typeof getToken === 'function' ? getToken() : null;
  if (token) {
    try {
      var resFavs = await fetch('/api/favoritos', { headers: { 'Authorization': 'Bearer ' + token } });
      var dataFavs = await resFavs.json();
      if (dataFavs.favoritos) {
        dataFavs.favoritos.forEach(function(f){ favoritosSet.add(String(f.id)); });
        guardarFavoritos();
      }
    } catch(e) {}
  }

  /* Cargar tutores de la API y luego renderizar */
  await cargarTutoresAPI();

  tutoresFiltrados = obtenerTodosLosTutores();
  renderizarTutores(tutoresFiltrados);
  renderizarFavoritosSidebar();
  configurarBusquedaHeader();

  var btnBuscar = document.getElementById('btnBuscar');
  if (btnBuscar) btnBuscar.addEventListener('click', aplicarFiltros);

  document.querySelectorAll('.filtro-select').forEach(function (sel) {
    sel.addEventListener('change', aplicarFiltros);
  });

  /* Filtro por materia desde URL (?materia=Inglés) */
  var params   = new URLSearchParams(window.location.search);
  var matParam = params.get('materia');
  if (matParam) {
    var sel = document.getElementById('filtroMateria');
    if (sel) {
      /* Intentar match exacto primero, luego normalizado */
      for (var i = 0; i < sel.options.length; i++) {
        if (normalize(sel.options[i].value) === normalize(matParam) ||
            normalize(sel.options[i].text) === normalize(matParam)) {
          sel.selectedIndex = i;
          break;
        }
      }
      aplicarFiltros();
    }
  }

  /* Filtro por búsqueda desde URL (?q=fisica) */
  var qParam = params.get('q');
  if (qParam) {
    var si = document.getElementById('searchInput') || document.getElementById('buscadorTexto');
    if (si) { si.value = qParam; aplicarFiltros(); }
  }
});
