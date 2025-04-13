from datetime import date, timedelta
import json

# Import the functions from your main file
from calendar_code import get_calendar_events

if __name__ == "__main__":
    # Get today's date and tomorrow
    today = (date.today() + timedelta(days=1)).strftime('%Y-%m-%d')
    days = (date.today() + timedelta(days=4)).strftime('%Y-%m-%d')
    
    # Get events from all calendars (using None as calendar_id)
    events_data = get_calendar_events(start_date=today, end_date=days, calendar_id=None)
    
    # Output as formatted JSON
    print(json.dumps(events_data, indent=2))