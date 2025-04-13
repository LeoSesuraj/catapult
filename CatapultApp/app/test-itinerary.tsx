import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    FlatList,
    Modal,
    TextInput,
    Alert,
    ScrollView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Feather from '@expo/vector-icons/Feather';
import { getItinerary, Itinerary, ItineraryDay as StoredItineraryDay, ItineraryEvent as StoredItineraryEvent, storeItinerary } from './data/itineraryStorage';
import moment from 'moment';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { updateTripItinerary, TripData } from './data/trips';
import { saveTripData, getTripData } from './utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllTrips } from './utils/storage';
import { useSurvey } from './survey/SurveyContext';

// Extended event interface
interface ExtendedItineraryEvent extends StoredItineraryEvent {
    isLocked?: boolean;
}

// Theme constants
const THEME = {
    BACKGROUND: '#1a202c',
    BACKGROUND_LIGHTER: '#2d3748',
    PRIMARY: '#4a6da7',
    SECONDARY: '#8aa9d6',
    ACCENT: '#6b8cae',
    TEXT_PRIMARY: '#E2E8F0',
    TEXT_SECONDARY: '#A0AEC0',
    TEXT_TERTIARY: '#718096',
    CARD_BACKGROUND: '#2d3748',
    CARD_BORDER: 'rgba(255, 255, 255, 0.1)',
    BORDER: '#3a4556',
    MEAL: '#68D391',
    ATTRACTION: '#F6AD55',
    TRANSPORT: '#63B3ED',
    ACCOMMODATION: '#B794F4',
    FREE_TIME: '#CBD5E0',
};

// Activity type config
const ACTIVITY_TYPE_CONFIG = {
    'meal': { icon: 'cutlery', color: THEME.MEAL },
    'attraction': { icon: 'map-marker', color: THEME.ATTRACTION },
    'transport': { icon: 'car', color: THEME.TRANSPORT },
    'accommodation': { icon: 'home', color: THEME.ACCOMMODATION },
    'free-time': { icon: 'coffee', color: THEME.FREE_TIME },
    'flight': { icon: 'plane', color: THEME.TRANSPORT },
    'hotel': { icon: 'building', color: THEME.ACCOMMODATION },
    'activity': { icon: 'map-marker', color: THEME.ATTRACTION },
    'calendar': { icon: 'calendar', color: THEME.FREE_TIME },
    'rest': { icon: 'coffee', color: THEME.FREE_TIME },
};

// Types
type ItineraryDay = {
    id: string;
    date: string;
    rawDate: string;
    activities: ItineraryActivity[];
};

type ItineraryActivity = {
    id: string;
    time: string;
    title: string;
    description: string;
    location?: string;
    type: 'meal' | 'attraction' | 'transport' | 'accommodation' | 'free-time';
    details?: any;
    isLocked?: boolean;
};

type FlightOption = {
    id: string;
    airline: string;
    flightNumber: string;
    departure: { airport: string; time: string; date: string };
    arrival: { airport: string; time: string; date: string };
    duration: string;
    price: string;
    stops: number;
};

// Mock flight data
const mockFlights: FlightOption[] = [
    { id: 'flight1', airline: 'United Airlines', flightNumber: 'UA123', departure: { airport: 'SFO', time: '08:30', date: '2023-07-15' }, arrival: { airport: 'JFK', time: '17:00', date: '2023-07-15' }, duration: '5h 30m', price: '$349', stops: 0 },
    { id: 'flight2', airline: 'Delta', flightNumber: 'DL456', departure: { airport: 'SFO', time: '10:15', date: '2023-07-15' }, arrival: { airport: 'JFK', time: '18:45', date: '2023-07-15' }, duration: '5h 30m', price: '$289', stops: 1 },
    { id: 'flight3', airline: 'American Airlines', flightNumber: 'AA789', departure: { airport: 'SFO', time: '14:20', date: '2023-07-15' }, arrival: { airport: 'JFK', time: '22:50', date: '2023-07-15' }, duration: '5h 30m', price: '$319', stops: 0 },
];

