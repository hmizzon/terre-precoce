// Variables globales
let enteredCode = [];
let attempts = 0;
const maxAttempts = 3;

// Fonction pour ajouter un chiffre au code
function addDigit(digit) {
    if (enteredCode.length < 4) {
        enteredCode.push(digit);
        updateCodeDisplay();
    }
    if (enteredCode.length === 4) {
        // Appel sans paramètres, car ils seront passés depuis le HTML
    }
}

// Fonction pour mettre à jour l'affichage du code
function updateCodeDisplay() {
    const codeDisplay = document.getElementById('code-display');
    let displayText = enteredCode.join('');
    while (displayText.length < 4) {
        displayText += '_';
    }
    codeDisplay.textContent = displayText;
}

// Fonction pour afficher un message à l'utilisateur
function showMessage(message, isError = false) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = message;
    messageElement.style.color = isError ? 'red' : 'green';
}

// Fonction pour vérifier le code, avec paramètres
function checkCode(correctCode, nextScreen) {
    const entered = enteredCode.join('');
    attempts++;

    setTimeout(() => {
        if (entered === correctCode) {
            showMessage('Code correct !', false);
            goToScreen(nextScreen); // Appel de la fonction de navigation
        } else {
            showMessage(`Code incorrect ! Tentative ${attempts}/${maxAttempts}`, true);
            if (attempts >= maxAttempts) {
                showMessage('Nombre maximal de tentatives atteint !', true);
                // Bloquer la saisie ou rediriger
            }
        }
        enteredCode = [];
        updateCodeDisplay();
    }, 100);
}
