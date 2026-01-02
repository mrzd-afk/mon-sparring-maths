// --- LOGIQUE CORE ---
let CURRENT_CHAPTER = null;
let CHAPTER_DATA = null;
let SCORE = parseInt(localStorage.getItem('sparring_score') || '0');
let MASTERY = JSON.parse(localStorage.getItem('sparring_mastery') || '{"suites":0, "derivation":0}');

// Initialisation au chargement
window.onload = () => {
    updateGlobalUI();
};

function updateGlobalUI() {
    const scoreEl = document.getElementById('global-score');
    if(scoreEl) scoreEl.textContent = SCORE.toString().padStart(4, '0');
    
    if(document.getElementById('progress-suites')) 
        document.getElementById('progress-suites').style.width = `${MASTERY.suites}%`;
    if(document.getElementById('progress-derivation')) 
        document.getElementById('progress-derivation').style.width = `${MASTERY.derivation}%`;
    
    localStorage.setItem('sparring_score', SCORE);
    localStorage.setItem('sparring_mastery', JSON.stringify(MASTERY));
}

async function loadChapter(id) {
    try {
        const response = await fetch(`maths_${id}.json`);
        if (!response.ok) throw new Error();
        CHAPTER_DATA = await response.json();
        CURRENT_CHAPTER = id;

        document.getElementById('chapter-title').textContent = CHAPTER_DATA.title;
        document.getElementById('mastery-label').textContent = `Maîtrise : ${MASTERY[id]}%`;
        document.getElementById('mastery-badge').textContent = Math.floor(MASTERY[id]/10) + 1;
        
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('workspace').classList.remove('hidden');
        
        switchTab('cards');
        renderCards();
        renderQuiz();
        renderExos();
        renderTraps();
    } catch (e) {
        alert("Erreur: Le fichier 'maths_" + id + ".json' est introuvable ou mal formaté.");
    }
}

function showDashboard() {
    document.getElementById('workspace').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    updateGlobalUI();
}

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('[id^="tab-btn-"]').forEach(b => b.classList.remove('tab-active'));
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    document.getElementById(`tab-btn-${tab}`).classList.add('tab-active');
}

function renderCards() {
    const container = document.getElementById('tab-cards');
    container.innerHTML = CHAPTER_DATA.flashcards.map((c, i) => `
        <div class="bg-slate-800/50 border border-slate-700 p-5 rounded-xl">
            <p class="text-indigo-300 text-xs font-bold mb-2 tracking-widest uppercase">Question Sparring</p>
            <p class="text-lg font-medium mb-4">${c.q}</p>
            <div id="hints-${i}" class="space-y-2 mb-4"></div>
            <div class="flex flex-wrap gap-2">
                <button onclick="getHint(${i})" class="text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-2 rounded-lg hover:bg-amber-500/20">Indice (-2 pts)</button>
                <button onclick="toggleElement('ans-${i}')" class="text-xs bg-indigo-500 text-white px-3 py-2 rounded-lg">Réponse</button>
            </div>
            <div id="ans-${i}" class="hidden mt-4 p-4 bg-slate-900 border-l-2 border-green-500 text-sm italic">
                ${c.answers[0]}
                <button onclick="validateExo(${c.points}, ${i}, 'card')" class="block mt-4 bg-green-600/20 text-green-400 text-[10px] px-2 py-1 rounded tracking-tighter uppercase">J'ai réussi sans erreur</button>
            </div>
        </div>
    `).join('');
    CHAPTER_DATA.flashcards.forEach(c => c.usedHints = 0);
}

function getHint(idx) {
    const card = CHAPTER_DATA.flashcards[idx];
    if (card.usedHints < card.hints.length) {
        const hZone = document.getElementById(`hints-${idx}`);
        const h = document.createElement('div');
        h.className = "text-xs p-2 bg-amber-900/20 border border-amber-500/20 text-amber-200 rounded";
        h.textContent = card.hints[card.usedHints];
        hZone.appendChild(h);
        card.usedHints++;
        SCORE = Math.max(0, SCORE - 2);
        updateGlobalUI();
    }
}

function renderQuiz() {
    const container = document.getElementById('tab-quiz');
    container.innerHTML = CHAPTER_DATA.quiz.map((q, i) => `
        <div class="bg-slate-800/50 border border-slate-700 p-5 rounded-xl">
            <p class="text-lg font-medium mb-4">${q.q}</p>
            <div class="space-y-2">
                ${q.type === 'mcq' ? q.options.map((opt, oi) => `
                    <button onclick="checkQuiz(${i}, ${oi})" class="w-full text-left p-3 rounded-lg bg-slate-900 border border-slate-700 hover:border-indigo-500 transition text-sm">${opt}</button>
                `).join('') : `
                    <input type="text" id="quiz-open-${i}" class="w-full bg-slate-900 border border-slate-700 rounded p-3 text-sm outline-none" placeholder="Mots-clés attendus...">
                    <button onclick="checkQuizOpen(${i})" class="mt-2 bg-indigo-600 w-full py-2 rounded text-sm font-bold">Valider</button>
                `}
            </div>
            <div id="quiz-fb-${i}" class="hidden mt-4 p-3 rounded text-sm font-medium"></div>
        </div>
    `).join('');
}

