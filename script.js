const { jsPDF } = window.jspdf;
let currentCode = null;
let startTime = Date.now();
const humiliatingTasks = [
  "Write 'I AM SHAI'S TOY' 100 times on paper and upload proof.",
  "Go outside wearing something pink, take a selfie, upload it.",
  "Record yourself begging for mercy while holding a sign with your debt.",
  "Draw Shai’s name on your body in lipstick, take a picture, upload it."
];


// Generate a 6-digit submissive ID
function generateId() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function nextQuestion(currentId, nextId, inputId) {
  const input = document.getElementById(inputId);
  if (!input.value || input.value.trim() === '') {
    alert('You must fill out this field before continuing.');
    return;
  }
  document.getElementById(currentId).classList.remove('active');
  document.getElementById(nextId).classList.add('active');
}

async function finishQuiz() {
  const height = parseFloat(document.getElementById('height').value) || 0;
  const weight = parseFloat(document.getElementById('weight').value) || 0;
  const money = parseFloat(document.getElementById('money').value) || 0;
  const debt = height + weight + money;

  currentCode = generateId(); // 6-digit ID
  const createdAt = new Date().toISOString();

  try {
    const res = await fetch('/.netlify/functions/saveUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ height, weight, money, code: currentCode, createdAt })
    });
    if (!res.ok) throw new Error('Failed to save');
  } catch (err) {
    console.error(err);
    alert('There was an error saving your data.');
  }

  document.getElementById('questions').style.display = 'none';
  document.getElementById('results').innerHTML = `
    <p>Your Code: <b>${currentCode}</b></p>
    <p>Your Total Debt: <span class="amount">$${debt.toFixed(2)}</span></p>
  `;
  document.getElementById('downloadPdf').style.display = 'block';
}

function downloadPDF() {
  if (!currentCode) return;
  const doc = new jsPDF({ unit: 'pt', format: [400, 400] });
  doc.setFontSize(24);
  doc.setTextColor(255, 20, 147);
  doc.setFont('helvetica', 'bold');
  doc.text('Debt Slip', 50, 80);

  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(`Code: ${currentCode}`, 50, 140);

  doc.setFontSize(14);
  doc.setTextColor(255, 20, 147);
  doc.text(`You will never escape me, slave.`, 50, 220);

  doc.save(`Debt_Slip_${currentCode}.pdf`);
}

function goToAccount() {
  const code = document.getElementById('lookupCode').value.trim();
  if (!code) return alert("Enter a code!");
  window.location.href = `account.html?id=${code}`;
}

async function finishQuiz() {
  const height = parseFloat(document.getElementById('height').value) || 0;
  const weight = parseFloat(document.getElementById('weight').value) || 0;
  const money = parseFloat(document.getElementById('money').value) || 0;
  const email = document.getElementById('email').value.trim();

  // Base debt
  let debt = height + weight + money;

  // Add penalty: faster = higher debt
  const duration = (Date.now() - startTime) / 1000; // seconds
  const speedFactor = Math.max(1, 300 / duration);  // finishing < 5min = penalty
  debt = debt * speedFactor;

  currentCode = generateId();
  const createdAt = new Date().toISOString();

  try {
    const res = await fetch('/.netlify/functions/saveUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ height, weight, money, email, code: currentCode, createdAt, debt })
    });
    if (!res.ok) throw new Error('Failed to save');
  } catch (err) {
    console.error(err);
    alert('There was an error saving your data.');
  }

  document.getElementById('questions').style.display = 'none';
  document.getElementById('results').innerHTML = `
    <p>Your Code: <b>${currentCode}</b></p>
    <p>Your Total Debt: <span class="amount">$${debt.toFixed(2)}</span></p>
  `;
  document.getElementById('downloadPdf').style.display = 'block';

}

function assignTask(account) {
  if (!account.hasTask) {
    const task = humiliatingTasks[Math.floor(Math.random() * humiliatingTasks.length)];
    return { task, hasTask: true };
  }
  return { task: account.currenttask, hasTask: true };
}

async function loadAccount() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("id");
  if (!code) return;

  const res = await fetch(`/.netlify/functions/getUser?code=${code}`);
  const data = await res.json();

  if (res.ok) {
    document.getElementById("accountTitle").innerText = `Shai's Submissive: ${code}`;
    document.getElementById("debt").innerHTML = `In Debt to Shai: <span class="amount">$${data.debt.toFixed(2)}</span>`;
    document.getElementById("created").innerText = `Account Created: ${new Date(data.createdat).toLocaleString()}`;

    // Assign or show task
    let taskInfo = assignTask(data);
    document.getElementById("taskBox").innerHTML = `
      <p>${taskInfo.task || "Check back for new assignment later, beta."}</p>
      ${taskInfo.hasTask ? `
        <input type="file" id="taskFile" accept="image/*,video/*" style="margin-top:10px;">
        <button onclick="submitTask()">Submit Task</button>
      ` : ""}
    `;

    // Relapse diary
    document.getElementById("taskBox").innerHTML += `
      <h3>Relapse Diary</h3>
      <textarea id="relapseNote" placeholder="Confess what you spent..."></textarea>
      <input id="relapseAmount" type="number" placeholder="$ amount sent">
      <button onclick="submitRelapse(${data.debt}, '${code}')">Submit Relapse</button>
    `;
  }
}

function submitTask() {
  const file = document.getElementById("taskFile").files[0];
  if (!file) {
    alert("You must upload proof to complete this task!");
    return;
  }
  alert("Task submitted for review (not actually uploaded).");
}

async function submitRelapse(currentDebt, code) {
  const note = document.getElementById("relapseNote").value.trim();
  const amount = parseFloat(document.getElementById("relapseAmount").value) || 0;

  if (!amount) return alert("Enter an amount.");

  const newDebt = currentDebt - amount;

  await fetch('/.netlify/functions/updateDebt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, newDebt })
  });

  alert("Relapse noted. Your debt has been updated.");
  location.reload();
}

loadAccount();
