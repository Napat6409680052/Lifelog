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
  const audio = new Audio('beep.mp3');
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
  // สร้างอ็อบเจกต์เสียงจากไฟล์ beep.mp3
  const audio = new Audio("beep.mp3");
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
  box.style.background = 'black'; // พื้นหลัง stimulus เป็นสีดำ (ยังไม่แสดงสิ่งเร้า)

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
  const beepSound = new Audio('beep1t.mp3'); // ใช้เสียง beep1t เฉพาะ condition: Beep

  // รีเซ็ตพื้นหลังทุกครั้งก่อนแสดงสิ่งเร้า
  box.style.background = 'black';

  if (type === 'LED') {
    // ใช้ไฟสีเขียวแทน blink เดิม
    box.style.background = 'lime';
  }

  if (type === 'Beep') {
    // เล่นเสียง beep1t.mp3 1 ครั้ง + สีพื้นฟ้า
    beepSound.currentTime = 0;
    beepSound.play().catch(err => console.warn('ไม่สามารถเล่นเสียงได้:', err));
    box.style.background = 'dodgerblue';
  }

  if (type === 'Vibrate') {
    // สั่น + เปลี่ยนพื้นหลังเป็นสีเหลือง
    if (navigator.vibrate) navigator.vibrate(700);
    box.style.background = '#ffe89a';
  }

  if (type === 'None') {
    // ไม่มีสิ่งเร้า → สีพื้นไม่เปลี่ยน
    box.style.background = 'black';
  }
}


function clearStimulus() {
  const box = document.getElementById('ledBox');
  box.style.background = 'black'; // รีเซ็ตพื้นหลังกลับเป็นสีดำ
}

function showConfidence(isEnd = false) {
  const conf = prompt(
    "คุณมั่นใจแค่ไหนว่ารับรู้ได้ถูกต้อง?\n([1] ไม่มั่นใจเลย – [5] มั่นใจที่สุด)",
    ""
  );

  const confidence = parseInt(conf) || 0;
  data.push({ pid, task: taskName, confidence_1_5: confidence });

  if (isEnd) {
    if (taskIndex === 4) {
      alert("จบ Task 4/4 แล้ว\nคลิกตกลงเพื่อไป Scenario 2");
      saveAndNext();
    } else {
      alert(`จบ Task ${taskIndex}/4 แล้ว\nคลิกตกลงเพื่อทำ Task ถัดไป`);
      saveAndNext();
    }
  } else {
    alert("ขอบคุณค่ะ กรุณาทำต่อในชุดถัดไป");
    loadTrial();
  }
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
  // 1. รวมผลการทดสอบรอบนี้เข้ากับข้อมูลทั้งหมด
  const allResults = JSON.parse(localStorage.getItem('allResults') || '[]');
  allResults.push(...trials);
  localStorage.setItem('allResults', JSON.stringify(allResults));

  // 2. รีเซ็ตค่าการทดลองในรอบถัดไป
  trials = [];
  currentTrial = 0;

  // 3. ตรวจสอบลำดับ Latin order
  const order = localStorage.getItem('order') || '1';
  const latinOrders = {
    '1': ['LED', 'Beep', 'Vibrate', 'None'],
    '2': ['Beep', 'Vibrate', 'None', 'LED'],
    '3': ['Vibrate', 'None', 'LED', 'Beep'],
    '4': ['None', 'LED', 'Beep', 'Vibrate']
  };
  const seq = latinOrders[order];
  const idx = seq.indexOf(condition);
  const nextCond = idx >= 0 && idx < seq.length - 1 ? seq[idx + 1] : null;

  // 4. ถ้ามี condition ต่อไป
  if (nextCond) {
    condition = nextCond;
    const condLabel = document.getElementById('condLabel');
    condLabel.textContent = `Condition: ${condition}`;
    document.getElementById('feedback').textContent = '';
    document.getElementById('trialLabel').textContent = '';
    document.getElementById('fixation').textContent = '+';

    // แสดงข้อความพักสั้น ๆ ก่อนเริ่ม condition ต่อไป
    condLabel.style.color = '#007bff';
    condLabel.textContent = `พักสั้นๆ... ต่อไปคือ Condition: ${condition}`;
    delay(2000).then(() => {
      condLabel.textContent = `Condition: ${condition}`;
      runTrial();
    });
  } else {
    // 5. ถ้าไม่มี condition ต่อ → ไป summary
    window.location.href = 'summary.html';
  }
}




// ====== SUMMARY PAGE ======
function downloadCSV() {
  const allData = JSON.parse(localStorage.getItem('allResults') || '[]');
  if (allData.length === 0) {
    alert("ยังไม่มีข้อมูลรวมให้ดาวน์โหลด");
    return;
  }

  const header = 'pid,condition,trial,rt_sec,correct';
  const rows = allData.map(d => `${d.pid},${d.condition},${d.trial},${d.rt_sec},${d.correct}`);
  const csv = [header, ...rows].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'all_results.csv';
  a.click();
}


function restart() {
  // เคลียร์เฉพาะค่าชั่วคราว ไม่ลบ allResults
  localStorage.removeItem('pid');
  localStorage.removeItem('order');
  localStorage.removeItem('trialData');
  window.location.href = 'index.html';
}

