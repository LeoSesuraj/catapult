from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import logging
from direct_itinerary import create_itinerary
from auth_calendar import authenticate_calendar
from calendar_py.calendar_code import get_calendar_service, get_calendar_events
import os
from dotenv import load_dotenv
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configure CORS to allow requests from any origin in development
# In production, you would want to restrict this to your app's domain
CORS(app, 
    resources={r"/api/*": {"origins": "*"}}, 
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization", "Accept"],
    methods=["GET", "POST", "OPTIONS"]
)

# Configure Google OAuth2 client
CLIENT_CONFIG = {
    "web": {
        "client_id": os.getenv("CLIENT_ID"),
        "client_secret": os.getenv("CLIENT_SECRET"),
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": ["catapult://calendar-auth"]
    }
}

SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']

@app.route('/api/generate-itinerary', methods=['POST'])
def generate_itinerary():
    """
    Generate an itinerary based on survey data from the frontend
    Expected JSON input format:
    {
        "destination": "Chicago",
        "origin": "New York",
        "startDate": "2025-06-15",
        "endDate": "2025-06-18",
        "budget": 2000,
        "interests": ["Food", "Sightseeing", "Museums"]
    }
    """
    try:
        # Get JSON data from request
        data = request.json
        logger.info(f"Received request: {data}")
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Extract key information from survey
        destination = data.get('destination', '')
        origin = data.get('origin', '')
        start_date = data.get('startDate', '')
        end_date = data.get('endDate', '')
        
        # Create a natural language request string for the itinerary generator
        request_str = f"Plan a trip to {destination} from {origin}, starting on {start_date} and ending on {end_date}"
        
        # Add budget if provided
        if 'budget' in data:
            request_str += f", with a budget of ${data['budget']}"
        
        # Add interests if provided
        if 'interests' in data and data['interests']:
            interests = ", ".join(data['interests'])
            request_str += f". I'm interested in {interests}"
        
        logger.info(f"Generated request string: {request_str}")
        
        # Generate the itinerary
        itinerary = create_itinerary(request_str)
        
        # Save a copy of the generated itinerary
        with open("trip_plan.json", "w") as f:
            json.dump(itinerary, f, indent=2)
        
        # Return the itinerary as JSON
        return jsonify(itinerary)
    
    except Exception as e:
        logger.error(f"Error generating itinerary: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    logger.info(f"Health check requested from: {request.remote_addr}")
    return jsonify({"status": "healthy"})

@app.route('/api/calendar/auth', methods=['GET'])
def get_auth_url():
    try:
        flow = Flow.from_client_config(
            CLIENT_CONFIG,
            scopes=SCOPES,
            redirect_uri="catapult://calendar-auth"
        )
        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true'
        )
        return jsonify({'authUrl': auth_url})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/calendar/token', methods=['POST'])
def get_token():
    try:
        data = request.json
        token = data.get('token')
        if not token:
            return jsonify({'error': 'No token provided'}), 400

        # Create credentials from the access token
        creds = Credentials(
            token=token,
            scopes=['https://www.googleapis.com/auth/calendar.readonly']
        )

        # Save the credentials
        token_path = os.path.join(os.path.dirname(__file__), 'calendar_py', 'token.json')
        os.makedirs(os.path.dirname(token_path), exist_ok=True)
        with open(token_path, 'w') as token_file:
            token_file.write(creds.to_json())

        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Error processing token: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/calendar/events', methods=['GET'])
def get_events():
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date or not end_date:
            return jsonify({'error': 'Start date and end date are required'}), 400

        events = get_calendar_events(start_date, end_date)
        return jsonify(events)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("Starting API server on port 5000")
    logger.info(f"Server accessible at:")
    import socket
    # Get all IP addresses for the machine
    hostname = socket.gethostname()
    ip_list = socket.gethostbyname_ex(hostname)[2]
    for ip in ip_list:
        logger.info(f"  http://{ip}:5000")
    logger.info("=" * 60)
    print("=" * 40)
    print("Catapult Itinerary API Server")
    print("=" * 40)
    print("API Documentation:")
    print("  1. POST /api/generate-itinerary - Generate an itinerary from survey data")
    print("  2. GET /api/health - Check API health")
    print("  3. GET /api/calendar/auth - Get Google Calendar authentication URL")
    print("  4. POST /api/calendar/token - Get Google Calendar access token")
    print("  5. GET /api/calendar/events - Get Google Calendar events")
    print("=" * 40)
    app.run(host='0.0.0.0', port=5000, debug=True) 