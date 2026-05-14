// ══════════════════════════════════════
//  CARAVANA SCANNER v3.1 — MANUAL
// ══════════════════════════════════════
const APP = {
  pin:'123', pinBuffer:'', session:null, readings:[],
  readingsSet: new Set(), // Fast duplicate detection
  sessionsHistory:[],
  editIdx:-1,
  online: navigator.onLine,
  fijarLote: false
};



// ── PIN (event delegation for mobile compatibility) ──
document.addEventListener('DOMContentLoaded', function(){
  var pad = document.getElementById('pinPad');
  if(!pad) return;
  function handleKey(e){
    var btn = e.target.closest('[data-key]');
    if(!btn) return;
    e.preventDefault();
    e.stopPropagation();
    var key = btn.getAttribute('data-key');
    if(key === 'clear') pinClear();
    else if(key === 'del') pinDel();
    else pinPress(key);
  }
  pad.addEventListener('touchend', handleKey, {passive:false});
  pad.addEventListener('click', handleKey);
});

function pinPress(d){
  if(APP.pinBuffer.length>=3)return;
  APP.pinBuffer+=d; updatePinDots();
  if(APP.pinBuffer.length===3){
    setTimeout(()=>{
      if(APP.pinBuffer===APP.pin){showScreen('screenStart');checkResume();loadSaved();}
      else{document.getElementById('pinError').textContent='PIN incorrecto';APP.pinBuffer='';updatePinDots();setTimeout(()=>document.getElementById('pinError').textContent='',1200);}
    },120);
  }
}
function pinDel(){APP.pinBuffer=APP.pinBuffer.slice(0,-1);updatePinDots();}
function pinClear(){APP.pinBuffer='';updatePinDots();}
function updatePinDots(){for(let i=0;i<3;i++)document.getElementById('d'+i).classList.toggle('filled',i<APP.pinBuffer.length);}

// ── SCREENS ──
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const target = document.getElementById(id);
  if(target) target.classList.add('active');
  
  if(id==='screenStart')checkResume();
  if(id==='screenList')renderList();
  if(id==='screenExport')renderExport();
  if(id==='screenHistory')renderHistory();
}

// ── SHEETS ──
function showSheet(id){document.getElementById(id).classList.remove('hidden');}
function closeSheet(id){document.getElementById(id).classList.add('hidden');}
function closeSheetOnBg(e,id){if(e.target.classList.contains('overlay'))closeSheet(id);}

// ── SETUP ──


function toggleOperarioOtro(){
  const s=document.getElementById('operarioSelect').value;
  const el=document.getElementById('operarioOtro');
  if(s==='Otro'){
    el.style.display='block';
    setTimeout(()=>el.focus(),100);
  } else {
    el.style.display='none';
  }
}

// ── SESSION ──
function startSession(){
  const o=document.getElementById('corrOrigen').value;
  const d=document.getElementById('corrDestino').value;
  if(!o||!d){alert('Seleccioná corral origen y destino');return;}
  
  let op = document.getElementById('operarioSelect').value;
  if(op === 'Otro') op = document.getElementById('operarioOtro').value.trim();
  
  APP.session={origen:o,destino:d,operario:op,date:new Date().toLocaleDateString('es-AR')};
  APP.readings=[];
  saveState();goToSession();
}
function resumeSession(){goToSession();}
function goToSession(){
  showScreen('screenSession');
  document.getElementById('sessionCorrLabel').textContent=APP.session.origen+' → '+APP.session.destino;
  document.getElementById('sessionOpLabel').textContent=APP.session.operario||'';
  updateCount();
  updateLoteSummary();
  setTimeout(()=>document.getElementById('manLote').focus(), 100);
}
function checkResume(){
  const resumeCard = document.getElementById('resumeCard');
  const startForm = document.getElementById('startFormCard');
  const historyCard = document.getElementById('historyCardStart');
  
  if(APP.session){
    resumeCard.style.display='block';
    startForm.style.display='none'; // Ocultar formulario de nueva si hay una activa
    document.getElementById('resumeInfo').textContent=APP.session.origen+' → '+APP.session.destino+' · '+APP.readings.length+' caravanas';
    if(historyCard) historyCard.style.display='none';
  } else {
    resumeCard.style.display='none';
    startForm.style.display='block';
    if(APP.sessionsHistory.length>0){
      if(historyCard) historyCard.style.display='block';
    } else {
      if(historyCard) historyCard.style.display='none';
    }
  }
}
function loadSaved(){
  try{
    const s=localStorage.getItem('cs_session');
    const r=localStorage.getItem('cs_readings');
    const h=localStorage.getItem('cs_history');
    if(s)APP.session=JSON.parse(s);
    if(r){APP.readings=JSON.parse(r);APP.readingsSet=new Set(APP.readings);}
    if(h)APP.sessionsHistory=JSON.parse(h);
    checkResume();
  }catch(e){}
}
function saveState(){
  try{
    if(APP.session)localStorage.setItem('cs_session',JSON.stringify(APP.session));
    else localStorage.removeItem('cs_session');
    localStorage.setItem('cs_readings',JSON.stringify(APP.readings));
    localStorage.setItem('cs_history',JSON.stringify(APP.sessionsHistory));
  }catch(e){}
}



