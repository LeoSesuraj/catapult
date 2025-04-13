import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSurvey } from './SurveyContext';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { FontFamily, Spacing, BorderRadius, Shadow } from '../../constants/Theme';
import { saveTripData } from '../data/trips';
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

export default function Confirmation() {
    const { surveyData, addTrip } = useSurvey();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateTrip = async () => {
        try {
            setIsLoading(true);

            // Prepare trip data with proper types
            const tripData = {
                reason_for_trip: (surveyData.tripType === 'business' ? 'business' : 'personal') as 'personal' | 'business',
                location: surveyData.destination || 'Unknown',
                start_time: surveyData.startDate || new Date().toISOString(),
                end_time: surveyData.endDate || new Date().toISOString(),
                budget: surveyData.budget || 0
            };

            // Save trip data
            await saveTripData(tripData);

            // Show loading screen for 3 seconds
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Navigate to itinerary screen
            router.push('/survey/itinerary');
        } catch (error) {
            console.error('Error saving trip data:', error);
            // Show error message if needed
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        router.back();
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
                            onPress={handleBack}
                        >
                            <FontAwesome name="chevron-left" size={16} color="#FFFFFF" />
                        </TouchableOpacity>

                        <Text style={styles.title}>Confirm Trip Details</Text>
                        <Text style={styles.subtitle}>Review your trip information before creating</Text>

                        <View style={styles.cardsContainer}>
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

                            {/* Destination Card */}
                            <View style={styles.summaryCard}>
                                <View style={styles.cardHeader}>
                                    <View style={[styles.iconContainer, { backgroundColor: Colors.accent }]}>
                                        <FontAwesome name="map-marker" size={20} color="#FFFFFF" />
                                    </View>
                                    <Text style={styles.cardTitle}>Destination</Text>
                                </View>
                                <Text style={styles.cardValue}>{surveyData.destination || 'Not specified'}</Text>
                            </View>

                            {/* Transport Card */}
                            {surveyData.transportType && (
                                <View style={styles.summaryCard}>
                                    <View style={styles.cardHeader}>
                                        <View style={[styles.iconContainer, { backgroundColor: Colors.success }]}>
                                            <FontAwesome
                                                name={surveyData.transportType === 'fly' ? 'plane' : 'car'}
                                                size={20}
                                                color="#FFFFFF"
                                            />
                                        </View>
                                        <Text style={styles.cardTitle}>Transport</Text>
                                    </View>
                                    <Text style={styles.cardValue}>
                                        {surveyData.transportType === 'fly' ? 'Flying' : 'Self Transport'}
                                    </Text>
                                    {surveyData.transportType === 'fly' && surveyData.departure && (
                                        <Text style={styles.cardSubvalue}>From: {surveyData.departure}</Text>
                                    )}
                                </View>
                            )}

                            {/* Dates Card */}
                            <View style={styles.summaryCard}>
                                <View style={styles.cardHeader}>
                                    <View style={[styles.iconContainer, { backgroundColor: Colors.warning }]}>
                                        <FontAwesome name="calendar" size={20} color="#FFFFFF" />
                                    </View>
                                    <Text style={styles.cardTitle}>Dates</Text>
                                </View>
                                <View>
                                    {surveyData.startDate && (
                                        <Text style={styles.cardValue}>
                                            From: {moment(surveyData.startDate).format('MMM D, YYYY')}
                                        </Text>
                                    )}
                                    {surveyData.endDate && (
                                        <Text style={styles.cardValue}>
                                            To: {moment(surveyData.endDate).format('MMM D, YYYY')}
                                        </Text>
                                    )}
                                    {surveyData.duration && (
                                        <Text style={styles.cardSubvalue}>
                                            Duration: {surveyData.duration} {surveyData.duration === 1 ? 'day' : 'days'}
                                        </Text>
                                    )}
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
                                {surveyData.budgetTier && (
                                    <Text style={styles.cardSubvalue}>
                                        {surveyData.budgetTier.charAt(0).toUpperCase() + surveyData.budgetTier.slice(1)} tier
                                    </Text>
                                )}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={handleCreateTrip}
                        >
                            <Text style={styles.buttonText}>Create Trip</Text>
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
        fontFamily: FontFamily.montserratBold,
        color: '#FFFFFF',
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: FontFamily.montserratMedium,
        color: '#A0AEC0',
        marginBottom: Spacing.xl,
    },
    cardsContainer: {
        marginBottom: Spacing.xl,
    },
    summaryCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
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
        fontFamily: FontFamily.montserratBold,
        color: '#FFFFFF',
    },
    cardValue: {
        fontSize: 16,
        fontFamily: FontFamily.montserratMedium,
        color: '#CBD5E0',
        marginLeft: 48, // Align with text after icon
    },
    cardSubvalue: {
        fontSize: 14,
        fontFamily: FontFamily.montserratMedium,
        color: '#A0AEC0',
        marginLeft: 48,
        marginTop: 4,
    },
    createButton: {
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        backgroundColor: '#48BB78',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
        ...Shadow.medium,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: FontFamily.montserratSemiBold,
        marginRight: Spacing.sm,
    },
    buttonIcon: {
        marginLeft: Spacing.sm,
    },
}); 