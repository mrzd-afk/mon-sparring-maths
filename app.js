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
        let fileName = (id === 'globe') ? `svt_${id}.json` : `maths_${id}.json`;
        let response = await fetch(fileName);
        if (!response.ok) throw new Error("Fichier non trouvé sur GitHub");
        
        CHAPTER_DATA = await response.json();
        CURRENT_CHAPTER = id;
        
        document.getElementById('chapter-title').textContent = CHAPTER_DATA.title;
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('workspace').classList.remove('hidden');
        
        switchTab('cards');
        renderCards(); renderQuiz(); renderExos(); renderTraps();
    } catch (e) {
        alert("ERREUR : Impossible de lire " + id + ". Vérifiez le nom du fichier sur GitHub.");
        console.error(e);
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
        <div class="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <p class="font-bold mb-3">${c.q}</p>
            <div id="hints-${i}" class="text-xs text-yellow-400 mb-2"></div>
            <button onclick="toggleElement('ans-${i}')" class="bg-indigo-600 px-3 py-1 rounded text-xs font-bold">VOIR RÉPONSE</button>
            <div id="ans-${i}" class="hidden mt-3 p-3 bg-black rounded text-sm italic border-l-2 border-green-500">
                ${c.answers[0]}
                <button onclick="addPoints(${c.points})" class="block mt-2 text-green-400 font-bold uppercase text-[9px]">Maîtrisé (+${c.points})</button>
            </div>
        </div>
    `).join('');
}

function renderQuiz() {
    const container = document.getElementById('tab-quiz');
    container.innerHTML = CHAPTER_DATA.quiz.map((q, i) => `
        <div class="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <p class="font-bold mb-4">${q.q}</p>
            <div class="space-y-2">
                ${q.options.map((opt, oi) => `<button onclick="checkQuiz(${i}, ${oi})" class="w-full text-left p-3 rounded bg-black border border-gray-700 text-sm hover:border-indigo-500">${opt}</button>`).join('')}
            </div>
            <div id="quiz-fb-${i}" class="hidden mt-3 p-3 rounded text-xs font-bold"></div>
        </div>
    `).join('');
}

function renderExos() {
    const container = document.getElementById('tab-exos');
    container.innerHTML = CHAPTER_DATA.exercises.map((e, i) => `
        <div class="bg-gray-800 p-5 rounded-xl border border-gray-700">
            <p class="mb-4 text-white">${e.q}</p>
            <div id="exo-actions-${i}">
                <button onclick="askConfirm(${i})" class="w-full py-3 bg-indigo-900 text-indigo-300 rounded-lg font-bold text-xs">AFFICHER LA CORRECTION</button>
            </div>
            <div id="exo-confirm-${i}" class="hidden p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg text-center">
                <p class="text-xs font-bold text-yellow-200 mb-2">DÉVOILER LA RÉPONSE ?</p>
                <div class="flex gap-2 justify-center">
                    <button onclick="revealExo(${i})" class="bg-yellow-600 text-black px-4 py-1 rounded font-bold text-xs">OUI</button>
                    <button onclick="cancelConfirm(${i})" class="bg-gray-600 text-white px-4 py-1 rounded font-bold text-xs">NON</button>
                </div>
            </div>
            <div id="exo-sol-${i}" class="hidden mt-4 p-4 bg-black border border-indigo-500 rounded-xl text-sm leading-relaxed">
                ${e.solution}
                <button onclick="addPoints(${e.points})" class="w-full mt-4 bg-indigo-600 py-2 rounded font-bold uppercase text-xs">Terminé (+${e.points})</button>
            </div>
        </div>
    `).join('');
}

function renderTraps() {
    const container = document.getElementById('tab-traps');
    container.innerHTML = CHAPTER_DATA.traps.map((t, i) => `
        <div class="bg-gray-800 p-5 rounded-xl border border-gray-700">
            <h4 class="text-indigo-400 font-bold text-xs mb-3 uppercase tracking-widest">${t.title}</h4>
            <div class="bg-black p-3 rounded border border-gray-700 italic text-sm text-gray-300 mb-4">"${t.bad_reasoning}"</div>
            <div id="trap-logic-${i}" class="text-center">
                <p class="text-xs font-bold text-gray-500 mb-3">CE RAISONNEMENT EST-IL CORRECT ?</p>
                <div class="flex gap-4">
                    <button onclick="handleTrapChoice(${i}, true)" class="flex-1 py-2 bg-gray-700 rounded font-bold hover:bg-red-900 transition text-xs">VRAI</button>
                    <button onclick="handleTrapChoice(${i}, false)" class="flex-1 py-2 bg-gray-700 rounded font-bold hover:bg-green-900 transition text-xs">FAUX</button>
                </div>
            </div>
            <div id="trap-explanation-${i}" class="hidden mt-4 p-4 bg-black border-l-4 border-indigo-500 rounded-r-lg">
                <div id="trap-status-${i}" class="font-bold text-sm mb-2"></div>
                <p class="text-xs text-gray-400 mb-3">${t.error_analysis}</p>
                <p class="text-sm text-green-200 font-bold">${t.correct_formula}</p>
            </div>
        </div>
    `).join('');
}

function askConfirm(i) { document.getElementById(`exo-actions-${i}`).classList.add('hidden'); document.getElementById(`exo-confirm-${i}`).classList.remove('hidden'); }
function cancelConfirm(i) { document.getElementById(`exo-actions-${i}`).classList.remove('hidden'); document.getElementById(`exo-confirm-${i}`).classList.add('hidden'); }
function revealExo(i) { document.getElementById(`exo-confirm-${i}`).classList.add('hidden'); document.getElementById(`exo-sol-${i}`).classList.remove('hidden'); if(window.MathJax) window.MathJax.typesetPromise(); }

function handleTrapChoice(idx, chosenTrue) {
    document.getElementById(`trap-logic-${idx}`).classList.add('hidden');
    document.getElementById(`trap-explanation-${idx}`).classList.remove('hidden');
    const status = document.getElementById(`trap-status-${idx}`);
    if (chosenTrue) {
        status.innerHTML = "❌ ATTENTION : C'est le piège !";
        status.className = "text-red-400 font-bold text-sm mb-2";
    } else {
        status.innerHTML = "✅ BRAVO : Tu as évité le piège !";
        status.className = "text-green-400 font-bold text-sm mb-2";
        addPoints(CHAPTER_DATA.traps[idx].points);
    }
}

function checkQuiz(qIdx, optIdx) {
    const q = CHAPTER_DATA.quiz[qIdx]; const fb = document.getElementById(`quiz-fb-${qIdx}`); fb.classList.remove('hidden');
    if (optIdx === q.answer) { fb.className = "mt-3 p-2 bg-green-900 text-green-200 rounded"; fb.innerHTML = "✅ " + q.explanation; addPoints(q.points); }
    else { fb.className = "mt-3 p-2 bg-red-900 text-red-200 rounded"; fb.innerHTML = "❌ " + q.explanation; }
}

function toggleElement(id) { document.getElementById(id).classList.toggle('hidden'); if(window.MathJax) window.MathJax.typesetPromise(); }
function addPoints(pts) { SCORE += pts; MASTERY[CURRENT_CHAPTER] = Math.min(100, MASTERY[CURRENT_CHAPTER] + Math.floor(pts/5)); updateGlobalUI(); }
function showDashboard() { document.getElementById('workspace').classList.add('hidden'); document.getElementById('dashboard').classList.remove('hidden'); updateGlobalUI(); }
