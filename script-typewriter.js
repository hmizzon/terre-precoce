/**
 * Affiche une animation de rectangle qui s'élargit à la position du texte,
 * puis le texte caractère par caractère.
 *
 * @param {HTMLElement} container - Élément HTML où afficher le texte et le rectangle.
 * @param {string} text - Texte à afficher (avec \n pour les sauts de ligne).
 * @param {number} charSpeed - Délai entre chaque caractère (en ms).
 * @param {number} lineSpeed - Délai entre le début de chaque ligne (en ms).
 * @param {boolean} showExpandingRect - Si vrai, affiche le rectangle qui s'élargit avant le texte.
 * @param {number} rectAnimationDuration - Durée de l'animation du rectangle (en ms).
 */
function typewriterEffect(
    container,
    text,
    charSpeed = 50,
    lineSpeed = 50,
    showExpandingRect = false,
    rectAnimationDuration = 300
) {
    if (!container) {
        console.error("Le conteneur de texte n'existe pas.");
        return;
    }

    // --- Récupère les styles personnalisés via les attributs data-* ---
    const fontFamily = container.dataset.fontFamily || "'Courier New', monospace";
    const color = container.dataset.color || "white";
    const backgroundColor = container.dataset.backgroundColor || "rgba(0, 0, 0, 0.5)";
    const textShadow = container.dataset.textShadow || "none";
    const position = container.dataset.position || "relative";
    const zIndex = container.dataset.zIndex || "10";
    const maxWidth = container.dataset.maxWidth || "80%";
    const margin = container.dataset.margin || "0";
    const padding = container.dataset.padding || "10px";
    const borderRadius = container.dataset.borderRadius || "5px";
    const left = container.dataset.left || "auto";
    const top = container.dataset.top || "auto";
    const width = container.dataset.width || "auto";
    const height = container.dataset.height || "auto";

    // --- Applique les styles au conteneur de texte (sans background pour l'instant) ---
    container.style.fontFamily = fontFamily;
    container.style.color = color;
    container.style.textShadow = textShadow;
    container.style.position = position;
    container.style.zIndex = zIndex;
    container.style.maxWidth = maxWidth;
    container.style.margin = margin;
    container.style.padding = padding;
    container.style.borderRadius = borderRadius;
    container.style.left = left;
    container.style.top = top;
    container.style.width = width;
    container.style.height = height;
    container.style.whiteSpace = 'pre-line';
    container.style.overflow = 'hidden';
    container.style.boxSizing = 'border-box'; // Inclut padding et border dans width/height

    // --- Vide le conteneur ---
    container.textContent = '';

    // --- Animation du rectangle (optionnelle) ---
    if (showExpandingRect) {
        // Crée un rectangle avec les mêmes dimensions et position que le conteneur
        const rect = document.createElement('div');
        rect.style.position = position;
        rect.style.width = '0';
        rect.style.height = height !== 'auto' ? height : container.offsetHeight + 'px';
        rect.style.left = left;
        rect.style.top = top;
        rect.style.zIndex = parseInt(zIndex) - 1 + '';
        rect.style.backgroundColor = container.dataset.rectColor || 'white';
        rect.style.borderRadius = borderRadius;
        rect.style.transition = `width ${rectAnimationDuration}ms ease-out`;
        rect.style.overflow = 'hidden';
        rect.style.boxSizing = 'border-box';

        // Si la largeur est définie, utilisez-la comme largeur finale, sinon utilisez maxWidth
        const finalWidth = width !== 'auto' ? width : maxWidth;

        // Ajoute le rectangle au parent du conteneur
        const parent = container.parentElement;
        if (parent) {
            parent.appendChild(rect);
        } else {
            console.error("Le parent du conteneur n'existe pas.");
            startTypewriter();
            return;
        }

        // Force le calcul des styles pour obtenir la hauteur réelle
        // (nécessaire si height est 'auto')
        if (height === 'auto') {
            // Crée un clone temporaire pour mesurer la hauteur
            const tempDiv = document.createElement('div');
            tempDiv.style.visibility = 'hidden';
            tempDiv.style.position = 'absolute';
            tempDiv.style.whiteSpace = 'pre-line';
            tempDiv.style.fontFamily = fontFamily;
            tempDiv.style.fontSize = getComputedStyle(container).fontSize;
            tempDiv.style.padding = padding;
            tempDiv.style.width = finalWidth;
            tempDiv.style.boxSizing = 'border-box';
            tempDiv.textContent = text;
            parent.appendChild(tempDiv);
            const measuredHeight = tempDiv.offsetHeight + 'px';
            parent.removeChild(tempDiv);

            // Met à jour la hauteur du rectangle et du conteneur
            rect.style.height = measuredHeight;
            container.style.height = measuredHeight;
        }

        // Lance l'animation du rectangle
        setTimeout(() => {
            rect.style.width = finalWidth;
        }, 100);

        // Supprime le rectangle après l'animation et lance l'effet typewriter
        setTimeout(() => {
            rect.remove();
            startTypewriter();
        }, rectAnimationDuration);
    } else {
        // Pas d'animation de rectangle, lance directement l'effet typewriter
        startTypewriter();
    }

    // --- Fonction pour lancer l'effet typewriter ---
    function startTypewriter() {
        // Applique le fond du conteneur
        container.style.backgroundColor = backgroundColor;

        const lines = text.split('\n');
        let currentLine = 0;
        let currentChar = 0;
        let timer;

        function displayNextLine() {
            if (currentLine < lines.length) {
                const line = lines[currentLine];
                currentChar = 0;
                if (currentLine > 0) {
                    container.textContent += '\n';
                }
                container.textContent += line[currentChar];
                currentChar++;
                timer = setTimeout(displayNextChar, charSpeed);
            }
        }

        function displayNextChar() {
            if (currentChar < lines[currentLine].length) {
                container.textContent += lines[currentLine].charAt(currentChar);
                currentChar++;
                timer = setTimeout(displayNextChar, charSpeed);
            } else {
                currentLine++;
                if (currentLine < lines.length) {
                    const lineLength = lines[currentLine - 1].length;
                    const timeForLine = lineLength * charSpeed;
                    const delay = Math.max(0, lineSpeed - timeForLine);
                    setTimeout(displayNextLine, delay);
                }
            }
        }

        displayNextLine();
    }
}

/**
 * Initialise l'effet typewriter pour un écran donné.
 * @param {HTMLElement} screenElement - Élément HTML de l'écran.
 */
function initTypewriterForScreen(screenElement) {
    if (!screenElement) {
        console.error("L'élément de l'écran n'existe pas.");
        return;
    }

    const textSource = screenElement.querySelector('.text-source');
    if (!textSource) {
        console.error("Aucun élément .text-source trouvé dans l'écran.");
        return;
    }

    const textContainer = screenElement.querySelector('.text-container');
    if (!textContainer) {
        console.error("Aucun élément .text-container trouvé dans l'écran.");
        return;
    }

    // Nettoie le texte source
    const storyText = textSource.textContent.trim();

    // Récupère les options personnalisées
    const charSpeed = parseInt(textContainer.dataset.charSpeed) || 50;
    const lineSpeed = parseInt(textContainer.dataset.lineSpeed) || 50;
    const showExpandingRect = textContainer.hasAttribute('data-show-rect');
    const rectAnimationDuration = parseInt(textContainer.dataset.rectAnimationDuration) || 1000;
    const rectColor = textContainer.dataset.rectColor || 'white';

    typewriterEffect(
        textContainer,
        storyText,
        charSpeed,
        lineSpeed,
        showExpandingRect,
        rectAnimationDuration
    );
}