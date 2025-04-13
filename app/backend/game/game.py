import chess

class Game:
    def __init__(self):
        # Initialisation du plateau de jeu avec python-chess
        self.board = chess.Board()
        # Définition du joueur actuel (Blanc commence)
        self.current_player = 'white'
    
    def make_move(self, from_row, from_col, to_row, to_col):
        # Convertir les coordonnées en notation UCI pour python-chess
        from_square = chess.square(from_col, 7 - from_row)  # Inverser les rangées pour correspondre à l'indexation de python-chess
        to_square = chess.square(to_col, 7 - to_row)  # Inverser les rangées pour correspondre à l'indexation de python-chess

        # Créer un mouvement en utilisant les coordonnées converties
        move = chess.Move(from_square, to_square)
        
        # Vérifier si le mouvement est légal
        if move in self.board.legal_moves:
            self.board.push(move)  # Effectuer le mouvement sur le plateau
            return {"success": True}  # Retourner un succès si le mouvement est valide
        else:
            return {"success": False, "error": "Mouvement illégal"}  # Retourner une erreur si le mouvement est illégal

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
                    row.append(self.convert_symbol_to_code(symbol))  # Convertir le symbole en code personnalisé
                else:
                    row.append(" ")  # Ajouter un espace vide si aucune pièce n'est présente
            board_matrix.append(row)  # Ajouter la rangée à la matrice
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
        return codes.get(symbol, " ")  # Retourne le code ou un espace vide si le symbole est inconnu
    
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
            result = self.board.result()  # Obtenir le résultat de la partie ('1-0', '0-1', '1/2-1/2')
            winner = None
            if result == '1-0':
                winner = 'white'  # Blanc gagne
            elif result == '0-1':
                winner = 'black'  # Noir gagne
            return winner  # Retourne le gagnant ou None en cas de match nul
        return None  # Partie en cours
    
    def reset(self):
        # Réinitialise complètement le jeu en recréant un plateau vide et en réinitialisant le joueur actuel
        self.board = chess.Board()
        self.current_player = 'white'
