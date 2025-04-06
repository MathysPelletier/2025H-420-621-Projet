// Initialisation de la connexion Socket.IO
const socket = io();

// Récupération du canvas et de son contexte 2D pour dessiner
const canvas = document.getElementById("chessboard");
const ctx = canvas.getContext("2d");

// Taille d'une case de l'échiquier
const tileSize = 60;

// Chemin des images des pièces
const imagePath = "/static/assets/";

// Dictionnaire associant les pièces à leurs fichiers d'images
const pieceImages = {
    'TN': 'Tour-b.svg', // Tour noire
    'CN': 'Cavalier-b.svg', // Cavalier noir
    'FN': 'Fou-b.svg', // Fou noir
    'DN': 'Reine-b.svg', // Reine noire
    'RN': 'Roi-b.svg', // Roi noir
    'PN': 'Pion-b.svg', // Pion noir
    'TB': 'Tour-w.svg', // Tour blanche
    'CB': 'Cavalier-w.svg', // Cavalier blanc
    'FB': 'Fou-w.svg', // Fou blanc
    'DB': 'Reine-w.svg', // Reine blanche
    'RB': 'Roi-w.svg', // Roi blanc
    'PB': 'Pion-w.svg' // Pion blanc
};

// Objet pour stocker les images chargées
const loadedImages = {};

// Fonction pour charger les images des pièces
function loadImages(callback) {
    let imagesToLoad = Object.keys(pieceImages).length; // Nombre total d'images à charger
    let loadedCount = 0; // Compteur d'images chargées

    // Charger chaque image
    Object.entries(pieceImages).forEach(([key, file]) => {
        const img = new Image();
        img.src = imagePath + file; // Définir la source de l'image
        img.onload = () => {
            loadedCount++; // Incrémenter le compteur à chaque chargement
            if (loadedCount === imagesToLoad) callback(); // Appeler le callback une fois toutes les images chargées
        };
        loadedImages[key] = img; // Stocker l'image chargée
    });
}

// Fonction pour dessiner l'échiquier
function drawBoard() {
    for (let row = 0; row < 8; row++) { // Parcourir les lignes
        for (let col = 0; col < 8; col++) { // Parcourir les colonnes
            // Alterner les couleurs des cases
            ctx.fillStyle = (row + col) % 2 === 0 ? "#eeeed2" : "#769656";
            ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize); // Dessiner une case
        }
    }
}

// Fonction pour dessiner les pièces sur l'échiquier
function drawPieces(board) {
    for (let row = 0; row < 8; row++) { // Parcourir les lignes
        for (let col = 0; col < 8; col++) { // Parcourir les colonnes
            let piece = board[row][col]; // Récupérer la pièce à la position actuelle
            if (piece !== " " && loadedImages[piece]) { // Si une pièce est présente et son image est chargée
                // Dessiner l'image de la pièce avec un léger décalage
                ctx.drawImage(loadedImages[piece], col * tileSize + 5, row * tileSize + 5, tileSize - 10, tileSize - 10);
            }
        }
    }
}

// Événement déclenché lors de la connexion au serveur via Socket.IO
socket.on("connect", () => {
    socket.emit("get_board"); // Demander l'état initial du plateau
});

// Événement pour mettre à jour le plateau via Socket.IO
socket.on("update_board", (data) => {
    loadImages(() => { // Charger les images avant de dessiner
        drawBoard(); // Dessiner l'échiquier
        drawPieces(data.board); // Dessiner les pièces
    });
});

// Ajouter un écouteur d'événements pour détecter les clics sur l'échiquier
canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect(); // Obtenir les dimensions du canvas
    const x = event.clientX - rect.left; // Calculer la position X du clic
    const y = event.clientY - rect.top; // Calculer la position Y du clic

    // Convertir les coordonnées en indices de grille
    const col = Math.floor(x / tileSize); // Calculer la colonne
    const row = 7 - Math.floor(y / tileSize); // Calculer la ligne (inverser l'axe Y)

    console.log(`Case cliquée: Ligne ${row}, Colonne ${col}`); // Afficher la case cliquée
});
