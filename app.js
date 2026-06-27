const input       = document.getElementById('dir-input');
const dropzone    = document.getElementById('dropzone');
const summary     = document.getElementById('summary');
const landingUI   = document.getElementById('landing-ui');
const appUI       = document.getElementById('app-ui');
const preview     = document.getElementById('preview');
const meta        = document.getElementById('meta');
const questionEl  = document.getElementById('question');
const answerEl    = document.getElementById('answer');
const nextBtn     = document.getElementById('next');
const checkBtn    = document.getElementById('check');
const skipBtn     = document.getElementById('skip');
const progressFill     = document.getElementById('progress-fill');
const streakCountEl    = document.getElementById('streak-count-header');
const streakNode       = document.getElementById('streak-small');
const feedback         = document.getElementById('feedback');
const expectedAnswer   = document.getElementById('expected-answer');
const modeBadge        = document.getElementById('mode-badge');
const changeModeBtn    = document.getElementById('change-mode-btn');

// Write / flashcard zones
const writeZone      = document.getElementById('write-zone');
const flashcardZone  = document.getElementById('flashcard-zone');
const revealBtn      = document.getElementById('reveal-btn');
const flashcardAns   = document.getElementById('flashcard-answer');

// Timer elements
const timerWrap   = document.getElementById('timer-wrap');
const timerText   = document.getElementById('timer-text');
const timerCircle = document.getElementById('timer-circle');

// Blitz bar
const blitzBarWrap  = document.getElementById('blitz-bar-wrap');
const normalBarWrap = document.getElementById('normal-bar-wrap');
const blitzFill     = document.getElementById('blitz-fill');
const blitzLabel    = document.getElementById('blitz-label');
const blitzPill     = blitzFill ? blitzFill.closest('.progress-pill') : null;

// Modals
const modeModal       = document.getElementById('mode-modal');
const confirmModal    = document.getElementById('confirm-modal');
const inspectorModal  = document.getElementById('inspector-modal');
const inspectorContent= document.getElementById('inspector-content');
const blitzEndModal   = document.getElementById('blitz-end-modal');
const blitzResultText = document.getElementById('blitz-result-text');

// --- State ---
let lessons       = [];
let flatQuestions = [];
let currentIndex  = 0;
let streak        = 0;
let sessionTotal  = 0;
let answeredCount = 0;
let currentMode   = 'classic'; // classic | timed | flashcard | blitz

// Timer state
let timerInterval  = null;
let timerRemaining = 0;
const TIMED_SECS   = 30;

// Blitz state
let blitzInterval   = null;
let blitzRemaining  = 300; // 5 min
let blitzAnswered   = 0;
let blitzCorrect    = 0;
const BLITZ_TOTAL   = 300;

/* ============================================================
   UTILS
   ============================================================ */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function updateStreak() {
  streakCountEl.textContent = streak;
  streakNode.style.color = streak > 0 ? '#ff8c00' : 'var(--duo-gray-dark)';
}

function updateProgress() {
  if (currentMode === 'blitz') return;
  if (sessionTotal === 0) return;
  const pct = Math.round((answeredCount / sessionTotal) * 100);
  progressFill.style.width = pct + '%';
}

function flashStreak() {
  streakNode.classList.remove('pulse');
  void streakNode.offsetWidth;
  streakNode.classList.add('pulse');
}
function startQuestionTimer() {
  stopQuestionTimer();
  timerRemaining = TIMED_SECS;
  timerWrap.classList.remove('hidden', 'danger');
  updateTimerDisplay(timerRemaining, TIMED_SECS);

  timerInterval = setInterval(() => {
    timerRemaining--;
    updateTimerDisplay(timerRemaining, TIMED_SECS);
    if (timerRemaining <= 8) timerWrap.classList.add('danger');
    if (timerRemaining <= 0) {
      stopQuestionTimer();
      timeOut();
    }
  }, 1000);
}

function stopQuestionTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function updateTimerDisplay(val, total) {
  timerText.textContent = val;
  const pct = val / total;
  const circ = 100;
  timerCircle.style.strokeDashoffset = circ * (1 - pct);
}

function timeOut() {
  // Treat as wrong answer
  streak = 0;
  updateStreak();
  answerEl.disabled = true;
  feedback.hidden = false;
  feedback.classList.add('error');
  expectedAnswer.textContent = flatQuestions[currentIndex]?.value || '';
  checkBtn.hidden = true;
  skipBtn.hidden = true;
  nextBtn.hidden = false;
  answeredCount++;
  updateProgress();
  nextBtn.focus();

  // Add visual "timeout" label
  feedback.querySelector('strong').textContent = '⏰ Temps écoulé !';
}

