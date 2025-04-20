from flask_socketio import SocketIO, emit
from game import Game
from flask import request
import chess

# Stocke les joueurs connectés et leur rôle
connected_players = {}

# Historique des messages du chat
chat_history = []

# Crée un objet Game global
game = Game()

def register_websocket_events(socketio, game):
    print("Registering websocket events")

    # Gestionnaire d'événement pour récupérer l'état du plateau
    @socketio.on('get_board')
    def handle_get_board():
        board_matrix = game.get_board_matrix()  # Obtenir la matrice du plateau
        current_player = game.current_player  # Obtenir le joueur actuel
        print(board_matrix)
        emit('update_board', {
            'board': board_matrix,
            'current_player': current_player
        })

    # Gestionnaire d'événement pour mettre à jour le plateau avec une FEN
    @socketio.on('set_board')
    def handle_set_board(data):
        fen = data.get('fen')  # Récupérer la FEN envoyée par le client
        if fen:
            game.set_fen(fen)  # Mettre à jour le plateau avec la FEN
            print(f"Plateau mis à jour avec FEN: {fen}")
            board_matrix = game.get_board_matrix()
            current_player = game.current_player
            emit('update_board', {
                'board': board_matrix,
                'current_player': current_player
            })
        else:
            print("FEN invalide reçue.")

    # Gestionnaire d'événement pour effectuer un déplacement de pièce
    @socketio.on('move_piece')
    def handle_move_piece(data):
        sid = request.sid  # Identifiant de session du joueur
        player_info = connected_players.get(sid)

        if not player_info:
            emit("illegal_move", {"error": "Joueur non enregistré"})
            return

        if player_info['color'] != game.get_current_player():
            emit("illegal_move", {"error": "Ce n'est pas votre tour"})
            return

        # Récupérer les coordonnées du déplacement
        from_row = data['from']['row']
        from_col = data['from']['col']
        to_row = data['to']['row']
        to_col = data['to']['col']

        # Effectuer le déplacement
        move_result = game.make_move(from_row, from_col, to_row, to_col)

        if move_result["success"]:
            board_matrix = game.get_board_matrix()
            current_player = game.get_current_player()
            winner = game.is_game_over()  # Vérifier si la partie est terminée
            if winner:
                emit('update_board', {
                    'board': board_matrix,
                    'current_player': current_player,
                    'game_over': True,
                    'captured': move_result.get("captured"),
                    'winner': winner
                }, broadcast=True)
            else:
                emit('update_board', {
                    'board': board_matrix,
                    'current_player': current_player,
                    'captured': move_result.get("captured")
                }, broadcast=True)
        else:
            emit("illegal_move", {"error": move_result["error"]})

    # Gestionnaire d'événement pour réinitialiser la partie
    @socketio.on('reset_game')
    def handle_reset_game():
        game.reset()  # Réinitialiser le jeu
        print("Partie réinitialisée.")
        emit('update_board', {
            'board': game.get_board_matrix(),
            'current_player': game.get_current_player(),
            'game_over': False
        }, broadcast=True)

    # Gestionnaire d'événement pour enregistrer un joueur
    @socketio.on("register_player")
    def handle_register_player(data):
        sid = request.sid  # Identifiant de session du joueur
        name = data.get("name", "Anonyme")  # Nom du joueur

        # Extraire la liste des couleurs déjà assignées
        assigned_colors = [info['color'] for info in connected_players.values()]

        # Assigner une couleur ou spectateur au joueur
        if 'white' not in assigned_colors:
            connected_players[sid] = {'name': name, 'color': 'white'}
            print(f"{name} est assigné aux Blancs")
        elif 'black' not in assigned_colors:
            connected_players[sid] = {'name': name, 'color': 'black'}
            print(f"{name} est assigné aux Noirs")
        else:
            connected_players[sid] = {'name': name, 'color': 'spectator'}
            print(f"{name} est assigné comme spectateur")

        # Informer le client de son rôle
        emit("player_role", {'color': connected_players[sid]['color']})
        # Envoyer l’historique du chat au nouveau joueur
        emit("chat_history", chat_history)

        # Chercher l’adversaire (le joueur de la couleur opposée)
        opponent_color = 'black' if connected_players[sid]['color'] == 'white' else 'white'
        opponent_name = None

        for other_sid, info in connected_players.items():
            if info['color'] == opponent_color:
                opponent_name = info['name']
                # Envoyer le nom de l’adversaire à ce joueur
                emit("opponent_info", {"name": opponent_name}, to=sid)
                # Et vice-versa : envoyer ce joueur comme adversaire à l'autre joueur
                emit("opponent_info", {"name": name}, to=other_sid)

    # Gestionnaire d'événement pour gérer la déconnexion d'un joueur
    @socketio.on('disconnect')
    def handle_disconnect():
        sid = request.sid  # Identifiant de session du joueur
        if sid in connected_players:
            print(f"{connected_players[sid]['name']} s'est déconnecté")
            del connected_players[sid]

    # Gestionnaire d'événement pour gérer les messages du chat
    @socketio.on("chat_message")
    def handle_chat_message(data):
        name = data.get("name", "Anonyme")  # Nom de l'expéditeur
        text = data.get("text", "")  # Contenu du message
        if text.strip():
            message = {"name": name, "text": text}
            chat_history.append(message)  # Ajouter le message à l'historique

            # Optionnel : limiter la taille de l'historique
            if len(chat_history) > 100:
                chat_history.pop(0)

            emit("chat_message", message, broadcast=True)

    # Gestionnaire d'événement pour obtenir les déplacements possibles
    @socketio.on("get_possible_moves")
    def handle_get_possible_moves(data):
        row = data.get("row")  # Ligne de la pièce sélectionnée
        col = data.get("col")  # Colonne de la pièce sélectionnée

        if row is None or col is None:
            return

        # Convertir les coordonnées en case d'échecs
        square = chess.square(col, 7 - row)
        legal_moves = game.board.legal_moves  # Obtenir les coups légaux
        moves_from_square = [
            {
                "to_row": 7 - chess.square_rank(move.to_square),
                "to_col": chess.square_file(move.to_square)
            }
            for move in legal_moves if move.from_square == square
        ]
        emit("possible_moves", moves_from_square)
