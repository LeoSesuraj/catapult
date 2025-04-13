import json
import os
from travel_agents import trip_planner
from dotenv import load_dotenv

def check_credentials():
    """Check if the necessary API credentials are set."""
    load_dotenv()
    
    # Check required credentials
    amadeus_client_id = os.getenv('AMADEUS_CLIENT_ID')
    amadeus_client_secret = os.getenv('AMADEUS_CLIENT_SECRET')
    anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')
    
    missing = []
    if not amadeus_client_id or amadeus_client_id == 'your_amadeus_client_id_here':
        missing.append('AMADEUS_CLIENT_ID')
    if not amadeus_client_secret or amadeus_client_secret == 'your_amadeus_client_secret_here':
        missing.append('AMADEUS_CLIENT_SECRET')
    if not anthropic_api_key or anthropic_api_key == 'your_anthropic_key_here':
        missing.append('ANTHROPIC_API_KEY')
    
    return missing

def main():
    """
    Simple test function to run the travel planner with a fixed request.
    This will use mock data instead of real API calls.
    """
    print("\n=== TESTING TRAVEL PLANNER ===\n")
    
    # Check for missing credentials
    missing_creds = check_credentials()
    if missing_creds:
        print(f"WARNING: Missing credentials: {', '.join(missing_creds)}")
        print("The system will use mock data instead of real API calls.\n")
    
    # Use a simple request string
    request = "Plan a weekend trip to New York starting tomorrow ending in 3 days"
    
    print(f"Request: {request}\n")
    
    # Run the trip planner
    try:
        plan = trip_planner(request)
        
        # Save the plan to a file
        output_file = "test_travel_plan.json"
        with open(output_file, 'w') as f:
            json.dump(plan, f, indent=2)
        
        print(f"\n=== PLAN SAVED TO: {output_file} ===\n")
        
        # Print summary
        print("\n=== TRAVEL PLAN SUMMARY ===")
        print(f"Destination: {plan['plan']['destination']}")
        print(f"Dates: {plan['plan']['dates']['start']} to {plan['plan']['dates']['end']}")
        
        if plan['plan']['flight']:
            flight = plan['plan']['flight']
            print(f"\nFlight: {flight.get('airline', 'Unknown')} {flight.get('flight_number', '')}")
            print(f"From: {flight.get('from', 'Unknown')} to {flight.get('to', 'Unknown')}")
            print(f"Departure: {flight.get('departure', 'Unknown')}")
            print(f"Price: {flight.get('price', 'Unknown')} {flight.get('currency', '')}")
        
        if plan['plan']['hotel']:
            hotel = plan['plan']['hotel']
            print(f"\nHotel: {hotel.get('name', 'Unknown')}")
            print(f"Rating: {hotel.get('rating', 'Unknown')}")
            print(f"Price: {hotel.get('price', 'Unknown')}")
            print(f"Address: {hotel.get('address', 'Unknown')}")
        
        print(f"\nTotal Cost: ${plan['plan']['total_cost']:.2f}")
        print("\n=== AGENT CONVERSATION HISTORY ===")
        for entry in plan['history']:
            print(f"\n{entry['agent']} said:")
            print(f"{entry['response'][:200]}..." if len(entry['response']) > 200 else entry['response'])
        
    except Exception as e:
        print(f"Error planning trip: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 