console.log("Le script est chargé");

// Variables globales
let currentScreen = 1;
const totalScreens = 26;

// Initialise les questions du QCM (sera mise à jour par les écrans)
window.qcmQuestions = [];

// Fonction pour positionner les éléments
function positionElements() {
    const elements = document.querySelectorAll('.positionnable');
    elements.forEach(element => {
        const x = element.getAttribute('data-x');
        const y = element.getAttribute('data-y');
        if (x && y) {
            element.style.left = x + '%';
            element.style.top = y + '%';
        }
    });
}

// Reapply positions on window resize and load
//window.addEventListener('resize', positionElements);
//window.addEventListener('load', positionElements);


// Variable globale pour suivre l'état des transitions
let isTransitioning = false;

// Fonction pour récupérer la durée d'une transition depuis les variables CSS
function getTransitionDuration(transitionType) {
    const root = document.documentElement;
    const durationInSeconds = parseFloat(getComputedStyle(root).getPropertyValue(`--${transitionType}-duration`));
    return durationInSeconds * 1000; // Convertir en millisecondes
}

// Surcharge temporairement la variable CSS de durée (ex: --fade-duration),
// pour que l'animation CSS elle-même respecte le paramètre duration
// passé à goToScreen, et pas seulement le délai d'attente en JS.
function setTransitionDurationVar(transitionType, durationMs) {
    document.documentElement.style.setProperty(
        `--${transitionType}-duration`,
        `${durationMs / 1000}s`
    );
}

// Restaure la valeur d'origine (définie dans la feuille de style)
function clearTransitionDurationVar(transitionType) {
    document.documentElement.style.removeProperty(`--${transitionType}-duration`);
}

function waitTransition(transitionType, overrideDuration = null) {

    const duration = overrideDuration ?? (getTransitionDuration(transitionType) || 1000);

    return new Promise(resolve => {
        setTimeout(resolve, duration);
    });

}

// Fonction pour changer d'écran avec transition
// duration (optionnel) : durée en millisecondes, remplace celle définie
// dans les variables CSS (--fade-duration, --wipe-duration, etc.) pour
// cet appel uniquement.
async function goToScreen(screenNumber, transitionType = null, duration = null){

    if(isTransitioning)
        return;

    isTransitioning=true;

    try{

        switch (true) {

            case transitionType == null:
                await loadScreen(screenNumber);
                break;

            case transitionType === "fade":
                await playFadeTransition(screenNumber, duration);
                break;

            case transitionType === "travel":
                await playTravelTransition(screenNumber, duration);
                break;

            case transitionType.startsWith("wipe"):
                await playWipeTransition(screenNumber, transitionType, duration);
                break;

            case transitionType === "zoom":
                await playZoomTransition(screenNumber, duration);
                break;

            case transitionType === "pixel":
                await playPixelTransition(screenNumber, duration);
                break;

        }

    }

    catch(error){

        console.error(error);

    }

    finally{

        isTransitioning=false;

    }

}



/**
 * Démarre le typewriter pour un écran, si celui-ci en contient un.
 * Fonction séparée pour pouvoir être appelée soit immédiatement
 * (initializeScreen), soit manuellement une fois une transition
 * réellement terminée (voir playWipeTransition, playPixelTransition).
 */
function startTypewriterForScreen(screenElement) {

    const hasTextSource = screenElement.querySelector(".text-source");
    const hasTextContainer = screenElement.querySelector(".text-container");

    if (hasTextSource && hasTextContainer) {
        initTypewriterForScreen(screenElement);
    }

}

/**
 * Initialise un écran après son insertion dans le DOM
 */
function initializeScreen(screenElement, screenNumber, delayTypewriter = false) {

    screenElement.style.display = "block";

    // Positionnement des éléments
    positionElements();

    // Initialisations nécessaires à l'écran
    screens[screenNumber]?.init?.();

    // Typewriter : si delayTypewriter est vrai, on ne le démarre pas ici.
    // C'est à l'appelant (la transition en cours) de l'appeler lui-même
    // via startTypewriterForScreen(), une fois la transition réellement
    // terminée.
    if (!delayTypewriter) {
        startTypewriterForScreen(screenElement);
    }

    // Evènement personnalisé

    document.dispatchEvent(
        new CustomEvent("screenLoaded", {
            detail: { screenNumber }
        })
    );

}

/**
 * Charge un écran
 * @param {number} screenNumber
 * @param {boolean} keepCurrentScreen
 * @returns {Promise<HTMLElement>}
 */
