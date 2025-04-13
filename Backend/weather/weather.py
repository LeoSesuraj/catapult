import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv('WEATHER_API_KEY')

def get_weather(city):
    city_url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}"
    response = requests.get(city_url)

    return response.json()

print(get_weather("ORD"))
print(get_weather("chicago"))