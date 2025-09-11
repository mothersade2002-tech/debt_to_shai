// account page JS
function fmt(n){return Number(n||0).toFixed(2);}
let userCode = new URLSearchParams(window.location.search).get('id');

function showModal(msg){document.getElementById('modalMsg').innerText=msg; document.getElementById('modal').classList.remove('hidden');}
function closeModal(){document.getElementById('modal').classList.add('hidden');}

async function loadAccount(){
  if(!userCode){ showModal('no user specified'); return; }
  try{
    const res=await fetch('/.netlify/functions/getUser?code='+encodeURIComponent(userCode));
    if(!res.ok){ showModal('account not found'); return; }
    const data=await res.json();
    document.getElementById('subId').innerText='Sub: '+data.code;
    document.getElementById('rank').innerText='Rank: --';
    document.getElementById('title').innerText='Title: '+(data.title||'worm');
    document.getElementById('debtVal').innerText='$'+fmt(data.debt||0);

    // tasks: query tasks table for this code
    const tRes=await fetch('/.netlify/functions/getTasks?code='+encodeURIComponent(userCode));
    if(tRes.ok){
      const tasks=await tRes.json();
      const container=document.getElementById('tasksList');
      if(tasks.length===0) container.innerHTML='<p>no tasks</p>';
      else{
        container.innerHTML='';
        tasks.forEach(t=>{
          const el=document.createElement('div'); el.className='task-entry'; el.innerHTML=`<b>${t.task_name}</b><p>Completed: ${t.completed}</p>`;
          container.appendChild(el);
        });
      }
    }

    // relapse history
    const rRes=await fetch('/.netlify/functions/getRelapse?code='+encodeURIComponent(userCode));
    const rData = rRes.ok ? await rRes.json() : [];
    const hist=document.getElementById('relapseHistory'); hist.innerHTML='';
    let totalSpent = 0;
    rData.forEach(r=>{ const d=document.createElement('div'); d.innerHTML=`<p><b>${new Date(r.createdat).toLocaleString()}</b> - ${r.platform} - $${fmt(r.amount)}</p><p>${r.note}</p><hr>`; hist.appendChild(d); totalSpent += Number(r.amount||0); });

    // ledger: simple aggregation from relapses and tasks and debt changes
    const ledger=document.getElementById('ledgerInner'); ledger.innerHTML='';
    rData.forEach(r=>{ const row=document.createElement('div'); row.innerHTML=`<div style="display:flex;justify-content:space-between;"><span>${new Date(r.createdat).toLocaleDateString()}</span><span style="color:green">- $${fmt(r.amount)}</span></div>`; ledger.appendChild(row); });
    const debtRow=document.createElement('div'); debtRow.innerHTML = `<div style="display:flex;justify-content:space-between;"><span>current debt</span><span style="color:red">$${fmt(data.debt||0)}</span></div>`; ledger.prepend(debtRow);

    // progress bar "Money Spent" = sum(relapse amounts) / debt
    const cap = Number(data.debt||1);
    const pct = cap>0 ? Math.min(100, (totalSpent/cap)*100) : 0;
    const fill = document.getElementById('debtFill');
    if(fill){ fill.style.width = pct + '%'; fill.innerText = 'Money Spent: '+Math.round(pct)+'%'; }
  }catch(e){ console.error(e); showModal('error loading account'); }
}

