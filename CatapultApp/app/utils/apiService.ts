import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SurveyData } from '../survey/SurveyContext';
import { Itinerary } from '../data/itineraryStorage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import moment from 'moment';

// API configuration for different environments
// For Android emulator, use 10.0.2.2 to access host machine
// For iOS simulator, use localhost
// For physical devices and production, use your actual API URL
let API_BASE_URL: string;

if (__DEV__) {
    // Development environment
    // Use the actual IP address from the server logs for all devices
    API_BASE_URL = 'http://172.20.10.6:5000/api';
} else {
    // Production environment - replace with your actual deployed API URL
    API_BASE_URL = 'https://your-api-domain.com/api';
}

// Allow API URL override through app config or environment variables
if (Constants.expoConfig?.extra?.apiUrl) {
    API_BASE_URL = Constants.expoConfig.extra.apiUrl;
}

console.log(`API Service initialized with URL: ${API_BASE_URL}`);

// Export the base URL for other modules
export { API_BASE_URL };

// Update activity timing constants with specific times
const ACTIVITY_TIMES = {
    EARLY_BREAKFAST: '07:30',
    BREAKFAST: '08:30',
    MORNING_1: '09:30',
    MORNING_2: '11:00',
    LUNCH: '13:00',
    AFTERNOON_1: '14:30',
    AFTERNOON_2: '16:00',
    PRE_DINNER: '17:30',
    DINNER: '19:00',
    EVENING: '20:30',
    LATE_EVENING: '22:00'
};

