import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useSurvey } from './SurveyContext';
import Colors from '../../constants/Colors';

export default function Duration() {
    const router = useRouter();
    const { updateSurveyData } = useSurvey();
    const [duration, setDuration] = useState('');

    const handleNext = () => {
        const durationNum = parseInt(duration);
        if (durationNum > 0) {
            updateSurveyData('duration', durationNum);
            router.push('/survey/budget');
        }
    };

    const handleBack = () => {
        router.back();
    };

    const handleDurationChange = (text: string) => {
        // Only allow positive numbers
        if (/^\d*$/.test(text)) {
            setDuration(text);
        }
    };

    const isValid = duration !== '' && parseInt(duration) > 0;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>How long is your trip?</Text>
            <Text style={styles.subtitle}>Enter the number of days</Text>

            <TextInput
                style={styles.input}
                placeholder="Number of days"
                value={duration}
                onChangeText={handleDurationChange}
                keyboardType="number-pad"
                autoFocus
            />

            <TouchableOpacity
                style={[styles.nextButton, !isValid && styles.disabledButton]}
                onPress={handleNext}
                disabled={!isValid}
            >
                <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
            >
                <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
        textAlign: 'center',
    },
    input: {
        width: '80%',
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 15,
        fontSize: 16,
        marginBottom: 30,
    },
    nextButton: {
        backgroundColor: Colors.light.tint,
        padding: 15,
        borderRadius: 8,
        width: '80%',
        alignItems: 'center',
        marginBottom: 20,
    },
    disabledButton: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    backButton: {
        padding: 15,
        borderRadius: 8,
        width: '80%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.light.tint,
    },
    backButtonText: {
        color: Colors.light.tint,
        fontSize: 16,
    },
}); 