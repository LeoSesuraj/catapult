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
    using credentials from a config file
    """
    global _service
    if _service is not None:
        return _service

    load_dotenv()

    # Get the directory of the current script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    token_path = os.path.join(script_dir, 'token.json')
    print(f"Looking for token.json at: {token_path}")  # Debug: Confirm token path

    # Construct client configuration from environment variables
    try:
        client_config = {
            "installed": {
                "client_id": os.getenv("CLIENT_ID"),
                "client_secret": os.getenv("CLIENT_SECRET"),
                "auth_uri": os.getenv("AUTH_URI"),
                "token_uri": os.getenv("TOKEN_URI"),
                "redirect_uris": ["http://localhost:8080"]
            }
        }
        # Check if any required key is missing
        if not all(client_config["installed"].values()):
            raise ValueError("One or more credentials are missing from .env file")
    except Exception as e:
        print(f"Error loading credentials: {e}")
        return None
    
    creds = None
    # Try to load existing token.json if it exists
    if os.path.exists(token_path):
        try:
            with open(token_path, 'r') as token_file:
                token_data = json.load(token_file)  # Verify JSON is valid
            creds = Credentials.from_authorized_user_file(token_path, SCOPES)
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Error loading token: Invalid or corrupted token.json ({e}). Starting new authentication.")
            # Delete the corrupted token.json to force re-authentication
            os.remove(token_path)
        except Exception as e:
            print(f"Error loading token: {e}")

    # If no valid credentials, run OAuth2 flow
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception as e:
                print(f"Error refreshing token: {e}")
                creds = None
        
        if not creds:
            try:
                flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
                # Customize the success message to auto-close the tab
                success_message = """
                """
                creds = flow.run_local_server(
                    port=8080,
                    open_browser=True,
                    success_message=success_message
                )
                # Save the credentials for future runs
                with open(token_path, 'w') as token:
                    token.write(creds.to_json())
            except Exception as e:
                print(f"Error during OAuth2 authentication: {e}")
                return None

    try:
        _service = build('calendar', 'v3', credentials=creds)
        return _service
    except Exception as e:
        print(f"Error building calendar service: {e}")
        return None

def list_all_calendars(service):
    """
    List all calendars the user has access to
    
    Returns:
        list: List of dictionaries containing calendar info (id, summary, etc.)
    """
    # service = get_calendar_service()
    
    # if not service:
    #     return []
    
    try:
        # Get list of calendars
        calendar_list = service.calendarList().list().execute()
        
        # Format the calendar list
        calendars = []
        for calendar in calendar_list.get('items', []):
            calendars.append({
                'id': calendar['id'],
                'summary': calendar.get('summary', 'Unnamed Calendar'),
                'description': calendar.get('description', ''),
                'primary': calendar.get('primary', False)
            })
        
        return calendars
    
    except Exception as error:
        print(f'An error occurred while listing calendars: {error}')
        return []

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