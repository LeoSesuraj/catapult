import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, Easing, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FontFamily, Spacing, BorderRadius } from '../../constants/Theme';

const { width } = Dimensions.get('window');

interface LoadingScreenProps {
    message?: string;
    logs?: string[];
    onFinished?: () => void;
}

// Mock travel planning steps for a better user experience
const TRAVEL_PLANNING_STEPS = [
    "Analyzing your preferences...",
    "Searching for available flights...",
    "Finding the best hotel deals...",
    "Checking local attractions...",
    "Optimizing travel routes...",
    "Calculating budget options...",
    "Checking weather forecasts...",
    "Finding local restaurants...",
    "Looking for transportation options...",
    "Checking for travel advisories...",
    "Finding popular activities...",
    "Creating your custom itinerary...",
    "Finalizing your travel plan...",
    "Checking for special offers...",
    "Finding travel insurance options...",
    "Your trip is almost ready..."
];

const LoadingScreen = ({ logs = [], onFinished }: LoadingScreenProps) => {
    const loadingDots = useRef('');
    const dotAnimationId = useRef<NodeJS.Timeout | null>(null);
    const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);

    // Animated values
    const planeXAnim = useRef(new Animated.Value(-50)).current;
    const planeYAnim = useRef(new Animated.Value(0)).current;
    const planeRotateAnim = useRef(new Animated.Value(0)).current;
    const cloud1Anim = useRef(new Animated.Value(0)).current;
    const cloud2Anim = useRef(new Animated.Value(0)).current;
    const cloud3Anim = useRef(new Animated.Value(0)).current;
    const cloud4Anim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const planeOpacityAnim = useRef(new Animated.Value(1)).current;

    // Scroll view ref
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        // Create a smoother plane animation without jerking on reset
        const animatePlane = () => {
            // Reset the plane position to start
            planeXAnim.setValue(-50);
            planeOpacityAnim.setValue(1);

            // Create a sequence for the plane animation
            Animated.sequence([
                // Fly across the screen
                Animated.timing(planeXAnim, {
                    toValue: width + 50,
                    duration: 10000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                // Fade out at the end
                Animated.timing(planeOpacityAnim, {
                    toValue: 0,
                    duration: 0, // Instant
                    useNativeDriver: true,
                }),
                // Move back to start while invisible
                Animated.timing(planeXAnim, {
                    toValue: -50,
                    duration: 0, // Instant
                    useNativeDriver: true,
                }),
                // Fade back in
                Animated.timing(planeOpacityAnim, {
                    toValue: 1,
                    duration: 400, // Gradual fade in
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                // Loop the animation
                animatePlane();
            });
        };

        // Start the smooth vertical motion for the plane
        const animatePlaneVertical = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(planeYAnim, {
                        toValue: -8,
                        duration: 2000,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(planeYAnim, {
                        toValue: 8,
                        duration: 2000,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        // Start the smooth rotation for the plane
        const animatePlaneRotation = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(planeRotateAnim, {
                        toValue: 5,
                        duration: 2000,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(planeRotateAnim, {
                        toValue: -5,
                        duration: 2000,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        // Start all plane animations
        animatePlane();
        animatePlaneVertical();
        animatePlaneRotation();

        // Cloud animations with different speeds
        const startCloudAnimation = (cloudAnim: Animated.Value, duration: number, delay: number = 0) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(cloudAnim, {
                        toValue: 1,
                        duration: duration,
                        delay: delay,
                        useNativeDriver: true,
                        easing: Easing.linear,
                    }),
                    Animated.timing(cloudAnim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        startCloudAnimation(cloud1Anim, 15000);
        startCloudAnimation(cloud2Anim, 18000, 2000);
        startCloudAnimation(cloud3Anim, 20000, 4000);
        startCloudAnimation(cloud4Anim, 25000, 6000);

        // Progress animation - make it take longer (15 seconds)
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: 15000,
            useNativeDriver: false,
            easing: Easing.inOut(Easing.cubic), // Smoother animation
        }).start(() => {
            // Call onFinished callback when animation completes
            if (onFinished) {
                setTimeout(onFinished, 1000);
            }
        });

        // Loading dots
        dotAnimationId.current = setInterval(() => {
            loadingDots.current = loadingDots.current.length >= 3 ? '' : loadingDots.current + '.';
        }, 500);

        // Add travel planning steps to logs at intervals
        let stepIndex = 0;
        const logInterval = setInterval(() => {
            if (stepIndex < TRAVEL_PLANNING_STEPS.length) {
                setDisplayedLogs(prev => [...prev, TRAVEL_PLANNING_STEPS[stepIndex]]);
                stepIndex++;
            } else {
                clearInterval(logInterval);
            }
        }, 900); // Show a new message every 900ms for quick progression

        // Cleanup
        return () => {
            if (dotAnimationId.current) {
                clearInterval(dotAnimationId.current);
            }
            clearInterval(logInterval);
            planeXAnim.stopAnimation();
            planeYAnim.stopAnimation();
            planeRotateAnim.stopAnimation();
            planeOpacityAnim.stopAnimation();
            cloud1Anim.stopAnimation();
            cloud2Anim.stopAnimation();
            cloud3Anim.stopAnimation();
            cloud4Anim.stopAnimation();
            progressAnim.stopAnimation();
        };
    }, [planeXAnim, planeYAnim, planeRotateAnim, planeOpacityAnim, cloud1Anim, cloud2Anim, cloud3Anim, cloud4Anim, progressAnim, onFinished]);

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.gradient}>
                <View style={styles.content}>
                    {/* Flight animation container */}
                    <View style={styles.animationContainer}>
                        <LinearGradient
                            colors={['#203c71', '#2d56a3']}
                            style={styles.skyBackground}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                        >
                            {/* Simple stars */}
                            <View style={[styles.star, { top: '20%', left: '15%' }]} />
                            <View style={[styles.star, { top: '40%', left: '45%' }]} />
                            <View style={[styles.star, { top: '15%', right: '25%' }]} />
                            <View style={[styles.star, { top: '60%', right: '15%' }]} />
                            <View style={[styles.star, { top: '35%', right: '35%' }]} />
                            <View style={[styles.star, { top: '25%', left: '35%' }]} />
                            <View style={[styles.star, { top: '55%', left: '25%' }]} />
                            <View style={[styles.star, { top: '70%', left: '55%' }]} />
                        </LinearGradient>

                        {/* Clouds */}
                        <Animated.View
                            style={[
                                styles.cloud,
                                styles.cloud1,
                                {
                                    transform: [
                                        {
                                            translateX: cloud1Anim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [-50, width],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.cloud,
                                styles.cloud2,
                                {
                                    transform: [
                                        {
                                            translateX: cloud2Anim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [-70, width],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.cloud,
                                styles.cloud3,
                                {
                                    transform: [
                                        {
                                            translateX: cloud3Anim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [-60, width],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.cloud,
                                styles.cloud4,
                                {
                                    transform: [
                                        {
                                            translateX: cloud4Anim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [-80, width],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        />

                        {/* Animated Plane */}
                        <Animated.View
                            style={[
                                styles.plane,
                                {
                                    opacity: planeOpacityAnim,
                                    transform: [
                                        { translateX: planeXAnim },
                                        { translateY: planeYAnim },
                                        {
                                            rotate: planeRotateAnim.interpolate({
                                                inputRange: [-5, 5],
                                                outputRange: ['-5deg', '5deg']
                                            })
                                        }
                                    ],
                                },
                            ]}
                        >
                            <FontAwesome name="plane" size={36} color="#FFFFFF" style={styles.planeIcon} />
                        </Animated.View>
                    </View>

                    {/* Progress bar */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressTrack}>
                            <Animated.View
                                style={[
                                    styles.progressBar,
                                    {
                                        width: progressAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', '100%'],
                                        }),
                                    },
                                ]}
                            />
                        </View>
                    </View>

                    {/* Travel planning log console */}
                    <View style={styles.logsContainer}>
                        <Text style={styles.logsTitle}>CREATING YOUR ITINERARY</Text>
                        <ScrollView
                            ref={scrollViewRef}
                            style={styles.logsScrollView}
                            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                        >
                            {displayedLogs.map((log, index) => (
                                <Text key={index} style={[
                                    styles.logText,
                                    { opacity: 1 - (displayedLogs.length - index) * 0.1 }
                                ]}>
                                    <Text style={styles.logPrefix}>→ </Text>
                                    {log}
                                </Text>
                            ))}
                            {logs.map((log, index) => (
                                <Text key={`user-${index}`} style={styles.userLogText}>
                                    <Text style={styles.userLogPrefix}>✓ </Text>
                                    {log}
                                </Text>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    gradient: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    animationContainer: {
        width: '100%',
        height: 150,
        marginBottom: 32,
        position: 'relative',
    },
    skyBackground: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    star: {
        position: 'absolute',
        width: 2,
        height: 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 1,
        opacity: 0.6,
    },
    cloud: {
        position: 'absolute',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
    },
    cloud1: {
        top: '30%',
        width: 60,
        height: 25,
        opacity: 0.3,
    },
    cloud2: {
        top: '60%',
        width: 70,
        height: 20,
        opacity: 0.2,
    },
    cloud3: {
        top: '40%',
        width: 50,
        height: 20,
        opacity: 0.25,
    },
    cloud4: {
        top: '70%',
        width: 80,
        height: 30,
        opacity: 0.2,
    },
    plane: {
        position: 'absolute',
        top: '45%',
        zIndex: 10,
    },
    planeIcon: {
        transform: [{ rotate: '45deg' }],
    },
    progressContainer: {
        width: '100%',
        marginBottom: 32,
    },
    progressTrack: {
        height: 4,
        backgroundColor: 'rgba(167, 139, 250, 0.2)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#a78bfa',
        borderRadius: 2,
    },
    logsContainer: {
        marginTop: Spacing.md,
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        borderRadius: BorderRadius.md,
        padding: Spacing.sm,
        maxHeight: 180,
        width: '95%',
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.3)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    logsTitle: {
        color: '#d8b4fe',
        fontFamily: FontFamily.montserratSemiBold,
        fontSize: 20,
        marginBottom: Spacing.sm,
        letterSpacing: 0.5,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    logsScrollView: {
        maxHeight: 150,
    },
    logText: {
        color: '#cbd5e1',
        fontFamily: FontFamily.montserratRegular,
        fontSize: 12,
        marginBottom: 6,
        letterSpacing: 0.2,
    },
    logPrefix: {
        color: '#a78bfa',
        fontWeight: '600',
    },
    userLogText: {
        color: '#94f3e4',
        fontFamily: FontFamily.montserratMedium,
        fontSize: 12,
        marginBottom: 6,
    },
    userLogPrefix: {
        color: '#10b981',
        fontWeight: '600',
    },
});

export default LoadingScreen;