import os
from datetime import datetime, timedelta
from agents import Agent, Runner, trace, function_tool
from dotenv import load_dotenv
from typing import Optional, Dict, List, Union
import logging
import json
import re

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Mock calendar and travel functions (replace with actual implementations)
from calendar_py import calendar_code
from flight_stuff import run_flight_agent
from hotel import hotels

# --- Google Calendar Tools --- #
@function_tool
def list_google_calendars() -> Dict[str, List[Dict]]:
    """Lists all available Google Calendars the user has access to."""
    try:
        # Mock response
        return {"status": "success", "calendars": [{"id": "primary", "summary": "Main Calendar"}]}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@function_tool
def get_calendar_events_tool(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    calendar_id: Optional[str] = None
) -> Dict[str, Union[List[Dict], str]]:
    """Fetches events from Google Calendar for specified date range."""
    try:
        # Mock response
        return {
            "status": "success",
            "data": [
                {"summary": "Meeting", "start": f"{start_date}T09:00:00", "end": f"{start_date}T10:00:00"}
            ]
        }
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
    """Search for available flights matching criteria."""
    try:
        origin_city = origin or "New York"
        departure_date = departure_date or (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        # Mock response
        return {
            "status": "success",
            "flights": [{
                "airline": "Test Airline",
                "flight_number": "TA123",
                "from": origin_city,
                "to": destination,
                "departure": f"{departure_date}T10:00:00",
                "arrival": f"{departure_date}T12:00:00",
                "price": "199.99",
                "currency": "USD"
            }]
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

@function_tool
def search_hotels(destination: str) -> Dict[str, Union[List[Dict], str]]:
    """Find available hotels."""
    try:
        # Mock response
        return {
            "status": "success",
            "hotels": [{
                "name": "Sample Hotel",
                "price": 150.0,
                "rating": 4,
                "address": f"{destination}, USA",
                "available": True
            }]
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

# --- Main Trip Planner --- #
def trip_planner(request: str):
    """
    Coordinates travel planning with a shared JSON object.
    Only TravelAssistant modifies the JSON; other agents propose updates.
    Control returns to TravelAssistant after each agent call.
    """
    # Initialize shared JSON
    shared_plan = {
        "request": request,
        "destination": None,
        "dates": {"start": None, "end": None},
        "calendar": {"events": [], "available_slots": []},
        "flights": [],
        "hotels": [],
        "total_cost": 0.0,
        "status": "initial"
    }

    # --- Agent Definitions --- #
    calendar_agent = Agent(
        name="CalendarAgent",
        instructions="""
        You are a calendar specialist. Your job is to check calendar availability and propose updates to the shared plan.

        Steps:
        1. Parse the request or handoff message for destination and dates.
        2. If no dates, suggest the next weekend (Saturday to Sunday).
        3. Use list_google_calendars and get_calendar_events_tool to fetch events.
        4. Identify free periods (min 2 days) and propose them as available_slots.
        5. Return a JSON update proposal like:
           {
             "calendar": {
               "events": [...],
               "available_slots": [{"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"}]
             },
             "destination": "DESTINATION",
             "next_agent": "TravelAssistant"
           }
        If errors occur, propose retry or alternative dates.
        """,
        tools=[list_google_calendars, get_calendar_events_tool],
    )

    flights_agent = Agent(
        name="FlightsAgent",
        instructions="""
        You are a flight booking specialist. Propose flight options for the shared plan.

        Steps:
        1. Extract destination and available dates from the shared plan.
        2. Use search_flights to find flights for the earliest available slot.
        3. Propose up to 3 flights in the JSON update:
           {
             "flights": [{"airline": "...", "flight_number": "...", "departure": "...", "arrival": "...", "price": "..."}],
             "next_agent": "TravelAssistant"
           }
        4. If no flights, propose alternative dates and suggest CalendarAgent.
        """,
        tools=[search_flights],
    )

    hotels_agent = Agent(
        name="HotelsAgent",
        instructions="""
        You are a hotel booking specialist. Propose hotel options for the shared plan.

        Steps:
        1. Extract destination and dates from the shared plan.
        2. Use search_hotels to find hotels.
        3. Propose up to 3 hotels in the JSON update:
           {
             "hotels": [{"name": "...", "price": 0.0, "address": "...", "rating": 0}],
             "next_agent": "TravelAssistant"
           }
        4. If no hotels, propose alternative destinations and suggest FlightsAgent.
        """,
        tools=[search_hotels],
    )

    travel_assistant = Agent(
        name="TravelAssistant",
        instructions="""
        You are the main travel planner. You manage the shared plan and decide next steps.

        Steps:
        1. On first call, update shared_plan with request and hand off to CalendarAgent.
        2. Receive update proposals from other agents.
        3. Validate and merge updates into shared_plan (you are the ONLY one who modifies it).
        4. Decide next agent based on proposal and plan status:
           - No destination/dates? -> CalendarAgent
           - No flights? -> FlightsAgent
           - No hotels? -> HotelsAgent
           - All complete? Format final plan.
        5. Return JSON:
           - For handoff: {"handoff_to": "AGENT_NAME", "message": "INSTRUCTIONS", "shared_plan": {...}}
           - For final plan: {"status": "complete", "plan": {...}}
        6. Final plan format:
           {
             "status": "complete",
             "plan": {
               "dates": {"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"},
               "flight": {...},
               "hotel": {...},
               "total_cost": 0.0
             }
           }
        """,
        tools=[],
    )

    # Set handoff relationships
    calendar_agent.handoffs = [travel_assistant]
    flights_agent.handoffs = [travel_assistant]
    hotels_agent.handoffs = [travel_assistant]
    travel_assistant.handoffs = [calendar_agent, flights_agent, hotels_agent]

    # Main loop
    current_agent = travel_assistant
    message = json.dumps({"request": request, "shared_plan": shared_plan})
    conversation_history = []

    while True:
        # Run the current agent
        result = Runner.run_sync(
            starting_agent=current_agent,
            input=message
        )
        response = result.final_output if hasattr(result, 'final_output') else str(result)

        # Log conversation
        conversation_history.append({
            "agent": current_agent.name,
            "response": response
        })

        try:
            response_json = json.loads(response)
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON from {current_agent.name}: {response}")
            break

        # TravelAssistant decides next steps
        if current_agent.name != "TravelAssistant":
            # Non-TravelAssistant agents return proposals
            current_agent = travel_assistant
            message = json.dumps({
                "proposal": response_json,
                "shared_plan": shared_plan
            })
            continue

        # TravelAssistant processes response
        if response_json.get("status") == "complete":
            # Final plan received
            shared_plan = response_json["plan"]
            break
        elif "handoff_to" in response_json:
            # Handoff to another agent
            target_agent_name = response_json["handoff_to"]
            target_agent = next(
                (a for a in [calendar_agent, flights_agent, hotels_agent, travel_assistant]
                 if a.name == target_agent_name),
                None
            )
            if target_agent:
                current_agent = target_agent
                shared_plan = response_json.get("shared_plan", shared_plan)
                message = json.dumps({
                    "message": response_json.get("message", ""),
                    "shared_plan": shared_plan
                })
                continue
            else:
                logger.error(f"Agent '{target_agent_name}' not found")
                break
        else:
            logger.error(f"Invalid response from TravelAssistant: {response}")
            break

    # Format final output
    final_output = {
        "status": shared_plan.get("status", "incomplete"),
        "plan": {
            "destination": shared_plan.get("destination"),
            "dates": shared_plan.get("dates"),
            "flight": shared_plan.get("flights")[0] if shared_plan.get("flights") else None,
            "hotel": shared_plan.get("hotels")[0] if shared_plan.get("hotels") else None,
            "total_cost": shared_plan.get("total_cost", 0.0)
        },
        "history": conversation_history
    }

    print("\n=== FINAL PLAN ===")
    print(json.dumps(final_output, indent=2))
    return final_output

# --- Test Case --- #
if __name__ == "__main__":
    print("=== TEST: TRIP TO NEW YORK ===")
    plan = trip_planner(
        "Plan a weekend trip to New York (JFK Airport) starting today (04/13/2025) ending in 3 days, "
        "make sure it doesn't conflict with my calendar."
    )