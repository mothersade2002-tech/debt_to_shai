// account.js
function fmt(n){ return Number(n||0).toFixed(2); }

const truthQuestions = [
  "What’s the most humiliating thing you’ve ever done for a woman?",
  "If I commanded you to drain your wallet now, how much would you send?",
  "Would you lick the floor clean just to please me? Explain.",
  "What’s your most pathetic secret?",
  "Why do you deserve more debt?"
];

const prompts = [
  "Confess how worthless you felt today.",
  "Write a letter begging for mercy from Shai.",
  "Describe the last time you embarrassed yourself financially.",
  "Why are you addicted to serving me?",
  "Write 5 sentences explaining why you’re unworthy."
];

let currentTruth = '';

async function loadAccount(){
  const params = new URLSearchParams(window.location.search);
  const code = params.get('id');
  if(!code){ document.getElementById('accountTitle').innerText='Invalid Account'; return; }

  try{
    const res = await fetch(`/.netlify/functions/getUser?code=${code}`);
    const data = await res.json();
    if(!res.ok){ document.getElementById('taskBox').innerText='Account not found'; return; }

    document.getElementById('accountTitle').innerText = `Shai's Submissive: ${code}`;
    document.getElementById('debt').innerText = `Debt to Shai: $${fmt(data.debt)}`;

    // debt bar: fill based on arbitrary cap for visual effect (cap at 2000)
    const cap = 2000;
    const pct = Math.min(100, (Number(data.debt||0)/cap)*100);
    document.getElementById('debtFill').style.width = pct + '%';
    if(data.debt > 2000) document.body.classList.add('screen-distort');

    // tasks
    if(data.hastask && data.currenttaskdesc){
      document.getElementById('taskBox').innerHTML = `
        <p style="font-weight:bold; margin-bottom:8px;">${data.currenttaskdesc}</p>
        <p style="opacity:0.9">Reward on completion: $${fmt(data.currenttaskreward||0)}</p>
        <input type="file" id="taskFile" accept="image/*,video/*,audio/*" />
        <div style="margin-top:8px;"><button onclick="submitTask('${code}')">Submit Proof</button></div>
      `;
    } else {
      document.getElementById('taskBox').innerHTML = `<p>Check back for new assignment later, beta.</p>`;
    }

    // truth & prompt
    currentTruth = truthQuestions[Math.floor(Math.random()*truthQuestions.length)];
    document.getElementById('truthQuestion').innerText = currentTruth;
    document.getElementById('dailyPrompt').innerText = prompts[Math.floor(Math.random()*prompts.length)];

    // relapse history + form
    await loadRelapseHistory(code);
    document.getElementById('relapseForm').innerHTML = ''; addRelapseRow();

  }catch(err){
    console.error(err); document.getElementById('taskBox').innerText='Error loading account';
  }
}

async function submitTask(code){
  const input = document.getElementById('taskFile');
  if(!input || !input.files || input.files.length===0){ alert('Attach proof first'); return; }
  const f = input.files[0];
  if(f.size > 100*1024*1024){ alert('File too large (>100MB)'); return; }

  try{
    const payload = { code, proof_filename: f.name, proof_size: f.size };
    const res = await fetch('/.netlify/functions/submitTask', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
    });
    const body = await res.json();
    if(res.ok){ playSound('assets/cash-register.mp3'); alert('Task submitted.'); loadAccount(); }
    else alert(body.error||'Error');
  }catch(e){ console.error(e); alert('Error'); }
}