export default function ItineraryScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { id } = params;
    const [storedItinerary, setStoredItinerary] = useState<Itinerary | null>(null);
    const [trip, setTrip] = useState<TripData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeDay, setActiveDay] = useState<string | null>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [days, setDays] = useState<ItineraryDay[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<ItineraryActivity | null>(null);
    const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
    const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editTime, setEditTime] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editLocation, setEditLocation] = useState('');
    const [editType, setEditType] = useState<string>('');
    const [flightSelectionModalVisible, setFlightSelectionModalVisible] = useState(false);
    const [availableFlights, setAvailableFlights] = useState<FlightOption[]>([]);
    const [selectedFlight, setSelectedFlight] = useState<FlightOption | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [lockedEvents, setLockedEvents] = useState<string[]>([]);

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        const loadData = async () => {
            try {
                setLoading(true);
                let itineraryData: Itinerary | null = null;
                let tripData: TripData | null = null;

                // If we have a trip ID, load that specific trip and its itinerary
                if (id) {
                    const tripId = Array.isArray(id) ? id[0] : id;
                    tripData = await getTripData(tripId);
                    if (tripData?.itinerary) {
                        itineraryData = tripData.itinerary;
                    }
                } else {
                    // Otherwise load the default itinerary
                    itineraryData = await getItinerary();
                }

                if (itineraryData) {
                    setStoredItinerary(itineraryData);
                    const convertedDays = itineraryData.itinerary.map((day: StoredItineraryDay, index: number) => {
                        const formattedDate = day.date ? moment(day.date).format('ddd, MMM D') : `Day ${index + 1}`;
                        return {
                            id: `day${index + 1}`,
                            date: formattedDate,
                            rawDate: day.date,
                            activities: day.events.map((event: ExtendedItineraryEvent, eventIndex: number) => {
                                let mappedType: 'meal' | 'attraction' | 'transport' | 'accommodation' | 'free-time' = 'attraction';
                                switch (event.type) {
                                    case 'flight':
                                    case 'transport':
                                        mappedType = 'transport';
                                        break;
                                    case 'hotel':
                                    case 'accommodation':
                                        mappedType = 'accommodation';
                                        break;
                                    case 'meal':
                                        mappedType = 'meal';
                                        break;
                                    case 'activity':
                                    case 'attraction':
                                        mappedType = 'attraction';
                                        break;
                                    case 'rest':
                                    case 'free-time':
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
                                    type: mappedType,
                                    details: event.details,
                                    isLocked: event.isLocked,
                                };
                            }).sort((a, b) => a.time.localeCompare(b.time)),
                        };
                    });
                    setDays(convertedDays);
                }

                if (tripData) {
                    setTrip(tripData);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    useEffect(() => {
        if (days.length > 0 && !activeDay) {
            setActiveDay(days[0].id);
        }
    }, [days, activeDay]);

    useEffect(() => {
        if (modalVisible) {
            Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, damping: 15, stiffness: 100 }).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [modalVisible]);

    const saveChangesToStorage = async (updatedDays: ItineraryDay[]) => {
        if (!storedItinerary) return;

        try {
            const updatedItinerary: Itinerary = {
                itinerary: updatedDays.map(day => ({
                    date: day.rawDate,
                    events: day.activities.map(activity => ({
                        type: activity.type,
                        title: activity.title,
                        time: activity.time,
                        location: activity.location || '',
                        description: activity.description,
                        details: activity.details || {},
                        isLocked: activity.isLocked,
                    })),
                })),
            };

            // Store the updated itinerary
            await storeItinerary(updatedItinerary);

            // If we have a trip ID, update that trip with the new itinerary
            if (id) {
                const tripId = Array.isArray(id) ? id[0] : id;
                await updateTripItinerary(tripId, updatedItinerary);

                // Also update the trip data in storage
                if (trip) {
                    const updatedTrip = {
                        ...trip,
                        itinerary: updatedItinerary
                    };
                    await saveTripData(updatedTrip);
                }
            } else {
                // Create a new trip only if we're not already editing an existing one
                // Create a trip location from the first event's location
                const firstLocation = updatedItinerary.itinerary[0]?.events[0]?.location || 'New Trip';
                const startDate = updatedItinerary.itinerary[0]?.date || new Date().toISOString();
                const endDate = updatedItinerary.itinerary[updatedItinerary.itinerary.length - 1]?.date ||
                    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

                // Format dates for the trip UI
                const formattedDates = `${moment(startDate).format('MMM D')} - ${moment(endDate).format('MMM D, YYYY')}`;

                // Create or update trip data
                const tripData: TripData = {
                    reason_for_trip: 'Personal',
                    location: firstLocation,
                    start_time: startDate,
                    end_time: endDate,
                    budget: 1000,
                    itinerary: updatedItinerary
                };

                // Save the trip data and get the ID
                const tripId = await saveTripData(tripData);
                setTrip({ ...tripData, id: tripId });

                console.log("Trip saved with ID:", tripId);

                // Show success message
                Alert.alert(
                    "Trip Saved",
                    "Your trip has been saved successfully.",
                    [
                        {
                            text: "View My Trips",
                            onPress: () => {
                                router.replace('/');
                            }
                        },
                        {
                            text: "Continue Editing",
                            style: "cancel"
                        }
                    ]
                );
            }
        } catch (error) {
            console.error("Failed to save changes:", error);
            Alert.alert("Error", "Failed to save changes. Please try again.");
        }
    };

    const handleEventPress = (event: ItineraryActivity, dayIndex: number, eventIndex: number) => {
        if (event.type === 'transport' && event.details?.isFlight) {
            setSelectedEvent(event);
            setSelectedDayIndex(dayIndex);
            setSelectedEventIndex(eventIndex);
            setAvailableFlights(mockFlights);
            setSelectedFlight(event.details?.flightOption || null);
            setFlightSelectionModalVisible(true);
        } else {
            setSelectedEvent(event);
            setSelectedDayIndex(dayIndex);
            setSelectedEventIndex(eventIndex);
            setEditTitle(event.title);
            setEditTime(event.time);
            setEditDescription(event.description);
            setEditLocation(event.location || '');
            setEditType(event.type);
            setModalVisible(true);
        }
    };

    const handleDeleteEvent = () => {
        if (selectedDayIndex !== null && selectedEventIndex !== null) {
            Alert.alert("Delete Event", "Are you sure you want to delete this event?", [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        const updatedDays = [...days];
                        updatedDays[selectedDayIndex].activities.splice(selectedEventIndex, 1);
                        setDays(updatedDays);
                        saveChangesToStorage(updatedDays);
                        setModalVisible(false);
                    },
                },
            ]);
        }
    };

    const handleUpdateEvent = () => {
        if (selectedDayIndex !== null && selectedEventIndex !== null) {
            const updatedDays = [...days];
            const currentTime = updatedDays[selectedDayIndex].activities[selectedEventIndex].time;
            const timeChanged = currentTime !== editTime;
            updatedDays[selectedDayIndex].activities[selectedEventIndex] = {
                ...updatedDays[selectedDayIndex].activities[selectedEventIndex],
                title: editTitle,
                time: editTime,
                description: editDescription,
                location: editLocation,
                type: editType as any,
                isLocked: selectedEvent?.isLocked,
            };
            updatedDays[selectedDayIndex].activities.sort((a, b) => a.time.localeCompare(b.time));
            setDays(updatedDays);
            saveChangesToStorage(updatedDays);
            setModalVisible(false);
            if (timeChanged) {
                Alert.alert("Event Updated", "Event time was changed and schedule was reorganized.");
            }
        }
    };

    const handleAddEvent = () => {
        if (days.length === 0) return;

        const newEventActivity: ItineraryActivity = {
            id: `e${Date.now()}`,
            time: "12:00",
            title: "New Event",
            description: "Add description",
            location: trip?.location || "",
            type: 'attraction'
        };

        setSelectedEvent(newEventActivity);
        setSelectedDayIndex(0);
        setSelectedEventIndex(days[0].activities.length);
        setEditTitle(newEventActivity.title);
        setEditTime(newEventActivity.time);
        setEditDescription(newEventActivity.description);
        setEditLocation(newEventActivity.location || '');
        setEditType(newEventActivity.type);
        setModalVisible(true);
    };

    const handleSaveNewEvent = () => {
        if (selectedDayIndex === null) return;

        const newEvent: ItineraryActivity = {
            id: `e${Date.now()}`,
            time: editTime,
            title: editTitle,
            description: editDescription,
            location: editLocation,
            type: editType as any,
        };

        const updatedDays = [...days];
        updatedDays[selectedDayIndex].activities.push(newEvent);
        updatedDays[selectedDayIndex].activities.sort((a, b) => a.time.localeCompare(b.time));
        setDays(updatedDays);
        saveChangesToStorage(updatedDays);
        setModalVisible(false);
    };

    const handleCancelEvent = () => {
        if (selectedDayIndex !== null && selectedEventIndex !== null) {
            Alert.alert("Cancel Event", "Would you like to find an alternative event?", [
                { text: "Just Cancel", style: "destructive", onPress: () => handleDeleteEvent() },
                {
                    text: "Find Alternative",
                    onPress: () => {
                        Alert.alert("Finding Alternatives", "We'll suggest alternative events (Coming soon)");
                        setModalVisible(false);
                    },
                },
                { text: "Cancel", style: "cancel" },
            ]);
        }
    };

    const toggleEventLock = (eventId: string, dayIndex: number, eventIndex: number) => {
        const updatedDays = [...days];
        const event = updatedDays[dayIndex].activities[eventIndex];
        event.isLocked = !event.isLocked;
        setDays(updatedDays);
        saveChangesToStorage(updatedDays);
        if (event.isLocked) {
            setLockedEvents(prev => [...prev, eventId]);
        } else {
            setLockedEvents(prev => prev.filter(id => id !== eventId));
        }
        setSelectedEvent({ ...event });
    };

    const selectFlight = (flight: FlightOption) => {
        if (selectedDayIndex !== null && selectedEventIndex !== null) {
            const updatedDays = [...days];
            const event = updatedDays[selectedDayIndex].activities[selectedEventIndex];
            event.details = { ...event.details, flightOption: flight, isFlight: true };
            event.title = `Flight ${flight.flightNumber}: ${flight.departure.airport} to ${flight.arrival.airport}`;
            event.time = flight.departure.time;
            event.description = `${flight.airline} - ${flight.duration} - ${flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}`;
            setDays(updatedDays);
            saveChangesToStorage(updatedDays);
            setFlightSelectionModalVisible(false);
            Alert.alert("Flight Selected", "Your itinerary has been updated.");
        }
    };

    const getActivityIcon = (type: string): any => {
        return ACTIVITY_TYPE_CONFIG[type as keyof typeof ACTIVITY_TYPE_CONFIG]?.icon || 'circle';
    };

    const getActivityColor = (type: string): string => {
        return ACTIVITY_TYPE_CONFIG[type as keyof typeof ACTIVITY_TYPE_CONFIG]?.color || THEME.TEXT_PRIMARY;
    };

    const renderActivityItem = ({ item, index, dayIndex, drag }: {
        item: ItineraryActivity,
        index: number,
        dayIndex: number,
        drag?: () => void
    }) => {
        const isLocked = item.isLocked;
        const isFlight = item.type === 'transport' && item.details?.isFlight;

        return (
            <TouchableOpacity
                style={[styles.activityItem, isLocked && styles.activityItemLocked]}
                onPress={() => handleEventPress(item, dayIndex, index)}
                onLongPress={isLocked ? undefined : drag}
                activeOpacity={0.7}
            >
                <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{item.time}</Text>
                    {isFlight && <FontAwesome name="plane" size={14} color={THEME.TEXT_SECONDARY} style={styles.flightIcon} />}
                </View>
                <View style={[styles.activityContent, { borderLeftColor: getActivityColor(item.type) }]}>
                    <View style={styles.activityHeader}>
                        <FontAwesome name={getActivityIcon(item.type)} size={16} color={getActivityColor(item.type)} style={styles.activityIcon} />
                        <Text style={styles.activityTitle}>{item.title}</Text>
                        {isLocked && <Feather name="lock" size={14} color={THEME.ACCENT} style={styles.lockIcon} />}
                    </View>
                    {item.location && (
                        <View style={styles.locationRow}>
                            <Feather name="map-pin" size={12} color={THEME.TEXT_TERTIARY} />
                            <Text style={styles.locationText}>{item.location}</Text>
                        </View>
                    )}
                    {item.description && <Text style={styles.descriptionText}>{item.description}</Text>}
                </View>
            </TouchableOpacity>
        );
    };

    const renderDay = ({ item, index }: { item: ItineraryDay, index: number }) => (
        <View style={styles.dayContainer}>
            <View style={styles.dayHeader}>
                <Text style={styles.dayText}>{item.date}</Text>
                <Text style={styles.eventCountText}>
                    {item.activities.length} {item.activities.length === 1 ? 'event' : 'events'}
                </Text>
            </View>
            <View style={styles.activitiesContainer}>
                <DraggableFlatList
                    data={item.activities}
                    keyExtractor={(activity) => activity.id}
                    renderItem={({ item: activity, drag, getIndex }) =>
                        renderActivityItem({
                            item: activity,
                            index: getIndex() ?? 0,
                            dayIndex: index,
                            drag: isEditMode ? drag : undefined,
                        })
                    }
                    onDragEnd={({ data }) => {
                        setSelectedDayIndex(index);
                        const updatedDays = [...days];
                        updatedDays[index].activities = data;
                        setDays(updatedDays);
                        saveChangesToStorage(updatedDays);
                    }}
                    activationDistance={isEditMode ? 10 : 1000}
                />
            </View>
        </View>
    );

    const renderFlightOption = ({ item }: { item: FlightOption }) => {
        const isSelected = selectedFlight?.id === item.id;
        return (
            <TouchableOpacity
                style={[styles.flightCard, isSelected && styles.flightCardSelected]}
                onPress={() => selectFlight(item)}
            >
                <View style={styles.flightInfo}>
                    <Text style={styles.airlineName}>{item.airline} {item.flightNumber}</Text>
                    <View style={styles.flightTimes}>
                        <Text style={styles.flightTime}>{item.departure.time} {item.departure.airport}</Text>
                        <FontAwesome name="long-arrow-right" size={16} color={THEME.TEXT_SECONDARY} />
                        <Text style={styles.flightTime}>{item.arrival.time} {item.arrival.airport}</Text>
                    </View>
                    <Text style={styles.flightDetails}>
                        {item.duration} • {item.stops === 0 ? 'Nonstop' : `${item.stops} stop${item.stops > 1 ? 's' : ''}`}
                    </Text>
                </View>
                <View style={styles.flightPriceContainer}>
                    <Text style={styles.flightPrice}>{item.price}</Text>
                    <TouchableOpacity
                        style={[styles.selectFlightButton, isSelected && styles.selectedFlightButton]}
                        onPress={() => selectFlight(item)}
                    >
                        <Text style={styles.selectFlightButtonText}>{isSelected ? 'Selected' : 'Select'}</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading itinerary...</Text>
            </View>
        );
    }

    if (!storedItinerary || days.length === 0) {
        return (
            <View style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <Stack.Screen options={{ title: 'Itinerary', headerShown: true }} />
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>No Itinerary Found</Text>
                        <Text style={styles.emptyText}>Create a trip to generate an itinerary</Text>
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => {
                                router.push('/survey');
                            }}
                        >
                            <Text style={styles.createButtonText}>Create Trip</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <LinearGradient colors={[THEME.BACKGROUND, THEME.BACKGROUND_LIGHTER]} style={styles.gradient}>
                    <SafeAreaView style={styles.safeArea}>
                        <Stack.Screen options={{ headerShown: false }} />
                        <View style={styles.tripHeader}>
                            <View style={styles.headerRow}>
                                <TouchableOpacity
                                    onPress={() => {
                                        router.replace('/');
                                    }}
                                    style={styles.backButton}
                                >
                                    <Feather name="chevron-left" size={24} color={THEME.TEXT_PRIMARY} />
                                    <Text style={styles.backText}>Trips</Text>
                                </TouchableOpacity>
                                <View style={styles.headerRightContainer}>
                                    <TouchableOpacity
                                        style={styles.optionsButton}
                                        onPress={() => Alert.alert('Options', 'Share/Export coming soon')}
                                    >
                                        <Feather name="more-horizontal" size={24} color={THEME.TEXT_PRIMARY} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <Text style={styles.tripTitle}>
                                {trip?.location || storedItinerary.itinerary[0].events[0]?.location?.split(' → ')[1] || 'Trip Itinerary'}
                            </Text>
                            <Text style={styles.tripDates}>
                                {trip ?
                                    `${moment(trip.start_time).format('MMM D')} - ${moment(trip.end_time).format('MMM D, YYYY')}` :
                                    (storedItinerary.itinerary[0].date &&
                                        storedItinerary.itinerary[storedItinerary.itinerary.length - 1].date
                                        ? `${moment(storedItinerary.itinerary[0].date).format('MMM D')} - ${moment(storedItinerary.itinerary[storedItinerary.itinerary.length - 1].date).format('MMM D, YYYY')}`
                                        : '')
                                }
                            </Text>
                            <View style={styles.tripStats}>
                                <View style={styles.statTile}>
                                    <Text style={styles.statValue}>{days.length}</Text>
                                    <Text style={styles.statLabel}>Days</Text>
                                </View>
                                <View style={styles.statTile}>
                                    <Text style={styles.statValue}>{days.reduce((sum, day) => sum + day.activities.length, 0)}</Text>
                                    <Text style={styles.statLabel}>Events</Text>
                                </View>
                            </View>
                        </View>

                        <FlatList
                            data={days}
                            renderItem={renderDay}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContainer}
                            showsVerticalScrollIndicator={true}
                        />
                        <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                            <BlurView intensity={20} tint="dark" style={styles.modalOverlay}>
                                <Animated.View style={[styles.modalContent, {
                                    transform: [{
                                        translateY: fadeAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [1000, 0]
                                        })
                                    }]
                                }]}>
                                    <LinearGradient colors={[THEME.BACKGROUND, THEME.BACKGROUND_LIGHTER]} style={styles.modalGradient}>
                                        <View style={styles.modalHeader}>
                                            <Text style={styles.modalTitle}>Event Details</Text>
                                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                                <Feather name="x" size={24} color={THEME.TEXT_PRIMARY} />
                                            </TouchableOpacity>
                                        </View>
                                        {selectedEvent && (
                                            <ScrollView style={styles.modalScrollView}>
                                                <View style={styles.eventDetailsContainer}>
                                                    <View style={styles.eventTypeHeader}>
                                                        <FontAwesome
                                                            name={getActivityIcon(selectedEvent.type)}
                                                            size={24}
                                                            color={getActivityColor(selectedEvent.type)}
                                                        />
                                                        <Text style={styles.eventTypeText}>
                                                            {selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}
                                                        </Text>
                                                    </View>
                                                    <Text style={styles.eventDetailTitle}>{selectedEvent.title}</Text>

                                                    <View style={styles.eventTimeRow}>
                                                        <Feather name="clock" size={16} color={THEME.TEXT_SECONDARY} />
                                                        <Text style={styles.eventDetailText}>{selectedEvent.time}</Text>
                                                    </View>

                                                    {selectedEvent.location && (
                                                        <View style={styles.eventLocationRow}>
                                                            <Feather name="map-pin" size={16} color={THEME.TEXT_SECONDARY} />
                                                            <Text style={styles.eventDetailText}>{selectedEvent.location}</Text>
                                                        </View>
                                                    )}

                                                    {selectedEvent.description && (
                                                        <Text style={styles.eventDetailDescription}>{selectedEvent.description}</Text>
                                                    )}
                                                </View>
                                                <View style={styles.modalActions}>
                                                    {selectedEvent.id && (
                                                        <>
                                                            <TouchableOpacity
                                                                style={[styles.actionButton, selectedEvent.isLocked ? styles.unlockButton : styles.lockButton]}
                                                                onPress={() => {
                                                                    if (selectedDayIndex !== null && selectedEventIndex !== null) {
                                                                        toggleEventLock(selectedEvent.id, selectedDayIndex, selectedEventIndex);
                                                                    }
                                                                }}
                                                            >
                                                                <Feather
                                                                    name={selectedEvent.isLocked ? "unlock" : "lock"}
                                                                    size={18}
                                                                    color="#fff"
                                                                    style={styles.actionButtonIcon}
                                                                />
                                                                <Text style={styles.actionButtonText}>
                                                                    {selectedEvent.isLocked ? "Unlock Event" : "Lock Event"}
                                                                </Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                style={[styles.actionButton, styles.editButton]}
                                                                onPress={() => {
                                                                    // Show edit mode - future implementation
                                                                    Alert.alert("Edit Event", "Edit functionality coming soon");
                                                                }}
                                                            >
                                                                <Feather name="edit" size={18} color="#fff" style={styles.actionButtonIcon} />
                                                                <Text style={styles.actionButtonText}>Edit Event</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                style={[styles.actionButton, styles.deleteButton]}
                                                                onPress={handleDeleteEvent}
                                                            >
                                                                <Feather name="trash-2" size={18} color="#fff" style={styles.actionButtonIcon} />
                                                                <Text style={styles.actionButtonText}>Delete Event</Text>
                                                            </TouchableOpacity>
                                                        </>
                                                    )}
                                                </View>
                                            </ScrollView>
                                        )}
                                    </LinearGradient>
                                </Animated.View>
                            </BlurView>
                        </Modal>
                        <Modal animationType="fade" transparent visible={flightSelectionModalVisible} onRequestClose={() => setFlightSelectionModalVisible(false)}>
                            <BlurView intensity={20} tint="dark" style={styles.modalOverlay}>
                                <View style={styles.modalContent}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Select Flight</Text>
                                        <TouchableOpacity onPress={() => setFlightSelectionModalVisible(false)}>
                                            <Feather name="x" size={24} color={THEME.TEXT_PRIMARY} />
                                        </TouchableOpacity>
                                    </View>
                                    <FlatList
                                        data={availableFlights}
                                        keyExtractor={(item) => item.id}
                                        renderItem={renderFlightOption}
                                        contentContainerStyle={styles.flightList}
                                    />
                                    <View style={styles.flightModalFooter}>
                                        <Text style={styles.flightModalFooterText}>Flight selection updates itinerary automatically</Text>
                                    </View>
                                </View>
                            </BlurView>
                        </Modal>
                    </SafeAreaView>
                </LinearGradient>
            </GestureHandlerRootView>
        </View>
    );
}

