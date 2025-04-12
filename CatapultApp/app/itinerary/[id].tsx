import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Feather from '@expo/vector-icons/Feather';
import Colors from '@/constants/Colors';
import { BorderRadius, FontFamily, FontSizes, Shadow, Spacing, TextStyle, CardStyle } from '@/constants/Theme';
import ChatButton from '@/components/ChatButton';

type ItineraryDay = {
    id: string;
    date: string;
    activities: ItineraryActivity[];
};

type ItineraryActivity = {
    id: string;
    time: string;
    title: string;
    description: string;
    location?: string;
    type: 'meal' | 'attraction' | 'transport' | 'accommodation' | 'free-time';
};

// Sample data
const TRIPS = {
    '1': {
        id: '1',
        destination: 'Paris, France',
        image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        dates: 'June 5-10',
        status: 'upcoming',
        days: [
            {
                id: 'day1',
                date: 'Monday, June 5',
                activities: [
                    {
                        id: 'a1',
                        time: '08:00',
                        title: 'Breakfast',
                        description: 'Enjoy a traditional French breakfast at your hotel',
                        type: 'meal'
                    },
                    {
                        id: 'a2',
                        time: '10:00',
                        title: 'Louvre Museum',
                        description: 'Visit the world-famous museum and see the Mona Lisa',
                        location: 'Rue de Rivoli, 75001 Paris, France',
                        type: 'attraction'
                    },
                    {
                        id: 'a3',
                        time: '13:00',
                        title: 'Lunch',
                        description: 'Try local cuisine at a nearby café',
                        type: 'meal'
                    },
                    {
                        id: 'a4',
                        time: '15:00',
                        title: 'Eiffel Tower',
                        description: 'Experience the iconic landmark of Paris',
                        location: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France',
                        type: 'attraction'
                    },
                    {
                        id: 'a5',
                        time: '19:00',
                        title: 'Dinner Cruise',
                        description: 'Enjoy a dinner cruise on the Seine River',
                        location: 'Bateaux Parisiens, Port de la Bourdonnais, 75007 Paris, France',
                        type: 'meal'
                    }
                ]
            },
            {
                id: 'day2',
                date: 'Tuesday, June 6',
                activities: [
                    {
                        id: 'b1',
                        time: '09:00',
                        title: 'Breakfast',
                        description: 'Enjoy breakfast at a local bakery',
                        type: 'meal'
                    },
                    {
                        id: 'b2',
                        time: '10:30',
                        title: 'Notre-Dame Cathedral',
                        description: 'Visit the historic cathedral',
                        location: '6 Parvis Notre-Dame - Pl. Jean-Paul II, 75004 Paris, France',
                        type: 'attraction'
                    },
                    {
                        id: 'b3',
                        time: '13:30',
                        title: 'Lunch',
                        description: 'Enjoy lunch at a bistro in the Latin Quarter',
                        type: 'meal'
                    },
                    {
                        id: 'b4',
                        time: '15:00',
                        title: 'Free Time',
                        description: 'Explore the shops and streets of Paris',
                        type: 'free-time'
                    },
                    {
                        id: 'b5',
                        time: '19:30',
                        title: 'Dinner',
                        description: 'Experience fine dining at a Parisian restaurant',
                        type: 'meal'
                    }
                ]
            }
        ]
    },
    '2': {
        id: '2',
        destination: 'Tokyo, Japan',
        image: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        dates: 'August 12-22',
        status: 'upcoming',
        days: [
            {
                id: 'day1',
                date: 'Saturday, August 12',
                activities: [
                    {
                        id: 'a1',
                        time: '09:00',
                        title: 'Breakfast',
                        description: 'Traditional Japanese breakfast at your hotel',
                        type: 'meal'
                    },
                    {
                        id: 'a2',
                        time: '10:30',
                        title: 'Senso-ji Temple',
                        description: 'Visit Tokyo\'s oldest temple',
                        location: '2 Chome-3-1 Asakusa, Taito City, Tokyo 111-0032, Japan',
                        type: 'attraction'
                    }
                ]
            }
        ]
    }
};