// Wheel implementation: draw wheel with labels and pointer on side
function drawWheel(sectors){
  const canvas=document.getElementById('wheel'); const ctx=canvas.getContext('2d');
  const w=canvas.width, h=canvas.height; const cx=w/2, cy=h/2, r=Math.min(w,h)/2-8;
  ctx.clearRect(0,0,w,h);
  const arc = Math.PI*2 / sectors.length;
  sectors.forEach((s,i)=>{
    const start = -Math.PI/2 + i*arc;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,start,start+arc); ctx.closePath();
    ctx.fillStyle = i%2===0 ? '#ff8ab8' : '#ff2a80'; ctx.fill();
    // text
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(start+arc/2); ctx.textAlign='right'; ctx.fillStyle='#fff'; ctx.font='14px sans-serif'; ctx.fillText(s.label, r-10, 0); ctx.restore();
  });
}
let wheelSpinning=false;
async function spinWheel(){
  if(wheelSpinning){ return; }
  const res = await fetch('/.netlify/functions/getUser?code='+encodeURIComponent(userCode));
  if(!res.ok){ showModal('cannot spin'); return; }
  const data = await res.json();
  const last = data.lastspin ? new Date(data.lastspin) : null;
  if(last && (Date.now() - last.getTime()) < 24*3600*1000){ document.getElementById('wheelMsg').innerText='spin not available'; return; }

  const sectors = [
    {label:'add $5', change:5},
    {label:'add $20', change:20},
    {label:'double debt', change:'double'},
    {label:'sub $10', change:-10},
    {label:'sub $50', change:-50},
    {label:'clear all', change:'clear'}
  ];
  drawWheel(sectors);
  wheelSpinning=true;
  const pool=[];
  sectors.forEach(s=>{ const w = s.change==='double'?6:(s.change==='clear'?0:1); for(let i=0;i<w;i++) pool.push(s); });
  const pick = pool[Math.floor(Math.random()*pool.length)];
  setTimeout(async ()=>{
    document.getElementById('wheelMsg').innerText='result: '+pick.label;
    if(pick.change==='double'){
      const current = Number((await (await fetch('/.netlify/functions/getUser?code='+encodeURIComponent(userCode))).then(r=>r.json())).debt||0);
      await fetch('/.netlify/functions/updateDebt',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({ code:userCode, newDebtChange: current })});
    } else if(pick.change==='clear'){
    } else {
      await fetch('/.netlify/functions/updateDebt',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({ code:userCode, newDebtChange: pick.change })});
    }
    await fetch('/.netlify/functions/setLastSpin',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({ code:userCode })});
    wheelSpinning=false;
    loadAccount();
  }, 1800);
}

// relapse functions
function addRelapseRow(){
  const c = document.getElementById('relapseForm');
  const row = document.createElement('div'); row.className='relapse-row';
  row.innerHTML = '<input class="r-note" placeholder="confession" style="width:60%"><input class="r-amt" placeholder="$ amount" style="width:20%"><select class="r-platform" style="width:18%"><option value="">platform</option><option value="CashApp">CashApp</option><option value="Throne">Throne</option></select>';
  c.appendChild(row);
  updateSubmitState();
}
function updateSubmitState(){
  const rows = document.querySelectorAll('.relapse-row');
  let ok=false;
  rows.forEach(r=>{ const note=r.querySelector('.r-note').value.trim(); const amt=parseFloat(r.querySelector('.r-amt').value)||0; const plat=r.querySelector('.r-platform').value; if(note && amt>0 && plat) ok=true; });
  document.getElementById('submitRelapseBtn').disabled = !ok;
}
async function submitRelapse(){
  const rows = document.querySelectorAll('.relapse-row');
  const entries=[];
  rows.forEach(r=>{ const note=r.querySelector('.r-note').value.trim(); const amt=parseFloat(r.querySelector('.r-amt').value)||0; const plat=r.querySelector('.r-platform').value; if(note && amt>0 && plat) entries.push({note,amount:amt,platform:plat}); });
  if(entries.length===0) return;
  showModal('Submitting relapse... giggle');
  await fetch('/.netlify/functions/addRelapse',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({ code:userCode, entries })});
  closeModal();
  loadAccount();
}

async function init(){ const sectors=[{label:'add $5'},{label:'add $20'},{label:'double debt'},{label:'sub $10'},{label:'sub $50'},{label:'clear all'}]; drawWheel(sectors); loadAccount(); }
window.addEventListener('load', init);
