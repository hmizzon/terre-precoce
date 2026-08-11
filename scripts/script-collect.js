// ======================
// Gestion de l'inventaire
// ======================

const inventoryState = {
    items: [],
    selectedIndex: -1,
    targetCharacter: null
};

// Mémorise les objets déjà ramassés (par leur id), pour qu'ils ne
// réapparaissent plus si l'on revient sur un écran déjà visité.
const collectedItems = new Set();

const characters = {

    npc1: {
        requiredItem: "Mighei",
        completed: false
    },

    npc2: {
        requiredItem: "Allende",
        completed: false
    }

};


function refreshInventoryUI() {
    const slots = document.querySelectorAll(".inventory-slot");
    slots.forEach((slot, index) => {
        slot.classList.remove("selected");
        if (index < inventoryState.items.length) {
            slot.innerHTML = `
            <img src="objets/${inventoryState.items[index]}.jpg"
            style="width:100%;height:100%;object-fit:contain;">
            <span class="inventory-tooltip">
            ${inventoryState.items[index]}
            </span>
            `;
        } else {
            slot.innerHTML = "";
        }
        slot.classList.toggle(
        "selected",
        index === inventoryState.selectedIndex
        );
    });

    // Le bouton "Donner" n'apparaît que si un objet est
    // sélectionné ET qu'un personnage attend un don (dialogue ouvert)
    const giveButton = document.getElementById("give-item-button");

    if (giveButton) {
        giveButton.style.display =
            (inventoryState.selectedIndex !== -1 &&
             inventoryState.targetCharacter)
            ? ""
            : "none";
    }
}

// Initialise l'inventaire
function initInventory() {

    // Ajouté à #game-stage (et non document.body) : reste ainsi
    // toujours à l'intérieur de la scène à ratio fixe, même sur
    // mobile avec letterboxing (bandes noires).
    const stage = document.getElementById("game-stage") || document.body;

    // Création du bouton et de l'inventaire
    if (!document.getElementById("inventory-toggle")) {

        const toggleButton = document.createElement("button");
        toggleButton.id = "inventory-toggle";
        toggleButton.className = "inventory-toggle-button";
        toggleButton.textContent = "Inventaire";
        stage.appendChild(toggleButton);

        const inventoryContainer = document.createElement("div");
        inventoryContainer.id = "inventory-container";
        inventoryContainer.className = "inventory-container";

        inventoryContainer.innerHTML = `
            <div class="inventory">
                <div class="inventory-slot" data-slot="0"></div>
                <div class="inventory-slot" data-slot="1"></div>
                <div class="inventory-slot" data-slot="2"></div>
            </div>

            <div class="inventory-description">
                <button
                    id="give-item-button"
                    class="give-item-button"
                    style="display:none;">
                    Donner
                </button>
            </div>
        `;

        stage.appendChild(inventoryContainer);
    }

    // Bouton "donner l'objet sélectionné"
    document
        .getElementById("give-item-button")
        .addEventListener("click", function(event){

            event.stopPropagation();

            giveSelectedItemToTarget();

        });


    // Bouton inventaire
    const button = document.getElementById("inventory-toggle");

    button.addEventListener("click", function(event){

        event.stopPropagation();

        toggleInventory();

    });

    // Clic sur une case
    document.querySelectorAll(".inventory-slot").forEach(slot => {

        slot.addEventListener("click", function(event){

            event.stopPropagation();

            selectItem(Number(slot.dataset.slot));

        });

    });

    // Fermeture automatique
    document.addEventListener("click", function(event){

        // Fermeture des dialogues
        document
            .querySelectorAll(".character-dialog.visible")
            .forEach(dialog => {

                if (
                    !dialog.contains(event.target) &&
                    !event.target.closest(".character")
                ){
                    stopTypewriter(
                        dialog.querySelector(".text-container")
                    );

                    dialog.classList.remove("visible");

                    inventoryState.targetCharacter = null;
                    refreshInventoryUI();
                }

            });

        // Gestion inventaire
        const inventory =
            document.getElementById("inventory-container");

        if (!inventory.classList.contains("visible"))
            return;

        if (event.target.closest("#inventory-container"))
            return;

        if (event.target.id === "inventory-toggle")
            return;

        closeInventory();

    });

    refreshInventoryUI();

}

