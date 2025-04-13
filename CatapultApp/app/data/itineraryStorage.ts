import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import moment from 'moment';

// Define types for itinerary data structure
export interface ItineraryEvent {
    type: string;
    title: string;
    time: string;
    location: string;
    description: string;
    details: any;
}

export interface ItineraryDay {
    date: string;
    events: ItineraryEvent[];
}

export interface Itinerary {
    itinerary: ItineraryDay[];
}

// Store itinerary data in AsyncStorage
export const storeItinerary = async (itineraryData: Itinerary): Promise<void> => {
    try {
        const jsonValue = JSON.stringify(itineraryData);
        await AsyncStorage.setItem('itinerary', jsonValue);
        console.log('Itinerary stored successfully');
    } catch (error) {
        console.error('Error storing itinerary:', error);
        throw error;
    }
};

// Retrieve itinerary data from AsyncStorage
export const getItinerary = async (): Promise<Itinerary | null> => {
    try {
        const jsonValue = await AsyncStorage.getItem('itinerary');
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
        console.error('Error retrieving itinerary:', error);
        return null;
    }
};

// Generate an itinerary using OpenAI
export const generateGptItinerary = async (
    startDate: string,
    endDate: string,
    destination: string,
    budget: number,
    budgetTier: string,
    tripType: string,
    apiKey: string
): Promise<Itinerary> => {
    try {
        // Calculate the number of days for the trip
        const start = moment(startDate);
        const end = moment(endDate);
        const duration = end.diff(start, 'days') + 1;

        // Create prompt for the GPT API
        const prompt = `Generate a detailed travel itinerary for a ${duration}-day trip to ${destination}. 
Budget tier: ${budgetTier} (approximate budget: $${budget})
Trip type: ${tripType}
Dates: From ${startDate} to ${endDate}

Create a JSON response with the exact following structure (this is very important):
{
  "itinerary": [
    {
      "date": "YYYY-MM-DD",
      "events": [
        {
          "type": "flight|hotel|meal|activity|rest|transport",
          "title": "Short descriptive title",
          "time": "HH:MM",
          "location": "Specific location name",
          "description": "Detailed description",
          "details": {
            // Additional details specific to the event type
          }
        }
      ]
    }
  ]
}

Include a balanced mix of activities, meals, transportation, and rest periods appropriate for the destination, budget tier, and duration.
All itinerary dates should be within the specified trip dates.`;

        // Call OpenAI API
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo-1106',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 2500,
                response_format: { type: 'json_object' }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );

        // Extract and parse the response
        const content = response.data.choices[0].message.content;
        let parsedItinerary: Itinerary;

        try {
            parsedItinerary = JSON.parse(content);

            // Make sure the structure is correct
            if (!parsedItinerary.itinerary) {
                throw new Error('Invalid itinerary structure');
            }

            // Format dates and add any missing fields
            parsedItinerary.itinerary = parsedItinerary.itinerary.map((day, dayIndex) => {
                return {
                    date: day.date,
                    events: day.events.map((event, eventIndex) => {
                        // Map the raw event type to a UI-compatible type
                        let mappedType = event.type || 'attraction';

                        // Convert specific types to UI-compatible types
                        switch (mappedType) {
                            case 'flight':
                                mappedType = 'transport';
                                break;
                            case 'hotel':
                                mappedType = 'accommodation';
                                break;
                            case 'activity':
                                mappedType = 'attraction';
                                break;
                            case 'rest':
                                mappedType = 'free-time';
                                break;
                        }

                        return {
                            type: mappedType,
                            title: event.title || 'Untitled Event',
                            time: event.time || '00:00',
                            location: event.location || destination,
                            description: event.description || '',
                            details: event.details || {}
                        };
                    })
                };
            });

            return parsedItinerary;
        } catch (error) {
            console.error('Error parsing GPT response:', error);
            // Fall back to the sample itinerary if there was an error
            return generateSampleItinerary(startDate, endDate, destination);
        }
    } catch (error) {
        console.error('Error generating GPT itinerary:', error);
        // Fall back to the sample itinerary if there was an API error
        return generateSampleItinerary(startDate, endDate, destination);
    }
};

