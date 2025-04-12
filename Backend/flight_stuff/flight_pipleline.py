import json
import openai
import logging
import os
from datetime import datetime, timedelta, time
from amadeus import Client, ResponseError  # ensure the amadeus library is installed
from dotenv import load_dotenv

# -------------------------------
# Load environment variables
# -------------------------------
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# -------------------------------
# Trip Extraction Component (Parse Flight Info)
# -------------------------------
class TripExtractor:
    def __init__(self):
        """Initialize the TripExtractor with OpenAI API key from environment."""
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OpenAI API key is required. Set it in your .env file with OPENAI_API_KEY=your_key")
        openai.api_key = api_key
        logger.info("TripExtractor initialized")
    
    def extract_trip_details(self, user_input: str) -> dict:
        """Extract flight trip details from user input using OpenAI API."""
        system_prompt = """
You are a helpful assistant that extracts flight trip details from user requests and returns valid JSON only.
Format the response exactly like this:

{
    "flight": {
        "airline": "F9",
        "flight_number": "2111",
        "from": "MAD",
        "to": "PHL",
        "departure_date": "2025-05-09",
        "return_date": "2025-05-22",
        "price": "unknown",
        "currency": "USD",
        "status": "pending"
    }
}

IMPORTANT DATE HANDLING INSTRUCTIONS:
- If the user mentions a day of the week (like "Monday", "Tuesday", etc.), calculate the actual date for the NEXT occurrence of that day.
- If the user says "this Monday", use the date for THIS WEEK's Monday.
- If the user says "next Monday", use the date for NEXT WEEK's Monday.
- For dates without a year, assume 2025 unless context suggests otherwise.
- Always convert date references to ISO format (YYYY-MM-DD).
- Use IATA airport codes (3 letters) for locations.

If airline or flight_number is unknown, use "unknown" as a placeholder.
For one-way trips, set return_date to null (without quotes).
Output valid JSON only without any additional text.
"""
        try:
            today = datetime.now()
            current_day_name = today.strftime("%A")
            enhanced_input = f"Today is {current_day_name}, {today.strftime('%Y-%m-%d')}. User request: {user_input}"
            logger.info(f"Processing user input: {user_input}")
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": enhanced_input}
                ],
                temperature=0.2
            )
            json_response = response.choices[0].message.content
            trip_data = json.loads(json_response)
            filename = "trip_state.json"
            with open(filename, "w") as f:
                json.dump(trip_data, f, indent=4)
            logger.info(f"Trip details saved to {filename}")
            return trip_data
        except Exception as e:
            logger.error(f"Error extracting trip details: {str(e)}", exc_info=True)
            return {}
    
    def get_next_day_of_week(self, day_name: str, from_date: datetime = None) -> datetime:
        if from_date is None:
            from_date = datetime.now()
        days = {"monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3, 
                "friday": 4, "saturday": 5, "sunday": 6}
        day_num = days.get(day_name.lower())
        if day_num is None:
            return None
        days_ahead = day_num - from_date.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        return from_date + timedelta(days=days_ahead)

# -------------------------------
# Flight Agent Component (Amadeus Flight Agent)
# -------------------------------
amadeus = Client(
    client_id='4DOHUkYZtyPPu4FrRG8cmzXqrnhwwNby',
    client_secret='yG0IHsgf3eRA0J0d'
)

