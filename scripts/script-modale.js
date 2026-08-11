// Écouter l'événement screenLoaded pour afficher la modale sur screen5
document.addEventListener('screenLoaded', (event) => {
    if (event.detail.screenNumber === 5) {
        // Attendre un court délai pour s'assurer que tout est chargé
        setTimeout(() => {
            const modal = document.getElementById("image-modal");
            if (modal) {
                modal.style.display = "flex";
                setTimeout(() => {
                    modal.style.opacity = "1";
                }, 10);
                document.getElementById("close-modal-btn").addEventListener("click", () => {
                    modal.style.opacity = "0";
                    setTimeout(() => {
                        modal.style.display = "none";
                    }, 500);
                });
            }
        }, 100); // Délai pour s'assurer que le DOM est prêt
    }
});