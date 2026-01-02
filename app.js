/* =======================================================
   APP.JS - SPARRING PARTNER (Version Complète & Corrigée)
   ======================================================= */

// --- ÉTAT GLOBAL DE L'APPLICATION ---
let CURRENT_CHAPTER = null;
let CHAPTER_DATA = null;
let SCORE = parseInt(localStorage.getItem('sparring_score') || '0');

// Initialisation de la maîtrise (Progression par chapitre)
let MASTERY = JSON.parse(localStorage.getItem('sparring_mastery') || '{"suites":0, "derivation":0, "globe":0}');

// --- INITIALISATION AU CHARGEMENT ---
window.onload = () => {
    updateGlobalUI();
};

// --- NAVIGATION & UI ---

// Met à jour les scores et les barres de progression sur le menu
function updateGlobalUI() {
    const scoreEl = document.getElementById('global-score');
    if (scoreEl) scoreEl.textContent = SCORE.toString().padStart(4, '0');

    // Mise à jour des barres de progression si elles existent
    if (document.getElementById('progress-suites')) 
        document.getElementById('progress-suites').style.width = `${MASTERY.suites}%`;
    if (document.getElementById('progress-derivation')) 
        document.getElementById('progress-derivation').style.width = `${MASTERY.derivation}%`;
    if (document.getElementById('progress-globe')) 
        document.getElementById('progress-globe').style.width = `${MASTERY.globe}%`;

    // Sauvegarde locale
    localStorage.setItem('sparring_score', SCORE);
    localStorage.setItem('sparring_mastery', JSON.stringify(MASTERY));
}

// Charge les données d'un chapitre (Suites, Dérivation ou Globe)
async function loadChapter(id) {
    try {
        // Chargement du fichier JSON
        const response = await fetch(`maths_${id}.json`).catch(() => fetch(`svt_${id}.json`));
        if (!response.ok) throw new Error("Fichier non trouvé");
        
        CHAPTER_DATA = await response.json();
        CURRENT_CHAPTER = id;

        // Mise à jour de l'interface
        document.getElementById('chapter-title').textContent = CHAPTER_DATA.title;
        updateMasteryDisplay();
        
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('workspace').classList.remove('hidden');
        
        // Par défaut, on affiche l'onglet des Flash-cards
        switchTab('cards');
        
        // On génère le contenu
        renderCards();
        renderQuiz();
        renderExos();
        renderTraps();

    } catch (e) {
        alert("Erreur : Le fichier 'maths_" + id + ".json' ou 'svt_" + id + ".json' est introuvable sur GitHub.");
        console.error(e);
    }
}

function showDashboard() {
    document.getElementById('workspace').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    updateGlobalUI();
}

function switchTab(tab) {
    // Masquer tous les contenus
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    // Dé-selectionner tous les boutons
    document.querySelectorAll('[id^="tab-btn-"]').forEach(b => b.classList.remove('tab-active'));
    
    // Afficher le contenu actif
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    document.getElementById(`tab-btn-${tab}`).classList.add('tab-active');
}

// --- MODULE FLASH-CARDS ---

function renderCards() {
    const container = document.getElementById('tab-cards');
    container.innerHTML = CHAPTER_DATA.flashcards.map((c, i) => `
        <div class="bg-slate-800/50 border border-slate-700 p-5 rounded-xl mb-4 animate-fade-in">
            <p class="text-indigo-300 text-[10px] font-bold mb-2 uppercase tracking-widest">Question Sparring</p>
            <p class="text-lg font-medium mb-4">${c.q}</p>
            <div id="hints-${i}" class="space-y-2 mb-4"></div>
            <div class="flex flex-wrap gap-2">
                <button onclick="getHint(${i})" class="text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-2 rounded-lg hover:bg-amber-500/20 transition">
                    <i class="fas fa-lightbulb mr-1"></i> Indice (-2 pts)
                </button>
                <button onclick="toggleElement('ans-${i}')" class="text-xs bg-indigo-500 text-white px-3 py-2 rounded-lg hover:bg-indigo-400 transition">
                    Vérifier la réponse
                </button>
            </div>
            <div id="ans-${i}" class="hidden mt-4 p-4 bg-slate-900 border-l-2 border-green-500 text-sm text-slate-300 italic">
                ${c.answers[0]}
                <div class="mt-4 flex gap-2">
                    <button onclick="validateExo(${c.points}, ${i}, 'card')" class="bg-green-600/20 text-green-400 text-[10px] px-2 py-1 rounded hover:bg-green-600/40 uppercase">J'avais la bonne réponse</button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Reset des indices utilisés
    CHAPTER_DATA.flashcards.forEach(c => c.usedHints = 0);
    refreshMaths();
}

function getHint(idx) {
    const card = CHAPTER_DATA.flashcards[idx];
    if (card.usedHints < card.hints.length) {
        const hZone = document.getElementById(`hints-${idx}`);
