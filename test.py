from amadeus import Client, ResponseError
import json

amadeus = Client(client_id='4DOHUkYZtyPPu4FrRG8cmzXqrnhwwNby', client_secret='yG0IHsgf3eRA0J0d')

def get_flights(origin, destination, date):
    try:
        response = amadeus.shopping.flight_offers_search.get(
            originLocationCode=origin,
            destinationLocationCode=destination,
            departureDate=date,
            adults=1
        )
        return response.data
    except ResponseError as e:
        print(e)

data = get_flights("NYC", "MAD", "2025-11-01")
filename = "test.json"

with open(filename, 'w') as file:
    json.dump(data, file, indent=4)
