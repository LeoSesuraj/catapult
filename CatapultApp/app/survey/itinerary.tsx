import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSurvey } from './SurveyContext';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { FontFamily, Spacing, BorderRadius, Shadow } from '../../constants/Theme';
import { saveTripData } from '../data/trips';
import { generateSampleItinerary, storeItinerary } from '../data/itineraryStorage';
import { generateItinerary, checkApiHealth } from '../utils/apiService';
import LoadingScreen from '../components/LoadingScreen';
import moment from 'moment';

export default function Itinerary() {
    const { surveyData, addTrip } = useSurvey();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Generating your itinerary...');
    const [progressLogs, setProgressLogs] = useState<string[]>([]);

    // Function to add a log message
    const addLogMessage = (message: string) => {
        setProgressLogs(prevLogs => [...prevLogs, message]);
    };

    const handleConfirmTrip = async () => {
        // Show confirmation dialog first
        Alert.alert(
            "Confirm Trip Creation",
            "Are you ready to create your trip? This will generate your personalized itinerary.",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Create Trip",
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            setProgressLogs([]);
                            setLoadingMessage('Checking API connection...');
                            addLogMessage('Starting itinerary generation...');
                            addLogMessage(`Destination: ${surveyData.destination || 'Unknown'}`);

                            // Check if API is available
                            addLogMessage('Checking API health...');
                            const isApiHealthy = await checkApiHealth();
                            addLogMessage(isApiHealthy ? 'API connection successful' : 'API unavailable, will use mock data');

                            // Generate a unique trip ID
                            const tripId = Math.random().toString(36).substring(2, 9);
                            addLogMessage('Generated trip ID: ' + tripId);

                            // 1. Create trip object for the trips list
                            const newTrip = {
                                id: tripId,
                                destination: surveyData.destination || 'New Trip',
                                image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60', // Default image
                                dates: surveyData.startDate && surveyData.endDate
                                    ? `${moment(surveyData.startDate).format('MMM D')} - ${moment(surveyData.endDate).format('MMM D, YYYY')}`
                                    : 'Upcoming Trip',
                                status: 'upcoming' as const
                            };

                            // 2. Save trip data
                            addLogMessage('Saving trip data...');
                            const tripData = {
                                id: tripId,
                                reason_for_trip: (surveyData.tripType === 'Business' ? 'Business' : 'Personal') as 'Business' | 'Personal',
                                location: surveyData.destination || 'Unknown',
                                start_time: surveyData.startDate || new Date().toISOString(),
                                end_time: surveyData.endDate || new Date().toISOString(),
                                budget: surveyData.budget || 0,
                                status: 'upcoming'
                            };
                            await saveTripData(tripData);
                            addLogMessage('Trip data saved successfully');

                            // 3. Generate and store itinerary
                            let itinerary;

                            if (isApiHealthy) {
                                setLoadingMessage('Generating custom itinerary...');
                                addLogMessage('Requesting flights from source to destination...');
                                addLogMessage(`Origin: ${surveyData.departure || 'Unknown'}`);
                                addLogMessage(`Searching hotel options in ${surveyData.destination}...`);

                                try {
                                    // Use our API to generate a real itinerary
                                    addLogMessage('Calling backend API for itinerary generation...');
                                    itinerary = await generateItinerary(surveyData);
                                    addLogMessage('Successfully received itinerary data from API');
                                } catch (error) {
                                    console.error('API itinerary generation failed, using fallback:', error);
                                    addLogMessage('Error generating itinerary from API: ' + (error instanceof Error ? error.message : 'Unknown error'));
                                    setLoadingMessage('API unavailable, generating backup itinerary...');
                                    addLogMessage('Falling back to sample itinerary data');

                                    // Fall back to sample itinerary if API fails
                                    itinerary = generateSampleItinerary(
                                        surveyData.startDate || new Date().toISOString(),
                                        surveyData.endDate || new Date().toISOString(),
                                        surveyData.destination || 'Unknown'
                                    );
                                }
                            } else {
                                setLoadingMessage('API unavailable, generating backup itinerary...');
                                addLogMessage('Using sample itinerary generator');

                                // Use sample itinerary if API is not available
                                itinerary = generateSampleItinerary(
                                    surveyData.startDate || new Date().toISOString(),
                                    surveyData.endDate || new Date().toISOString(),
                                    surveyData.destination || 'Unknown'
                                );
                                addLogMessage('Sample itinerary generated successfully');
                            }

                            // Store the itinerary
                            addLogMessage('Storing itinerary in device storage...');
                            await storeItinerary(itinerary);
                            addLogMessage('Itinerary stored successfully');

                            // 4. Add trip to trips list in context
                            addTrip(newTrip);
                            addLogMessage('Trip added to your trip list');

                            // 5. Show loading for a bit longer for better UX
                            setLoadingMessage('Finalizing your itinerary...');
                            addLogMessage('Preparing to display your itinerary');
                            await new Promise(resolve => setTimeout(resolve, 1500));

                            // 6. Navigate to the itinerary view
                            addLogMessage('Ready to view your itinerary!');
                            router.push(`/itinerary?id=${tripId}`);
                        } catch (error) {
                            console.error('Error creating trip:', error);
                            addLogMessage('Error creating trip: ' + (error instanceof Error ? error.message : 'Unknown error'));
                            Alert.alert(
                                "Error",
                                "Failed to create trip. Please try again.",
                                [{ text: "OK" }]
                            );
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    if (isLoading) {
        return <LoadingScreen message={loadingMessage} logs={progressLogs} />;
    }

    const formatDate = (dateString: string | null) => {
        return dateString ? moment(dateString).format('MMM D, YYYY') : 'Not specified';
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1a202c', '#2d3748']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.content}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <FontAwesome name="chevron-left" size={16} color="#FFFFFF" />
                        </TouchableOpacity>

                        <Text style={styles.title}>Trip Summary</Text>
                        <Text style={styles.subtitle}>Review your trip details</Text>

                        <View style={styles.summaryContainer}>
                            {/* Trip Type */}
                            <View style={styles.infoRow}>
                                <View style={[styles.iconContainer, { backgroundColor: Colors.primary }]}>
                                    <FontAwesome name="suitcase" size={18} color="#FFFFFF" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Trip Type</Text>
                                    <Text style={styles.infoValue}>{surveyData.tripType || 'Not specified'}</Text>
                                </View>
                            </View>

                            {/* Destination & Transport Combined */}
                            <View style={styles.infoRow}>
                                <View style={[styles.iconContainer, { backgroundColor: Colors.accent }]}>
                                    <FontAwesome
                                        name={surveyData.transportType === 'fly' ? 'plane' : 'map-marker'}
                                        size={18}
                                        color="#FFFFFF"
                                    />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Travel</Text>
                                    <Text style={styles.infoValue}>
                                        {surveyData.destination || 'Not specified'}
                                        {surveyData.transportType && ` (${surveyData.transportType === 'fly' ? 'Flying' : 'Self-driving'})`}
                                    </Text>
                                    {surveyData.transportType === 'fly' && surveyData.departure && (
                                        <Text style={styles.infoSubvalue}>From: {surveyData.departure}</Text>
                                    )}
                                </View>
                            </View>

                            {/* Dates */}
                            <View style={styles.infoRow}>
                                <View style={[styles.iconContainer, { backgroundColor: Colors.warning || '#F6AD55' }]}>
                                    <FontAwesome name="calendar" size={18} color="#FFFFFF" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Dates</Text>
                                    <Text style={styles.infoValue}>
                                        {formatDate(surveyData.startDate)} - {formatDate(surveyData.endDate)}
                                    </Text>
                                    {surveyData.duration && (
                                        <Text style={styles.infoSubvalue}>
                                            {surveyData.duration} {surveyData.duration === 1 ? 'day' : 'days'}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            {/* Budget */}
                            <View style={styles.infoRow}>
                                <View style={[styles.iconContainer, { backgroundColor: '#48BB78' }]}>
                                    <FontAwesome name="dollar" size={18} color="#FFFFFF" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Budget</Text>
                                    <Text style={styles.infoValue}>
                                        {surveyData.budget ? `$${surveyData.budget.toLocaleString()}` : 'Not specified'}
                                        {surveyData.budgetTier && ` (${surveyData.budgetTier.charAt(0).toUpperCase() + surveyData.budgetTier.slice(1)})`}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={handleConfirmTrip}
                        >
                            <Text style={styles.buttonText}>Create Trip</Text>
                            <FontAwesome name="check" size={16} color="#FFFFFF" style={styles.buttonIcon} />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a202c',
    },
    gradient: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: Spacing.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
    },
    title: {
        fontSize: 28,
        fontFamily: FontFamily.montserratBold || 'sans-serif',
        color: '#FFFFFF',
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: FontFamily.montserratMedium || 'sans-serif',
        color: '#A0AEC0',
        marginBottom: Spacing.xl,
    },
    summaryContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        ...Shadow.medium,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 14,
        fontFamily: FontFamily.montserratSemiBold || 'sans-serif',
        color: '#A0AEC0',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        fontFamily: FontFamily.montserratMedium || 'sans-serif',
        color: '#FFFFFF',
    },
    infoSubvalue: {
        fontSize: 14,
        fontFamily: FontFamily.montserratMedium || 'sans-serif',
        color: '#A0AEC0',
        marginTop: 2,
    },
    createButton: {
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        backgroundColor: '#48BB78',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 'auto',
        marginBottom: Spacing.xl,
        ...Shadow.medium,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: FontFamily.montserratSemiBold || 'sans-serif',
        marginRight: Spacing.sm,
    },
    buttonIcon: {
        marginLeft: Spacing.sm,
    },
}); 