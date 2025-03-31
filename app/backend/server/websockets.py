from flask_socketio import SocketIO, emit


def register_websocket_events(socketio):
    print("Registering websocket events")

    @socketio.on('get_board')
    def handle_get_board():
        from .app import game  # Assuming you have a Board class in game.py
        print("Client requested the board")
        board = game.board.create_initial_board()  # Replace with the actual function to retrieve the board
        emit('update_board', {'board': board})