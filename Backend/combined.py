from calendar_py import calendar_code
from hotel import hotels
from datetime import date, timedelta
import json
from openai import OpenAI
from flight_stuff import run_flight_agent

client = OpenAI()

# Get today's date and future dates
today = (date.today() + timedelta(days=1)).strftime('%Y-%m-%d')
days = (date.today() + timedelta(days=4)).strftime('%Y-%m-%d')

# CALENDAR - Get existing calendar events
events_data = calendar_code.get_calendar_events(start_date=today, end_date=days, calendar_id=None)
calendar_output = json.dumps(events_data, indent=2)

# FLIGHT - Get flight information
flights_data = run_flight_agent.run_flight_agent("Indianapolis", "Fort Lauderdale", today)
flights_output = json.dumps(flights_data, indent=2)

# STEP 1: Update calendar with flight and uber information
flight_prompt = """
You are an intelligent assistant that takes two structured JSON files as input: `calendar.json` and `flight.json`.

Your goal is to update the `calendar.json` file by adding the flight information from `flight.json` and booking Uber rides before and after the flights.

Specifically, perform the following steps:

1. Extract flight details from `flight.json`. Add each flight as an event in the calendar with appropriate start and end times.

2. For each flight, add an Uber ride before the flight:
   * Set pickup location as "Your Home" and drop-off as the departure airport
   * Schedule the Uber to arrive at the airport at least 2 hours before the flight departure
   * Add a description prompting the user to be ready on time

3. For each flight, add an Uber ride after the flight:
   * Set pickup location as the arrival airport and drop-off as "HAMPTON FT LAUD ARPT-S CRUISE PT" (the hotel)
   * Schedule the Uber to pick up approximately 30 minutes after the flight arrival
   * Add a description with instructions for finding the Uber

4. Make sure there are NO OVERLAPS between existing calendar events and the new flight/Uber events.

Return ONLY a calendar JSON structure with the updated events. The calendar should follow this format:
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
        ... additional events ...
    ],
    ... additional days ...
}

IMPORTANT: Return ONLY the JSON structure - no additional text, explanations, or commentary.
"""

# Call API to update calendar with flight and Uber info
flight_calendar_response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": flight_prompt},
        {"role": "system", "content": f"calendar.json: {calendar_output}\nflight.json: {flights_output}"}
    ]
)

# Parse the updated calendar with flight info
updated_flight_calendar = flight_calendar_response.choices[0].message.content

# HOTEL - Get hotel information
hotel_data = hotels.get_hotel('FLL')
hotel_output = json.dumps(hotel_data, indent=2)

# STEP 2: Update calendar with hotel check-in information
hotel_prompt = """
You are an intelligent assistant that takes two structured JSON files as input: the updated `calendar.json` and `hotel.json`.

Your goal is to further update the `calendar.json` file by adding hotel check-in and check-out information.

Specifically, perform the following steps:

1. Extract hotel details from `hotel.json`, including the hotel name, address, and check-in/check-out times.

2. Add the hotel check-in as an event in the calendar:
   * Set it on the arrival day, typically a few hours after the flight arrival and Uber ride
   * Use the standard check-in time (usually 3:00 PM) if specified
   * Include the hotel name in the event summary
   * Include the hotel address in the location field
   * Add relevant details in the description

3. Add the hotel check-out as an event in the calendar:
   * Set it on the departure day, before the return flight (if any)
   * Use the standard check-out time (usually 11:00 AM) if specified
   * Include the hotel name in the event summary
   * Include the hotel address in the location field

4. Make sure there are NO OVERLAPS between existing calendar events and the new hotel events.

Return ONLY a calendar JSON structure with the updated events, following the same format as the input calendar.

IMPORTANT: Return ONLY the JSON structure - no additional text, explanations, or commentary.
"""

# Call API to update calendar with hotel info
hotel_calendar_response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": hotel_prompt},
        {"role": "system", "content": f"calendar.json: {updated_flight_calendar}\nhotel.json: {hotel_output}"}
    ]
)

# Parse the updated calendar with hotel info
updated_hotel_calendar = hotel_calendar_response.choices[0].message.content

