import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FontFamily, Spacing, BorderRadius } from '../../constants/Theme';

const { width } = Dimensions.get('window');

const LoadingScreen = () => {
    // Ref for loading dots
    const loadingDots = useRef('');
    const dotAnimationId = useRef<NodeJS.Timeout | null>(null);

    // Animated values
    const planeXAnim = useRef(new Animated.Value(-50)).current; // Horizontal movement
    const planeYAnim = useRef(new Animated.Value(0)).current; // Vertical movement
    const planeRotateAnim = useRef(new Animated.Value(0)).current; // Rotation for more dynamic flight
    const cloud1Anim = useRef(new Animated.Value(0)).current;
    const cloud2Anim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Plane animation
        const animatePlane = () => {
            planeXAnim.setValue(-50);
            planeYAnim.setValue(0);
            planeRotateAnim.setValue(0);

            Animated.parallel([
                // Horizontal: Left to right with smooth easing
                Animated.timing(planeXAnim, {
                    toValue: width + 50,
                    duration: 10000,
                    easing: Easing.bezier(0.4, 0, 0.2, 1),
                    useNativeDriver: true,
                }),
                // Vertical: Continuous smooth up-and-down
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(planeYAnim, {
                            toValue: -12, // Increased amplitude
                            duration: 2500,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                        Animated.timing(planeYAnim, {
                            toValue: 12, // Increased amplitude
                            duration: 2500,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                    ]),
                    { iterations: 2 }
                ),
                // Rotation animation for more dynamic flight
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(planeRotateAnim, {
                            toValue: 5,
                            duration: 2500,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                        Animated.timing(planeRotateAnim, {
                            toValue: -5,
                            duration: 2500,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                    ]),
                    { iterations: 2 }
                ),
            ]).start(() => animatePlane());
        };
        animatePlane();

        // Cloud animations
        Animated.loop(
            Animated.sequence([
                Animated.timing(cloud1Anim, {
                    toValue: 1,
                    duration: 8000,
                    useNativeDriver: true,
                }),
                Animated.timing(cloud1Anim, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(cloud2Anim, {
                    toValue: 1,
                    duration: 12000,
                    useNativeDriver: true,
                }),
                Animated.timing(cloud2Anim, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Progress animation
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: 10000,
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
            progressAnim.stopAnimation();
        };
    }, [planeXAnim, planeYAnim, cloud1Anim, cloud2Anim, progressAnim]);

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
                    <Text style={styles.loadingText}>
                        Preparing Your Journey{loadingDots.current}
                    </Text>
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
    loadingText: {
        fontSize: 18,
        fontFamily: FontFamily.montserratSemiBold,
        color: '#FFFFFF',
        textAlign: 'center',
    },
});

export default LoadingScreen;