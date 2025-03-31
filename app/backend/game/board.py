class Board:
    def __init__(self):
            self.board = self.create_initial_board()  

    def create_initial_board(self):
        """ Créer un plateau de 8x8 avec les positions initiales """
        initial_board = [
            ['T', 'C', 'F', 'D', 'R', 'F', 'C', 'T'],  # Rangée des pièces noires
            ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],  # Pions noirs
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],  # Cases vides
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],  # Cases vides
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],  # Cases vides
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],  # Cases vides
            ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],  # Pions blancs
            ['T', 'C', 'F', 'D', 'R', 'F', 'C', 'T']   # Rangée des pièces blanches
        ]
        return initial_board
