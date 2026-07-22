// script-qcm.js

// Variables globales pour le QCM
const qcmState = {

    questions: [],

    current: 0,

    score: 0

};

const qcmUI = {
    container: null,
    question: null,
    answers: null,
    result: null,
    quit: null
};

function bindQCMUI() {

    qcmUI.container = document.getElementById("qcm-container");
    qcmUI.question = document.getElementById("qcm-question");
    qcmUI.answers = document.getElementById("qcm-answers");
    qcmUI.result = document.getElementById("qcm-result");
    qcmUI.quit = document.getElementById("qcm-quit-btn");

}

// Fonction pour initialiser le QCM
function initQCM(questions) {
    bindQCMUI();

    qcmState.questions = questions || [];

    qcmState.current = 0;

    qcmState.score = 0;

    if (qcmUI.quit) {
        qcmUI.quit.onclick = hideQCM;
    }
}

// Fonction pour afficher une question du QCM
function showQuestion() {
    if (qcmState.questions.length === 0) {
        console.error("currentQCM n'est pas défini ou est vide.");
        const resultElement = qcmUI.result;
        if (resultElement) {
            resultElement.textContent = "Erreur : les questions ne sont pas chargées.";
            resultElement.style.color = "red";
        }
        return;
    }

    const qcmContainer = qcmUI.container;
    const questionElement = qcmUI.question;
    const answersElement = qcmUI.answers;
    const resultElement = qcmUI.result;

    if (!qcmContainer || !questionElement || !answersElement || !resultElement) {
        console.error("Un ou plusieurs éléments du QCM sont introuvables.");
        return;
    }

    // Vérifier si toutes les questions ont été posées
    if (qcmState.current >= qcmState.questions.length) {
        if (qcmState.score === qcmState.questions.length) {
            resultElement.textContent = `Félicitations ! Score : ${qcmState.score}/${qcmState.questions.length}. Code : 4279`;
            resultElement.style.color = "lime";
        } else {
            resultElement.textContent = `Score final : ${qcmState.score}/${qcmState.questions.length}. Réessayez !`;
            resultElement.style.color = "red";
        }

        return;
    }

    // Effacer les réponses précédentes
    answersElement.replaceChildren();
    resultElement.textContent = ""; // Utilise innerHTML pour effacer les boutons précédents

    // Récupérer la question actuelle
    const question = qcmState.questions[qcmState.current];
    questionElement.textContent = question.text;

    // Créer les boutons de réponse
    question.answers.forEach((answer) => {
        const button = document.createElement("button");
        button.textContent = answer.text;
        button.className = "qcm-answer-button";
        button.onclick = () => selectAnswer(answer.correct); // Utilise addEventListener
        answersElement.appendChild(button);
    });

    // Afficher le conteneur du QCM
    qcmContainer.style.display = "block";
}

// Fonction pour gérer la sélection d'une réponse
function selectAnswer(isCorrect) {
    if (isCorrect) {
        qcmState.score++;
        qcmUI.result.textContent = "Bonne réponse !";
        qcmUI.result.style.color = "lime";
    } else {
        qcmUI.result.textContent = "Mauvaise réponse !";
        qcmUI.result.style.color = "red";
    }

    setTimeout(() => {
        qcmState.current++;
        showQuestion();
    }, 1500);
}

// Fonction pour afficher le QCM
function showQCM() {
    if (qcmState.questions.length === 0) {
        console.error("currentQCM est vide.");
        return;
    }

    // Réinitialiser les variables
    qcmState.current = 0;
    qcmState.score = 0;

    // Afficher la première question
    showQuestion();

}

// Fonction pour cacher le QCM
function hideQCM() {
    if (qcmUI.container) {
        qcmUI.container.style.display = "none";
    }
}

// Fonction pour réinitialiser le QCM
function resetQCM() {
    qcmState.current = 0;
    qcmState.score = 0;
    showQuestion(); // Recommence depuis la première question
}