// Styles
const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    safeArea: { flex: 1 },
    tripHeader: {
        padding: 16,
        backgroundColor: THEME.CARD_BACKGROUND,
        borderBottomWidth: 1,
        borderBottomColor: THEME.BORDER,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    backText: {
        color: THEME.TEXT_PRIMARY,
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 4,
    },
    headerRightContainer: { flexDirection: 'row' },
    optionsButton: { padding: 8 },
    tripTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: THEME.TEXT_PRIMARY,
        marginBottom: 8,
    },
    tripDates: {
        fontSize: 16,
        color: THEME.TEXT_SECONDARY,
        marginBottom: 16,
    },
    tripStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 8,
    },
    statTile: {
        flex: 1,
        backgroundColor: THEME.BACKGROUND_LIGHTER,
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
            android: { elevation: 2 },
        }),
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: THEME.TEXT_PRIMARY,
    },
    statLabel: {
        fontSize: 12,
        color: THEME.TEXT_SECONDARY,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: THEME.BACKGROUND,
    },
    loadingText: {
        fontSize: 16,
        color: THEME.TEXT_SECONDARY,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: THEME.TEXT_PRIMARY,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: THEME.TEXT_SECONDARY,
        marginBottom: 24,
        textAlign: 'center',
    },
    createButton: {
        backgroundColor: THEME.PRIMARY,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 120, // Add extra padding for the add button
    },
    dayContainer: { marginBottom: 24 },
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        marginBottom: 8,
    },
    dayText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: THEME.TEXT_PRIMARY,
    },
    eventCountText: {
        fontSize: 14,
        color: THEME.TEXT_TERTIARY,
    },
    activitiesContainer: { flex: 1 },
    activityItem: {
        flexDirection: 'row',
        backgroundColor: THEME.CARD_BACKGROUND,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: THEME.CARD_BORDER,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
            android: { elevation: 3 },
        }),
    },
    activityItemLocked: {
        borderColor: THEME.ACCENT,
        borderWidth: 2,
    },
    timeContainer: {
        width: 70,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: THEME.BACKGROUND,
    },
    timeText: {
        fontSize: 14,
        fontWeight: '600',
        color: THEME.TEXT_SECONDARY,
    },
    activityContent: {
        flex: 1,
        padding: 12,
        borderLeftWidth: 3,
    },
    activityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    activityIcon: { marginRight: 8 },
    activityTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: THEME.TEXT_PRIMARY,
    },
    lockIcon: { marginLeft: 8 },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    locationText: {
        fontSize: 14,
        color: THEME.TEXT_SECONDARY,
        marginLeft: 6,
    },
    descriptionText: {
        fontSize: 14,
        color: THEME.TEXT_TERTIARY,
        marginTop: 6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: THEME.BACKGROUND,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        width: '100%',
        position: 'absolute',
        bottom: 0,
    },
    modalGradient: { padding: 20 },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: THEME.TEXT_PRIMARY,
    },
    modalScrollView: { flex: 1 },
    eventDetailsContainer: { marginBottom: 24 },
    eventTypeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    eventTypeText: {
        fontSize: 18,
        fontWeight: '600',
        color: THEME.TEXT_SECONDARY,
        marginLeft: 12,
    },
    eventDetailTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: THEME.TEXT_PRIMARY,
        marginBottom: 16,
    },
    eventDetailText: {
        fontSize: 16,
        color: THEME.TEXT_PRIMARY,
        marginLeft: 8,
    },
    eventDetailDescription: {
        fontSize: 16,
        color: THEME.TEXT_PRIMARY,
        marginTop: 16,
        lineHeight: 24,
    },
    eventTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    eventLocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalActions: {
        marginTop: 24,
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        backgroundColor: THEME.PRIMARY,
    },
    actionButtonIcon: { marginRight: 8 },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    saveButton: { backgroundColor: THEME.SECONDARY },
    findAlternativeButton: { backgroundColor: THEME.PRIMARY },
    lockButton: { backgroundColor: THEME.ACCENT },
    unlockButton: { backgroundColor: THEME.TEXT_TERTIARY },
    editButton: { backgroundColor: THEME.PRIMARY },
    deleteButton: { backgroundColor: '#e53e3e' },
    flightCard: {
        flexDirection: 'row',
        backgroundColor: THEME.CARD_BACKGROUND,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: THEME.BORDER,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
            android: { elevation: 2 },
        }),
    },
    flightCardSelected: {
        borderColor: THEME.PRIMARY,
        borderWidth: 2,
    },
    flightInfo: { flex: 1 },
    airlineName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: THEME.TEXT_PRIMARY,
        marginBottom: 4,
    },
    flightTimes: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 8,
    },
    flightTime: {
        fontSize: 14,
        color: THEME.TEXT_SECONDARY,
    },
    flightDetails: {
        fontSize: 12,
        color: THEME.TEXT_TERTIARY,
    },
    flightPriceContainer: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    flightPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: THEME.TEXT_PRIMARY,
    },
    selectFlightButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: THEME.PRIMARY,
        borderRadius: 6,
        marginTop: 8,
    },
    selectedFlightButton: { backgroundColor: THEME.TEXT_TERTIARY },
    selectFlightButtonText: {
        color: '#fff',
        fontWeight: '500',
        fontSize: 14,
    },
    flightList: { paddingBottom: 16 },
    flightModalFooter: {
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: THEME.BORDER,
    },
    flightModalFooterText: {
        fontSize: 14,
        color: THEME.TEXT_TERTIARY,
        textAlign: 'center',
    },
    flightIcon: { marginTop: 8 },
});