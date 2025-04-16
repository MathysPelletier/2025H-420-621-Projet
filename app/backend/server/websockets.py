from flask_socketio import SocketIO, emit
from game import Game
from flask import request
import chess

# Stocke les joueurs connectés et leur rôle
connected_players = {}

chat_history = []

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
        sid = request.sid
        player_info = connected_players.get(sid)

        if not player_info:
            emit("illegal_move", {"error": "Joueur non enregistré"})
            return

        if player_info['color'] != game.get_current_player():
            emit("illegal_move", {"error": "Ce n'est pas votre tour"})
            return

        from_row = data['from']['row']
        from_col = data['from']['col']
        to_row = data['to']['row']
        to_col = data['to']['col']

        move_result = game.make_move(from_row, from_col, to_row, to_col)

        if move_result["success"]:
            board_matrix = game.get_board_matrix()
            current_player = game.get_current_player()
            winner = game.is_game_over()
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

    
    @socketio.on('reset_game')
    def handle_reset_game():
        game.reset()  # Appeler la méthode reset ici
        print("Partie réinitialisée.")
        emit('update_board', {
            'board': game.get_board_matrix(),
            'current_player': game.get_current_player(),
            'game_over': False
        }, broadcast=True)

    @socketio.on("register_player")
    def handle_register_player(data):
        sid = request.sid
        name = data.get("name", "Anonyme")

        # ✅ FIX : extraire la liste des couleurs déjà assignées
        assigned_colors = [info['color'] for info in connected_players.values()]

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

    @socketio.on('disconnect')
    def handle_disconnect():
        sid = request.sid
        if sid in connected_players:
            print(f"{connected_players[sid]['name']} s'est déconnecté")
            del connected_players[sid]
    
    @socketio.on("chat_message")
    def handle_chat_message(data):
        name = data.get("name", "Anonyme")
        text = data.get("text", "")
        if text.strip():
            message = {"name": name, "text": text}
            chat_history.append(message)

            # Optionnel : limiter la taille de l'historique
            if len(chat_history) > 100:
                chat_history.pop(0)

            emit("chat_message", message, broadcast=True)

    @socketio.on("get_possible_moves")
    def handle_get_possible_moves(data):
        row = data.get("row")
        col = data.get("col")

        if row is None or col is None:
            return

        square = chess.square(col, 7 - row)
        legal_moves = game.board.legal_moves
        moves_from_square = [
            {
                "to_row": 7 - chess.square_rank(move.to_square),
                "to_col": chess.square_file(move.to_square)
            }
            for move in legal_moves if move.from_square == square
        ]
        emit("possible_moves", moves_from_square)






