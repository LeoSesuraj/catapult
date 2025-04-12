import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useSurvey } from './SurveyContext';
import Colors from '../../constants/Colors';
import moment from 'moment';

export default function Duration() {
    const router = useRouter();
    const { updateSurveyData } = useSurvey();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [duration, setDuration] = useState<number | null>(null);

    const calculateDuration = (start: string, end: string) => {
        if (start && end) {
            const startMoment = moment(start, 'YYYY-MM-DD');
            const endMoment = moment(end, 'YYYY-MM-DD');

            if (startMoment.isValid() && endMoment.isValid()) {
                const days = endMoment.diff(startMoment, 'days') + 1;
                if (days > 0) {
                    setDuration(days);
                    return days;
                }
            }
        }
        setDuration(null);
        return null;
    };

    const handleStartDateChange = (text: string) => {
        setStartDate(text);
        calculateDuration(text, endDate);
    };

    const handleEndDateChange = (text: string) => {
        setEndDate(text);
        calculateDuration(startDate, text);
    };

    const handleNext = () => {
        const days = calculateDuration(startDate, endDate);
        if (days) {
            updateSurveyData('duration', days);
            updateSurveyData('startDate', startDate);
            updateSurveyData('endDate', endDate);
            router.push('/survey/budget');
        }
    };

    const handleBack = () => {
        router.back();
    };

    const isValid = duration !== null && duration > 0;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>When is your trip?</Text>
            <Text style={styles.subtitle}>Enter your travel dates (YYYY-MM-DD)</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Start Date:</Text>
                <TextInput
                    style={styles.input}
                    value={startDate}
                    onChangeText={handleStartDateChange}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#999"
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>End Date:</Text>
                <TextInput
                    style={styles.input}
                    value={endDate}
                    onChangeText={handleEndDateChange}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#999"
                />
            </View>

            {duration !== null && duration > 0 && (
                <Text style={styles.durationText}>
                    Trip duration: {duration} days
                </Text>
            )}

            {duration !== null && duration <= 0 && (
                <Text style={styles.errorText}>
                    End date must be after start date
                </Text>
            )}

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
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        marginTop: 40,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
        textAlign: 'center',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: '#333',
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
    },
    durationText: {
        fontSize: 18,
        color: Colors.light.tint,
        marginBottom: 30,
        fontWeight: '500',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
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