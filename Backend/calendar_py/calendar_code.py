from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from datetime import datetime, timedelta, date
import os.path
import json
from dotenv import load_dotenv

# If modifying these scopes, delete the file token.json
SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']

# Global service variable to reuse the authenticated service
_service = None

def get_calendar_service():
    """
    Set up and return an authenticated Google Calendar service
    using credentials from token.json
    """
    # Get the directory of the current script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    token_path = os.path.join(script_dir, 'token.json')

    creds = None
    if os.path.exists(token_path):
        try:
            creds = Credentials.from_authorized_user_file(token_path, SCOPES)
        except Exception as e:
            print(f"Error loading token: {e}")
            return None

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                with open(token_path, 'w') as token:
                    token.write(creds.to_json())
            except Exception as e:
                print(f"Error refreshing token: {e}")
                return None
        else:
            print("No valid credentials available")
            return None

    try:
        service = build('calendar', 'v3', credentials=creds)
        return service
    except Exception as e:
        print(f"Error building calendar service: {e}")
        return None

def get_calendar_events(start_date, end_date):
    """
    Get events from the user's primary calendar between start_date and end_date
    
    Args:
        start_date (str): Start date in YYYY-MM-DD format
        end_date (str): End date in YYYY-MM-DD format
    
    Returns:
        dict: Dictionary containing events or error message
    """
    try:
        service = get_calendar_service()
        if not service:
            return {"error": "Failed to get calendar service"}

        # Convert dates to RFC3339 timestamp
        start_datetime = f"{start_date}T00:00:00Z"
        end_datetime = f"{end_date}T23:59:59Z"

        events_result = service.events().list(
            calendarId='primary',
            timeMin=start_datetime,
            timeMax=end_datetime,
            maxResults=100,
            singleEvents=True,
            orderBy='startTime'
        ).execute()

        events = events_result.get('items', [])
        
        # Format events for frontend
        formatted_events = []
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            end = event['end'].get('dateTime', event['end'].get('date'))
            formatted_events.append({
                'id': event['id'],
                'summary': event['summary'],
                'start': start,
                'end': end,
                'description': event.get('description', ''),
                'location': event.get('location', '')
            })

        return {
            "success": True,
            "events": formatted_events
        }

    except Exception as e:
        return {
            "error": f"Failed to fetch calendar events: {str(e)}"
        }

def list_all_calendars(service):
    """
    List all available calendars for the authenticated user
    
    Args:
        service: Authenticated Google Calendar service
    
    Returns:
        list: List of calendar objects
    """
    try:
        calendar_list = service.calendarList().list().execute()
        return calendar_list.get('items', [])
    except Exception as e:
        print(f"Error listing calendars: {e}")
        return None

