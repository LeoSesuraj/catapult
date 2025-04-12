import json
from datetime import datetime
from amadeus import Client, ResponseError
from airportsdata import load
from dotenv import load_dotenv
import os

# -----------------------------------
# Load environment variables from .env file
# -----------------------------------
load_dotenv()

# -----------------------------------
# Initialize Amadeus Client with .env credentials
# -----------------------------------
amadeus = Client(
    client_id=os.getenv('AMADEUS_CLIENT_ID'),
    client_secret=os.getenv('AMADEUS_CLIENT_SECRET')
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
    "seattle": "SEA"
    # Add more as needed
}

def city_to_iata(city_name: str) -> str:
    city_key = city_name.lower().strip()
    if city_key in PRIMARY_AIRPORTS:
        return PRIMARY_AIRPORTS[city_key]
    for code, data in airports.items():
        if data['city'].lower() == city_key:
            return code
    return "unknown"

def search_flights(from_city, to_city, date, num_results=5):
    try:
        response = amadeus.shopping.flight_offers_search.get(
            originLocationCode=from_city.upper(),
            destinationLocationCode=to_city.upper(),
            departureDate=date,
            adults=1,
            max=num_results,
            currencyCode='USD'
        )
        flights = response.data
        results = []
        for flight in flights:
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
        return results
    except ResponseError as error:
        print("Amadeus API error:", error)
        return []

def select_best_flight(flight_list):
    return flight_list[0] if flight_list else None

def get_real_time_flight_status(airline_code, flight_number, origin_code, departure_date):
    try:
        response = amadeus.travel.predictions.flight_delay.get(
            carrierCode=airline_code,
            flightNumber=str(flight_number),
            scheduledDepartureDate=departure_date,
            originLocationCode=origin_code
        )
        return response.data
    except ResponseError as error:
        print("Flight delay API error:", error)
        return None

def run_flight_agent(from_city_raw, to_city_raw, depart_date):
    from_city = city_to_iata(from_city_raw)
    to_city = city_to_iata(to_city_raw)

    if from_city == "unknown" or to_city == "unknown":
        print(f"❌ Unable to find IATA code for: {from_city_raw} or {to_city_raw}")
        return

    print(f"🔍 Searching flights from {from_city} to {to_city} on {depart_date}...")
    flights = search_flights(from_city, to_city, depart_date)
    if not flights:
        print("No flights found.")
        return

    best_flight = select_best_flight(flights)
    print("✈️ Best flight found:")
    print(json.dumps(best_flight, indent=2))

# -----------------------------------
# Example usage
# -----------------------------------
if __name__ == "__main__":
    # Replace these values or prompt the user / take command line args
    run_flight_agent("Boston", "Chicago", "2025-05-09")
