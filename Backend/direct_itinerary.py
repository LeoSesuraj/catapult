import json
from datetime import datetime, timedelta
import random
from dotenv import load_dotenv
import os
import sys
import logging
import argparse
import re
from typing import Dict, Any, List

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Import flight and hotel modules
try:
    from flight_stuff import run_flight_agent
    from hotel import hotels
    APIS_AVAILABLE = True
    logger.info("Successfully imported flight and hotel APIs")
except ImportError as e:
    logger.warning(f"Warning: Flight or hotel modules not available, using mock data. Error: {e}")
    APIS_AVAILABLE = False

def create_itinerary(request):
    """Create a travel itinerary based on a request string"""
    
    # Extract basic information from request
    destination = "Chicago"  # Default
    origin = "New York"      # Default
    start_date = "2025-06-15"  # Default: June 2025
    end_date = "2025-06-18"    # Default: 3 days after start
    
    # Extract destination if it's in the request
    destination_patterns = [
        r"to\s+([A-Za-z\s]+)(?:,|\s+from|\s+on)", # "to Chicago from" or "to Chicago on"
        r"in\s+([A-Za-z\s]+)(?:,|\s+from|\s+on)", # "in Chicago from" or "in Chicago on"
        r"visit\s+([A-Za-z\s]+)(?:,|\s+from|\s+on)" # "visit Chicago from" or "visit Chicago on"
    ]
    
    for pattern in destination_patterns:
        dest_match = re.search(pattern, request)
        if dest_match:
            destination = dest_match.group(1).strip()
            break
    
    # Extract origin if it's in the request
    origin_patterns = [
        r"from\s+([A-Za-z\s]+)(?:,|\s+starting|\s+on|\s+to)", # "from New York starting" or "from New York on"
        r"leaving\s+([A-Za-z\s]+)(?:,|\s+to|\s+on)" # "leaving New York to" or "leaving New York on"
    ]
    
    for pattern in origin_patterns:
        origin_match = re.search(pattern, request)
        if origin_match:
            origin = origin_match.group(1).strip()
            break
    
    # Extract dates if they're in the request - try multiple formats
    date_patterns = [
        # Exact format: "starting on 2023-08-15 and ending on 2023-08-18"
        r"starting\s+on\s+(\d{4}-\d{2}-\d{2})\s+and\s+ending\s+on\s+(\d{4}-\d{2}-\d{2})",
        # More relaxed: "from 2023-08-15 to 2023-08-18"
        r"from\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})",
        # MM/DD/YYYY format: "from 08/15/2023 to 08/18/2023"
        r"from\s+(\d{2}/\d{2}/\d{4})\s+to\s+(\d{2}/\d{2}/\d{4})",
        # Support "for X days" pattern
        r"starting\s+(?:on\s+)?(\d{4}-\d{2}-\d{2})\s+for\s+(\d+)\s+days"
    ]
    
    for pattern in date_patterns:
        date_match = re.search(pattern, request)
        if date_match:
            if "for" in pattern and "days" in pattern:
                # Handle "for X days" pattern
                start_date = date_match.group(1)
                days = int(date_match.group(2))
                start = datetime.strptime(start_date, "%Y-%m-%d")
                end = start + timedelta(days=days)
                end_date = end.strftime('%Y-%m-%d')
            elif "/" in pattern:
                # Handle MM/DD/YYYY format
                start_str = date_match.group(1)
                end_str = date_match.group(2)
                start = datetime.strptime(start_str, "%m/%d/%Y")
                end = datetime.strptime(end_str, "%m/%d/%Y")
                start_date = start.strftime('%Y-%m-%d')
                end_date = end.strftime('%Y-%m-%d')
            else:
                # Standard YYYY-MM-DD format
                start_date = date_match.group(1)
                end_date = date_match.group(2)
            break
    
    # Also look for "for X days" without an explicit start date
    days_match = re.search(r"for\s+(\d+)\s+days", request)
    if days_match and "starting" not in request and "from" not in request:
        days = int(days_match.group(1))
        start = datetime.now() + timedelta(days=7)  # Default to next week
        end = start + timedelta(days=days)
        start_date = start.strftime('%Y-%m-%d')
        end_date = end.strftime('%Y-%m-%d')
    
    # Clean up destination to remove "from" clause if it was incorrectly parsed
    if "from" in destination:
        destination = destination.split("from")[0].strip()
    
    # Handle other keywords that might appear in destination
    keywords = ["starting", "beginning", "leaving", "departing", "for", "visit"]
    for keyword in keywords:
        if keyword in destination:
            destination = destination.split(keyword)[0].strip()
    
    # Remove trailing commas or periods
    destination = destination.rstrip('.,')
    origin = origin.rstrip('.,')
    
    # Calculate trip duration in days
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    duration = (end - start).days
    
    # Get flight data from real API
    flight = None
    if APIS_AVAILABLE:
        try:
            print(f"Searching for flights from {origin} to {destination} on {start_date}...")
            flight_data = run_flight_agent.run_flight_agent(origin, destination, start_date)
            
            if flight_data and len(flight_data) > 0:
                best_flight = flight_data[0]  # Take the first flight
                flight = {
                    "airline": best_flight.get("airline", "Unknown Airline"),
                    "flight_number": best_flight.get("flight_number", ""),
                    "departure": best_flight.get("departure", f"{start_date}T08:30:00"),
                    "arrival": best_flight.get("arrival", f"{start_date}T10:15:00"),
                    "price": float(best_flight.get("price", 0)),
                    "currency": best_flight.get("currency", "USD")
                }
                print(f"Found flight: {flight['airline']} {flight['flight_number']}")
        except Exception as e:
            print(f"Error getting real flight data: {e}")
            flight = None
    
    # If no real flight data, use mock data
    if not flight:
        print("Using mock flight data...")
        
        # More realistic mock flights based on destination
        flight_details = {
            "Chicago": {
                "airlines": ["United Airlines", "American Airlines", "Delta"],
                "flight_numbers": ["UA515", "AA1259", "DL2153"],
                "departure_times": ["08:30:00", "10:15:00", "07:45:00"],
                "arrival_times": ["10:05:00", "11:50:00", "09:20:00"],
                "prices": [345.99, 389.50, 412.75]
            },
            "Las Vegas": {
                "airlines": ["Southwest", "JetBlue", "Spirit"],
                "flight_numbers": ["WN1211", "B6455", "NK711"],
                "departure_times": ["09:15:00", "11:00:00", "14:30:00"],
                "arrival_times": ["12:05:00", "14:20:00", "17:45:00"],
                "prices": [299.99, 375.50, 215.75]
            },
            "Miami": {
                "airlines": ["American Airlines", "Delta", "JetBlue"],
                "flight_numbers": ["AA2381", "DL1092", "B6728"],
                "departure_times": ["07:30:00", "10:00:00", "13:15:00"],
                "arrival_times": ["10:45:00", "13:25:00", "16:40:00"],
                "prices": [415.50, 382.99, 362.75]
            }
        }
        
        # Get realistic flight details for the destination or use generic ones
        dest_flights = flight_details.get(destination, {
            "airlines": ["United Airlines", "American Airlines", "Delta"],
            "flight_numbers": ["UA" + str(random.randint(100, 999)), 
                              "AA" + str(random.randint(100, 999)), 
                              "DL" + str(random.randint(100, 999))],
            "departure_times": ["08:30:00", "10:15:00", "12:45:00"],
            "arrival_times": ["10:15:00", "12:00:00", "14:30:00"],
            "prices": [round(random.uniform(250, 450), 2) for _ in range(3)]
        })
        
        # Choose a random index
        idx = random.randint(0, 2)
        
        flight = {
            "airline": dest_flights["airlines"][idx],
            "flight_number": dest_flights["flight_numbers"][idx],
            "departure": start_date + "T" + dest_flights["departure_times"][idx],
            "arrival": start_date + "T" + dest_flights["arrival_times"][idx],
            "price": dest_flights["prices"][idx],
            "currency": "USD"
        }
    
    # Get hotel data from real API
    hotel = None
    if APIS_AVAILABLE:
        try:
            # Convert city name to airport/city code for Amadeus API
            city_codes = {
                "New York": "NYC",
                "Chicago": "CHI",
                "Los Angeles": "LAX",
                "San Francisco": "SFO",
                "Miami": "MIA",
                "Las Vegas": "LAS",
                "Orlando": "MCO",
                "Washington": "WAS",
                "Boston": "BOS",
                "Dallas": "DFW",
                "Denver": "DEN",
                "Seattle": "SEA",
                "Atlanta": "ATL",
                "Houston": "HOU",
                "Phoenix": "PHX",
                "Philadelphia": "PHL",
                "San Diego": "SAN",
                "Portland": "PDX",
                "Honolulu": "HNL",
                "New Orleans": "MSY"
            }
            
            # Get city code for the destination
            city_code = city_codes.get(destination, destination[:3].upper())
            print(f"Searching for hotels in {destination} (code: {city_code})...")
            
            hotel_data = hotels.get_hotel(city_code)
            
            if hotel_data:
                hotel_offers = hotels.get_hotel_offers(hotel_data["hotelId"])
                if hotel_offers and len(hotel_offers) > 0:
                    best_offer = hotel_offers[0]['offers'][0]
                    price = float(best_offer['price']['total'])
                    
                    # Build a proper address string
                    address_parts = []
                    if hotel_data.get('address', {}).get('line1'):
                        address_parts.append(hotel_data['address']['line1'])
                    if hotel_data.get('address', {}).get('city'):
                        address_parts.append(hotel_data['address']['city'])
                    if hotel_data.get('address', {}).get('country'):
                        address_parts.append(hotel_data['address']['country'])
                    address = ', '.join(address_parts) if address_parts else "Address not available"
                    
                    hotel = {
                        "name": hotel_data.get('name', 'Unknown Hotel'),
                        "price": price,
                        "address": address,
                        "rating": hotel_data.get('rating', 0),
                        "available": True
                    }
                    print(f"Found hotel: {hotel['name']}")
        except Exception as e:
            print(f"Error getting real hotel data: {e}")
            hotel = None
    
    # If no real hotel data, use mock data
    if not hotel:
        print("Using mock hotel data...")
        
        # More realistic mock hotels based on destination
        hotel_details = {
            "Chicago": [
                {"name": "The Langham Chicago", "price": 389.00, "address": "330 N Wabash Ave, Chicago, IL", "rating": 4.9},
                {"name": "The Peninsula Chicago", "price": 425.00, "address": "108 E Superior St, Chicago, IL", "rating": 4.8},
                {"name": "Hilton Chicago", "price": 249.00, "address": "720 S Michigan Ave, Chicago, IL", "rating": 4.3}
            ],
            "Las Vegas": [
                {"name": "Bellagio Las Vegas", "price": 279.00, "address": "3600 S Las Vegas Blvd, Las Vegas, NV", "rating": 4.7},
                {"name": "Caesars Palace", "price": 249.00, "address": "3570 S Las Vegas Blvd, Las Vegas, NV", "rating": 4.5},
                {"name": "The Venetian Resort", "price": 299.00, "address": "3355 S Las Vegas Blvd, Las Vegas, NV", "rating": 4.8}
            ],
            "Miami": [
                {"name": "Fontainebleau Miami Beach", "price": 359.00, "address": "4441 Collins Ave, Miami Beach, FL", "rating": 4.5},
                {"name": "Loews Miami Beach Hotel", "price": 319.00, "address": "1601 Collins Ave, Miami Beach, FL", "rating": 4.6},
                {"name": "The Setai Miami Beach", "price": 499.00, "address": "2001 Collins Ave, Miami Beach, FL", "rating": 4.9}
            ],
            "New York": [
                {"name": "The Plaza Hotel", "price": 599.00, "address": "768 5th Ave, New York, NY", "rating": 4.7},
                {"name": "The Ritz-Carlton New York", "price": 549.00, "address": "50 Central Park South, New York, NY", "rating": 4.8},
                {"name": "Park Hyatt New York", "price": 695.00, "address": "153 W 57th St, New York, NY", "rating": 4.9}
            ]
        }
        
        # Get realistic hotel details for the destination or use generic one
        dest_hotels = hotel_details.get(destination, [
            {"name": f"Downtown {destination} Hotel", "price": round(random.uniform(180, 350), 2), 
             "address": f"123 Main St, {destination}", "rating": round(random.uniform(4.0, 4.8), 1)},
            {"name": f"{destination} Grand Hotel", "price": round(random.uniform(250, 450), 2), 
             "address": f"456 Park Ave, {destination}", "rating": round(random.uniform(4.2, 4.9), 1)},
            {"name": f"The {destination} Plaza", "price": round(random.uniform(200, 400), 2), 
             "address": f"789 Central Blvd, {destination}", "rating": round(random.uniform(4.1, 4.7), 1)}
        ])
        
        # Choose a random hotel
        selected_hotel = random.choice(dest_hotels)
        
        hotel = {
            "name": selected_hotel["name"],
            "price": selected_hotel["price"],
            "address": selected_hotel["address"],
            "rating": selected_hotel["rating"],
            "available": True
        }
    
    # Calculate total cost
    total_cost = flight["price"] + (hotel["price"] * duration)
    
    # Create a list of activities for each day
    activities = []
    
    # Generate activities using city-specific data when available
    activities = []
    for day in range(1, min(duration + 1, 4)):
        day_activities = {
            "day": day,
            "activities": create_city_specific_activities(destination, day, duration)
        }
        activities.append(day_activities)
    
    # Build the complete itinerary object
    itinerary = {
        "dates": {
            "start": start_date,
            "end": end_date
        },
        "destination": destination,
        "origin": origin,
        "flight": flight,
        "hotel": hotel,
        "activities": activities,
        "total_cost": round(total_cost, 2),
        "status": "complete"
    }
    
    return itinerary

