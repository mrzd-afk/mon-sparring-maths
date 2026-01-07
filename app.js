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
        if (!response.ok) throw new Error();
        CHAPTER_DATA = await response.json();
        CURRENT_CHAPTER = id;
        document.getElementById('chapter-title').textContent = CHAPTER_DATA.title;
        updateMasteryDisplay();
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('workspace').classList.remove('hidden');
        switchTab('cards');
        renderCards(); renderQuiz(); renderExos(); renderTraps();
    } catch (e) { alert("Erreur : Fichier JSON manquant ou corrompu."); }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('[id^="tab-btn-"]').forEach(btn => btn.classList.remove('tab-active'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    document.getElementById(`tab-btn-${tabId}`).classList.add('tab-active');
    refreshMaths();
}

function renderCards() {
    const container = document.getElementById('tab-cards');
    container.innerHTML = CHAPTER_DATA.flashcards.map((c, i) => `
        <div class="bg-gray-800 border border-gray-700 p-5 rounded-2xl">
            <p class="text-lg text-white mb-4">${c.q}</p>
            <div id="hints-${i}" class="space-y-2 mb-4"></div>
            <div class="flex gap-2">
                <button onclick="getHint(${i})" class="bg-yellow-900 text-yellow-400 px-3 py-2 rounded-lg text-[10px] font-bold">INDICE</button>
                <button onclick="toggleElement('ans-${i}')" class="bg-indigo-600 text-white px-3 py-2 rounded-lg text-[10px] font-bold">RÉPONSE</button>
            </div>
            <div id="ans-${i}" class="hidden mt-4 p-4 bg-black border-l-2 border-green-500 text-sm italic">${c.answers[0]}<button onclick="addPoints(${c.points})" class="block mt-4 text-green-400 font-bold uppercase underline text-[10px]">Maîtrisé (+${c.points})</button></div>
        </div>
    `).join('');
}

function renderQuiz() {
    const container = document.getElementById('tab-quiz');
    container.innerHTML = CHAPTER_DATA.quiz.map((q, i) => `
        <div class="bg-gray-800 border border-gray-700 p-5 rounded-2xl">
            <p class="text-lg text-white mb-4">${q.q}</p>
            <div class="space-y-2">${q.type === 'mcq' ? q.options.map((opt, oi) => `<button onclick="checkQuiz(${i}, ${oi})" class="w-full text-left p-3 rounded bg-black border border-gray-700 text-sm hover:border-indigo-500">${opt}</button>`).join('') : `
                <div class="flex gap-2"><input type="text" id="quiz-open-${i}" class="flex-1 bg-black border border-gray-700 rounded p-3 text-sm text-white" placeholder="Réponse..."><button onclick="checkQuizOpen(${i})" class="bg-indigo-600 px-4 rounded font-bold text-xs uppercase text-white">OK</button></div>
            `}</div><div id="quiz-fb-${i}" class="hidden mt-4 p-3 rounded text-sm"></div>
        </div>
    `).join('');
}

function renderExos() {
    const container = document.getElementById('tab-exos');
    container.innerHTML = CHAPTER_DATA.exercises.map((e, i) => `
        <div class="bg-gray-800 border border-gray-700 p-6 rounded-2xl">
            <p class="text-lg text-white mb-6">${e.q}</p>
            <div id="exo-actions-${i}"><button onclick="askConfirm(${i})" class="w-full py-4 bg-indigo-900 text-indigo-400 border border-indigo-700 rounded-xl font-bold text-xs uppercase">Afficher la solution</button></div>
            <div id="exo-confirm-${i}" class="hidden flex flex-col items-center bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-xl">
                <p class="text-yellow-200 text-xs font-bold mb-4 uppercase">Êtes-vous sûr de vouloir dévoiler la correction ?</p>
                <div class="flex gap-4"><button onclick="revealExo(${i})" class="bg-yellow-600 text-black px-6 py-2 rounded-lg font-bold text-xs uppercase">OUI</button><button onclick="cancelConfirm(${i})" class="bg-gray-700 text-white px-6 py-2 rounded-lg font-bold text-xs uppercase">NON</button></div>
            </div>
            <div id="exo-sol-${i}" class="hidden mt-6 p-5 bg-black border border-indigo-900 rounded-2xl text-sm text-indigo-100">${e.solution}<button onclick="addPoints(${e.points})" class="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl text-xs font-bold uppercase">Terminé (+${e.points} pts)</button></div>
        </div>
    `).join('');
}

function renderTraps() {
    const container = document.getElementById('tab-traps');
    container.innerHTML = CHAPTER_DATA.traps.map((t, i) => `
        <div class="bg-gray-800 border border-gray-700 p-6 rounded-2xl">
            <h4 class="text-indigo-400 font-bold uppercase text-xs mb-4">${t.title}</h4>
            <div class="bg-black p-4 rounded-xl border border-gray-700 mb-6 italic text-sm text-gray-300">"${t.bad_reasoning}"</div>
            <div id="trap-logic-${i}">
                <p class="text-center text-xs font-bold text-gray-500 mb-4 uppercase">Ce raisonnement est-il correct ?</p>
                <div class="flex gap-4"><button onclick="handleTrapChoice(${i}, true)" class="flex-1 py-3 bg-gray-700 border border-gray-600 rounded-xl font-bold hover:bg-red-900 transition uppercase text-xs">Vrai</button><button onclick="handleTrapChoice(${i}, false)" class="flex-1 py-3 bg-gray-700 border border-gray-600 rounded-xl font-bold hover:bg-green-900 transition uppercase text-xs">Faux</button></div>
            </div>
            <div id="trap-explanation-${i}" class="hidden mt-6">
                <div id="trap-alert-${i}" class="p-3 rounded-lg text-sm font-bold mb-4 text-center"></div>
                <div class="bg-black border-l-4 border-indigo-500 p-4 rounded-r-xl">
                    <p class="text-[10px] text-indigo-400 font-bold uppercase mb-2">Pourquoi c'est une erreur :</p><p class="text-sm text-gray-300 mb-4">${t.error_analysis}</p>
                    <p class="text-[10px] text-green-400 font-bold uppercase mb-1">La règle d'or :</p><p class="text-sm text-green-100 font-bold underline">${t.correct_formula}</p>
                </div>
                <button onclick="addPoints(${t.points})" class="mt-4 w-full text-[10px] text-gray-500 uppercase font-bold">Compris (+${t.points} pts)</button>
            </div>
        </div>
    `).join('');
}

function askConfirm(i) { document.getElementById(`exo-actions-${i}`).classList.add('hidden'); document.getElementById(`exo-confirm-${i}`).classList.remove('hidden'); }
function cancelConfirm(i) { document.getElementById(`exo-actions-${i}`).classList.remove('hidden'); document.getElementById(`exo-confirm-${i}`).classList.add('hidden'); }
function revealExo(i) { document.getElementById(`exo-confirm-${i}`).classList.add('hidden'); document.getElementById(`exo-sol-${i}`).classList.remove('hidden'); refreshMaths(); }
function handleTrapChoice(idx, chosenTrue) {
    document.getElementById(`trap-logic-${idx}`).classList.add('hidden'); document.getElementById(`trap-explanation-${idx}`).classList.remove('hidden');
    const alertZone = document.getElementById(`trap-alert-${idx}`);
    if (chosenTrue) { alertZone.className = "p-3 bg-red-900 text-red-100 rounded-lg text-xs font-bold mb-4"; alertZone.innerHTML = "⚠️ ATTENTION : C'est le piège !"; }
    else { alertZone.className = "p-3 bg-green-900 text-green-100 rounded-lg text-xs font-bold mb-4"; alertZone.innerHTML = "✨ BRAVO : Tu as détecté l'erreur !"; addPoints(CHAPTER_DATA.traps[idx].points); }
    refreshMaths();
}
function getHint(idx) {
    const card = CHAPTER_DATA.flashcards[idx];
    if (card.usedHints < card.hints.length) {
        document.getElementById(`hints-${idx}`).innerHTML += `<div class="text-[11px] p-2 bg-yellow-900/30 text-yellow-200 rounded">💡 ${card.hints[card.usedHints]}</div>`;
        card.usedHints++; SCORE -= 2; updateGlobalUI();
    }
}
function checkQuiz(qIdx, optIdx) {
    const q = CHAPTER_DATA.quiz[qIdx]; const fb = document.getElementById(`quiz-fb-${qIdx}`); fb.classList.remove('hidden');
    if (optIdx === q.answer) { fb.className = "mt-4 p-3 bg-green-900 text-green-100 rounded text-xs"; fb.innerHTML = `✅ ${q.explanation}`; addPoints(q.points); }
    else { fb.className = "mt-4 p-3 bg-red-900 text-red-100 rounded text-xs"; fb.innerHTML = `❌ ${q.explanation}`; }
    refreshMaths();
}
function toggleElement(id) { document.getElementById(id).classList.toggle('hidden'); refreshMaths(); }
function addPoints(pts) { SCORE += pts; MASTERY[CURRENT_CHAPTER] = Math.min(100, MASTERY[CURRENT_CHAPTER] + Math.floor(pts/5)); updateMasteryDisplay(); updateGlobalUI(); }
function updateMasteryDisplay() { document.getElementById('mastery-label').textContent = `Maîtrise : ${MASTERY[CURRENT_CHAPTER]}%`; document.getElementById('mastery-badge').textContent = Math.floor(MASTERY[CURRENT_CHAPTER]/10)+1; }
function refreshMaths() { if (window.MathJax) window.MathJax.typesetPromise(); }
function showDashboard() { document.getElementById('workspace').classList.add('hidden'); document.getElementById('dashboard').classList.remove('hidden'); updateGlobalUI(); }
