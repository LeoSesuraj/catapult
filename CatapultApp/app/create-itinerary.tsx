import React from 'react';
import { StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ItineraryForm from '../components/ItineraryForm';

export default function CreateItineraryScreen() {
    const router = useRouter();

    const handleSuccess = (data: any) => {
        // Navigate to the itinerary view screen with the new itinerary data
        router.push({
            pathname: '/itinerary',
            params: { id: data.id }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Create New Itinerary',
                    headerStyle: {
                        backgroundColor: '#1a202c',
                    },
                    headerTintColor: '#fff',
                }}
            />
            <ItineraryForm onSuccess={handleSuccess} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a202c',
    },
}); 