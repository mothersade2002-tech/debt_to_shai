// index script: quiz logic, validation, time-penalty, download PDF, nav to account
const { jsPDF } = window.jspdf || {};
let currentCode = null;
let startTime = Date.now();

function generateId(){
  return Math.floor(100000 + Math.random()*900000).toString();
}

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
  }catch(e){
    console.error(e); alert('There was an error saving your data.');
    return;
  }

  // show results
  document.getElementById('questions').style.display = 'none';
  document.getElementById('results').innerHTML = `<p>Your Code: <b>${currentCode}</b></p>
    <p>Your Total Debt: <span class="amount">$${debt.toFixed(2)}</span></p>`;
  const dwn = document.getElementById('downloadPdf');
  dwn.style.display='inline-block';
  // play small cash sound if available
  playSound('assets/cash-register.mp3');
}

function downloadPDF(){
  if(!currentCode) return;
  const doc = new jsPDF({ unit:'pt', format:[400,400] });
  doc.setFontSize(24);
  doc.setTextColor(255,20,147);
  doc.setFont('helvetica','bold');
  doc.text('Debt Slip', 50, 80);
  doc.setFontSize(16); doc.setTextColor(255,255,255);
  doc.text(`Code: ${currentCode}`, 50, 140);
  doc.setFontSize(14); doc.setTextColor(255,20,147);
  doc.text(`You will never escape me, slave.`, 50, 220);
  doc.save(`Debt_Slip_${currentCode}.pdf`);
}

function goToAccount(){
  const code = (document.getElementById('lookupCode')||{}).value||'';
  if(!/^\d{6}$/.test(code)) { alert('Code must be 6 digits'); return; }
  window.location.href = `account.html?id=${code}`;
}

// small audio helper
function playSound(src){
  try{
    const a = new Audio(src);
    a.volume = 0.25;
    a.play().catch(()=>{});
  }catch(e){ }
}
