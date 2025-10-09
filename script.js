if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(() => console.log("Service Worker Registered"))
      .catch(err => console.log("SW reg failed: ", err));
  });
}


// ====== HOME PAGE ======
function testBeep() {
  const audio = new Audio('beep.mp4');
  audio.play().catch(() => alert('⚠️ กรุณาเปิดเสียงโทรศัพท์'));
}
function testVibrate() {
  if (navigator.vibrate) navigator.vibrate(600);
  else alert('❌ อุปกรณ์นี้ไม่รองรับการสั่น');
}

document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  if (startBtn) startBtn.onclick = startScenario1;

  const respondBtn = document.getElementById('respondBtn');
  if (respondBtn) respondBtn.onclick = recordResponse;

  const downloadBtn = document.getElementById('downloadBtn');
  if (downloadBtn) downloadBtn.onclick = downloadCSV;

  // ถ้าอยู่ใน scenario page → เริ่มรัน
  if (document.getElementById('ledBox')) runTrial();
});

// ฟังก์ชันทดสอบเสียง
function testBeep() {
  // สร้างอ็อบเจกต์เสียงจากไฟล์ beep.mp4
  const audio = new Audio("beep.mp4");
  audio.play()
    .then(() => console.log("Beep sound playing..."))
    .catch(err => {
      console.warn("ไม่สามารถเล่นเสียงได้:", err);
      alert("⚠️ กรุณาแตะหน้าจอก่อน แล้วกดปุ่มอีกครั้ง เพื่ออนุญาตให้เล่นเสียง");
    });
}


function startScenario1() {
  const pid = document.getElementById('pid').value.trim();
  const order = document.getElementById('latinOrder').value;
  if (!pid) return alert('กรุณากรอก Participant ID');
  localStorage.setItem('pid', pid);
  localStorage.setItem('order', order);
  window.location.href = 'scenario1.html';
}

// ====== SCENARIO PAGE ======
let trials = []; // เก็บผลแต่ละ trial
let currentTrial = 0; // นับรอบการทดลอง
const totalTrials = 20; // รอบทั้งหมดต่อ condition
let startTime = 0; // เวลาเริ่ม stimulus
const conditions = ['LED', 'Beep', 'Vibrate', 'None'];
let condition = conditions[0]; // เริ่มจาก LED ก่อน

async function runTrial() {
  const fix = document.getElementById('fixation'); // จุดโฟกัส (fixation cross) แสดงเครื่องหมาย +
  const box = document.getElementById('ledBox');
  const condLabel = document.getElementById('condLabel'); // สถานะการทดลอง (condition)
  const trialLabel = document.getElementById('trialLabel'); // ป้ายบอกลำดับ trial
  const feedback = document.getElementById('feedback'); // พื้นที่แสดงฟีดแบ็กหลังตอบ
  
  // อัปเดตข้อความส่วนหัวให้ตรงกับสถานะปัจจุบัน
  condLabel.textContent = `Condition: ${condition}`;
  trialLabel.textContent = `Trial ${currentTrial + 1} / ${totalTrials}`;
  feedback.textContent = '';
  
  // ตั้งค่าหน้าจอก่อนเริ่มไตรอัล
  fix.textContent = '+'; // แสดงเครื่องหมาย + เป็นสัญลักษณ์ให้เพ่ง (fixation)
  box.style.background = #AEEFFF; // พื้นหลัง stimulus เป็นสีดำ (ยังไม่แสดงสิ่งเร้า)

  // — Phase 1: Fixation —
  // หน่วงเวลาแบบสุ่ม 500–800 ms ให้ผู้เข้าร่วมเพ่งไปที่จุดโฟกัส + เพื่อควบคุมสายตา/ความพร้อม
  await delay(rand(500, 800)); // Fixation
  fix.textContent = '';

  // — Phase 2: Foreperiod —
  // หน่วงเวลานำ (foreperiod) แบบสุ่ม 500–1500 ms เพื่อลดการเดาเวลา (anticipation)
  await delay(rand(500, 1500)); // Foreperiod

 // — Phase 3: Stimulus ON —
  // บันทึกเวลาที่เริ่มแสดงสิ่งเร้าด้วย high-resolution timer (หน่วย ms ลอยตัว)
  startTime = performance.now();
  showStimulus(condition);
  await delay(700);
  clearStimulus();

 // — Phase 4: Response Window —
  // รอผู้ใช้ตอบภายใน 2.5s
  await delay(2500);
  if (!trials[currentTrial]) {
    trials.push({
      pid: localStorage.getItem('pid'),
      condition,
      trial: currentTrial + 1,
      rt_sec: 'N/A',
      correct: 0
    });
    currentTrial++;
    if (currentTrial < totalTrials) {
      await delay(rand(2000, 4000)); // ITI
      runTrial();
    } else finishCondition();
  }
}

function showStimulus(type) {
  const box = document.getElementById('ledBox');
  if (type === 'LED') box.classList.add('blinking');
  if (type === 'Beep') new Audio('beep.mp3').play();
  if (type === 'Vibrate') navigator.vibrate(700);
}
function clearStimulus() {
  document.getElementById('ledBox').classList.remove('blinking');
}
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand(min, max) { return Math.random() * (max - min) + min; }

function recordResponse() {
  const rt = (performance.now() - startTime) / 1000;
  if (rt < 0.15) return; // เร็วผิดปกติ

  trials.push({
    pid: localStorage.getItem('pid'),
    condition,
    trial: currentTrial + 1,
    rt_sec: rt.toFixed(3),
    correct: 1
  });

  document.getElementById('feedback').textContent = `RT: ${rt.toFixed(3)}s`;
  currentTrial++;

  if (currentTrial < totalTrials) {
    delay(rand(2000, 4000)).then(runTrial);
  } else {
    finishCondition();
  }
}

function finishCondition() {
  localStorage.setItem('trialData', JSON.stringify(trials));
  window.location.href = 'summary.html';
}

// ====== SUMMARY PAGE ======
function downloadCSV() {
  const data = JSON.parse(localStorage.getItem('trialData'));
  const rows = ['pid,condition,trial,rt_sec,correct',
    ...data.map(d => `${d.pid},${d.condition},${d.trial},${d.rt_sec},${d.correct}`)
  ].join('\n');
  const blob = new Blob([rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'scenario1_results.csv';
  a.click();
}

function restart() {
  localStorage.clear();
  window.location.href = 'index.html';
}
