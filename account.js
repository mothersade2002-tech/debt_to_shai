const whipSound = new Audio('assets/whip.mp3');
whipSound.load();
const laughSound = new Audio('assets/laugh.mp3');
laughSound.load();
const cashSound = new Audio('assets/cash.mp3');
cashSound.load();

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

    const tRes=await fetch('/.netlify/functions/getTasks?code='+encodeURIComponent(userCode));
    const container=document.getElementById('tasksList');
    if(!tRes.ok){ container.innerHTML='<p>Error loading tasks</p>'; } else {
      const tasks = await tRes.json();
      if(tasks.length===0) container.innerHTML='<p>No tasks</p>';
      else{
        container.innerHTML='';
        tasks.forEach(t=>{
          const div=document.createElement('div'); div.className='task-entry';
          let actionHtml = '';
          if(t.task_name.toLowerCase().includes('apply')){
            actionHtml = '<a href="https://form.jotform.com/252181588755064" target="_blank">apply to serve</a>';
          } else if(t.task_name.toLowerCase().includes('tribute')){
            actionHtml = '<a href="https://cash.app/$Solangeloves" target="_blank">send tribute</a>';
          } else { actionHtml = '<span></span>'; }
          actionHtml += ' <button onclick="completeTask('+t.id+')">mark complete</button>';
          div.innerHTML = `<div><b>${t.task_name}</b><div style="opacity:0.8">Assigned: ${new Date(t.createdat).toLocaleString()}</div></div><div>${actionHtml}</div>`;
          container.appendChild(div);
        });
      }
    }

    const rRes=await fetch('/.netlify/functions/getRelapse?code='+encodeURIComponent(userCode));
    const rData = rRes.ok ? await rRes.json() : [];
    const hist=document.getElementById('relapseHistory'); hist.innerHTML='';
    let totalSpent = 0;
    rData.forEach(r=>{ const d=document.createElement('div'); d.innerHTML=`<p><b>${new Date(r.createdat).toLocaleString()}</b> - ${r.platform} - $${fmt(r.amount)}</p><p>${r.note}</p><hr>`; hist.appendChild(d); totalSpent += Number(r.amount||0); });

    const ledger=document.getElementById('ledgerInner'); ledger.innerHTML='';
    rData.forEach(r=>{ const row=document.createElement('div'); row.innerHTML=`<div style="display:flex;justify-content:space-between;"><span>${new Date(r.createdat).toLocaleDateString()}</span><span style="color:green">- $${fmt(r.amount)}</span></div>`; ledger.appendChild(row); });
    const debtRow=document.createElement('div'); debtRow.innerHTML = `<div style="display:flex;justify-content:space-between;"><span>current debt</span><span style="color:red">$${fmt(data.debt||0)}</span></div>`; ledger.prepend(debtRow);

    const cap = Number(data.debt||1);
    const pct = cap>0 ? Math.min(100, (totalSpent/cap)*100) : 0;
    const fill = document.getElementById('debtFill');
    if(fill){ fill.style.width = pct + '%'; fill.innerText = 'Money Spent: '+Math.round(pct)+'%'; }
  }catch(e){ console.error(e); showModal('error loading account'); }
}

async function completeTask(taskId) {
    try {
        const resp = await fetch('/.netlify/functions/submitTask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: localStorage.getItem('subCode'), taskId })
        }).then(r => r.json());

        if (resp.success) {
            // Play whip sound
            whipSound.currentTime = 0;
            whipSound.play();

            alert("Task completed!");
            loadTasks();
        }
    } catch (err) {
        console.error("Error completing task:", err);
    }
}

