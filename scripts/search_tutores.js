/* search_tutores.js — Barra de búsqueda global
   - En panel_profesor.html: busca entre sesiones del día (NO redirige al panel de estudiantes)
   - En otros paneles: busca tutores */

document.addEventListener('DOMContentLoaded', function () {
  var searchInput = document.querySelector('.header-search input');
  if (!searchInput) return;

  /* Detectar si estamos en el panel del profesor */
  var esProfesor = window.location.pathname.includes('panel_profesor') ||
    document.title.toLowerCase().includes('profesor') ||
    document.querySelector('[data-rol="profesor"]') !== null;

  if (esProfesor) {
    searchInput.placeholder = 'Buscar estudiante o materia...';
    var searchBtn = document.querySelector('.search-btn');
    function ejecutarBusquedaProfesor() {
      var q = searchInput.value.trim().toLowerCase();
      if (typeof filtrarSesiones === 'function') filtrarSesiones(q);
    }
    searchInput.addEventListener('input', ejecutarBusquedaProfesor);
    if (searchBtn) searchBtn.addEventListener('click', ejecutarBusquedaProfesor);
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') ejecutarBusquedaProfesor();
    });
    return;
  }

  /* ── MODO ESTUDIANTE: busca tutores ── */
  var dropdown = document.createElement('div');
  dropdown.id = 'globalSearchDropdown';
  dropdown.style.cssText = 'position:absolute;top:100%;left:0;right:0;background:white;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.15);z-index:9999;max-height:340px;overflow-y:auto;display:none;margin-top:6px';

  var searchWrapper = searchInput.closest('.header-search');
  if (searchWrapper) {
    searchWrapper.style.position = 'relative';
    searchWrapper.appendChild(dropdown);
  }

  function colorAvatar(nombre) {
    var cols = ['#4a7a30','#7c3aed','#db2777','#059669','#d97706','#1d4ed8','#dc2626','#0891b2'];
    var idx = 0;
    for (var i = 0; i < nombre.length; i++) idx += nombre.charCodeAt(i);
    return cols[idx % cols.length];
  }

  function normalize(str) {
    return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function buscarTutores(q) {
    if (!q || !window.getAllTutores) return [];
    var qn = normalize(q);
    var base = getAllTutores().slice();
    if (window._TUTORES_API && window._TUTORES_API.length) {
      var localIds = new Set(base.map(function(t){ return String(t.id); }));
      window._TUTORES_API.forEach(function(t){ if (!localIds.has(String(t.id))) base.push(t); });
    }
    return base.filter(function(t) {
      return normalize(t.nombre).includes(qn) ||
             normalize(t.especialidad).includes(qn) ||
             (t.materias || []).some(function(m){ return normalize(m).includes(qn); }) ||
             normalize(t.ubicacion).includes(qn);
    });
  }

  function mostrarResultados() {
    var q = searchInput.value.trim();
    if (!q) { dropdown.style.display = 'none'; return; }
    var resultados = buscarTutores(q);
    if (resultados.length === 0) {
      dropdown.innerHTML = '<div style="padding:20px;text-align:center;color:#9ca3af;font-size:.88rem">No se encontraron tutores para <strong>"' + q + '"</strong><br><a href="tutores.html" style="color:#4a7a30;font-weight:700">Ver todos los tutores →</a></div>';
      dropdown.style.display = 'block';
      return;
    }
    var html = '<div style="padding:8px 16px 4px;font-size:.75rem;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Tutores (' + resultados.length + ')</div>';
    html += resultados.slice(0, 6).map(function(t) {
      var color = colorAvatar(t.nombre);
      var foto = t.foto ? '<img src="' + t.foto + '" alt="' + t.nombre + '" style="width:100%;height:100%;object-fit:cover;object-position:top;border-radius:50%;" onerror="this.style.display=\'none\'">' : '<span style="font-size:.9rem;font-weight:800;color:#fff">' + t.nombre.charAt(0).toUpperCase() + '</span>';
      return '<a href="perfil_tutor.html?id=' + t.id + '" style="display:flex;align-items:center;gap:12px;padding:10px 16px;text-decoration:none;color:inherit;border-bottom:1px solid #f3f4f6;" onmouseover="this.style.background=\'#f9fafb\'" onmouseout="this.style.background=\'\'">' +
        '<div style="width:42px;height:42px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">' + foto + '</div>' +
        '<div style="flex:1;min-width:0"><div style="font-weight:700;font-size:.88rem">' + t.nombre + '</div><div style="font-size:.75rem;color:#9ca3af">' + (t.materias || []).slice(0,3).join(' · ') + '</div></div>' +
        '<div style="font-size:.75rem;color:#4a7a30;font-weight:700">' + (t.precio || '').split(' - ')[0] + '</div>' +
      '</a>';
    }).join('');
    if (resultados.length > 6) html += '<a href="tutores.html" style="display:block;padding:10px 16px;text-align:center;color:#4a7a30;font-weight:700;font-size:.85rem;text-decoration:none;border-top:1px solid #f3f4f6;">Ver ' + (resultados.length - 6) + ' más →</a>';
    dropdown.innerHTML = html;
    dropdown.style.display = 'block';
  }

  searchInput.addEventListener('input', mostrarResultados);
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') dropdown.style.display = 'none';
    if (e.key === 'Enter') { var q = searchInput.value.trim(); if (q) window.location.href = 'tutores.html?q=' + encodeURIComponent(q); }
  });
  var sb = searchWrapper ? searchWrapper.querySelector('.search-btn') : null;
  if (sb) sb.addEventListener('click', function() { var q = searchInput.value.trim(); if (q) window.location.href = 'tutores.html?q=' + encodeURIComponent(q); });
  document.addEventListener('click', function(e) { if (searchWrapper && !searchWrapper.contains(e.target)) dropdown.style.display = 'none'; });
});
