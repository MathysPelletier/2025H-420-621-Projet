import os
from flask import Flask, render_template
from flask_socketio import SocketIO
from game import Game   # Importer la classe Game depuis le module game

# Définir les chemins des dossiers pour les templates et les fichiers statiques
BASE_DIR = os.path.abspath(os.path.dirname(__file__))  # Répertoire actuel : backend/server/
TEMPLATES_DIR = os.path.join(BASE_DIR, "../../frontend/templates")  # Chemin vers les templates
STATIC_DIR = os.path.join(BASE_DIR, "../../frontend/static")  # Chemin vers les images des pièces

# Créer l'application Flask avec les dossiers de templates et de fichiers statiques
app = Flask(__name__, template_folder=TEMPLATES_DIR, static_folder=STATIC_DIR)

# Initialiser SocketIO pour gérer les connexions WebSocket
socketio = SocketIO(app)

# Créer une instance de l'objet Game pour gérer la logique du jeu
game = Game()

@app.route("/")
def home():
    """
    Route principale de l'application.
    Affiche la page principale du jeu.
    """
    return render_template("index.html")

# Importer et enregistrer les événements WebSocket
from .websockets import register_websocket_events
register_websocket_events(socketio)

# Point d'entrée principal de l'application
if __name__ == "__main__":
    # Lancer l'application avec SocketIO en mode debug
    socketio.run(app, debug=True, host="0.0.0.0", port=5000)