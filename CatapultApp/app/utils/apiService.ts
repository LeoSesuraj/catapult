import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SurveyData } from '../survey/SurveyContext';
import { Itinerary } from '../data/itineraryStorage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

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

/**
 * Convert survey data to an itinerary
 * @param surveyData - The survey data from the survey context
 * @returns The generated itinerary
 */
export const generateItinerary = async (surveyData: SurveyData): Promise<Itinerary> => {
    try {
        // Extract data from survey
        const { destination, departure, startDate, endDate, budget, tripType } = surveyData;

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
        const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        // Generate days
        for (let i = 0; i < diffDays; i++) {
            const currentDate = new Date(startDateObj);
            currentDate.setDate(startDateObj.getDate() + i);
            const formattedDate = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD

            const events = [];

            // Add flight on first day
            if (i === 0 && flight) {
                const departureTime = flight.departure.split('T')[1].substring(0, 5); // HH:MM
                const arrivalTime = flight.arrival.split('T')[1].substring(0, 5); // HH:MM

                events.push({
                    type: 'flight',
                    title: `${flight.airline} ${flight.flight_number} to ${apiResponse.destination}`,
                    time: departureTime,
                    location: `${apiResponse.origin} to ${apiResponse.destination}`,
                    description: `Flight from ${apiResponse.origin} to ${apiResponse.destination}`,
                    details: {
                        airline: flight.airline,
                        flight_number: flight.flight_number,
                        departure: flight.departure,
                        arrival: flight.arrival,
                        price: flight.price
                    },
                    isLocked: true
                });
            }

            // Add hotel on first day
            if (i === 0 && hotel) {
                events.push({
                    type: 'hotel',
                    title: `Check in to ${hotel.name}`,
                    time: '15:00',
                    location: hotel.address,
                    description: `Check in to your hotel: ${hotel.name}`,
                    details: {
                        hotelName: hotel.name,
                        address: hotel.address,
                        price: hotel.price,
                        rating: hotel.rating
                    },
                    isLocked: true
                });
            }

            // Add activities for this day
            const dayActivities = activities.find(day => day.day === i + 1);
            if (dayActivities && dayActivities.activities) {
                // Map activities to events
                dayActivities.activities.forEach(activity => {
                    let mappedType;

                    // Map time strings
                    const timeMappings = {
                        'Morning': '09:00',
                        'Afternoon': '13:00',
                        'Evening': '19:00'
                    };

                    // Determine activity type
                    if (activity.name.toLowerCase().includes('lunch') ||
                        activity.name.toLowerCase().includes('dinner') ||
                        activity.name.toLowerCase().includes('breakfast') ||
                        activity.name.toLowerCase().includes('restaurant')) {
                        mappedType = 'meal';
                    } else if (activity.name.toLowerCase().includes('tour') ||
                        activity.name.toLowerCase().includes('museum') ||
                        activity.name.toLowerCase().includes('visit')) {
                        mappedType = 'attraction';
                    } else {
                        mappedType = 'activity';
                    }

                    events.push({
                        type: mappedType,
                        title: activity.name,
                        time: timeMappings[activity.time] || '12:00',
                        location: activity.location,
                        description: activity.description,
                        details: {
                            cost: activity.cost
                        }
                    });
                });
            }

            // Sort events by time
            events.sort((a, b) => a.time.localeCompare(b.time));

            // Add the day to the itinerary
            itinerary.itinerary.push({
                date: formattedDate,
                events: events
            });
        }

        // Add checkout on the last day
        if (hotel) {
            itinerary.itinerary[diffDays - 1].events.push({
                type: 'hotel',
                title: `Check out from ${hotel.name}`,
                time: '11:00',
                location: hotel.address,
                description: `Check out from your hotel: ${hotel.name}`,
                details: {
                    hotelName: hotel.name,
                    address: hotel.address
                },
                isLocked: true
            });
        }

        // Save the itinerary to AsyncStorage
        await AsyncStorage.setItem('itinerary', JSON.stringify(itinerary));

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