// Variable globale pour suivre l'état des transitions
let isTransitioning = false;

// Fonction pour changer d'écran avec transition
function goToScreen(screenNumber, transitionType = null) {
    if (isTransitioning) return; // Évite les transitions multiples
    isTransitioning = true;

    const transitionContainer = document.getElementById("transition-container");
    const gameContainer = document.getElementById("game-container");

    // Si aucune transition n'est spécifiée, on change d'écran directement
    if (!transitionType) {
        loadScreen(screenNumber);
        return;
    }

    // Appliquer la transition de sortie
    transitionContainer.className = `${transitionType}-out`;
    transitionContainer.style.display = "block";

    // Après l'animation de sortie, charger le nouvel écran
    setTimeout(() => {
        loadScreen(screenNumber);

        // Appliquer la transition d'entrée
        setTimeout(() => {
            transitionContainer.className = `${transitionType}-in`;
        }, 50); // Petit délai pour déclencher l'animation d'entrée
    }, 500); // Délai = durée de l'animation de sortie
}

// Fonction pour charger un écran (inchangée, mais appelée après la transition)
function loadScreen(screenNumber) {
    fetch(`screens/screen${screenNumber}.html`)
        .then(response => response.text())
        .then(html => {
            document.getElementById('game-container').innerHTML = html;

            // Exécuter les scripts de l'écran chargé
            const scripts = document.getElementById('game-container').querySelectorAll('script');
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                newScript.textContent = script.textContent;
                document.body.appendChild(newScript);
            });

            const screenElement = document.querySelector('.screen');
            if (screenElement) {
                screenElement.style.display = 'block';
                positionElements();

                // Initialise l'effet typewriter si nécessaire
                const hasTextSource = screenElement.querySelector('.text-source');
                const hasTextContainer = screenElement.querySelector('.text-container');
                if (hasTextSource && hasTextContainer) {
                    initTypewriterForScreen(screenElement);
                }
            }
        })
        .catch(error => {
            console.error(`Erreur lors du chargement de l'écran ${screenNumber}:`, error);
        })
        .finally(() => {
            isTransitioning = false;
        });
}