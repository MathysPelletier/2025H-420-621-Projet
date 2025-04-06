class Board:
    def __init__(self):
            self.board = self.create_initial_board()  

    def create_initial_board(self):
        initial_board = [
            ['TN', 'CN', 'FN', 'DN', 'RN', 'FN', 'CN', 'TN'],  # Rangée des pièces noires
            ['PN', 'PN', 'PN', 'PN', 'PN', 'PN', 'PN', 'PN'],  # Pions noirs
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],  # Cases vides
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],  # Cases vides
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],  # Cases vides
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],  # Cases vides
            ['PB', 'PB', 'PB', 'PB', 'PB', 'PB', 'PB', 'PB'],  # Pions blancs
            ['TB', 'CB', 'FB', 'DB', 'RB', 'FB', 'CB', 'TB']   # Rangée des pièces blanches
        ]
        return initial_board
