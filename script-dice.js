// Fonction pour initialiser le dé (appelée après le chargement de screen13)
function initDice() {
    const diceContainer = document.getElementById("dice-container");
    const dice = document.getElementById("dice");

    if (!diceContainer || !dice) {
        console.error("Conteneur ou dé introuvable.");
        return;
    }

    // Survol du conteneur : affiche le dé
    diceContainer.addEventListener("mouseenter", () => {
        dice.style.opacity = "1";
        dice.style.pointerEvents = "auto";
    });

    // Quitte le conteneur : cache le dé
    diceContainer.addEventListener("mouseleave", () => {
        dice.style.opacity = "0";
        dice.style.pointerEvents = "none";
    });

    // Clic sur le dé : animation + redirection
    dice.addEventListener("click", (event) => {
        event.stopPropagation(); // Empêche la propagation de l'événement
        dice.classList.add("spinning");
        dice.style.pointerEvents = "none"; // Désactive les clics pendant l'animation

        setTimeout(() => {
            goToScreen(14);
        }, 500);
    });
}

// Appeler initDice quand screen13 est chargé
document.addEventListener("DOMContentLoaded", initDice);