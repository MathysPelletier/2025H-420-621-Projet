from flask import render_template
from . import app

@app.route("/")
def home():
    """Affiche la page principale du jeu."""
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