// ── TOAST ──
function showToast(num,isDup){
  const t=document.getElementById('detectedToast');
  t.textContent=isDup?'⚠ Ya registrada: '+num:'✓ Registrada: '+num;
  t.className='detected-toast show '+(isDup?'dup':'ok');
  setTimeout(()=>t.classList.remove('show'),2200);
}
function updateCount(){
  const animales = APP.readings.length;
  const caravanas = APP.readings.filter(r => r !== 'NN').length;
  const camCount = document.getElementById('sessionCount');
  if(camCount) camCount.textContent = animales;
  
  const camLabel = document.getElementById('sessionLabel');
  if(camLabel) camLabel.innerHTML = `animales<br><span style="font-size:10px">(${caravanas} caravanas)</span>`;
  
  const tb = document.getElementById('totalBadge');
  if(tb) tb.textContent = animales + ' animales';
}

// ── MANUAL / UNDO ──
function addNN(){
  APP.readings.push("NN");
  updateCount(); saveState();
  updateLastReadArea();
  if(navigator.vibrate)navigator.vibrate(50);
  showToast("NN (Sin Caravana)", false);
}
function updateManualPreview(){
  const l=document.getElementById('manLote').value,a=document.getElementById('manAnimal').value;
  document.getElementById('manPreview').textContent=(l&&a)?l+'-'+String(parseInt(a)).padStart(3,'0'):'—';
}
function toggleFijarLote(){
  APP.fijarLote = document.getElementById('fijarLote').checked;
}
function exitSession(){
  showScreen('screenStart');
}
function saveManualEmpty(){
  exitSession();
}
function saveManual(){
  const l_el=document.getElementById('manLote'), a_el=document.getElementById('manAnimal');
  const l=l_el.value, a=parseInt(a_el.value);
  
  if(!l && !a_el.value) {
    saveManualEmpty();
    return;
  }
  
  if(!l||!a||a<1||a>499){alert('Valores inválidos (Animal debe ser 1-499)');return;}
  const fmt = l+'-'+String(a).padStart(3,'0');
  if(APP.readingsSet.has(fmt)){alert('Ya registrada');return;}
  APP.readings.push(fmt);APP.readingsSet.add(fmt);
  updateCount();saveState();
  updateLastReadArea();
  updateLoteSummary();
  if(navigator.vibrate)navigator.vibrate(50);
  showToast(fmt, false);
  
  a_el.value='';
  if(!APP.fijarLote) {
    l_el.value='';
    l_el.focus();
  } else {
    a_el.focus();
  }
  updateManualPreview();
}
function updateLoteSummary() {
  const summary = document.getElementById('loteSummary');
  if(!summary) return;
  const counts = {};
  APP.readings.forEach(r => {
    if(r==='NN') return;
    const l = r.split('-')[0];
    counts[l] = (counts[l] || 0) + 1;
  });
  const txt = Object.entries(counts).map(([l,c]) => `Lote ${l}: ${c}`).join(' | ');
  summary.textContent = txt;
}
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('manLote')?.addEventListener('keypress', function(e) {
    if(e.key === 'Enter') { e.preventDefault(); document.getElementById('manAnimal').focus(); }
  });
  document.getElementById('manAnimal')?.addEventListener('keypress', function(e) {
    if(e.key === 'Enter') { e.preventDefault(); saveManual(); }
  });
});
function editReading(idx){ openEditSheet(idx); }
function undoReading(idx){
  if(!confirm('¿Deshacer '+APP.readings[idx]+'?'))return;
  const removed=APP.readings.splice(idx,1)[0];
  APP.readingsSet.delete(removed);
  updateCount();saveState();
  updateLastReadArea();
  updateLoteSummary();
  if(document.getElementById('screenList').classList.contains('active')) renderList();
}
function updateLastReadArea() {
  const container = document.getElementById('lastReadCard');
  if(!container) return;
  const list = document.getElementById('lastReadList');
  if(!list) return;
  if(APP.readings.length === 0) {
    container.style.display = 'none'; return;
  }
  container.style.display = 'flex';
  
  const recent = [];
  const maxToShow = 6;
  const startIdx = Math.max(0, APP.readings.length - maxToShow);
  for(let i = APP.readings.length - 1; i >= startIdx; i--) {
    recent.push({val: APP.readings[i], idx: i});
  }
  
  list.innerHTML = recent.map(r => `
    <div style="display:flex;align-items:center;background:var(--bg-secondary);padding:6px 10px;border-radius:var(--radius-sm)">
      <div style="font-family:var(--mono);font-size:18px;font-weight:700;flex:1">${r.val}</div>
      <button class="btn btn-sm" onclick="editReading(${r.idx})" style="padding:4px 8px;font-size:11px;margin-right:4px" ${r.val==='NN'?'disabled':''}>Editar</button>
      <button class="btn btn-sm btn-ghost" onclick="undoReading(${r.idx})" style="color:var(--red);padding:4px 8px;font-size:11px">Deshacer</button>
    </div>
  `).join('');
}

