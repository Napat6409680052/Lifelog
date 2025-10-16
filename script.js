if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(() => console.log("Service Worker Registered"))
      .catch(err => console.log("SW reg failed: ", err));
  });
}

// ====== MAIN CONFIG ======
let trials = [];
let currentTrial = 0;
const totalTrials = 20;
let startTime = 0;
const conditions = ["LED", "Beep", "Vibrate", "None"];
let condition = conditions[0];

// ====== CORE FUNCTIONS ======
async function runTrial() {
  const fix = document.getElementById("fixation");
  const box = document.getElementById("ledBox");
  const condLabel = document.getElementById("condLabel");
  const trialLabel = document.getElementById("trialLabel");
  const feedback = document.getElementById("feedback");

  condLabel.textContent = `Condition: ${condition}`;
  trialLabel.textContent = `Trial ${currentTrial + 1} / ${totalTrials}`;
  feedback.textContent = "";
  fix.textContent = "+";
  box.style.background = "black";

  // — Phase 1: Fixation —
  await delay(rand(500, 800));
  fix.textContent = "";

  // — Phase 2: Foreperiod —
  await delay(rand(500, 1500));

  // — Phase 3: Stimulus ON —
  startTime = performance.now();
  showStimulus(condition);
  await delay(700);
  clearStimulus();

  // — Phase 4: Response Window —
  await delay(2500);

  // ถ้าไม่มีข้อมูล trial นี้ (เช่น ผู้ใช้ไม่ตอบ)
  if (!trials[currentTrial]) {
    trials.push({
      pid: localStorage.getItem("pid"),
      condition,
      trial: currentTrial + 1,
      rt_sec: "N/A",
      correct: 0
    });
    currentTrial++;
    if (currentTrial < totalTrials) {
      await delay(rand(2000, 4000));
      runTrial();
    } else finishCondition();
  }
}

function showStimulus(type) {
  const box = document.getElementById("ledBox");
  const beepSound = new Audio("beep1t.mp3");
  box.style.background = "black";

  if (type === "LED") box.style.background = "lime";
  if (type === "Beep") {
    beepSound.currentTime = 0;
    beepSound.play();
    box.style.background = "dodgerblue";
  }
  if (type === "Vibrate") {
    if (navigator.vibrate) navigator.vibrate(700);
    box.style.background = "#ffe89a";
  }
  if (type === "None") box.style.background = "black";
}

function clearStimulus() {
  document.getElementById("ledBox").style.background = "black";
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand(min, max) { return Math.random() * (max - min) + min; }

function recordResponse() {
  const rt = (performance.now() - startTime) / 1000;
  if (rt < 0.15) return;
  trials.push({
    pid: localStorage.getItem("pid"),
    condition,
    trial: currentTrial + 1,
    rt_sec: rt.toFixed(3),
    correct: 1
  });
  document.getElementById("feedback").textContent = `RT: ${rt.toFixed(3)}s`;
  currentTrial++;
  if (currentTrial < totalTrials) delay(rand(2000, 4000)).then(runTrial);
  else finishCondition();
}

function finishCondition() {
  const allResults = JSON.parse(localStorage.getItem("allResults") || "[]");
  allResults.push(...trials);
  localStorage.setItem("allResults", JSON.stringify(allResults));

  trials = [];
  currentTrial = 0;

  const order = localStorage.getItem("order") || "1";
  const latinOrders = {
    "1": ["LED", "Beep", "Vibrate", "None"],
    "2": ["Beep", "Vibrate", "None", "LED"],
    "3": ["Vibrate", "None", "LED", "Beep"],
    "4": ["None", "LED", "Beep", "Vibrate"]
  };
  const seq = latinOrders[order];
  const idx = seq.indexOf(condition);
  const nextCond = idx >= 0 && idx < seq.length - 1 ? seq[idx + 1] : null;

  if (nextCond) {
    condition = nextCond;
    document.getElementById("condLabel").textContent = `Condition: ${condition}`;
    document.getElementById("feedback").textContent = "";
    document.getElementById("trialLabel").textContent = "";
    document.getElementById("fixation").textContent = "+";
    delay(2000).then(runTrial);
  } else {
    window.location.href = "summary.html";
  }
}
