import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View, Image, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Feather from '@expo/vector-icons/Feather';
import { getItinerary, Itinerary, ItineraryDay as StoredItineraryDay, ItineraryEvent as StoredItineraryEvent } from '../data/itineraryStorage';
import moment from 'moment';

// Constants that can be easily imported/generated
const THEME = {
    // Main colors
    BACKGROUND_GRADIENT_START: '#1a202c',
    BACKGROUND_GRADIENT_END: '#2d3748',
    TEXT_PRIMARY: '#E2E8F0',
    TEXT_SECONDARY: '#A0AEC0',
    TEXT_TERTIARY: '#718096',

    // UI element colors
    CARD_BACKGROUND: '#2d3748',
    CARD_BORDER: 'rgba(255, 255, 255, 0.1)',

    // Tab colors
    TAB_INACTIVE: '#4A5568',
    TAB_ACTIVE: '#A0AEC0',

    // Activity type colors
    ACTIVITY_MEAL: '#C1E1C1',          // Light green
    ACTIVITY_ATTRACTION: '#FFD1DC',     // Light pink
    ACTIVITY_TRANSPORT: '#B3D4FF',      // Light blue
    ACTIVITY_ACCOMMODATION: '#F0E68C',  // Light yellow
    ACTIVITY_FREE_TIME: '#D8BFD8'       // Light purple
};

// Activity type mapping for icons and colors (easily updatable)
const ACTIVITY_TYPE_CONFIG = {
    'meal': {
        icon: 'cutlery',
        color: THEME.ACTIVITY_MEAL
    },
    'attraction': {
        icon: 'map-marker',
        color: THEME.ACTIVITY_ATTRACTION
    },
    'transport': {
        icon: 'car',
        color: THEME.ACTIVITY_TRANSPORT
    },
    'accommodation': {
        icon: 'home',
        color: THEME.ACTIVITY_ACCOMMODATION
    },
    'free-time': {
        icon: 'coffee',
        color: THEME.ACTIVITY_FREE_TIME
    },
    'flight': {
        icon: 'plane',
        color: THEME.ACTIVITY_TRANSPORT
    },
    'hotel': {
        icon: 'building',
        color: THEME.ACTIVITY_ACCOMMODATION
    },
    'activity': {
        icon: 'map-marker',
        color: THEME.ACTIVITY_ATTRACTION
    },
    'calendar': {
        icon: 'calendar',
        color: THEME.ACTIVITY_FREE_TIME
    },
    'rest': {
        icon: 'coffee',
        color: THEME.ACTIVITY_FREE_TIME
    }
};

// Types that can be easily generated
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

type TripData = {
    id: string;
    destination: string;
    image: string;
    dates: string;
    status: string;
    days: ItineraryDay[];
};

