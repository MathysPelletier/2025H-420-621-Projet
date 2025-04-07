from flask_socketio import SocketIO, emit
from game import Game

# Crée un objet Game global
game = Game()

def register_websocket_events(socketio, game):
    print("Registering websocket events")

    # Gestionnaire d'événement pour 'get_board'
    @socketio.on('get_board')
    def handle_get_board():
        board_matrix = game.get_board_matrix()
        current_player = game.current_player
        print(board_matrix)
        emit('update_board', {
            'board': board_matrix,
            'current_player': current_player
        })

    @socketio.on('set_board')
    def handle_set_board(data):
        fen = data.get('fen')
        if fen:
            game.set_fen(fen)
            print(f"Plateau mis à jour avec FEN: {fen}")
            board_matrix = game.get_board_matrix()
            current_player = game.current_player
            emit('update_board', {
                'board': board_matrix,
                'current_player': current_player
            })
        else:
            print("FEN invalide reçue.")

    @socketio.on('move_piece')
    def handle_move_piece(data):
        from_row = data['from']['row']
        from_col = data['from']['col']
        to_row = data['to']['row']
        to_col = data['to']['col']

        move_result = game.make_move(from_row, from_col, to_row, to_col)

        if move_result["success"]:
            board_matrix = game.get_board_matrix()
            current_player = game.get_current_player()  # Assurez-vous de récupérer le joueur actuel
            
            # Vérifier si la partie est terminée et obtenir le gagnant
            winner = game.is_game_over()
            if winner:
                emit('update_board', {
                    'board': board_matrix,
                    'current_player': current_player,
                    'game_over': True,
                    'winner': winner  # Envoyer l'information du gagnant
                }, broadcast=True)
            else:
                emit('update_board', {
                    'board': board_matrix,
                    'current_player': current_player
                }, broadcast=True)
        else:
            emit('illegal_move', {'error': move_result["error"]})
