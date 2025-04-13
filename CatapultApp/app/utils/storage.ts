import AsyncStorage from '@react-native-async-storage/async-storage';
import { Itinerary } from '../data/itineraryStorage';

export interface TripData {
    reason_for_trip: 'Personal' | 'Business';
    location: string;
    start_time: string;
    end_time: string;
    budget: number;
    itinerary?: Itinerary;
    status?: 'upcoming' | 'completed' | 'cancelled';
    id?: string;
}

// Save trip data to AsyncStorage
export const saveTripData = async (tripData: TripData): Promise<string> => {
    try {
        // Generate a unique ID if not provided in the tripData
        const tripId = tripData.id ? tripData.id.replace('trip_', '') : Math.random().toString(36).substring(7);
        const key = `trip_${tripId}`;

        // Make sure the tripData has the id set
        const dataToSave = {
            ...tripData,
            id: tripId
        };

        // Save the trip data
        await AsyncStorage.setItem(key, JSON.stringify(dataToSave));

        // Update the list of trip IDs
        const tripIds = await AsyncStorage.getItem('trip_ids') || '[]';
        const tripIdList = JSON.parse(tripIds);
        if (!tripIdList.includes(key)) {
            tripIdList.push(key);
            await AsyncStorage.setItem('trip_ids', JSON.stringify(tripIdList));
        }

        return tripId;
    } catch (error) {
        console.error('Error saving trip data:', error);
        throw error;
    }
};

// Get trip data from AsyncStorage
export const getTripData = async (tripId: string): Promise<TripData | null> => {
    try {
        const key = `trip_${tripId}`;
        const tripData = await AsyncStorage.getItem(key);
        return tripData ? JSON.parse(tripData) : null;
    } catch (error) {
        console.error('Error getting trip data:', error);
        return null;
    }
};

// Get all trips from AsyncStorage
export const getAllTrips = async (): Promise<TripData[]> => {
    try {
        const tripIds = await AsyncStorage.getItem('trip_ids') || '[]';
        const tripIdList = JSON.parse(tripIds);
        const trips = await Promise.all(
            tripIdList.map(async (id: string) => {
                const tripData = await AsyncStorage.getItem(id);
                return tripData ? JSON.parse(tripData) : null;
            })
        );
        return trips.filter((trip): trip is TripData => trip !== null);
    } catch (error) {
        console.error('Error getting all trips:', error);
        return [];
    }
}; 