// Sample data - this could be imported or generated
const TRIPS: { [key: string]: TripData } = {
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
    },
    '5': {
        id: '5',
        destination: 'Chicago, USA',
        image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        dates: 'July 15-20',
        status: 'upcoming',
        days: [
            {
                id: 'day1',
                date: 'Saturday, July 15',
                activities: [
                    {
                        id: 'a1',
                        time: '09:00',
                        title: 'Breakfast',
                        description: 'Start your day with breakfast at Wildberry Pancakes',
                        location: '130 E Randolph St, Chicago, IL 60601',
                        type: 'meal'
                    },
                    {
                        id: 'a2',
                        time: '10:30',
                        title: 'Millennium Park',
                        description: 'Visit Cloud Gate (The Bean) and explore the park',
                        location: '201 E Randolph St, Chicago, IL 60602',
                        type: 'attraction'
                    },
                    {
                        id: 'a3',
                        time: '13:00',
                        title: 'Deep Dish Pizza',
                        description: 'Lunch at Lou Malnati\'s Pizzeria',
                        location: '439 N Wells St, Chicago, IL 60654',
                        type: 'meal'
                    },
                    {
                        id: 'a4',
                        time: '15:00',
                        title: 'Art Institute',
                        description: 'Explore one of the oldest and largest art museums in the US',
                        location: '111 S Michigan Ave, Chicago, IL 60603',
                        type: 'attraction'
                    },
                    {
                        id: 'a5',
                        time: '19:00',
                        title: 'River Dinner Cruise',
                        description: 'Evening dinner cruise on the Chicago River',
                        location: 'Navy Pier, 600 E Grand Ave, Chicago, IL 60611',
                        type: 'meal'
                    }
                ]
            },
            {
                id: 'day2',
                date: 'Sunday, July 16',
                activities: [
                    {
                        id: 'b1',
                        time: '09:30',
                        title: 'Breakfast',
                        description: 'Breakfast at Yolk - Marina City',
                        type: 'meal'
                    },
                    {
                        id: 'b2',
                        time: '11:00',
                        title: 'Willis Tower',
                        description: 'Visit Skydeck Chicago at Willis Tower',
                        location: '233 S Wacker Dr, Chicago, IL 60606',
                        type: 'attraction'
                    },
                    {
                        id: 'b3',
                        time: '14:00',
                        title: 'Navy Pier',
                        description: 'Explore Navy Pier and enjoy lunch',
                        location: '600 E Grand Ave, Chicago, IL 60611',
                        type: 'attraction'
                    },
                    {
                        id: 'b4',
                        time: '17:00',
                        title: 'Magnificent Mile',
                        description: 'Shopping along Michigan Avenue',
                        location: 'N Michigan Ave, Chicago, IL 60611',
                        type: 'free-time'
                    },
                    {
                        id: 'b5',
                        time: '20:00',
                        title: 'Jazz Club',
                        description: 'Dinner and jazz at Andy\'s Jazz Club',
                        location: '11 E Hubbard St, Chicago, IL 60611',
                        type: 'meal'
                    }
                ]
            }
        ]
    }
};

