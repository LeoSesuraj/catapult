export interface TripData {
    reason_for_trip: 'personal' | 'business';
    location: string;
    start_time: string;
    end_time: string;
    budget: number;
}

export const sampleTrips: TripData[] = [
    {
        reason_for_trip: "personal",
        location: "NYC",
        start_time: "2025-04-10T08:30:00Z",
        end_time: "2025-04-15T18:00:00Z",
        budget: 500
    },
    {
        reason_for_trip: "business",
        location: "LAX",
        start_time: "2025-04-12T14:15:00Z",
        end_time: "2025-04-14T20:30:00Z",
        budget: 1200
    }
];

export const saveTripData = async (tripData: TripData) => {
    // TODO: Implement actual API call or storage logic
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('Trip data saved:', tripData);
            resolve(tripData);
        }, 2000); // Simulate network delay
    });
}; 