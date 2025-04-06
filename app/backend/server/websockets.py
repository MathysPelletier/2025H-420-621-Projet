from flask_socketio import SocketIO, emit

# Fonction pour enregistrer les événements WebSocket
def register_websocket_events(socketio):
    print("Registering websocket events")  # Log indiquant que les événements WebSocket sont enregistrés

    # Gestionnaire d'événement pour l'événement 'get_board'
    @socketio.on('get_board')
    def handle_get_board():
        # Importation de l'objet 'game' depuis le module app (évite les importations circulaires)
        from .app import game
        # Création ou récupération du plateau de jeu initial
        board = game.board.create_initial_board()  # Remplacez par la fonction réelle pour récupérer le plateau
        # Envoi du plateau de jeu au client via l'événement 'update_board'
        emit('update_board', {'board': board})