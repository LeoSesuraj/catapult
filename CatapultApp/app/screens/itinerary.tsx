import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { generateSampleItinerary, storeItinerary, Itinerary } from '../data/itineraryStorage';
import { TripData, saveTripData, getTripData } from '../utils/storage';
import { useRoute } from '@react-navigation/native';

export const ItineraryScreen = () => {
    const [itinerary, setItinerary] = useState<Itinerary | null>(null);
    const [loading, setLoading] = useState(true);
    const route = useRoute();
    const tripId = route.params?.tripId;

    useEffect(() => {
        const loadItinerary = async () => {
            try {
                setLoading(true);
                if (tripId) {
                    const tripData = await getTripData(tripId);
                    if (tripData?.itinerary) {
                        setItinerary(tripData.itinerary);
                    } else {
                        // Generate and save a new itinerary if none exists
                        const newItinerary = generateSampleItinerary(
                            new Date(tripData!.start_time),
                            new Date(tripData!.end_time)
                        );
                        await storeItinerary(newItinerary);

                        // Update trip data with the new itinerary
                        const updatedTripData: TripData = {
                            ...tripData!,
                            itinerary: newItinerary
                        };
                        await saveTripData(updatedTripData);
                        setItinerary(newItinerary);
                    }
                }
            } catch (error) {
                console.error('Error loading itinerary:', error);
            } finally {
                setLoading(false);
            }
        };

        loadItinerary();
    }, [tripId]);

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading itinerary...</Text>
            </View>
        );
    }

    if (!itinerary) {
        return (
            <View style={styles.container}>
                <Text>No itinerary found</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {itinerary.days.map((day, dayIndex) => (
                <View key={dayIndex} style={styles.dayContainer}>
                    <Text style={styles.dayTitle}>Day {dayIndex + 1}</Text>
                    {day.events.map((event, eventIndex) => (
                        <View key={eventIndex} style={styles.eventContainer}>
                            <Text style={styles.eventTime}>{event.time}</Text>
                            <Text style={styles.eventTitle}>{event.title}</Text>
                            <Text style={styles.eventDescription}>{event.description}</Text>
                        </View>
                    ))}
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
    },
    dayContainer: {
        marginBottom: 24,
    },
    dayTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    eventContainer: {
        backgroundColor: '#f5f5f5',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    eventTime: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    eventDescription: {
        fontSize: 14,
        color: '#333',
    },
}); 