// ── EDIT ──
function openEditSheet(idx){
  APP.editIdx=idx;const parts=APP.readings[idx].split('-');
  document.getElementById('editLote').value=parseInt(parts[0]);
  document.getElementById('editAnimal').value=parseInt(parts[1]);
  updateEditPreview();showSheet('sheetEdit');
}
function updateEditPreview(){
  const l=document.getElementById('editLote').value,a=document.getElementById('editAnimal').value;
  document.getElementById('editPreview').textContent=(l&&a)?l+'-'+String(parseInt(a)).padStart(3,'0'):'—';
}
function saveEdit(){
  const l=document.getElementById('editLote').value,a=parseInt(document.getElementById('editAnimal').value);
  if(!l||!a||a<1||a>499){alert('Valores inválidos');return;}
  const nv=l+'-'+String(a).padStart(3,'0');
  if(APP.readingsSet.has(nv) && APP.readings.indexOf(nv) !== APP.editIdx){alert('Caravana ya existe');return;}
  const old=APP.readings[APP.editIdx];
  APP.readingsSet.delete(old);APP.readingsSet.add(nv);
  APP.readings[APP.editIdx]=nv;
  closeSheet('sheetEdit');renderList();saveState();updateLastReadArea();
}

// ── LIST ──
function renderList(){
  const w=document.getElementById('listWrap');updateCount();
  if(!APP.readings.length){w.innerHTML='<div class="empty-state">Todavía no hay caravanas</div>';return;}
  w.innerHTML=APP.readings.map((r,i)=>`
    <div class="list-item">
      <span class="list-idx">${i+1}</span>
      <span class="list-num">${r}</span>
      <button class="list-edit-btn" onclick="openEditSheet(${i})">Editar</button>
      <button class="list-del-btn" onclick="deleteReading(${i})">✕</button>
    </div>
  `).join('');
}
function deleteReading(i){
  const val = APP.readings[i];
  if(!val) return;
  if(!confirm('¿Eliminar '+val+'?')) return;
  APP.readings.splice(i, 1);
  APP.readingsSet.delete(val);
  updateCount();
  saveState();
  updateLastReadArea();
  renderList();
}