function openInventory(){

    document
    .getElementById("inventory-container")
    .classList.add("visible");

}

function closeInventory(){

    inventoryState.selectedIndex = -1;
    inventoryState.targetCharacter = null;

    refreshInventoryUI();

    document
        .getElementById("inventory-container")
        .classList.remove("visible");

}

// Affiche/masque l'inventaire
function toggleInventory(){

    const inventory =
        document.getElementById("inventory-container");

    if (inventory.classList.contains("visible"))
        closeInventory();
    else
        openInventory();

}

// Ouvre l'inventaire pour donner un objet à un personnage
function openInventoryForGiving(characterId){

    inventoryState.targetCharacter = characterId;

    openInventory();

}

// Sélectionne un objet dans l'inventaire
function selectItem(slotIndex) {

    if (slotIndex < 0 || slotIndex >= inventoryState.items.length){
        return;
    }

    inventoryState.selectedIndex = slotIndex;
    refreshInventoryUI();
    }


function getCharacterUI(characterId){

    const dialog = document.getElementById(`${characterId}-dialog`);

    if (!dialog)
        return null;

    return {

        dialog,

        textContainer:
            dialog.querySelector(".text-container"),

        textSource:
            dialog.querySelector(".text-source"),

        textSourceAfter:
            dialog.querySelector(".text-source-after"),

        nextButton:
            dialog.querySelector(".next-button")

    };

}

// ======================
// Gestion des dialogues avec les personnages
// ======================

// Affiche le dialogue d'un personnage
function showCharacterDialog(characterId) {
    if (!characters[characterId])
    return;

    const ui = getCharacterUI(characterId);

    if (ui.nextButton) {
        ui.nextButton.style.display =
        characters[characterId].completed ? "" : "none";
    }

    // Tant que ce personnage n'a pas reçu son objet, ouvrir son
    // dialogue le désigne automatiquement comme destinataire d'un
    // don (le bouton "Donner" apparaîtra dans l'inventaire si un
    // objet y est sélectionné).
    inventoryState.targetCharacter =
        characters[characterId].completed ? null : characterId;

    refreshInventoryUI();

    // Déjà ouvert : ne rien faire
    if (ui.dialog.classList.contains("visible")) {
        return;
    }

    ui.dialog.classList.add("visible");

    stopTypewriter(ui.textContainer);

    ui.textContainer.textContent = "";

    const textSource = characters[characterId].completed
        ? ui.textSourceAfter
        : ui.textSource;

    if (!textSource) return;

    typewriterEffect(
        ui.textContainer,
        textSource.textContent.trim(),
        parseInt(ui.textContainer.dataset.charSpeed) || 30,
        parseInt(ui.textContainer.dataset.lineSpeed) || 500,
        false
    );
}

// Ferme le dialogue d'un personnage
function closeCharacterDialog(characterId,event){

    if(event)
        event.stopPropagation();

    const ui = getCharacterUI(characterId);

    if (!ui) return;

    stopTypewriter(ui.textContainer);

    ui.dialog.classList.remove("visible");

    if (inventoryState.targetCharacter === characterId) {
        inventoryState.targetCharacter = null;
        refreshInventoryUI();
    }

}

// ======================
// Gestion des objets donnés aux personnages
// ======================

// Donne l'objet sélectionné au personnage cible
function giveSelectedItemToTarget() {

    if (inventoryState.selectedIndex === -1)
        return;

    const target = inventoryState.targetCharacter;

    if (!target)
        return;

        const selectedItem = inventoryState.items[inventoryState.selectedIndex];

    if (selectedItem !== characters[target].requiredItem) {

    alert("Ce personnage ne veut pas cet objet.");
    return;

    }

    // Le personnage a reçu le bon objet
    characters[target].completed = true;
    // Retire l'objet
    inventoryState.items.splice(inventoryState.selectedIndex, 1);
    inventoryState.selectedIndex = -1;

    refreshInventoryUI();

    // Met à jour le dialogue
    const ui = getCharacterUI(target);

    if (!ui) return;

    stopTypewriter(ui.textContainer);
    ui.textContainer.textContent = "";

    if (ui.nextButton) {
        ui.nextButton.style.display = "";
    }

    typewriterEffect(
        ui.textContainer,
        ui.textSourceAfter.textContent.trim(),
        parseInt(ui.textContainer.dataset.charSpeed) || 30,
        parseInt(ui.textContainer.dataset.lineSpeed) || 500,
        false
    );

    closeInventory();

}

