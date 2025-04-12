import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSurvey } from './SurveyContext';
import { FontFamily, Spacing, BorderRadius, Shadow } from '../../constants/Theme';

export default function Location() {
    const router = useRouter();
    const { updateSurveyData } = useSurvey();
    const [location, setLocation] = useState('');

    const handleNext = () => {
        if (location.trim()) {
            updateSurveyData('location', location.trim());
            router.push('/survey/duration');
        }
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

                        <Text style={styles.title}>Where would you like to go?</Text>
                        <Text style={styles.subtitle}>Enter the city you'd like to visit</Text>

                        <View style={styles.inputContainer}>
                            <FontAwesome name="map-marker" size={20} color="#A0AEC0" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter city name"
                                placeholderTextColor="#718096"
                                value={location}
                                onChangeText={setLocation}
                                autoFocus
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.nextButton, !location.trim() && styles.disabledButton]}
                            onPress={handleNext}
                            disabled={!location.trim()}
                        >
                            <Text style={styles.buttonText}>Next</Text>
                            <FontAwesome name="chevron-right" size={16} color="#FFFFFF" style={styles.buttonIcon} />
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
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        marginBottom: Spacing.xl,
        padding: Spacing.md,
    },
    inputIcon: {
        marginRight: Spacing.md,
    },
    input: {
        flex: 1,
        height: 40,
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: FontFamily.montserratMedium,
    },
    nextButton: {
        backgroundColor: '#4285F4',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadow.medium,
    },
    disabledButton: {
        opacity: 0.5,
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