// Main component - structured for easier generation
export default function ItineraryDetailScreen() {
    const params = useLocalSearchParams();
    const { id } = params;
    const [trip, setTrip] = useState<TripData | null>(null);
    const [storedItinerary, setStoredItinerary] = useState<Itinerary | null>(null);
    const [activeDay, setActiveDay] = useState<string | null>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [loading, setLoading] = useState(true);

    // Animation refs
    const scrollY = useRef(new Animated.Value(0)).current;
    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 1],
        extrapolate: 'clamp'
    });

    // Convert stored itinerary days to match our UI components if needed
    const convertedDays = storedItinerary?.itinerary.map((day: StoredItineraryDay, index: number) => {
        // Format the date to be more readable (e.g., "Monday, June 5")
        const formattedDate = day.date ? moment(day.date).format('dddd, MMMM D') : `Day ${index + 1}`;

        return {
            id: `day${index + 1}`,
            date: formattedDate,
            activities: day.events.map((event: StoredItineraryEvent, eventIndex: number) => {
                // Map the event type to one of the allowed activity types
                let mappedType: 'meal' | 'attraction' | 'transport' | 'accommodation' | 'free-time' = 'attraction';

                // Map event types to our UI types
                switch (event.type) {
                    case 'flight':
                        mappedType = 'transport';
                        break;
                    case 'hotel':
                        mappedType = 'accommodation';
                        break;
                    case 'meal':
                        mappedType = 'meal';
                        break;
                    case 'activity':
                        mappedType = 'attraction';
                        break;
                    case 'rest':
                        mappedType = 'free-time';
                        break;
                    default:
                        mappedType = 'attraction';
                }

                return {
                    id: `e${index + 1}-${eventIndex}`,
                    time: event.time,
                    title: event.title,
                    description: event.description,
                    location: event.location,
                    type: mappedType
                };
            })
        };
    }) || [];

    // Use stored itinerary if available, otherwise fallback to static data
    const displayDays = storedItinerary ? convertedDays : (trip?.days || []);

    useEffect(() => {
        // Load trip data from static data source
        console.log(`Loading trip data for ID: "${id}"`);
        const tripData = TRIPS[id as string];
        if (tripData) {
            console.log("Found predefined trip data");
            setTrip(tripData);
        } else {
            console.log("No predefined trip, creating default structure");
            // Create default trip data when not in static list
            const defaultTrip: TripData = {
                id: id as string,
                destination: 'Your Trip',
                image: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
                dates: 'Your Trip Dates',
                status: 'upcoming',
                days: []
            };
            setTrip(defaultTrip);
        }

        // Load stored itinerary from AsyncStorage
        const loadStoredItinerary = async () => {
            try {
                console.log("Loading stored itinerary from AsyncStorage...");
                const itineraryData = await getItinerary();
                if (itineraryData) {
                    console.log(`Loaded itinerary with ${itineraryData.itinerary.length} days`);
                    setStoredItinerary(itineraryData);
                } else {
                    console.log("No stored itinerary found");
                }
            } catch (error) {
                console.error('Error loading stored itinerary:', error);
            } finally {
                // Mark loading as done regardless of result
                setLoading(false);
            }
        };

        loadStoredItinerary();
    }, [id]);

    // Set active day when data is available
    useEffect(() => {
        // Set first day as active when data becomes available
        if (displayDays && displayDays.length > 0 && !activeDay) {
            setActiveDay(displayDays[0].id);
        }
    }, [displayDays, activeDay]);

    // Effects
    useEffect(() => {
        // Fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    // Loading state
    if (loading) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={[THEME.BACKGROUND_GRADIENT_START, THEME.BACKGROUND_GRADIENT_END]}
                    style={styles.gradient}
                >
                    <SafeAreaView style={styles.safeArea}>
                        <Text style={styles.loadingText}>Loading...</Text>
                    </SafeAreaView>
                </LinearGradient>
            </View>
        );
    }

    // Get active day data
    const activeDayData = displayDays.find((day) => day.id === activeDay);

    // Helper functions
    const getActivityIcon = (type: string): any => {
        return ACTIVITY_TYPE_CONFIG[type as keyof typeof ACTIVITY_TYPE_CONFIG]?.icon || 'circle';
    };

    const getActivityColor = (type: string): string => {
        return ACTIVITY_TYPE_CONFIG[type as keyof typeof ACTIVITY_TYPE_CONFIG]?.color || THEME.TEXT_PRIMARY;
    };

    // Render functions
    const renderDay = ({ item }: { item: ItineraryDay }) => (
        <TouchableOpacity
            style={[
                styles.dayTab,
                activeDay === item.id && styles.activeDayTab
            ]}
            onPress={() => setActiveDay(item.id)}
            activeOpacity={0.8}
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
                <Text style={styles.timeText}>{item.time}</Text>
            </View>
            <View style={styles.activityContent}>
                <View style={styles.activityHeader}>
                    <FontAwesome
                        name={getActivityIcon(item.type)}
                        size={16}
                        color={getActivityColor(item.type)}
                        style={styles.activityIcon}
                    />
                    <Text style={styles.activityTitle}>{item.title}</Text>
                </View>
                <Text style={styles.activityDescription}>{item.description}</Text>
                {item.location && (
                    <View style={styles.locationContainer}>
                        <Feather name="map-pin" size={14} color={THEME.TEXT_SECONDARY} style={styles.locationIcon} />
                        <Text style={styles.locationText}>{item.location}</Text>
                    </View>
                )}
            </View>
        </View>
    );

    // Main render
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[THEME.BACKGROUND_GRADIENT_START, THEME.BACKGROUND_GRADIENT_END]}
                style={styles.gradient}
            >
                <SafeAreaView style={styles.safeArea}>
                    <Stack.Screen
                        options={{
                            title: trip?.destination || 'Trip Details',
                            headerShown: true,
                            headerTransparent: true,
                            headerTintColor: THEME.TEXT_PRIMARY,
                            headerTitleStyle: styles.headerTitle,
                            headerLeft: () => (
                                <TouchableOpacity
                                    onPress={() => router.push('/')}
                                    style={styles.backButton}
                                >
                                    <FontAwesome name="chevron-left" size={16} color={THEME.TEXT_PRIMARY} />
                                </TouchableOpacity>
                            )
                        }}
                    />

                    <View style={styles.content}>
                        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
                            <Image source={{ uri: trip?.image || 'https://images.unsplash.com/photo-1488085061387-422e29b40080?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' }} style={styles.headerImage} />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.7)']}
                                style={styles.imageOverlay}
                            />
                            <View style={styles.tripMeta}>
                                <Text style={styles.destinationText}>{trip?.destination || 'Your Trip'}</Text>
                                <Text style={styles.datesText}>{trip?.dates || 'Your Trip Dates'}</Text>
                            </View>
                        </Animated.View>

                        <View style={styles.daysContainer}>
                            <FlatList
                                data={displayDays}
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
                    </View>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
}

