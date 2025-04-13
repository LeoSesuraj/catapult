from amadeus import Client, ResponseError
import json

amadeus = Client(client_id='4DOHUkYZtyPPu4FrRG8cmzXqrnhwwNby', client_secret='yG0IHsgf3eRA0J0d')

def get_hotel(cityCode):
    try:
        response = amadeus.reference_data.locations.hotels.by_city.get(cityCode=cityCode)
        hotels = response.data
        
        # filename = "hotel.json"
        # with open(filename, 'w') as file:
        #     json.dump(hotels, file, indent=4)
        
        # find the first hotel with availability
        
        for hotel in hotels:
            hotelId = hotel["hotelId"]
            canBook = get_hotel_offers(hotelId)
            
            if canBook:
                return hotel
        
        print("Not found")
    except ResponseError as e:
        print(e)

# finds available offers by using the selected hotelId

def get_hotel_offers(hotelId, adults=1):
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