async function spinWheel() {
    const canvas = document.getElementById("wheelCanvas");
    const ctx = canvas.getContext("2d");

    const slices = [
        { label: "-$10", value: -10 },
        { label: "-$20", value: -20 },
        { label: "Double Debt", value: "double" },
        { label: "-$50", value: -50 },
        { label: "-$100", value: -100 },
        { label: "+$200", value: 200 }
    ];

    const sliceAngle = (2 * Math.PI) / slices.length;

    let spinAngle = Math.random() * 2 * Math.PI;
    let spinVelocity = 0.3 + Math.random() * 0.2;

    function drawWheel(angle) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        slices.forEach((slice, i) => {
            ctx.beginPath();
            ctx.moveTo(200, 200);
            ctx.arc(200, 200, 200, angle + i * sliceAngle, angle + (i + 1) * sliceAngle);
            ctx.fillStyle = i % 2 === 0 ? "#ff9999" : "#ff6666";
            ctx.fill();

            ctx.save();
            ctx.translate(200, 200);
            ctx.rotate(angle + (i + 0.5) * sliceAngle);
            ctx.textAlign = "right";
            ctx.fillStyle = "black";
            ctx.font = "16px Arial";
            ctx.fillText(slice.label, 180, 10);
            ctx.restore();
        });

        // pointer triangle
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.moveTo(400, 200);
        ctx.lineTo(420, 190);
        ctx.lineTo(420, 210);
        ctx.closePath();
        ctx.fill();
    }

    function animateSpin() {
        spinAngle += spinVelocity;
        spinVelocity *= 0.97;

        drawWheel(spinAngle);

        if (spinVelocity > 0.01) {
            requestAnimationFrame(animateSpin);
        } else {
            const winningIndex = Math.floor(((2 * Math.PI - spinAngle % (2 * Math.PI)) / sliceAngle) % slices.length);
            const winningSlice = slices[winningIndex];

            let change = 0;
            if (winningSlice.value === "double") {
                change = document.getElementById("totalDebt").innerText.replace(/\D/g, "") * 1;
            } else {
                change = winningSlice.value;
            }

            // Update debt on server
            fetch('/.netlify/functions/updateDebt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: localStorage.getItem('subCode'), newDebtChange: change })
            })
            .then(r => r.json())
            .then(resp => {
                if (resp.debt !== undefined) {
                    document.getElementById("totalDebt").innerText = `$${resp.debt}`;

                    // Play cash sound
                    cashSound.currentTime = 0;
                    cashSound.play();
                }
            })
            .catch(err => console.error("Error updating debt:", err));
        }
    }

    animateSpin();
}


// relapse
function addRelapseRow(){
  const c = document.getElementById('relapseForm');
  const row = document.createElement('div'); row.className='relapse-row'; row.style.display='flex'; row.style.gap='8px'; row.innerHTML = '<input class="r-note" placeholder="confession" style="flex:1"><input class="r-amt" placeholder="$ amount" style="width:120px"><select class="r-platform" style="width:160px"><option value="">platform</option><option value="CashApp">CashApp</option><option value="Throne">Throne</option></select>';
  c.appendChild(row); row.querySelectorAll('input,select').forEach(el=>el.addEventListener('input', updateSubmitState)); updateSubmitState();
}
function updateSubmitState(){ const rows = document.querySelectorAll('.relapse-row'); let ok=false; rows.forEach(r=>{ const note=r.querySelector('.r-note').value.trim(); const amt=parseFloat(r.querySelector('.r-amt').value)||0; const plat=r.querySelector('.r-platform').value; if(note && amt>0 && plat) ok=true; }); document.getElementById('submitRelapseBtn').disabled = !ok; }
async function submitRelapse(){ const rows = document.querySelectorAll('.relapse-row'); const entries=[]; rows.forEach(r=>{ const note=r.querySelector('.r-note').value.trim(); const amt=parseFloat(r.querySelector('.r-amt').value)||0; const plat=r.querySelector('.r-platform').value; if(note && amt>0 && plat) entries.push({note,amount:amt,platform:plat}); }); if(entries.length===0) return; showModal('Submitting relapse...'); await fetch('/.netlify/functions/addRelapse',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({ code:userCode, entries })}); closeModal(); loadAccount(); }

// Example: Submit Relapse
async function submitRelapse(note, amount, platform) {
    try {
        const resp = await fetch('/.netlify/functions/addRelapse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: localStorage.getItem('subCode'), entries: [{ note, amount, platform }] })
        }).then(r => r.json());

        if (resp.success) {
            // Play laugh sound
            laughSound.currentTime = 0;
            laughSound.play();

            alert("Relapse submitted!");
            loadRelapses();
        }
    } catch (err) {
        console.error("Error submitting relapse:", err);
    }
}

window.addEventListener('load', loadAccount);
