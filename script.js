console.log("Le script est chargé");

// Variables globales
let currentScreen = 1;
const totalScreens = 21;

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

function waitTransition(transitionType) {

    const duration = getTransitionDuration(transitionType) || 1000;

    return new Promise(resolve => {
        setTimeout(resolve, duration);
    });

}

// Fonction pour changer d'écran avec transition
async function goToScreen(screenNumber,transitionType=null){

    if(isTransitioning)
        return;

    isTransitioning=true;

    try{

        switch (true) {

            case transitionType == null:
                await loadScreen(screenNumber);
                break;

            case transitionType === "fade":
                await playFadeTransition(screenNumber);
                break;

            case transitionType === "travel":
                await playTravelTransition(screenNumber);
                break;

            case transitionType.startsWith("wipe"):
                await playWipeTransition(screenNumber, transitionType);
                break;

            case transitionType === "zoom":
                await playZoomTransition(screenNumber);
                break;

            case transitionType === "pixel":
                await playPixelTransition(screenNumber);
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
 * Initialise un écran après son insertion dans le DOM
 */
function initializeScreen(screenElement, screenNumber, delayTypewriter = false) {

    screenElement.style.display = "block";

    // Positionnement des éléments
    positionElements();

    // Initialisations nécessaires à l'écran
    screens[screenNumber]?.init?.();

    // Typewriter

    const hasTextSource = screenElement.querySelector(".text-source");
    const hasTextContainer = screenElement.querySelector(".text-container");

    if (hasTextSource && hasTextContainer) {

        if(delayTypewriter) {
            // Attendre la fin de la transition avant de lancer le typewriter
            setTimeout(() => initTypewriterForScreen(screenElement), getTransitionDuration("wipe") || 1000);
        } else {
            initTypewriterForScreen(screenElement);
        }

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
async function playWipeTransition(screenNumber, direction) {

    const gameContainer = document.getElementById("game-container");

    const oldScreen = gameContainer.querySelector(".screen");

    if (!oldScreen) {

        await loadScreen(screenNumber);

        return;

    }

    // Charge le nouvel écran sans supprimer l'ancien
    const newScreen = await loadScreen(screenNumber, true) //, true);

    // Force un rafraîchissement du navigateur
    await new Promise(resolve => requestAnimationFrame(resolve));

    // Classe commune
    newScreen.classList.add("in");

    // Direction de l'animation
    newScreen.classList.add(direction);

    oldScreen.classList.add("out");

    const duration = getTransitionDuration("wipe") || 1000;

    await new Promise(resolve => setTimeout(resolve, duration));

    // Nettoyage
    oldScreen.remove();

    newScreen.classList.remove("wipe");
    newScreen.classList.remove(direction);

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


async function playZoomTransition(screenNumber){

    const gameContainer = document.getElementById("game-container");

    const oldScreen = gameContainer.querySelector(".screen");

    if(!oldScreen){
        await loadScreen(screenNumber);
        return;
    }

    oldScreen.classList.add("zoom-out");

    const zoomDuration = getTransitionDuration("zoom") || 2500;

    await new Promise(resolve =>
        setTimeout(resolve, zoomDuration * 0.8)
    );

    await playFadeTransition(screenNumber);
}

// Transition pixellisation pour les ordis
async function playPixelTransition(screenNumber) {
    const gameContainer = document.getElementById("game-container");
    const oldScreen = gameContainer.querySelector(".screen");

    if (!oldScreen) {
        await loadScreen(screenNumber, false, true);
        return;
    }

    const duration = getTransitionDuration("pixel") || 1000;
    const delay = 100; // Délai en millisecondes (ajuste selon tes besoins)

    // Pixelise l'ancien écran
    await pixelateOut(oldScreen, duration / 2);

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
    await pixelateIn(newScreen, duration / 2);

    // Supprime l'ancien écran et affiche le nouveau
    oldScreen.remove();
    newScreen.style.display = "block";
    canvas.style.display = "none";
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
async function playFadeTransition(screenNumber){
    showTransition("fade-out");
    await waitTransition("fade");
    await loadScreen(screenNumber);
    await new Promise(requestAnimationFrame);
    showTransition("fade-in");
    await waitTransition("fade");
    hideTransition();
}

async function playTravelTransition(screenNumber){
    showTransition("travel-out");
    await waitTransition("travel");
    await loadScreen(screenNumber);
    await new Promise(requestAnimationFrame);
    showTransition("travel-in");
    await waitTransition("travel");
    hideTransition();
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
        goToScreen(nextScreen);
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

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM chargé, tentative de chargement de l\'écran 1...');
    loadScreen(currentScreen); // Charge le premier écran
    preloadScreens(); // Pré-charge tous les écrans en arrière-plan

    // Bouton plein écran
    document.getElementById('fullscreen-button').addEventListener('click', () => {
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
});