// Wheel: visual spin + call updateDebt endpoint with change
async function spinWheel(){
  const wheel = document.getElementById('wheel');
  // spin animation: random degrees
  const deg = 360*6 + Math.floor(Math.random()*360);
  wheel.style.transition = 'transform 3s cubic-bezier(.2,.9,.2,1)';
  wheel.style.transform = `rotate(${deg}deg)`;
  // compute outcome based on deg % 360
  const sector = deg % 360;
  // arbitrary sectors
  const outcomes = [
    { text:'Add $5', change:5 },
    { text:'Add $20', change:20 },
    { text:'Lose $10', change:-10 },
    { text:'Add $50', change:50 },
    { text:'Add $1', change:1 }
  ];
  // pick index by dividing circle into equal parts
  const idx = Math.floor((sector/360) * outcomes.length) % outcomes.length;
  const result = outcomes[idx];

  // show after spin
  setTimeout(async ()=>{
    document.getElementById('wheelResult').innerText = result.text;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('id');
    if(!code) return;
    await fetch('/.netlify/functions/updateDebt', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ code, newDebtChange: result.change })
    });
    playSound(result.change>0 ? 'assets/whip-crack.mp3' : 'assets/cash-register.mp3');
    loadAccount();
    // reset wheel transform after small delay
    setTimeout(()=>{ wheel.style.transition='none'; wheel.style.transform='rotate(0deg)'; }, 3500);
  }, 3100);
}

// Truth or Debt
async function submitTruth(){
  const ans = (document.getElementById('truthAnswer') || {}).value || '';
  if(ans.trim().length < 10){
    // penalty
    alert('Pathetic answer. Penalty applied.');
    const params = new URLSearchParams(window.location.search);
    const code = params.get('id');
    await fetch('/.netlify/functions/updateDebt', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ code, newDebtChange: 10 })
    });
    playSound('assets/whip-crack.mp3'); loadAccount();
  } else {
    alert('Confession accepted.');
  }
}

// prompt
function submitPrompt(){ const t = (document.getElementById('promptAnswer')||{}).value||''; if(!t.trim()) return alert('Write something'); alert('Prompt saved.'); }

// relapse logic
function addRelapseRow(){
  const c = document.getElementById('relapseForm');
  const row = document.createElement('div'); row.className='relapse-row';
  row.innerHTML = `<textarea placeholder="Confess..."></textarea><input type="number" placeholder="$ amount" /><select><option value="">Platform</option><option value="CashApp">CashApp</option><option value="Throne">Throne</option></select>`;
  c.appendChild(row);
}

async function submitRelapse(){
  const params = new URLSearchParams(window.location.search);
  const code = params.get('id');
  if(!code) return;
  const rows = document.querySelectorAll('#relapseForm .relapse-row');
  const entries = [];
  rows.forEach(r=>{
    const note = (r.querySelector('textarea')||{}).value.trim();
    const amount = parseFloat((r.querySelector('input')||{}).value)||0;
    const platform = (r.querySelector('select')||{}).value||'';
    if(note && amount>0 && platform) entries.push({note, amount, platform});
  });
  if(entries.length===0) { alert('Add at least one valid entry'); return; }
  const res = await fetch('/.netlify/functions/addRelapse', {
    method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ code, entries })
  });
  if(res.ok){ playSound('assets/cash-register.mp3'); alert('Relapse saved.'); loadAccount(); } else { alert('Error saving relapse'); }
}

async function loadRelapseHistory(code){
  try{
    const res = await fetch(`/.netlify/functions/getRelapse?code=${code}`);
    const data = await res.json();
    const cont = document.getElementById('relapseHistory');
    if(res.ok && Array.isArray(data) && data.length>0){
      cont.innerHTML = data.map(e => `<div class="relapse-entry"><p><b>${new Date(e.createdat).toLocaleString()}</b> — ${e.platform}</p><p>${e.note}</p><p style="color:red;">-$${fmt(e.amount)}</p></div>`).join('');
    } else cont.innerHTML = '<p>No relapse history yet, beta.</p>';
  }catch(e){ console.error(e); document.getElementById('relapseHistory').innerText='Error'; }
}

function playSound(src){ try{ const a=new Audio(src); a.volume=0.35; a.play().catch(()=>{});}catch(e){} }

// run
loadAccount();
