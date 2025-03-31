from flask_socketio import SocketIO, emit

def register_websocket_events(socketio):
    print("Registering websocket events")

    @socketio.on('connect')
    def handle_connect():
        print("Client connected")
        emit('server_message', {'data': 'Welcome to the WebSocket server!'})

    @socketio.on('disconnect')
    def handle_disconnect():
        print("Client disconnected")

    @socketio.on('client_message')
    def handle_client_message(data):
        print(f"Received message from client: {data}")
        emit('server_message', {'data': f"Message received: {data}"})
