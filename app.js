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
        CHAPTER_DATA = await response.json();
        CURRENT_CHAPTER = id;
        document.getElementById('chapter-title').textContent = CHAPTER_DATA.title;
        updateMasteryDisplay();
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('workspace').classList.remove('hidden');
        switchTab('cards');
        renderCards(); renderQuiz(); renderExos(); renderTraps();
    } catch (e) { alert("Erreur de chargement des données."); }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('[id^="tab-btn-"]').forEach(btn => btn.classList.remove('tab-active'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    document.getElementById(`tab-btn-${tabId}`).classList.add('tab-active');
    refreshMaths();
}

// --- MODULE EXERCICES (DOUBLE VALIDATION) ---
function renderExos() {
    const container = document.getElementById('tab-exos');
    container.innerHTML = CHAPTER_DATA.exercises.map((e, i) => `
        <div class="bg-slate-800/40 border border-slate-700/50 p-6 rounded-[2rem] animate-fade shadow-sm">
            <p class="text-lg font-medium text-white mb-6 leading-relaxed">${e.q}</p>
            <div id="exo-actions-${i}">
                <button onclick="askConfirm(${i})" class="w-full py-4 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-600/20 transition shadow-inner">Afficher la solution</button>
            </div>
            <div id="exo-confirm-${i}" class="hidden flex flex-col items-center bg-amber-900/10 border border-amber-500/20 p-6 rounded-2xl">
                <p class="text-amber-200 text-xs font-bold mb-4 uppercase text-center">Êtes-vous sûr de vouloir dévoiler la correction ?</p>
                <div class="flex gap-4 w-full">
                    <button onclick="revealExo(${i})" class="flex-1 bg-amber-500 text-slate-950 py-3 rounded-xl font-bold text-xs uppercase shadow-lg">Oui, dévoiler</button>
                    <button onclick="cancelConfirm(${i})" class="flex-1 bg-slate-700 text-white py-3 rounded-xl font-bold text-xs uppercase">Non</button>
                </div>
            </div>
            <div id="exo-sol-${i}" class="hidden mt-6 p-6 bg-slate-950 border border-indigo-500/30 rounded-2xl text-sm text-indigo-100 leading-relaxed shadow-inner">
                <div class="mb-6">${e.solution}</div>
                <button onclick="addPoints(${e.points})" class="w-full bg-indigo-600 text-white py-4 rounded-xl text-xs font-bold uppercase hover:bg-indigo-500 transition shadow-lg">J'ai terminé l'exercice (+${e.points} pts)</button>
            </div>
        </div>
    `).join('');
    refreshMaths();
}

function askConfirm(i) { document.getElementById(`exo-actions-${i}`).classList.add('hidden'); document.getElementById(`exo-confirm-${i}`).classList.remove('hidden'); }
function cancelConfirm(i) { document.getElementById(`exo-actions-${i}`).classList.remove('hidden'); document.getElementById(`exo-confirm-${i}`).classList.add('hidden'); }
function revealExo(i) { document.getElementById(`exo-confirm-${i}`).classList.add('hidden'); document.getElementById(`exo-sol-${i}`).classList.remove('hidden'); refreshMaths(); }

// --- MODULE PIÈGES (VRAI/FAUX) ---
function renderTraps() {
    const container = document.getElementById('tab-traps');
    container.innerHTML = CHAPTER_DATA.traps.map((t, i) => `
        <div class="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-xl animate-fade">
            <h4 class="text-indigo-400 font-bold uppercase text-[10px] tracking-widest mb-4">Analyse de Raisonnement</h4>
            <div class="bg-slate-950 p-6 rounded-2xl border border-slate-800 mb-8 italic text-slate-300 text-sm">"${t.bad_reasoning}"</div>
            <div id="trap-logic-${i}">
                <p class="text-center text-xs font-bold text-slate-500 mb-6 uppercase tracking-widest">Ce raisonnement est-il correct ?</p>
                <div class="flex gap-4">
                    <button onclick="handleTrapChoice(${i}, true)" class="flex-1 py-4 bg-slate-800 border border-slate-700 rounded-2xl font-bold text-white hover:bg-red-900/40 hover:border-red-500 transition-all uppercase text-xs">Vrai</button>
                    <button onclick="handleTrapChoice(${i}, false)" class="flex-1 py-4 bg-slate-800 border border-slate-700 rounded-2xl font-bold text-white hover:bg-green-900/40 hover:border-green-500 transition-all uppercase text-xs">Faux</button>
                </div>
            </div>
            <div id="trap-explanation-${i}" class="hidden mt-6 animate-fade">
                <div id="trap-alert-${i}" class="p-4 rounded-xl text-sm font-bold mb-6 text-center border"></div>
                <div class="bg-slate-950 p-6 rounded-2xl border-l-4 border-indigo-500 mb-4">
                    <p class="text-[10px] text-indigo-400 font-bold uppercase mb-2">Explication :</p>
                    <p class="text-sm text-slate-300 mb-6">${t.error_analysis}</p>
                    <p class="text-[10px] text-green-400 font-bold uppercase mb-2 tracking-widest">La Règle d'Or :</p>
                    <p class="text-sm text-green-100 font-bold underline decoration-green-500/30">${t.correct_formula}</p>
                </div>
                <button onclick="addPoints(${t.points})" class="mt-4 w-full py-4 text-[10px] text-slate-500 hover:text-white uppercase font-bold tracking-widest transition">J'ai compris la leçon (+${t.points} pts)</button>
            </div>
        </div>
    `).join('');
    refreshMaths();
}

function handleTrapChoice(idx, chosenTrue) {
    document.getElementById(`trap-logic-${idx}`).classList.add('hidden');
    document.getElementById(`trap-explanation-${idx}`).classList.remove('hidden');
    const alertZone = document.getElementById(`trap-alert-${idx}`);
    if (chosenTrue) {
        alertZone.className = "p-4 rounded-xl text-sm font-bold mb-6 text-center bg-red-500/10 text-red-400 border border-red-500/20";
        alertZone.innerHTML = "⚠️ ATTENTION : C'est le piège classique !";
    } else {
        alertZone.className = "p-4 rounded-xl text-sm font-bold mb-6 text-center bg-green-500/10 text-green-400 border border-green-500/20";
        alertZone.innerHTML = "✨ BIEN JOUÉ : Tu n'es pas tombé dans le panneau !";
    }
    refreshMaths();
}

// --- AUTRES SECTIONS ---
function renderCards() {
    const container = document.getElementById('tab-cards');
    container.innerHTML = CHAPTER_DATA.flashcards.map((c, i) => `
        <div class="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl shadow-sm">
            <p class="text-lg font-medium text-white mb-6 leading-relaxed">${c.q}</p>
            <div id="hints-${i}" class="space-y-2 mb-4"></div>
            <div class="flex gap-3">
                <button onclick="getHint(${i})" class="bg-amber-500/10 text-amber-500 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-500/20 transition">Indice</button>
                <button onclick="toggleElement('ans-${i}')" class="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg">Réponse</button>
            </div>
            <div id="ans-${i}" class="hidden mt-6 p-6 bg-slate-950 border-l-4 border-green-500 rounded-r-2xl text-sm italic text-slate-300 leading-relaxed">
                ${c.answers[0]}
                <button onclick="addPoints(${c.points})" class="block mt-4 text-green-400 font-bold uppercase text-[9px] hover:underline">Correct (+${c.points})</button>
            </div>
        </div>
    `).join('');
    refreshMaths();
}

function renderQuiz() {
    const container = document.getElementById('tab-quiz');
    container.innerHTML = CHAPTER_DATA.quiz.map((q, i) => `
        <div class="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl shadow-sm">
            <p class="text-lg font-medium text-white mb-6 leading-relaxed">${q.q}</p>
            <div class="space-y-3">
                ${q.type === 'mcq' ? q.options.map((opt, oi) => `<button onclick="checkQuiz(${i}, ${oi})" class="w-full text-left p-4 rounded-2xl bg-slate-950 border border-slate-800 text-sm hover:border-indigo-500 transition">${opt}</button>`).join('') : `
                    <div class="flex gap-2"><input type="text" id="quiz-open-${i}" class="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm outline-none focus:border-indigo-500 text-white" placeholder="Réponse..."><button onclick="checkQuizOpen(${i})" class="bg-indigo-600 px-6 rounded-2xl font-bold text-xs uppercase shadow-lg">OK</button></div>
                `}
            </div><div id="quiz-fb-${i}" class="hidden mt-6 p-4 rounded-2xl text-sm shadow-inner"></div>
        </div>
    `).join('');
    refreshMaths();
}

// --- FONCTIONS TECHNIQUES ---
function getHint(idx) {
    const card = CHAPTER_DATA.flashcards[idx];
    if (card.usedHints < card.hints.length) {
        document.getElementById(`hints-${idx}`).innerHTML += `<div class="text-[11px] p-3 bg-amber-900/20 text-amber-100 rounded-xl border border-amber-500/10 animate-fade italic">💡 ${card.hints[card.usedHints]}</div>`;
        card.usedHints++; SCORE -= 2; updateGlobalUI(); refreshMaths();
    }
}
function checkQuiz(qIdx, optIdx) {
    const q = CHAPTER_DATA.quiz[qIdx]; const fb = document.getElementById(`quiz-fb-${qIdx}`); fb.classList.remove('hidden');
    if (optIdx === q.answer) { fb.className = "mt-6 p-4 bg-green-500/10 text-green-400 rounded-2xl border border-green-500/20 font-bold"; fb.innerHTML = `✅ ${q.explanation}`; addPoints(q.points); }
    else { fb.className = "mt-6 p-4 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20 font-bold"; fb.innerHTML = `❌ ${q.explanation}`; }
    refreshMaths();
}
function toggleElement(id) { document.getElementById(id).classList.toggle('hidden'); refreshMaths(); }
function addPoints(pts) { SCORE += pts; MASTERY[CURRENT_CHAPTER] = Math.min(100, MASTERY[CURRENT_CHAPTER] + Math.floor(pts/5)); updateMasteryDisplay(); updateGlobalUI(); }
function updateMasteryDisplay() { document.getElementById('mastery-label').textContent = `Maîtrise : ${MASTERY[CURRENT_CHAPTER]}%`; document.getElementById('mastery-badge').textContent = Math.floor(MASTERY[CURRENT_CHAPTER]/10)+1; }
function refreshMaths() { if (window.MathJax && window.MathJax.typesetPromise) { window.MathJax.typesetPromise(); } }
function showDashboard() { document.getElementById('workspace').classList.add('hidden'); document.getElementById('dashboard').classList.remove('hidden'); updateGlobalUI(); }
function resetStats() { if(confirm("Voulez-vous réinitialiser votre progression ?")) { localStorage.clear(); location.reload(); } }
