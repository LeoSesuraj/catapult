import json
from datetime import datetime
from amadeus import Client, ResponseError
from airportsdata import load
from dotenv import load_dotenv
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Initialize Amadeus Client with .env credentials
amadeus_client_id = os.getenv('AMADEUS_CLIENT_ID')
amadeus_client_secret = os.getenv('AMADEUS_CLIENT_SECRET')

if not amadeus_client_id or not amadeus_client_secret:
    logger.error("Amadeus API credentials not found in .env file")
    raise ValueError("Missing Amadeus API credentials")

amadeus = Client(
    client_id=amadeus_client_id,
    client_secret=amadeus_client_secret
)

# Load airport data
airports = load('IATA')

PRIMARY_AIRPORTS = {
    "chicago": "ORD",
    "new york": "JFK",
    "washington": "IAD",
    "los angeles": "LAX",
    "houston": "IAH",
    "tokyo": "HND",
    "london": "LHR",
    "paris": "CDG",
    "philadelphia": "PHL",
    "san francisco": "SFO",
    "dallas": "DFW",
    "seattle": "SEA",
    "las vegas": "LAS",
    "miami": "MIA",
    "boston": "BOS",
    "denver": "DEN",
    "atlanta": "ATL",
    "orlando": "MCO",
    "phoenix": "PHX",
    "san diego": "SAN",
    "honolulu": "HNL",
    "new orleans": "MSY",
    "austin": "AUS",
    "indianapolis": "IND",
    "fort lauderdale": "FLL",
    # Add more as needed
}

def city_to_iata(city_name: str) -> str:
    """
    Convert a city name to IATA airport code.
    
    Args:
        city_name: Name of the city
        
    Returns:
        IATA code or "unknown" if not found
    """
    if not city_name:
        return "unknown"
        
    city_key = city_name.lower().strip()
    
    # First check in our predefined dictionary
    if city_key in PRIMARY_AIRPORTS:
        logger.info(f"Found city {city_name} in PRIMARY_AIRPORTS: {PRIMARY_AIRPORTS[city_key]}")
        return PRIMARY_AIRPORTS[city_key]
    
    # Then search in the airports database
    for code, data in airports.items():
        if data.get('city', '').lower() == city_key:
            logger.info(f"Found city {city_name} in airports database: {code}")
            return code
    
    # If we reach here, city wasn't found
    logger.warning(f"Could not find IATA code for city: {city_name}")
    return "unknown"

def search_flights(from_city, to_city, date, num_results=5):
    """
    Search for flights using the Amadeus API.
    
    Args:
        from_city: Origin IATA code
        to_city: Destination IATA code
        date: Departure date (YYYY-MM-DD)
        num_results: Maximum number of results to return
        
    Returns:
        List of flight data dictionaries
    """
    try:
        logger.info(f"Searching flights from {from_city} to {to_city} on {date}")
        
        # Validate input parameters
        if not from_city or not to_city or from_city == "unknown" or to_city == "unknown":
            logger.error(f"Invalid airport codes: from={from_city}, to={to_city}")
            return []
            
        # Ensure IATA codes are uppercase
        from_city = from_city.upper()
        to_city = to_city.upper()
        
        # Validate date format (simple check)
        try:
            datetime.strptime(date, '%Y-%m-%d')
        except ValueError:
            logger.error(f"Invalid date format: {date}. Expected YYYY-MM-DD")
            return []
        
        response = amadeus.shopping.flight_offers_search.get(
            originLocationCode=from_city,
            destinationLocationCode=to_city,
            departureDate=date,
            adults=1,
            max=num_results,
            currencyCode='USD'
        )
        
        flights = response.data
        logger.info(f"Found {len(flights)} flights")
        
        results = []
        for flight in flights:
            try:
                segment = flight['itineraries'][0]['segments'][0]
                results.append({
                    "airline": segment["carrierCode"],
                    "flight_number": segment["number"],
                    "departure": segment["departure"]["at"],
                    "arrival": segment["arrival"]["at"],
                    "from": segment["departure"]["iataCode"],
                    "to": segment["arrival"]["iataCode"],
                    "price": flight["price"]["total"],
                    "currency": flight["price"]["currency"]
                })
            except KeyError as e:
                logger.warning(f"Error parsing flight data: {e}")
                # Continue processing other flights
                
        return results
        
    except ResponseError as error:
        logger.error(f"Amadeus API error: {error}")
        # Print the detailed error response if available
        if hasattr(error, 'response') and hasattr(error.response, 'body'):
            logger.error(f"Error details: {error.response.body}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error in search_flights: {str(e)}")
        return []

def select_best_flight(flight_list):
    """Select the best flight from a list (currently returns the first one)"""
    return flight_list[0] if flight_list else None

def get_real_time_flight_status(airline_code, flight_number, origin_code, departure_date):
    """Get real-time flight status using Amadeus API"""
    try:
        logger.info(f"Checking status for flight {airline_code}{flight_number} from {origin_code} on {departure_date}")
        
        response = amadeus.travel.predictions.flight_delay.get(
            carrierCode=airline_code,
            flightNumber=str(flight_number),
            scheduledDepartureDate=departure_date,
            originLocationCode=origin_code
        )
        return response.data
    except ResponseError as error:
        logger.error(f"Flight delay API error: {error}")
        if hasattr(error, 'response') and hasattr(error.response, 'body'):
            logger.error(f"Error details: {error.response.body}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in get_real_time_flight_status: {str(e)}")
        return None

def run_flight_agent(origin, destination, date):
    logging.info(f"Running flight agent: {origin} to {destination} on {date}")
    
    # Convert city names to IATA codes
    origin_iata = city_to_iata(origin.lower())
    if origin_iata == "unknown":
        logging.error(f"Could not find IATA code for origin: {origin}")
        return None
        
    destination_iata = city_to_iata(destination.lower())
    if destination_iata == "unknown":
        logging.error(f"Could not find IATA code for destination: {destination}")
        return None
    
    logging.info(f"Converted cities to IATA: {origin} -> {origin_iata}, {destination} -> {destination_iata}")
    
    try:
        # Search for flights
        flights = search_flights(origin_iata, destination_iata, date)
        if not flights:
            logging.warning(f"No flights found from {origin_iata} to {destination_iata} on {date}")
            return None
            
        logging.info(f"Found {len(flights)} flights")
        
        # Select the best flight (lowest price for now)
        best_flight = min(flights, key=lambda x: float(x["price"]))
        logging.info(f"Best flight found:\n{json.dumps(best_flight, indent=2)}")
        
        return best_flight
    except Exception as e:
        logging.error(f"Error finding flights: {str(e)}")
        return None
