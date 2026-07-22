// script-drawers.js

// Variables globales pour les tiroirs
let draggedDrawers = [];
let correctCode = "4279"; // Code à composer

// Fonction pour gérer le clic sur un tiroir
function handleDrawerClick(event) {
    const drawer = event.target;
    const digit = drawer.getAttribute("data-digit");

    if (drawer.classList.contains("dragged")) {
        // Remettre en place
        drawer.classList.remove("dragged");
        drawer.style.zIndex = "20";
        const index = draggedDrawers.indexOf(digit);
        if (index > -1) draggedDrawers.splice(index, 1);
    } else {
        // Tirer le tiroir
        drawer.classList.add("dragged");
        drawer.style.zIndex = 20 + draggedDrawers.length + 1;
        draggedDrawers.push(digit);
    }

    checkDrawerCode();
}

// Fonction pour vérifier le code
function checkDrawerCode() {
    const enteredCode = draggedDrawers.join("");
    if (enteredCode.length === correctCode.length && enteredCode === correctCode) {
        setTimeout(() => {
            goToScreen(9,'fade'); // Passer à l'écran 9 (Zarya)
        }, 500);
    }
}

// Fonction pour réinitialiser les tiroirs
function resetDrawers() {
    draggedDrawers = [];
    document.querySelectorAll(".drawer").forEach(drawer => {
        drawer.classList.remove("dragged");
        drawer.style.zIndex = "20";
    });
}

// Fonction pour initialiser les tiroirs
function initDrawers() {
    const drawers = document.querySelectorAll(".drawer");
    drawers.forEach(drawer => {
        drawer.addEventListener("click", handleDrawerClick);
    });
}

// Réinitialiser les tiroirs quand on revient sur screen6
function resetDrawersForScreen6() {
    resetDrawers();
    initDrawers();
}