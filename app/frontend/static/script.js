// script.js avec style modernisé et disposition élégante

// Déclaration de la variable socket pour la communication avec le serveur
let socket = null;

// Taille d'une case de l'échiquier en pixels
const tileSize = 60;

// Chemin des images des pièces d'échecs
const imagePath = "/static/assets/";

// Dictionnaire associant les codes des pièces à leurs fichiers d'image
const pieceImages = {
    'TN': 'Tour-b.svg', 'CN': 'Cavalier-b.svg', 'FN': 'Fou-b.svg',
    'DN': 'Reine-b.svg', 'RN': 'Roi-b.svg', 'PN': 'Pion-b.svg',
    'TB': 'Tour-w.svg', 'CB': 'Cavalier-w.svg', 'FB': 'Fou-w.svg',
    'DB': 'Reine-w.svg', 'RB': 'Roi-w.svg', 'PB': 'Pion-w.svg'
};

// Objet pour stocker les images chargées
const loadedImages = {};

// Variables pour gérer l'état du jeu
let board = []; // Représentation du plateau d'échecs
let playerName = null; // Nom du joueur
let playerColor = null; // Couleur du joueur (Blanc ou Noir)
let selectedPiece = null; // Pièce actuellement sélectionnée
let selectedPosition = null; // Position de la pièce sélectionnée
let capturedPiecesWhite = []; // Liste des pièces blanches capturées
let capturedPiecesBlack = []; // Liste des pièces noires capturées
let possibleMoves = []; // Liste des déplacements possibles pour la pièce sélectionnée

// Fonction pour charger les images des pièces
// Une fois toutes les images chargées, la fonction callback est exécutée
function loadImages(callback) {
    let loaded = 0; // Compteur d'images chargées
    const total = Object.keys(pieceImages).length; // Nombre total d'images à charger

    // Parcourt chaque pièce et charge son image
    Object.entries(pieceImages).forEach(([code, file]) => {
        const img = new Image();
        img.src = imagePath + file; // Définit la source de l'image
        img.onload = () => {
            if (++loaded === total) callback(); // Appelle le callback une fois toutes les images chargées
        };
        loadedImages[code] = img; // Stocke l'image chargée
    });
}

// Fonction pour dessiner l'échiquier
function drawBoard() {
    const ctx = document.getElementById("chessboard").getContext("2d");

    // Parcourt chaque case de l'échiquier
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const displayRow = 7 - row; // Inverse les lignes pour correspondre à l'affichage
            ctx.fillStyle = (row + col) % 2 === 0 ? "#333333" : "#C0C0C0"; // Alterne les couleurs des cases
            ctx.fillRect(col * tileSize, displayRow * tileSize, tileSize, tileSize); // Dessine la case
        }
    }

    // Met en surbrillance les déplacements possibles
    possibleMoves.forEach(move => {
        const x = move.to_col * tileSize;
        const y = (move.to_row) * tileSize;
        ctx.fillStyle = "rgba(255, 255, 0, 0.4)"; // Couleur de surbrillance
        ctx.fillRect(x, y, tileSize, tileSize); // Dessine la surbrillance
    });
}

// Fonction pour dessiner les pièces sur l'échiquier
function drawPieces(board) {
    const ctx = document.getElementById("chessboard").getContext("2d");

    // Parcourt chaque case du plateau
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col]; // Récupère la pièce à cette position
            if (piece !== " " && loadedImages[piece]) { // Si une pièce est présente
                const displayRow = row; // Ligne d'affichage
                ctx.drawImage(loadedImages[piece], col * tileSize + 5, displayRow * tileSize + 5, tileSize - 10, tileSize - 10); // Dessine la pièce
            }
        }
    }

    // Met en surbrillance les déplacements possibles
    possibleMoves.forEach(move => {
        const ctx = document.getElementById("chessboard").getContext("2d");
        ctx.fillStyle = "rgba(0, 255, 0, 0.4)"; // Couleur de surbrillance
        const x = move.col * tileSize;
        const y = (7 - move.row) * tileSize;
        ctx.fillRect(x, y, tileSize, tileSize); // Dessine la surbrillance
    });
}

// Fonction pour mettre à jour l'affichage des pièces capturées
function updateCapturedDisplay() {
    const whiteDiv = document.getElementById("captured-white"); // Conteneur pour les pièces blanches capturées
    const blackDiv = document.getElementById("captured-black"); // Conteneur pour les pièces noires capturées
    whiteDiv.innerHTML = ""; // Réinitialise le contenu
    blackDiv.innerHTML = ""; // Réinitialise le contenu

    // Ajoute les images des pièces blanches capturées
    capturedPiecesWhite.forEach(code => {
        const img = loadedImages[code];
        if (img) {
            const clone = img.cloneNode(); // Clone l'image
            clone.style.width = "30px"; // Définit la taille
            whiteDiv.appendChild(clone); // Ajoute au conteneur
        }
    });

    // Ajoute les images des pièces noires capturées
    capturedPiecesBlack.forEach(code => {
        const img = loadedImages[code];
        if (img) {
            const clone = img.cloneNode(); // Clone l'image
            clone.style.width = "30px"; // Définit la taille
            blackDiv.appendChild(clone); // Ajoute au conteneur
        }
    });
}

// Fonction pour afficher un message popup temporaire
function showPopup(message) {
    let existing = document.getElementById("popup-message");
    if (existing) existing.remove(); // Supprime tout popup existant

    const popup = document.createElement("div");
    popup.id = "popup-message"; // Définit l'ID du popup
    popup.textContent = message; // Définit le texte du message

    // Applique le style au popup
    Object.assign(popup.style, {
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#ff4d4d",
        color: "white",
        padding: "12px 20px",
        borderRadius: "8px",
        fontWeight: "bold",
        display: "block",
        zIndex: "1000",
        boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
        fontFamily: "Arial, sans-serif",
    });

    document.body.appendChild(popup); // Ajoute le popup au document
    setTimeout(() => popup.remove(), 3000); // Supprime le popup après 3 secondes
}

// Fonction pour afficher un popup indiquant que l'ordinateur réfléchit
function showThinkingPopup() {
    let existing = document.getElementById("thinking-popup");
    if (existing) return; // Si le popup existe déjà, ne rien faire

    const popup = document.createElement("div");
    popup.id = "thinking-popup"; // Définit l'ID du popup
    popup.textContent = "L'ordinateur réfléchit..."; // Texte du popup

    // Applique le style au popup
    Object.assign(popup.style, {
        position: "fixed",
        top: "60px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#444",
        color: "white",
        padding: "10px 16px",
        borderRadius: "8px",
        fontWeight: "bold",
        display: "block",
        zIndex: "1001",
        boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
        fontFamily: "Arial, sans-serif",
    });

    document.body.appendChild(popup); // Ajoute le popup au document
}

// Fonction pour cacher le popup de réflexion
function hideThinkingPopup() {
    const popup = document.getElementById("thinking-popup");
    if (popup) popup.remove(); // Supprime le popup s'il existe
}

// Les autres fonctions suivent la même logique avec des commentaires détaillés pour chaque étape.
