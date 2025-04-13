import sys
import argparse
import json
from travel_agents import trip_planner

def main():
    """
    Main function to run the travel planner from command line.
    """
    parser = argparse.ArgumentParser(description='AI Travel Planner')
    
    parser.add_argument('--destination', type=str, required=True,
                        help='Destination city for travel')
    
    parser.add_argument('--origin', type=str, default=None,
                        help='Origin city (default will use New York)')
    
    parser.add_argument('--start-date', type=str, default=None,
                        help='Start date in YYYY-MM-DD format (default will use tomorrow)')
    
    parser.add_argument('--end-date', type=str, default=None,
                        help='End date in YYYY-MM-DD format (default will be 3 days after start)')
    
    parser.add_argument('--output', type=str, default='travel_plan.json',
                        help='Output JSON file for the travel plan')
    
    parser.add_argument('--debug', action='store_true',
                        help='Enable debug mode with detailed logs')
    
    args = parser.parse_args()
    
    # Construct the request string
    request = f"Plan a trip to {args.destination}"
    
    if args.origin:
        request += f" from {args.origin}"
    
    if args.start_date:
        request += f" starting on {args.start_date}"
    
    if args.end_date:
        request += f" ending on {args.end_date}"
    
    # Run the trip planner
    print(f"\n=== PLANNING TRIP: {request} ===\n")
    
    try:
        plan = trip_planner(request)
        
        # Save the plan to a file
        with open(args.output, 'w') as f:
            json.dump(plan, f, indent=2)
        
        print(f"\n=== PLAN SAVED TO: {args.output} ===\n")
        
        # Print a summary
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
        
    except Exception as e:
        print(f"Error planning trip: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 