def load_trip_info(file_path="trip_state.json") -> dict:
    try:
        with open(file_path, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        logger.error("Trip state file not found.")
        return {}

def save_trip_info(data: dict, file_path="trip_state.json"):
    with open(file_path, "w") as f:
        json.dump(data, f, indent=4)

def search_flights(from_city: str, to_city: str, date: str, num_results: int = 5) -> list:
    """
    Search for flights and use the entire itinerary so that the final arrival
    (last segment) is used as the destination.
    """
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
            segments = flight['itineraries'][0]['segments']
            first_segment = segments[0]
            last_segment = segments[-1]
            results.append({
                "airline": first_segment["carrierCode"],
                "flight_number": first_segment["number"],
                "departure": first_segment["departure"]["at"],
                "arrival": last_segment["arrival"]["at"],
                "from": first_segment["departure"]["iataCode"],
                "to": last_segment["arrival"]["iataCode"],
                "price": flight["price"]["total"],
                "currency": flight["price"]["currency"]
            })
        return results
    except ResponseError as error:
        logger.error(f"Amadeus API error: {error}")
        return []

def select_best_flight(flight_list: list) -> dict:
    """
    Filter and return the first flight that arrives at the destination before 4 PM.
    """
    qualified_flights = []
    for flight in flight_list:
        arrival_time_str = flight["arrival"]  # e.g., "2025-06-06T09:03:00"
        try:
            dt_arrival = datetime.fromisoformat(arrival_time_str)
            # Check if arrival time is before 4:00 PM
            if dt_arrival.time() < time(16, 0):
                qualified_flights.append(flight)
        except Exception as e:
            logger.error(f"Error parsing arrival time {arrival_time_str}: {e}")

    if qualified_flights:
        return qualified_flights[0]  # Optionally refine selection if multiple qualify.
    else:
        logger.error("No flights found arriving before 4 PM.")
        return None

def get_real_time_flight_status(airline_code: str, flight_number: str, origin_code: str, destination_code: str, departure_date: str, departure_time: str):
    """
    Query the flight delay prediction API. Now both departureDate and departureTime
    are provided as required parameters.
    """
    try:
        response = amadeus.travel.predictions.flight_delay.get(
            carrierCode=airline_code,
            flightNumber=str(flight_number),
            departureDate=departure_date,
            departureTime=departure_time,
            originLocationCode=origin_code,
            destinationLocationCode=destination_code
        )
        return response.data
    except ResponseError as error:
        logger.error(f"Flight delay API error: {error}")
        return None

def save_selected_flight_to_state(selected_flight: dict, trip_data: dict):
    trip_data["flight"] = {
        "airline": selected_flight["airline"],
        "flight_number": selected_flight["flight_number"],
        "from": selected_flight["from"],
        "to": selected_flight["to"],
        "departure_time": selected_flight["departure"],
        "arrival_time": selected_flight["arrival"],
        "price": selected_flight["price"],
        "currency": selected_flight["currency"],
        "status": "pending"
    }
    save_trip_info(trip_data)

def run_flight_agent():
    # Read from the "flight" key (as produced by the extractor)
    trip_info = load_trip_info()
    flight_data = trip_info.get("flight", {})
    from_city = flight_data.get("from", "PHL")
    to_city = flight_data.get("to", "ORD")
    depart_date = flight_data.get("departure_date", "2025-05-09")

    logger.info(f"Searching flights from {from_city} to {to_city} on {depart_date}...")
    flights = search_flights(from_city, to_city, depart_date)
    if not flights:
        logger.error("No flights found.")
        return

    best_flight = select_best_flight(flights)
    if best_flight is None:
        logger.error("No qualifying flights were found (arriving before 4 PM).")
        return

    logger.info("Best flight found:")
    logger.info(json.dumps(best_flight, indent=2))

    save_selected_flight_to_state(best_flight, trip_info)
    logger.info("Flight saved to trip_state.json")

    # Extract departure date and time from best_flight["departure"]
    try:
        dep_full = best_flight["departure"]  # e.g. "2025-06-06T06:10:00"
        dep_date, dep_time = dep_full.split("T")
    except Exception as e:
        logger.error("Error parsing departure datetime: " + str(e))
        return

    delay_info = get_real_time_flight_status(
        best_flight["airline"],
        best_flight["flight_number"],
        best_flight["from"],
        best_flight["to"],
        dep_date,
        dep_time
    )
    if delay_info:
        probability = delay_info.get("probability", 0)
        if probability >= 0.5:
            logger.warning(f"Potential delay detected! Probability: {probability}")
        else:
            logger.info(f"Flight is likely on time. Delay probability: {probability}")

# -------------------------------
# Combined Main Function
# -------------------------------
def main():
    # Step 1: Extract trip details from user input
    extractor = TripExtractor()
    print("Enter your flight request (or press Enter for example):")
    user_input = input().strip()
    if not user_input:
        user_input = "phl to cancun june 6th to june 17th"
    
    print("🔍 Extracting trip details...")
    trip_data = extractor.extract_trip_details(user_input)
    if trip_data:
        print("\n✅ Trip details extracted successfully:")
        print(json.dumps(trip_data, indent=4))
    else:
        print("\n⚠️ Failed to extract trip details. Exiting.")
        return

    # Step 2: Search for and select a flight using the extracted details
    print("\n✈️ Searching for flights based on your trip details...")
    run_flight_agent()

if __name__ == "__main__":
    main()