function startBlitz() {
  stopBlitz();
  blitzRemaining = BLITZ_TOTAL;
  blitzAnswered  = 0;
  blitzCorrect   = 0;

  blitzBarWrap.classList.remove('hidden');
  normalBarWrap.classList.add('hidden');
  updateBlitzDisplay();

  blitzInterval = setInterval(() => {
    blitzRemaining--;
    updateBlitzDisplay();
    if (blitzRemaining <= 0) {
      stopBlitz();
      endBlitz();
    }
  }, 1000);
}

function stopBlitz() {
  clearInterval(blitzInterval);
  blitzInterval = null;
}

function updateBlitzDisplay() {
  const m = Math.floor(blitzRemaining / 60);
  const s = String(blitzRemaining % 60).padStart(2, '0');
  blitzLabel.textContent = `${m}:${s}`;
  const pct = (blitzRemaining / BLITZ_TOTAL) * 100;
  blitzFill.style.width = pct + '%';

  if (blitzRemaining <= 60) {
    blitzPill && blitzPill.classList.add('danger');
  }
}

function endBlitz() {
  blitzResultText.textContent =
    `Tu as répondu à ${blitzAnswered} question${blitzAnswered > 1 ? 's' : ''} en 5 minutes avec ${blitzCorrect} bonne${blitzCorrect > 1 ? 's' : ''} réponse${blitzCorrect > 1 ? 's' : ''} ! 🔥`;
  blitzEndModal.classList.remove('hidden');
}

input.addEventListener('change', (e) => handleFiles(e.target.files));

['dragenter', 'dragover'].forEach(evt => {
  dropzone.addEventListener(evt, (ev) => { ev.preventDefault(); dropzone.classList.add('hover'); });
});
['dragleave', 'drop'].forEach(evt => {
  dropzone.addEventListener(evt, () => dropzone.classList.remove('hover'));
});
dropzone.addEventListener('drop', (ev) => {
  ev.preventDefault();
  if (ev.dataTransfer.items) {
    const items  = Array.from(ev.dataTransfer.items);
    const files  = [];
    let pending  = items.length;

    function checkDone() {
      if (pending === 0 && files.length > 0) handleFiles(files);
    }

    items.forEach(item => {
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          traverseFileTree(entry, '', files).then(() => { pending--; checkDone(); });
        } else { pending--; checkDone(); }
      }
    });
  } else {
    handleFiles(ev.dataTransfer.files);
  }
});

async function traverseFileTree(item, path, files) {
  path = path || '';
  if (item.isFile) {
    return new Promise(resolve => {
      item.file(file => {
        Object.defineProperty(file, 'webkitRelativePath', { value: path + file.name, writable: false });
        files.push(file);
        resolve();
      });
    });
  } else if (item.isDirectory) {
    const dirReader = item.createReader();
    return new Promise(resolve => {
      dirReader.readEntries(async entries => {
        for (const e of entries) await traverseFileTree(e, path + item.name + '/', files);
        resolve();
      });
    });
  }
}

async function handleFiles(fileList) {
  const files = Array.from(fileList);
  if (!files.length) return;

  const groups = {};
  files.forEach(f => {
    const path  = f.webkitRelativePath || f.name;
    const parts = path.split('/').filter(Boolean);
    const top   = parts.length > 1 ? parts[parts.length - 2] : null;
    const fname = parts[parts.length - 1];
    const base  = fname.split('.')[0];
    const key   = top || base;
    groups[key] = groups[key] || [];
    groups[key].push({ file: f, path });
  });

  lessons = Object.keys(groups).map(k => ({ id: k, items: groups[k] }));

  for (const L of lessons) {
    L.json      = {};
    L.resources = [];
    for (const it of L.items) {
      const lower = it.file.name.toLowerCase();
      if (lower.endsWith('.json') || lower.endsWith('.txt')) {
        try {
          const txt = await it.file.text();
          try {
            L.json = JSON.parse(txt);
          } catch {
            const lines = txt.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
            let currentKey = null; let currentValue = [];
            lines.forEach(ln => {
              if (ln.startsWith('-')) {
                if (currentKey) L.json[currentKey] = currentValue.join('\n').trim();
                const parts = ln.replace(/^-\s*/, '').split(':');
                currentKey   = parts[0].trim();
                currentValue = parts.slice(1).join(':').trim() ? [parts.slice(1).join(':').trim()] : [];
              } else if (currentKey) { currentValue.push(ln); }
            });
            if (currentKey) L.json[currentKey] = currentValue.join('\n').trim();
          }
        } catch (e) { /* silently skip */ }
      } else if (lower.match(/\.(png|jpg|jpeg|gif|pdf)$/)) {
        const url = URL.createObjectURL(it.file);
        L.resources.push({ name: it.file.name, url, type: lower.endsWith('.pdf') ? 'pdf' : 'img' });
      }
    }
  }

  flatQuestions = [];
  lessons.forEach(L => {
    Object.keys(L.json || {}).forEach(k =>
      flatQuestions.push({ lessonId: L.id, key: k, value: L.json[k], resources: L.resources })
    );
  });

  if (flatQuestions.length > 0) {
    landingUI.classList.add('fade-out');
    setTimeout(() => {
      landingUI.classList.add('hidden');
      landingUI.classList.remove('fade-out');
      openModeModal(true); // true = first launch
    }, 400);
  } else {
    summary.textContent = "Aucun fichier valide trouvé. Vérifie les .json/.txt et .png/.pdf.";
  }
}

