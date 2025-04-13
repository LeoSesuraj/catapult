import requests
import json
import sys

def test_health_check(base_url):
    """Test the health check endpoint"""
    print("\n=== Testing Health Check ===")
    try:
        response = requests.get(f"{base_url}/api/health")
        print(f"Status code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_generate_itinerary(base_url):
    """Test the generate itinerary endpoint"""
    print("\n=== Testing Generate Itinerary ===")
    
    # Sample request data
    data = {
        "destination": "Chicago",
        "origin": "New York",
        "startDate": "2025-06-15",
        "endDate": "2025-06-18",
        "budget": 2000,
        "interests": ["Food", "Sightseeing", "Museums"]
    }
    
    try:
        print(f"Sending request: {json.dumps(data, indent=2)}")
        response = requests.post(
            f"{base_url}/api/generate-itinerary", 
            json=data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            # Print a summary rather than the full response
            print("\nItinerary generated successfully!")
            print(f"Destination: {result.get('destination')}")
            print(f"Origin: {result.get('origin')}")
            print(f"Flight: {result.get('flight', {}).get('airline', '')} {result.get('flight', {}).get('flight_number', '')}")
            print(f"Hotel: {result.get('hotel', {}).get('name', '')}")
            
            # Check if there are activities
            activities = result.get('activities', [])
            if activities:
                print(f"Activities: {len(activities)} days planned")
                # Show first day's activities
                if len(activities) > 0:
                    print("\nFirst day activities:")
                    for act in activities[0].get('activities', [])[:2]:  # Show first 2 activities
                        print(f"- {act.get('time', '')}: {act.get('name', '')}")
                    if len(activities[0].get('activities', [])) > 2:
                        print(f"  ... and {len(activities[0].get('activities', [])) - 2} more")
            
            print(f"\nTotal Cost: ${result.get('total_cost', 0):.2f}")
            return True
        else:
            print(f"Error response: {response.text}")
            return False
            
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    # Get the base URL from command line or use default
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        base_url = "http://localhost:5000"
    
    print(f"Testing API at: {base_url}")
    
    # Run the tests
    health_ok = test_health_check(base_url)
    if health_ok:
        itinerary_ok = test_generate_itinerary(base_url)
        if itinerary_ok:
            print("\n✅ All tests passed! Your API is working correctly.")
        else:
            print("\n❌ Generate itinerary test failed. Check your API implementation.")
    else:
        print("\n❌ Health check failed. Make sure your API server is running.") 