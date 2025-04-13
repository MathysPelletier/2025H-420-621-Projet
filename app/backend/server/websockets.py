from flask_socketio import SocketIO, emit
from game import Game

# Crée un objet Game global
game = Game()

def register_websocket_events(socketio, game):
    print("Registering websocket events")

    # Gestionnaire d'événement pour 'get_board'
    @socketio.on('get_board')
    def handle_get_board():
        # Récupère l'état actuel du plateau et le joueur courant
        board_matrix = game.get_board_matrix()
        current_player = game.current_player
        print(board_matrix)
        # Émet un événement 'update_board' avec l'état du plateau et le joueur courant
        emit('update_board', {
            'board': board_matrix,
            'current_player': current_player
        })

    # Gestionnaire d'événement pour 'set_board'
    @socketio.on('set_board')
    def handle_set_board(data):
        # Récupère la chaîne FEN envoyée par le client
        fen = data.get('fen')
        if fen:
            # Met à jour le plateau avec la chaîne FEN
            game.set_fen(fen)
            print(f"Plateau mis à jour avec FEN: {fen}")
            # Récupère l'état du plateau et le joueur courant après la mise à jour
            board_matrix = game.get_board_matrix()
            current_player = game.current_player
            # Émet un événement 'update_board' avec les nouvelles informations
            emit('update_board', {
                'board': board_matrix,
                'current_player': current_player
            })
        else:
            # Affiche un message d'erreur si la chaîne FEN est invalide
            print("FEN invalide reçue.")

    # Gestionnaire d'événement pour 'move_piece'
    @socketio.on('move_piece')
    def handle_move_piece(data):
        # Récupère les coordonnées de la pièce à déplacer et la destination
        from_row = data['from']['row']
        from_col = data['from']['col']
        to_row = data['to']['row']
        to_col = data['to']['col']

        # Effectue le déplacement et récupère le résultat
        move_result = game.make_move(from_row, from_col, to_row, to_col)

        if move_result["success"]:
            # Si le déplacement est valide, récupère l'état du plateau et le joueur courant
            board_matrix = game.get_board_matrix()
            current_player = game.get_current_player()  # Assurez-vous de récupérer le joueur actuel
            
            # Vérifie si la partie est terminée et récupère le gagnant
            winner = game.is_game_over()
            if winner:
                # Si la partie est terminée, émet un événement avec les informations du gagnant
                emit('update_board', {
                    'board': board_matrix,
                    'current_player': current_player,
                    'game_over': True,
                    'winner': winner  # Envoyer l'information du gagnant
                }, broadcast=True)
            else:
                # Sinon, met simplement à jour le plateau et le joueur courant
                emit('update_board', {
                    'board': board_matrix,
                    'current_player': current_player
                }, broadcast=True)
        else:
            # Si le déplacement est invalide, émet un événement 'illegal_move' avec un message d'erreur
            emit('illegal_move', {'error': move_result["error"]})
    
    # Gestionnaire d'événement pour 'reset_game'
    @socketio.on('reset_game')
    def handle_reset_game():
        # Réinitialise la partie en appelant la méthode reset
        game.reset()
        print("Partie réinitialisée.")
        # Émet un événement 'update_board' avec l'état initial du plateau et du joueur courant
        emit('update_board', {
            'board': game.get_board_matrix(),
            'current_player': game.get_current_player(),
            'game_over': False
        }, broadcast=True)
