from travel_agents import trip_planner
import json
import logging

logging.basicConfig(level=logging.INFO)

def main():
    # Test request with specific dates to avoid needing calendar integration
    request = "Plan a trip to Chicago from New York, starting on 2023-08-15 and ending on 2023-08-18. Include flight, hotel, and suggest some activities each day."
    
    print("\n=== PLANNING TRIP ===")
    print(f"Request: {request}\n")
    
    try:
        # Run the planner
        result = trip_planner(request)
        
        # Save the result
        with open("trip_plan.json", "w") as f:
            json.dump(result, f, indent=2)
            
        print("\nPlan saved to trip_plan.json")
        
    except Exception as e:
        print(f"\nError planning trip: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 