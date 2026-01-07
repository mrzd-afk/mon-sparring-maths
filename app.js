/* =======================================================
   SPARRING PARTNER - LOGIQUE GLOBALE MISE À JOUR
   ======================================================= */

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
    } catch (e) { alert("Erreur de chargement."); }
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
        <div class="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl">
            <p class="text-lg font-medium text-white mb-6 leading-relaxed">${e.q}</p>
            <div id="exo-actions-${i}">
                <button onclick="askConfirm(${i})" class="w-full py-3 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl font-bold text-xs uppercase">Voir la correction</button>
            </div>
            <div id="exo-confirm-${i}" class="hidden flex flex-col items-center bg-amber-900/10 border border-amber-500/20 p-4 rounded-xl">
                <p class="text-amber-200 text-xs font-bold mb-3 uppercase">Dévoiler la solution ?</p>
                <div class="flex gap-4">
                    <button onclick="revealExo(${i})" class="bg-amber-500 text-slate-900 px-4 py-2 rounded-lg font-bold text-xs uppercase">Oui</button>
                    <button onclick="cancelConfirm(${i})" class="bg-slate-700 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase">Non</button>
                </div>
            </div>
            <div id="exo-sol-${i}" class="hidden mt-6 p-5 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl text-sm text-indigo-100">
                ${e.solution}
                <button onclick="addPoints(${e.points})" class="block mt-4 bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-bold uppercase">Terminé (+${e.points} pts)</button>
            </div>
        </div>
    `).join('');
    refreshMaths();
}

function askConfirm(i) { document.getElementById(`exo-actions-${i}`).classList.add('hidden'); document.getElementById(`exo-confirm-${i}`).classList.remove('hidden'); }
function cancelConfirm(i) { document.getElementById(`exo-actions-${i}`).classList.remove('hidden'); document.getElementById(`exo-confirm-${i}`).classList.add('hidden'); }
function revealExo(i) { document.getElementById(`exo-confirm-${i}`).classList.add('hidden'); document.getElementById(`exo-sol-${i}`).classList.remove('hidden'); refreshMaths(); }

// --- MODULE PIÈGES (VRAI/FAUX AVEC EXPLICATION) ---

function renderTraps() {
    const container = document.getElementById('tab-traps');
    if (!CHAPTER_DATA.traps) { container.innerHTML = "<p class='p-4 text-slate-500 text-center'>Aucun piège listé.</p>"; return; }
    
    container.innerHTML = CHAPTER_DATA.traps.map((t, i) => `
        <div class="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl">
            <h4 class="text-indigo-400 font-bold uppercase text-xs tracking-widest mb-4">${t.title}</h4>
            <div class="bg-slate-900 p-4 rounded-xl border border-slate-800 mb-6">
                <p class="text-slate-300 italic text-sm">"${t.bad_reasoning}"</p>
            </div>
            
            <p class="text-center text-xs font-bold text-slate-500 mb-4 uppercase">Ce raisonnement est-il correct ?</p>
            
            <div id="trap-buttons-${i}" class="flex gap-4">
                <button onclick="checkTrap(${i}, true)" class="flex-1 py-3 bg-slate-800 border border-slate-700 rounded-xl font-bold text-white hover:bg-red-900/20 hover:border-red-500 transition">VRAI</button>
                <button onclick="checkTrap(${i}, false)" class="flex-1 py-3 bg-slate-800 border border-slate-700 rounded-xl font-bold text-white hover:bg-green-900/20 hover:border-green-500 transition">FAUX</button>
            </div>

            <div id="trap-feedback-${i}" class="hidden mt-6 animate-fade">
                <div id="trap-status-${i}" class="p-3 rounded-lg text-sm font-bold mb-4"></div>
                
                <div class="bg-slate-900 border-l-4 border-indigo-500 p-4 rounded-r-xl">
                    <p class="text-xs text-indigo-400 font-bold uppercase mb-2">L'explication :</p>
                    <p class="text-sm text-slate-300 mb-4">${t.error_analysis}</p>
                    <p class="text-xs text-green-400 font-bold uppercase mb-1">La règle à retenir :</p>
                    <p class="text-sm text-green-200 font-bold">${t.correct_formula}</p>
                </div>
                
                <button onclick="addPoints(${t.points})" class="mt-4 text-[10px] text-slate-500 hover:text-white uppercase font-bold tracking-widest">J'ai compris la règle (+${t.points} pts)</button>
            </div>
        </div>
    `).join('');
    refreshMaths();
}

function checkTrap(idx, userChoiceIsTrue) {
    const status = document.getElementById(`trap-status-${idx}`);
    const feedback = document.getElementById(`trap-feedback-${idx}`);
    const buttons = document.getElementById(`trap-buttons-${idx}`);
    
    buttons.classList.add('hidden');
    feedback.classList.remove('hidden');
    
    if (userChoiceIsTrue) {
        // L'utilisateur est tombé dans le piège
        status.className = "p-3 rounded-lg text-sm font-bold mb-4 bg-red-500/10 text-red-400 border border-red-500/20";
        status.innerHTML = "❌ ATTENTION : C'est un piège classique !";
    } else {
        // L'utilisateur a détecté le piège
        status.className = "p-3 rounded-lg text-sm font-bold mb-4 bg-green-500/10 text-green-400 border border-green-500/20";
        status.innerHTML = "✅ BIEN JOUÉ : Tu as détecté l'erreur !";
    }
    refreshMaths();
}

// --- AUTRES MODULES ---

function renderCards() {
    const container = document.getElementById('tab-cards');
    container.innerHTML = CHAPTER_DATA.flashcards.map((c, i) => `
        <div class="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl">
            <p class="text-lg font-medium text-white mb-4">${c.q}</p>
            <div id="hints-${i}" class="space-y-2 mb-4"></div>
            <div class="flex gap-2">
                <button onclick="getHint(${i})" class="bg-amber-500/10 text-amber-500 px-3 py-2 rounded-lg text-[10px] font-bold">INDICE</button>
                <button onclick="toggleElement('ans-${i}')" class="bg-indigo-600 text-white px-3 py-2 rounded-lg text-[10px] font-bold">RÉPONSE</button>
            </div>
            <div id="ans-${i}" class="hidden mt-4 p-4 bg-slate-900 border-l-2 border-green-500 text-sm italic">${c.answers[0]}<button onclick="addPoints(${c.points})" class="block mt-4 text-green-400 text-[10px] font-bold uppercase underline">Maîtrisé</button></div>
        </div>
    `).join('');
    refreshMaths();
}

function renderQuiz() {
    const container = document.getElementById('tab-quiz');
    container.innerHTML = CHAPTER_DATA.quiz.map((q, i) => `
        <div class="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl">
            <p class="text-lg font-medium text-white mb-4">${q.q}</p>
            <div class="space-y-2">${q.type === 'mcq' ? q.options.map((opt, oi) => `<button onclick="checkQuiz(${i}, ${oi})" class="w-full text-left p-3 rounded bg-slate-900 border border-slate-800 text-sm hover:border-indigo-500 transition">${opt}</button>`).join('') : `<div class="flex gap-2"><input type="text" id="quiz-open-${i}" class="flex-1 bg-slate-900 border border-slate-800 rounded p-3 text-sm outline-none focus:border-indigo-500" placeholder="Réponse..."><button onclick="checkQuizOpen(${i})" class="bg-indigo-600 px-4 py-2 rounded font-bold text-xs">OK</button></div>`}</div><div id="quiz-fb-${i}" class="hidden mt-4 p-3 rounded text-sm"></div>
        </div>
    `).join('');
    refreshMaths();
}

function getHint(idx) {
    const card = CHAPTER_DATA.flashcards[idx];
    if (card.usedHints < card.hints.length) {
        document.getElementById(`hints-${idx}`).innerHTML += `<div class="text-[11px] p-2 bg-amber-900/20 text-amber-200 rounded">💡 ${card.hints[card.usedHints]}</div>`;
        card.usedHints++; SCORE -= 2; updateGlobalUI(); refreshMaths();
    }
}

function checkQuiz(qIdx, optIdx) {
    const q = CHAPTER_DATA.quiz[qIdx]; const fb = document.getElementById(`quiz-fb-${qIdx}`); fb.classList.remove('hidden');
    if (optIdx === q.answer) { fb.className = "mt-4 p-3 bg-green-500/10 text-green-400 rounded border border-green-500/20"; fb.innerHTML = `✅ ${q.explanation}`; addPoints(q.points); }
    else { fb.className = "mt-4 p-3 bg-red-500/10 text-red-400 rounded border border-red-500/20"; fb.innerHTML = `❌ ${q.explanation}`; }
    refreshMaths();
}

function toggleElement(id) { document.getElementById(id).classList.toggle('hidden'); refreshMaths(); }
function addPoints(pts) { SCORE += pts; MASTERY[CURRENT_CHAPTER] = Math.min(100, MASTERY[CURRENT_CHAPTER] + Math.floor(pts/5)); updateMasteryDisplay(); updateGlobalUI(); }
function updateMasteryDisplay() { document.getElementById('mastery-label').textContent = `Maîtrise : ${MASTERY[CURRENT_CHAPTER]}%`; document.getElementById('mastery-badge').textContent = Math.floor(MASTERY[CURRENT_CHAPTER]/10)+1; }
function refreshMaths() { if (window.MathJax) window.MathJax.typesetPromise(); }
function showDashboard() { document.getElementById('workspace').classList.add('hidden'); document.getElementById('dashboard').classList.remove('hidden'); updateGlobalUI(); }
