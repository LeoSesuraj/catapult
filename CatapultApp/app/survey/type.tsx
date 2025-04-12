import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSurvey } from './SurveyContext';
import { FontFamily, Spacing, BorderRadius, Shadow } from '../../constants/Theme';

export default function TripType() {
    const router = useRouter();
    const { updateSurveyData } = useSurvey();

    const handleSelection = (type: 'business' | 'personal') => {
        updateSurveyData('tripType', type);
        router.push('/survey/location');
    };

    const handleBack = () => {
        router.back();
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
                            onPress={handleBack}
                        >
                            <FontAwesome name="chevron-left" size={16} color="#FFFFFF" />
                        </TouchableOpacity>

                        <Text style={styles.title}>What type of trip is this?</Text>
                        <Text style={styles.subtitle}>This helps us tailor recommendations to your needs</Text>

                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={() => handleSelection('business')}
                        >
                            <View style={styles.optionIcon}>
                                <FontAwesome name="briefcase" size={24} color="#FFFFFF" />
                            </View>
                            <View style={styles.optionContent}>
                                <Text style={styles.optionTitle}>Business Trip</Text>
                                <Text style={styles.optionDescription}>Work-related travel with focus on convenience</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={() => handleSelection('personal')}
                        >
                            <View style={styles.optionIcon}>
                                <FontAwesome name="plane" size={24} color="#FFFFFF" />
                            </View>
                            <View style={styles.optionContent}>
                                <Text style={styles.optionTitle}>Personal Trip</Text>
                                <Text style={styles.optionDescription}>Leisure travel with focus on experiences</Text>
                            </View>
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
    optionButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        ...Shadow.medium,
    },
    optionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 18,
        fontFamily: FontFamily.montserratSemiBold,
        color: '#FFFFFF',
        marginBottom: 4,
    },
    optionDescription: {
        fontSize: 14,
        fontFamily: FontFamily.montserratMedium,
        color: '#A0AEC0',
    },
}); 