function openModeModal(firstLaunch = false) {
  modeModal.classList.remove('hidden');
  // highlight current mode
  document.querySelectorAll('.mode-card').forEach(card => {
    card.classList.toggle('active', card.dataset.mode === currentMode);
  });
}

function closeModeModal() {
  modeModal.classList.add('hidden');
}

document.querySelectorAll('.mode-card').forEach(card => {
  card.addEventListener('click', () => {
    currentMode = card.dataset.mode;
    closeModeModal();
    launchMode();
  });
});

changeModeBtn.addEventListener('click', () => openModeModal());

// Blitz end actions
document.getElementById('blitz-restart').addEventListener('click', () => {
  blitzEndModal.classList.add('hidden');
  launchMode();
});
document.getElementById('blitz-change-mode').addEventListener('click', () => {
  blitzEndModal.classList.add('hidden');
  openModeModal();
});

function launchMode() {
  // Show app UI (in case we're coming from landing)
  appUI.classList.remove('hidden');
  appUI.classList.add('fade-in');

  // Reset common state
  shuffleArray(flatQuestions);
  currentIndex  = 0;
  answeredCount = 0;
  sessionTotal  = flatQuestions.length;
  streak        = 0;
  updateStreak();

  // Stop any running timers
  stopQuestionTimer();
  stopBlitz();

  // Mode-specific UI
  const modeLabels = {
    classic:   '✍️ Classique',
    timed:     '⏱️ Contre la montre',
    flashcard: '🃏 Flashcard',
    blitz:     '⚡ Blitz',
  };
  modeBadge.textContent = modeLabels[currentMode];

  // Timer visibility
  if (currentMode === 'timed') {
    timerWrap.classList.remove('hidden');
  } else {
    timerWrap.classList.add('hidden');
  }

  // Blitz bar
  if (currentMode === 'blitz') {
    blitzBarWrap.classList.remove('hidden');
    normalBarWrap.classList.add('hidden');
    if (blitzPill) blitzPill.classList.remove('danger');
    startBlitz();
  } else {
    blitzBarWrap.classList.add('hidden');
    normalBarWrap.classList.remove('hidden');
    updateProgress();
  }

  showQuestion();
}

function showQuestion() {
  stopQuestionTimer();

  if (currentIndex >= flatQuestions.length) {
    shuffleArray(flatQuestions);
    currentIndex  = 0;
    answeredCount = 0;
    updateProgress();
  }

  const q = flatQuestions[currentIndex];

  // Preview
  preview.innerHTML = '';
  if (q.resources && q.resources.length > 0) {
    const r = q.resources[0];
    if (r.type === 'img') {
      const img = document.createElement('img');
      img.src = r.url; img.alt = r.name;
      preview.appendChild(img);
    } else {
      const obj = document.createElement('embed');
      obj.src = r.url; obj.type = 'application/pdf';
      preview.appendChild(obj);
    }
  } else {
    preview.textContent = `Document manquant pour : ${q.lessonId}`;
  }

  meta.textContent     = `Dossier : ${q.lessonId}`;
  questionEl.textContent = q.key;

  feedback.hidden  = true;
  feedback.className = 'feedback';
  const strongEl = feedback.querySelector('strong');
  if (strongEl) strongEl.textContent = 'Réponse attendue :';

  checkBtn.hidden = false;
  skipBtn.hidden  = false;
  nextBtn.hidden  = true;

  // Mode-specific zone
  if (currentMode === 'flashcard') {
    writeZone.classList.add('hidden');
    flashcardZone.classList.remove('hidden');
    flashcardAns.classList.add('hidden');
    flashcardAns.textContent = q.value || '(Aucune réponse enregistrée)';
    revealBtn.classList.remove('hidden');

    // Remove old self-eval if any
    document.querySelectorAll('.self-eval').forEach(el => el.remove());

    checkBtn.hidden = true;
    skipBtn.hidden  = true;
    nextBtn.hidden  = true;
  } else {
    writeZone.classList.remove('hidden');
    flashcardZone.classList.add('hidden');
    answerEl.value    = '';
    answerEl.disabled = false;
    answerEl.focus();
  }

  // Start per-question timer
  if (currentMode === 'timed') {
    startQuestionTimer();
  }
}

