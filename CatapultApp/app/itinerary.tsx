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
    DANGER: '#e53e3e',  // Red color for dangerous actions like delete
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
    const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
    const daysListRef = useRef<FlatList>(null);
    const mainListRef = useRef<FlatList>(null);

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        const loadData = async () => {
            try {
                setLoading(true);
                let itineraryData: Itinerary | null = null;
                let tripData: TripData | null = null;

                if (id) {
                    const tripId = Array.isArray(id) ? id[0] : id;
                    tripData = await getTripData(tripId);
                    if (tripData?.itinerary) {
                        itineraryData = tripData.itinerary;
                    }
                }

                if (!itineraryData) {
                    itineraryData = await getItinerary();
                }

                if (!itineraryData) {
                    itineraryData = {
                        itinerary: [
                            {
                                date: new Date().toISOString(),
                                events: [
                                    {
                                        type: 'activity',
                                        title: 'Sample Activity',
                                        time: '09:00',
                                        location: 'Sample Location',
                                        description: 'This is a sample activity',
                                        details: {},
                                    },
                                ],
                            },
                        ],
                    };
                }

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

                setStoredItinerary(itineraryData);
                setDays(convertedDays);

                if (tripData) {
                    setTrip(tripData);
                }
            } catch (error) {
                console.error('Error loading data:', error);
                const emptyItinerary = {
                    itinerary: [
                        {
                            date: new Date().toISOString(),
                            events: [
                                {
                                    type: 'activity',
                                    title: 'Start Planning',
                                    time: '09:00',
                                    location: 'Your First Stop',
                                    description: 'Begin your journey here',
                                    details: {},
                                },
                            ],
                        },
                    ],
                };
                setStoredItinerary(emptyItinerary);
                setDays([
                    {
                        id: 'day1',
                        date: moment().format('ddd, MMM D'),
                        rawDate: new Date().toISOString(),
                        activities: [
                            {
                                id: 'e1-1',
                                time: '09:00',
                                title: 'Start Planning',
                                description: 'Begin your journey here',
                                location: 'Your First Stop',
                                type: 'attraction',
                                details: {},
                            },
                        ],
                    },
                ]);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    useEffect(() => {
        if (modalVisible) {
            Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, damping: 15, stiffness: 100 }).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [modalVisible]);

    useEffect(() => {
        if (days.length > 0 && !activeDay) {
            setActiveDay(days[0].id);
        }
    }, [days, activeDay]);

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

            await storeItinerary(updatedItinerary);

            if (id) {
                const tripId = Array.isArray(id) ? id[0] : id;
                await updateTripItinerary(tripId, updatedItinerary);

                if (trip) {
                    const updatedTrip = {
                        ...trip,
                        itinerary: updatedItinerary,
                    };
                    await saveTripData(updatedTrip);
                }
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
                    {isFlight && (
                        <FontAwesome
                            name="plane"
                            size={16}
                            color={THEME.TEXT_SECONDARY}
                            style={styles.flightIcon}
                        />
                    )}
                </View>
                <View style={[styles.activityContent, { borderLeftColor: getActivityColor(item.type) }]}>
                    <View style={styles.activityHeader}>
                        <FontAwesome
                            name={isFlight ? "plane" : getActivityIcon(item.type)}
                            size={16}
                            color={getActivityColor(item.type)}
                            style={[
                                styles.activityIcon,
                                isFlight && styles.flightIconRotated
                            ]}
                        />
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
                <View style={styles.dayHeaderRight}>
                    <Text style={styles.eventCountText}>
                        {item.activities.length} {item.activities.length === 1 ? 'event' : 'events'}
                    </Text>
                    {isEditMode && (
                        <TouchableOpacity
                            style={styles.addEventButton}
                            onPress={() => Alert.alert("Coming soon", "Add event functionality will be available soon")}
                        >
                            <Feather name="plus" size={16} color={THEME.PRIMARY} />
                        </TouchableOpacity>
                    )}
                </View>
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
                <View style={styles.flightHeader}>
                    <Text style={styles.airlineName}>{item.airline}</Text>
                    <Text style={styles.flightNumber}>{item.flightNumber}</Text>
                </View>
                <View style={styles.flightTimes}>
                    <View style={styles.flightTimeColumn}>
                        <Text style={styles.flightTimeLabel}>Departure</Text>
                        <Text style={styles.flightTime}>{item.departure.time}</Text>
                        <Text style={styles.flightAirport}>{item.departure.airport}</Text>
                    </View>
                    <View style={styles.flightDurationContainer}>
                        <Text style={styles.flightDuration}>{item.duration}</Text>
                        <View style={styles.flightPath}>
                            <View style={styles.flightPathLine} />
                            <FontAwesome name="plane" size={16} color={THEME.TEXT_SECONDARY} />
                        </View>
                        <Text style={styles.flightStops}>
                            {item.stops === 0 ? 'Nonstop' : `${item.stops} stop${item.stops > 1 ? 's' : ''}`}
                        </Text>
                    </View>
                    <View style={styles.flightTimeColumn}>
                        <Text style={styles.flightTimeLabel}>Arrival</Text>
                        <Text style={styles.flightTime}>{item.arrival.time}</Text>
                        <Text style={styles.flightAirport}>{item.arrival.airport}</Text>
                    </View>
                </View>
                <View style={styles.flightFooter}>
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

    const scrollToDay = (dayId: string) => {
        const dayIndex = days.findIndex(day => day.id === dayId);
        if (dayIndex !== -1 && mainListRef.current) {
            mainListRef.current.scrollToIndex({
                index: dayIndex,
                animated: true,
                viewPosition: 0
            });
        }
        setSelectedDayId(dayId);
    };

    const renderDayTab = ({ item }: { item: ItineraryDay }) => (
        <TouchableOpacity
            style={[styles.dayTab, selectedDayId === item.id && styles.dayTabSelected]}
            onPress={() => scrollToDay(item.id)}
        >
            <Text style={[styles.dayTabText, selectedDayId === item.id && styles.dayTabTextSelected]}>
                {moment(item.rawDate).format('ddd')}
            </Text>
            <Text style={[styles.dayTabDate, selectedDayId === item.id && styles.dayTabDateSelected]}>
                {moment(item.rawDate).format('D')}
            </Text>
        </TouchableOpacity>
    );

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
                            onPress={() => router.push('/survey')}
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
            <SafeAreaView style={styles.safeArea}>
                <Stack.Screen
                    options={{
                        headerShown: false
                    }}
                />
                <TouchableOpacity
                    onPress={() => router.replace('/')}
                    style={styles.backButton}
                >
                    <Feather name="chevron-left" size={28} color={THEME.TEXT_PRIMARY} />
                </TouchableOpacity>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.headerTitle}>
                            {trip?.location || storedItinerary.itinerary[0].events[0]?.location?.split(' → ')[1] || 'Trip Itinerary'}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            {trip
                                ? `${moment(trip.start_time).format('MMM D')} - ${moment(trip.end_time).format('MMM D, YYYY')}`
                                : storedItinerary.itinerary[0].date && storedItinerary.itinerary[storedItinerary.itinerary.length - 1].date
                                    ? `${moment(storedItinerary.itinerary[0].date).format('MMM D')} - ${moment(storedItinerary.itinerary[storedItinerary.itinerary.length - 1].date).format('MMM D, YYYY')}`
                                    : ''}
                        </Text>
                    </View>

                    <View style={styles.daysTabContainer}>
                        <FlatList
                            ref={daysListRef}
                            data={days}
                            renderItem={renderDayTab}
                            keyExtractor={(item) => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.daysTabList}
                        />
                    </View>

                    <FlatList
                        ref={mainListRef}
                        data={days}
                        renderItem={renderDay}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={true}
                        initialNumToRender={7}
                        maxToRenderPerBatch={10}
                        windowSize={10}
                        onScrollToIndexFailed={(info) => {
                            const wait = new Promise(resolve => setTimeout(resolve, 500));
                            wait.then(() => {
                                mainListRef.current?.scrollToIndex({ index: info.index, animated: true });
                            });
                        }}
                    />
                    <Modal
                        visible={modalVisible}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <BlurView intensity={20} tint="dark" style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <LinearGradient
                                    colors={[THEME.BACKGROUND, THEME.BACKGROUND_LIGHTER]}
                                    style={styles.modalGradient}
                                >
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Event Details</Text>
                                        <TouchableOpacity
                                            onPress={() => setModalVisible(false)}
                                            style={styles.closeButton}
                                        >
                                            <Feather name="x" size={24} color={THEME.TEXT_PRIMARY} />
                                        </TouchableOpacity>
                                    </View>

                                    {selectedEvent && (
                                        <ScrollView style={styles.modalBody}>
                                            <View style={styles.eventTypeHeader}>
                                                <FontAwesome
                                                    name={selectedEvent.type === 'transport' && selectedEvent.details?.isFlight
                                                        ? "plane"
                                                        : getActivityIcon(selectedEvent.type)}
                                                    size={24}
                                                    color={getActivityColor(selectedEvent.type)}
                                                    style={[
                                                        styles.eventTypeIcon,
                                                        selectedEvent.type === 'transport' && selectedEvent.details?.isFlight && styles.flightIconRotated
                                                    ]}
                                                />
                                                <Text style={styles.eventTypeText}>
                                                    {selectedEvent.type === 'transport' && selectedEvent.details?.isFlight
                                                        ? 'Flight'
                                                        : selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}
                                                </Text>
                                            </View>

                                            <View style={styles.eventDetails}>
                                                <Text style={styles.eventTitle}>{selectedEvent.title}</Text>
                                                <Text style={styles.eventTime}>{selectedEvent.time}</Text>
                                                {selectedEvent.location && (
                                                    <View style={styles.eventLocation}>
                                                        <Feather name="map-pin" size={16} color={THEME.TEXT_SECONDARY} />
                                                        <Text style={styles.eventLocationText}>{selectedEvent.location}</Text>
                                                    </View>
                                                )}
                                                {selectedEvent.description && (
                                                    <Text style={styles.eventDescription}>{selectedEvent.description}</Text>
                                                )}
                                            </View>

                                            <View style={styles.actionButtons}>
                                                <TouchableOpacity
                                                    style={[styles.actionButton, styles.lockButton]}
                                                    onPress={() => toggleEventLock(selectedEvent.id, selectedDayIndex!, selectedEventIndex!)}
                                                >
                                                    <Feather
                                                        name={selectedEvent.isLocked ? "unlock" : "lock"}
                                                        size={20}
                                                        color={THEME.TEXT_PRIMARY}
                                                    />
                                                    <Text style={styles.actionButtonText}>
                                                        {selectedEvent.isLocked ? "Unlock" : "Lock"}
                                                    </Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={[styles.actionButton, styles.editButton]}
                                                    onPress={() => {
                                                        setModalVisible(false);
                                                        // Add edit functionality
                                                    }}
                                                >
                                                    <Feather name="edit-2" size={20} color={THEME.TEXT_PRIMARY} />
                                                    <Text style={styles.actionButtonText}>Edit</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={[styles.actionButton, styles.deleteButton]}
                                                    onPress={handleDeleteEvent}
                                                >
                                                    <Feather name="trash-2" size={20} color={THEME.DANGER} />
                                                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                                                        Delete
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </ScrollView>
                                    )}
                                </LinearGradient>
                            </View>
                        </BlurView>
                    </Modal>
                    <Modal animationType="fade" transparent={true} visible={flightSelectionModalVisible} onRequestClose={() => setFlightSelectionModalVisible(false)}>
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
                                    showsVerticalScrollIndicator={true}
                                />
                                <View style={styles.flightModalFooter}>
                                    <Text style={styles.flightModalFooterText}>Selecting a flight will update your itinerary automatically</Text>
                                </View>
                            </View>
                        </BlurView>
                    </Modal>
                </GestureHandlerRootView>
            </SafeAreaView>
        </View>
    );
}

