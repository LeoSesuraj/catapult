import travel_agents
from flask import Flask

app = Flask(__name__)

@app.route("/createitinerary", methods=["POST", "GET"])
def convert_flask():
    return travel_agents.pipeline("IND", "JFK", "04/13/2025","04/16/2025")