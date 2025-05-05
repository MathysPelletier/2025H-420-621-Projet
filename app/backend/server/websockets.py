from flask_socketio import SocketIO, emit  # Importation des modules nécessaires pour les websockets
from game import Game  # Importation de la classe Game pour gérer la logique du jeu
from flask import request  # Pour accéder aux informations de la requête
import chess  # Bibliothèque pour manipuler les échecs
import chess.engine  # Pour interagir avec un moteur d'échecs comme Stockfish
import atexit  # Pour exécuter du code lors de la fermeture de l'application

# Charger le moteur d'échecs Stockfish (chemin d'accès à adapter selon votre projet)
engine = chess.engine.SimpleEngine.popen_uci("../../engine/stockfish/stockfish.exe")

# Dictionnaire pour stocker les joueurs connectés et leur rôle (Blancs, Noirs ou spectateurs)
connected_players = {}

# Liste pour stocker l'historique des messages du chat
chat_history = []

# Crée un objet Game global pour gérer l'état du jeu
game = Game()

# Fonction pour enregistrer les événements websocket
def register_websocket_events(socketio, game):
    print("Registering websocket events")

    # Événement pour récupérer l'état actuel du plateau
    @socketio.on('get_board')
    def handle_get_board():
        board_matrix = game.get_board_matrix()  # Obtenir la matrice du plateau
        current_player = game.current_player  # Obtenir le joueur actuel
        print(board_matrix)
        emit('update_board', {
            'board': board_matrix,
            'current_player': current_player
        })

    # Événement pour mettre à jour le plateau avec une FEN (notation spécifique des échecs)
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

    # Événement pour gérer le déplacement d'une pièce
    @socketio.on('move_piece')
    def handle_move_piece(data):
        sid = request.sid  # Identifiant de session du joueur
        player_info = connected_players.get(sid)  # Récupérer les informations du joueur

        # Vérifier si le joueur est enregistré
        if not player_info:
            emit("illegal_move", {"error": "Joueur non enregistré"})
            return

        # Vérifier si c'est le tour du joueur
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
        if not move_result["success"]:
            emit("illegal_move", {"error": move_result.get("error", "Mouvement illégal")})
            return

        # Si le déplacement est valide, mettre à jour le plateau
        if move_result["success"]:
            board_matrix = game.get_board_matrix()
            current_player = game.get_current_player()
            winner = game.is_game_over()  # Vérifier si la partie est terminée

            # Si la partie est terminée, envoyer les informations du gagnant
            if winner:
                emit('update_board', {
                    'board': board_matrix,
                    'current_player': current_player,
                    'game_over': True,
                    'captured': move_result.get("captured"),
                    'winner': winner
                }, broadcast=True)
            else:
                # Sinon, mettre à jour le plateau pour tous les joueurs
                emit('update_board', {
                    'board': board_matrix,
                    'current_player': current_player,
                    'captured': move_result.get("captured")
                }, broadcast=True)

            # Si le mode est solo et que c'est au tour de l'ordinateur (Noirs), faire jouer l'IA
            if player_info['mode'] == 'solo' and game.get_current_player() == 'black':
                thinking_time = 0.1  # Temps de réflexion par défaut (facile)

                # Ajuster le temps de réflexion selon la difficulté
                if player_info['difficulty'] == "modere":
                    thinking_time = 0.5  # 500 ms
                elif player_info['difficulty'] == "difficile":
                    thinking_time = 1.5  # 1500 ms
            
                # Faire jouer l'IA avec Stockfish
                result = engine.play(game.board, chess.engine.Limit(time=thinking_time))
                ai_move = result.move
                if ai_move:
                    game.board.push(ai_move)  # Appliquer le coup de l'IA

                    # Mettre à jour le plateau après le coup de l'IA
                    board_matrix = game.get_board_matrix()
                    current_player = game.get_current_player()
                    winner = game.is_game_over()

                    if winner:
                        emit('update_board', {
                            'board': board_matrix,
                            'current_player': current_player,
                            'game_over': True,
                            'captured': None,
                            'winner': winner
                        }, broadcast=True)
                    else:
                        emit('update_board', {
                            'board': board_matrix,
                            'current_player': current_player,
                            'captured': None
                        }, broadcast=True)

    # Événement pour réinitialiser la partie
    @socketio.on('reset_game')
    def handle_reset_game():
        game.reset()  # Réinitialiser le jeu
        print("Partie réinitialisée.")
        emit('update_board', {
            'board': game.get_board_matrix(),
            'current_player': game.get_current_player(),
            'game_over': False
        }, broadcast=True)

    # Événement pour enregistrer un joueur
    @socketio.on("register_player")
    def handle_register_player(data):
        sid = request.sid  # Identifiant de session du joueur
        name = data.get("name", "Anonyme")  # Nom du joueur
        mode = data.get("mode", "multi")  # Mode de jeu (solo ou multi)
        difficulty = data.get("difficulty", "facile")  # Difficulté pour le mode solo

        # Vérifier les couleurs déjà assignées
        assigned_colors = [info['color'] for info in connected_players.values()]

        if mode == "solo":
            # En mode solo, le joueur est toujours Blancs
            connected_players[sid] = {'name': name, 'color': 'white', 'mode': 'solo', 'difficulty': difficulty}
            print(f"{name} joue en mode solo")
            emit("player_role", {'color': 'white'})
            emit("chat_history", chat_history)

            # Informer que l'adversaire est l'ordinateur
            emit("opponent_info", {"name": "Ordinateur"}, to=sid)

        else:
            # En mode multi, assigner une couleur ou spectateur
            if 'white' not in assigned_colors:
                connected_players[sid] = {'name': name, 'color': 'white', 'mode': 'multi'}
                print(f"{name} est assigné aux Blancs (multi)")
            elif 'black' not in assigned_colors:
                connected_players[sid] = {'name': name, 'color': 'black', 'mode': 'multi'}
                print(f"{name} est assigné aux Noirs (multi)")
            else:
                connected_players[sid] = {'name': name, 'color': 'spectator', 'mode': 'multi'}
                print(f"{name} est spectateur (multi)")

            emit("player_role", {'color': connected_players[sid]['color']})
            emit("chat_history", chat_history)

            # Gérer les informations sur l'adversaire en mode multi
            opponent_color = 'black' if connected_players[sid]['color'] == 'white' else 'white'
            opponent_name = None
            for other_sid, info in connected_players.items():
                if info['color'] == opponent_color:
                    opponent_name = info['name']
                    emit("opponent_info", {"name": opponent_name}, to=sid)
                    emit("opponent_info", {"name": name}, to=other_sid)

    # Événement pour gérer la déconnexion d'un joueur
    @socketio.on('disconnect')
    def handle_disconnect():
        sid = request.sid  # Identifiant de session du joueur
        if sid in connected_players:
            print(f"{connected_players[sid]['name']} s'est déconnecté")
            del connected_players[sid]

    # Événement pour gérer les messages du chat
    @socketio.on("chat_message")
    def handle_chat_message(data):
        name = data.get("name", "Anonyme")  # Nom de l'expéditeur
        text = data.get("text", "")  # Contenu du message
        if text.strip():
            message = {"name": name, "text": text}
            chat_history.append(message)  # Ajouter le message à l'historique

            # Limiter la taille de l'historique à 100 messages
            if len(chat_history) > 100:
                chat_history.pop(0)

            emit("chat_message", message, broadcast=True)

    # Événement pour obtenir les déplacements possibles pour une pièce
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

    # Fonction exécutée à la fermeture de l'application pour arrêter le moteur d'échecs
    @atexit.register
    def shutdown():
        engine.quit()
