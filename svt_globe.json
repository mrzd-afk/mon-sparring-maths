let CURRENT_CHAPTER = null;
let CHAPTER_DATA = null;
let SCORE = parseInt(localStorage.getItem('sparring_score') || '0');
let MASTERY = JSON.parse(localStorage.getItem('sparring_mastery') || '{"suites":0, "derivation":0, "globe":0, "probabilites":0}');

window.onload = () => { updateGlobalUI(); };

function updateGlobalUI() {
    document.getElementById('global-score').textContent = SCORE.toString().padStart(4, '0');
    ['suites', 'derivation', 'globe', 'probabilites'].forEach(id => {
        const bar = document.getElementById(`progress-${id}`);
        if (bar) bar.style.width = `${MASTERY[id]}%`;
    });
    localStorage.setItem('sparring_score', SCORE);
    localStorage.setItem('sparring_mastery', JSON.stringify(MASTERY));
}

async function loadChapter(id) {
    try {
        let response = await fetch(`maths_${id}.json`);
        if (!response.ok) response = await fetch(`svt_${id}.json`);
        if (!response.ok) throw new Error("Fichier introuvable");
        
        const text = await response.text();
        CHAPTER_DATA = JSON.parse(text);
        CURRENT_CHAPTER = id;
        
        document.getElementById('chapter-title').textContent = CHAPTER_DATA.title;
        updateMasteryDisplay();
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('workspace').classList.remove('hidden');
        
        switchTab('cards');
        renderCards(); renderQuiz(); renderExos(); renderTraps();
    } catch (e) { 
        alert("Erreur critique : Le fichier JSON de cette leçon contient une erreur de ponctuation ou est absent.");
        console.error("Erreur de parsing JSON :", e);
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('[id^="tab-btn-"]').forEach(btn => btn.classList.remove('tab-active'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    document.getElementById(`tab-btn-${tabId}`).classList.add('tab-active');
    if (window.MathJax) window.MathJax.typesetPromise();
}

function renderCards() {
    const container = document.getElementById('tab-cards');
    container.innerHTML = CHAPTER_DATA.flashcards.map((c, i) => `
        <div class="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl mb-4">
            <p class="text-lg font-medium text-white mb-4">${c.q}</p>
            <div id="hints-${i}" class="space-y-2 mb-4"></div>
            <div class="flex gap-2">
                <button onclick="getHint(${i})" class="bg-amber-500/10 text-amber-500 px-3 py-2 rounded-lg text-xs font-bold uppercase">Indice</button>
                <button onclick="toggleElement('ans-${i}')" class="bg-indigo-500 text-white px-3 py-2 rounded-lg text-xs font-bold uppercase">Réponse</button>
            </div>
            <div id="ans-${i}" class="hidden mt-4 p-4 bg-slate-900 border-l-2 border-green-500 text-sm italic">
                ${c.answers[0]}
                <button onclick="addPoints(${c.points})" class="block mt-4 text-green-400 text-[10px] font-bold uppercase underline">Réussi (+${c.points})</button>
            </div>
        </div>
    `).join('');
    CHAPTER_DATA.flashcards.forEach(c => c.usedHints = 0);
}

function getHint(idx) {
    const card = CHAPTER_DATA.flashcards[idx];
    if (card.usedHints < card.hints.length) {
        document.getElementById(`hints-${idx}`).innerHTML += `<div class="text-[11px] p-2 bg-amber-900/20 text-amber-200 rounded">💡 ${card.hints[card.usedHints]}</div>`;
        card.usedHints++; SCORE -= 2; updateGlobalUI();
    }
}

function renderQuiz() {
    const container = document.getElementById('tab-quiz');
    container.innerHTML = CHAPTER_DATA.quiz.map((q, i) => `
        <div class="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl mb-4">
            <p class="text-lg font-medium text-white mb-4">${q.q}</p>
            <div class="space-y-2">
                ${q.type === 'mcq' ? q.options.map((opt, oi) => `<button onclick="checkQuiz(${i}, ${oi})" class="w-full text-left p-3 rounded bg-slate-900 border border-slate-700 text-sm hover:border-indigo-500">${opt}</button>`).join('') : `
                    <input type="text" id="quiz-open-${i}" class="w-full bg-slate-900 border border-slate-700 rounded p-3 text-sm outline-none text-white" placeholder="Ta réponse...">
                    <button onclick="checkQuizOpen(${i})" class="mt-2 bg-indigo-600 w-full py-2 rounded text-xs font-bold uppercase">Valider</button>
                `}
            </div>
            <div id="quiz-fb-${i}" class="hidden mt-4 p-3 rounded text-sm"></div>
        </div>
    `).join('');
}

function checkQuiz(qIdx, optIdx) {
    const q = CHAPTER_DATA.quiz[qIdx]; const fb = document.getElementById(`quiz-fb-${qIdx}`);
    fb.classList.remove('hidden');
    if (optIdx === q.answer) { fb.className = "mt-4 p-3 bg-green-500/10 text-green-400 rounded border border-green-500/20"; fb.innerHTML = `✅ ${q.explanation}`; addPoints(q.points); }
    else { fb.className = "mt-4 p-3 bg-red-500/10 text-red-400 rounded border border-red-500/20"; fb.innerHTML = `❌ ${q.explanation}`; }
}

function renderExos() {
    const container = document.getElementById('tab-exos');
    container.innerHTML = CHAPTER_DATA.exercises.map((e, i) => `
        <div class="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl mb-4">
            <p class="text-lg font-medium text-white mb-6">${e.q}</p>
            <div id="exo-actions-${i}">
                <button onclick="askConfirm(${i})" class="w-full py-3 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl font-bold text-xs uppercase">Afficher la correction</button>
            </div>
            <div id="exo-confirm-${i}" class="hidden flex flex-col items-center bg-amber-900/10 border border-amber-500/20 p-4 rounded-xl">
                <p class="text-amber-200 text-xs font-bold mb-3 uppercase">Dévoiler la solution ?</p>
                <div class="flex gap-4">
                    <button onclick="revealExo(${i})" class="bg-amber-500 text-slate-900 px-4 py-2 rounded-lg font-bold text-xs">OUI</button>
                    <button onclick="cancelConfirm(${i})" class="bg-slate-700 text-white px-4 py-2 rounded-lg font-bold text-xs">NON</button>
                </div>
            </div>
            <div id="exo-sol-${i}" class="hidden mt-6 p-5 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl text-sm">
                ${e.solution}
                <button onclick="addPoints(${e.points})" class="block mt-4 bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-bold uppercase">Terminé (+${e.points} pts)</button>
            </div>
        </div>
    `).join('');
}

function askConfirm(i) { document.getElementById(`exo-actions-${i}`).classList.add('hidden'); document.getElementById(`exo-confirm-${i}`).classList.remove('hidden'); }
function cancelConfirm(i) { document.getElementById(`exo-actions-${i}`).classList.remove('hidden'); document.getElementById(`exo-confirm-${i}`).classList.add('hidden'); }
function revealExo(i) { document.getElementById(`exo-confirm-${i}`).classList.add('hidden'); document.getElementById(`exo-sol-${i}`).classList.remove('hidden'); if (window.MathJax) window.MathJax.typesetPromise(); }

function renderTraps() {
    const container = document.getElementById('tab-traps');
    container.innerHTML = CHAPTER_DATA.traps.map((t, i) => `
        <div class="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl mb-4">
            <h4 class="text-indigo-400 font-bold uppercase text-xs mb-4">${t.title}</h4>
            <div class="bg-slate-900 p-4 rounded-xl border border-slate-800 mb-6 italic text-sm text-slate-300">"${t.bad_reasoning}"</div>
            <div id="trap-logic-${i}">
                <p class="text-center text-xs font-bold text-slate-500 mb-4 uppercase">Ce raisonnement est-il correct ?</p>
                <div class="flex gap-4">
                    <button onclick="handleTrapChoice(${i}, true)" class="flex-1 py-3 bg-slate-800 border border-slate-700 rounded-xl font-bold hover:border-red-500">VRAI</button>
                    <button onclick="handleTrapChoice(${i}, false)" class="flex-1 py-3 bg-slate-800 border border-slate-700 rounded-xl font-bold hover:border-green-500">FAUX</button>
                </div>
            </div>
            <div id="trap-explanation-${i}" class="hidden mt-6">
                <div id="trap-alert-${i}" class="p-3 rounded-lg text-sm font-bold mb-4"></div>
                <div class="bg-slate-900 border-l-4 border-indigo-500 p-4 rounded-r-xl">
                    <p class="text-[10px] text-indigo-400 font-bold uppercase mb-2">L'explication :</p>
                    <p class="text-sm text-slate-300 mb-4">${t.error_analysis}</p>
                    <p class="text-xs text-green-400 font-bold uppercase mb-1">La règle d'or :</p>
                    <p class="text-sm text-green-200 font-bold">${t.correct_formula}</p>
                </div>
            </div>
        </div>
    `).join('');
}

function handleTrapChoice(idx, chosenTrue) {
    document.getElementById(`trap-logic-${idx}`).classList.add('hidden');
    const explanation = document.getElementById(`trap-explanation-${idx}`);
    explanation.classList.remove('hidden');
    const alertZone = document.getElementById(`trap-alert-${idx}`);
    if (chosenTrue) {
        alertZone.className = "p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg";
        alertZone.innerHTML = "⚠️ ATTENTION : C'est un piège !";
    } else {
        alertZone.className = "p-3 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg";
        alertZone.innerHTML = "✅ BRAVO : Tu as évité le piège !";
        addPoints(CHAPTER_DATA.traps[idx].points);
    }
    if (window.MathJax) window.MathJax.typesetPromise();
}

function toggleElement(id) { document.getElementById(id).classList.toggle('hidden'); if (window.MathJax) window.MathJax.typesetPromise(); }
function addPoints(pts) { SCORE += pts; MASTERY[CURRENT_CHAPTER] = Math.min(100, MASTERY[CURRENT_CHAPTER] + Math.floor(pts/5)); updateGlobalUI(); }
function updateMasteryDisplay() { document.getElementById('mastery-label').textContent = `Maîtrise : ${MASTERY[CURRENT_CHAPTER]}%`; document.getElementById('mastery-badge').textContent = Math.floor(MASTERY[CURRENT_CHAPTER]/10)+1; }
function showDashboard() { document.getElementById('workspace').classList.add('hidden'); document.getElementById('dashboard').classList.remove('hidden'); updateGlobalUI(); }