// Update city-specific activity templates with more options
const CITY_ACTIVITIES = {
    'New York': {
        morning: [
            { name: 'Central Park Walking Tour', location: 'Central Park', duration: 2, startTime: '09:30' },
            { name: 'Metropolitan Museum of Art', location: 'Upper East Side', duration: 3, startTime: '10:00' },
            { name: 'Times Square & Midtown Tour', location: 'Midtown Manhattan', duration: 2, startTime: '11:00' },
            { name: 'Wall Street & Financial District', location: 'Downtown Manhattan', duration: 2, startTime: '09:00' },
            { name: '9/11 Memorial & Museum', location: 'World Trade Center', duration: 2.5, startTime: '10:30' },
            { name: 'Brooklyn Bridge Walk', location: 'Brooklyn Bridge', duration: 1.5, startTime: '09:30' }
        ],
        afternoon: [
            { name: 'Empire State Building', location: 'Midtown Manhattan', duration: 2, startTime: '14:30' },
            { name: 'Fifth Avenue Shopping', location: '5th Avenue', duration: 3, startTime: '14:00' },
            { name: 'High Line Walk', location: 'Chelsea', duration: 1.5, startTime: '16:00' },
            { name: 'Chelsea Market & Food Tour', location: 'Chelsea', duration: 2, startTime: '15:00' },
            { name: 'Grand Central Terminal Tour', location: 'Midtown East', duration: 1.5, startTime: '14:30' },
            { name: 'SoHo & Little Italy Walk', location: 'Downtown Manhattan', duration: 2.5, startTime: '15:00' }
        ],
        evening: [
            { name: 'Broadway Show', location: 'Theater District', duration: 3, startTime: '20:00' },
            { name: 'Rooftop Bar Experience', location: 'Manhattan', duration: 2, startTime: '20:30' },
            { name: 'Times Square at Night', location: 'Midtown Manhattan', duration: 1.5, startTime: '21:00' },
            { name: 'Jazz Club in Greenwich Village', location: 'Greenwich Village', duration: 2, startTime: '21:30' },
            { name: 'Harbor Night Cruise', location: 'Manhattan Pier', duration: 2.5, startTime: '20:00' },
            { name: 'Comedy Club Show', location: 'Comedy Cellar', duration: 2, startTime: '21:00' }
        ],
        restaurants: [
            { name: 'Classic NY Steakhouse', location: 'Midtown', type: 'dinner', startTime: '19:00' },
            { name: 'Little Italy Restaurant', location: 'Little Italy', type: 'lunch', startTime: '13:00' },
            { name: 'Chinatown Dim Sum', location: 'Chinatown', type: 'lunch', startTime: '12:30' },
            { name: 'Brooklyn Pizza Tour', location: 'Brooklyn', type: 'lunch', startTime: '13:30' },
            { name: 'Fine Dining Experience', location: 'Upper East Side', type: 'dinner', startTime: '19:30' },
            { name: 'Rooftop Restaurant', location: 'Manhattan', type: 'dinner', startTime: '19:00' }
        ]
    },
    'Paris': {
        morning: [
            { name: 'Louvre Museum Tour', location: '1st Arrondissement', duration: 3, startTime: '09:30' },
            { name: 'Seine River Morning Walk', location: 'Seine River', duration: 1.5, startTime: '09:00' },
            { name: 'Notre-Dame Cathedral Visit', location: 'Île de la Cité', duration: 2, startTime: '10:00' },
            { name: 'Montmartre Art Walk', location: 'Montmartre', duration: 2.5, startTime: '10:30' },
            { name: 'Palace of Versailles Tour', location: 'Versailles', duration: 4, startTime: '09:00' },
            { name: 'Musée d\'Orsay Visit', location: '7th Arrondissement', duration: 2.5, startTime: '10:00' }
        ],
        afternoon: [
            { name: 'Eiffel Tower Visit', location: '7th Arrondissement', duration: 2.5, startTime: '14:00' },
            { name: 'Champs-Élysées Shopping', location: '8th Arrondissement', duration: 3, startTime: '14:30' },
            { name: 'Luxembourg Gardens', location: '6th Arrondissement', duration: 2, startTime: '15:00' },
            { name: 'Le Marais Walking Tour', location: 'Le Marais', duration: 2.5, startTime: '14:30' },
            { name: 'Centre Pompidou Visit', location: '4th Arrondissement', duration: 2, startTime: '15:00' },
            { name: 'Saint-Germain-des-Prés', location: '6th Arrondissement', duration: 2, startTime: '14:00' }
        ],
        evening: [
            { name: 'Seine River Dinner Cruise', location: 'Seine River', duration: 2.5, startTime: '20:00' },
            { name: 'Moulin Rouge Show', location: 'Montmartre', duration: 3, startTime: '21:00' },
            { name: 'Eiffel Tower Light Show', location: '7th Arrondissement', duration: 1, startTime: '21:30' },
            { name: 'Opera Garnier Performance', location: '9th Arrondissement', duration: 3, startTime: '20:00' },
            { name: 'Latin Quarter Night Walk', location: '5th Arrondissement', duration: 2, startTime: '20:30' },
            { name: 'Wine Tasting Experience', location: 'Le Marais', duration: 2, startTime: '19:30' }
        ],
        restaurants: [
            { name: 'Classic French Bistro', location: 'Le Marais', type: 'dinner', startTime: '19:30' },
            { name: 'Michelin Star Restaurant', location: '8th Arrondissement', type: 'dinner', startTime: '19:00' },
            { name: 'Café de Paris', location: 'Champs-Élysées', type: 'lunch', startTime: '13:00' },
            { name: 'Traditional Brasserie', location: 'Saint-Germain', type: 'lunch', startTime: '12:30' },
            { name: 'Rooftop Restaurant', location: 'Montmartre', type: 'dinner', startTime: '20:00' },
            { name: 'Local Café Experience', location: 'Latin Quarter', type: 'lunch', startTime: '13:30' }
        ]
    },
    'London': {
        morning: [
            { name: 'Tower of London Tour', location: 'Tower Hill', duration: 3, startTime: '09:30' },
            { name: 'British Museum Visit', location: 'Bloomsbury', duration: 2.5, startTime: '10:00' },
            { name: 'Westminster Abbey Tour', location: 'Westminster', duration: 2, startTime: '09:00' },
            { name: 'Buckingham Palace Tour', location: 'Westminster', duration: 2.5, startTime: '10:30' },
            { name: 'St. Paul\'s Cathedral', location: 'City of London', duration: 2, startTime: '10:00' },
            { name: 'Borough Market Food Tour', location: 'Southwark', duration: 2, startTime: '10:30' }
        ],
        afternoon: [
            { name: 'London Eye Experience', location: 'South Bank', duration: 2, startTime: '14:00' },
            { name: 'Oxford Street Shopping', location: 'West End', duration: 3, startTime: '14:30' },
            { name: 'Tate Modern Gallery', location: 'Bankside', duration: 2.5, startTime: '15:00' },
            { name: 'Hyde Park Walk', location: 'Central London', duration: 2, startTime: '14:30' },
            { name: 'Notting Hill Tour', location: 'Notting Hill', duration: 2, startTime: '15:30' },
            { name: 'Covent Garden Visit', location: 'West End', duration: 2, startTime: '14:00' }
        ],
        evening: [
            { name: 'West End Show', location: 'Theatre District', duration: 2.5, startTime: '19:30' },
            { name: 'Thames River Cruise', location: 'River Thames', duration: 2, startTime: '20:00' },
            { name: 'London Pub Experience', location: 'Soho', duration: 2, startTime: '20:30' },
            { name: 'Ghost Walking Tour', location: 'City of London', duration: 2, startTime: '21:00' },
            { name: 'Sky Garden Visit', location: 'City of London', duration: 1.5, startTime: '20:00' },
            { name: 'Jazz Club Night', location: 'Shoreditch', duration: 2.5, startTime: '21:30' }
        ],
        restaurants: [
            { name: 'Traditional English Pub', location: 'Covent Garden', type: 'dinner', startTime: '19:00' },
            { name: 'Fine Dining Restaurant', location: 'Mayfair', type: 'dinner', startTime: '19:30' },
            { name: 'Fish & Chips Experience', location: 'Notting Hill', type: 'lunch', startTime: '13:00' },
            { name: 'Afternoon Tea', location: 'The Ritz', type: 'afternoon', startTime: '16:00' },
            { name: 'Indian Restaurant', location: 'Brick Lane', type: 'dinner', startTime: '20:00' },
            { name: 'Market Food Experience', location: 'Borough Market', type: 'lunch', startTime: '12:30' }
        ]
    }
};

