import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, Easing, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FontFamily, Spacing, BorderRadius } from '../../constants/Theme';

const { width } = Dimensions.get('window');

// Add interface for component props
interface LoadingScreenProps {
    message?: string;
    logs?: string[];
}

const LoadingScreen = ({ message = 'Loading', logs = [] }: LoadingScreenProps) => {
    // Ref for loading dots
    const loadingDots = useRef('');
    const dotAnimationId = useRef<NodeJS.Timeout | null>(null);

    // Animated values
    const planeXAnim = useRef(new Animated.Value(-50)).current; // Horizontal movement
    const planeYAnim = useRef(new Animated.Value(0)).current; // Vertical movement
    const planeRotateAnim = useRef(new Animated.Value(0)).current; // Rotation for more dynamic flight
    const cloud1Anim = useRef(new Animated.Value(0)).current;
    const cloud2Anim = useRef(new Animated.Value(0)).current;
    const cloud3Anim = useRef(new Animated.Value(0)).current;
    const cloud4Anim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    // Create a ref for the scroll view to auto-scroll to the bottom
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        // Plane animation
        const animatePlane = () => {
            planeXAnim.setValue(-50);
            planeYAnim.setValue(0);
            planeRotateAnim.setValue(0);

            Animated.parallel([
                // Horizontal: Left to right with smoother easing
                Animated.timing(planeXAnim, {
                    toValue: width + 50,
                    duration: 6000, // Increased duration for smoother movement
                    easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Smoother easing curve
                    useNativeDriver: true,
                }),
                // Vertical: Continuous smooth up-and-down
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(planeYAnim, {
                            toValue: -15,
                            duration: 1500,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                        Animated.timing(planeYAnim, {
                            toValue: 15,
                            duration: 1500,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                    ]),
                    { iterations: 2 }
                ),
                // Enhanced rotation animation
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(planeRotateAnim, {
                            toValue: 8,
                            duration: 1500,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                        Animated.timing(planeRotateAnim, {
                            toValue: -8,
                            duration: 1500,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                    ]),
                    { iterations: 2 }
                ),
            ]).start(() => animatePlane());
        };
        animatePlane();

        // Enhanced cloud animations with different speeds and positions
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

        startCloudAnimation(cloud1Anim, 8000);
        startCloudAnimation(cloud2Anim, 12000, 2000);
        startCloudAnimation(cloud3Anim, 10000, 4000);
        startCloudAnimation(cloud4Anim, 15000, 6000);

        // Progress animation
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: 5000,
            useNativeDriver: false,
        }).start();

        // Loading dots
        dotAnimationId.current = setInterval(() => {
            loadingDots.current = loadingDots.current.length >= 3 ? '' : loadingDots.current + '.';
        }, 500);

        // Cleanup
        return () => {
            if (dotAnimationId.current) {
                clearInterval(dotAnimationId.current);
            }
            planeXAnim.stopAnimation();
            planeYAnim.stopAnimation();
            cloud1Anim.stopAnimation();
            cloud2Anim.stopAnimation();
            cloud3Anim.stopAnimation();
            cloud4Anim.stopAnimation();
            progressAnim.stopAnimation();
        };
    }, [planeXAnim, planeYAnim, cloud1Anim, cloud2Anim, cloud3Anim, cloud4Anim, progressAnim]);

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#1a202c', '#2d3748']} style={styles.gradient}>
                <View style={styles.content}>
                    {/* Flight animation container */}
                    <View style={styles.animationContainer}>
                        <LinearGradient
                            colors={['#2a4365', '#2c5282']}
                            style={styles.skyBackground}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                        >
                            {/* Stars */}
                            <View style={[styles.star, { top: '20%', left: '15%' }]} />
                            <View style={[styles.star, { top: '40%', left: '45%' }]} />
                            <View style={[styles.star, { top: '15%', right: '25%' }]} />
                            <View style={[styles.star, { top: '60%', right: '15%' }]} />
                            <View style={[styles.star, { top: '35%', right: '35%' }]} />
                            <View style={[styles.star, { top: '25%', left: '35%' }]} />
                            <View style={[styles.star, { top: '55%', left: '25%' }]} />
                            <View style={[styles.star, { top: '70%', left: '55%' }]} />
                        </LinearGradient>

                        {/* Flight path */}
                        <View style={styles.flightPath} />

                        {/* Clouds */}
                        <Animated.View
                            style={[
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

                    {/* Loading text */}
                    <View style={styles.loadingTextContainer}>
                        <Text style={styles.loadingText}>
                            {message}{loadingDots.current}
                        </Text>
                    </View>

                    {/* Agent progress logs */}
                    {logs.length > 0 && (
                        <View style={styles.logsContainer}>
                            <Text style={styles.logsTitle}>Agent Progress:</Text>
                            <ScrollView
                                ref={scrollViewRef}
                                style={styles.logsScrollView}
                                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                            >
                                {logs.map((log, index) => (
                                    <Text key={index} style={styles.logText}>
                                        {log}
                                    </Text>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a202c',
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
        width: 3,
        height: 3,
        backgroundColor: '#FFFFFF',
        borderRadius: 1.5,
        opacity: 0.7,
    },
    flightPath: {
        position: 'absolute',
        top: '45%', // Center between clouds
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: '#FFFFFF',
        opacity: 0.2,
        transform: [{ translateY: -0.5 }],
    },
    cloud1: {
        position: 'absolute',
        top: '30%',
        width: 48,
        height: 24,
        backgroundColor: '#FFFFFF',
        opacity: 0.3,
        borderRadius: 12,
    },
    cloud2: {
        position: 'absolute',
        top: '60%',
        width: 64,
        height: 20,
        backgroundColor: '#FFFFFF',
        opacity: 0.2,
        borderRadius: 10,
    },
    cloud3: {
        position: 'absolute',
        width: 60,
        height: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 15,
        top: '35%',
    },
    cloud4: {
        position: 'absolute',
        width: 70,
        height: 35,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 20,
        top: '65%',
    },
    plane: {
        position: 'absolute',
        top: '45%', // Center between clouds
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
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#3333ff',
    },
    loadingTextContainer: {
        width: '100%',
        marginBottom: 32,
    },
    loadingText: {
        fontSize: 18,
        fontFamily: FontFamily.montserratSemiBold,
        color: '#FFFFFF',
        textAlign: 'center',
    },
    logsContainer: {
        marginTop: Spacing.md,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: BorderRadius.md,
        padding: Spacing.sm,
        maxHeight: 150,
        width: '90%',
    },
    logsTitle: {
        color: '#FFFFFF',
        fontFamily: FontFamily.montserratMedium,
        fontSize: 14,
        marginBottom: Spacing.xs,
    },
    logsScrollView: {
        maxHeight: 120,
    },
    logText: {
        color: '#a0aec0',
        fontFamily: FontFamily.montserratRegular,
        fontSize: 12,
        marginBottom: 4,
    },
});

export default LoadingScreen;