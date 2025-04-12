from datetime import date, timedelta, datetime
import json

# Import the functions from your main file
from catapult.Backend.calendar_py.calendar_code import get_calendar_service, get_calendar_events, list_all_calendars

def get_todays_events(calendar_id=None, print_events=True):
    """
    Get events from Google Calendar for today only, with improved date handling
    If calendar_id is None, gets events from all calendars.
    
    Args:
        calendar_id (str, optional): Calendar ID to fetch events from. If None, fetches from all calendars.
        print_events (bool, optional): Whether to print the events. Defaults to True.
        
    Returns:
        dict: JSON-serializable dictionary containing today's calendar events
    """
    # Get today's date
    today = date.today()
    tomorrow = today + timedelta(days=1)
    
    # Convert to string format
    today_str = today.strftime('%Y-%m-%d')
    tomorrow_str = tomorrow.strftime('%Y-%m-%d')
    
    print(f"Searching for events between {today_str} and {tomorrow_str}")
    
    # Use the existing get_calendar_events function with today and tomorrow
    # This ensures we catch events that might span midnight
    events_data = get_calendar_events(start_date=today_str, end_date=tomorrow_str, calendar_id=calendar_id)
    
    # Print the events if requested
    if print_events and events_data.get("totalEvents", 0) > 0:
        print(f"\nEvents for today ({today_str}):")
        print("------------------------")
        
        # Group events by calendar if we have multiple calendars
        if calendar_id is None and "calendars" in events_data:
            # Create a dictionary to map calendar IDs to calendar names
            calendar_names = {}
            for cal_name, cal_info in events_data.get("calendars", {}).items():
                calendar_names[cal_info.get("id")] = cal_name
            
            # Group events by calendar
            events_by_calendar = {}
            for event in events_data["events"]:
                cal_id = event.get("calendar_id")
                cal_name = event.get("calendar_name") or calendar_names.get(cal_id, "Unknown Calendar")
                
                if cal_name not in events_by_calendar:
                    events_by_calendar[cal_name] = []
                
                events_by_calendar[cal_name].append(event)
            
            # Print events organized by calendar
            for cal_name, events in events_by_calendar.items():
                print(f"\n{cal_name} ({len(events)} events):")
                print("-" * (len(cal_name) + 10))
                
                print_event_list(events)
        else:
            # Just print all events if we're only looking at one calendar
            print_event_list(events_data["events"])
    
    return events_data

def print_event_list(events):
    """Helper function to print a list of events in a formatted way"""
    for i, event in enumerate(events, 1):
        start_time = event["start"].get("dateTime", event["start"].get("date", "All day"))
        
        # Format the time more nicely if it's a dateTime (not an all-day event)
        if "dateTime" in event["start"]:
            try:
                dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                start_time = dt.strftime('%I:%M %p')  # e.g., "09:30 AM"
            except:
                # Keep the original format if parsing fails
                pass
        
        summary = event.get("summary", "Untitled Event")
        print(f"{i}. {summary} - {start_time}")
        
        # Print location if available
        if event.get("location"):
            print(f"   Location: {event['location']}")
        
        # Print description if available (truncated if too long)
        if event.get("description"):
            desc = event.get("description")
            if len(desc) > 100:
                desc = desc[:97] + "..."
            print(f"   Description: {desc}")
        
        print("")  # Empty line between events

def list_available_calendars():
    """Display all calendars the user has access to"""
    calendars = list_all_calendars()
    
    if not calendars:
        print("No calendars found or not authenticated")
        return []
    
    print("\nAvailable Calendars:")
    print("-------------------")
    for i, calendar in enumerate(calendars, 1):
        primary_text = " (Primary)" if calendar.get('primary') else ""
        print(f"{i}. {calendar['summary']}{primary_text}")
    
    return calendars

def test_extended_period():
    """Test function to see if there are events in the next week"""
    today = date.today()
    next_week = today + timedelta(days=7)
    
    today_str = today.strftime('%Y-%m-%d')
    next_week_str = next_week.strftime('%Y-%m-%d')
    
    print(f"Testing with extended period: {today_str} to {next_week_str}")
    
    # Get events for the next week
    events_data = get_calendar_events(start_date=today_str, end_date=next_week_str)
    
    print(f"Found {events_data.get('totalEvents', 0)} events in the next week")
    
    return events_data

# Example usage
if __name__ == "__main__":
    # First get today's events (improved date handling)
    events = get_todays_events(calendar_id=None)
    
    print(f"You have {events.get('totalEvents', 0)} events scheduled for today across all your calendars.")
    
    # If no events found today, try looking at a longer period
    if events.get('totalEvents', 0) == 0:
        print("\nNo events found for today. Checking events for the next week...")
        test_extended_period()