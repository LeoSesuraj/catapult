import { StyleSheet, Text, View, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef, useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { FontFamily, FontSizes, Spacing, TextStyle, CardStyle } from '@/constants/Theme';

export default function ItineraryScreen() {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={TextStyle.heading}>Itinerary</Text>
                <Animated.View style={[styles.cardContainer, { opacity: fadeAnim }]}>
                    <View style={styles.placeholderCard}>
                        <FontAwesome name="calendar-o" size={24} color={Colors.primary} style={styles.icon} />
                        <Text style={[TextStyle.body, styles.placeholderText]}>
                            Your detailed trip itinerary will be displayed here once you have an upcoming trip.
                        </Text>
                    </View>
                </Animated.View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
        padding: Spacing.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContainer: {
        marginTop: Spacing.xl,
        width: '100%',
        maxWidth: 400,
    },
    placeholderCard: {
        ...CardStyle.container,
        padding: Spacing.lg,
        alignItems: 'center',
    },
    icon: {
        marginBottom: Spacing.md,
    },
    placeholderText: {
        textAlign: 'center',
    }
}); 