// Cacher l'écran de démarrage et afficher le jeu
document.getElementById("start-button").addEventListener("click", function() {
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";
});

// Vérifier la réponse de l'utilisateur
document.getElementById("submit-answer").addEventListener("click", function() {
    const userAnswer = document.getElementById("user-answer").value.toLowerCase();
    const correctAnswer = "il a mangé une pomme";

    if (userAnswer === correctAnswer) {
        document.getElementById("feedback").textContent = "Bonne réponse !";
        setTimeout(function() {
            document.getElementById("game-screen").style.display = "none";
            document.getElementById("end-screen").style.display = "block";
        }, 1000);
    } else {
        document.getElementById("feedback").textContent = "Mauvaise réponse. Essayez encore !";
    }
});