revealBtn.addEventListener('click', () => {
  revealBtn.classList.add('hidden');
  flashcardAns.classList.remove('hidden');

  // Self-evaluation buttons
  const selfEval = document.createElement('div');
  selfEval.className = 'self-eval';
  selfEval.innerHTML = `
    <button class="btn eval-bad">❌ Je ne savais pas</button>
    <button class="btn eval-good">✅ Je savais !</button>
  `;
  flashcardZone.appendChild(selfEval);

  selfEval.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const good = btn.classList.contains('eval-good');
      if (good) { streak++; flashStreak(); } else { streak = 0; }
      if (currentMode === 'blitz') { blitzAnswered++; if (good) blitzCorrect++; }
      updateStreak();
      answeredCount++;
      updateProgress();
      currentIndex++;
      showQuestion();
    });
  });
});

function evaluateAnswer() {
  if (currentMode === 'flashcard') return;
  stopQuestionTimer();

  const q       = flatQuestions[currentIndex];
  const userVal = answerEl.value.trim();
  const ok      = userVal.length > 5;

  if (ok) {
    streak++;
    flashStreak();
    feedback.classList.remove('error');
    if (currentMode === 'blitz') blitzCorrect++;
  } else {
    streak = 0;
    feedback.classList.add('error');
  }
  if (currentMode === 'blitz') blitzAnswered++;

  updateStreak();
  answerEl.disabled = true;
  feedback.hidden   = false;
  const strongEl = feedback.querySelector('strong');
  if (strongEl) strongEl.textContent = 'Réponse attendue :';
  expectedAnswer.textContent = q.value || '(Aucune réponse enregistrée dans le fichier)';

  checkBtn.hidden = true;
  skipBtn.hidden  = true;
  nextBtn.hidden  = false;

  answeredCount++;
  updateProgress();
  nextBtn.focus();
}

checkBtn.addEventListener('click', evaluateAnswer);

nextBtn.addEventListener('click', () => {
  currentIndex++;
  showQuestion();
});

skipBtn.addEventListener('click', () => {
  stopQuestionTimer();
  streak = 0;
  updateStreak();
  if (currentMode === 'blitz') blitzAnswered++;
  currentIndex++;
  answeredCount++;
  updateProgress();
  showQuestion();
});

answerEl.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') checkBtn.click();
});

document.getElementById('inspect-btn').addEventListener('click', () => {
  confirmModal.classList.remove('hidden');
});

document.getElementById('confirm-cancel').addEventListener('click', () => {
  confirmModal.classList.add('hidden');
});

document.getElementById('confirm-ok').addEventListener('click', () => {
  confirmModal.classList.add('hidden');
  buildInspector();
  inspectorModal.classList.remove('hidden');
});

document.getElementById('inspector-close').addEventListener('click', () => {
  inspectorModal.classList.add('hidden');
});

// Close modals on overlay click
[confirmModal, inspectorModal, modeModal, blitzEndModal].forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });
});

function buildInspector() {
  inspectorContent.innerHTML = '';

  if (!lessons.length) {
    inspectorContent.textContent = 'Aucune donnée chargée.';
    return;
  }

  lessons.forEach(L => {
    const keys = Object.keys(L.json || {});
    const block = document.createElement('div');
    block.className = 'inspector-lesson';

    const header = document.createElement('div');
    header.className = 'inspector-lesson-header';
    header.innerHTML = `
      <div>
        <span class="inspector-lesson-name">📁 ${L.id}</span>
        <span class="inspector-lesson-count">${keys.length} entrée${keys.length > 1 ? 's' : ''} · ${L.resources.length} ressource${L.resources.length > 1 ? 's' : ''}</span>
      </div>
      <span class="inspector-lesson-toggle">▶</span>
    `;

    const rows = document.createElement('div');
    rows.className = 'inspector-rows';

    keys.forEach(k => {
      const row = document.createElement('div');
      row.className = 'inspector-row';
      row.innerHTML = `
        <div class="inspector-key">${escapeHtml(k)}</div>
        <div class="inspector-val">${escapeHtml(L.json[k])}</div>
      `;
      rows.appendChild(row);
    });

    if (keys.length === 0) {
      rows.innerHTML = '<div style="padding:12px 16px;color:var(--text-muted);font-weight:600">Aucune entrée texte trouvée.</div>';
    }

    header.addEventListener('click', () => {
      const open = rows.classList.toggle('open');
      header.querySelector('.inspector-lesson-toggle').classList.toggle('open', open);
    });

    block.appendChild(header);
    block.appendChild(rows);
    inspectorContent.appendChild(block);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

updateStreak();