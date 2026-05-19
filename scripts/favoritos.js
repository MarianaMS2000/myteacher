/* favoritos.js — muestra y gestiona favoritos usando la API real */

var _todosLosFavoritos = [];

/* ── Color de avatar ── */
function colorAvatarFav(nombre) {
  var colores = ['#4a7a30','#7c3aed','#db2777','#059669','#d97706','#1d4ed8','#dc2626','#0891b2'];
  var idx = 0;
  for (var i = 0; i < nombre.length; i++) idx += nombre.charCodeAt(i);
  return colores[idx % colores.length];
}

/* ── Normalizar tutor de la API al formato que usa el renderizado ── */
function normalizarTutor(t) {
  return {
    id:           String(t.id),
    nombre:       t.nombre || '',
    foto:         t.foto_url || '',
    especialidad: t.especialidad || '',
    ubicacion:    t.ciudad || 'Colombia',
    precio:       t.precio_min_cop
                    ? (Math.round(t.precio_min_cop / 1000) + 'k' +
                       (t.precio_max_cop ? ' - ' + Math.round(t.precio_max_cop / 1000) + 'k' : '') +
                       ' COP')
                    : '',
    materias:     t.materias ? t.materias.split(',').map(function(m){ return m.trim(); }) : [],
    ratingPromedio: t.rating_promedio || 5,
    modalidad:    t.modalidad || ''
  };
}

/* ── Buscar en favoritos ── */
function configurarBusqueda() {
  var searchInput = document.querySelector('.header-search input');
  if (!searchInput) return;

  var dropdown = document.createElement('div');
  dropdown.style.cssText = 'position:absolute;top:100%;left:0;right:0;background:white;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.15);z-index:9999;max-height:320px;overflow-y:auto;display:none;margin-top:6px;';
  var searchWrapper = searchInput.closest('.header-search');
  if (searchWrapper) {
    searchWrapper.style.position = 'relative';
    searchWrapper.appendChild(dropdown);
  }

  function buscarYMostrar() {
    var q = searchInput.value.trim().toLowerCase();
    if (!q) { dropdown.style.display = 'none'; return; }

    var resultados = _todosLosFavoritos.filter(function(t) {
      return (t.nombre || '').toLowerCase().includes(q) ||
             (t.especialidad || '').toLowerCase().includes(q) ||
             (t.materias || []).some(function(m){ return m.toLowerCase().includes(q); }) ||
             (t.ubicacion || '').toLowerCase().includes(q);
    });

    if (resultados.length === 0) {
      dropdown.innerHTML = '<div style="padding:16px;color:#9ca3af;font-size:.88rem;text-align:center">No se encontraron tutores para "<strong>' + q + '</strong>"</div>';
      dropdown.style.display = 'block';
      return;
    }

    dropdown.innerHTML = resultados.slice(0, 8).map(function(t) {
      var foto = t.foto
        ? '<img src="' + t.foto + '" alt="' + t.nombre + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%">'
        : '<span style="font-size:.9rem;font-weight:700;color:#fff">' + t.nombre.charAt(0).toUpperCase() + '</span>';
      return '<a href="perfil_tutor.html?id=' + t.id + '" style="display:flex;align-items:center;gap:12px;padding:10px 16px;text-decoration:none;color:inherit;border-bottom:1px solid #f3f4f6;" onmouseover="this.style.background=\'#f9fafb\'" onmouseout="this.style.background=\'\'">'+
        '<div style="width:38px;height:38px;border-radius:50%;background:' + colorAvatarFav(t.nombre) + ';display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">' + foto + '</div>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-weight:700;font-size:.88rem">' + t.nombre + '</div>'+
          '<div style="font-size:.75rem;color:#9ca3af">' + (t.materias || []).slice(0,3).join(' · ') + '</div>'+
        '</div>'+
        '<div style="font-size:.78rem;color:#4a7a30;font-weight:700">' + (t.precio || '').split(' - ')[0] + '</div>'+
      '</a>';
    }).join('');
    dropdown.style.display = 'block';
  }

  searchInput.addEventListener('input', function() {
    var q = searchInput.value.trim().toLowerCase();
    if (q) buscarYMostrar();
    else { filtrarFavoritos(''); dropdown.style.display = 'none'; }
  });
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') dropdown.style.display = 'none';
  });

  var searchBtn = document.querySelector('.search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', function() {
      var q = searchInput.value.trim().toLowerCase();
      if (q) { filtrarFavoritos(q); dropdown.style.display = 'none'; }
    });
  }

  document.addEventListener('click', function(e) {
    if (!searchWrapper || !searchWrapper.contains(e.target)) dropdown.style.display = 'none';
  });
}

function filtrarFavoritos(q) {
  var lista = q
    ? _todosLosFavoritos.filter(function (t) {
        return (t.nombre || '').toLowerCase().includes(q) ||
               (t.especialidad || '').toLowerCase().includes(q) ||
               (t.materias || []).some(function(m){ return m.toLowerCase().includes(q); }) ||
               (t.ubicacion || '').toLowerCase().includes(q);
      })
    : _todosLosFavoritos;
  _renderLista(lista);
}

