import chess

class Game:
    def __init__(self):
        # Initialise le plateau de jeu avec la bibliothèque python-chess
        self.board = chess.Board()
        # Définit le joueur actuel (les Blancs commencent toujours en premier)
        self.current_player = 'white'
    
    def make_move(self, from_row, from_col, to_row, to_col):
        # Convertit les coordonnées de la grille (ligne, colonne) en indices compatibles avec python-chess
        from_square = chess.square(from_col, 7 - from_row)  # La rangée est inversée car python-chess utilise un index de bas en haut
        to_square = chess.square(to_col, 7 - to_row)
        move = chess.Move(from_square, to_square)  # Crée un objet mouvement

        # Vérifie si le mouvement est légal selon les règles des échecs
        if move in self.board.legal_moves:
            # Vérifie si une pièce est capturée lors du mouvement
            captured_piece = self.board.piece_at(to_square)
            # Effectue le mouvement sur le plateau
            self.board.push(move)

            captured_code = None
            if captured_piece:
                # Si une pièce est capturée, convertit son symbole en un code personnalisé
                symbol = captured_piece.symbol().upper() if captured_piece.color == chess.WHITE else captured_piece.symbol().lower()
                captured_code = self.convert_symbol_to_code(symbol)

            # Retourne un dictionnaire indiquant que le mouvement a réussi et le code de la pièce capturée (s'il y en a une)
            return {"success": True, "captured": captured_code}
        else:
            # Si le mouvement est illégal, retourne un message d'erreur
            return {"success": False, "error": "Mouvement illégal"}

    def get_board_matrix(self):
        # Retourne une matrice 8x8 représentant l'état actuel du plateau d'échecs
        # Chaque case contient soit le code personnalisé de la pièce, soit un espace vide
        board_matrix = []
        for rank in range(7, -1, -1):  # Parcourt les rangées de haut en bas (notation échiquier)
            row = []
            for file in range(8):  # Parcourt les colonnes de gauche à droite
                square = chess.square(file, rank)  # Obtient l'index de la case
                piece = self.board.piece_at(square)  # Obtient la pièce présente sur cette case (s'il y en a une)
                if piece:
                    # Si une pièce est présente, obtient son symbole (majuscule pour les Blancs, minuscule pour les Noirs)
                    symbol = piece.symbol().upper() if piece.color == chess.WHITE else piece.symbol().lower()
                    # Convertit le symbole en un code personnalisé
                    row.append(self.convert_symbol_to_code(symbol))
                else:
                    # Si aucune pièce n'est présente, ajoute un espace vide
                    row.append(" ")
            # Ajoute la rangée à la matrice
            board_matrix.append(row)
        return board_matrix

    def convert_symbol_to_code(self, symbol):
        # Associe les symboles des pièces de python-chess à des codes personnalisés
        codes = {
            "P": "PB", "p": "PN",  # Pion blanc et noir
            "R": "TB", "r": "TN",  # Tour blanche et noire
            "N": "CB", "n": "CN",  # Cavalier blanc et noir
            "B": "FB", "b": "FN",  # Fou blanc et noir
            "Q": "DB", "q": "DN",  # Dame blanche et noire
            "K": "RB", "k": "RN",  # Roi blanc et noir
        }
        # Retourne le code correspondant ou un espace vide si le symbole est inconnu
        return codes.get(symbol, " ")
    
    def get_current_player(self):
        # Retourne le joueur actuel ('white' pour Blancs ou 'black' pour Noirs)
        # Cela dépend du tour actuel sur le plateau (python-chess gère les tours)
        return "white" if self.board.turn == chess.WHITE else "black"
    
    def get_fen(self):
        # Retourne la position actuelle du plateau sous forme de notation FEN (Forsyth-Edwards Notation)
        # La notation FEN est une représentation standardisée des positions d'échecs
        return self.board.fen()

    def set_fen(self, fen):
        # Met à jour le plateau en chargeant une position à partir d'une notation FEN donnée
        self.board.set_fen(fen)
    
    def is_game_over(self):
        # Vérifie si la partie est terminée (échec et mat, pat, etc.)
        if self.board.is_game_over():
            # Si la partie est terminée, obtient le résultat ('1-0', '0-1', '1/2-1/2')
            result = self.board.result()
            winner = None
            if result == '1-0':
                winner = 'white'  # Les Blancs gagnent
            elif result == '0-1':
                winner = 'black'  # Les Noirs gagnent
            # Retourne le gagnant ou None en cas de match nul
            return winner
        # Si la partie n'est pas terminée, retourne None
        return None
    
    def reset(self):
        # Réinitialise complètement le jeu en recréant un plateau vide et en réinitialisant le joueur actuel
        self.board = chess.Board()  # Crée un nouveau plateau
        self.current_player = 'white'  # Réinitialise le joueur actuel aux Blancs
