/* =============================================
   sesion_modal.js — Modal detalle de sesión
   Dos modos:
     'confirmar' → editable + botón verde "Confirmar"
                   Al confirmar: procesa la aceptación
                   Si se cierra sin confirmar: nada ocurre
     'detalle'   → editable + botón "Guardar cambios"
   ============================================= */

var LS_MSG_OVERRIDES = 'mt_msg_overrides';
var LS_ZOOM_LINKS    = 'mt_zoom_links';
var LS_SESIONES_MOD  = 'mt_sesiones_prof';
var LS_ESTUDIANTES_MOD = 'mt_estudiantes_prof';

/* ── Helpers ── */
function smEscapeHtml(str) {
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str || '')));
  return d.innerHTML;
}
function smFormatFecha(f) {
  if (!f) return '';
  var meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  var p = f.split('-');
  return p.length===3 ? parseInt(p[2],10)+' '+(meses[parseInt(p[1],10)-1]||'')+' '+p[0] : f;
}
function smFormatHora(hora) {
  if (!hora) return '';
  if (hora.indexOf('AM')!==-1||hora.indexOf('PM')!==-1) return hora;
  var p=hora.split(':'); if(p.length<2) return hora;
  var h=parseInt(p[0],10),m=p[1],ap=h>=12?'PM':'AM';
  h=h>12?h-12:(h===0?12:h);
  return h+':'+m+' '+ap;
}
function smGetMsgOverrides(){ try{return JSON.parse(localStorage.getItem(LS_MSG_OVERRIDES)||'{}')}catch(e){return{}} }
function smSetMsgOverride(id,msg){ var o=smGetMsgOverrides();o[id]=msg;localStorage.setItem(LS_MSG_OVERRIDES,JSON.stringify(o)); }
function smGetZoomLinks(){ try{return JSON.parse(localStorage.getItem(LS_ZOOM_LINKS)||'{}')}catch(e){return{}} }
function smSetZoomLink(id,link){ var o=smGetZoomLinks();o[id]=link;localStorage.setItem(LS_ZOOM_LINKS,JSON.stringify(o)); }

function smDefaultMsg(s){
  var n=(s.estudiante||'estudiante').split(' ')[0];
  return '¡Hola '+n+'! Recuerda tener lista la plataforma Zoom antes de la sesión. Empezaremos con una revisión del tema que elegiste. ¡Nos vemos pronto! 😊';
}
function smDefaultZoom(s){
  if ((s.tipo||'').toLowerCase()==='presencial') return null;
  /* Usar el link de Zoom guardado en el perfil del profesor */
  var profileZoom = '';
  try { profileZoom = localStorage.getItem('mt_prof_zoom_link') || ''; } catch(e) {}
  return profileZoom || 'https://zoom.us/j/myteacher-'+(s.id||Date.now());
}

