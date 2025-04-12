from amadeus import Client, ResponseError
import json

amadeus = Client(client_id='4DOHUkYZtyPPu4FrRG8cmzXqrnhwwNby', client_secret='yG0IHsgf3eRA0J0d')

# agent finds hotels in a city

def get_hotels_by_city(cityCode):
    try:
        response = amadeus.reference_data.locations.hotels.by_city.get(cityCode=cityCode)
        return response.data
    except ResponseError as e:
        print(e)

# user picks one of those hotels

def get_hotelId(hotelsData, hotelName):
    with open(hotelsData) as data:
        hotels = json.load(data)
    
    for hotel in hotels:
        if hotel["name"] == hotelName: 
            return hotel["hotelId"]
    
    print("Couldn't find this hotel")

# agent finds available offers by using the selected hotelId

def get_hotel_offers(hotelId, adults):
    try:
        response = amadeus.shopping.hotel_offers_search.get(hotelIds=hotelId, adults=adults)
        return response.data
    except ResponseError as e:
        print(e)        

# agent uses selected offer (get offedId) to book a hotel

# def book_hotel(offerId):
#     try:
#         response = amadeus.booking.hotel_bookings.post(
#                 offerId,
#                 guests = [{
#                     'name': {
#                         'title': 'MR',
#                         'firstName': 'John',
#                         'lastName': 'Doe'
#                     },
#                     'contact': {
#                         'phone': '+33679278416',
#                         'email': 'john.doe@example.com'
#                     }
#                 }],
#                 payments = [{
#                     'method': 'creditCard',
#                     'card': {
#                         'vendorCode': 'VI',
#                         'cardNumber': '4111111111111111',
#                         'expiryDate': '2023-12'
#                     }
#                 }]
#         )
#         return response.data
#     except ResponseError as e:
#         print(e)

# data = book_hotel("J2CS92VSKW")

# filename = "booking.json"
# with open(filename, 'w') as file:
#     json.dump(data, file, indent=4)