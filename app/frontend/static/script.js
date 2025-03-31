const canvas = document.getElementById("chessboard");
const ctx = canvas.getContext("2d");

const squareSize = 60; // Taille d'une case
const boardSize = 8; // Taille de l'échiquier (8x8)

// Dessiner les cases de l'échiquier
for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
        // Déterminer la couleur de la case
        const isWhite = (row + col) % 2 === 0;
        ctx.fillStyle = isWhite ? "white" : "black";

        // Dessiner la case
        ctx.fillRect(col * squareSize, row * squareSize, squareSize, squareSize);
    }
}

// Ajouter un contour autour de l'échiquier
ctx.strokeStyle = "black"; // Couleur du contour
ctx.lineWidth = 2; // Épaisseur du contour
ctx.strokeRect(0, 0, boardSize * squareSize, boardSize * squareSize);

// Structure des pièces (tirée de board.py)
const pieces = [
    ["R", "N", "B", "Q", "K", "B", "N", "R"], // Rangée 1 (blancs)
    ["P", "P", "P", "P", "P", "P", "P", "P"], // Rangée 2 (pions blancs)
    ["", "", "", "", "", "", "", ""],         // Rangée 3
    ["", "", "", "", "", "", "", ""],         // Rangée 4
    ["", "", "", "", "", "", "", ""],         // Rangée 5
    ["", "", "", "", "", "", "", ""],         // Rangée 6
    ["p", "p", "p", "p", "p", "p", "p", "p"], // Rangée 7 (pions noirs)
    ["r", "n", "b", "q", "k", "b", "n", "r"]  // Rangée 8 (noirs)
];

// Fonction pour dessiner une pièce
function drawPiece(piece, x, y) {
    if (!piece) return; // Ne rien dessiner si la case est vide

    ctx.fillStyle = "red"; // Couleur des pièces (temporaire)
    ctx.font = "40px Arial"; // Taille et police des pièces
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Dessiner la pièce au centre de la case
    ctx.fillText(piece, x + squareSize / 2, y + squareSize / 2);
}

// Dessiner les pièces sur l'échiquier
for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
        const piece = pieces[row][col];
        drawPiece(piece, col * squareSize, row * squareSize);
    }
}