// Styles (restored from TestItineraryScreen)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.BACKGROUND,
    },
    safeArea: {
        flex: 1,
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
    backButton: {
        position: 'absolute',
        top: 77,
        left: 16,
        zIndex: 10,
        padding: 8,
    },
    headerContainer: {
        marginBottom: 24,
        padding: 20,
        paddingLeft: 72,
    },
    headerTitle: {
        fontSize: 36,
        fontWeight: 'bold',
        color: THEME.TEXT_PRIMARY,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 20,
        color: THEME.TEXT_SECONDARY,
        fontWeight: '500',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    dayContainer: {
        marginBottom: 24,
    },
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: THEME.BORDER,
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
    activitiesContainer: {},
    activityItem: {
        flexDirection: 'row',
        backgroundColor: THEME.CARD_BACKGROUND,
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: THEME.CARD_BORDER,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    timeContainer: {
        width: 70,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: THEME.BACKGROUND,
    },
    timeText: {
        fontSize: 14,
        fontWeight: '600',
        color: THEME.TEXT_SECONDARY,
        textAlign: 'center',
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
    activityIcon: {
        marginRight: 8,
    },
    activityTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: THEME.TEXT_PRIMARY,
    },
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
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '90%',
        maxHeight: '80%',
        borderRadius: 20,
        overflow: 'hidden',
    },
    modalGradient: {
        padding: 20,
    },
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
    closeButton: {
        padding: 5,
    },
    modalBody: {
        maxHeight: '100%',
    },
    eventTypeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    eventTypeIcon: {
        marginRight: 10,
    },
    eventTypeText: {
        fontSize: 18,
        color: THEME.TEXT_PRIMARY,
        fontWeight: '600',
    },
    eventDetails: {
        marginBottom: 30,
    },
    eventTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: THEME.TEXT_PRIMARY,
        marginBottom: 10,
    },
    eventTime: {
        fontSize: 16,
        color: THEME.TEXT_SECONDARY,
        marginBottom: 10,
    },
    eventLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    eventLocationText: {
        fontSize: 16,
        color: THEME.TEXT_SECONDARY,
        marginLeft: 10,
    },
    eventDescription: {
        fontSize: 16,
        color: THEME.TEXT_TERTIARY,
        lineHeight: 24,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 10,
        marginHorizontal: 5,
        backgroundColor: THEME.CARD_BACKGROUND,
    },
    actionButtonText: {
        marginLeft: 8,
        fontSize: 16,
        color: THEME.TEXT_PRIMARY,
        fontWeight: '600',
    },
    lockButton: {
        backgroundColor: THEME.ACCENT + '20',
    },
    editButton: {
        backgroundColor: THEME.PRIMARY + '20',
    },
    deleteButton: {
        backgroundColor: THEME.DANGER + '20',
    },
    deleteButtonText: {
        color: THEME.DANGER,
    },
    flightIcon: {
        marginTop: 5,
    },
    flightIconRotated: {
        transform: [{ rotate: '45deg' }],
    },
    flightCard: {
        backgroundColor: THEME.CARD_BACKGROUND,
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: THEME.BORDER,
    },
    flightCardSelected: {
        borderColor: THEME.PRIMARY,
        borderWidth: 2,
    },
    flightHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    airlineName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: THEME.TEXT_PRIMARY,
    },
    flightNumber: {
        fontSize: 14,
        color: THEME.TEXT_SECONDARY,
    },
    flightTimes: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    flightTimeColumn: {
        alignItems: 'center',
    },
    flightTimeLabel: {
        fontSize: 12,
        color: THEME.TEXT_TERTIARY,
        marginBottom: 4,
    },
    flightTime: {
        fontSize: 18,
        fontWeight: 'bold',
        color: THEME.TEXT_PRIMARY,
    },
    flightAirport: {
        fontSize: 14,
        color: THEME.TEXT_SECONDARY,
    },
    flightDurationContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    flightDuration: {
        fontSize: 14,
        color: THEME.TEXT_SECONDARY,
        marginBottom: 4,
    },
    flightPath: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 8,
        position: 'relative',
    },
    flightPathLine: {
        height: 1,
        backgroundColor: THEME.TEXT_TERTIARY,
        flex: 1,
        position: 'absolute',
        top: 8,
        left: 0,
        right: 0,
    },
    flightStops: {
        fontSize: 12,
        color: THEME.TEXT_TERTIARY,
        marginTop: 4,
    },
    flightFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: THEME.BORDER,
    },
    flightPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: THEME.TEXT_PRIMARY,
    },
    selectFlightButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: THEME.PRIMARY,
        borderRadius: 6,
    },
    selectedFlightButton: {
        backgroundColor: THEME.TEXT_TERTIARY,
    },
    selectFlightButtonText: {
        color: '#fff',
        fontWeight: '500',
    },
    flightList: {
        paddingBottom: 16,
    },
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
    dayHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addEventButton: {
        marginLeft: 10,
        padding: 4,
    },
    activityItemLocked: {
        borderColor: THEME.ACCENT,
        borderWidth: 2,
    },
    lockIcon: {
        marginLeft: 8,
    },
    daysTabContainer: {
        backgroundColor: THEME.BACKGROUND,
        paddingVertical: 8,
        marginBottom: 16,
        borderBottomWidth: 1,
        borderTopWidth: 1,
        borderColor: THEME.BORDER,
    },
    daysTabList: {
        paddingHorizontal: 16,
    },
    dayTab: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 12,
        backgroundColor: THEME.BACKGROUND_LIGHTER,
        minWidth: 60,
    },
    dayTabSelected: {
        backgroundColor: THEME.PRIMARY + '30',
        borderWidth: 1,
        borderColor: THEME.PRIMARY,
    },
    dayTabText: {
        fontSize: 14,
        color: THEME.TEXT_SECONDARY,
        marginBottom: 4,
    },
    dayTabTextSelected: {
        color: THEME.PRIMARY,
        fontWeight: '600',
    },
    dayTabDate: {
        fontSize: 18,
        fontWeight: 'bold',
        color: THEME.TEXT_PRIMARY,
    },
    dayTabDateSelected: {
        color: THEME.PRIMARY,
    },
});