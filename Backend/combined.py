from calendar_py import calendar_code
from hotel import hotels
from datetime import date,timedelta
import json
from openai import OpenAI
from flight_stuff import run_flight_agent


client = OpenAI()

#calendar
#flight
#hotel
#chat
#output JSON itinerary
# Get today's date and tomorrow


#CALENDAR
today = (date.today() + timedelta(days=1)).strftime('%Y-%m-%d')
days = (date.today() + timedelta(days=3)).strftime('%Y-%m-%d')
events_data = calendar_code.get_calendar_events(start_date=today, end_date=days, calendar_id=None)
# Output as formatted JSON
calendar_output = json.dumps(events_data, indent=2)


#FLIGHT
flights_output = json.dumps(run_flight_agent.run_flight_agent("Boston", "Chicago", today), indent = 2)



#HOTEL
hotel_output = json.dumps(hotels.get_hotel('ORD'),indent =2)

#CHAT

prompt = """
    You are an intelligent assistant that takes three structured JSON files as input: `calendar.json`, `flight.json`, and `hotels.json`.

Your goal is to update the `calendar.json` file by identifying events or time periods where there are gaps (e.g., no scheduled activities) and suggesting relevant attractions. These attractions should be based on the location information found within the `flight.json` (destination city) and `hotels.json` (hotel location details, if available).

Specifically, perform the following steps:

1.  **Analyze `flight.json` and `hotels.json`:** Extract the destination city from the flight information. If the hotel information provides a more specific location (e.g., address, neighborhood), prioritize that for finding nearby attractions.

2.  **Analyze `calendar.json`:** Identify time periods within the calendar where there are no scheduled events. Consider the start and end times/dates of existing events to determine these gaps.

3.  **Find Attractions:** For each identified gap in the `calendar.json`, use the extracted location (city or more specific area) to find relevant tourist attractions, points of interest, or activities that a traveler might enjoy.

4.  **Update `calendar.json`:** Add new events to the `calendar.json` representing these suggested attractions. Each new event should include:
    * A descriptive `summary` of the attraction.
    * A `location` (if readily available).
    * A suggested `start` and `end` time/date that fits within the identified gap. Be reasonable with the duration of the suggested activity.
    * Potentially a brief `description` of the attraction.

5.  **Output the updated `calendar.json`** with the newly added attraction events. Ensure the output is a valid JSON structure.

**Example Scenario:**

If `flight.json` indicates a trip to "Paris" and `hotels.json` specifies a hotel near the "Eiffel Tower," and `calendar.json` has a free afternoon, you should suggest visiting the Eiffel Tower or nearby attractions during that time slot in the updated `calendar.json`.

**Provide the content of the three JSON files (`calendar.json`, `flight.json`, `hotels.json`) in your next turn so I can process them.**

NO OVERLAP BETWEEN CURRENTLY EXISTING EVENTS, ESPECIALLY THE FLIGHT AND THE USER CALENDAR EVENTS

   Return strictly in a format similar to this and NOTHING ELSE BESIDES THIS, INCLUDING AND OTHER TEXT:
    {
        "2025-04-13 Sunday": [
            {
            "summary": "test0",
            "location": null,
            "start_time": "11:30",
            "end_time": "14:30",
            "organizer": "testcal",
            "timezone": "America/New_York",
            "calendar_id": "cc36e94847b947d2750aa5ea9eecd9170d32ed4d278b934da59d9df4a1b1cbde@group.calendar.google.com",
            "description": null,
            "status": "confirmed",
            "created": "2025-04-12T20:55:19.000Z",
            "updated": "2025-04-12T20:55:19.521Z",
            "creator_email": "sharegpt27@gmail.com",
            "attendees": null
            },
            {
            "summary": "test0.5",
            "location": null,
            "start_time": "18:45",
            "end_time": "23:00",
            "organizer": "sharegpt27@gmail.com",
            "timezone": "America/New_York",
            "calendar_id": "sharegpt27@gmail.com",
            "description": null,
            "status": "confirmed",
            "created": "2025-04-12T20:55:25.000Z",
            "updated": "2025-04-12T20:55:25.120Z",
            "creator_email": "sharegpt27@gmail.com",
            "attendees": null
            }
        ],
        "(date) (day)": []
    }

NOTHING ELSE SHOULD BE PRINTED! JUST THE JSON STRUCTURE
    """
combined_dict = {calendar_output,flights_output,hotel_output}

response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": prompt}, {"role":"system", "content": str(combined_dict)}]
    )

cal_update = response.choices[0].message.content

print("\n\n-------------------------------\n\n",cal_update)





