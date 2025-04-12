from calendar_py import calendar_code
from flight_stuff import flight_pipleline
from hotel import hotels
from datetime import date,timedelta
import json


#calendar
#flight
#hotel
#chat
#output JSON itinerary
# Get today's date and tomorrow


#CALENDAR
today = date.today().strftime('%Y-%m-%d')
tomorrow = (date.today() + timedelta(days=1)).strftime('%Y-%m-%d')
events_data = calendar_code.get_calendar_events(start_date=today, end_date=tomorrow, calendar_id=None)
# Output as formatted JSON
cal_output = json.dumps(events_data, indent=2)


#FLIGHT




#HOTEL