function checkQuiz(qIdx, optIdx) {
    const q = CHAPTER_DATA.quiz[qIdx];
    const fb = document.getElementById(`quiz-fb-${qIdx}`);
    fb.classList.remove('hidden');
    if (optIdx === q.answer) {
        fb.className = "mt-4 p-3 rounded text-sm bg-green-500/10 text-green-400 border border-green-500/20";
        fb.innerHTML = `✅ Correct ! ${q.explanation}`;
        addPoints(q.points);
    } else {
        fb.className = "mt-4 p-3 rounded text-sm bg-red-500/10 text-red-400 border border-red-500/20";
        fb.innerHTML = `❌ Faux. ${q.explanation}`;
    }
}

function checkQuizOpen(i) {
    const val = document.getElementById(`quiz-open-${i}`).value.toLowerCase();
    const keywords = CHAPTER_DATA.quiz[i].expected_keywords;
    const success = keywords.every(k => val.includes(k.toLowerCase()));
    const fb = document.getElementById(`quiz-fb-${i}`);
    fb.classList.remove('hidden');
    if (success) {
        fb.className = "mt-4 p-3 rounded text-sm bg-green-500/10 text-green-400";
        fb.textContent = "✅ Justification validée !";
        addPoints(CHAPTER_DATA.quiz[i].points);
    } else {
        fb.className = "mt-4 p-3 rounded text-sm bg-red-500/10 text-red-400";
        fb.textContent = `❌ Concept manquant.`;
    }
}

function renderExos() {
    const container = document.getElementById('tab-exos');
    container.innerHTML = CHAPTER_DATA.exercises.map((e, i) => `
        <div class="bg-slate-800/50 border border-slate-700 p-5 rounded-xl">
            <div class="flex justify-between items-start mb-4">
                <p class="text-lg font-medium flex-1">${e.q}</p>
                <div id="timer-${i}" class="font-mono font-bold text-xl text-indigo-400 ml-4">--:--</div>
            </div>
            <button id="btn-chrono-${i}" onclick="startChrono(${i}, ${e.time_limit_sec})" class="w-full py-3 bg-green-600/20 text-green-400 border border-green-500/20 rounded-xl font-bold">LANCER LE CHRONO</button>
            <div id="exo-sol-${i}" class="hidden p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-xl text-sm">
                ${e.solution}
                <button onclick="validateExo(${e.points}, ${i}, 'exo')" class="mt-4 bg-indigo-500 text-white px-4 py-2 rounded text-xs">J'ai réussi</button>
            </div>
        </div>
    `).join('');
}

function startChrono(idx, sec) {
    const btn = document.getElementById(`btn-chrono-${idx}`);
    const display = document.getElementById(`timer-${idx}`);
    btn.classList.add('hidden');
    let timeLeft = sec;
    
    const interval = setInterval(() => {
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        display.textContent = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        if (timeLeft <= 10) display.style.color = "#ef4444";
        if (timeLeft <= 0) {
            clearInterval(interval);
            display.textContent = "FINI";
            document.getElementById(`exo-sol-${idx}`).classList.remove('hidden');
        }
        timeLeft--;
    }, 1000);

    const checkBtn = document.createElement('button');
    checkBtn.className = "w-full py-3 bg-indigo-600 rounded-xl font-bold mb-4";
    checkBtn.textContent = "VOIR LA RÉPONSE";
    checkBtn.onclick = () => {
        clearInterval(interval);
        document.getElementById(`exo-sol-${idx}`).classList.remove('hidden');
        checkBtn.remove();
    };
    btn.parentNode.insertBefore(checkBtn, document.getElementById(`exo-sol-${idx}`));
}

function renderTraps() {
    const container = document.getElementById('tab-traps');
    if (!CHAPTER_DATA.traps) {
        container.innerHTML = "<p class='text-slate-500 italic p-4'>Pas de pièges pour ce chapitre.</p>";
        return;
    }
    container.innerHTML = CHAPTER_DATA.traps.map((t, i) => `
        <div class="bg-red-950/10 border border-red-500/20 p-6 rounded-2xl">
            <h4 class="text-xl font-bold text-red-400 mb-4">${t.title}</h4>
            <p class="text-xs text-slate-500 uppercase font-bold mb-2">Erreur classique :</p>
            <p class="italic text-slate-300 mb-4">"${t.bad_reasoning}"</p>
            <button onclick="toggleElement('trap-sol-${i}')" class="text-xs font-bold text-white bg-red-600 px-3 py-1 rounded">DÉMASQUER</button>
            <div id="trap-sol-${i}" class="hidden mt-6 bg-slate-900 p-4 rounded-lg">
                <p class="text-sm mb-2"><span class="text-red-400 font-bold">Pourquoi ?</span> ${t.error_analysis}</p>
                <p class="text-sm"><span class="text-green-400 font-bold">Correct :</span> ${t.correct_formula}</p>
                <button onclick="addPoints(${t.points})" class="mt-4 text-[10px] text-slate-500 uppercase">Compris (+${t.points})</button>
            </div>
        </div>
    `).join('');
}

function toggleElement(id) { document.getElementById(id).classList.toggle('hidden'); }
function addPoints(pts) { SCORE += pts; updateMastery(pts); updateGlobalUI(); }
function validateExo(pts, idx, type) {
    let finalPts = pts;
    if (type === 'card') finalPts -= (CHAPTER_DATA.flashcards[idx].usedHints * 2);
    addPoints(Math.max(0, finalPts));
}
function updateMastery(pts) {
    MASTERY[CURRENT_CHAPTER] = Math.min(100, MASTERY[CURRENT_CHAPTER] + Math.floor(pts/5));
}
function resetStats() { if(confirm("Réinitialiser ?")) { localStorage.clear(); location.reload(); } }