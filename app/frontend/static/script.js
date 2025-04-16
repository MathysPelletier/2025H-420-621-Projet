// script.js avec style modernisé et disposition élégante
let socket = null;

const tileSize = 60;
const imagePath = "/static/assets/";

const pieceImages = {
    'TN': 'Tour-b.svg', 'CN': 'Cavalier-b.svg', 'FN': 'Fou-b.svg',
    'DN': 'Reine-b.svg', 'RN': 'Roi-b.svg', 'PN': 'Pion-b.svg',
    'TB': 'Tour-w.svg', 'CB': 'Cavalier-w.svg', 'FB': 'Fou-w.svg',
    'DB': 'Reine-w.svg', 'RB': 'Roi-w.svg', 'PB': 'Pion-w.svg'
};

const loadedImages = {};
let board = [];
let playerName = null;
let playerColor = null;
let selectedPiece = null;
let selectedPosition = null;
let capturedPiecesWhite = [];
let capturedPiecesBlack = [];
let possibleMoves = [];

function loadImages(callback) {
    let loaded = 0;
    const total = Object.keys(pieceImages).length;
    Object.entries(pieceImages).forEach(([code, file]) => {
        const img = new Image();
        img.src = imagePath + file;
        img.onload = () => {
            if (++loaded === total) callback();
        };
        loadedImages[code] = img;
    });
}

function drawBoard() {
    const ctx = document.getElementById("chessboard").getContext("2d");
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const displayRow = 7 - row;
            ctx.fillStyle = (row + col) % 2 === 0 ? "#333333" : "#C0C0C0";
            ctx.fillRect(col * tileSize, displayRow * tileSize, tileSize, tileSize);
        }
    }

    // Highlight possible moves
    possibleMoves.forEach(move => {
        const x = move.to_col * tileSize;
        const y = (move.to_row) * tileSize;
        ctx.fillStyle = "rgba(255, 255, 0, 0.4)";
        ctx.fillRect(x, y, tileSize, tileSize);
    });
}

function drawPieces(board) {
    const ctx = document.getElementById("chessboard").getContext("2d");
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

function drawPieces(board) {
    const ctx = document.getElementById("chessboard").getContext("2d");
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece !== " " && loadedImages[piece]) {
                const displayRow = row;
                ctx.drawImage(loadedImages[piece], col * tileSize + 5, displayRow * tileSize + 5, tileSize - 10, tileSize - 10);
            }
        }
    }

    // Highlight possible moves
    possibleMoves.forEach(move => {
        const ctx = document.getElementById("chessboard").getContext("2d");
        ctx.fillStyle = "rgba(0, 255, 0, 0.4)";
        const x = move.col * tileSize;
        const y = (7 - move.row) * tileSize;
        ctx.fillRect(x, y, tileSize, tileSize);
    });
}

function updateCapturedDisplay() {
    const whiteDiv = document.getElementById("captured-white");
    const blackDiv = document.getElementById("captured-black");
    whiteDiv.innerHTML = "";
    blackDiv.innerHTML = "";

    capturedPiecesWhite.forEach(code => {
        const img = loadedImages[code];
        if (img) {
            const clone = img.cloneNode();
            clone.style.width = "30px";
            whiteDiv.appendChild(clone);
        }
    });
    capturedPiecesBlack.forEach(code => {
        const img = loadedImages[code];
        if (img) {
            const clone = img.cloneNode();
            clone.style.width = "30px";
            blackDiv.appendChild(clone);
        }
    });
}

function updateCapturedDisplay() {
    const whiteDiv = document.getElementById("captured-white");
    const blackDiv = document.getElementById("captured-black");
    whiteDiv.innerHTML = "";
    blackDiv.innerHTML = "";

    capturedPiecesWhite.forEach(code => {
        const img = loadedImages[code];
        if (img) {
            const clone = img.cloneNode();
            clone.style.width = "30px";
            whiteDiv.appendChild(clone);
        }
    });
    capturedPiecesBlack.forEach(code => {
        const img = loadedImages[code];
        if (img) {
            const clone = img.cloneNode();
            clone.style.width = "30px";
            blackDiv.appendChild(clone);
        }
    });
}

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
    setTimeout(() => popup.remove(), 3000);
}


