import chess

class Game:
    def __init__(self):
        # Initialisation du plateau de jeu avec python-chess
        self.board = chess.Board()
        # Définition du joueur actuel (Blanc commence)
        self.current_player = 'white'
    
    def make_move(self, from_row, from_col, to_row, to_col):
        # Convertir les coordonnées en notation UCI pour python-chess
        from_square = chess.square(from_col, 7 - from_row)  # Inverser les rangées
        to_square = chess.square(to_col, 7 - to_row)  # Inverser les rangées

        move = chess.Move(from_square, to_square)
        
        if move in self.board.legal_moves:
            self.board.push(move)  # Effectuer le mouvement
            return {"success": True}
        else:
            return {"success": False, "error": "Mouvement illégal"}

    def get_board_matrix(self):
        # Retourne une matrice 8x8 avec les noms des pièces comme avant ("PB", "TN", etc.)
        board_matrix = []
        for rank in range(7, -1, -1):  # De la rangée 8 à 1
            row = []
            for file in range(8):  # De 'a' à 'h'
                square = chess.square(file, rank)
                piece = self.board.piece_at(square)
                if piece:
                    symbol = piece.symbol().upper() if piece.color == chess.WHITE else piece.symbol().lower()
                    row.append(self.convert_symbol_to_code(symbol))
                else:
                    row.append(" ")
            board_matrix.append(row)
        return board_matrix

    def convert_symbol_to_code(self, symbol):
        # Associe les symboles de python-chess à tes codes personnalisés
        codes = {
            "P": "PB", "p": "PN",
            "R": "TB", "r": "TN",
            "N": "CB", "n": "CN",
            "B": "FB", "b": "FN",
            "Q": "DB", "q": "DN",
            "K": "RB", "k": "RN",
        }
        return codes.get(symbol, " ")
    
    def get_current_player(self):
        # Retourne 'white' ou 'black' en fonction du joueur actuel
        return "white" if self.board.turn == chess.WHITE else "black"
    
    def get_fen(self):
        # Retourne la notation FEN du plateau
        return self.board.fen()

    def set_fen(self, fen):
        # Charge une notation FEN pour mettre à jour le plateau
        self.board.set_fen(fen)
    
    def is_game_over(self):
    # Vérifie si la partie est terminée (échec et mat, pat, etc.)
        if self.board.is_game_over():
            result = self.board.result()  # '1-0' pour blanc gagne, '0-1' pour noir gagne, '1/2-1/2' pour match nul
            winner = None
            if result == '1-0':
                winner = 'white'
            elif result == '0-1':
                winner = 'black'
            return winner  # Retourne le gagnant ou None en cas de match nul
        return None  # Partie en cours
    
    def reset(self):
        # Cette méthode pourrait être utilisée pour réinitialiser complètement le jeu
        self.board = chess.Board()
        self.current_player = 'white'