// Generate a sample itinerary (for testing/development)
export const generateSampleItinerary = (
    startDate: string,
    endDate: string,
    destination: string
): Itinerary => {
    // Calculate the number of days for the trip
    const start = moment(startDate);
    const end = moment(endDate);
    const duration = end.diff(start, 'days') + 1;

    // Create an array of day dates between start and end
    const dayDates = [];
    for (let i = 0; i < duration; i++) {
        const currentDate = moment(start).add(i, 'days').format('YYYY-MM-DD');
        dayDates.push(currentDate);
    }

    // Create a more comprehensive sample itinerary
    const sampleItinerary: Itinerary = {
        itinerary: dayDates.map((date, index) => {
            // Generate events based on day number
            const events = [];

            // Add flight on first day
            if (index === 0) {
                events.push({
                    type: "transport",
                    title: `Flight to ${destination}`,
                    time: "07:30",
                    location: `Home → ${destination}`,
                    description: `Morning flight to ${destination}`,
                    details: {
                        airline: "AA",
                        flight_number: "123",
                        departure: `${date}T07:30:00`,
                        arrival: `${date}T11:00:00`,
                        from: "PHL",
                        to: destination.substring(0, 3).toUpperCase()
                    }
                });

                events.push({
                    type: "accommodation",
                    title: "Hotel Check-in",
                    time: "15:00",
                    location: `${destination} Resort`,
                    description: `Check into your hotel in ${destination}`,
                    details: {
                        hotelName: `${destination} Resort`,
                        address: `123 Main St, ${destination}`,
                        check_in: `${date}T15:00:00`
                    }
                });
            }

            // Middle days - add activities
            if (index > 0 && index < dayDates.length - 1) {
                events.push({
                    type: "meal",
                    title: "Breakfast",
                    time: "08:00",
                    location: "Hotel Restaurant",
                    description: "Enjoy a delicious breakfast to start your day",
                    details: {
                        cuisine: "Local",
                        price_range: "$$"
                    }
                });

                events.push({
                    type: "attraction",
                    title: `Explore ${destination} - Day ${index + 1}`,
                    time: "10:00",
                    location: `${destination} Downtown`,
                    description: `Visit local attractions in ${destination}`,
                    details: {
                        duration: "3h",
                        notes: "Don't forget your camera and comfortable shoes!"
                    }
                });

                events.push({
                    type: "meal",
                    title: "Lunch",
                    time: "13:00",
                    location: "Local Restaurant",
                    description: "Taste the local cuisine",
                    details: {
                        cuisine: "Local",
                        price_range: "$$"
                    }
                });

                events.push({
                    type: "attraction",
                    title: "Afternoon Sightseeing",
                    time: "15:00",
                    location: `${destination} Landmark`,
                    description: "Visit famous landmarks and attractions",
                    details: {
                        duration: "3h",
                        notes: "Popular tourist destination"
                    }
                });

                events.push({
                    type: "meal",
                    title: "Dinner",
                    time: "19:00",
                    location: "Fine Dining Restaurant",
                    description: "Enjoy a pleasant dinner",
                    details: {
                        cuisine: "International",
                        price_range: "$$$"
                    }
                });
            }

            // Last day - add checkout and return flight
            if (index === dayDates.length - 1) {
                events.push({
                    type: "meal",
                    title: "Breakfast",
                    time: "08:00",
                    location: "Hotel Restaurant",
                    description: "Enjoy your last breakfast at the hotel",
                    details: {
                        cuisine: "Local",
                        price_range: "$$"
                    }
                });

                events.push({
                    type: "accommodation",
                    title: "Hotel Check-out",
                    time: "11:00",
                    location: `${destination} Resort`,
                    description: "Check out from your hotel",
                    details: {
                        hotelName: `${destination} Resort`,
                        check_out: `${date}T11:00:00`
                    }
                });

                events.push({
                    type: "transport",
                    title: "Return Flight",
                    time: "19:00",
                    location: `${destination} → Home`,
                    description: "Evening return flight",
                    details: {
                        airline: "AA",
                        flight_number: "456",
                        departure: `${date}T19:00:00`,
                        arrival: `${date}T23:00:00`,
                        from: destination.substring(0, 3).toUpperCase(),
                        to: "PHL"
                    }
                });
            }

            return {
                date: date,
                events: events
            };
        })
    };

    return sampleItinerary;
};

const ItineraryStorage = {
    storeItinerary,
    getItinerary,
    generateGptItinerary,
    generateSampleItinerary
};

export default ItineraryStorage; 