// Helper function to get Google auth token
const getGoogleAuthToken = async (): Promise<string | null> => {
    try {
        const token = await AsyncStorage.getItem('google_auth_token');
        return token;
    } catch (error) {
        console.error('Error getting Google auth token:', error);
        return null;
    }
};

// Helper function to generate booking links with Google account
const generateBookingLinks = async (
    departure: string,
    destination: string,
    airline: string,
    flightNumber: string,
    hotelName: string
) => {
    const authToken = await getGoogleAuthToken();

    // Base URLs for booking
    const baseFlightUrl = 'https://www.google.com/flights';
    const baseHotelUrl = 'https://www.google.com/travel/hotels';

    // If user is authenticated, add their Google account
    const googleAccountParam = authToken ? `&authuser=${authToken}` : '';

    const flightUrl = `${baseFlightUrl}?q=${departure}+to+${destination}+${airline}+${flightNumber}${googleAccountParam}`;
    const hotelUrl = `${baseHotelUrl}/${encodeURIComponent(destination)}/${encodeURIComponent(hotelName)}${googleAccountParam}`;

    return {
        flightUrl,
        hotelUrl
    };
};

// Helper function to get city-specific activities with proper time handling
const getCityActivities = (city: string, timeOfDay: 'morning' | 'afternoon' | 'evening' | 'restaurants'): any => {
    const cityData = CITY_ACTIVITIES[city] || {
        morning: [
            { name: `${city} Morning Tour`, location: `${city} Downtown`, duration: 2, startTime: '09:30' },
            { name: `${city} Cultural Visit`, location: `${city} Center`, duration: 2.5, startTime: '10:00' }
        ],
        afternoon: [
            { name: `Explore ${city}`, location: `${city} Attractions`, duration: 2, startTime: '14:30' },
            { name: 'Local Shopping', location: 'Shopping District', duration: 2, startTime: '15:00' }
        ],
        evening: [
            { name: 'Local Dinner Experience', location: 'Restaurant District', duration: 2, startTime: '19:00' },
            { name: `${city} Night Tour`, location: 'City Center', duration: 2, startTime: '20:30' }
        ],
        restaurants: [
            { name: 'Local Restaurant', location: 'City Center', type: 'lunch', startTime: '13:00' },
            { name: 'Fine Dining', location: 'Downtown', type: 'dinner', startTime: '19:00' }
        ]
    };

    return cityData[timeOfDay];
};

