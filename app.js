/* ==== app.js – Version MathJax OK ==== */
let CURRENT_CHAPTER = null;
let CHAPTER_DATA = null;
let SCORE = parseInt(localStorage.getItem('sparring_score') || '0');
let MASTERY = JSON.parse(localStorage.getItem('sparring_mastery') || '{"suites":0, "derivation":0}');

window.onload = () => { updateGlobalUI(); };

function updateGlobalUI() {
    document.getElementById('global-score').textContent = SCORE.toString().padStart(4, '0');
    if(document.getElementById('progress-suites')) document.getElementById('progress-suites').style.width = `${MASTERY.suites}%`;
    if(document.getElementById('progress-derivation')) document.getElementById('progress-derivation').style.width = `${MASTERY.derivation}%`;
    localStorage.setItem('sparring_score', SCORE);
    localStorage.setItem('sparring_mastery', JSON.stringify(MASTERY));
}

async function loadChapter(id) {
    try {
        const response = await fetch(`maths_${id}.json`);
        if (!response.ok) throw new Error("Fichier non trouvé");
        CHAPTER_DATA = await response.json();
        CURRENT_CHAPTER = id;

        document.getElementById('chapter-title').textContent = CHAPTER_DATA.title;
        document.getElementById('mastery-label').textContent = `Maîtrise : ${MASTERY[id]}%`;
        
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('workspace').classList.remove('hidden');
        
        // On lance l'affichage
        switchTab('cards');
        renderCards();
        renderQuiz();
        renderExos();
        renderTraps();

    } catch (e) {
        alert("Erreur lors du chargement du chapitre : " + e.message);
    }
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
        <div class="bg-slate-800/50 border border-slate-700 p-5 rounded-xl mb-4">
            <p class="text-lg mb-4">${c.q}</p>
            <div id="hints-${i}" class="space-y-2 mb-4"></div>
            <div class="flex gap-2">
                <button onclick="getHint(${i})" class="bg-amber-500/10 text-amber-500 p-2 rounded text-xs">Indice</button>
                <button onclick="toggleElement('ans-${i}')" class="bg-indigo-500 p-2 rounded text-xs">Réponse</button>
            </div>
            <div id="ans-${i}" class="hidden mt-4 p-4 bg-slate-900 border-l-2 border-green-500">${c.answers[0]}</div>
        </div>
    `).join('');
    CHAPTER_DATA.flashcards.forEach(c => c.usedHints = 0);
    if (window.MathJax) MathJax.typesetPromise(); // <--- Ligne magique
}

function getHint(idx) {
    const card = CHAPTER_DATA.flashcards[idx];
    if (card.usedHints < card.hints.length) {
        const hZone = document.getElementById(`hints-${idx}`);
        hZone.innerHTML += `<div class="text-xs p-2 bg-amber-900/20 text-amber-200 rounded">${card.hints[card.usedHints]}</div>`;
        card.usedHints++;
        SCORE -= 2; updateGlobalUI();
        if (window.MathJax) MathJax.typesetPromise(); // <--- Ligne magique
    }
}

function renderQuiz() {
    const container = document.getElementById('tab-quiz');
    container.innerHTML = CHAPTER_DATA.quiz.map((q, i) => `
        <div class="bg-slate-800/50 p-5 rounded-xl border border-slate-700 mb-4">
            <p class="mb-4">${q.q}</p>
            <div class="space-y-2">
                ${q.type === 'mcq' ? q.options.map((opt, oi) => `<button onclick="checkQuiz(${i}, ${oi})" class="w-full text-left p-2 bg-slate-900 border border-slate-700 rounded text-sm">${opt}</button>`).join('') : ''}
            </div>
            <div id="quiz-fb-${i}" class="hidden mt-4 p-2 rounded text-xs"></div>
        </div>
    `).join('');
    if (window.MathJax) MathJax.typesetPromise();
}

function checkQuiz(qIdx, optIdx) {
    const q = CHAPTER_DATA.quiz[qIdx];
    const fb = document.getElementById(`quiz-fb-${qIdx}`);
    fb.classList.remove('hidden');
    fb.innerHTML = (optIdx === q.answer) ? `✅ Correct ! ${q.explanation}` : `❌ Faux. ${q.explanation}`;
    fb.className = (optIdx === q.answer) ? "mt-4 p-2 bg-green-900/20 text-green-400 rounded" : "mt-4 p-2 bg-red-900/20 text-red-400 rounded";
    if (optIdx === q.answer) { SCORE += q.points; updateGlobalUI(); }
    if (window.MathJax) MathJax.typesetPromise();
}

function renderExos() {
    const container = document.getElementById('tab-exos');
    container.innerHTML = CHAPTER_DATA.exercises.map((e, i) => `
        <div class="bg-slate-800/50 p-5 rounded-xl border border-slate-700 mb-4">
            <div class="flex justify-between items-start mb-4"><p class="flex-1">${e.q}</p><div id="timer-${i}" class="text-indigo-400 font-bold ml-4">--:--</div></div>
            <button id="btn-chrono-${i}" onclick="startChrono(${i}, ${e.time_limit_sec})" class="w-full py-2 bg-green-600/20 text-green-400 border border-green-500/20 rounded font-bold">LANCER LE CHRONO</button>
            <div id="exo-sol-${i}" class="hidden p-4 bg-indigo-950/30 border border-indigo-500/30 rounded mt-4">${e.solution}</div>
        </div>
    `).join('');
    if (window.MathJax) MathJax.typesetPromise();
}

function startChrono(idx, sec) {
    const btn = document.getElementById(`btn-chrono-${idx}`);
    const display = document.getElementById(`timer-${idx}`);
    btn.classList.add('hidden');
    let timeLeft = sec;
    const interval = setInterval(() => {
        let m = Math.floor(timeLeft / 60); let s = timeLeft % 60;
        display.textContent = `${m}:${s.toString().padStart(2,'0')}`;
        if (timeLeft <= 0) { clearInterval(interval); document.getElementById(`exo-sol-${idx}`).classList.remove('hidden'); if (window.MathJax) MathJax.typesetPromise();}
        timeLeft--;
    }, 1000);
}

function renderTraps() {
    const container = document.getElementById('tab-traps');
    if (!CHAPTER_DATA.traps) return;
    container.innerHTML = CHAPTER_DATA.traps.map((t, i) => `
        <div class="bg-red-950/10 border border-red-500/20 p-6 rounded-2xl mb-4">
            <h4 class="text-red-400 font-bold mb-2">${t.title}</h4>
            <p class="italic text-slate-300 mb-4">${t.bad_reasoning}</p>
            <button onclick="toggleElement('trap-sol-${i}')" class="bg-red-600 px-3 py-1 rounded text-xs">DÉMASQUER</button>
            <div id="trap-sol-${i}" class="hidden mt-4 p-4 bg-slate-900 rounded text-sm">
                <p><span class="text-red-400 font-bold">Erreur :</span> ${t.error_analysis}</p>
                <p class="mt-2"><span class="text-green-400 font-bold">Méthode :</span> ${t.correct_formula}</p>
            </div>
        </div>
    `).join('');
    if (window.MathJax) MathJax.typesetPromise();
}

function toggleElement(id) { document.getElementById(id).classList.toggle('hidden'); if (window.MathJax) MathJax.typesetPromise(); }
function showDashboard() { document.getElementById('workspace').classList.add('hidden'); document.getElementById('dashboard').classList.remove('hidden'); updateGlobalUI(); }
function resetStats() { if(confirm("Réinitialiser ?")) { localStorage.clear(); location.reload(); } }

