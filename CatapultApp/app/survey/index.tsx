import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '../../constants/Colors';
import { FontFamily, Spacing, BorderRadius, Shadow } from '../../constants/Theme';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useSurvey } from './SurveyContext';

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';

export default function CalendarConnect() {
    const router = useRouter();
    const { updateSurveyData } = useSurvey();
    const [isConnecting, setIsConnecting] = useState(false);

    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: ANDROID_CLIENT_ID,
        iosClientId: IOS_CLIENT_ID,
        webClientId: CLIENT_ID,
        scopes: ['https://www.googleapis.com/auth/calendar.readonly']
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            handleGoogleSignIn(authentication.accessToken);
        }
    }, [response]);

    const handleGoogleSignIn = async (accessToken: string) => {
        try {
            setIsConnecting(true);
            // Send accessToken to your backend
            const backendResponse = await fetch('http://localhost:5000/api/calendar/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: accessToken }),
            });

            if (backendResponse.ok) {
                updateSurveyData('hasGoogleCalendar', true);
                Alert.alert(
                    'Success',
                    'Successfully connected to Google Calendar!',
                    [{ text: 'Continue', onPress: () => router.push('/survey/type') }]
                );
            } else {
                throw new Error('Failed to connect to Google Calendar');
            }
        } catch (error) {
            console.error('Google Calendar connection error:', error);
            Alert.alert(
                'Error',
                'Failed to connect to Google Calendar. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsConnecting(false);
        }
    };

    const handleGoogleConnect = async () => {
        try {
            setIsConnecting(true);
            await promptAsync();
        } catch (error) {
            console.error('Google auth error:', error);
            Alert.alert('Error', 'Failed to start Google authentication');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleSkip = () => {
        router.push('/survey/type');
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
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBack}
                    >
                        <FontAwesome name="chevron-left" size={16} color="#FFFFFF" />
                    </TouchableOpacity>

                    <View style={styles.content}>
                        <View style={styles.iconContainer}>
                            <FontAwesome name="calendar" size={60} color="#FFFFFF" />
                        </View>

                        <Text style={styles.title}>Connect Your Calendar</Text>
                        <Text style={styles.subtitle}>
                            Connect your calendar to help us plan your trip around your schedule
                        </Text>

                        <TouchableOpacity
                            style={[
                                styles.googleButton,
                                isConnecting && styles.disabledButton
                            ]}
                            onPress={handleGoogleConnect}
                            disabled={isConnecting || !request}
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
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        margin: Spacing.lg,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.lg,
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
    disabledButton: {
        opacity: 0.7,
        backgroundColor: '#718096',
    },
}); 