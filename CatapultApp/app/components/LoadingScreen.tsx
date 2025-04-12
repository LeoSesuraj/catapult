import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontFamily } from '../../constants/Theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const { width, height } = Dimensions.get('window');

export default function LoadingScreen() {
    const planeX = useRef(new Animated.Value(-50)).current;
    const planeY = useRef(new Animated.Value(height * 0.5)).current;
    const planeRotation = useRef(new Animated.Value(0)).current;
    const planeScale = useRef(new Animated.Value(1)).current;
    const cloudOpacity1 = useRef(new Animated.Value(0)).current;
    const cloudOpacity2 = useRef(new Animated.Value(0)).current;
    const cloudOpacity3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Complex plane path animation
        const animatePlane = () => {
            const duration = 3000; // 3 seconds for one complete journey

            // Create a curved path using parallel animations
            Animated.parallel([
                // X movement
                Animated.sequence([
                    Animated.timing(planeX, {
                        toValue: width * 0.3,
                        duration: duration * 0.25,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(planeX, {
                        toValue: width * 0.7,
                        duration: duration * 0.5,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(planeX, {
                        toValue: width + 50,
                        duration: duration * 0.25,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                ]),
                // Y movement (curved path)
                Animated.sequence([
                    Animated.timing(planeY, {
                        toValue: height * 0.3,
                        duration: duration * 0.25,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(planeY, {
                        toValue: height * 0.7,
                        duration: duration * 0.5,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(planeY, {
                        toValue: height * 0.4,
                        duration: duration * 0.25,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                ]),
                // Rotation for dynamic movement
                Animated.sequence([
                    Animated.timing(planeRotation, {
                        toValue: 15,
                        duration: duration * 0.25,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(planeRotation, {
                        toValue: -15,
                        duration: duration * 0.5,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(planeRotation, {
                        toValue: 0,
                        duration: duration * 0.25,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                ]),
                // Scale animation for depth effect
                Animated.sequence([
                    Animated.timing(planeScale, {
                        toValue: 1.2,
                        duration: duration * 0.5,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(planeScale, {
                        toValue: 1,
                        duration: duration * 0.5,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true,
                    }),
                ]),
            ]).start();
        };

        animatePlane();

        // Enhanced cloud animations
        const animateCloud = (opacity: Animated.Value, delay: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(opacity, {
                        toValue: 1,
                        duration: 1200,
                        delay,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 0.2,
                        duration: 1200,
                        useNativeDriver: true,
                    })
                ])
            ).start();
        };

        animateCloud(cloudOpacity1, 0);
        animateCloud(cloudOpacity2, 400);
        animateCloud(cloudOpacity3, 800);
    }, []);

    const rotation = planeRotation.interpolate({
        inputRange: [-15, 15],
        outputRange: ['-15deg', '15deg']
    });

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1a202c', '#2d3748']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.content}>
                    {/* World Map Overlay */}
                    <View style={styles.worldMapOverlay} />

                    {/* Clouds */}
                    <Animated.View style={[styles.cloud, { opacity: cloudOpacity1, left: '10%', top: '20%' }]}>
                        <FontAwesome name="cloud" size={40} color="rgba(255,255,255,0.5)" />
                    </Animated.View>
                    <Animated.View style={[styles.cloud, { opacity: cloudOpacity2, left: '45%', top: '35%' }]}>
                        <FontAwesome name="cloud" size={35} color="rgba(255,255,255,0.5)" />
                    </Animated.View>
                    <Animated.View style={[styles.cloud, { opacity: cloudOpacity3, left: '75%', top: '25%' }]}>
                        <FontAwesome name="cloud" size={45} color="rgba(255,255,255,0.5)" />
                    </Animated.View>

                    {/* Animated Plane */}
                    <Animated.View
                        style={[
                            styles.plane,
                            {
                                transform: [
                                    { translateX: planeX },
                                    { translateY: planeY },
                                    { rotate: rotation },
                                    { scale: planeScale }
                                ]
                            }
                        ]}
                    >
                        <FontAwesome name="plane" size={40} color="#48BB78" />
                    </Animated.View>

                    <Text style={styles.text}>Planning your adventure...</Text>
                    <Text style={styles.subtext}>Your journey begins here</Text>
                </View>
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    worldMapOverlay: {
        position: 'absolute',
        width: '80%',
        height: '40%',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 200,
        top: '30%',
    },
    plane: {
        position: 'absolute',
        zIndex: 10,
    },
    cloud: {
        position: 'absolute',
        zIndex: 5,
    },
    text: {
        fontSize: 24,
        fontFamily: FontFamily.montserratBold,
        color: '#FFFFFF',
        marginTop: height * 0.4,
        textAlign: 'center',
    },
    subtext: {
        fontSize: 16,
        fontFamily: FontFamily.montserratMedium,
        color: '#A0AEC0',
        marginTop: 8,
        textAlign: 'center',
    },
}); 