// Styles - organized for easier generation and modification
const styles = StyleSheet.create({
    // Main container styles
    container: {
        flex: 1,
        backgroundColor: THEME.BACKGROUND_GRADIENT_START,
    },
    gradient: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingTop: 60, // Account for the header
    },
    loadingText: {
        fontSize: 16,
        color: THEME.TEXT_PRIMARY,
        textAlign: 'center',
        marginTop: 50,
    },

    // Header styles
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 18,
        color: THEME.TEXT_PRIMARY,
    },
    header: {
        marginHorizontal: 20,
        marginTop: 10,
        marginBottom: 15,
        borderRadius: 15,
        overflow: 'hidden',
        height: 150,
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imageOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '70%',
    },
    tripMeta: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 15,
    },
    destinationText: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 22,
        color: THEME.TEXT_PRIMARY,
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    datesText: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 14,
        color: THEME.TEXT_PRIMARY,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },

    // Days tabs styles
    daysContainer: {
        marginTop: 5,
    },
    daysList: {
        paddingHorizontal: 20,
    },
    dayTab: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginRight: 8,
        borderRadius: 8,
        backgroundColor: THEME.TAB_INACTIVE,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    activeDayTab: {
        backgroundColor: THEME.TAB_ACTIVE,
    },
    dayTabText: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 14,
        color: THEME.TEXT_PRIMARY,
        opacity: 0.7,
    },
    activeDayTabText: {
        color: THEME.TEXT_PRIMARY,
        opacity: 1,
    },
    dayTitle: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 18,
        color: THEME.TEXT_PRIMARY,
        marginBottom: 16,
    },

    // Activities styles
    activitiesContainer: {
        flex: 1,
        marginTop: 15,
        paddingHorizontal: 20,
    },
    activitiesList: {
        paddingBottom: 30,
    },
    activityCard: {
        backgroundColor: THEME.CARD_BACKGROUND,
        borderRadius: 12,
        flexDirection: 'row',
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: THEME.CARD_BORDER,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    activityTime: {
        width: 60,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'flex-start',
        borderRightWidth: 1,
        borderRightColor: 'rgba(255, 255, 255, 0.1)',
        paddingTop: 16,
    },
    timeText: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 14,
        color: THEME.TEXT_SECONDARY,
    },
    activityContent: {
        flex: 1,
        padding: 16,
    },
    activityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    activityIcon: {
        marginRight: 8,
    },
    activityTitle: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 16,
        color: THEME.TEXT_PRIMARY,
    },
    activityDescription: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 14,
        color: THEME.TEXT_SECONDARY,
        lineHeight: 20,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    locationIcon: {
        marginRight: 4,
    },
    locationText: {
        fontSize: 12,
        color: THEME.TEXT_TERTIARY,
        fontFamily: 'Montserrat_400Regular',
    },
});