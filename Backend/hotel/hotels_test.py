import hotels
import json

if __name__ == "__main__":
    hotel = hotels.get_hotel("NYC")
    hotelId = hotel["hotelId"]
    offer = hotels.get_hotel_offers(hotelId, 1)
    
    filename = "sample.json"
    with open(filename, 'w') as file:
        json.dump(hotel, file, indent=4)
        
    filename = "sample_offer.json"
    with open(filename, 'w') as file:
        json.dump(offer, file, indent=4)