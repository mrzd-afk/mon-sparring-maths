/* =======================================================
   SPARRING PARTNER - LOGIQUE GLOBALE
   ======================================================= */

let CURRENT_CHAPTER = null;
let CHAPTER_DATA = null;
let SCORE = parseInt(localStorage.getItem('sparring_score') || '0');
let MASTERY = JSON.parse(localStorage.getItem('sparring_mastery') || '{"suites":0, "derivation":0, "globe":0, "probabilites":0}');

window.onload = () => {
    updateGlobalUI();
};

// --- NAVIGATION & UI ---

function updateGlobalUI() {
    // Mise à jour du score global
    const scoreDisplay = document.getElementById('global-score');
    if (scoreDisplay) scoreDisplay.textContent = SCORE.toString().padStart(4, '0');

    // Mise à jour des barres de progression
    const chapters = ['suites', 'derivation', 'globe', 'probabilites'];
    chapters.forEach(id => {
        const bar = document.getElementById(`progress-${id}`);
        if (bar) bar.style.width = `${MASTERY[id]}%`;
    });

    // Sauvegarde locale
    localStorage.setItem('sparring_score', SCORE);
    localStorage.setItem('sparring_mastery', JSON.stringify(MASTERY));
}

async function loadChapter(id) {
    try {
        // Tentative de chargement (soit maths_id.json, soit svt_id.json)
        let response = await fetch(`maths_${id}.json`);
        if (!response.ok) {
            response = await fetch(`svt_${id}.json`);
        }
        
        if (!response.ok) throw new Error("Fichier de leçon manquant ou mal nommé.");
        
        CHAPTER_DATA = await response.json();
        CURRENT_CHAPTER = id;

        // Configuration de l'interface du workspace
        document.getElementById('chapter-title').textContent = CHAPTER_DATA.title;
        updateMasteryDisplay();
        
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('workspace').classList.remove('hidden');
        
        // Initialisation de l'onglet par défaut (Cartes)
        switchTab('cards');
        
        // Génération des contenus
        renderCards();
        renderQuiz();
        renderExos();
        renderTraps();

    } catch (e) {
        alert(`Erreur : Impossible de charger la leçon "${id}".\nVérifie que le fichier JSON est bien sur GitHub avec le bon nom.`);
        console.error(e);
    }
}

function showDashboard() {
    document.getElementById('workspace').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    updateGlobalUI();
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('[id^="tab-btn-"]').forEach(btn => btn.classList.remove('tab-active'));
    
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    document.getElementById(`tab-btn-${tabId}`).classList.add('tab-active');
    
    refreshMaths();
}

// --- RENDU DES CONTENUS ---

function renderCards() {
    const container = document.getElementById('tab-cards');
    container.innerHTML = CHAPTER_DATA.flashcards.map((c, i) => `
        <div class="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl animate-fade">
            <p class="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-2">Question Flash</p>
            <p class="text-lg font-medium text-white mb-4 leading-relaxed">${c.q}</p>
            <div id="hints-${i}" class="space-y-2 mb-4"></div>
            <div class="flex flex-wrap gap-2">
                <button onclick="getHint(${i})" class="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-2 rounded-lg text-xs font-bold hover:bg-amber-500/20 transition">INDICE (-2)</button>
                <button onclick="toggleElement('ans-${i}')" class="bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-indigo-500 transition">RÉPONSE</button>
            </div>
            <div id="ans-${i}" class="hidden mt-4 p-4 bg-slate-900 border-l-4 border-green-500 rounded-r-lg text-sm italic text-slate-300">
                ${c.answers[0]}
                <button onclick="addPoints(${c.points})" class="block mt-4 text-green-400 text-[10px] font-bold uppercase hover:underline">J'avais la bonne réponse (+${c.points})</button>
            </div>
        </div>
    `).join('');
    CHAPTER_DATA.flashcards.forEach(c => c.usedHints = 0);
    refreshMaths();
}

function getHint(idx) {
    const card = CHAPTER_DATA.flashcards[idx];
    if (card.usedHints < card.hints.length) {
        const hintDiv = document.createElement('div');
        hintDiv.className = "text-xs p-3 bg-amber-900/20 border border-amber-500/10 text-amber-200 rounded-lg animate-fade italic";
        hintDiv.textContent = "💡 " + card.hints[card.usedHints];
        document.getElementById(`hints-${idx}`).appendChild(hintDiv);
        
        card.usedHints++;
        SCORE = Math.max(0, SCORE - 2);
        updateGlobalUI();
        refreshMaths();
    }
}