def get_calendar_events_single(start_date, end_date, calendar_id='primary', calendar_name=None):
    """
    Fetch events from a single Google Calendar for a specified date range
    
    Args:
        start_date (str, optional): Start date in 'YYYY-MM-DD' format. Defaults to today.
        end_date (str, optional): End date in 'YYYY-MM-DD' format. Defaults to 7 days from start date.
        calendar_id (str, optional): Calendar ID to fetch events from. Defaults to 'primary'.
        calendar_name (str, optional): Name of the calendar for display purposes.
        
    Returns:
        dict: JSON-serializable dictionary containing calendar events
    """
    service = get_calendar_service()
    
    if not service:
        return {"error": "Not authenticated"}
    
    # Default to today if no start date provided
    if not start_date:
        start_date = date.today().strftime('%Y-%m-%d')
    
    # Parse the start date
    start_datetime = datetime.strptime(start_date, '%Y-%m-%d')
    
    # Calculate the end date if not provided
    if not end_date:
        end_datetime = start_datetime + timedelta(days=7)
    else:
        end_datetime = datetime.strptime(end_date, '%Y-%m-%d')
    
    # Format dates as RFC3339 timestamps
    time_min = start_datetime.isoformat() + 'Z'  # 'Z' indicates UTC time
    time_max = end_datetime.isoformat() + 'Z'
    
    try:
        # Call the Calendar API
        events_result = service.events().list(
            calendarId=calendar_id,
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        
        # Transform the response into a cleaner format
        formatted_events = []
        for event in events:
            formatted_event = {
                'id': event.get('id'),
                'summary': event.get('summary'),
                'description': event.get('description'),
                'location': event.get('location'),
                'start': event.get('start'),
                'end': event.get('end'),
                'status': event.get('status'),
                'created': event.get('created'),
                'updated': event.get('updated'),
                'creator': event.get('creator'),
                'organizer': event.get('organizer'),
                'attendees': event.get('attendees'),
                'calendar_id': calendar_id,
                'calendar_name': calendar_name or calendar_id
            }
            formatted_events.append(formatted_event)
        
        result = {
            'totalEvents': len(formatted_events),
            'dateRange': {
                'start': time_min,
                'end': time_max
            },
            'events': formatted_events
        }
        
        return result
        
    except Exception as error:
        print(f'An error occurred: {error}')
        return {"error": str(error)}

def get_calendar_events(start_date, end_date, calendar_id=None):
    """
    Fetch events from Google Calendar for a specified date range.
    If calendar_id is None, gets events from all calendars.
    
    Args:
        start_date (str, optional): Start date in 'YYYY-MM-DD' format. Defaults to today.
        end_date (str, optional): End date in 'YYYY-MM-DD' format. Defaults to 7 days from start date.
        calendar_id (str, optional): Calendar ID to fetch events from. If None, fetches from all calendars.
        
    Returns:
        dict: JSON-serializable dictionary containing calendar events
    """
    # If a specific calendar ID is provided, get events only from that calendar
    if calendar_id:
        return get_calendar_events_single(start_date, end_date, calendar_id)
    
    # Otherwise, get events from all calendars
    return get_all_calendars_events(start_date, end_date)

def get_all_calendars_events(start_date=None, end_date=None):
    """
    Fetch events from all available calendars for a specified date range
    
    Args:
        start_date (str, optional): Start date in 'YYYY-MM-DD' format. Defaults to today.
        end_date (str, optional): End date in 'YYYY-MM-DD' format. Defaults to 7 days from start date.
        
    Returns:
        dict: JSON-serializable dictionary containing calendar events from all calendars
    """
    # Get all available calendars
    calendars = list_all_calendars()
    
    if not calendars:
        return {"error": "No calendars found or not authenticated"}
    
    # Display available calendars
    print("\nAvailable Calendars:")
    print("-------------------")
    for i, calendar in enumerate(calendars, 1):
        primary_text = " (Primary)" if calendar.get('primary') else ""
        print(f"{i}. {calendar['summary']}{primary_text}")
    
    # Collect events from all calendars
    all_events = []
    total_events = 0
    calendar_results = {}
    
    for calendar in calendars:
        calendar_id = calendar['id']
        calendar_name = calendar['summary']
        
        print(f"\nFetching events from '{calendar_name}'...")
        calendar_data = get_calendar_events_single(start_date, end_date, calendar_id, calendar_name)
        
        if 'error' not in calendar_data:
            events_count = calendar_data['totalEvents']
            total_events += events_count
            all_events.extend(calendar_data['events'])
            
            # Store individual calendar results
            calendar_results[calendar_name] = {
                'id': calendar_id,
                'events_count': events_count
            }
            
            print(f"Found {events_count} events in '{calendar_name}'")
    
    # Create consolidated result
    date_range = None
    if all_events:
        # Just use the date range parameters we were passed
        start_datetime = datetime.strptime(start_date or date.today().strftime('%Y-%m-%d'), '%Y-%m-%d')
        if not end_date:
            end_datetime = start_datetime + timedelta(days=7)
        else:
            end_datetime = datetime.strptime(end_date, '%Y-%m-%d')
            
        date_range = {
            'start': start_datetime.isoformat() + 'Z',
            'end': end_datetime.isoformat() + 'Z'
        }
    
    result = {
        'totalEvents': total_events,
        'dateRange': date_range,
        'calendars': calendar_results,
        'events': all_events
    }
    
    return result