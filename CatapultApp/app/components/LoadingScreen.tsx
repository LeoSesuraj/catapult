import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, Easing, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FontFamily, Spacing, BorderRadius } from '../../constants/Theme';

const { width } = Dimensions.get('window');

interface LoadingScreenProps {
    message?: string;
    logs?: string[];
}

const LoadingScreen = ({ message = 'Loading', logs = [] }: LoadingScreenProps) => {
    const loadingDots = useRef('');
    const dotAnimationId = useRef<NodeJS.Timeout | null>(null);

    // Animated values
    const planeXAnim = useRef(new Animated.Value(-50)).current;
    const planeYAnim = useRef(new Animated.Value(0)).current;
    const planeRotateAnim = useRef(new Animated.Value(0)).current;
    const cloud1Anim = useRef(new Animated.Value(0)).current;
    const cloud2Anim = useRef(new Animated.Value(0)).current;
    const cloud3Anim = useRef(new Animated.Value(0)).current;
    const cloud4Anim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    // Scroll view ref
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        // Plane animation - continuous looping
        const animatePlane = () => {
            // Reset plane position to start
            planeXAnim.setValue(-50);

            // Create realistic flight animation
            Animated.parallel([
                // Horizontal: Left to right with natural easing
                Animated.timing(planeXAnim, {
                    toValue: width + 50,
                    duration: 10000, // Slower for more natural flight
                    easing: Easing.linear, // Linear for smooth continuous flight
                    useNativeDriver: true,
                }),

                // Gentle vertical movement - subtle up and down
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(planeYAnim, {
                            toValue: -8, // Reduced range for subtlety
                            duration: 2000,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                        Animated.timing(planeYAnim, {
                            toValue: 8, // Reduced range for subtlety
                            duration: 2000,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                    ]),
                    { iterations: 5 } // Match with the horizontal movement
                ),

                // Natural rotation that follows the flight path
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(planeRotateAnim, {
                            toValue: 5, // Reduced for subtlety
                            duration: 2000,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                        Animated.timing(planeRotateAnim, {
                            toValue: -5, // Reduced for subtlety
                            duration: 2000,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                    ]),
                    { iterations: 5 }
                ),
            ]).start(() => {
                // Loop animation continuously
                animatePlane();
            });
        };

        animatePlane();

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

        // Progress animation
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: 8000,
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
            planeRotateAnim.stopAnimation();
            cloud1Anim.stopAnimation();
            cloud2Anim.stopAnimation();
            cloud3Anim.stopAnimation();
            cloud4Anim.stopAnimation();
            progressAnim.stopAnimation();
        };
    }, [planeXAnim, planeYAnim, planeRotateAnim, cloud1Anim, cloud2Anim, cloud3Anim, cloud4Anim, progressAnim]);

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
                            <Text style={styles.logsTitle}>Progress:</Text>
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
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        borderRadius: BorderRadius.md,
        padding: Spacing.sm,
        maxHeight: 150,
        width: '90%',
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.3)',
    },
    logsTitle: {
        color: '#d8b4fe',
        fontFamily: FontFamily.montserratMedium,
        fontSize: 14,
        marginBottom: Spacing.xs,
    },
    logsScrollView: {
        maxHeight: 120,
    },
    logText: {
        color: '#cbd5e1',
        fontFamily: FontFamily.montserratRegular,
        fontSize: 12,
        marginBottom: 4,
    },
});

export default LoadingScreen;