function renderQuiz() {
    const container = document.getElementById('tab-quiz');
    container.innerHTML = CHAPTER_DATA.quiz.map((q, i) => `
        <div class="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl">
            <p class="text-lg font-medium text-white mb-5">${q.q}</p>
            <div class="space-y-2">
                ${q.type === 'mcq' ? q.options.map((opt, oi) => `
                    <button onclick="checkQuiz(${i}, ${oi})" class="w-full text-left p-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-500 transition text-sm">
                        ${opt}
                    </button>
                `).join('') : `
                    <div class="flex gap-2">
                        <input type="text" id="quiz-open-${i}" class="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm outline-none focus:border-indigo-500 text-white" placeholder="Ta réponse...">
                        <button onclick="checkQuizOpen(${i})" class="bg-indigo-600 px-6 py-2 rounded-xl text-sm font-bold">Valider</button>
                    </div>
                `}
            </div>
            <div id="quiz-fb-${i}" class="hidden mt-4 p-4 rounded-xl text-sm font-medium animate-fade"></div>
        </div>
    `).join('');
    refreshMaths();
}

function checkQuiz(qIdx, optIdx) {
    const q = CHAPTER_DATA.quiz[qIdx];
    const fb = document.getElementById(`quiz-fb-${qIdx}`);
    fb.classList.remove('hidden');
    
    if (optIdx === q.answer) {
        fb.className = "mt-4 p-4 rounded-xl text-sm bg-green-500/10 text-green-400 border border-green-500/20 animate-fade";
        fb.innerHTML = `✅ <b>Correct !</b> ${q.explanation || ''}`;
        addPoints(q.points);
    } else {
        fb.className = "mt-4 p-4 rounded-xl text-sm bg-red-500/10 text-red-400 border border-red-500/20 animate-fade";
        fb.innerHTML = `❌ <b>Erreur.</b> ${q.explanation || 'Réessaye !'}`;
    }
    refreshMaths();
}

function checkQuizOpen(i) {
    const input = document.getElementById(`quiz-open-${i}`);
    const val = input.value.toLowerCase().trim();
    const keywords = CHAPTER_DATA.quiz[i].expected_keywords;
    const success = keywords.every(k => val.includes(k.toLowerCase()));
    const fb = document.getElementById(`quiz-fb-${i}`);
    
    fb.classList.remove('hidden');
    if (success) {
        fb.className = "mt-4 p-4 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 animate-fade";
        fb.textContent = "✅ Justification validée par mots-clés !";
        addPoints(CHAPTER_DATA.quiz[i].points);
    } else {
        fb.className = "mt-4 p-4 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 animate-fade";
        fb.textContent = `❌ Il manque des éléments essentiels.`;
    }
}

function renderExos() {
    const container = document.getElementById('tab-exos');
    container.innerHTML = CHAPTER_DATA.exercises.map((e, i) => `
        <div class="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl">
            <div class="flex justify-between items-start mb-4 gap-4">
                <p class="text-lg font-medium text-white flex-1 leading-relaxed">${e.q}</p>
                <div id="timer-${i}" class="font-mono font-bold text-2xl text-indigo-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">--:--</div>
            </div>
            <button id="btn-chrono-${i}" onclick="startChrono(${i}, ${e.time_limit_sec})" class="w-full py-4 bg-green-600/20 text-green-400 border border-green-500/20 rounded-xl font-bold hover:bg-green-600/30 transition text-xs tracking-widest uppercase">
                <i class="fas fa-play mr-2"></i> Lancer l'exercice (${Math.floor(e.time_limit_sec/60)} min)
            </button>
            <div id="exo-sol-${i}" class="hidden mt-6 p-6 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl animate-fade text-sm text-indigo-100">
                <p class="font-bold text-indigo-400 uppercase text-[10px] tracking-widest mb-3">Correction détaillée</p>
                <div class="leading-relaxed">${e.solution}</div>
                <button onclick="addPoints(${e.points})" class="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-bold uppercase hover:bg-indigo-500 transition shadow-lg">J'ai terminé l'exercice (+${e.points})</button>
            </div>
        </div>
    `).join('');
    refreshMaths();
}

