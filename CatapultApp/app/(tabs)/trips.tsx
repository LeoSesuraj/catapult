import { StyleSheet, Text, View, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef, useEffect } from 'react';
import Colors from '@/constants/Colors';
import { FontFamily, FontSizes, Spacing, TextStyle, CardStyle } from '@/constants/Theme';

export default function TripsScreen() {
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
                <Text style={TextStyle.heading}>My Trips</Text>
                <Animated.View style={[styles.cardContainer, { opacity: fadeAnim }]}>
                    <View style={styles.placeholderCard}>
                        <Text style={TextStyle.body}>
                            Your trips will appear here. Stay tuned for the ability to view and manage all your upcoming and past travels.
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
}); 