// Update the generateDailySchedule function to ensure all times use clock format
const generateDailySchedule = (
    city: string,
    date: string,
    isFirstDay: boolean,
    isLastDay: boolean,
    flightArrival?: string,
    flightDeparture?: string
): any[] => {
    const events = [];

    // Helper to create a random time between two times
    const randomTimeBetween = (start: string, end: string): string => {
        const startHour = parseInt(start.split(':')[0]);
        const startMin = parseInt(start.split(':')[1]);
        const endHour = parseInt(end.split(':')[0]);
        const endMin = parseInt(end.split(':')[1]);

        const totalStartMins = startHour * 60 + startMin;
        const totalEndMins = endHour * 60 + endMin;

        if (totalEndMins <= totalStartMins) return start;

        const randomMins = totalStartMins + Math.floor(Math.random() * (totalEndMins - totalStartMins));
        const hour = Math.floor(randomMins / 60);
        const mins = randomMins % 60;

        return `${hour.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    if (isFirstDay) {
        const arrivalTime = moment(flightArrival).format('HH:mm');
        const arrivalHour = parseInt(arrivalTime.split(':')[0]);

        if (arrivalHour < 12) {
            // Morning arrival - add afternoon and evening activities
            // Add hotel check-in
            events.push({
                type: 'accommodation',
                title: 'Hotel Check-in',
                time: '15:00',
                location: 'Hotel Reception',
                description: 'Check in to your hotel and freshen up',
                details: { type: 'check-in', duration: 0.5 },
                isLocked: false
            });

            // Add an unpacking/freshen up activity
            events.push({
                type: 'activity',
                title: 'Freshen Up & Unpack',
                time: '15:30',
                location: 'Your Hotel Room',
                description: 'Take some time to unpack and relax after your arrival',
                details: { duration: 1, type: 'personal' },
                isLocked: false
            });

            // Add a short orientation walk
            events.push({
                type: 'activity',
                title: `Quick ${city} Orientation Walk`,
                time: '16:45',
                location: 'Around Hotel Area',
                description: 'Get familiar with the immediate surroundings of your hotel',
                details: { duration: 1, type: 'orientation' },
                isLocked: false
            });

            const restaurants = getCityActivities(city, 'restaurants');
            const dinner = restaurants.find(r => r.type === 'dinner');
            if (dinner) {
                events.push({
                    type: 'meal',
                    title: dinner.name,
                    time: dinner.startTime,
                    location: dinner.location,
                    description: `Dinner at ${dinner.name}`,
                    details: { type: 'dinner', duration: 1.5 },
                    isLocked: false
                });
            }

            const eveningActivities = getCityActivities(city, 'evening');
            const selectedEvening = eveningActivities[Math.floor(Math.random() * eveningActivities.length)];
            events.push({
                type: 'activity',
                title: selectedEvening.name,
                time: selectedEvening.startTime,
                location: selectedEvening.location,
                description: `Experience ${selectedEvening.name}`,
                details: { duration: selectedEvening.duration, type: 'entertainment' },
                isLocked: false
            });
        } else if (arrivalHour < 16) {
            // Afternoon arrival - add evening activities
            // Add hotel check-in
            const checkInTime = randomTimeBetween(arrivalTime, '17:00');
            const laterTime = moment(checkInTime, 'HH:mm').add(30, 'minutes').format('HH:mm');

            events.push({
                type: 'accommodation',
                title: 'Hotel Check-in',
                time: checkInTime,
                location: 'Hotel Reception',
                description: 'Check in to your hotel and freshen up',
                details: { type: 'check-in', duration: 0.5 },
                isLocked: false
            });

            // Add an unpacking/freshen up activity
            events.push({
                type: 'activity',
                title: 'Freshen Up & Unpack',
                time: laterTime,
                location: 'Your Hotel Room',
                description: 'Take some time to unpack and relax after your arrival',
                details: { duration: 1, type: 'personal' },
                isLocked: false
            });

            const restaurants = getCityActivities(city, 'restaurants');
            const dinner = restaurants.find(r => r.type === 'dinner');
            if (dinner) {
                events.push({
                    type: 'meal',
                    title: dinner.name,
                    time: dinner.startTime,
                    location: dinner.location,
                    description: `Dinner at ${dinner.name}`,
                    details: { type: 'dinner', duration: 1.5 },
                    isLocked: false
                });
            }

            const eveningActivities = getCityActivities(city, 'evening');
            const selectedEvening = eveningActivities[Math.floor(Math.random() * eveningActivities.length)];
            events.push({
                type: 'activity',
                title: selectedEvening.name,
                time: selectedEvening.startTime,
                location: selectedEvening.location,
                description: `Experience ${selectedEvening.name}`,
                details: { duration: selectedEvening.duration, type: 'entertainment' },
                isLocked: false
            });
        } else {
            // Evening arrival - just add hotel check-in and a light activity
            const checkInTime = randomTimeBetween(arrivalTime, '22:00');

            events.push({
                type: 'accommodation',
                title: 'Hotel Check-in',
                time: checkInTime,
                location: 'Hotel Reception',
                description: 'Check in to your hotel after arrival',
                details: { type: 'check-in', duration: 0.5 },
                isLocked: false
            });

            // Add a light late evening activity if not too late
            if (parseInt(checkInTime.split(':')[0]) < 21) {
                events.push({
                    type: 'meal',
                    title: 'Light Late Dinner',
                    time: '21:30',
                    location: 'Hotel Restaurant or Nearby',
                    description: 'Grab a light meal before retiring for the night',
                    details: { type: 'dinner', duration: 1 },
                    isLocked: false
                });
            }
        }
    } else if (isLastDay) {
        const departureTime = moment(flightDeparture).format('HH:mm');
        const departureHour = parseInt(departureTime.split(':')[0]);

        // Add hotel checkout
        events.push({
            type: 'accommodation',
            title: 'Hotel Check-out',
            time: '11:00',
            location: 'Hotel Reception',
            description: 'Check out of your hotel and store luggage if needed',
            details: { type: 'check-out', duration: 0.5 },
            isLocked: false
        });

        if (departureHour > 19) {
            // Full day available
            events.push({
                type: 'meal',
                title: 'Breakfast at Hotel',
                time: '08:30',
                location: 'Hotel Restaurant',
                description: 'Start your day with a delicious breakfast',
                details: { type: 'breakfast', duration: 1 },
                isLocked: false
            });

            const morningActivities = getCityActivities(city, 'morning');
            const selectedMorning = morningActivities[Math.floor(Math.random() * morningActivities.length)];
            events.push({
                type: 'activity',
                title: selectedMorning.name,
                time: selectedMorning.startTime,
                location: selectedMorning.location,
                description: `Visit ${selectedMorning.name}`,
                details: { duration: selectedMorning.duration, type: 'cultural' },
                isLocked: false
            });

            const restaurants = getCityActivities(city, 'restaurants');
            const lunch = restaurants.find(r => r.type === 'lunch');
            if (lunch) {
                events.push({
                    type: 'meal',
                    title: lunch.name,
                    time: lunch.startTime,
                    location: lunch.location,
                    description: `Lunch at ${lunch.name}`,
                    details: { type: 'lunch', duration: 1.5 },
                    isLocked: false
                });
            }

            const afternoonActivities = getCityActivities(city, 'afternoon');
            const selectedAfternoon = afternoonActivities[Math.floor(Math.random() * afternoonActivities.length)];
            events.push({
                type: 'activity',
                title: selectedAfternoon.name,
                time: selectedAfternoon.startTime,
                location: selectedAfternoon.location,
                description: `Experience ${selectedAfternoon.name}`,
                details: { duration: selectedAfternoon.duration, type: 'sightseeing' },
                isLocked: false
            });

            // Add a souvenir shopping opportunity
            events.push({
                type: 'activity',
                title: 'Last-Minute Souvenir Shopping',
                time: '16:30',
                location: `${city} Shopping District`,
                description: 'Grab some last-minute souvenirs before heading home',
                details: { duration: 1, type: 'shopping' },
                isLocked: false
            });

            // Add pre-flight meal
            events.push({
                type: 'meal',
                title: 'Pre-Flight Dinner',
                time: '18:00',
                location: 'Near Airport',
                description: 'Have a relaxed dinner before your flight',
                details: { type: 'dinner', duration: 1.5 },
                isLocked: false
            });
        } else if (departureHour > 14) {
            // Morning only
            events.push({
                type: 'meal',
                title: 'Breakfast at Hotel',
                time: '08:30',
                location: 'Hotel Restaurant',
                description: 'Start your day with a delicious breakfast',
                details: { type: 'breakfast', duration: 1 },
                isLocked: false
            });

            const morningActivities = getCityActivities(city, 'morning');
            const selectedMorning = morningActivities[Math.floor(Math.random() * morningActivities.length)];
            events.push({
                type: 'activity',
                title: selectedMorning.name,
                time: selectedMorning.startTime,
                location: selectedMorning.location,
                description: `Visit ${selectedMorning.name}`,
                details: { duration: selectedMorning.duration, type: 'cultural' },
                isLocked: false
            });

            // Add a quick souvenir shopping trip
            events.push({
                type: 'activity',
                title: 'Quick Souvenir Shopping',
                time: '11:30',
                location: `${city} Shopping Area`,
                description: 'Pick up some souvenirs before departure',
                details: { duration: 1, type: 'shopping' },
                isLocked: false
            });

            // Add pre-flight lunch
            events.push({
                type: 'meal',
                title: 'Pre-Flight Lunch',
                time: '12:30',
                location: 'Near Airport',
                description: 'Enjoy a final meal before your flight',
                details: { type: 'lunch', duration: 1 },
                isLocked: false
            });
        } else {
            // Very early departure - just add breakfast
            const earlyBreakfastTime = moment(departureTime, 'HH:mm').subtract(3, 'hours').format('HH:mm');

            events.push({
                type: 'meal',
                title: 'Early Breakfast',
                time: earlyBreakfastTime,
                location: 'Hotel Restaurant',
                description: 'Quick breakfast before your early departure',
                details: { type: 'breakfast', duration: 0.5 },
                isLocked: false
            });

            // Add preparation time
            const prepTime = moment(departureTime, 'HH:mm').subtract(2, 'hours').format('HH:mm');

            events.push({
                type: 'activity',
                title: 'Prepare for Departure',
                time: prepTime,
                location: 'Your Hotel Room',
                description: 'Final packing and preparation for your flight',
                details: { duration: 1, type: 'personal' },
                isLocked: false
            });
        }
    } else {
        // Full day schedule
        // Hotel wakeup
        events.push({
            type: 'accommodation',
            title: 'Wake Up at Hotel',
            time: '07:00',
            location: 'Your Hotel Room',
            description: 'Start your day refreshed',
            details: { type: 'accommodation', duration: 0.5 },
            isLocked: false
        });

        events.push({
            type: 'meal',
            title: 'Breakfast at Hotel',
            time: '08:30',
            location: 'Hotel Restaurant',
            description: 'Start your day with a delicious breakfast',
            details: { type: 'breakfast', duration: 1 },
            isLocked: false
        });

        // Two morning activities
        const morningActivities = getCityActivities(city, 'morning');
        const selectedMorning1 = morningActivities[Math.floor(Math.random() * morningActivities.length)];
        events.push({
            type: 'activity',
            title: selectedMorning1.name,
            time: selectedMorning1.startTime,
            location: selectedMorning1.location,
            description: `Visit ${selectedMorning1.name}`,
            details: { duration: selectedMorning1.duration, type: 'cultural' },
            isLocked: false
        });

        // Add a coffee break
        const coffeeTime = randomTimeBetween('10:30', '11:15');
        events.push({
            type: 'break',
            title: 'Coffee Break',
            time: coffeeTime,
            location: 'Local Café',
            description: 'Relax with a coffee and soak in the local atmosphere',
            details: { type: 'break', duration: 0.5 },
            isLocked: false
        });

        // Filter out the first activity to avoid duplicates
        const remainingMorning = morningActivities.filter(a => a.name !== selectedMorning1.name);
        if (remainingMorning.length > 0) {
            const selectedMorning2 = remainingMorning[Math.floor(Math.random() * remainingMorning.length)];
            events.push({
                type: 'activity',
                title: selectedMorning2.name,
                time: '11:30',
                location: selectedMorning2.location,
                description: `Explore ${selectedMorning2.name}`,
                details: { duration: selectedMorning2.duration, type: 'cultural' },
                isLocked: false
            });
        }

        // Lunch at a local restaurant
        const restaurants = getCityActivities(city, 'restaurants');
        const lunch = restaurants.find(r => r.type === 'lunch');
        if (lunch) {
            events.push({
                type: 'meal',
                title: lunch.name,
                time: lunch.startTime,
                location: lunch.location,
                description: `Lunch at ${lunch.name}`,
                details: { type: 'lunch', duration: 1.5 },
                isLocked: false
            });
        }

        // Add a rest period
        events.push({
            type: 'break',
            title: 'Rest & Recharge',
            time: '14:30',
            location: 'Your Hotel or a Local Park',
            description: 'Take some time to rest and recharge before afternoon activities',
            details: { type: 'break', duration: 0.5 },
            isLocked: false
        });

        // Two afternoon activities
        const afternoonActivities = getCityActivities(city, 'afternoon');
        const selectedAfternoon1 = afternoonActivities[Math.floor(Math.random() * afternoonActivities.length)];
        events.push({
            type: 'activity',
            title: selectedAfternoon1.name,
            time: '15:15',
            location: selectedAfternoon1.location,
            description: `Visit ${selectedAfternoon1.name}`,
            details: { duration: selectedAfternoon1.duration, type: 'sightseeing' },
            isLocked: false
        });

        const remainingAfternoon = afternoonActivities.filter(a => a.name !== selectedAfternoon1.name);
        if (remainingAfternoon.length > 0) {
            const selectedAfternoon2 = remainingAfternoon[Math.floor(Math.random() * remainingAfternoon.length)];
            events.push({
                type: 'activity',
                title: selectedAfternoon2.name,
                time: '17:00',
                location: selectedAfternoon2.location,
                description: `Experience ${selectedAfternoon2.name}`,
                details: { duration: selectedAfternoon2.duration, type: 'sightseeing' },
                isLocked: false
            });
        }

        // Pre-dinner drink or relaxation
        events.push({
            type: 'break',
            title: 'Pre-Dinner Aperitif',
            time: '18:30',
            location: 'Local Bar or Café',
            description: 'Enjoy a pre-dinner drink and relax',
            details: { type: 'social', duration: 0.75 },
            isLocked: false
        });

        // Dinner at a local restaurant
        const dinner = restaurants.find(r => r.type === 'dinner');
        if (dinner) {
            events.push({
                type: 'meal',
                title: dinner.name,
                time: dinner.startTime,
                location: dinner.location,
                description: `Dinner at ${dinner.name}`,
                details: { type: 'dinner', duration: 1.5 },
                isLocked: false
            });
        }

        // Evening activity
        const eveningActivities = getCityActivities(city, 'evening');
        const selectedEvening = eveningActivities[Math.floor(Math.random() * eveningActivities.length)];
        events.push({
            type: 'activity',
            title: selectedEvening.name,
            time: selectedEvening.startTime,
            location: selectedEvening.location,
            description: `Experience ${selectedEvening.name}`,
            details: { duration: selectedEvening.duration, type: 'entertainment' },
            isLocked: false
        });

        // Late night hotel return
        events.push({
            type: 'accommodation',
            title: 'Return to Hotel',
            time: '23:00',
            location: 'Your Hotel',
            description: 'Return to your hotel for a good night\'s rest',
            details: { type: 'accommodation', duration: 0.25 },
            isLocked: false
        });
    }

    return events;
};

/**
 * Convert survey data to an itinerary
 * @param surveyData - The survey data from the survey context
 * @returns The generated itinerary
 */
export const generateItinerary = async (surveyData: SurveyData): Promise<Itinerary> => {
    try {
        // Extract data from survey
        const { destination, departure, startDate, endDate, budget, tripType } = surveyData;

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) {
            throw new Error('End date cannot be before start date');
        }

        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        // Map interests based on trip type
        let interests: string[] = [];
        if (tripType === 'adventure') {
            interests = ['Outdoor activities', 'Adventure', 'Nature'];
        } else if (tripType === 'relax') {
            interests = ['Relaxation', 'Spa', 'Beach'];
        } else if (tripType === 'culture') {
            interests = ['Museums', 'History', 'Art'];
        } else if (tripType === 'food') {
            interests = ['Food', 'Restaurants', 'Culinary'];
        }

        // Create request payload
        const payload = {
            destination,
            origin: departure,
            startDate,
            endDate,
            budget,
            interests
        };

        console.log('Sending itinerary generation request:', payload);

        // Make the API call to generate itinerary
        const response = await axios.post(`${API_BASE_URL}/generate-itinerary`, payload);

        // Convert the response to the Itinerary format expected by the frontend
        const apiResponse = response.data;

        // Validate API response
        if (!apiResponse.flight || !apiResponse.hotel) {
            throw new Error('Invalid API response: Missing flight or hotel information');
        }

        // Create the itinerary structure expected by the app
        const itinerary: Itinerary = {
            itinerary: []
        };

        // Process flight data
        const flight = apiResponse.flight;
        const hotel = apiResponse.hotel;
        const activities = apiResponse.activities;

        // Create days array from start to end date
        const startDateObj = new Date(apiResponse.dates.start);
        const endDateObj = new Date(apiResponse.dates.end);
        const tripDiffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime());
        const tripDiffDays = Math.ceil(tripDiffTime / (1000 * 60 * 60 * 24)) + 1;

        // Generate days
        for (let i = 0; i < tripDiffDays; i++) {
            const currentDate = new Date(startDateObj);
            currentDate.setDate(startDateObj.getDate() + i);
            const formattedDate = currentDate.toISOString().split('T')[0];

            const events = [];

            // Generate booking links
            const bookingLinks = await generateBookingLinks(
                departure,
                destination,
                flight.airline,
                flight.flight_number,
                hotel.name
            );

            // First day - add departure flight and hotel check-in
            if (i === 0) {
                if (!flight.departure || !flight.arrival) {
                    throw new Error('Invalid flight data: Missing departure or arrival times');
                }

                const departureTime = flight.departure.split('T')[1].substring(0, 5);
                const arrivalTime = flight.arrival.split('T')[1].substring(0, 5);

                events.push({
                    type: 'transport',
                    title: `${flight.airline} ${flight.flight_number} to ${destination}`,
                    time: departureTime,
                    location: `${departure} → ${destination}`,
                    description: `Flight from ${departure} to ${destination}`,
                    details: {
                        isFlight: true,
                        airline: flight.airline,
                        flightNumber: flight.flight_number,
                        departure: flight.departure,
                        arrival: flight.arrival,
                        price: flight.price,
                        bookingLink: bookingLinks.flightUrl
                    },
                    isLocked: true
                });

                // Add hotel check-in only here, and not in the generateDailySchedule for first day
                events.push({
                    type: 'accommodation',
                    title: 'Hotel Check-in',
                    time: '15:00',
                    location: hotel.name,
                    description: `Check in to ${hotel.name}`,
                    details: {
                        hotelName: hotel.name,
                        address: hotel.address,
                        checkIn: `${formattedDate}T15:00:00`,
                        price: hotel.price,
                        bookingLink: bookingLinks.hotelUrl,
                        rating: hotel.rating || null,
                        amenities: hotel.amenities || []
                    },
                    isLocked: true
                });

                // Add activities based on arrival time, but exclude hotel check-in
                const arrivalActivities = generateDailySchedule(
                    destination,
                    formattedDate,
                    true,
                    false,
                    flight.arrival
                ).filter(event => event.type !== 'accommodation' || !event.title.includes('Check-in'));

                events.push(...arrivalActivities);
            }
            // Middle days - add activities but avoid duplicating hotel stays
            else if (i < tripDiffDays - 1) {
                // Generate full day schedule without hotel entries that will be duplicated
                const dailyActivities = generateDailySchedule(
                    destination,
                    formattedDate,
                    false,
                    false
                );

                // Keep one wake-up event but filter out duplicate hotel returns
                let hasWakeupEvent = false;

                const filteredActivities = dailyActivities.filter(event => {
                    // Remove duplicate hotel return events
                    if (event.title === 'Return to Hotel') {
                        return false;
                    }

                    // Keep only one wakeup event
                    if (event.title.includes('Wake Up at')) {
                        if (hasWakeupEvent) {
                            return false;
                        }
                        hasWakeupEvent = true;

                        // Update the hotel details while we're at it
                        event.location = hotel.name;
                        event.description = `Start your day at ${hotel.name}`;
                        event.details = {
                            ...event.details,
                            hotelName: hotel.name,
                            address: hotel.address,
                            price: hotel.price,
                            bookingLink: bookingLinks.hotelUrl,
                            rating: hotel.rating || null,
                            amenities: hotel.amenities || []
                        };

                        return true;
                    }

                    return true;
                });

                events.push(...filteredActivities);
            }
            // Last day - add hotel check-out and return flight
            else {
                // Add hotel checkout only here, not in the daily schedule
                events.push({
                    type: 'accommodation',
                    title: 'Hotel Check-out',
                    time: '11:00',
                    location: hotel.name,
                    description: `Check out from ${hotel.name}`,
                    details: {
                        hotelName: hotel.name,
                        checkOut: `${formattedDate}T11:00:00`,
                        bookingLink: bookingLinks.hotelUrl
                    },
                    isLocked: true
                });

                // Add return flight
                const returnFlight = {
                    airline: flight.airline,
                    flight_number: `${flight.flight_number}R`,
                    departure: `${formattedDate}T16:00:00`,
                    arrival: `${formattedDate}T19:00:00`,
                    price: flight.price
                };

                // Generate return flight booking link
                const returnBookingLinks = await generateBookingLinks(
                    destination,
                    departure,
                    returnFlight.airline,
                    returnFlight.flight_number,
                    ''
                );

                events.push({
                    type: 'transport',
                    title: `${returnFlight.airline} ${returnFlight.flight_number} to ${departure}`,
                    time: '16:00',
                    location: `${destination} → ${departure}`,
                    description: `Return flight from ${destination} to ${departure}`,
                    details: {
                        isFlight: true,
                        airline: returnFlight.airline,
                        flightNumber: returnFlight.flight_number,
                        departure: returnFlight.departure,
                        arrival: returnFlight.arrival,
                        price: returnFlight.price,
                        bookingLink: returnBookingLinks.flightUrl
                    },
                    isLocked: true
                });

                // Add activities based on departure time, but filter out hotel checkout duplication
                const departureActivities = generateDailySchedule(
                    destination,
                    formattedDate,
                    false,
                    true,
                    null,
                    returnFlight.departure
                ).filter(event => event.type !== 'accommodation' || !event.title.includes('Check-out'));

                events.push(...departureActivities);
            }

            // Sort events by time
            events.sort((a, b) => {
                const timeA = moment(a.time, 'HH:mm');
                const timeB = moment(b.time, 'HH:mm');
                return timeA.isBefore(timeB) ? -1 : 1;
            });

            itinerary.itinerary.push({
                date: formattedDate,
                events: events
            });
        }

        return itinerary;

    } catch (error) {
        console.error('Error generating itinerary:', error);
        throw error;
    }
};

/**
 * Check the health of the API
 * @returns True if API is healthy, false otherwise
 */
export const checkApiHealth = async (): Promise<boolean> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/health`);
        return response.data.status === 'healthy';
    } catch (error) {
        console.error('API health check failed:', error);
        return false;
    }
}; 