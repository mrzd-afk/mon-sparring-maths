/* =======================================================
   SPARRING PARTNER - LOGIQUE INTERACTIVE VRAI/FAUX
   ======================================================= */

let CURRENT_CHAPTER = null;
let CHAPTER_DATA = null;
let SCORE = parseInt(localStorage.getItem('sparring_score') || '0');
let MASTERY = JSON.parse(localStorage.getItem('sparring_mastery') || '{"suites":0, "derivation":0, "globe":0, "probabilites":0}');

window.onload = () => { updateGlobalUI(); };

function updateGlobalUI() {
    const scoreDisplay = document.getElementById('global-score');
    if (scoreDisplay) scoreDisplay.textContent = SCORE.toString().padStart(4, '0');
    
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
        
    } catch (e) { 
        alert("Erreur de chargement. Vérifie tes fichiers JSON sur GitHub.");
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('[id^="tab-btn-"]').forEach(btn => btn.classList.remove('tab-active'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    document.getElementById(`tab-btn-${tabId}`).classList.add('tab-active');
    refreshMaths();
}

// --- SECTION PIÈGES : INTERACTION VRAI / FAUX ---

function renderTraps() {
    const container = document.getElementById('tab-traps');
    if (!CHAPTER_DATA.traps || CHAPTER_DATA.traps.length === 0) {
        container.innerHTML = "<p class='p-6 text-slate-500 italic text-center'>Aucun piège pour cette leçon.</p>";
        return;
    }

    container.innerHTML = CHAPTER_DATA.traps.map((t, i) => `
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl animate-fade">
            <h4 class="text-indigo-400 font-bold uppercase text-[10px] tracking-widest mb-4">Analyse de Situation</h4>
            
            <div class="bg-slate-950 p-5 rounded-2xl border border-slate-800 mb-6">
                <p class="text-slate-300 italic text-sm leading-relaxed">"${t.bad_reasoning}"</p>
            </div>
            
            <div id="trap-logic-${i}">
                <p class="text-center text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest">Ce raisonnement est-il correct ?</p>
                <div class="flex gap-4">
                    <button onclick="handleTrapChoice(${i}, true)" class="flex-1 py-4 bg-slate-800 border border-slate-700 rounded-2xl font-bold text-white hover:bg-red-900/40 hover:border-red-500 transition-all uppercase text-xs">Vrai</button>
                    <button onclick="handleTrapChoice(${i}, false)" class="flex-1 py-4 bg-slate-800 border border-slate-700 rounded-2xl font-bold text-white hover:bg-green-900/40 hover:border-green-500 transition-all uppercase text-xs">Faux</button>
                </div>
            </div>

            <div id="trap-explanation-${i}" class="hidden mt-6 animate-fade">
                <div id="trap-alert-${i}" class="p-4 rounded-xl text-sm font-bold mb-6 text-center"></div>
                
                <div class="space-y-4">
                    <div class="bg-slate-950 p-4 rounded-xl border-l-4 border-indigo-500">
                        <p class="text-[10px] text-indigo-400 font-bold uppercase mb-1">Pourquoi c'est une erreur :</p>
                        <p class="text-sm text-slate-300">${t.error_analysis}</p>
                    </div>
                    <div class="bg-green-900/10 p-4 rounded-xl border-l-4 border-green-500">
                        <p class="text-[10px] text-green-400 font-bold uppercase mb-1">La règle d'or à retenir :</p>
                        <p class="text-sm text-green-100 font-bold">${t.correct_formula}</p>
                    </div>
                </div>
                
                <button onclick="addPoints(${t.points})" class="mt-6 w-full py-3 bg-slate-800 text-slate-500 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition">J'ai compris la règle (+${t.points} pts)</button>
            </div>
        </div>
    `).join('');
    refreshMaths();
}

function handleTrapChoice(idx, chosenTrue) {
    const logicZone = document.getElementById(`trap-logic-${idx}`);
    const explanationZone = document.getElementById(`trap-explanation-${idx}`);
    const alertZone = document.getElementById(`trap-alert-${idx}`);
    
    logicZone.classList.add('hidden');
    explanationZone.classList.remove('hidden');
    
    if (chosenTrue) {
        alertZone.className = "p-4 rounded-xl text-sm font-bold mb-6 text-center bg-red-500/10 text-red-400 border border-red-500/20";
        alertZone.innerHTML = "⚠️ ATTENTION : Tu es tombé dans le piège !";
    } else {
        alertZone.className = "p-4 rounded-xl text-sm font-bold mb-6 text-center bg-green-500/10 text-green-400 border border-green-500/20";
        alertZone.innerHTML = "✨ BRAVO : Tu as bien détecté l'erreur !";
    }
    refreshMaths();
}

// --- AUTRES SECTIONS ---

function renderCards() {
    const container = document.getElementById('tab-cards');
    container.innerHTML = CHAPTER_DATA.flashcards.map((c, i) => `
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
            <p class="text-lg font-medium text-white mb-6">${c.q}</p>
            <div id="hints-${i}" class="space-y-2 mb-4"></div>
            <div class="flex gap-3">
                <button onclick="getHint(${i})" class="bg-amber-500/10 text-amber-500 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest">Indice</button>
                <button onclick="toggleElement('ans-${i}')" class="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest">Réponse</button>
            </div>
            <div id="ans-${i}" class="hidden mt-6 p-5 bg-slate-950 border-l-4 border-green-500 rounded-r-2xl text-sm italic text-slate-300">
                ${c.answers[0]}
                <button onclick="addPoints(${c.points})" class="block mt-4 text-green-400 font-bold uppercase text-[9px] hover:underline">J'avais trouvé ! (+${c.points})</button>
            </div>
        </div>
    `).join('');
    refreshMaths();
}

function renderQuiz() {
    const container = document.getElementById('tab-quiz');
    container.innerHTML = CHAPTER_DATA.quiz.map((q, i) => `
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
            <p class="text-lg font-medium text-white mb-6">${q.q}</p>
            <div class="space-y-3">
                ${q.type === 'mcq' ? q.options.map((opt, oi) => `<button onclick="checkQuiz(${i}, ${oi})" class="w-full text-left p-4 rounded-2xl bg-slate-950 border border-slate-800 text-sm hover:border-indigo-500 transition">${opt}</button>`).join('') : `
                    <div class="flex gap-2"><input type="text" id="quiz-open-${i}" class="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm outline-none focus:border-indigo-500 text-white" placeholder="Réponse..."><button onclick="checkQuizOpen(${i})" class="bg-indigo-600 px-6 rounded-2xl font-bold text-xs uppercase">OK</button></div>
                `}
            </div><div id="quiz-fb-${i}" class="hidden mt-6 p-4 rounded-2xl text-sm"></div>
        </div>
    `).join('');
    refreshMaths();
}

function renderExos() {
    const container = document.getElementById('tab-exos');
    container.innerHTML = CHAPTER_DATA.exercises.map((e, i) => `
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
            <p class="text-lg font-medium text-white mb-8 leading-relaxed">${e.q}</p>
            <div id="exo-actions-${i}">
                <button onclick="askConfirm(${i})" class="w-full py-4 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-600/20 transition">Voir la correction</button>
            </div>
            <div id="exo-confirm-${i}" class="hidden flex flex-col items-center bg-amber-900/10 border border-amber-500/20 p-6 rounded-2xl">
                <p class="text-amber-200 text-xs font-bold mb-4 uppercase">Es-tu sûr d'avoir bien cherché ?</p>
                <div class="flex gap-4 w-full">
                    <button onclick="revealExo(${i})" class="flex-1 bg-amber-500 text-slate-950 py-3 rounded-xl font-bold text-xs uppercase">Oui, dévoiler</button>
                    <button onclick="cancelConfirm(${i})" class="flex-1 bg-slate-700 text-white py-3 rounded-xl font-bold text-xs uppercase">Non, j'essaye encore</button>
                </div>
            </div>
            <div id="exo-sol-${i}" class="hidden mt-8 p-6 bg-slate-950 border border-indigo-500/20 rounded-2xl text-sm text-indigo-100 shadow-inner">
                <p class="font-bold text-indigo-400 uppercase text-[9px] tracking-widest mb-4">Correction complète :</p>
                <div class="leading-relaxed mb-6">${e.solution}</div>
                <button onclick="addPoints(${e.points})" class="w-full bg-indigo-600 text-white py-4 rounded-2xl text-xs font-bold uppercase hover:bg-indigo-500 transition">J'ai terminé l'exercice (+${e.points} pts)</button>
            </div>
        </div>
    `).join('');
    refreshMaths();
}

// --- FONCTIONS TECHNIQUES ---

function askConfirm(i) { document.getElementById(`exo-actions-${i}`).classList.add('hidden'); document.getElementById(`exo-confirm-${i}`).classList.remove('hidden'); }
function cancelConfirm(i) { document.getElementById(`exo-actions-${i}`).classList.remove('hidden'); document.getElementById(`exo-confirm-${i}`).classList.add('hidden'); }
function revealExo(i) { document.getElementById(`exo-confirm-${i}`).classList.add('hidden'); document.getElementById(`exo-sol-${i}`).classList.remove('hidden'); refreshMaths(); }

function getHint(idx) {
    const card = CHAPTER_DATA.flashcards[idx];
    if (card.usedHints < card.hints.length) {
        document.getElementById(`hints-${idx}`).innerHTML += `<div class="text-[11px] p-3 bg-amber-900/20 text-amber-100 rounded-xl border border-amber-500/10 animate-fade">💡 ${card.hints[card.usedHints]}</div>`;
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
function resetStats() { if(confirm("Réinitialiser ?")) { localStorage.clear(); location.reload(); } }