/* ── Renderizar tarjetas de favoritos ── */
function crearTarjetaFavorito(tutor) {
  var card = document.createElement('div');
  card.className = 'tutor-fav-card';

  var color = colorAvatarFav(tutor.nombre);

  var fotoHtml = tutor.foto
    ? '<img src="' + tutor.foto + '" alt="' + tutor.nombre + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;object-position:top;">'
    : '<span style="font-size:1.6rem;font-weight:700;color:#fff;line-height:1">' + tutor.nombre.charAt(0).toUpperCase() + '</span>';

  var estrellas = parseFloat(tutor.ratingPromedio) || 5;
  var estrellasHtml = '';
  for (var s = 1; s <= 5; s++) {
    estrellasHtml += '<i class="fa' + (s <= Math.round(estrellas) ? 's' : 'r') + ' fa-star" style="color:#f59e0b;font-size:.75rem"></i>';
  }

  card.innerHTML =
    /* Avatar */
    '<div class="tutor-fav-avatar" style="background:' + color + ';display:flex;align-items:center;justify-content:center;">' + fotoHtml + '</div>' +
    /* Info central */
    '<div class="tutor-fav-info">' +
      '<div class="tutor-fav-rating"><i class="fas fa-star"></i> ' + estrellas.toFixed(1) + '</div>' +
      '<div class="tutor-fav-nombre">' + tutor.nombre + '</div>' +
      '<div class="tutor-fav-especialidad">' + (tutor.especialidad || '') + '</div>' +
      '<div class="tutor-fav-ubicacion"><i class="fas fa-map-marker-alt"></i> ' + (tutor.ubicacion || 'Colombia') + '</div>' +
    '</div>' +
    /* Columna derecha */
    '<div class="tutor-fav-derecha">' +
      '<div class="tutor-fav-precio">Desde ' + (tutor.precio || '').split(' - ')[0] + '</div>' +
      '<div class="tutor-fav-modalidad">' + (tutor.modalidad || '') + '</div>' +
      '<div class="tutor-fav-btns">' +
        '<a href="perfil_tutor.html?id=' + tutor.id + '" class="btn-ver-perfil-fav">Ver perfil</a>' +
        '<a href="agendar_tutoria.html?id=' + tutor.id + '" class="btn-ver-perfil-fav azul">Agendar</a>' +
      '</div>' +
    '</div>' +
    /* Botón quitar */
    '<button class="btn-quitar-fav" onclick="quitarFavorito(\'' + tutor.id + '\', this)" title="Quitar de favoritos"><i class="fas fa-heart"></i></button>';

  return card;
}

function _renderLista(lista) {
  var grid  = document.getElementById('tutoresFavGrid');
  var vacio = document.getElementById('favVacio');
  if (!grid) return;

  if (lista.length === 0) {
    grid.style.display = 'none';
    if (vacio) vacio.style.display = 'flex';
    return;
  }
  if (vacio) vacio.style.display = 'none';
  grid.style.display = '';
  grid.innerHTML = '';
  lista.forEach(function (tutor, index) {
    var card = crearTarjetaFavorito(tutor);
    card.style.opacity   = '0';
    card.style.transform = 'translateY(12px)';
    grid.appendChild(card);
    setTimeout(function (c) {
      c.style.transition = 'opacity .3s, transform .3s';
      c.style.opacity    = '1';
      c.style.transform  = 'translateY(0)';
    }.bind(null, card), index * 60);
  });
}

/* ── Quitar favorito (llama a la API) ── */
async function quitarFavorito(profId, btn) {
  profId = String(profId);
  var card = btn.closest('.tutor-fav-card');
  if (card) {
    card.style.transition = 'opacity .25s, transform .25s';
    card.style.opacity    = '0';
    card.style.transform  = 'scale(0.9)';
  }

  var token = getToken();
  if (token) {
    try {
      await fetch('/api/favoritos/' + profId, {
        method:  'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
    } catch(e) { console.error('Error quitando favorito:', e); }
  }

  _todosLosFavoritos = _todosLosFavoritos.filter(function(t){ return String(t.id) !== profId; });

  setTimeout(function() {
    _renderLista(_todosLosFavoritos);
  }, 280);
}

/* ── Cargar favoritos desde la API ── */
async function cargarFavoritos() {
  var grid = document.getElementById('tutoresFavGrid');
  if (!grid) return;

  var token = getToken();
  if (!token) {
    _todosLosFavoritos = [];
    _renderLista([]);
    return;
  }

  try {
    var res  = await fetch('/api/favoritos', { headers: { 'Authorization': 'Bearer ' + token } });
    var data = await res.json();
    _todosLosFavoritos = (data.favoritos || []).map(normalizarTutor);
    _renderLista(_todosLosFavoritos);
  } catch(e) {
    console.error('Error cargando favoritos:', e);
    _todosLosFavoritos = [];
    _renderLista([]);
  }
}

document.addEventListener('DOMContentLoaded', async function() {
  await cargarFavoritos();
  configurarBusqueda();
});