# STEP 3: Update calendar with meal times
meals_prompt = """
You are an intelligent assistant that takes the updated `calendar.json` as input.

Your goal is to further update the `calendar.json` file by adding three meals per day (breakfast, lunch, and dinner) to the schedule.

Specifically, perform the following steps:

1. For each day in the calendar, identify time slots where meals could be scheduled:
   * Breakfast: Typically between 7:00 AM and 9:00 AM
   * Lunch: Typically between 12:00 PM and 2:00 PM
   * Dinner: Typically between 6:00 PM and 8:00 PM

2. For each meal, find a suitable restaurant in Fort Lauderdale:
   * Suggest different types of restaurants (local cuisine, seafood, etc.)
   * Include the restaurant name in the event summary
   * Include the restaurant's general location in Fort Lauderdale
   * Set a reasonable duration for each meal (30-90 minutes)

3. Make sure there are NO OVERLAPS between existing calendar events and the new meal events.
   * If a time slot is already occupied, either adjust the meal time or skip that meal

4. Give preference to local Fort Lauderdale restaurants and cuisine styles.

Return ONLY a calendar JSON structure with the updated events, following the same format as the input calendar.

IMPORTANT: Return ONLY the JSON structure - no additional text, explanations, or commentary.
"""

# Call API to update calendar with meal info
meals_calendar_response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": meals_prompt},
        {"role": "system", "content": f"calendar.json: {updated_hotel_calendar}"}
    ]
)

# Parse the updated calendar with meal info
updated_meals_calendar = meals_calendar_response.choices[0].message.content

# STEP 4: Fill remaining time slots with attractions
attractions_prompt = """
You are an intelligent assistant that takes the updated `calendar.json` as input.

Your goal is to complete the `calendar.json` file by filling any remaining significant time gaps with attractions and activities in Fort Lauderdale.

Specifically, perform the following steps:

1. Analyze the calendar to identify time gaps of 1.5 hours or more with no scheduled events.

2. For each identified gap, suggest an appropriate attraction or activity in Fort Lauderdale:
   * Consider popular tourist attractions (museums, parks, beaches, etc.)
   * Include shopping areas, cultural sites, and recreational activities
   * Vary the types of activities to provide a diverse experience
   * Set reasonable durations for each activity

3. For each activity:
   * Include a descriptive title in the event summary
   * Include the location in Fort Lauderdale
   * Add a brief description of the attraction
   * Make sure the timing makes sense (e.g., don't schedule outdoor activities too late)

4. Make sure there are NO OVERLAPS between existing calendar events and the new activity events.

5. Ensure the schedule allows for reasonable travel time between locations.

Return ONLY a calendar JSON structure with the updated events, following the same format as the input calendar.

IMPORTANT: Return ONLY the JSON structure - no additional text, explanations, or commentary.
"""

# Call API to update calendar with attractions info
attractions_calendar_response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": attractions_prompt},
        {"role": "system", "content": f"calendar.json: {updated_meals_calendar}"}
    ]
)

# Parse the final updated calendar with all info
final_calendar_raw = attractions_calendar_response.choices[0].message.content

# Process the final calendar to ensure proper ordering and fix overlaps
sort_prompt = """
You are an intelligent assistant that needs to fix a calendar JSON file.

The calendar file has two issues that need to be fixed:
1. Events for each day need to be sorted chronologically by start_time
2. There are scheduling conflicts (overlapping events) that need to be resolved

For each day in the calendar:
1. Sort all events by start_time in ascending order
2. Identify any overlapping events (where one event starts before another ends)
3. For overlapping events:
   * If one is a flight or transportation event, prioritize that and adjust non-essential events
   * If one is a user's original event (test1, test2, etc.), prioritize that and move other events
   * Adjust start_time and end_time of conflicting events to avoid overlap
   * If necessary, shorten the duration of non-essential events

Return ONLY the fixed JSON structure with events properly sorted chronologically and conflicts resolved.

IMPORTANT: Return ONLY the JSON structure - no additional text or commentary.
"""

# Call API to sort and fix conflicts in the calendar
sorted_calendar_response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": sort_prompt},
        {"role": "system", "content": final_calendar_raw}
    ]
)

# Get the properly sorted and conflict-free calendar
final_calendar = sorted_calendar_response.choices[0].message.content

# Output the final itinerary
print("\n\n-------------------------------\n\n", final_calendar)

# Optionally save the final calendar to a file
with open('final_itinerary.json', 'w') as f:
    f.write(final_calendar)