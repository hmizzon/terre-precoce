// ======================
// Puzzle : diagramme de phase de l'eau
// ======================
//
// Principe : on CLIQUE sur une planète pour la "saisir" (elle se met
// en surbrillance), puis on CLIQUE à l'endroit du diagramme où on
// veut la déposer. Si l'endroit correspond à la bonne zone (celle
// portant le même data-target), elle s'y aimante définitivement.
// Ce mode clic/clic (plutôt que glisser-déposer classique) fonctionne
// aussi bien au clic qu'au tactile, sans les soucis de glissement
// continu sur mobile.

const phaseDiagramState = {
    placed: {} // { nomPlanete: true } une fois correctement placée
};

let phaseDiagramSelectedPlanet = null;

/**
 * Initialise (ou réinitialise) le puzzle pour l'écran donné.
 * Appelée automatiquement à chaque chargement d'écran (voir tout en
 * bas) : ne fait rien si l'écran ne contient pas de puzzle.
 */
function initPhaseDiagramPuzzle(screenElement) {

    const container = screenElement.querySelector('.phase-diagram-puzzle');
    if (!container) return;

    phaseDiagramState.placed = {};
    phaseDiagramSelectedPlanet = null;

    container.querySelectorAll('.planet-drag').forEach(planet => {
        planet.classList.remove('placed', 'incorrect', 'selected');
        planet.addEventListener('click', onPhaseDiagramPlanetClick);
    });

    container.addEventListener('click', onPhaseDiagramContainerClick);

    const codeElement = screenElement.querySelector('.phase-diagram-code');
    if (codeElement) {
        codeElement.classList.remove('visible');
    }

}

function onPhaseDiagramPlanetClick(event) {

    // Empêche ce clic de remonter jusqu'au conteneur (qui gère le dépôt)
    event.stopPropagation();

    const planet = event.currentTarget;

    if (planet.classList.contains('placed'))
        return; // déjà correctement posée : plus interactive

    if (phaseDiagramSelectedPlanet === planet) {
        // Reclique sur la planète déjà sélectionnée : annule la saisie
        deselectPhaseDiagramPlanet();
        return;
    }

    deselectPhaseDiagramPlanet();

    phaseDiagramSelectedPlanet = planet;
    planet.classList.add('selected');

}

function deselectPhaseDiagramPlanet() {

    if (phaseDiagramSelectedPlanet) {
        phaseDiagramSelectedPlanet.classList.remove('selected');
    }

    phaseDiagramSelectedPlanet = null;

}

function onPhaseDiagramContainerClick(event) {

    if (!phaseDiagramSelectedPlanet) return;

    const container = event.currentTarget;
    const containerRect = container.getBoundingClientRect();
    const planet = phaseDiagramSelectedPlanet;

    const xPercent = ((event.clientX - containerRect.left) / containerRect.width) * 100;
    const yPercent = ((event.clientY - containerRect.top) / containerRect.height) * 100;

    planet.style.left = `${Math.max(0, Math.min(100, xPercent))}%`;
    planet.style.top = `${Math.max(0, Math.min(100, yPercent))}%`;

    checkPhaseDiagramDrop(planet, container);

    deselectPhaseDiagramPlanet();

}

function checkPhaseDiagramDrop(planet, container) {

    const planetName = planet.dataset.planet;
    const dropZone = container.querySelector(`.drop-zone[data-target="${planetName}"]`);

    if (!dropZone) return;

    const planetRect = planet.getBoundingClientRect();
    const zoneRect = dropZone.getBoundingClientRect();

    const planetCenterX = planetRect.left + planetRect.width / 2;
    const planetCenterY = planetRect.top + planetRect.height / 2;
    const zoneCenterX = zoneRect.left + zoneRect.width / 2;
    const zoneCenterY = zoneRect.top + zoneRect.height / 2;

    const dx = planetCenterX - zoneCenterX;
    const dy = planetCenterY - zoneCenterY;

    // La zone de dépôt elle-même définit la tolérance (sa largeur/hauteur,
    // réglables en CSS via .drop-zone { width / height })
    const withinTolerance =
        Math.abs(dx) <= zoneRect.width / 2 &&
        Math.abs(dy) <= zoneRect.height / 2;

    if (withinTolerance) {

        // Aimante exactement sur la zone
        planet.style.left = dropZone.style.left;
        planet.style.top = dropZone.style.top;

        planet.classList.add('placed');
        planet.classList.remove('incorrect');

        phaseDiagramState.placed[planetName] = true;

        checkPhaseDiagramComplete(container);

    } else {

        planet.classList.add('incorrect');
        setTimeout(() => planet.classList.remove('incorrect'), 400);

    }

}

function checkPhaseDiagramComplete(container) {

    const allPlanets = container.querySelectorAll('.planet-drag');

    const allPlaced = Array.from(allPlanets)
        .every(p => phaseDiagramState.placed[p.dataset.planet]);

    if (!allPlaced) return;

    const screenElement = container.closest('.screen');
    const codeElement = screenElement?.querySelector('.phase-diagram-code');

    if (codeElement) {
        codeElement.classList.add('visible');
    }

}

// Initialise le puzzle à chaque chargement d'écran (screenLoaded est
// déclenché par script.js après l'insertion du nouvel écran dans le DOM)
document.addEventListener('screenLoaded', (event) => {
    const screenElement = document.getElementById(`screen${event.detail.screenNumber}`);
    if (screenElement) {
        initPhaseDiagramPuzzle(screenElement);
    }
});