// ── EXPORT ──
function generateCSV(){
  const s=APP.session;return(s.origen||'?')+' al '+(s.destino||'?')+'\n'+APP.readings.join('\n');
}
function renderExport(){
  document.getElementById('expCount').textContent=APP.readings.length;
  const s=APP.session||{};
  document.getElementById('expCorral').textContent=(s.origen||'?')+'→'+(s.destino||'?');
  const dateStr=(new Date()).toLocaleDateString('es-AR').replace(/\//g,'-');
  document.getElementById('csvFilename').value='del-'+(s.origen||'')+'-al-'+(s.destino||'')+' '+dateStr;
  const lines=generateCSV().split('\n');
  document.getElementById('csvPreview').textContent=lines.slice(0,10).join('\n')+(lines.length>10?'\n...':'');
}
function downloadCSV(){
  if(!APP.readings.length){alert('No hay caravanas');return;}
  const name=(document.getElementById('csvFilename').value.trim()||'movimiento')+'.csv';
  const blob=new Blob(['\uFEFF'+generateCSV()],{type:'text/csv;charset=utf-8;'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();
}
async function shareCSV(){
  if(!APP.readings.length){alert('No hay caravanas');return;}
  const csv=generateCSV();
  const s=APP.session||{};
  const msg=`Se movieron ${APP.readings.length} animales del ${s.origen||'?'} al ${s.destino||'?'}.`;
  
  // SOLUCIÓN: Usar un nombre de archivo descriptivo (WhatsApp suele ignorar el texto al enviar archivos desde web)
  // Nombre: "Movimiento - 22 animales - Corral 5 a 10.csv"
  const fileName = `Movimiento - ${APP.readings.length} animales - Corral ${s.origen} a ${s.destino}.csv`;
  
  const blob = new Blob(['\uFEFF'+csv], {type: 'text/csv'});
  const file = new File([blob], fileName, {type: 'text/csv'});

  // Backup: Copiar el mensaje al portapapeles por si el usuario quiere pegarlo
  try {
    await navigator.clipboard.writeText(msg);
    showToast('Resumen copiado al portapapeles', false);
  } catch(e) {}

  if(navigator.share && navigator.canShare && navigator.canShare({ files: [file] })){
    navigator.share({
      files: [file],
      title: 'Reporte de Movimiento',
      text: msg // Lo incluimos de todas formas, aunque algunos celulares lo ignoren
    }).catch(() => {});
  } else {
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
  }
}
function confirmNewSession(){
  if(!APP.session || APP.readings.length === 0){
    alert('No hay sesión activa para finalizar.');
    return;
  }
  if(!confirm('¿Finalizar y archivar esta sesión en el historial?'))return;
  
  APP.sessionsHistory.push({
    session: APP.session,
    readings: APP.readings,
    timestamp: Date.now()
  });
  
  APP.readings=[];APP.readingsSet=new Set();APP.session=null;
  saveState();
  const lrc = document.getElementById('lastReadCard');
  if(lrc) lrc.style.display='none';
  checkResume();
  showScreen('screenStart');
}

// ── HISTORY ──
function renderHistory(){
  const w=document.getElementById('historyWrap');
  if(!APP.sessionsHistory || APP.sessionsHistory.length===0){
    w.innerHTML='<div class="empty-state">No hay sesiones guardadas</div>';
    return;
  }
  
  w.innerHTML = APP.sessionsHistory.map((sh, i) => {
    const s = sh.session;
    const dateStr = new Date(sh.timestamp).toLocaleString('es-AR', {dateStyle:'short', timeStyle:'short'});
    return `
      <div class="card" style="margin-bottom:8px; display:flex; flex-direction:column; gap:8px">
        <div style="display:flex; justify-content:space-between; align-items:center">
          <div style="font-weight:600; font-size:15px">${s.origen} → ${s.destino}</div>
          <div style="font-size:12px; color:var(--text-muted)">${dateStr}</div>
        </div>
        <div style="font-size:13px; color:var(--text-muted)">${sh.readings.length} animales ${s.operario?'· '+s.operario:''}</div>
        <div style="display:flex; gap:6px; margin-top:4px">
          <button class="btn btn-sm btn-primary" onclick="continueHistorySession(${i})" style="flex:1">Continuar</button>
          <button class="btn btn-sm" onclick="exportHistorySession(${i})" style="flex:1">Exportar</button>
          <button class="btn btn-sm" onclick="deleteHistorySession(${i})" style="color:var(--red); border-color:transparent">🗑️</button>
        </div>
      </div>
    `;
  }).reverse().join(''); // Mostrar más recientes arriba
}

function continueHistorySession(i){
  if(APP.session && APP.readings.length > 0){
    if(!confirm('Tenés una sesión activa. Se archivará en el historial para continuar con esta. ¿Seguro?')) return;
    APP.sessionsHistory.push({session: APP.session, readings: APP.readings, timestamp: Date.now()});
  }
  
  const sh = APP.sessionsHistory.splice(i, 1)[0]; // Sacamos del historial
  APP.session = sh.session;
  APP.readings = sh.readings;
  saveState();
  goToSession();
}

function deleteHistorySession(i){
  if(!confirm('¿Eliminar esta sesión permanentemente?')) return;
  APP.sessionsHistory.splice(i, 1);
  saveState();
  renderHistory();
  checkResume(); // Actualizar botones de inicio
}

function exportHistorySession(i){
  // Cargar en la sesión temporalmente para exportar (sin quitarla del historial)
  const sh = APP.sessionsHistory[i];
  const csvData = (sh.session.origen||'?')+' al '+(sh.session.destino||'?')+'\n'+sh.readings.join('\n');
  const msg = `Se movieron ${sh.readings.length} animales del ${sh.session.origen||'?'} al ${sh.session.destino||'?'}.`;
  const fileName = `Movimiento - ${sh.readings.length} animales - Corral ${sh.session.origen} a ${sh.session.destino}.csv`;
  const blob = new Blob(['\uFEFF'+csvData], {type: 'text/csv'});
  const file = new File([blob], fileName, {type: 'text/csv'});

  if(navigator.share && navigator.canShare && navigator.canShare({ files: [file] })){
    navigator.share({
      files: [file],
      title: 'Reporte de Movimiento',
      text: msg
    }).catch(() => {});
  } else {
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
  }
}
