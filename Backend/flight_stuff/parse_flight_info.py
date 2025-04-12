import json
import openai
import logging
from datetime import datetime, timedelta
import os
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class TripExtractor:
    def __init__(self):
        """Initialize the TripExtractor with OpenAI API key from environment."""
        # Get API key from environment
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OpenAI API key is required. Set it in your .env file with OPENAI_API_KEY=your_key")
        
        # Initialize OpenAI client with API key
        openai.api_key = api_key
        logger.info("TripExtractor initialized")
    
    def extract_trip_details(self, user_input: str) -> Dict[str, Any]:
        """Extract flight trip details from user input using OpenAI API."""
        # Define system prompt with expected JSON structure
        system_prompt = """
You are a helpful assistant that extracts flight trip details from user requests and returns valid JSON only.
Format the response exactly like this:

{
    "flight": {
        "airline": "F9",
        "flight_number": "2111",
        "from": "MAD",
        "to": "PHL",
        "departure_date": "2025-05-09",
        "return_date": "2025-05-22",
        "price": "unknown",
        "currency": "USD",
        "status": "pending"
    }
}

IMPORTANT DATE HANDLING INSTRUCTIONS:
- If the user mentions a day of the week (like "Monday", "Tuesday", etc.), calculate the actual date for the NEXT occurrence of that day
- If the user says "this Monday", use the date for THIS WEEK's Monday
- If the user says "next Monday", use the date for NEXT WEEK's Monday
- For dates without a year, assume 2025 unless context suggests otherwise
- Always convert date references to ISO format (YYYY-MM-DD)
- Use IATA airport codes (3 letters) for locations

If airline or flight_number is unknown, use "unknown" as placeholder.
For one-way trips, set return_date to "null" (without quotes).
Output valid JSON only without any additional text.
"""

        try:
            # Get the current date to help with relative date handling
            today = datetime.now()
            current_day_name = today.strftime("%A")
            
            # Enhance user input with date context
            enhanced_input = f"Today is {current_day_name}, {today.strftime('%Y-%m-%d')}. User request: {user_input}"
            
            # Make API request
            logger.info(f"Processing user input: {user_input}")
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": enhanced_input}
                ],
                temperature=0.2
            )
            
            # Extract and parse the JSON response
            json_response = response.choices[0].message.content
            trip_data = json.loads(json_response)
            
            # Save to file with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"trip_state.json"
            
            with open(filename, "w") as f:
                json.dump(trip_data, f, indent=4)
            
            logger.info(f"Trip details saved to {filename}")
            return trip_data
            
        except Exception as e:
            logger.error(f"Error extracting trip details: {str(e)}", exc_info=True)
            return {}
    
    def get_next_day_of_week(self, day_name: str, from_date: datetime = None) -> datetime:
        """Get the next occurrence of a day of the week from the given date."""
        if from_date is None:
            from_date = datetime.now()
            
        days = {"monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3, 
                "friday": 4, "saturday": 5, "sunday": 6}
        
        day_num = days.get(day_name.lower())
        if day_num is None:
            return None
            
        days_ahead = day_num - from_date.weekday()
        if days_ahead <= 0:  # Target day already happened this week
            days_ahead += 7
            
        return from_date + timedelta(days=days_ahead)

def main():
    """Main function to demonstrate usage."""
    # Create an extractor instance
    extractor = TripExtractor()
    
    # Get user input or use example
    print("Enter your flight request (or press Enter for example):")
    user_input = input().strip()
    if not user_input:
        user_input = "find me a trip from madrid to philly on monday and returning next friday"
    
    print("🔍 Extracting trip details...")
    result = extractor.extract_trip_details(user_input)
    
    if result:
        print("\n✅ Trip details extracted successfully:")
        print(json.dumps(result, indent=4))
    else:
        print("\n⚠️ Failed to extract trip details.")

if __name__ == "__main__":
    main()