async function loadScreen(screenNumber, keepCurrentScreen = false, delayTypewriter = false) {
    currentScreen = screenNumber;

    try {
        const response = await fetch(`screens/screen${screenNumber}.html`);
        if (!response.ok) {
            throw new Error(`Impossible de charger screen${screenNumber}.html`);
        }

        const html = await response.text();
        const tempContainer = document.createElement("div");
        tempContainer.innerHTML = html;

        const newScreen = tempContainer.querySelector(".screen");
        if (!newScreen) {
            throw new Error("Aucun élément .screen trouvé.");
        }

        const gameContainer = document.getElementById("game-container");
        if (!keepCurrentScreen) {
            gameContainer.innerHTML = "";
        }

        gameContainer.appendChild(newScreen);

        // Attendre que les images soient chargées
        const images = newScreen.querySelectorAll("img");
        const imagePromises = Array.from(images).map(img => {
            if (img.complete) {
                return Promise.resolve();
            } else {
                return new Promise(resolve => {
                    img.addEventListener("load", resolve, { once: true });
                });
            }
        });

        await Promise.all(imagePromises);

        initializeScreen(newScreen, screenNumber, delayTypewriter);
        return newScreen;
    } catch (error) {
        console.error("Erreur lors du chargement :", error);
        throw error;
    }
}

/**
 * Transition "volet"
 */
async function playWipeTransition(screenNumber, direction, duration = null) {

    if (duration != null) setTransitionDurationVar("wipe", duration);

    const gameContainer = document.getElementById("game-container");

    const oldScreen = gameContainer.querySelector(".screen");

    if (!oldScreen) {

        await loadScreen(screenNumber);

        if (duration != null) clearTransitionDurationVar("wipe");

        return;

    }

    // Charge le nouvel écran sans supprimer l'ancien.
    // delayTypewriter=true : le texte n'apparaîtra qu'une fois le
    // balayage terminé (voir startTypewriterForScreen plus bas).
    const newScreen = await loadScreen(screenNumber, true, true);

    // Force un rafraîchissement du navigateur
    await new Promise(resolve => requestAnimationFrame(resolve));

    // Classe commune
    newScreen.classList.add("in");

    // Direction de l'animation
    newScreen.classList.add(direction);

    oldScreen.classList.add("out");

    const wipeDuration = duration ?? (getTransitionDuration("wipe") || 1000);

    await new Promise(resolve => setTimeout(resolve, wipeDuration));

    // Nettoyage
    oldScreen.remove();

    newScreen.classList.remove("wipe");
    newScreen.classList.remove(direction);

    // La transition est maintenant réellement terminée : on peut
    // afficher le texte du typewriter.
    startTypewriterForScreen(newScreen);

    if (duration != null) clearTransitionDurationVar("wipe");

}

function showTransition(name) {
    const transition = document.getElementById("transition-container");
    transition.className = name;
    transition.style.display = "block";
}

function hideTransition() {
    const transition = document.getElementById("transition-container");
    transition.className = "";
    transition.style.display = "none";
}


async function playZoomTransition(screenNumber, duration = null){

    const gameContainer = document.getElementById("game-container");

    const oldScreen = gameContainer.querySelector(".screen");

    if(!oldScreen){
        await loadScreen(screenNumber);
        return;
    }

    oldScreen.classList.add("zoom-out");

    const zoomDuration = duration ?? (getTransitionDuration("zoom") || 2500);

    await new Promise(resolve =>
        setTimeout(resolve, zoomDuration * 0.8)
    );

    await playFadeTransition(screenNumber, duration);
}