/* ═══════ CONSTRUIR MODAL (una sola vez) ═══════ */
function smEnsureModal() {
  if (document.getElementById('sesionDetalleModal')) return;
  var el = document.createElement('div');
  el.id = 'sesionDetalleModal';
  el.className = 'sdm-overlay';
  el.innerHTML =
    '<div class="sdm-box">' +
      '<div class="sdm-header">' +
        '<div class="sdm-avatar-wrap">' +
          '<div class="sdm-avatar" id="sdmAvatar">??</div>' +
          '<div>' +
            '<div class="sdm-est-name" id="sdmEstName"></div>' +
            '<div class="sdm-est-sub"  id="sdmEstSub"></div>' +
          '</div>' +
        '</div>' +
        '<button class="sdm-close" id="sdmClose"><i class="fa-solid fa-xmark"></i></button>' +
      '</div>' +
      '<div class="sdm-chips" id="sdmChips"></div>' +
      '<div class="sdm-top-row">' +
        '<span class="sdm-badge-confirm"><i class="fa-solid fa-circle-check"></i> Confirmada</span>' +
        '<div class="sdm-price-block">' +
          '<div class="sdm-price" id="sdmPrice">—</div>' +
          '<div class="sdm-price-label">COP / sesión</div>' +
        '</div>' +
      '</div>' +
      '<div class="sdm-section-label">Mensaje para el estudiante</div>' +
      '<div class="sdm-msg-wrap">' +
        '<div class="sdm-msg-author">Tú:</div>' +
        '<textarea class="sdm-msg-textarea" id="sdmMsgTextarea" rows="3" maxlength="300"></textarea>' +
        '<div class="sdm-msg-hint">Este mensaje es visible para el estudiante. Puedes editarlo antes de la sesión.</div>' +
      '</div>' +
      '<div class="sdm-link-btns" id="sdmLinkBtns">' +
        '<button class="sdm-btn-whatsapp" id="sdmBtnWA"><i class="fa-brands fa-whatsapp"></i> WhatsApp</button>' +
        '<button class="sdm-btn-zoom"     id="sdmBtnZoom"><i class="fa-solid fa-video"></i> Link de videollamada</button>' +
      '</div>' +
      '<div class="sdm-presencial-note" id="sdmPresencialNote" style="display:none;">' +
        '<i class="fa-solid fa-location-dot"></i> Sesión presencial — no se requiere link de reunión.' +
      '</div>' +
      '<button class="sdm-btn-save" id="sdmBtnSave"></button>' +
    '</div>';
  document.body.appendChild(el);

  el.addEventListener('click', function(e){ if(e.target===el) smCerrar(); });
  document.getElementById('sdmClose').addEventListener('click', smCerrar);
  document.getElementById('sdmBtnSave').addEventListener('click', smAccionPrincipal);
  document.getElementById('sdmBtnWA').addEventListener('click', smAbrirWhatsapp);
  document.getElementById('sdmBtnZoom').addEventListener('click', smAbrirZoom);
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') smCerrar(); });
}

/* ═══════ ESTADO ═══════ */
var smSesionActual = null;
var smModoActual   = 'detalle';

function smSid(sesion) {
  /* Clave estable basada en datos de la sesión — funciona igual
     sin importar desde qué página se abre el modal (id varía). */
  return (sesion.estudiante||'') + '|' + (sesion.fecha||'') + '|' + (sesion.hora||'');
}

