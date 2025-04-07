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
    'TN': 'Tour-b.svg',      // ✅ Tour noire
    'CN': 'Cavalier-b.svg',  // ✅ Cavalier noir
    'FN': 'Fou-b.svg',       // ✅ Fou noir
    'DN': 'Reine-b.svg',     // ✅ Reine noire
    'RN': 'Roi-b.svg',       // ✅ Roi noir
    'PN': 'Pion-b.svg',      // ✅ Pion noir
    'TB': 'Tour-w.svg',      // ✅ Tour blanche
    'CB': 'Cavalier-w.svg',  // ✅ Cavalier blanc
    'FB': 'Fou-w.svg',       // ✅ Fou blanc
    'DB': 'Reine-w.svg',     // ✅ Reine blanche
    'RB': 'Roi-w.svg',       // ✅ Roi blanc
    'PB': 'Pion-w.svg'       // ✅ Pion blanc
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
            const displayRow = 7 - row; // ← inverser Y pour l'affichage
            ctx.fillStyle = (row + col) % 2 === 0 ? "#333333" : "#C0C0C0";
            ctx.fillRect(col * tileSize, displayRow * tileSize, tileSize, tileSize);
        }
    }
}


function drawPieces(board) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece !== " " && loadedImages[piece]) {
                const displayRow = row;
                ctx.drawImage(loadedImages[piece], col * tileSize + 5, displayRow * tileSize + 5, tileSize - 10, tileSize - 10);
            }
        }
    }
}


// Événement déclenché lors de la connexion au serveur via Socket.IO
socket.on("connect", () => {
    socket.emit("get_board"); // Demander l'état initial du plateau
});

socket.on("update_board", (data) => {
    // 🔄 Réinitialiser toutes les données locales liées à l'état de jeu
    board = [...data.board];

    // Forcer reset des états internes liés à l'interaction
    selectedPiece = null;
    selectedCoord = null;
    possibleMoves = [];
    highlightedSquares = [];

    console.log("Board mis à jour depuis le serveur:", board);

    // Recharger les images et redessiner
    loadImages(() => {
        drawBoard();
        drawPieces(board);
    });

    // 🔁 Mettre à jour le joueur courant
    const playerTurnDiv = document.getElementById("player-turn");
    if (playerTurnDiv && data.current_player) {
        const joueur = data.current_player === "white" ? "Blanc" : "Noir";
        playerTurnDiv.textContent = `C'est au ${joueur}`;
        playerTurnDiv.style.color = data.current_player === "white" ? "#D3D3D3" : "#000000";
    }

    // 🏁 Si partie terminée
    if (data.game_over) {
        const winner = data.winner;
        const message = winner
            ? `La partie est terminée ! ${winner === "white" ? "Blanc" : "Noir"} a gagné !`
            : "La partie est terminée, match nul !";
        showPopup(message);
    }
});


function showPopup(message) {
    // Si le popup existe déjà, on l'enlève pour éviter les doublons
    let existing = document.getElementById("popup-message");
    if (existing) {
        existing.remove();
    }

    // Créer une div pour le popup
    const popup = document.createElement("div");
    popup.id = "popup-message";
    popup.textContent = message;

    // Appliquer le style
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

    // Ajouter au body
    document.body.appendChild(popup);

    // Supprimer après 3 secondes
    setTimeout(() => {
        popup.remove();
    }, 3000);
}

// Écoute de l’événement de mouvement invalide
socket.on("illegal_move", (data) => {
    showPopup(`Mouvement invalide : ${data.error}`);
});


// Variables pour suivre la sélection et le déplacement
let selectedPiece = null;
let selectedPosition = null;

canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);

    if (!selectedPiece) {
        // Si aucune pièce n'est sélectionnée, c'est le premier clic
        selectedPiece = board[row][col]; // Récupérer la pièce sélectionnée
        selectedPosition = { row, col }; // Récupérer la position de la pièce

        // Afficher la pièce sélectionnée dans la console
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


window.onload = () => {
    const container = document.querySelector('.container');
    const chessboard = document.getElementById('chessboard');
    const title = document.querySelector('h1');

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

    // 🔄 Bouton RESET
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
        socket.emit("reset_game");
    };

    container.appendChild(resetBtn);
};

