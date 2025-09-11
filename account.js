function fmt(n){ return Number(n||0).toFixed(2); }

let wheelCooldownHours = 24;

async function loadAccount(){
  const params = new URLSearchParams(window.location.search);
  const code = params.get('id');
  if(!code) return;
  try{
    const res = await fetch(`/.netlify/functions/getUser?code=${code}`);
    if(!res.ok){ document.getElementById('taskBox').innerText='Account not found'; return; }
    const data = await res.json();

    document.getElementById('accountTitle').innerText = `Shai's Submissive: ${code}`;
    const leaderboard = await fetch('/.netlify/functions/getLeaderboard');
    const lb = await leaderboard.json();
    const rank = (lb.findIndex(u => u.code === code) + 1) || '—';
    document.getElementById('rankLine').innerText = rank !== '—' ? `Rank: #${rank}` : 'Rank: unranked';
    document.getElementById('leaderboardFooter').innerHTML = `Your Rank: ${rank === '—' ? 'N/A' : '#'+rank}`;

    document.getElementById('debtAmount').innerText = `$${fmt(data.debt)}`;
    const cap = 2000;
    const pct = Math.min(100, (Number(data.debt||0)/cap)*100);
    const fill = document.getElementById('debtFill');
    fill.style.width = pct + '%';
    fill.style.letterSpacing = Math.max(1, Math.floor(pct/6)) + 'px';
    fill.innerText = 'debt progress';

    if(!data.hastask){
      document.getElementById('taskBox').innerHTML = `<p>Check back for new assignment later, beta.</p>`;
    } else {
      document.getElementById('taskBox').innerHTML = `<p style="font-weight:bold">${data.currenttaskdesc || 'Your task'}</p>
        <p style="opacity:0.9">Reward: $${fmt(data.currenttaskreward||0)}</p>
        <input type="file" id="taskFile" accept="image/*,video/*,audio/*" />
        <div style="margin-top:8px;"><button onclick="submitTask('${code}')">Submit Proof</button></div>`;
    }

    const lastSpin = data.lastspin ? new Date(data.lastspin) : null;
    const now = new Date();
    const spinBtn = document.getElementById('spinBtn');
    const spinTimer = document.getElementById('spinTimer');
    if(lastSpin){
      const diffHours = (now - lastSpin)/ (1000*60*60);
      if(diffHours < wheelCooldownHours){ spinBtn.disabled = true; const remaining = wheelCooldownHours - diffHours; spinTimer.innerText = `Spin available in ${Math.ceil(remaining)} hours`; }
      else { spinBtn.disabled=false; spinTimer.innerText=''; }
    }

    await loadRelapseHistory(code);
    document.getElementById('relapseForm').innerHTML=''; addRelapseRow();

  }catch(err){ console.error(err); document.getElementById('taskBox').innerText='Error loading account'; }
}

async function submitTask(code){
  const input = document.getElementById('taskFile'); if(!input || !input.files || input.files.length===0){ alert('Attach proof first'); return; }
  const f = input.files[0]; if(f.size > 100*1024*1024){ alert('File too large'); return; }
  try{ const res = await fetch('/.netlify/functions/submitTask', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ code, proof_filename:f.name, proof_size:f.size })}); const body = await res.json(); if(res.ok){ document.getElementById('cashAudio').play(); alert('Task submitted.'); loadAccount(); } else alert(body.error||'Error'); }catch(e){ console.error(e); alert('Error'); }
}

async function spinWheel(){
  const sectors = [
    {label:'add $5', change:5, weight:1},
    {label:'add $20', change:20, weight:1},
    {label:'double debt', change:'double', weight:5},
    {label:'subtract $10', change:-10, weight:1},
    {label:'subtract $50', change:-50, weight:1},
    {label:'clear all debt', change:'clear', weight:0}
  ];
  const pool = [];
  sectors.forEach((s,i)=>{ for(let k=0;k<s.weight;k++) pool.push({...s, idx:i}); });
  const pick = pool[Math.floor(Math.random()*pool.length)];
  const wheel = document.getElementById('wheel'); const deg = 360*6 + Math.floor(Math.random()*360);
  wheel.style.transition='transform 3s cubic-bezier(.2,.9,.2,1)'; wheel.style.transform=`rotate(${deg}deg)`;
  setTimeout(async ()=>{
    document.getElementById('wheelResult').innerText = `Result: ${pick.label}`;
    const params = new URLSearchParams(window.location.search); const code = params.get('id'); if(!code) return;
    if(pick.change === 'double'){
      await fetch('/.netlify/functions/updateDebt',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({ code, newDebtChange: (await getDebt(code)) })});
      document.getElementById('whipAudio').play(); alert('Your debt has been doubled.'); 
    } else if(pick.change === 'clear'){
      alert('Lucky? Not possible. Nothing happened.');
    } else {
      await fetch('/.netlify/functions/updateDebt',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({ code, newDebtChange: pick.change })});
      document.getElementById('whipAudio').play(); alert(`Wheel outcome: ${pick.label}`);
    }
    await fetch('/.netlify/functions/setLastSpin',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({ code })});
    loadAccount(); setTimeout(()=>{ wheel.style.transition='none'; wheel.style.transform='rotate(0deg)'; },3500);
  },3100);
}

async function getDebt(code){ const r = await fetch(`/.netlify/functions/getUser?code=${code}`); const d = await r.json(); return Number(d.debt||0); }

function addRelapseRow(){ const c = document.getElementById('relapseForm'); const row = document.createElement('div'); row.className='relapse-row'; row.innerHTML = `<textarea placeholder="Confess..."></textarea><input type="number" placeholder="$ amount" /><select><option value="">Platform</option><option value="CashApp">CashApp</option><option value="Throne">Throne</option></select>`; c.appendChild(row); }
async function submitRelapse(){ const params = new URLSearchParams(window.location.search); const code = params.get('id'); if(!code) return; const rows = document.querySelectorAll('#relapseForm .relapse-row'); const entries=[]; rows.forEach(r=>{ const note=(r.querySelector('textarea')||{}).value.trim(); const amount=parseFloat((r.querySelector('input')||{}).value)||0; const platform=(r.querySelector('select')||{}).value||''; if(note && amount>0 && platform) entries.push({note,amount,platform}); }); if(entries.length===0) return alert('Add at least one valid entry'); document.getElementById('giggleAudio').play(); setTimeout(async ()=>{ await fetch('/.netlify/functions/addRelapse',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({ code, entries })}); document.getElementById('cashAudio').play(); alert('Relapse submitted.'); loadAccount(); },700); }

async function loadRelapseHistory(code){ try{ const res = await fetch(`/.netlify/functions/getRelapse?code=${code}`); const data = await res.json(); const cont = document.getElementById('relapseHistory'); if(res.ok && Array.isArray(data) && data.length>0){ cont.innerHTML = data.map(e=>`<div class="relapse-entry"><p><b>${new Date(e.createdat).toLocaleString()}</b> — ${e.platform}</p><p>${e.note}</p><p style="color:red">-$${fmt(e.amount)}</p></div>`).join(''); } else cont.innerHTML='<p>No relapse history yet.</p>'; }catch(e){ console.error(e); document.getElementById('relapseHistory').innerText='Error'; } }

loadAccount();