/* ═══════ ABRIR ═══════ */
function abrirSesionDetalle(sesion, modo) {
  smEnsureModal();
  smSesionActual = sesion;
  smModoActual   = modo || 'detalle';
  var esV = (sesion.tipo||'').toLowerCase() !== 'presencial';
  var sid = smSid(sesion);

  /* Avatar */
  var av = document.getElementById('sdmAvatar');
  av.textContent = sesion.iniciales||'??';
  av.style.background = sesion.color||'#4a7a30';
  document.getElementById('sdmEstName').textContent = sesion.estudiante||'';
  document.getElementById('sdmEstSub').textContent  = sesion.materia||'';

  /* Chips */
  document.getElementById('sdmChips').innerHTML =
    '<span class="sdm-chip"><i class="fa-regular fa-calendar"></i> '+smEscapeHtml(smFormatFecha(sesion.fecha))+'</span>'+
    '<span class="sdm-chip"><i class="fa-regular fa-clock"></i> '+smEscapeHtml(smFormatHora(sesion.hora||''))+'</span>'+
    '<span class="sdm-chip"><i class="fa-solid '+(esV?'fa-video':'fa-house')+'"></i> '+(esV?'Virtual':'Presencial')+'</span>'+
    '<span class="sdm-chip sdm-chip-dur"><i class="fa-solid fa-hourglass-half"></i> '+(sesion.duracion||60)+' minutos</span>';

  document.getElementById('sdmPrice').textContent = sesion.precio||'—';

  /* Mensaje — siempre editable en ambos modos */
  var overrides = smGetMsgOverrides();
  var msg = overrides[sid]!==undefined ? overrides[sid] : smDefaultMsg(sesion);
  document.getElementById('sdmMsgTextarea').value = msg;

  /* Botones link — virtual: WhatsApp + Zoom; presencial: solo WhatsApp */
  var lBtns   = document.getElementById('sdmLinkBtns');
  var btnZoom = document.getElementById('sdmBtnZoom');
  var pNote   = document.getElementById('sdmPresencialNote');
  if (lBtns) lBtns.style.display = 'flex';
  pNote.style.display = 'none';
  if (btnZoom) btnZoom.style.display = esV ? '' : 'none';

  /* Botón — verde "Confirmar" o verde oscuro "Guardar cambios" */
  var btn = document.getElementById('sdmBtnSave');
  if (smModoActual === 'confirmar') {
    btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Confirmar';
    btn.className = 'sdm-btn-save sdm-btn-confirmar';
  } else {
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar cambios';
    btn.className = 'sdm-btn-save';
  }

  document.getElementById('sesionDetalleModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

/* ═══════ ACCIÓN PRINCIPAL ═══════ */
function smAccionPrincipal() {
  /* Guardar mensaje y link independientemente del modo */
  smPersistirEdicion();

  if (smModoActual === 'confirmar') {
    smEjecutarAceptacion();
  } else {
    smFeedbackGuardado();
  }
}

/* Persiste mensaje y link editados */
function smPersistirEdicion() {
  if (!smSesionActual) return;
  var sid = smSid(smSesionActual);
  smSetMsgOverride(sid, document.getElementById('sdmMsgTextarea').value);
}

/* Ejecuta la aceptación real (solo desde modo confirmar) */
function smEjecutarAceptacion() {
  var cardId = smSesionActual._cardId;
  if (!cardId) { smFeedbackConfirmado(); return; }

  /* Guardar sesión y estudiante en localStorage */
  if (typeof agregarSesion === 'function') agregarSesion(smSesionActual);
  if (typeof agregarEstudiante === 'function') agregarEstudiante(smSesionActual);
  if (typeof guardarEstado === 'function') guardarEstado(cardId, 'aceptada');
  if (typeof moverCardAceptada === 'function') moverCardAceptada(cardId, true);

  smFeedbackConfirmado();
}

function smFeedbackConfirmado() {
  var btn = document.getElementById('sdmBtnSave');
  btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> ¡Confirmado!';
  btn.style.background = '#15803d';
  setTimeout(function(){ btn.style.background=''; smCerrar(); }, 900);
}

function smFeedbackGuardado() {
  var btn = document.getElementById('sdmBtnSave');
  btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> ¡Guardado!';
  btn.style.background = '#16a34a';
  setTimeout(function(){
    btn.innerHTML='<i class="fa-solid fa-floppy-disk"></i> Guardar cambios';
    btn.style.background=''; smCerrar();
  }, 1100);
}

/* ═══════ WHATSAPP / ZOOM ═══════ */
function smAbrirWhatsapp() {
  if (!smSesionActual) return;
  var sid = smSid(smSesionActual);
  var msg  = document.getElementById('sdmMsgTextarea').value || smGetMsgOverrides()[sid] || smDefaultMsg(smSesionActual);
  /* Usar número de WhatsApp del perfil del profesor */
  var waLink = '';
  try { waLink = localStorage.getItem('mt_prof_whatsapp_link') || ''; } catch(e) {}
  /* Armar link: si ya tiene wa.me usarlo directo, si no abrir chat genérico */
  var videoLink = '';
  try { videoLink = localStorage.getItem('mt_prof_video_link') || ''; } catch(e) {}
  var txt = msg + (videoLink ? '\n\nLink de videollamada: ' + videoLink : '');
  if (waLink && waLink.indexOf('wa.me') !== -1) {
    var base = waLink.split('?')[0];
    window.open(base + '?text=' + encodeURIComponent(txt), '_blank');
  } else {
    window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank');
  }
}

function smAbrirZoom() {
  var link = '';
  try { link = localStorage.getItem('mt_prof_video_link') || ''; } catch(e) {}
  if (!link) { alert('No hay link de videollamada configurado. Agrégalo en Configuración → Mi perfil.'); return; }
  window.open(link, '_blank');
}

/* ═══════ CERRAR (sin confirmar → nada pasa) ═══════ */
function smCerrar() {
  var m = document.getElementById('sesionDetalleModal');
  if (m) m.classList.remove('open');
  document.body.style.overflow = '';
  smSesionActual = null;
}
