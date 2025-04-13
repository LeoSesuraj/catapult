import travel_agents
from flask import Flask

app = Flask(__name__)

@app.route("/createitinerary", methods=["POST", "GET"])
def convert_flask(start="IND", destination="JFK", start_date="04/13/2025", end_date="04/16/2025"):
    return travel_agents.pipeline(start, destination, start_date, end_date)