def create_city_specific_activities(destination, day, duration):
    """Create more realistic activities based on the destination"""
    
    # Dictionary of city-specific activities
    city_activities = {
        "Chicago": {
            1: {
                "morning": {
                    "name": "Architecture River Cruise",
                    "description": "90-minute guided boat tour of Chicago's iconic buildings",
                    "location": "Chicago River, Downtown",
                    "cost": 42.99
                },
                "afternoon": {
                    "name": "Lunch at Giordano's & Millennium Park",
                    "description": "Famous deep dish pizza followed by Cloud Gate (The Bean) visit",
                    "location": "Millennium Park, Chicago",
                    "cost": 35.50
                },
                "evening": {
                    "name": "Dinner at The Signature Room",
                    "description": "Upscale dining with panoramic views from the 95th floor",
                    "location": "875 N Michigan Ave, Chicago",
                    "cost": 95.00
                }
            },
            2: {
                "morning": {
                    "name": "Art Institute of Chicago",
                    "description": "World-class art museum with extensive collection",
                    "location": "111 S Michigan Ave, Chicago",
                    "cost": 25.00
                },
                "afternoon": {
                    "name": "Magnificent Mile Shopping",
                    "description": "Upscale shopping along Michigan Avenue",
                    "location": "N Michigan Ave, Chicago",
                    "cost": 100.00
                },
                "evening": {
                    "name": "Chicago Blues Experience",
                    "description": "Live blues music at Kingston Mines or Buddy Guy's Legends",
                    "location": "Blues District, Chicago",
                    "cost": 65.00
                }
            },
            3: {
                "morning": {
                    "name": "Museum of Science and Industry",
                    "description": "One of the largest science museums in the world",
                    "location": "5700 S Lake Shore Dr, Chicago",
                    "cost": 21.95
                },
                "afternoon": {
                    "name": "Wrigley Field Tour or Game",
                    "description": "Visit the historic home of the Chicago Cubs",
                    "location": "1060 W Addison St, Chicago",
                    "cost": 70.00
                },
                "evening": {
                    "name": "Comedy at Second City",
                    "description": "Live comedy at the legendary improv theater",
                    "location": "1616 N Wells St, Chicago",
                    "cost": 45.00
                }
            }
        },
        "New York": {
            1: {
                "morning": {
                    "name": "Statue of Liberty & Ellis Island",
                    "description": "Ferry ride and guided tour of iconic landmarks",
                    "location": "Battery Park, Manhattan",
                    "cost": 23.50
                },
                "afternoon": {
                    "name": "Lunch & Central Park Exploration",
                    "description": "Enjoy local cuisine and walk through Central Park",
                    "location": "Central Park, Manhattan",
                    "cost": 45.00
                },
                "evening": {
                    "name": "Broadway Show",
                    "description": "Evening performance of a hit Broadway musical",
                    "location": "Theater District, Manhattan",
                    "cost": 175.00
                }
            },
            2: {
                "morning": {
                    "name": "Metropolitan Museum of Art",
                    "description": "Explore one of the world's finest art collections",
                    "location": "1000 5th Ave, Manhattan",
                    "cost": 25.00
                },
                "afternoon": {
                    "name": "SoHo Shopping & Greenwich Village",
                    "description": "Boutique shopping and historic neighborhood tour",
                    "location": "SoHo & Greenwich Village",
                    "cost": 120.00
                },
                "evening": {
                    "name": "Dinner in Little Italy",
                    "description": "Authentic Italian cuisine in historic neighborhood",
                    "location": "Mulberry St, Manhattan",
                    "cost": 85.00
                }
            },
            3: {
                "morning": {
                    "name": "Top of the Rock Observation Deck",
                    "description": "Panoramic views from Rockefeller Center",
                    "location": "30 Rockefeller Plaza, Manhattan",
                    "cost": 40.00
                },
                "afternoon": {
                    "name": "High Line & Chelsea Market",
                    "description": "Elevated park walk and gourmet food hall",
                    "location": "Chelsea, Manhattan",
                    "cost": 35.00
                },
                "evening": {
                    "name": "Night Tour of NYC",
                    "description": "See the city lights and skyline at night",
                    "location": "Manhattan",
                    "cost": 65.00
                }
            }
        },
        "Las Vegas": {
            1: {
                "morning": {
                    "name": "Bellagio Fountains & Conservatory",
                    "description": "Musical water fountain shows and botanical garden",
                    "location": "Bellagio Resort, Las Vegas Strip",
                    "cost": 0.00
                },
                "afternoon": {
                    "name": "Lunch at Caesars Palace & Forum Shops",
                    "description": "High-end shopping mall with Roman architecture",
                    "location": "Caesars Palace, Las Vegas Strip",
                    "cost": 75.00
                },
                "evening": {
                    "name": "Cirque du Soleil Show",
                    "description": "World-famous acrobatic performances",
                    "location": "Las Vegas Strip",
                    "cost": 159.00
                }
            },
            2: {
                "morning": {
                    "name": "Grand Canyon Helicopter Tour",
                    "description": "Breathtaking aerial views of the Grand Canyon",
                    "location": "Grand Canyon National Park",
                    "cost": 399.00
                },
                "afternoon": {
                    "name": "Vegas Pool Party",
                    "description": "Poolside party at a luxury resort",
                    "location": "Las Vegas Strip",
                    "cost": 60.00
                },
                "evening": {
                    "name": "Fremont Street Experience",
                    "description": "Historic Vegas nightlife and light show",
                    "location": "Downtown Las Vegas",
                    "cost": 30.00
                }
            },
            3: {
                "morning": {
                    "name": "High Roller Observation Wheel",
                    "description": "World's tallest observation wheel with city views",
                    "location": "The LINQ, Las Vegas Strip",
                    "cost": 35.00
                },
                "afternoon": {
                    "name": "Hoover Dam Tour",
                    "description": "Visit the historic engineering marvel",
                    "location": "Hoover Dam",
                    "cost": 45.00
                },
                "evening": {
                    "name": "Vegas Magic Show",
                    "description": "World-class illusionists and magicians",
                    "location": "Las Vegas Strip",
                    "cost": 110.00
                }
            }
        }
    }
    
    # Create activities
    if destination in city_activities and day in city_activities[destination]:
        day_acts = city_activities[destination][day]
        
        morning = {
            "time": "Morning",
            "name": day_acts["morning"]["name"],
            "description": day_acts["morning"]["description"],
            "location": day_acts["morning"]["location"],
            "cost": day_acts["morning"]["cost"]
        }
        
        afternoon = {
            "time": "Afternoon",
            "name": day_acts["afternoon"]["name"],
            "description": day_acts["afternoon"]["description"],
            "location": day_acts["afternoon"]["location"],
            "cost": day_acts["afternoon"]["cost"]
        }
        
        evening = {
            "time": "Evening",
            "name": day_acts["evening"]["name"],
            "description": day_acts["evening"]["description"],
            "location": day_acts["evening"]["location"],
            "cost": day_acts["evening"]["cost"]
        }
        
        return [morning, afternoon, evening]
    
    # Fallback to generic activities with destination name
    return [
        {
            "time": "Morning",
            "name": f"Sightseeing Tour in {destination}",
            "description": f"Guided tour of {destination}'s main attractions",
            "location": f"{destination} Downtown",
            "cost": round(random.uniform(35, 65), 2)
        },
        {
            "time": "Afternoon",
            "name": f"Local Cuisine & Shopping in {destination}",
            "description": f"Sample the best food and shops in {destination}",
            "location": f"{destination} Market District",
            "cost": round(random.uniform(50, 90), 2)
        },
        {
            "time": "Evening",
            "name": f"Nightlife Experience in {destination}",
            "description": f"Experience {destination} after dark with dinner and entertainment",
            "location": f"{destination} Entertainment District",
            "cost": round(random.uniform(80, 150), 2)
        }
    ]

