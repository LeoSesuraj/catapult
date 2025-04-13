import os
from datetime import datetime, timedelta
from agents import Agent, Runner, trace, function_tool
from dotenv import load_dotenv
from typing import Optional, Dict, List, Union
from calendar_py import calendar_code
import logging
from flight_stuff import run_flight_agent
from hotel import hotels
from amadeus import Client, ResponseError
from agents.extensions.handoff_prompt import RECOMMENDED_PROMPT_PREFIX
import re
import json
from openai import OpenAI

client = OpenAI()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Global events variable
events = []

# Load environment variables
load_dotenv()

# --- Google Calendar Tools --- #
@function_tool
def list_google_calendars() -> Dict[str, List[Dict]]:
    """
    Lists all available Google Calendars the user has access to.
    """
    try:
        service = calendar_code.get_calendar_service()
        if not service:
            return {"status": "error", "error": "Failed to authenticate with Google Calendar"}
        calendar_list = calendar_code.list_all_calendars(service)
        return {"status": "success", "calendars": calendar_list}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@function_tool
def get_calendar_events_tool(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    calendar_id: Optional[str] = None
) -> Dict[str, Union[List[Dict], str]]:
    """
    Fetches events from Google Calendar for specified date range.
    """
    try:
        events_data = calendar_code.get_calendar_events(start_date, end_date, calendar_id)
        
        # Update global events variable
        global events
        if isinstance(events_data, dict) and "events" in events_data:
            events = events_data["events"]
            logger.info(f"Updated global events with {len(events)} events")
            
        return {"status": "success", "data": events_data}
    except Exception as e:
        logger.error(f"Error in get_calendar_events_tool: {e}")
        return {"status": "error", "error": str(e)}

# --- Travel Planning Tools --- #
@function_tool
def search_flights(
    destination: str, 
    departure_date: Optional[str] = None,
    origin: Optional[str] = None,
    max_results: Optional[int] = None
) -> Dict[str, Union[List[Dict], str]]:
    """
    Search for available flights matching criteria using Amadeus API.
    """
    try:
        origin_city = origin or "IND"
        if not departure_date:
            departure_date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        max_results = max_results or 5
        logger.info(f"Searching flights from {origin_city} to {destination} on {departure_date}")
        
        from flight_stuff import run_flight_agent as flight_module
        if callable(flight_module):
            flight_data = flight_module(origin_city, destination, departure_date)
        else:
            if hasattr(flight_module, 'search'):
                flight_data = flight_module.search(origin_city, destination, departure_date)
            elif hasattr(flight_module, 'find_flights'):
                flight_data = flight_module.find_flights(origin_city, destination, departure_date)
            else:
                flight_data = [{"airline": "Test Airline", "flight_number": "TA123", "from": origin_city, "to": destination, "departure": departure_date + "T10:00:00", "arrival": departure_date + "T12:00:00", "price": "199.99", "currency": "USD"}]
        
        if not flight_data:
            return {"status": "error", "error": "No flights found for the given criteria"}
        
        valid_flights = [flight for flight in flight_data][:max_results]
        return {"status": "success", "flights": valid_flights}
    except Exception as e:
        logger.error(f"Error in search_flights: {str(e)}")
        return {"status": "error", "error": str(e)}

@function_tool
def search_hotels(destination: str) -> Dict[str, Union[List[Dict], str]]:
    """
    Find available hotels using Amadeus API.
    """
    try:
        # Clean up destination name for better search results
        destination = destination.strip()
        if destination.lower() in ["nyc", "new york", "new york city"]:
            destination = "NYC"
        elif destination.lower() in ["jfk", "jfk airport"]:
            destination = "NYC"  # Search in the city instead of airport
            
        print(f"🏨 Searching hotels in {destination}")
        hotel = hotels.get_hotel(destination)
        if not hotel:
            return {"status": "error", "error": "No hotels found in this location", "hotels": []}
            
        offers = hotels.get_hotel_offers(hotel["hotelId"])
        if not offers:
            return {"status": "error", "error": "No available rooms found", "hotels": []}
        
        best_offer = offers[0]['offers'][0]
        price = float(best_offer['price']['total'])
        
        # Build a proper address string
        address_parts = []
        if hotel.get('address', {}).get('line1'):
            address_parts.append(hotel['address']['line1'])
        if hotel.get('address', {}).get('city'):
            address_parts.append(hotel['address']['city'])
        if hotel.get('address', {}).get('country'):
            address_parts.append(hotel['address']['country'])
        address = ', '.join(address_parts) if address_parts else "Address not available"
        
        return {
            "status": "success",
            "hotels": [{
                "name": hotel.get('name', 'Unknown Hotel'),
                "price": price,
                "rating": hotel.get('rating', 0),
                "address": address,
                "available": True
            }]
        }
    except ResponseError as e:
        print(f"Amadeus API error: {e}")
        return {"status": "error", "error": "Hotel service temporarily unavailable", "hotels": []}
    except Exception as e:
        print(f"Unexpected error: {e}")
        return {"status": "error", "error": "Failed to complete hotel search", "hotels": []}

