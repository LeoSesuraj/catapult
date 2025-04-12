import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily, Spacing, BorderRadius } from '../../constants/Theme';
import { useSurvey } from './SurveyContext';
import { FontAwesome } from '@expo/vector-icons';

export default function Itinerary() {
    const { surveyData } = useSurvey();

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
                        <Text style={styles.title}>Your Trip Details</Text>

                        <View style={styles.card}>
                            <Text style={styles.label}>Trip Type</Text>
                            <Text style={styles.value}>{surveyData.tripType || 'Not specified'}</Text>

                            <Text style={styles.label}>Flight</Text>
                            <View style={styles.flightInfo}>
                                <View style={styles.locationContainer}>
                                    <FontAwesome name="plane" size={16} color="#4299E1" style={{ transform: [{ rotate: '-45deg' }] }} />
                                    <Text style={styles.locationText}>From: {surveyData.departure || 'Not specified'}</Text>
                                </View>
                                <View style={styles.locationContainer}>
                                    <FontAwesome name="plane" size={16} color="#48BB78" style={{ transform: [{ rotate: '45deg' }] }} />
                                    <Text style={styles.locationText}>To: {surveyData.destination || 'Not specified'}</Text>
                                </View>
                            </View>

                            <Text style={styles.label}>Dates</Text>
                            <Text style={styles.value}>
                                From: {surveyData.startDate || 'Not specified'}{'\n'}
                                To: {surveyData.endDate || 'Not specified'}
                            </Text>

                            <Text style={styles.label}>Budget</Text>
                            <Text style={styles.value}>
                                ${surveyData.budget?.toLocaleString() || 'Not specified'}{'\n'}
                                Tier: {surveyData.budgetTier || 'Not specified'}
                            </Text>
                        </View>
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
    title: {
        fontSize: 28,
        fontFamily: FontFamily.montserratBold,
        color: '#FFFFFF',
        marginBottom: Spacing.xl,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: 14,
        fontFamily: FontFamily.montserratMedium,
        color: '#A0AEC0',
        marginBottom: Spacing.xs,
        marginTop: Spacing.md,
    },
    value: {
        fontSize: 18,
        fontFamily: FontFamily.montserratSemiBold,
        color: '#FFFFFF',
        marginBottom: Spacing.sm,
    },
    flightInfo: {
        marginBottom: Spacing.md,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Spacing.xs,
    },
    locationText: {
        fontSize: 18,
        fontFamily: FontFamily.montserratSemiBold,
        color: '#FFFFFF',
        marginLeft: Spacing.sm,
    },
}); 