// ======================
// Gestion des objets ramassables
// ======================

// Ramasse un objet
function collectItem(itemId) {
    const itemElement = document.getElementById(itemId);

    if (!itemElement) return;
    const itemType = itemElement.dataset.item; // Récupère le type d'objet

    // Ajoute l'objet à l'inventaire
    if (inventoryState.items.length >= 3) {
        return;
    }

    // Configuration optionnelle de la transition vers un écran
    // d'animation (GIF plein écran), lue avant de retirer l'élément
    // du DOM. Absente par défaut : le ramassage reste alors un
    // simple ramassage, sans transition.
    const animationScreen = itemElement.dataset.animationScreen
        ? parseInt(itemElement.dataset.animationScreen, 10)
        : null;
    const animationDuration = itemElement.dataset.animationDuration
        ? parseInt(itemElement.dataset.animationDuration, 10)
        : 1000;
    const animationTransition =
        itemElement.dataset.animationTransition || "fade";
    const animationTransitionDuration =
        itemElement.dataset.animationTransitionDuration
            ? parseInt(itemElement.dataset.animationTransitionDuration, 10)
            : null;

    inventoryState.items.push(itemType);

    refreshInventoryUI();

    // Mémorise que cet objet a été ramassé : il ne réapparaîtra plus
    // si l'écran est rechargé plus tard (voir l'écouteur "screenLoaded"
    // plus bas dans ce fichier).
    collectedItems.add(itemId);

    if (animationScreen) {

        // Une transition plein écran va suivre immédiatement :
        // on retire l'objet sans jouer la petite animation de
        // ramassage classique (les deux ensemble feraient doublon).
        itemElement.remove();

        playCollectAnimation(
            animationScreen,
            animationDuration,
            animationTransition,
            animationTransitionDuration
        );

    } else {

        // Comportement habituel : petite animation de ramassage
        itemElement.classList.add("collecting");
        itemElement.style.pointerEvents = "none";

        setTimeout(() => {
            itemElement.remove();
        }, 500); // Durée de l'animation

    }
}

/**
 * Transitionne vers l'écran d'animation (GIF plein écran) indiqué,
 * puis revient automatiquement à l'écran d'origine une fois la
 * durée de l'animation écoulée.
 * @param {number} animationScreen - Numéro de l'écran contenant le GIF
 * @param {number} animationDuration - Durée du GIF en millisecondes
 * @param {string} transitionType - Type de transition (goToScreen)
 * @param {number|null} transitionDuration - Durée de la transition elle-même (optionnel)
 */
async function playCollectAnimation(
    animationScreen,
    animationDuration,
    transitionType,
    transitionDuration
) {

    const originScreen = currentScreen;

    await goToScreen(animationScreen, transitionType, transitionDuration);

    setTimeout(() => {
        goToScreen(originScreen, transitionType, transitionDuration);
    }, animationDuration);

}

// ======================
// Réactions à chaque changement d'écran
// ======================

document.addEventListener("screenLoaded", () => {

    // Retire tout objet à ramasser déjà collecté lors d'une visite
    // précédente de cet écran (le HTML est rechargé à chaque fois
    // depuis le fichier source, donc l'objet y est toujours présent
    // par défaut).
    document.querySelectorAll(".collectible").forEach(el => {
        if (collectedItems.has(el.id)) {
            el.remove();
        }
    });

    // Force le redémarrage à la première image des GIFs plein écran
    // (classe .fullscreen-gif à ajouter sur la balise <img> de ces
    // écrans). Sans ça, un navigateur peut réafficher directement la
    // dernière image déjà décodée en cache pour un GIF sans boucle
    // déjà joué, au lieu de relancer l'animation depuis le début.
    document.querySelectorAll("img.fullscreen-gif").forEach(img => {
        const url = new URL(img.src, window.location.href);
        url.searchParams.set("_r", Date.now());
        img.src = url.toString();
    });

});

// ======================
// Initialisation automatique
// ======================

// Attends que le DOM soit chargé
document.addEventListener("DOMContentLoaded", () => {
    initInventory();
});