// Transition pixellisation pour les ordis
async function playPixelTransition(screenNumber, duration = null) {
    const gameContainer = document.getElementById("game-container");
    const oldScreen = gameContainer.querySelector(".screen");

    if (!oldScreen) {
        // Pas d'écran précédent : rien à animer, le texte peut
        // s'afficher immédiatement.
        await loadScreen(screenNumber, false, false);
        return;
    }

    const pixelDuration = duration ?? (getTransitionDuration("pixel") || 1000);
    const delay = 100; // Délai en millisecondes (ajuste selon tes besoins)

    // Pixelise l'ancien écran
    await pixelateOut(oldScreen, pixelDuration / 2);

    // Charge le nouvel écran (en arrière-plan, sans l'afficher)
    const newScreen = await loadScreen(screenNumber, true, true);
    newScreen.style.display = "none"; // Masque le nouvel écran pendant le délai

    // Force un rafraîchissement
    await new Promise(resolve => requestAnimationFrame(resolve));

    // Ajoute un délai avant la dépixelisation
    await new Promise(resolve => setTimeout(resolve, delay));

    // Affiche le canvas pour la dépixelisation
    const canvas = document.getElementById("pixel-transition");
    canvas.style.display = "block";

    // Dépixelise le nouvel écran
    await pixelateIn(newScreen, pixelDuration / 2);

    // Supprime l'ancien écran et affiche le nouveau
    oldScreen.remove();
    newScreen.style.display = "block";
    canvas.style.display = "none";

    // La transition est maintenant réellement terminée : on peut
    // afficher le texte du typewriter.
    startTypewriterForScreen(newScreen);
}
//        !
//Utilise ! les 3 fonctions suivantes
//        v
async function pixelateOut(screen, duration) {
    const canvas = document.getElementById("pixel-transition");
    const img = screen.querySelector(".background-image");

    if (!img) {
        console.error("Aucune image de fond trouvée dans l'écran.");
        return;
    }

    // Attendre que l'image soit chargée
    if (!img.complete) {
        await new Promise(resolve => {
            img.addEventListener("load", resolve, { once: true });
        });
    }

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Dessine l'image initiale dans le canvas
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Affiche le canvas
    canvas.style.display = "block";

    // Lance l'animation de pixelisation
    await animatePixelation(canvas, img, duration, false);
}
async function pixelateIn(screen, duration) {
    const canvas = document.getElementById("pixel-transition");
    const img = screen.querySelector(".background-image");

    if (!img) {
        console.error("Aucune image de fond trouvée dans l'écran.");
        return;
    }

    // Attendre que l'image soit chargée
    if (!img.complete) {
        await new Promise(resolve => {
            img.addEventListener("load", resolve, { once: true });
        });
    }

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Dessine l'image initiale dans le canvas
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Lance l'animation de dépixelisation
    await animatePixelation(canvas, img, duration, true);
}
async function animatePixelation(canvas, img, duration, reverse = false) {
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    //const levels = [1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64];
    const levels = [1, 2, 4, 8, 16, 32, 64, 128];
    if (reverse) levels.reverse();

    // Crée un canvas temporaire pour stocker l'image réduite
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.imageSmoothingEnabled = false;

    return new Promise(resolve => {
        let index = 0;
        const step = duration / levels.length;

        function next() {
            const factor = levels[index];
            const w = Math.max(1, Math.floor(canvas.width / factor));
            const h = Math.max(1, Math.floor(canvas.height / factor));

            // Configure le canvas temporaire
            tempCanvas.width = w;
            tempCanvas.height = h;

            // Dessine l'image réduite dans le canvas temporaire
            tempCtx.clearRect(0, 0, w, h);
            tempCtx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, w, h);

            // Efface le canvas principal
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Dessine le canvas temporaire (image réduite) dans le canvas principal (agrandi)
            ctx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, canvas.width, canvas.height);

            index++;
            if (index < levels.length) {
                setTimeout(next, step);
            } else {
                resolve();
            }
        }

        next();
    });
}

/**
 * Transition "fondu au noir"
 */
async function playFadeTransition(screenNumber, duration = null){

    if (duration != null) setTransitionDurationVar("fade", duration);

    showTransition("fade-out");
    await waitTransition("fade", duration);
    await loadScreen(screenNumber);
    await new Promise(requestAnimationFrame);
    showTransition("fade-in");
    await waitTransition("fade", duration);
    hideTransition();

    if (duration != null) clearTransitionDurationVar("fade");
}

async function playTravelTransition(screenNumber, duration = null){

    if (duration != null) setTransitionDurationVar("travel", duration);

    showTransition("travel-out");
    await waitTransition("travel", duration);
    await loadScreen(screenNumber);
    await new Promise(requestAnimationFrame);
    showTransition("travel-in");
    await waitTransition("travel", duration);
    hideTransition();

    if (duration != null) clearTransitionDurationVar("travel");
}


// Fonction pour pré-charger tous les écrans en arrière-plan
function preloadScreens() {
    for (let i = 1; i <= totalScreens; i++) {
        // Pré-charge chaque écran et le met en cache
        fetch(`screens/screen${i}.html`, { cache: "force-cache" })
            .catch(error => console.warn(`Pré-chargement de screen${i}.html échoué :`, error));
    }
}

// Fonction pour afficher la fenêtre modale de mot de passe
function showPasswordModal() {
    console.log("Affichage de la fenêtre modale de mot de passe...");
    document.getElementById('password-modal').style.display = 'flex';
}

// Fonction pour vérifier un mot de passe
function checkPassword(nextScreen, correctPassword) {
    const password = document.getElementById('password-input').value;
    console.log(`Mot de passe saisi : ${password}, mot de passe correct : ${correctPassword}`);
    if (password === correctPassword) {
        document.getElementById('password-modal').style.display = 'none';
        goToScreen(nextScreen,'fade',1000);
    } else {
        alert("Mot de passe incorrect !");
    }
}

