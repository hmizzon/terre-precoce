// Tableau pour stocker les objets ramassés
let inventory = [];
// Index de l'objet sélectionné (-1 = aucun)
let selectedItemIndex = -1;

// Affiche/masque l'inventaire
function toggleInventory() {
    const inventoryContainer = document.getElementById("inventory-container");
    inventoryContainer.classList.toggle("visible");
}

// Sélectionne un objet dans l'inventaire
function selectItem(slotIndex) {
    if (slotIndex < inventory.length) {
        // Désélectionne l'ancien objet
        const oldSelectedSlot = document.querySelector(".inventory-slot.selected");
        if (oldSelectedSlot) {
            oldSelectedSlot.classList.remove("selected");
        }

        // Sélectionne le nouvel objet
        selectedItemIndex = slotIndex;
        const selectedSlot = document.querySelector(`.inventory-slot[data-slot="${slotIndex}"]`);
        selectedSlot.classList.add("selected");

        // Met à jour la description
        const description = document.getElementById("selected-item-description");
        description.textContent = `Objet sélectionné : ${inventory[slotIndex]}`;
    }
}

// Donne l'objet sélectionné à un personnage
function giveItemToCharacter(characterId) {
    if (selectedItemIndex === -1) {
        alert("Aucun objet sélectionné !");
        return;
    }

    const item = inventory[selectedItemIndex];
    alert(`Tu as donné ${item} à ${characterId}!`);

    // Supprime l'objet de l'inventaire
    inventory.splice(selectedItemIndex, 1);
    selectedItemIndex = -1;

    // Met à jour l'inventaire et la description
    updateInventory();
    document.getElementById("selected-item-description").textContent = "Aucun objet sélectionné";
}

// Met à jour l'affichage de l'inventaire
function updateInventory() {
    const slots = document.querySelectorAll(".inventory-slot");
    slots.forEach((slot, index) => {
        slot.classList.remove("selected"); // Retire la sélection
        if (index < inventory.length) {
            // Affiche l'icône de l'objet dans le slot
            slot.innerHTML = `<img src="/terre-precoce/Images/${inventory[index]}.png" style="width: 100%; height: 100%; object-fit: contain;">`;
        } else {
            slot.innerHTML = ""; // Slot vide
        }
    });
}

// Initialisation
document.getElementById("inventory-toggle").addEventListener("click", toggleInventory);