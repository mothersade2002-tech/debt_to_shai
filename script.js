// index script: sign-in flow requires forced phrase and checks email+code via getUser
const { jsPDF } = window.jspdf || {};
let currentCode = null;
let startTime = Date.now();

function generateId(){ return Math.floor(100000 + Math.random()*900000).toString(); }

function nextQuestion(currentId, nextId, inputId){
  if(inputId){
    const input = document.getElementById(inputId);
    if(!input || input.value === '' || (typeof input.value === 'string' && input.value.trim()==='')){
      alert('You must fill out this field before continuing.');
      return;
    }
  }
  document.getElementById(currentId).classList.remove('active');
  document.getElementById(nextId).classList.add('active');
}

async function finishQuiz(){
  const height = parseFloat(document.getElementById('height').value) || 0;
  const weight = parseFloat(document.getElementById('weight').value) || 0;
  const money = parseFloat(document.getElementById('money').value) || 0;
  const email = (document.getElementById('email')||{}).value || '';

  let debt = height + weight + money;
  const duration = (Date.now() - startTime)/1000;
  const speedFactor = Math.max(1, 300/Math.max(1,duration));
  debt = debt * speedFactor;

  currentCode = generateId();
  const createdAt = new Date().toISOString();

  try{
    const res = await fetch('/.netlify/functions/saveUser', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ height, weight, money, email, code:currentCode, createdAt, debt })
    });
    if(!res.ok){
      const txt = await res.text(); throw new Error(txt || 'Save failed');
    }
  }catch(e){ console.error(e); alert('There was an error saving your data.'); return; }

  document.getElementById('questions').style.display = 'none';
  document.getElementById('results').innerHTML = `<p>Your Code: <b>${currentCode}</b></p>
    <p>Your Total Debt: <span class="amount">$${debt.toFixed(2)}</span></p>`;
  const dwn = document.getElementById('downloadPdf'); dwn.style.display='inline-block'; playSound('assets/cash-register.mp3');
}

function downloadPDF(){ if(!currentCode) return; const doc = new jsPDF({ unit:'pt', format:[400,400] }); doc.setFontSize(24); doc.setTextColor(255,20,147); doc.setFont('helvetica','bold'); doc.text('Debt Slip', 50, 80); doc.setFontSize(16); doc.setTextColor(255,255,255); doc.text(`Code: ${currentCode}`, 50, 140); doc.setFontSize(14); doc.setTextColor(255,20,147); doc.text(`You will never escape me, slave.`, 50, 220); doc.save(`Debt_Slip_${currentCode}.pdf`); }

async function signIn(){
  const phrase = (document.getElementById('forcedPhrase')||{}).value || ''; const email = (document.getElementById('lookupEmail')||{}).value.trim() || ''; const code = (document.getElementById('lookupCode')||{}).value.trim() || ''; const msg = document.getElementById('signinMessage');

  if(phrase.toLowerCase() !== 'i live to obey shai'){
    msg.innerText = 'Phrase incorrect. $500 penalty applied.';
    if(/^\d{6}$/.test(code)){
      await fetch('/.netlify/functions/updateDebt',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({ code, newDebtChange:500 })});
    }
    return;
  }
  if(!email || !/^\S+@\S+\.\S+$/.test(email)){ msg.innerText='Enter valid email'; return; }
  if(!/^\d{6}$/.test(code)){ msg.innerText='Enter 6-digit code'; return; }

  try{
    const res = await fetch(`/.netlify/functions/getUser?code=${code}`);
    if(!res.ok){ msg.innerText='Account not found'; return; }
    const data = await res.json();
    if((data.email||'').toLowerCase() !== email.toLowerCase()){ msg.innerText='Email does not match account'; return; }
    window.location.href = `account.html?id=${code}`;
  }catch(e){ console.error(e); msg.innerText='Error signing in'; }
}

function playSound(src){ try{ const a = new Audio(src); a.volume = 0.3; a.play().catch(()=>{});}catch(e){} }
