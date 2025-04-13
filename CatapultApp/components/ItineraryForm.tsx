import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import ThemedView from './ThemedView';
import ThemedText from './ThemedText';
import { ENDPOINTS } from '../constants/Config';

interface ItineraryFormProps {
    onSuccess?: (data: any) => void;
}

export default function ItineraryForm({ onSuccess }: ItineraryFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        start: 'IND',
        destination: 'JFK',
        start_date: '',
        end_date: ''
    });

    const handleSubmit = async () => {
        try {
            setLoading(true);

            // Validate dates
            if (!formData.start_date || !formData.end_date) {
                Alert.alert('Error', 'Please fill in both start and end dates');
                return;
            }

            // Make request to backend
            const response = await fetch(ENDPOINTS.CREATE_ITINERARY, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create itinerary');
            }

            // Handle success
            if (onSuccess) {
                onSuccess(data);
            }

            Alert.alert('Success', 'Itinerary created successfully!');
        } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create itinerary');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ThemedText style={styles.title}>Create Itinerary</ThemedText>

            <TextInput
                label="Starting Location"
                value={formData.start}
                onChangeText={(text) => setFormData(prev => ({ ...prev, start: text }))}
                style={styles.input}
            />

            <TextInput
                label="Destination"
                value={formData.destination}
                onChangeText={(text) => setFormData(prev => ({ ...prev, destination: text }))}
                style={styles.input}
            />

            <TextInput
                label="Start Date (YYYY-MM-DD)"
                value={formData.start_date}
                onChangeText={(text) => setFormData(prev => ({ ...prev, start_date: text }))}
                style={styles.input}
                placeholder="YYYY-MM-DD"
            />

            <TextInput
                label="End Date (YYYY-MM-DD)"
                value={formData.end_date}
                onChangeText={(text) => setFormData(prev => ({ ...prev, end_date: text }))}
                style={styles.input}
                placeholder="YYYY-MM-DD"
            />

            <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                style={styles.button}
            >
                Create Itinerary
            </Button>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    input: {
        marginBottom: 12,
    },
    button: {
        marginTop: 16,
    },
}); 