def extract_city(request_string, pattern):
    """Extract city from request string using regex pattern."""
    match = re.search(pattern, request_string, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return None

def format_response(response_data):
    """Format the response data for the frontend."""
    logger.info(f"Formatting response data for frontend: {json.dumps(response_data, indent=2)}")
    return response_data

def generate_mock_data(destination):
    """Generate mock data for testing."""
    logger.info(f"Generating mock data for destination: {destination}")
    
    # Mock flight data
    mock_flight = {
        "airline": "MockAir",
        "flight_number": f"MA{random.randint(100, 999)}",
        "departure": "2023-12-01T08:00:00",
        "arrival": "2023-12-01T10:30:00",
        "price": random.randint(200, 800)
    }
    
    # Mock hotel data based on destination
    hotel_data = {
        "paris": {
            "name": "Grand Hotel Paris",
            "address": "123 Champs-Élysées, Paris",
            "price": 350,
            "rating": 4.5
        },
        "london": {
            "name": "The Savoy London",
            "address": "Strand, London WC2R 0EU",
            "price": 450,
            "rating": 4.8
        },
        "new york": {
            "name": "Plaza Hotel",
            "address": "768 5th Ave, New York",
            "price": 550,
            "rating": 4.7
        },
        "tokyo": {
            "name": "Park Hyatt Tokyo",
            "address": "3-7-1-2 Nishi Shinjuku, Tokyo",
            "price": 400,
            "rating": 4.9
        },
        "dubai": {
            "name": "Burj Al Arab",
            "address": "Jumeirah Beach Road, Dubai",
            "price": 850,
            "rating": 5.0
        }
    }
    
    # Default hotel if destination not in our mock database
    mock_hotel = hotel_data.get(destination.lower(), {
        "name": f"Grand Hotel {destination}",
        "address": f"123 Main Street, {destination}",
        "price": random.randint(200, 600),
        "rating": round(random.uniform(3.5, 5.0), 1)
    })
    
    # Mock activities data (3 days)
    mock_activities = []
    for day in range(1, 4):
        day_activities = {
            "day": day,
            "activities": [
                {
                    "name": f"Morning Tour of {destination} Day {day}",
                    "time": "Morning",
                    "location": f"{destination} Downtown",
                    "description": f"Explore the beautiful sites of {destination} with a local guide.",
                    "cost": random.randint(30, 100)
                },
                {
                    "name": f"Lunch at Famous {destination} Restaurant",
                    "time": "Afternoon",
                    "location": f"{destination} Food District",
                    "description": "Enjoy local cuisine at one of the best restaurants in the area.",
                    "cost": random.randint(20, 80)
                },
                {
                    "name": f"Evening Entertainment in {destination}",
                    "time": "Evening",
                    "location": f"{destination} Entertainment District",
                    "description": f"Experience the nightlife of {destination}.",
                    "cost": random.randint(40, 120)
                }
            ]
        }
        mock_activities.append(day_activities)
    
    # Calculate total cost
    total_flight_cost = mock_flight["price"]
    total_hotel_cost = mock_hotel["price"] * 3  # 3 nights
    total_activities_cost = sum(
        activity["cost"] 
        for day in mock_activities 
        for activity in day["activities"]
    )
    total_cost = total_flight_cost + total_hotel_cost + total_activities_cost
    
    mock_data = {
        "destination": destination,
        "origin": "New York",  # Default origin
        "dates": {
            "start": "2023-12-01",
            "end": "2023-12-03"
        },
        "flight": mock_flight,
        "hotel": mock_hotel,
        "activities": mock_activities,
        "costs": {
            "flight": total_flight_cost,
            "hotel": total_hotel_cost,
            "activities": total_activities_cost,
            "total": total_cost
        }
    }
    
    logger.info(f"Generated mock data: {json.dumps(mock_data, indent=2)}")
    return mock_data

def direct_itinerary(request):
    """Generate itinerary based on the request."""
    logger.info(f"Processing itinerary request: {request}")
    
    # Extract destination and origin from the request
    destination_pattern = r"(?:to|in|destination:?|trip to)\s+([A-Za-z\s]+?)(?:,|\.|from|for|\n|$)"
    origin_pattern = r"(?:from|origin:?|departure:?)\s+([A-Za-z\s]+?)(?:,|\.|to|for|\n|$)"
    
    destination = extract_city(request, destination_pattern)
    origin = extract_city(request, origin_pattern)
    
    logger.info(f"Extracted destination: {destination}, origin: {origin}")
    
    if not destination:
        logger.warning("No destination found in the request")
        return {"error": "No destination found in the request"}
    
    if not origin:
        origin = "New York"  # Default origin
        logger.info(f"No origin found, using default: {origin}")
    
    # Default date for demo
    date = "2023-12-01"
    
    # Get flight data using the API
    logger.info(f"Calling flight agent for {origin} to {destination} on {date}")
    flight_data = run_flight_agent(origin, destination, date)
    
    if flight_data:
        logger.info(f"Received flight data: {json.dumps(flight_data, indent=2)}")
        
        # Process the flight data and create a response
        # Here we'd normally get hotel and activities data too
        mock_hotel_data = run_hotel_agent(destination, date)
        mock_activities_data = run_activity_agent(destination, date)
        
        response_data = {
            "destination": destination,
            "origin": origin,
            "dates": {
                "start": date,
                "end": "2023-12-03"  # Just adding a few days for demo
            },
            "flight": flight_data,
            "hotel": mock_hotel_data,
            "activities": mock_activities_data,
            "costs": {
                "flight": flight_data.get("price", 0),
                "hotel": mock_hotel_data.get("price", 0) * 3,  # 3 nights
                "activities": sum(
                    activity["cost"] 
                    for day in mock_activities_data 
                    for activity in day["activities"]
                ) if isinstance(mock_activities_data, list) else 0,
                "total": flight_data.get("price", 0) + 
                         mock_hotel_data.get("price", 0) * 3 +
                         (sum(
                             activity["cost"] 
                             for day in mock_activities_data 
                             for activity in day["activities"]
                         ) if isinstance(mock_activities_data, list) else 0)
            }
        }
        
        logger.info(f"Created response with real flight data: {json.dumps(response_data, indent=2)}")
        return format_response(response_data)
    else:
        logger.warning(f"No real flight data available for {origin} to {destination}, using mock data")
        # If no real data is available, use mock data for demo purposes
        mock_data = generate_mock_data(destination)
        return format_response(mock_data)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Generate a travel itinerary')
    parser.add_argument('--request', type=str, help='Travel request in natural language', 
                        default="Plan a trip to Chicago from New York, starting on 2025-06-15 and ending on 2025-06-18")
    parser.add_argument('--output', type=str, help='Output JSON file path', default="trip_plan.json")
    
    args = parser.parse_args()
    request = args.request
    output_file = args.output
    
    print("\n=== PLANNING TRIP ===")
    print(f"Request: {request}\n")
    
    try:
        # Generate the itinerary
        result = create_itinerary(request)
        
        # Save the result
        with open(output_file, "w") as f:
            json.dump(result, f, indent=2)
            
        print(f"\nPlan saved to {output_file}")
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(f"\nError planning trip: {e}")
        import traceback
        traceback.print_exc() 