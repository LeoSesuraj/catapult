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

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class ItineraryState:
    def __init__(self):
        self._state = {
            "dates": {"start": None, "end": None},
            "destination": None,
            "flight": None,
            "hotel": None,
            "total_cost": 0.0,
            "status": "initial",
            "calendar_events": []  # Add calendar events to state
        }

    def get_state(self) -> Dict:
        """Get a read-only copy of the state"""
        return self._state.copy()

    def update_state(self, agent_name: str, updates: Dict) -> bool:
        """Update the state. All agents can modify it, but only TravelAssistant can set status to 'complete'"""
        try:
            # Deep update the state
            for key, value in updates.items():
                if key == "status" and value == "complete" and agent_name != "TravelAssistant":
                    logger.warning(f"Agent {agent_name} attempted to set status to 'complete'. Only TravelAssistant can do this.")
                    continue
                    
                if isinstance(value, dict) and key in self._state and isinstance(self._state[key], dict):
                    self._state[key].update(value)
                else:
                    self._state[key] = value
            
            # Calculate total cost if we have both flight and hotel
            if self._state.get("flight") and self._state.get("hotel"):
                flight_price = float(self._state["flight"].get("price", 0))
                hotel_price = float(self._state["hotel"].get("price", 0))
                start_date = datetime.strptime(self._state["dates"]["start"], "%Y-%m-%d")
                end_date = datetime.strptime(self._state["dates"]["end"], "%Y-%m-%d")
                nights = (end_date - start_date).days
                self._state["total_cost"] = flight_price + (hotel_price * nights)
            
            return True
        except Exception as e:
            logger.error(f"Error updating state: {e}")
            return False

    def get_status(self) -> str:
        return self._state.get("status", "initial")

    def add_calendar_events(self, events: List[Dict]) -> None:
        """Add calendar events to the state"""
        self._state["calendar_events"] = events

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
        if isinstance(events_data, dict) and "error" in events_data:
            return {"status": "error", "error": events_data["error"]}
        
        # Store events in the state
        if isinstance(events_data, list):
            itinerary_state.add_calendar_events(events_data)
            
        return {"status": "success", "data": events_data}
    except Exception as e:
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
        origin_city = origin or "New York"
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

# --- Main Agent --- #
def trip_planner(request: str):
    """
    Smart travel assistant that coordinates calendar availability checks, flight searches, and hotel bookings.
    """
    # Initialize shared state
    itinerary_state = ItineraryState()

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
        
        CONTINUE UNTIL YOU FIND A FLIGHT. 

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
        2. When you receive a handoff from the Hotels agent, extract the details and update the itinerary state:
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

    def update_state_from_handoff(handoff_message: str, agent_name: str) -> None:
        """Update state based on handoff message content"""
        try:
            # Extract dates
            if "Available dates:" in handoff_message:
                dates_match = re.search(r"Available dates: (.*?) to (.*?),", handoff_message)
                if dates_match:
                    itinerary_state.update_state(agent_name, {
                        "dates": {
                            "start": dates_match.group(1),
                            "end": dates_match.group(2)
                        }
                    })

            # Extract destination
            if "Destination:" in handoff_message:
                dest_match = re.search(r"Destination: (.*?)(?:\.|$)", handoff_message)
                if dest_match:
                    itinerary_state.update_state(agent_name, {
                        "destination": dest_match.group(1).strip()
                    })

            # Extract flight details - improved regex to handle airline names with spaces
            if "Best flight:" in handoff_message:
                flight_match = re.search(r"Best flight: ([^,]+), Dep: (.*?), Arr: (.*?), \$([\d.]+)", handoff_message)
                if flight_match:
                    airline_flight = flight_match.group(1).strip()
                    # Split airline and flight number more intelligently
                    if ' ' in airline_flight:
                        parts = airline_flight.rsplit(' ', 1)
                        airline = parts[0]
                        flight_number = parts[1] if len(parts) > 1 else ""
                    else:
                        airline = airline_flight
                        flight_number = ""
                    
                    itinerary_state.update_state(agent_name, {
                        "flight": {
                            "airline": airline,
                            "flight_number": flight_number,
                            "departure": flight_match.group(2),
                            "arrival": flight_match.group(3),
                            "price": float(flight_match.group(4))
                        }
                    })

            # Extract hotel details - improved regex to handle empty addresses
            if "Best hotel:" in handoff_message:
                hotel_match = re.search(r"Best hotel: ([^,]+), \$([\d.]+)/night(?:, ([^,]+))?(?:, Destination:)", handoff_message)
                if hotel_match:
                    hotel_name = hotel_match.group(1).strip()
                    price = float(hotel_match.group(2))
                    address = hotel_match.group(3).strip() if hotel_match.group(3) else "Address not available"
                    
                    itinerary_state.update_state(agent_name, {
                        "hotel": {
                            "name": hotel_name,
                            "price": price,
                            "address": address
                        }
                    })

        except Exception as e:
            logger.error(f"Error updating state from handoff: {e}")

    while True:
        # Add current state to message
        state_message = f"{message}\n\nCurrent Itinerary State:\n{json.dumps(itinerary_state.get_state(), indent=2)}"
        
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
                update_state_from_handoff(handoff_message, current_agent.name)
                
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
            # If this is the TravelAssistant, update the state with the final plan
            if current_agent.name == "TravelAssistant":
                try:
                    # Extract plan details from the response
                    plan_updates = {
                        "status": "complete"
                    }
                    itinerary_state.update_state(current_agent.name, plan_updates)
                except Exception as e:
                    logger.error(f"Error updating final state: {e}")
            break

    # Compile and display the final plan
    final_plan = "\n\n".join([f"{entry['agent']}: {entry['response']}" for entry in conversation_history])
    print("\n=== FINAL PLAN ===\n", final_plan)
    print("\n=== FINAL STATE ===\n", json.dumps(itinerary_state.get_state(), indent=2))
    return final_plan

# --- Test Cases --- #
if __name__ == "__main__":
    # Test 1: Simple travel planning
    print("=== TEST 1: BASIC TRIP PLANNING ===")
    plan = trip_planner("Plan a weekend trip to New York (JFK Airport) starting today (04/13/2025) ending in 3 days, make sure it doesn't conflict with my calendar. Make it work, plan around the trips if they conflict.")
    