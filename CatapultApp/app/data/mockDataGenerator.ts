import { TripData } from './trips';
import { Itinerary } from './itineraryStorage';
import moment from 'moment';


const AIRPORT_CODES: { [key: string]: string } = {
    'New York': 'JFK',
    'Los Angeles': 'LAX',
    'Chicago': 'ORD',
    'Houston': 'IAH',
    'Phoenix': 'PHX',
    'Philadelphia': 'PHL',
    'San Antonio': 'SAT',
    'San Diego': 'SAN',
    'Dallas': 'DFW',
    'San Jose': 'SJC',
    'Austin': 'AUS',
    'Jacksonville': 'JAX',
    'San Francisco': 'SFO',
    'Columbus': 'CMH',
    'Fort Worth': 'DFW',
    'Indianapolis': 'IND',
    'Charlotte': 'CLT',
    'Seattle': 'SEA',
    'Denver': 'DEN',
    'Washington': 'DCA',
    'Boston': 'BOS',
    'Nashville': 'BNA',
    'Las Vegas': 'LAS',
    'Portland': 'PDX',
    'Miami': 'MIA',
    'Atlanta': 'ATL',
};

// Helper function to get closest airport code
function getAirportCode(city: string): string {
    // Remove common words and clean the city name
    const cleanCity = city.toLowerCase()
        .replace(/city|town|village|municipality/g, '')
        .trim()
        .split(',')[0] // Take first part if there's a comma
        .trim();

    // Find exact match first
    for (const [key, code] of Object.entries(AIRPORT_CODES)) {
        if (key.toLowerCase() === cleanCity) {
            return code;
        }
    }

    // Find partial match
    for (const [key, code] of Object.entries(AIRPORT_CODES)) {
        if (cleanCity.includes(key.toLowerCase()) || key.toLowerCase().includes(cleanCity)) {
            return code;
        }
    }

    // Default to a random major airport if no match found
    const majorAirports = ['ATL', 'LAX', 'ORD', 'DFW', 'DEN', 'JFK'];
    return majorAirports[Math.floor(Math.random() * majorAirports.length)];
}

// Generate mock flights based on departure and destination
export function generateMockFlights(departure: string, destination: string, date: string) {
    const departureCode = getAirportCode(departure);
    const destinationCode = getAirportCode(destination);

    const airlines = ['United', 'American', 'Delta', 'Southwest', 'JetBlue'];
    const flightNumbers = ['123', '456', '789', '234', '567'];
    const basePrices = [299, 349, 399, 449, 499];

    return Array.from({ length: 5 }, (_, i) => ({
        id: `f${i + 1}`,
        airline: airlines[i],
        flightNumber: flightNumbers[i],
        departure: {
            airport: departureCode,
            time: moment(date).add(i * 2, 'hours').format('HH:mm'),
            date: moment(date).format('YYYY-MM-DD')
        },
        arrival: {
            airport: destinationCode,
            time: moment(date).add((i * 2) + 3, 'hours').format('HH:mm'),
            date: moment(date).format('YYYY-MM-DD')
        },
        duration: '3h 00m',
        price: `$${basePrices[i]}`,
        stops: i % 2 === 0 ? 0 : 1
    }));
}

// Generate a realistic itinerary based on survey data
export function generateRealisticItinerary(tripData: TripData): Itinerary {
    const startDate = moment(tripData.start_time);
    const endDate = moment(tripData.end_time);
    const duration = endDate.diff(startDate, 'days') + 1;
    const destinationCode = getAirportCode(tripData.location);
    const departureCode = tripData.departure ? getAirportCode(tripData.departure) : 'JFK';

    const itinerary: Itinerary = {
        itinerary: Array.from({ length: duration }, (_, dayIndex) => {
            const currentDate = moment(startDate).add(dayIndex, 'days');
            const events = [];

            // First day - add arrival flight and check-in
            if (dayIndex === 0) {
                events.push({
                    type: 'transport',
                    title: `Flight to ${tripData.location}`,
                    time: '09:00',
                    location: `${departureCode} → ${destinationCode}`,
                    description: `Flight from ${tripData.departure || 'Home'} to ${tripData.location}`,
                    details: {
                        isFlight: true,
                        airline: 'United',
                        flightNumber: 'UA123',
                        departure: currentDate.format('YYYY-MM-DD') + 'T09:00:00',
                        arrival: currentDate.format('YYYY-MM-DD') + 'T12:00:00'
                    },
                    isLocked: true
                });

                events.push({
                    type: 'accommodation',
                    title: 'Hotel Check-in',
                    time: '15:00',
                    location: `${tripData.location} Hotel`,
                    description: 'Check into your hotel and freshen up',
                    details: {
                        hotelName: `${tripData.location} Grand Hotel`,
                        checkIn: currentDate.format('YYYY-MM-DD') + 'T15:00:00'
                    },
                    isLocked: true
                });
            }

            // Last day - add departure flight and check-out
            if (dayIndex === duration - 1) {
                events.push({
                    type: 'accommodation',
                    title: 'Hotel Check-out',
                    time: '11:00',
                    location: `${tripData.location} Hotel`,
                    description: 'Check out from your hotel',
                    details: {
                        hotelName: `${tripData.location} Grand Hotel`,
                        checkOut: currentDate.format('YYYY-MM-DD') + 'T11:00:00'
                    },
                    isLocked: true
                });

                events.push({
                    type: 'transport',
                    title: `Return Flight to ${tripData.departure || 'Home'}`,
                    time: '16:00',
                    location: `${destinationCode} → ${departureCode}`,
                    description: `Return flight to ${tripData.departure || 'Home'}`,
                    details: {
                        isFlight: true,
                        airline: 'United',
                        flightNumber: 'UA456',
                        departure: currentDate.format('YYYY-MM-DD') + 'T16:00:00',
                        arrival: currentDate.format('YYYY-MM-DD') + 'T19:00:00'
                    },
                    isLocked: true
                });
            }

            // Middle days - add standard activities
            if (dayIndex > 0 && dayIndex < duration - 1) {
                events.push({
                    type: 'meal',
                    title: 'Breakfast at Hotel',
                    time: '08:00',
                    location: `${tripData.location} Hotel Restaurant`,
                    description: 'Start your day with a delicious breakfast',
                    details: {},
                    isLocked: false
                });

                events.push({
                    type: 'attraction',
                    title: `Explore ${tripData.location}`,
                    time: '10:00',
                    location: `${tripData.location} Downtown`,
                    description: 'Visit local attractions and landmarks',
                    details: {},
                    isLocked: false
                });

                events.push({
                    type: 'meal',
                    title: 'Local Lunch',
                    time: '13:00',
                    location: 'Local Restaurant',
                    description: 'Experience local cuisine',
                    details: {},
                    isLocked: false
                });

                events.push({
                    type: 'attraction',
                    title: 'Afternoon Activities',
                    time: '15:00',
                    location: `${tripData.location} Attractions`,
                    description: 'Continue exploring the city',
                    details: {},
                    isLocked: false
                });

                events.push({
                    type: 'meal',
                    title: 'Dinner',
                    time: '19:00',
                    location: 'Restaurant',
                    description: 'Enjoy dinner at a local restaurant',
                    details: {},
                    isLocked: false
                });
            }

            return {
                date: currentDate.format('YYYY-MM-DD'),
                events: events
            };
        })
    };

    return itinerary;
} 