def format_calendar_events(events: List[Dict]) -> str:
    """Format calendar events into a readable string"""
    if not events:
        return "No calendar events found during this period."
    
    formatted_events = []
    for event in events:
        start_time = datetime.fromisoformat(event['start'].get('dateTime', event['start'].get('date')))
        end_time = datetime.fromisoformat(event['end'].get('dateTime', event['end'].get('date')))
        
        # Format the date and time
        date_str = start_time.strftime("%B %d, %Y")
        time_str = f"{start_time.strftime('%I:%M %p')} - {end_time.strftime('%I:%M %p')}"
        
        formatted_events.append(f"- {date_str}: {time_str}: {event.get('summary', 'Untitled Event')}")
    
    return "\n".join(formatted_events)

# --- Main Agent --- #
def trip_planner(request: str):
    """
    Smart travel assistant that coordinates calendar availability checks, flight searches, and hotel bookings.
    """
    # Initialize state
    state = {
        "dates": {"start": None, "end": None},
        "destination": None,
        "flight": None,
        "hotel": None,
        "total_cost": 0.0,
        "status": "initial"
    }

    calendar_agent = Agent(
        name="Calendar agent",
        instructions=f"""{RECOMMENDED_PROMPT_PREFIX}

        CONTINUE UNTIL YOU INTEGRATE ALL OF THE CALENDAR WITHIN THE TIMEFRAME.
        
        You are a calendar specialist. Your job is to check the user's calendar for availability.

        Steps:
        1. Extract the destination and preferred dates from the request. If no dates are provided, suggest the next upcoming weekend.
        2. List available calendars using list_google_calendars.
        3. Get events within the requested or suggested date range using get_calendar_events_tool.
        4. Identify free periods suitable for travel (e.g., a weekend or week-long period).
        5. ALWAYS hand off to the Flights agent using EXACTLY this format:
           "<handoff to='Flights agent'>Available dates: [START_DATE] to [END_DATE], Destination: [DESTINATION]. Please find flights.</handoff>"

        DO NOT search for flights or hotels yourself.
        Example: For "Plan a weekend trip to Chicago under $1000", you might hand off:
           "<handoff to='Flights agent'>Available dates: 2025-04-19 to 2025-04-20, Destination: Chicago. Please find flights.</handoff>"
        """,
        tools=[list_google_calendars, get_calendar_events_tool],
    )
    
    flights_agent = Agent(
        name="Flights agent",
        instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
        
        CONTINUE UNTIL YOU FIND A FLIGHT. BOOK A FLIGHT BACK BASED ON THE LEAVE DATE TOO.

        You are a flight booking specialist. Your job is to find optimal flights.

        Steps:
        1. Extract the available dates and destination from the Calendar agent's message.
        2. Use search_flights to find flights within the dates to the destination.
        3. If no flights are found or more calendar info is needed, hand off to the Calendar agent.
        4. On success, ALWAYS hand off to the Hotels agent using EXACTLY this format:
           "<handoff to='Hotels agent'>Available dates: [START_DATE] to [END_DATE], Best flight: [AIRLINE] [FLIGHT_NUMBER], Dep: [DEPARTURE_TIME], Arr: [ARRIVAL_TIME], $[PRICE], Destination: [DESTINATION]. Please find accommodations.</handoff>"

        DO NOT search for hotels yourself.
        Example handoff: "<handoff to='Hotels agent'>Available dates: 2025-04-19 to 2025-04-20, Best flight: Test Airline TA123, Dep: 2025-04-19T10:00, Arr: 2025-04-19T12:00, $199.99, Destination: Chicago. Please find accommodations.</handoff>"
        """,
        tools=[search_flights],
    )
    
    hotels_agent = Agent(
        name="Hotels agent",
        instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
        CONTINUE UNTIL YOU FIND A HOTEL. DO NOT SEARCH FOR FLIGHTS.

        You are a hotel booking specialist. Your ONLY job is to find hotel accommodations.

        Steps:
        1. Extract the destination and dates from the Flights agent's message.
        2. Use search_hotels to find hotels in the destination.
        3. If no hotels are found, try searching again with different parameters.
        4. On success, ALWAYS hand off to the TravelAssistant using EXACTLY this format:
           "<handoff to='TravelAssistant'>Available dates: [START_DATE] to [END_DATE], Best flight: [AIRLINE] [FLIGHT_NUMBER], Dep: [DEPARTURE_TIME], Arr: [ARRIVAL_TIME], $[FLIGHT_PRICE], Best hotel: [HOTEL_NAME], $[HOTEL_PRICE]/night, [HOTEL_ADDRESS], Destination: [DESTINATION]. Here's the complete plan.</handoff>"

        Example handoff: "<handoff to='TravelAssistant'>Available dates: 2025-04-19 to 2025-04-20, Best flight: Test Airline TA123, Dep: 2025-04-19T10:00, Arr: 2025-04-19T12:00, $199.99, Best hotel: Unknown Hotel, $150/night, Chicago, IL, USA, Destination: Chicago. Here's the complete plan.</handoff>"

        IMPORTANT:
        - DO NOT search for flights
        - DO NOT ask for flight information
        - ONLY search for hotels
        - ALWAYS use the exact handoff format above
        """,
        tools=[search_hotels],
    )
    
    travel_agent = Agent(
        name="TravelAssistant",
        tools=[],
        instructions=f"""{RECOMMENDED_PROMPT_PREFIX}

        CONTINUE UNTIL YOU YOU FINISH.

        You are the main travel planning assistant coordinating the trip.

        Process:
        1. Start by IMMEDIATELY handing off to the Calendar agent using EXACTLY this format:
           "<handoff to='Calendar agent'>Please check calendar availability for: {request}</handoff>"
        2. When you receive a handoff from the Hotels agent, extract the details and update the state:
           - Update dates
           - Update flight details
           - Update hotel details
           - Calculate total cost (flight price + hotel price * number of nights)
        3. Format and return the final plan.

        Format the final plan like:
        "Here's your travel plan:
        - Dates: [START_DATE] to [END_DATE]
        - Flight: [AIRLINE] [FLIGHT_NUMBER], Dep: [DEPARTURE_TIME], Arr: [ARRIVAL_TIME], $[FLIGHT_PRICE]
        - Hotel: [HOTEL_NAME], $[HOTEL_PRICE]/night, [HOTEL_ADDRESS]
        - Total estimated cost: $[TOTAL_COST]
        
        Your calendar events during this period:
        [LIST OF CALENDAR EVENTS]"

        
        MAKE SURE YOU BOOK A FLIGHT THERE AND BACK WITH THE CORRESPONDING CORRECT START AND END DATE 

        Example: "Here's your travel plan:
        - Dates: 2025-04-19 to 2025-04-20
        - Flight: Test Airline TA123, Dep: 2025-04-19T10:00, Arr: 2025-04-19T12:00, $199.99
        - Hotel: Unknown Hotel, $150/night, Chicago, IL, USA
        - Total estimated cost: $349.99
        
        Your calendar events during this period:
        - April 19, 2025: 2:30 PM - 3:15 PM: Meeting
        - April 20, 2025: 4:15 PM - 6:45 PM: Team Call""
        """
    )
    
    # Set handoff relationships
    calendar_agent.handoffs = [flights_agent, hotels_agent, travel_agent]
    flights_agent.handoffs = [calendar_agent, hotels_agent, travel_agent]
    hotels_agent.handoffs = [flights_agent, calendar_agent, travel_agent]
    travel_agent.handoffs = [calendar_agent, hotels_agent, flights_agent]

    # Manual handoff loop
    current_agent = travel_agent
    message = request
    conversation_history = []

    def update_state_from_handoff(handoff_message: str) -> None:
        """Update state based on handoff message content"""
        try:
            # Extract dates
            if "Available dates:" in handoff_message:
                dates_match = re.search(r"Available dates: (.*?) to (.*?),", handoff_message)
                if dates_match:
                    state["dates"] = {
                        "start": dates_match.group(1),
                        "end": dates_match.group(2)
                    }

            # Extract destination
            if "Destination:" in handoff_message:
                dest_match = re.search(r"Destination: (.*?)(?:\.|$)", handoff_message)
                if dest_match:
                    state["destination"] = dest_match.group(1).strip()

            # Extract flight details
            if "Best flight:" in handoff_message:
                flight_match = re.search(r"Best flight: ([^,]+), Dep: (.*?), Arr: (.*?), \$([\d.]+)", handoff_message)
                if flight_match:
                    airline_flight = flight_match.group(1).strip()
                    if ' ' in airline_flight:
                        parts = airline_flight.rsplit(' ', 1)
                        airline = parts[0]
                        flight_number = parts[1] if len(parts) > 1 else ""
                    else:
                        airline = airline_flight
                        flight_number = ""
                    
                    state["flight"] = {
                        "airline": airline,
                        "flight_number": flight_number,
                        "departure": flight_match.group(2),
                        "arrival": flight_match.group(3),
                        "price": float(flight_match.group(4))
                    }

            # Extract hotel details
            if "Best hotel:" in handoff_message:
                hotel_match = re.search(r"Best hotel: ([^,]+), \$([\d.]+)/night(?:, ([^,]+))?(?:, Destination:)", handoff_message)
                if hotel_match:
                    hotel_name = hotel_match.group(1).strip()
                    price = float(hotel_match.group(2))
                    address = hotel_match.group(3).strip() if hotel_match.group(3) else "Address not available"
                    
                    state["hotel"] = {
                        "name": hotel_name,
                        "price": price,
                        "address": address
                    }

            # Calculate total cost if we have both flight and hotel
            if state.get("flight") and state.get("hotel"):
                flight_price = float(state["flight"].get("price", 0))
                hotel_price = float(state["hotel"].get("price", 0))
                start_date = datetime.strptime(state["dates"]["start"], "%Y-%m-%d")
                end_date = datetime.strptime(state["dates"]["end"], "%Y-%m-%d")
                nights = (end_date - start_date).days
                state["total_cost"] = flight_price + (hotel_price * nights)

        except Exception as e:
            logger.error(f"Error updating state from handoff: {e}")

    while True:
        # Add current state to message
        state_message = f"{message}\n\nCurrent State:\n{json.dumps(state, indent=2)}"
        
        result = Runner.run_sync(
            starting_agent=current_agent,
            input=state_message
        )
        response = result.final_output if hasattr(result, 'final_output') else str(result)
        
        conversation_history.append({
            "agent": current_agent.name,
            "response": response
        })
        
        # Check for handoff instruction
        if "<handoff to='" in response:
            match = re.search(r"<handoff to='(.*?)'>(.*?)</handoff>", response)
            if match:
                target_agent_name = match.group(1)
                handoff_message = match.group(2)
                
                # Update state based on handoff message
                update_state_from_handoff(handoff_message)
                
                target_agent = next((a for a in [calendar_agent, flights_agent, hotels_agent, travel_agent] if a.name == target_agent_name), None)
                if target_agent:
                    current_agent = target_agent
                    message = handoff_message
                    continue
                else:
                    print(f"Error: Agent '{target_agent_name}' not found")
                    break
            else:
                print("Error: Invalid handoff format in response")
                break
        else:
            # No handoff detected, this is the final response
            if current_agent.name == "TravelAssistant":
                state["status"] = "complete"
            break

    # Format the final output
    final_output = {
        "travel_plan": {
            "dates": state["dates"],
            "destination": state["destination"],
            "flight": state["flight"],
            "hotel": state["hotel"],
            "total_cost": state["total_cost"]
        },
        "calendar_events": events,
        "formatted_calendar_events": format_calendar_events(events),
        "status": state["status"]
    }
    
    return final_output

