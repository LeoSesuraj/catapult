import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSurvey } from './SurveyContext';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { FontSizes, Spacing, BorderRadius, Shadow } from '../../constants/Theme';
import { saveTripData } from '../data/trips';
import { generateSampleItinerary, storeItinerary } from '../data/itineraryStorage';
import LoadingScreen from '../components/LoadingScreen';
import moment from 'moment';

const THEME = {
    PRIMARY: Colors.primary,
    BACKGROUND: Colors.background,
    TEXT_PRIMARY: Colors.text,
    TEXT_SECONDARY: Colors.mediumGray,
    CARD_BACKGROUND: Colors.offWhite,
    BORDER: Colors.secondary,
};

export default function Itinerary() {
    const { surveyData, addTrip } = useSurvey();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

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

                            // Generate a unique trip ID
                            const tripId = Math.random().toString(36).substring(2, 9);

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
                            const tripData = {
                                id: tripId,
                                reason_for_trip: (surveyData.tripType === 'business' ? 'business' : 'personal') as 'personal' | 'business',
                                location: surveyData.destination || 'Unknown',
                                start_time: surveyData.startDate || new Date().toISOString(),
                                end_time: surveyData.endDate || new Date().toISOString(),
                                budget: surveyData.budget || 0,
                                status: 'upcoming'
                            };
                            await saveTripData(tripData);

                            // 3. Generate and store itinerary
                            const sampleItinerary = generateSampleItinerary(
                                surveyData.startDate || new Date().toISOString(),
                                surveyData.endDate || new Date().toISOString(),
                                surveyData.destination || 'Unknown'
                            );
                            await storeItinerary(sampleItinerary);

                            // 4. Add trip to trips list in context
                            addTrip(newTrip);

                            // 5. Show loading for better UX
                            await new Promise(resolve => setTimeout(resolve, 2000));

                            // 6. Navigate to the itinerary view
                            router.push('/test-itinerary');

                            // Show success message
                            Alert.alert(
                                "Trip Created!",
                                "Your trip has been created and saved. You can access it anytime from the home screen.",
                                [{ text: "OK" }]
                            );
                        } catch (error) {
                            console.error('Error creating trip:', error);
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
        return <LoadingScreen />;
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1a202c', '#2d3748']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView style={styles.safeArea}>
                    <ScrollView style={styles.content}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <FontAwesome name="chevron-left" size={16} color="#FFFFFF" />
                        </TouchableOpacity>

                        <Text style={styles.title}>Trip Summary</Text>
                        <Text style={styles.subtitle}>Review your trip details</Text>

                        <View style={styles.tiersContainer}>
                            {/* Trip Type Card */}
                            <View style={styles.summaryCard}>
                                <View style={styles.cardHeader}>
                                    <View style={[styles.iconContainer, { backgroundColor: Colors.primary }]}>
                                        <FontAwesome name="suitcase" size={20} color="#FFFFFF" />
                                    </View>
                                    <Text style={styles.cardTitle}>Trip Type</Text>
                                </View>
                                <Text style={styles.cardValue}>{surveyData.tripType || 'Not specified'}</Text>
                            </View>

                            {/* Travel Card */}
                            <View style={styles.summaryCard}>
                                <View style={styles.cardHeader}>
                                    <View style={[styles.iconContainer, { backgroundColor: Colors.accent }]}>
                                        <FontAwesome name="plane" size={20} color="#FFFFFF" />
                                    </View>
                                    <Text style={styles.cardTitle}>Travel</Text>
                                </View>
                                <View style={styles.locationInfo}>
                                    <Text style={styles.cardValue}>From: {surveyData.departure || 'Not specified'}</Text>
                                    <Text style={styles.cardValue}>To: {surveyData.destination || 'Not specified'}</Text>
                                </View>
                            </View>

                            {/* Dates Card */}
                            <View style={styles.summaryCard}>
                                <View style={styles.cardHeader}>
                                    <View style={[styles.iconContainer, { backgroundColor: Colors.gold }]}>
                                        <FontAwesome name="calendar" size={20} color="#FFFFFF" />
                                    </View>
                                    <Text style={styles.cardTitle}>Dates</Text>
                                </View>
                                <View style={styles.dateInfo}>
                                    <Text style={styles.cardValue}>From: {surveyData.startDate || 'Not specified'}</Text>
                                    <Text style={styles.cardValue}>To: {surveyData.endDate || 'Not specified'}</Text>
                                </View>
                            </View>

                            {/* Budget Card */}
                            <View style={styles.summaryCard}>
                                <View style={styles.cardHeader}>
                                    <View style={[styles.iconContainer, { backgroundColor: '#48BB78' }]}>
                                        <FontAwesome name="dollar" size={20} color="#FFFFFF" />
                                    </View>
                                    <Text style={styles.cardTitle}>Budget</Text>
                                </View>
                                <Text style={styles.cardValue}>
                                    {surveyData.budget ? `$${surveyData.budget.toLocaleString()}` : 'Not specified'}
                                </Text>
                                <Text style={styles.budgetTier}>
                                    {surveyData.budgetTier ? `${surveyData.budgetTier} tier` : ''}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={handleConfirmTrip}
                        >
                            <Text style={styles.confirmButtonText}>Confirm Trip</Text>
                            <FontAwesome name="check" size={16} color="#FFFFFF" style={styles.buttonIcon} />
                        </TouchableOpacity>
                    </ScrollView>
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
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: 16,
        color: '#A0AEC0',
        marginBottom: Spacing.xl,
    },
    tiersContainer: {
        marginBottom: Spacing.md,
    },
    summaryCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        borderWidth: 2,
        borderColor: 'transparent',
        ...Shadow.medium,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    cardValue: {
        fontSize: 16,
        color: '#CBD5E0',
        marginLeft: 48, // Align with text after icon
    },
    locationInfo: {
        marginTop: Spacing.xs,
    },
    dateInfo: {
        marginTop: Spacing.xs,
    },
    budgetTier: {
        fontSize: 14,
        color: '#A0AEC0',
        marginLeft: 48,
        marginTop: 4,
    },
    confirmButton: {
        backgroundColor: '#48BB78',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginTop: 'auto',
        marginBottom: Spacing.md,
        ...Shadow.medium,
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginRight: Spacing.sm,
    },
    buttonIcon: {
        marginLeft: Spacing.sm,
    },
}); 