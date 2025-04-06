class Game:
    def __init__(self):
        # Importation de la classe Board depuis le module local
        from .board import Board
        # Initialisation du plateau de jeu
        self.board = Board()
        # Définition du joueur actuel (blanc commence généralement dans les jeux d'échecs, par exemple)
        self.current_player = 'white'

    def start_game(self):
        # Logique pour démarrer une nouvelle partie (à implémenter)
        pass