// Improved app UI and logic: full progress, streak animation, Duolingo-like cards
const input = document.getElementById('dir-input');
const dropzone = document.getElementById('dropzone');
const summary = document.getElementById('summary');
const dropArea = document.getElementById('drop-area');
const lessonSection = document.getElementById('lesson');
const preview = document.getElementById('preview');
const meta = document.getElementById('meta');
const questionEl = document.getElementById('question');
const answerEl = document.getElementById('answer');
const nextBtn = document.getElementById('next');
const checkBtn = document.getElementById('check');
const skipBtn = document.getElementById('skip');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const streakCountEl = document.getElementById('streak-count');
const streakHeader = document.getElementById('streak-count-header');
const streakNode = document.getElementById('streak');

let lessons = []; // {id, items:[], json:{}, resources:[]}
let flatQuestions = []; // [{lessonId, key, value}]
let currentIndex = 0;
let streak = 0;

function resetState(){
  flatQuestions = [];
  currentIndex = 0;
  streak = 0;
  updateStreak();
  updateProgress();
}

function updateStreak(){
  streakCountEl.textContent = streak;
  if(streakHeader) streakHeader.textContent = streak;
}

function updateProgress(){
  const total = Math.max(1, flatQuestions.length);
  const pct = Math.round((currentIndex/total)*100);
  progressFill.style.width = pct + '%';
  if(progressText) progressText.textContent = `${Math.min(currentIndex,total)} / ${total}`;
}

input.addEventListener('change', (e)=>handleFiles(e.target.files));

// drag UI
['dragenter','dragover'].forEach(evt=>{
  dropzone.addEventListener(evt, (ev)=>{ev.preventDefault(); dropzone.classList.add('hover')});
});
['dragleave','drop'].forEach(evt=>{
  dropzone.addEventListener(evt, (ev)=>{dropzone.classList.remove('hover')});
});

async function handleFiles(fileList){
  const files = Array.from(fileList);
  if(files.length===0) return;
  const groups = {};
  files.forEach(f=>{
    const path = f.webkitRelativePath || f.name;
    const parts = path.split('/').filter(Boolean);
    const top = parts.length>1 ? parts[0] : null;
    const fname = parts[parts.length-1];
    const base = fname.split('.')[0];
    const key = top || base;
    groups[key] = groups[key] || [];
    groups[key].push({file:f, path});
  });

  lessons = Object.keys(groups).map(k=>({id:k, items:groups[k]}));

  // parse lessons
  for(const L of lessons){
    L.json = {};
    L.resources = [];
    for(const it of L.items){
      const lower = it.file.name.toLowerCase();
      if(lower.endsWith('.json')){
        try{
          const txt = await it.file.text();
          try{ L.json = JSON.parse(txt); }
          catch(err){
            const lines = txt.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
            lines.forEach((ln,idx)=>{
              const parts = ln.split(':');
              if(parts.length>1){
                const k = parts[0].replace(/^-\s*/,'').trim();
                L.json[k] = parts.slice(1).join(':').trim();
              }else{
                L.json['item'+idx] = ln;
              }
            });
          }
        }catch(e){console.warn('json read failed',e)}
      }else if(lower.match(/\.(png|jpg|jpeg|gif|pdf)$/)){
        const url = URL.createObjectURL(it.file);
        L.resources.push({name:it.file.name,url, type:lower.endsWith('.pdf')? 'pdf' : 'img'})
      }
    }
  }

  // build flat questions list
  flatQuestions = [];
  lessons.forEach(L=>{
    const keys = Object.keys(L.json || {});
    keys.forEach(k=> flatQuestions.push({lessonId: L.id, key:k, value: L.json[k], resources: L.resources}));
  });

  summary.textContent = `Chargé ${lessons.length} dossier(s) — ${flatQuestions.length} éléments`;
  resetState();
  if(flatQuestions.length>0){
    // show first
    dropArea.style.display = 'none';
    lessonSection.hidden = false;
    showQuestion(0);
  }
}

function showQuestion(idx){
  currentIndex = idx;
  const q = flatQuestions[currentIndex];
  if(!q){
    // finished
    questionEl.textContent = 'Bravo — révision terminée !';
    preview.innerHTML = '';
    answerEl.value = '';
    updateProgress();
    return;
  }
  // preview first resource
  preview.innerHTML = '';
  if(q.resources && q.resources.length>0){
    const r = q.resources[0];
    if(r.type==='img'){
      const img = document.createElement('img'); img.src = r.url; img.alt = r.name; preview.appendChild(img);
    }else{
      const obj = document.createElement('embed'); obj.src = r.url; obj.type='application/pdf'; obj.style.width='100%'; obj.style.height='100%'; preview.appendChild(obj);
    }
  }else{
    preview.textContent = `Leçon ${q.lessonId}`;
  }

  meta.textContent = `Leçon: ${q.lessonId}`;
  questionEl.textContent = `Explique : ${q.key}`;
  answerEl.value = '';
  updateProgress();
}

function markAnswer(correct){
  if(correct){
    streak = Math.max(0, streak) + 1;
    flashStreak();
  } else {
    streak = Math.max(0, streak-1);
  }
  updateStreak();
}

function flashStreak(){
  streakNode.classList.add('pulse');
  setTimeout(()=> streakNode.classList.remove('pulse'), 420);
}

checkBtn.addEventListener('click', ()=>{
  const val = answerEl.value.trim();
  const ok = val.length>3; // naive
  markAnswer(ok);
});

nextBtn.addEventListener('click', ()=>{
  // if not at end, advance
  if(currentIndex < flatQuestions.length-1){
    currentIndex++;
    showQuestion(currentIndex);
  } else {
    // finished
    currentIndex = flatQuestions.length;
    showQuestion(currentIndex);
  }
});

skipBtn.addEventListener('click', ()=>{
  // move to next without scoring
  if(currentIndex < flatQuestions.length-1){
    currentIndex++;
    showQuestion(currentIndex);
  }
});

// keyboard
answerEl.addEventListener('keydown', (e)=>{
  if(e.ctrlKey && e.key === 'Enter') checkBtn.click();
});

// initial hint
summary.textContent = 'Sélectionnez un dossier contenant l1.json et l1.png/jpg/pdf pour commencer.';