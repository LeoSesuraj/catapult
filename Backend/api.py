from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import logging
from direct_itinerary import create_itinerary

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
    print("=" * 40)
    app.run(host='0.0.0.0', port=5000, debug=True) 