function startChrono(idx, sec) {
    const btn = document.getElementById(`btn-chrono-${idx}`);
    const display = document.getElementById(`timer-${idx}`);
    btn.classList.add('hidden');
    let timeLeft = sec;
    
    const interval = setInterval(() => {
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        display.textContent = `${m}:${s.toString().padStart(2,'0')}`;
        
        if (timeLeft <= 10) display.classList.add('text-red-500', 'animate-pulse');
        
        if (timeLeft <= 0) {
            clearInterval(interval);
            display.textContent = "FINI";
            document.getElementById(`exo-sol-${idx}`).classList.remove('hidden');
            refreshMaths();
        }
        timeLeft--;
    }, 1000);

    const solBtn = document.createElement('button');
    solBtn.className = "w-full py-4 bg-slate-800 text-white rounded-xl font-bold mt-2 text-xs uppercase tracking-widest hover:bg-slate-700 transition";
    solBtn.innerHTML = '<i class="fas fa-eye mr-2"></i> Voir la solution';
    solBtn.onclick = () => {
        clearInterval(interval);
        document.getElementById(`exo-sol-${idx}`).classList.remove('hidden');
        solBtn.remove();
        refreshMaths();
    };
    btn.parentNode.appendChild(solBtn);
}

function renderTraps() {
    const container = document.getElementById('tab-traps');
    if (!CHAPTER_DATA.traps || CHAPTER_DATA.traps.length === 0) {
        container.innerHTML = "<p class='text-slate-500 italic p-6 text-center'>Aucun piège listé pour ce chapitre.</p>";
        return;
    }
    container.innerHTML = CHAPTER_DATA.traps.map((t, i) => `
        <div class="bg-red-950/10 border border-red-500/20 p-6 rounded-2xl animate-fade">
            <h4 class="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                <i class="fas fa-skull-crossbones"></i> ${t.title}
            </h4>
            <div class="bg-slate-900/80 p-5 rounded-xl border border-slate-800 mb-4">
                <p class="text-[10px] text-red-500 uppercase font-bold mb-2 tracking-widest">Le faux raisonnement :</p>
                <p class="italic text-slate-300 leading-relaxed text-sm">"${t.bad_reasoning}"</p>
            </div>
            <button onclick="toggleElement('trap-sol-${i}')" class="text-xs font-bold text-white bg-red-600 px-5 py-2 rounded-lg hover:bg-red-500 transition shadow-lg uppercase">
                Comment éviter ce piège ?
            </button>
            <div id="trap-sol-${i}" class="hidden mt-6 bg-slate-900 p-5 rounded-xl border border-slate-800 animate-fade">
                <div class="mb-4">
                    <p class="text-xs text-red-400 font-bold uppercase mb-1 tracking-tighter">L'erreur expliquée :</p>
                    <p class="text-sm text-slate-300 leading-relaxed">${t.error_analysis}</p>
                </div>
                <div class="border-t border-slate-800 pt-4">
                    <p class="text-xs text-green-400 font-bold uppercase mb-1 tracking-tighter">La règle à appliquer :</p>
                    <p class="text-sm text-green-200 leading-relaxed font-bold">${t.correct_formula}</p>
                </div>
                <button onclick="addPoints(${t.points})" class="mt-6 text-[10px] text-slate-500 hover:text-white uppercase font-bold transition">Bien compris (+${t.points})</button>
            </div>
        </div>
    `).join('');
    refreshMaths();
}

// --- UTILS & MATHS ---

function toggleElement(id) {
    const el = document.getElementById(id);
    el.classList.toggle('hidden');
    refreshMaths();
}

function addPoints(pts) {
    SCORE += pts;
    // La maîtrise augmente en fonction des points gagnés (ratio ajustable)
    MASTERY[CURRENT_CHAPTER] = Math.min(100, MASTERY[CURRENT_CHAPTER] + Math.floor(pts/5));
    updateMasteryDisplay();
    updateGlobalUI();
}

function updateMasteryDisplay() {
    const val = MASTERY[CURRENT_CHAPTER];
    document.getElementById('mastery-label').textContent = `Maîtrise : ${val}%`;
    // Le badge change de chiffre tous les 10%
    document.getElementById('mastery-badge').textContent = Math.floor(val/10) + 1;
}

function refreshMaths() {
    if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise();
    }
}

function resetStats() {
    if (confirm("Attention : ta progression et ton score vont être remis à zéro. Continuer ?")) {
        localStorage.clear();
        location.reload();
    }
}
