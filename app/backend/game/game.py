import chess

class Game:
    def __init__(self):
        # Initialisation du plateau de jeu avec python-chess
        self.board = chess.Board()
        # Définition du joueur actuel (Blanc commence)
        self.current_player = 'white'
    
    def make_move(self, from_row, from_col, to_row, to_col):
        # Convertit les coordonnées de la grille en indices python-chess
        from_square = chess.square(from_col, 7 - from_row)
        to_square = chess.square(to_col, 7 - to_row)
        move = chess.Move(from_square, to_square)

        # Vérifie si le mouvement est légal
        if move in self.board.legal_moves:
            # Vérifie si une pièce est capturée
            captured_piece = self.board.piece_at(to_square)
            # Effectue le mouvement
            self.board.push(move)

            captured_code = None
            if captured_piece:
                # Convertit le symbole de la pièce capturée en code personnalisé
                symbol = captured_piece.symbol().upper() if captured_piece.color == chess.WHITE else captured_piece.symbol().lower()
                captured_code = self.convert_symbol_to_code(symbol)

            # Retourne le succès du mouvement et le code de la pièce capturée (le cas échéant)
            return {"success": True, "captured": captured_code}
        else:
            # Retourne une erreur si le mouvement est illégal
            return {"success": False, "error": "Mouvement illégal"}

    def get_board_matrix(self):
        # Retourne une matrice 8x8 représentant l'état actuel du plateau
        # Chaque case contient le code personnalisé de la pièce ou un espace vide
        board_matrix = []
        for rank in range(7, -1, -1):  # Parcourir les rangées de 8 à 1 (notation échiquier)
            row = []
            for file in range(8):  # Parcourir les colonnes de 'a' à 'h'
                square = chess.square(file, rank)  # Obtenir l'index de la case
                piece = self.board.piece_at(square)  # Obtenir la pièce sur cette case
                if piece:
                    # Obtenir le symbole de la pièce (majuscule pour blanc, minuscule pour noir)
                    symbol = piece.symbol().upper() if piece.color == chess.WHITE else piece.symbol().lower()
                    # Convertir le symbole en code personnalisé
                    row.append(self.convert_symbol_to_code(symbol))
                else:
                    # Ajouter un espace vide si aucune pièce n'est présente
                    row.append(" ")
            # Ajouter la rangée à la matrice
            board_matrix.append(row)
        return board_matrix

    def convert_symbol_to_code(self, symbol):
        # Associe les symboles de python-chess à des codes personnalisés
        codes = {
            "P": "PB", "p": "PN",  # Pion blanc et noir
            "R": "TB", "r": "TN",  # Tour blanche et noire
            "N": "CB", "n": "CN",  # Cavalier blanc et noir
            "B": "FB", "b": "FN",  # Fou blanc et noir
            "Q": "DB", "q": "DN",  # Dame blanche et noire
            "K": "RB", "k": "RN",  # Roi blanc et noir
        }
        # Retourne le code ou un espace vide si le symbole est inconnu
        return codes.get(symbol, " ")
    
    def get_current_player(self):
        # Retourne le joueur actuel ('white' ou 'black') en fonction du tour
        return "white" if self.board.turn == chess.WHITE else "black"
    
    def get_fen(self):
        # Retourne la notation FEN (Forsyth-Edwards Notation) représentant l'état du plateau
        return self.board.fen()

    def set_fen(self, fen):
        # Charge une position à partir d'une notation FEN pour mettre à jour le plateau
        self.board.set_fen(fen)
    
    def is_game_over(self):
        # Vérifie si la partie est terminée (échec et mat, pat, etc.)
        if self.board.is_game_over():
            # Obtenir le résultat de la partie ('1-0', '0-1', '1/2-1/2')
            result = self.board.result()
            winner = None
            if result == '1-0':
                winner = 'white'  # Blanc gagne
            elif result == '0-1':
                winner = 'black'  # Noir gagne
            # Retourne le gagnant ou None en cas de match nul
            return winner
        # Partie en cours
        return None
    
    def reset(self):
        # Réinitialise complètement le jeu en recréant un plateau vide et en réinitialisant le joueur actuel
        self.board = chess.Board()
        self.current_player = 'white'
