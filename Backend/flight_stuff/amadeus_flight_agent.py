import json
from datetime import datetime
from amadeus import Client, ResponseError

# -----------------------------------
# Initialize Amadeus Client
# -----------------------------------
amadeus = Client(
    client_id='4DOHUkYZtyPPu4FrRG8cmzXqrnhwwNby',
    client_secret='yG0IHsgf3eRA0J0d'
)

# -----------------------------------
# Load trip info (parsed from GPT or existing JSON)
# -----------------------------------
def load_trip_info(file_path="trip_state.json"):
    try:
        with open(file_path, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

# -----------------------------------
# Save updated trip state
# -----------------------------------
def save_trip_info(data, file_path="trip_state.json"):
    with open(file_path, "w") as f:
        json.dump(data, f, indent=4)

# -----------------------------------
# Search Flights via Amadeus API
# -----------------------------------
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

# -----------------------------------
# Select the best flight (top result or custom logic)
# -----------------------------------
def select_best_flight(flight_list):
    return flight_list[0] if flight_list else None

# -----------------------------------
# Get real-time flight status (delay prediction)
# -----------------------------------
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
# -----------------------------------
# Update trip_state.json with selected flight
# -----------------------------------
def save_selected_flight_to_state(selected_flight, trip_data):
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

# -----------------------------------
# Main Flight Agent Runner
# -----------------------------------
def run_flight_agent():
    # Step 1: Load or parse trip info (can be GPT input later)
    trip_info = load_trip_info()
    from_city = trip_info.get("flight_search", {}).get("from_city", "PHL")
    to_city = trip_info.get("flight_search", {}).get("to_city", "ORD")
    depart_date = trip_info.get("flight_search", {}).get("depart_date", "2025-05-09")

    # Step 2: Search flights
    print(f"🔍 Searching flights from {from_city} to {to_city} on {depart_date}...")
    flights = search_flights(from_city, to_city, depart_date)
    if not flights:
        print("No flights found.")
        return

    # Step 3: Select best flight
    best_flight = select_best_flight(flights)
    print("✈️ Best flight found:")
    print(json.dumps(best_flight, indent=2))

    # Step 4: Save to trip state
    save_selected_flight_to_state(best_flight, trip_info)
    print("✅ Flight saved to trip_state.json")

    # Step 5: Check flight delay prediction
    delay_info = get_real_time_flight_status(
        best_flight["airline"],
        best_flight["flight_number"],
        best_flight["from"],
        depart_date
    )

    if delay_info:
        probability = delay_info.get("probability", 0)
        if probability >= 0.5:
            print("⚠️ Potential delay detected! Probability:", probability)
        else:
            print("✅ Flight is likely on time. Delay probability:", probability)

# -----------------------------------
# Run the script standalone
# -----------------------------------
if __name__ == "__main__":
    run_flight_agent()