function setupSocketListeners() {
    socket.on("connect", () => {
        if (!playerName || playerName.trim() === "") {
            playerName = prompt("Entrez votre nom pour débuter la partie :") || "Joueur anonyme";
            const nameDiv = document.getElementById("nom-joueur");
            if (nameDiv) nameDiv.textContent = `Nom du joueur : ${playerName}`;
        }
        socket.emit("register_player", { name: playerName });
        socket.emit("get_board");
    });

    socket.on("update_board", (data) => {
        board = [...data.board];
        selectedPiece = null;
        selectedPosition = null;

        if (data.captured) {
            const piece = data.captured;
            if (piece.endsWith("B")) capturedPiecesWhite.push(piece);
            if (piece.endsWith("N")) capturedPiecesBlack.push(piece);
            updateCapturedDisplay();
        }

        if (data.game_over === false) {
            // Si on vient de faire un reset, vider les pièces capturées
            capturedPiecesWhite = [];
            capturedPiecesBlack = [];
            updateCapturedDisplay();
        }
        

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
            const message = winner ? `La partie est terminée ! ${winner === "white" ? "Blanc" : "Noir"} a gagné !` : "Match nul !";
            showPopup(message);
        }
        possibleMoves = [];
    });

    socket.on("illegal_move", (data) => {
        showPopup(`Mouvement invalide : ${data.error}`);
    });

    socket.on("player_role", (data) => {
        playerColor = data.color;
        const colorText = {
            white: "Vous jouez les Blancs ♙",
            black: "Vous jouez les Noirs ♟",
            spectator: "Vous êtes spectateur 👀"
        };
        const colorDiv = document.getElementById("player-color");
        if (colorDiv) colorDiv.textContent = colorText[playerColor] || "Rôle inconnu";

        const resetBtn = document.getElementById("reset-button");
        if (resetBtn) {
            resetBtn.disabled = (playerColor === "spectator");
            resetBtn.style.opacity = (playerColor === "spectator") ? "0.5" : "1";
            resetBtn.style.cursor = (playerColor === "spectator") ? "not-allowed" : "pointer";
        }
    });

    socket.on("chat_message", (data) => {
        const chatBox = document.getElementById("chat-box");
        const msg = document.createElement("div");
        msg.textContent = `${data.name} : ${data.text}`;
        chatBox.appendChild(msg);
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    socket.on("chat_history", (messages) => {
        const chatBox = document.getElementById("chat-box");
        chatBox.innerHTML = "";
        messages.forEach(msg => {
            const msgDiv = document.createElement("div");
            msgDiv.textContent = `${msg.name} : ${msg.text}`;
            chatBox.appendChild(msgDiv);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    socket.on("possible_moves", (moves) => {
        possibleMoves = moves;
        loadImages(() => {
            drawBoard();
            drawPieces(board);
        });
    });   

    socket.on("opponent_info", (data) => {
        const opponentDiv = document.getElementById("nom-adversaire");
        if (data && data.name) {
            opponentDiv.textContent = `Adversaire : ${data.name}`;
        } else {
            opponentDiv.textContent = `Adversaire : en attente...`;
        }
    });
    
}


window.addEventListener("DOMContentLoaded", () => {
    playerName = prompt("Entrez votre nom pour débuter la partie :") || "Joueur anonyme";

    const container = document.querySelector('.container');
    const chessboard = document.getElementById('chessboard');
    const title = document.querySelector('h1');

    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.alignItems = 'flex-start';
    container.style.justifyContent = 'center';
    container.style.gap = '40px';
    container.style.padding = '20px';

    title.style.display = 'none';

    const leftPanel = document.createElement('div');
    leftPanel.className = 'left-panel';

    const capturedBlack = document.createElement('div');
    capturedBlack.id = 'captured-black';
    capturedBlack.className = 'captured-pieces';

    const capturedWhite = document.createElement('div');
    capturedWhite.id = 'captured-white';
    capturedWhite.className = 'captured-pieces';

    leftPanel.appendChild(capturedBlack);
    leftPanel.appendChild(chessboard);
    leftPanel.appendChild(capturedWhite);

    const rightPanel = document.createElement('div');
    rightPanel.className = 'right-panel';

    const nameDisplay = document.createElement('div');
    nameDisplay.id = 'nom-joueur';
    nameDisplay.className = 'info-block';
    nameDisplay.textContent = `Nom du joueur : ${playerName}`;

    const opponentDisplay = document.createElement('div');
    opponentDisplay.id = 'nom-adversaire';
    opponentDisplay.className = 'info-block';
    opponentDisplay.textContent = `Adversaire : en attente...`;


    const colorInfo = document.createElement('div');
    colorInfo.id = 'player-color';
    colorInfo.className = 'info-block';

    const playerTurnDiv = document.createElement('div');
    playerTurnDiv.id = 'player-turn';
    playerTurnDiv.className = 'info-block';
    playerTurnDiv.textContent = "À qui de jouer : ...";

    const chatBox = document.createElement('div');
    chatBox.id = "chat-box";
    chatBox.style.height = "150px";
    chatBox.style.overflowY = "auto";
    chatBox.style.backgroundColor = "#1f1f1f";
    chatBox.style.border = "1px solid #444";
    chatBox.style.padding = "8px";
    chatBox.style.borderRadius = "6px";
    chatBox.style.fontSize = "14px";

    const chatInput = document.createElement('input');
    chatInput.type = 'text';
    chatInput.placeholder = "Envoyer un message...";
    chatInput.style.marginTop = "8px";
    chatInput.style.padding = "6px";
    chatInput.style.width = "calc(100% - 16px)";
    chatInput.style.boxSizing = "border-box";
    chatInput.style.borderRadius = "6px";
    chatInput.style.border = "1px solid #333";
    chatInput.style.background = "#2c2c2c";
    chatInput.style.color = "#eee";

    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && chatInput.value.trim() !== "") {
            socket.emit("chat_message", {
                name: playerName,
                text: chatInput.value.trim()
            });
            chatInput.value = "";
        }
    });

    const resetBtn = document.createElement('button');
    resetBtn.id = 'reset-button';
    resetBtn.textContent = 'Réinitialiser la partie';
    resetBtn.onclick = () => socket.emit("reset_game");

    rightPanel.append(nameDisplay, opponentDisplay, colorInfo, playerTurnDiv, chatBox, chatInput, resetBtn);
    container.append(leftPanel, rightPanel);

    socket = io();
    setupSocketListeners();

    chessboard.addEventListener("click", (event) => {
        const rect = chessboard.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const col = Math.floor(x / tileSize);
        const row = Math.floor(y / tileSize);

        if (!selectedPiece) {
            selectedPiece = board[row][col];
            selectedPosition = { row, col };

            if ((playerColor === "white" && !selectedPiece.endsWith("B")) ||
                (playerColor === "black" && !selectedPiece.endsWith("N"))) {
                showPopup("Vous ne pouvez sélectionner que vos propres pièces !");
                selectedPiece = null;
                selectedPosition = null;
                return;
            }

            // Demander les déplacements possibles au serveur
            socket.emit("get_possible_moves", selectedPosition);
        } else {
            const isWhiteTurn = playerColor === "white" && selectedPiece.endsWith("B");
            const isBlackTurn = playerColor === "black" && selectedPiece.endsWith("N");
            const isAllowedToMove = (playerColor === "white" && isWhiteTurn) ||
                                    (playerColor === "black" && isBlackTurn);

            if (!isAllowedToMove) {
                showPopup("Ce n'est pas votre tour !");
                selectedPiece = null;
                selectedPosition = null;
                possibleMoves = [];
                return;
            }

            socket.emit("move_piece", {
                from: selectedPosition,
                to: { row, col }
            });

            selectedPiece = null;
            selectedPosition = null;
            possibleMoves = [];
        }
    });
});
