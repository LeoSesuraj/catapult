import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FontFamily, Spacing, BorderRadius, Shadow } from '../../constants/Theme';
import { useSurvey } from './SurveyContext';

export default function Transport() {
    const router = useRouter();
    const { updateSurveyData } = useSurvey();

    const handleTransportSelect = (type: 'fly' | 'self') => {
        updateSurveyData('transportType', type);
        if (type === 'fly') {
            router.push('/survey/departure');
        } else {
            router.push('/survey/calendar');
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

                        <Text style={styles.title}>How will you get there?</Text>
                        <Text style={styles.subtitle}>Choose your mode of transport</Text>

                        <View style={styles.optionsContainer}>
                            <TouchableOpacity
                                style={styles.option}
                                onPress={() => handleTransportSelect('fly')}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: 'rgba(66, 153, 225, 0.1)' }]}>
                                    <FontAwesome name="plane" size={24} color="#4299E1" />
                                </View>
                                <Text style={styles.optionTitle}>Fly There</Text>
                                <Text style={styles.optionDescription}>
                                    Book flights and travel by air
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.option}
                                onPress={() => handleTransportSelect('self')}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: 'rgba(72, 187, 120, 0.1)' }]}>
                                    <FontAwesome name="car" size={24} color="#48BB78" />
                                </View>
                                <Text style={styles.optionTitle}>Self Transport</Text>
                                <Text style={styles.optionDescription}>
                                    Drive, train, or other ground transport
                                </Text>
                            </TouchableOpacity>
                        </View>
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
    optionsContainer: {
        gap: Spacing.lg,
    },
    option: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        alignItems: 'center',
        ...Shadow.medium,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    optionTitle: {
        fontSize: 18,
        fontFamily: FontFamily.montserratBold,
        color: '#FFFFFF',
        marginBottom: Spacing.xs,
    },
    optionDescription: {
        fontSize: 14,
        fontFamily: FontFamily.montserratMedium,
        color: '#A0AEC0',
        textAlign: 'center',
    },
}); 