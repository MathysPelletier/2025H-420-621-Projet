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

// ➕ Variable pour stocker le nom du joueur
let playerName = null;

// Fonction pour charger les images des pièces
function loadImages(callback) {
    let imagesToLoad = Object.keys(pieceImages).length;
    let loadedCount = 0;

    Object.entries(pieceImages).forEach(([key, file]) => {
        const img = new Image();
        img.src = imagePath + file;
        img.onload = () => {
            loadedCount++;
            if (loadedCount === imagesToLoad) callback();
        };
        loadedImages[key] = img;
    });
}

// Fonction pour dessiner l'échiquier
function drawBoard() {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const displayRow = 7 - row;
            ctx.fillStyle = (row + col) % 2 === 0 ? "#333333" : "#C0C0C0";
            ctx.fillRect(col * tileSize, displayRow * tileSize, tileSize, tileSize);
        }
    }
}

// Fonction pour dessiner les pièces
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

// Connexion Socket.IO
socket.on("connect", () => {
    // ➕ Envoyer le nom du joueur au serveur
    socket.emit("register_player", { name: playerName });

    // Demander l'état initial du plateau
    socket.emit("get_board");
});

// Réception de la mise à jour du plateau
socket.on("update_board", (data) => {
    board = [...data.board];

    selectedPiece = null;
    selectedCoord = null;
    possibleMoves = [];
    highlightedSquares = [];

    console.log("Board mis à jour depuis le serveur:", board);

    loadImages(() => {
        drawBoard();
        drawPieces(board);
    });

    const playerTurnDiv = document.getElementById("player-turn");
    if (playerTurnDiv && data.current_player) {
        const joueur = data.current_player === "white" ? "Blanc" : "Noir";
        playerTurnDiv.textContent = `C'est au ${joueur}`;
        playerTurnDiv.style.color = data.current_player === "white" ? "#D3D3D3" : "#000000";
    }

    if (data.game_over) {
        const winner = data.winner;
        const message = winner
            ? `La partie est terminée ! ${winner === "white" ? "Blanc" : "Noir"} a gagné !`
            : "La partie est terminée, match nul !";
        showPopup(message);
    }
});

// Popup message
function showPopup(message) {
    let existing = document.getElementById("popup-message");
    if (existing) existing.remove();

    const popup = document.createElement("div");
    popup.id = "popup-message";
    popup.textContent = message;

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

    document.body.appendChild(popup);

    setTimeout(() => {
        popup.remove();
    }, 3000);
}

// Mouvement invalide
socket.on("illegal_move", (data) => {
    showPopup(`Mouvement invalide : ${data.error}`);
});

// Variables pour le suivi de la sélection
let selectedPiece = null;
let selectedPosition = null;

// Clics sur le canvas
canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);

    if (!selectedPiece) {
        selectedPiece = board[row][col];
        selectedPosition = { row, col };

        console.log(`Pièce sélectionnée: ${selectedPiece} à la position [${selectedPosition.row}, ${selectedPosition.col}]`);
    } else {
        console.log(`Déplacement de la pièce ${selectedPiece} de [${selectedPosition.row}, ${selectedPosition.col}] à [${row}, ${col}]`);

        socket.emit("move_piece", {
            from: selectedPosition,
            to: { row, col }
        });

        selectedPiece = null;
        selectedPosition = null;
    }
});

// ➕ Initialisation de la mise en page et des éléments UI
window.onload = () => {
    // ➕ Demande du nom
    playerName = prompt("Entrez votre nom pour débuter la partie :");
    if (!playerName) playerName = "Joueur anonyme";

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

    // ➕ Affichage du nom
    const nameDisplay = document.createElement('div');
    nameDisplay.textContent = `Nom du joueur : ${playerName}`;
    nameDisplay.style.marginBottom = '10px';
    nameDisplay.style.fontSize = '18px';
    nameDisplay.style.color = 'black';
    container.insertBefore(nameDisplay, title.nextSibling);

    // Joueur actuel
    const playerTurnDiv = document.createElement('div');
    playerTurnDiv.id = 'player-turn';
    playerTurnDiv.style.marginTop = '10px';
    playerTurnDiv.style.fontSize = '20px';
    playerTurnDiv.style.color = 'white';
    playerTurnDiv.textContent = "À qui de jouer : ...";
    container.appendChild(playerTurnDiv);

    // Bouton Reset
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
