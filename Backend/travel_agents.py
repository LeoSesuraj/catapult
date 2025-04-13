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

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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
        if isinstance(events_data, dict) and "error" in events_data:
            return {"status": "error", "error": events_data["error"]}
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
        print(f"🏨 Searching hotels in {destination}")
        hotel = hotels.get_hotel(destination)
        if not hotel:
            return {"status": "error", "error": "No hotels found in this location", "hotels": []}
        offers = hotels.get_hotel_offers(hotel["hotelId"])
        if not offers:
            return {"status": "error", "error": "No available rooms found", "hotels": []}
        
        best_offer = offers[0]['offers'][0]
        price = float(best_offer['price']['total'])
        
        return {
            "status": "success",
            "hotels": [{
                "name": hotel.get('name', 'Unknown Hotel'),
                "price": price,
                "rating": hotel.get('rating', 0),
                "address": ', '.join(filter(None, [hotel.get('address', {}).get('line1'), hotel.get('address', {}).get('city'), hotel.get('address', {}).get('country')])),
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
        1. Extract the available dates, destination, from the Calendar agent's message.
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
        CONTINUE UNTIL YOU FIND A HOTEL. FIND ANY HOTEL.

        You are a hotel booking specialist DO NOT BOOK FLIGHT. PLEASE. Your job is to find optimal accommodations.

        Steps:
        1. Extract the available dates, flight details, destination, from the Flights agent's message.
        2. Use search_hotels to find hotels in the destination.
        3. If no hotels are found or more flight info is needed, hand off to the Flights agent.
        4. On success, ALWAYS hand off to the TravelAssistant using EXACTLY this format:
           "<handoff to='TravelAssistant'>Available dates: [START_DATE] to [END_DATE], Best flight: [AIRLINE] [FLIGHT_NUMBER], Dep: [DEPARTURE_TIME], Arr: [ARRIVAL_TIME], $[FLIGHT_PRICE], Best hotel: [HOTEL_NAME], $[HOTEL_PRICE]/night, [HOTEL_ADDRESS], Destination: [DESTINATION]. Here’s the complete plan.</handoff>"

        Example handoff: "<handoff to='TravelAssistant'>Available dates: 2025-04-19 to 2025-04-20, Best flight: Test Airline TA123, Dep: 2025-04-19T10:00, Arr: 2025-04-19T12:00, $199.99, Best hotel: Unknown Hotel, $150/night, Chicago, IL, USA, Destination: Chicago. Here’s the complete plan.</handoff>"
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
        2. When you receive a handoff from the Hotels agent, extract the details and present a formatted travel plan:
           - Available dates
           - Flight details
           - Hotel details
           - Total estimated cost (flight price + hotel price * number of nights)
        3. Do not hand off again after receiving the Hotels agent's details.

        Format the final plan like:
        "Here’s your travel plan:
        - Dates: [START_DATE] to [END_DATE]
        - Flight: [AIRLINE] [FLIGHT_NUMBER], Dep: [DEPARTURE_TIME], Arr: [ARRIVAL_TIME], $[FLIGHT_PRICE]
        - Hotel: [HOTEL_NAME], $[HOTEL_PRICE]/night, [HOTEL_ADDRESS]
        - Total estimated cost: $[TOTAL_COST]"

        Example: "Here’s your travel plan:
        - Dates: 2025-04-19 to 2025-04-20
        - Flight: Test Airline TA123, Dep: 2025-04-19T10:00, Arr: 2025-04-19T12:00, $199.99
        - Hotel: Unknown Hotel, $150/night, Chicago, IL, USA
        - Total estimated cost: $349.99"
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

    while True:
        result = Runner.run_sync(
            starting_agent=current_agent,
            input=message
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
            break

    # Compile and display the final plan
    final_plan = "\n\n".join([f"{entry['agent']}: {entry['response']}" for entry in conversation_history])
    print("\n=== FINAL PLAN ===\n", final_plan)
    return final_plan

# --- Test Cases --- #
if __name__ == "__main__":
    # Test 1: Simple travel planning
    print("=== TEST 1: BASIC TRIP PLANNING ===")
    plan = trip_planner("Plan a weekend trip to New York (JFK Airport) starting today (04/13/2025) ending in 3 days, make sure it doesn't conflict with my calendar. Make it work, plan around the trips if they conflict.")
    