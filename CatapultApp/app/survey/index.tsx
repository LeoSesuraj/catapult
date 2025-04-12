import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '../../constants/Colors';
import { FontFamily, Spacing, BorderRadius, Shadow } from '../../constants/Theme';

export default function CalendarConnect() {
    const router = useRouter();
    const [isConnecting, setIsConnecting] = useState(false);

    const handleGoogleConnect = async () => {
        setIsConnecting(true);
        // TODO: Implement Google Calendar connection
        // For now, just proceed to the first survey question
        router.push('/survey/type');
        setIsConnecting(false);
    };

    const handleSkip = () => {
        router.push('/survey/type');
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
                        <View style={styles.iconContainer}>
                            <FontAwesome name="calendar" size={60} color="#FFFFFF" />
                        </View>

                        <Text style={styles.title}>Connect Your Calendar</Text>
                        <Text style={styles.subtitle}>
                            Connect your calendar to help us plan your trip around your schedule
                        </Text>

                        <TouchableOpacity
                            style={styles.googleButton}
                            onPress={handleGoogleConnect}
                            disabled={isConnecting}
                        >
                            <FontAwesome name="google" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                            <Text style={styles.buttonText}>
                                {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.skipButton}
                            onPress={handleSkip}
                        >
                            <Text style={styles.skipButtonText}>Skip for now</Text>
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    title: {
        fontSize: 28,
        fontFamily: FontFamily.montserratBold,
        color: '#FFFFFF',
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        fontFamily: FontFamily.montserratMedium,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        color: '#A0AEC0',
        paddingHorizontal: Spacing.lg,
    },
    googleButton: {
        backgroundColor: '#4285F4',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        width: '80%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
        ...Shadow.medium,
    },
    buttonIcon: {
        marginRight: Spacing.sm,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: FontFamily.montserratSemiBold,
    },
    skipButton: {
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        width: '80%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    skipButtonText: {
        color: '#A0AEC0',
        fontSize: 16,
        fontFamily: FontFamily.montserratMedium,
    },
}); 