// Fonction pour montrer une image lorsqu'un bouton invisible est cliqué
function showImage(imageId) {
    const image = document.getElementById(imageId);
    if (image) {
        if (image.style.display === 'block') {
            image.style.display = 'none';
        } else {
            image.style.display = 'block';
        }
    }
}

// ======================
// Bouton plein écran
// ======================

// Icône "agrandir" (flèches diagonales pointant vers l'extérieur)
const ICON_ENTER_FULLSCREEN = `
<svg viewBox="0 0 24 24" width="20" height="20" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round"
     stroke-linejoin="round">
    <polyline points="15 3 21 3 21 9"></polyline>
    <polyline points="9 21 3 21 3 15"></polyline>
    <line x1="21" y1="3" x2="14" y2="10"></line>
    <line x1="3" y1="21" x2="10" y2="14"></line>
</svg>
`;

// Icône "réduire" (flèches diagonales pointant vers l'intérieur)
const ICON_EXIT_FULLSCREEN = `
<svg viewBox="0 0 24 24" width="20" height="20" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round"
     stroke-linejoin="round">
    <polyline points="4 14 10 14 10 20"></polyline>
    <polyline points="20 10 14 10 14 4"></polyline>
    <line x1="14" y1="10" x2="21" y2="3"></line>
    <line x1="3" y1="21" x2="10" y2="14"></line>
</svg>
`;

// Met à jour l'icône du bouton selon l'état plein écran actuel
function updateFullscreenIcon() {
    const button = document.getElementById('fullscreen-button');
    if (!button) return;

    if (document.fullscreenElement) {
        button.innerHTML = ICON_EXIT_FULLSCREEN;
        button.setAttribute('aria-label', 'Quitter le plein écran');
        button.title = 'Quitter le plein écran';
    } else {
        button.innerHTML = ICON_ENTER_FULLSCREEN;
        button.setAttribute('aria-label', 'Passer en plein écran');
        button.title = 'Passer en plein écran';
    }
}

// ======================
// Indices cachés (points clignotants)
// ======================

// Recale un indice si son affichage déborde des bords de l'écran
function adjustHoverContentPosition(content) {

    const margin = 12; // marge de sécurité en pixels

    // Réinitialise avant de mesurer, pour repartir d'une position propre
    content.style.transform = 'translate(-50%, -50%)';

    const rect = content.getBoundingClientRect();

    let shiftX = 0;
    let shiftY = 0;

    if (rect.left < margin) {
        shiftX = margin - rect.left;
    } else if (rect.right > window.innerWidth - margin) {
        shiftX = (window.innerWidth - margin) - rect.right;
    }

    if (rect.top < margin) {
        shiftY = margin - rect.top;
    } else if (rect.bottom > window.innerHeight - margin) {
        shiftY = (window.innerHeight - margin) - rect.bottom;
    }

    if (shiftX !== 0 || shiftY !== 0) {
        content.style.transform =
            `translate(calc(-50% + ${shiftX}px), calc(-50% + ${shiftY}px))`;
    }

}

document.addEventListener('click', function(event){

    const dot = event.target.closest('.hidden-text-dot');

    if (dot) {

        const container = dot.closest('.hoverable-text');
        const content = container?.querySelector('.hover-content');

        if (!content) return;

        const wasVisible = content.classList.contains('visible');

        // Referme tous les indices actuellement ouverts
        document
            .querySelectorAll('.hover-content.visible')
            .forEach(el => el.classList.remove('visible'));

        // Rouvre celui-ci seulement s'il n'était pas déjà ouvert
        if (!wasVisible) {
            content.classList.add('visible');
            adjustHoverContentPosition(content);
        }

        return;

    }

    // Clic en dehors d'un indice : referme tous les indices ouverts
    if (!event.target.closest('.hover-content')) {
        document
            .querySelectorAll('.hover-content.visible')
            .forEach(el => el.classList.remove('visible'));
    }

});

// ======================
// Initialisation
// ======================

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM chargé, tentative de chargement de l\'écran 1...');
    loadScreen(currentScreen); // Charge le premier écran
    preloadScreens(); // Pré-charge tous les écrans en arrière-plan

    // Bouton plein écran
    const fullscreenButton = document.getElementById('fullscreen-button');

    updateFullscreenIcon(); // Icône correcte dès le chargement

    fullscreenButton.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error("Erreur plein écran : ", err);
            });
            setTimeout(positionElements, 300);
        } else {
            document.exitFullscreen();
            setTimeout(positionElements, 300);
        }
    });

    // Met à jour l'icône à chaque changement d'état plein écran,
    // y compris quand l'utilisateur quitte via la touche Échap
    // (donc sans passer par le clic sur le bouton).
    document.addEventListener('fullscreenchange', updateFullscreenIcon);
});
