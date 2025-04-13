import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TripData {
    reason_for_trip: string;
    location: string;
    start_time: string;
    end_time: string;
    budget: number;
    itinerary?: any;
}

export const saveTripData = async (tripData: TripData): Promise<void> => {
    try {
        const jsonValue = JSON.stringify(tripData);
        await AsyncStorage.setItem('@trip_data', jsonValue);
    } catch (error) {
        console.error('Error saving trip data:', error);
        throw error;
    }
}; 