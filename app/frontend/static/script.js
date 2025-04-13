// Initialisation de la connexion Socket.IO
const socket = io(); // Permet de communiquer avec le serveur via WebSocket

// Récupération du canvas et de son contexte 2D pour dessiner
const canvas = document.getElementById("chessboard");
const ctx = canvas.getContext("2d");

// Taille d'une case de l'échiquier
const tileSize = 60;

// Chemin des images des pièces
const imagePath = "/static/assets/";

// Dictionnaire associant les pièces à leurs fichiers d'images
const pieceImages = {
    'TN': 'Tour-b.svg',      // Tour noire
    'CN': 'Cavalier-b.svg',  // Cavalier noir
    'FN': 'Fou-b.svg',       // Fou noir
    'DN': 'Reine-b.svg',     // Reine noire
    'RN': 'Roi-b.svg',       // Roi noir
    'PN': 'Pion-b.svg',      // Pion noir
    'TB': 'Tour-w.svg',      // Tour blanche
    'CB': 'Cavalier-w.svg',  // Cavalier blanc
    'FB': 'Fou-w.svg',       // Fou blanc
    'DB': 'Reine-w.svg',     // Reine blanche
    'RB': 'Roi-w.svg',       // Roi blanc
    'PB': 'Pion-w.svg'       // Pion blanc
};

// Objet pour stocker les images chargées
const loadedImages = {};

// Variable pour stocker l'état du plateau
let board = [];

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
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const displayRow = 7 - row; // Inverser Y pour l'affichage (échiquier orienté)
            ctx.fillStyle = (row + col) % 2 === 0 ? "#333333" : "#C0C0C0"; // Couleur alternée des cases
            ctx.fillRect(col * tileSize, displayRow * tileSize, tileSize, tileSize); // Dessiner une case
        }
    }
}

// Fonction pour dessiner les pièces sur l'échiquier
function drawPieces(board) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col]; // Récupérer la pièce à la position donnée
            if (piece !== " " && loadedImages[piece]) { // Si une pièce est présente
                const displayRow = row; // Pas d'inversion ici
                ctx.drawImage(loadedImages[piece], col * tileSize + 5, displayRow * tileSize + 5, tileSize - 10, tileSize - 10); // Dessiner la pièce
            }
        }
    }
}

// Événement déclenché lors de la connexion au serveur via Socket.IO
socket.on("connect", () => {
    socket.emit("get_board"); // Demander l'état initial du plateau au serveur
});

// Événement pour mettre à jour le plateau
socket.on("update_board", (data) => {
    board = [...data.board]; // Mettre à jour l'état local du plateau

    // Réinitialiser les états internes liés à l'interaction
    selectedPiece = null;
    selectedCoord = null;
    possibleMoves = [];
    highlightedSquares = [];

    console.log("Board mis à jour depuis le serveur:", board);

    // Recharger les images et redessiner l'échiquier
    loadImages(() => {
        drawBoard();
        drawPieces(board);
    });

    // Mettre à jour l'affichage du joueur courant
    const playerTurnDiv = document.getElementById("player-turn");
    if (playerTurnDiv && data.current_player) {
        const joueur = data.current_player === "white" ? "Blanc" : "Noir";
        playerTurnDiv.textContent = `C'est au ${joueur}`;
        playerTurnDiv.style.color = data.current_player === "white" ? "#D3D3D3" : "#000000";
    }

    // Si la partie est terminée
    if (data.game_over) {
        const winner = data.winner;
        const message = winner
            ? `La partie est terminée ! ${winner === "white" ? "Blanc" : "Noir"} a gagné !`
            : "La partie est terminée, match nul !";
        showPopup(message); // Afficher un message de fin de partie
    }
});

// Fonction pour afficher un popup avec un message
function showPopup(message) {
    let existing = document.getElementById("popup-message"); // Vérifier si un popup existe déjà
    if (existing) {
        existing.remove(); // Supprimer l'ancien popup
    }

    const popup = document.createElement("div"); // Créer une div pour le popup
    popup.id = "popup-message";
    popup.textContent = message;

    // Appliquer le style au popup
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

    document.body.appendChild(popup); // Ajouter le popup au body

    setTimeout(() => {
        popup.remove(); // Supprimer le popup après 3 secondes
    }, 3000);
}

// Écoute de l’événement de mouvement invalide
socket.on("illegal_move", (data) => {
    showPopup(`Mouvement invalide : ${data.error}`); // Afficher un message d'erreur
});

// Variables pour suivre la sélection et le déplacement
let selectedPiece = null;
let selectedPosition = null;

// Gestion des clics sur le canvas
canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect(); // Récupérer les dimensions du canvas
    const x = event.clientX - rect.left; // Calculer la position X du clic
    const y = event.clientY - rect.top; // Calculer la position Y du clic

    const col = Math.floor(x / tileSize); // Calculer la colonne cliquée
    const row = Math.floor(y / tileSize); // Calculer la ligne cliquée

    if (!selectedPiece) {
        // Si aucune pièce n'est sélectionnée, c'est le premier clic
        selectedPiece = board[row][col]; // Récupérer la pièce sélectionnée
        selectedPosition = { row, col }; // Récupérer la position de la pièce

        console.log(`Pièce sélectionnée: ${selectedPiece} à la position [${selectedPosition.row}, ${selectedPosition.col}]`);
    } else {
        // Si une pièce est déjà sélectionnée, c'est le deuxième clic
        console.log(`Déplacement de la pièce ${selectedPiece} de [${selectedPosition.row}, ${selectedPosition.col}] à [${row}, ${col}]`);

        // Envoyer la demande de déplacement au serveur
        socket.emit("move_piece", {
            from: selectedPosition,
            to: { row, col }
        });

        // Réinitialiser la sélection après le déplacement
        selectedPiece = null;
        selectedPosition = null;
    }
});

// Initialisation de la mise en page et des éléments de l'interface utilisateur
window.onload = () => {
    const container = document.querySelector('.container');
    const chessboard = document.getElementById('chessboard');
    const title = document.querySelector('h1');

    // Centrer le contenu
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.height = `${window.innerHeight}px`;
    container.style.width = `${window.innerWidth}px`;

    title.style.marginBottom = '20px';
    chessboard.style.margin = '0';

    // Affichage du joueur actuel
    const playerTurnDiv = document.createElement('div');
    playerTurnDiv.id = 'player-turn';
    playerTurnDiv.style.marginTop = '10px';
    playerTurnDiv.style.fontSize = '20px';
    playerTurnDiv.style.color = 'white';
    playerTurnDiv.textContent = "À qui de jouer : ...";
    container.appendChild(playerTurnDiv);

    // Bouton RESET pour réinitialiser la partie
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Réinitialiser la partie';
    resetBtn.style.marginTop = '20px';
    resetBtn.style.padding = '10px 20px';
    resetBtn.style.fontSize = '16px';
    resetBtn.style.borderRadius = '8px';
    resetBtn.style.border = 'none';
    resetBtn.style.cursor = 'pointer';
    resetBtn.style.backgroundColor = '#f44336';
    resetBtn.style.color = 'white';

    resetBtn.onclick = () => {
        socket.emit("reset_game"); // Envoyer une demande de réinitialisation au serveur
    };

    container.appendChild(resetBtn); // Ajouter le bouton au conteneur
};
