const socket = io();
const canvas = document.getElementById("chessboard");
const ctx = canvas.getContext("2d");
const tileSize = 60;

// Chargement des images des pièces
const imagePath = "/static/assets/";
const pieceImages = {
    'TN': 'Tour-b.svg', 'CN': 'Cavalier-b.svg', 'FN': 'Fou-b.svg', 'DN': 'Reine-b.svg', 'RN': 'Roi-b.svg', 'PN': 'Pion-b.svg',
    'TB': 'Tour-w.svg', 'CB': 'Cavalier-w.svg', 'FB': 'Fou-w.svg', 'DB': 'Reine-w.svg', 'RB': 'Roi-w.svg', 'PB': 'Pion-w.svg'
};

const loadedImages = {};

// Charger les images des pièces
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

// Dessiner l'échiquier
function drawBoard() {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            ctx.fillStyle = (row + col) % 2 === 0 ? "#eeeed2" : "#769656";
            ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
        }
    }
}

// Dessiner les pièces
function drawPieces(board) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            let piece = board[row][col];
            if (piece !== " " && loadedImages[piece]) {
                ctx.drawImage(loadedImages[piece], col * tileSize + 5, row * tileSize + 5, tileSize - 10, tileSize - 10);
            }
        }
    }
}

// Connexion Socket.IO
socket.on("connect", () => {
    socket.emit("get_board");
});

// Mise à jour du plateau via Socket.IO
socket.on("update_board", (data) => {
    loadImages(() => {
        drawBoard();
        drawPieces(data.board);
    });
});

// Écouteur d'événements pour détecter les clics sur l'échiquier
canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convertir les coordonnées en index de grille
    const col = Math.floor(x / tileSize);
    const row = 7 - Math.floor(y / tileSize); // Inverser l'axe Y

    console.log(`Case cliquée: Ligne ${row}, Colonne ${col}`);
});