export default function ItineraryDetailScreen() {
    const { id } = useLocalSearchParams();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [activeDay, setActiveDay] = useState<string | null>(null);
    const [trip, setTrip] = useState<any>(null);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();

        if (id && typeof id === 'string') {
            // Get trip data based on ID
            const tripData = TRIPS[id];
            setTrip(tripData);
            if (tripData && tripData.days.length > 0) {
                setActiveDay(tripData.days[0].id);
            }
        }
    }, [id]);

    if (!trip) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={TextStyle.body}>Loading...</Text>
            </SafeAreaView>
        );
    }

    const activeDayData = trip.days.find((day: ItineraryDay) => day.id === activeDay);

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'meal':
                return 'utensils';
            case 'attraction':
                return 'map-marker';
            case 'transport':
                return 'car';
            case 'accommodation':
                return 'bed';
            case 'free-time':
                return 'coffee';
            default:
                return 'circle';
        }
    };

    const renderDay = ({ item }: { item: ItineraryDay }) => (
        <TouchableOpacity
            style={[
                styles.dayTab,
                activeDay === item.id && styles.activeDayTab
            ]}
            onPress={() => setActiveDay(item.id)}
        >
            <Text
                style={[
                    styles.dayTabText,
                    activeDay === item.id && styles.activeDayTabText
                ]}
            >
                {item.date.split(',')[0]}
            </Text>
        </TouchableOpacity>
    );

    const renderActivity = ({ item }: { item: ItineraryActivity }) => (
        <View style={styles.activityCard}>
            <View style={styles.activityTime}>
                <Text style={TextStyle.highlighted}>{item.time}</Text>
            </View>
            <View style={styles.activityContent}>
                <View style={styles.activityHeader}>
                    <FontAwesome name={getActivityIcon(item.type)} size={16} color={Colors.primary} style={styles.activityIcon} />
                    <Text style={TextStyle.subheading}>{item.title}</Text>
                </View>
                <Text style={TextStyle.body}>{item.description}</Text>
                {item.location && (
                    <View style={styles.locationContainer}>
                        <Feather name="map-pin" size={14} color={Colors.accent} style={styles.locationIcon} />
                        <Text style={styles.locationText}>{item.location}</Text>
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
            <Stack.Screen
                options={{
                    title: trip.destination,
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <FontAwesome name="chevron-left" size={16} color={Colors.darkGray} />
                        </TouchableOpacity>
                    )
                }}
            />

            <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                <Image source={{ uri: trip.image }} style={styles.headerImage} />
                <View style={styles.tripMeta}>
                    <Text style={TextStyle.heading}>{trip.destination}</Text>
                    <Text style={TextStyle.body}>{trip.dates}</Text>
                </View>
            </Animated.View>

            <View style={styles.daysContainer}>
                <FlatList
                    data={trip.days}
                    renderItem={renderDay}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.daysList}
                />
            </View>

            {activeDayData && (
                <Animated.View style={[styles.activitiesContainer, { opacity: fadeAnim }]}>
                    <Text style={styles.dayTitle}>{activeDayData.date}</Text>
                    <FlatList
                        data={activeDayData.activities}
                        renderItem={renderActivity}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.activitiesList}
                        showsVerticalScrollIndicator={false}
                    />
                </Animated.View>
            )}

            <ChatButton />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    backButton: {
        padding: 8,
    },
    header: {
        marginHorizontal: Spacing.lg,
        marginVertical: Spacing.md,
        ...CardStyle.container,
        overflow: 'hidden',
    },
    headerImage: {
        width: '100%',
        height: 120,
        resizeMode: 'cover',
    },
    tripMeta: {
        padding: Spacing.md,
    },
    daysContainer: {
        marginTop: Spacing.sm,
    },
    daysList: {
        paddingHorizontal: Spacing.lg,
    },
    dayTab: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        marginRight: Spacing.sm,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.offWhite,
        ...Shadow.subtle,
    },
    activeDayTab: {
        backgroundColor: Colors.primary,
    },
    dayTabText: {
        fontFamily: FontFamily.montserratMedium,
        fontSize: FontSizes.sm,
        color: Colors.darkGray,
    },
    activeDayTabText: {
        color: Colors.white,
    },
    dayTitle: {
        ...TextStyle.subheading,
        marginBottom: Spacing.md,
    },
    activitiesContainer: {
        flex: 1,
        marginTop: Spacing.md,
        paddingHorizontal: Spacing.lg,
    },
    activitiesList: {
        paddingBottom: Spacing.xl,
    },
    activityCard: {
        ...CardStyle.container,
        flexDirection: 'row',
        marginBottom: Spacing.md,
        overflow: 'hidden',
    },
    activityTime: {
        width: 60,
        padding: Spacing.sm,
        alignItems: 'center',
        justifyContent: 'flex-start',
        borderRightWidth: 1,
        borderRightColor: Colors.accent,
        paddingTop: Spacing.md,
    },
    activityContent: {
        flex: 1,
        padding: Spacing.md,
    },
    activityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    activityIcon: {
        marginRight: Spacing.sm,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
    locationIcon: {
        marginRight: Spacing.xs,
    },
    locationText: {
        fontSize: 12,
        color: Colors.accent,
        fontFamily: FontFamily.montserratRegular,
    },
}); 