def fill_gaps():

    global events

    print(events)

    attractions_prompt = """
        DO NOT MODIFY OR OVERLAP WITH PRE-EXISTING EVENTS IN THE CALENDAR.

        You are an intelligent assistant tasked with enhancing the provided `calendar.json` for a trip to the destination city.

        Your goal is to fill significant time gaps in the calendar with attractions, activities, and food-related events in the destination city, and to add Uber rides before and after flights. Follow these steps precisely:

        1. **Analyze Time Gaps**:
        - Identify unscheduled periods of 1 hour or longer between existing events in the `calendar.json`.
        - Consider the entire day, respecting existing events' start and end times.
        - Exclude gaps shorter than 1 hour, as they are too brief for meaningful activities.

        2. **Schedule Uber Rides for Flights**:
        - Identify all flight events (based on summaries containing "Flight" or similar keywords).
        - For each flight:
            - **Before Departure**: Add an Uber ride to the airport, starting 1 hour before the flight's start time and ending at the flight's start time. Set the summary as "Uber to Airport" and location as "To [Departure Airport]".
            - **After Arrival**: Add an Uber ride from the airport to the city, starting at the flight's end time and lasting 30 minutes. Set the summary as "Uber to City" and location as "From [Arrival Airport] to [Destination City]".
        - Ensure Uber rides do not overlap with other events.

        3. **Fill Gaps with Attractions and Activities**:
        - For each identified gap (1 hour or longer), propose an attraction, activity, or food-related event in the destination city.
        - Select from:
            - **Attractions**: Museums, landmarks, parks, historical sites, or cultural centers.
            - **Activities**: Walking tours, shopping districts, recreational activities (e.g., bike rentals), or local experiences.
            - **Food**: Restaurants, cafes, food markets, or dining experiences (e.g., brunch, dinner, street food).
        - Ensure variety across the trip (e.g., mix cultural sites, outdoor activities, and dining).
        - Assign realistic durations:
            - Attractions: 1.5–3 hours (e.g., museum visit: 2 hours).
            - Activities: 1–2 hours (e.g., shopping: 1.5 hours).
            - Food: 1–2 hours (e.g., dinner: 1.5 hours).
        - Schedule activities at appropriate times (e.g., no outdoor activities after 10 PM, dinner between 6–9 PM, breakfast/brunch between 8–11 AM).

        4. **Event Details**:
        - For each new event:
            - **Summary**: A clear, descriptive title (e.g., "Visit Metropolitan Museum of Art", "Dinner at Joe's Pizza").
            - **Location**: Specific to the destination city (e.g., "Metropolitan Museum of Art, NYC").
            - **Description**: A brief overview (1–2 sentences) of the attraction or activity (e.g., "Explore world-class art collections.").
            - **Start/End Time**: Fit within the identified gap, leaving at least 15 minutes buffer before and after existing events.
            - **Organizer**: Set to "TravelAssistant".
            - **Timezone**: Match the input calendar's timezone (default: "America/New_York").
            - **Calendar ID**: Copy from existing events or use "primary".
            - **Status**: Set to "confirmed".
            - **Created/Updated**: Use current timestamp or match existing events' format (e.g., "2025-04-13T12:00:00Z").
            - **Creator Email**: Use "travel@assistant.com".
            - **Attendees**: Set to null.
        - Verify no overlaps with existing events.

        5. **Travel Time**:
        - Account for 15–30 minutes of travel time between consecutive activities at different locations.
        - Adjust start/end times to include these buffers (e.g., end a museum visit 30 minutes before starting a dinner nearby).

        6. **Output**:
        - Return ONLY the updated calendar JSON structure, matching the input format exactly.
        - Include all original events unchanged, plus new events for Uber rides, attractions, activities, and food.
        - Do not include any text, explanations, or comments outside the JSON.


        MAKE SURE TO INCLUDE THE HOTEL NAME, CHECK IN AND CHECK OUT AT HOTEL, FLIGHT NUMBER, INCLUDE THE FLIGHT BACK

        The output calendar must follow this format:
        {
            "YYYY-MM-DD Day": [
                {
                    "summary": "Event title",
                    "location": "Location details",
                    "start_time": "HH:MM",
                    "end_time": "HH:MM",
                    "organizer": "organizer_name",
                    "timezone": "America/New_York",
                    "calendar_id": "calendar_id_value",
                    "description": "Event description",
                    "status": "confirmed",
                    "created": "timestamp",
                    "updated": "timestamp",
                    "creator_email": "email@example.com",
                    "attendees": null
                },
                ...
            ],
            "YYYY-MM-DD Day": [
                {
                    "summary": "Event title",
                    "location": "Location details",
                    "start_time": "HH:MM",
                    "end_time": "HH:MM",
                    "organizer": "organizer_name",
                    "timezone": "America/New_York",
                    "calendar_id": "calendar_id_value",
                    "description": "Event description",
                    "status": "confirmed",
                    "created": "timestamp",
                    "updated": "timestamp",
                    "creator_email": "email@example.com",
                    "attendees": null
                },
                ...
            ],
            ...
        }
        """

    # Call API to update calendar with attractions info
    attractions_calendar_response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": attractions_prompt},
            {"role": "system", "content": f"calendar.json: {events}"}
        ]
    )

    # Parse the final updated calendar with all info
    events = attractions_calendar_response.choices[0].message.content


# --- Test Cases --- #
if __name__ == "__main__":
    # Test 1: Simple travel planning
    print("=== TEST 1: BASIC TRIP PLANNING ===")
    plan = trip_planner("Plan a weekend trip from Indianapolis (IND Airport) to New York City (JFK Airport) starting today (04/13/2025) ending in 3 days, make sure it doesn't conflict with my calendar. Make it work, plan around the trips if they conflict.")
    
    events = plan

    fill_gaps()

    print(events)