import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    FlatList,
    Modal,
    TextInput,
    Alert,
    ScrollView,
    Pressable,
    Platform,
    
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Feather from '@expo/vector-icons/Feather';
import { getItinerary, Itinerary, ItineraryDay as StoredItineraryDay, ItineraryEvent as StoredItineraryEvent, storeItinerary } from './data/itineraryStorage';
import moment from 'moment';
import { Swipeable as SwipeableGestureHandler } from 'react-native-gesture-handler';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SwipeableItem, { SwipeableItemImperativeRef } from 'react-native-swipeable-item';
import { BlurView } from 'expo-blur';
import { updateTripItinerary } from './data/trips';
import { saveTripData, TripData } from './utils/storage';

// Make our own extended version of StoredItineraryEvent with isLocked property
interface ExtendedItineraryEvent extends StoredItineraryEvent {
    isLocked?: boolean;
}

// Constants that can be easily imported/generated
const THEME = {
    // Main colors
    BACKGROUND: '#1a202c',
    BACKGROUND_LIGHTER: '#2d3748',
    PRIMARY: '#4a6da7',
    SECONDARY: '#8aa9d6',
    ACCENT: '#6b8cae',

    // Text colors
    TEXT_PRIMARY: '#E2E8F0',
    TEXT_SECONDARY: '#A0AEC0',
    TEXT_TERTIARY: '#718096',

    // UI element colors
    CARD_BACKGROUND: '#2d3748',
    CARD_BORDER: 'rgba(255, 255, 255, 0.1)',
    BORDER: '#3a4556',

    // Activity type colors
    MEAL: '#68D391',        // Green
    ATTRACTION: '#F6AD55',  // Orange
    TRANSPORT: '#63B3ED',   // Blue
    ACCOMMODATION: '#B794F4', // Purple
    FREE_TIME: '#CBD5E0',    // Gray
};

// Activity type mapping for icons and colors (easily updatable)
const ACTIVITY_TYPE_CONFIG = {
    'meal': {
        icon: 'cutlery',
        color: THEME.MEAL
    },
    'attraction': {
        icon: 'map-marker',
        color: THEME.ATTRACTION
    },
    'transport': {
        icon: 'car',
        color: THEME.TRANSPORT
    },
    'accommodation': {
        icon: 'home',
        color: THEME.ACCOMMODATION
    },
    'free-time': {
        icon: 'coffee',
        color: THEME.FREE_TIME
    }
};

type ItineraryDay = {
    id: string;
    date: string;
    rawDate: string; // Store the original date format
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

// Define a type for flight details
type FlightOption = {
    id: string;
    airline: string;
    flightNumber: string;
    departure: {
        airport: string;
        time: string;
        date: string;
    };
    arrival: {
        airport: string;
        time: string;
        date: string;
    };
    duration: string;
    price: string;
    stops: number;
};

export default function TestItineraryScreen() {
    const router = useRouter();
    const [storedItinerary, setStoredItinerary] = useState<Itinerary | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeDay, setActiveDay] = useState<string | null>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [days, setDays] = useState<ItineraryDay[]>([]);

    // Modal states
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<ItineraryActivity | null>(null);
    const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
    const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(null);

    // Temporary state for editing
    const [editTitle, setEditTitle] = useState('');
    const [editTime, setEditTime] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editLocation, setEditLocation] = useState('');
    const [editType, setEditType] = useState<string>('');

    // Animation refs
    const scrollY = useRef(new Animated.Value(0)).current;
    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 1],
        extrapolate: 'clamp'
    });

    const [isSwiping, setIsSwiping] = useState(false);
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [viewMode, setViewMode] = useState<'days'>('days');
    const [isReadOnlyMode, setIsReadOnlyMode] = useState(true);
    const [lockedEvents, setLockedEvents] = useState<string[]>([]);

    const [flightSelectionModalVisible, setFlightSelectionModalVisible] = useState(false);
    const [availableFlights, setAvailableFlights] = useState<FlightOption[]>([]);
    const [selectedFlight, setSelectedFlight] = useState<FlightOption | null>(null);

    // Mock flight data - in a real app this would come from an API
    const mockFlights: FlightOption[] = [
        {
            id: 'flight1',
            airline: 'United Airlines',
            flightNumber: 'UA123',
            departure: {
                airport: 'SFO',
                time: '08:30',
                date: '2023-07-15'
            },
            arrival: {
                airport: 'JFK',
                time: '17:00',
                date: '2023-07-15'
            },
            duration: '5h 30m',
            price: '$349',
            stops: 0
        },
        {
            id: 'flight2',
            airline: 'Delta',
            flightNumber: 'DL456',
            departure: {
                airport: 'SFO',
                time: '10:15',
                date: '2023-07-15'
            },
            arrival: {
                airport: 'JFK',
                time: '18:45',
                date: '2023-07-15'
            },
            duration: '5h 30m',
            price: '$289',
            stops: 1
        },
        {
            id: 'flight3',
            airline: 'American Airlines',
            flightNumber: 'AA789',
            departure: {
                airport: 'SFO',
                time: '14:20',
                date: '2023-07-15'
            },
            arrival: {
                airport: 'JFK',
                time: '22:50',
                date: '2023-07-15'
            },
            duration: '5h 30m',
            price: '$319',
            stops: 0
        }
    ];

    useEffect(() => {
        // Fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();

        // Load stored itinerary from AsyncStorage
        const loadItinerary = async () => {
            console.log("Starting to load itinerary...");
            try {
                setLoading(true);
                const data = await getItinerary();
                console.log("Itinerary loaded:", data ? "success" : "no data");
                if (data) {
                    console.log(`Itinerary has ${data.itinerary.length} days`);
                    setStoredItinerary(data);

                    // Convert stored data into our UI format
                    const convertedDays = data.itinerary.map((day: StoredItineraryDay, index: number) => {
                        // Format the date to be more readable
                        const formattedDate = day.date ? moment(day.date).format('ddd, MMM D') : `Day ${index + 1}`;

                        return {
                            id: `day${index + 1}`,
                            date: formattedDate,
                            rawDate: day.date,
                            activities: day.events.map((event: ExtendedItineraryEvent, eventIndex: number) => {
                                // Map the event type to one of the allowed activity types
                                let mappedType: 'meal' | 'attraction' | 'transport' | 'accommodation' | 'free-time' = 'attraction';

                                // Map event types to our UI types
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
                                    isLocked: event.isLocked
                                };
                            }).sort((a, b) => a.time.localeCompare(b.time)) // Sort activities by time
                        };
                    });

                    setDays(convertedDays);
                }
            } catch (error) {
                console.error('Error loading itinerary:', error);
            } finally {
                setLoading(false);
            }
        };

        loadItinerary();
    }, []);

    useEffect(() => {
        // Fade in animation for modal
        if (modalVisible) {
            Animated.spring(fadeAnim, {
                toValue: 1,
                useNativeDriver: true,
                damping: 15,
                stiffness: 100
            }).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [modalVisible]);

    // Set active day when data is available
    useEffect(() => {
        console.log(`Display days available: ${days.length}`);
        // Set first day as active when data becomes available
        if (days.length > 0 && !activeDay) {
            console.log("Setting active day to first day");
            setActiveDay(days[0].id);
        }
    }, [days, activeDay]);

    // Get active day data
    const activeDayData = days.find((day) => day.id === activeDay);

    // Event handlers
    const handleEventPress = (event: ItineraryActivity, dayIndex: number, eventIndex: number) => {
        if (event.type === 'transport' && event.details?.isFlight) {
            handleTransportEventPress(event, dayIndex, eventIndex);
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
            Alert.alert(
                "Delete Event",
                "Are you sure you want to delete this event?",
                [
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
                        }
                    }
                ]
            );
        }
    };

    const handleUpdateEvent = () => {
        if (selectedDayIndex !== null && selectedEventIndex !== null) {
            const updatedDays = [...days];

            // Check if time has changed
            const currentTime = updatedDays[selectedDayIndex].activities[selectedEventIndex].time;
            const timeChanged = currentTime !== editTime;

            // Update the event
            updatedDays[selectedDayIndex].activities[selectedEventIndex] = {
                ...updatedDays[selectedDayIndex].activities[selectedEventIndex],
                title: editTitle,
                time: editTime,
                description: editDescription,
                location: editLocation,
                type: editType as any,
                isLocked: selectedEvent?.isLocked
            };

            // Re-sort activities by time after updating
            updatedDays[selectedDayIndex].activities.sort((a, b) => a.time.localeCompare(b.time));

            // If time changed significantly, it might need to move to a different day
            // For simplicity, we'll just keep it in the same day and re-sort

            setDays(updatedDays);
            saveChangesToStorage(updatedDays);
            setModalVisible(false);

            // Show feedback if time was changed
            if (timeChanged) {
                Alert.alert("Event Updated", "Event time was changed and schedule was reorganized.");
            }
        }
    };

    const saveChangesToStorage = async (updatedDays: ItineraryDay[]) => {
        // Convert our UI format back to storage format
        if (!storedItinerary) return;

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
                    isLocked: activity.isLocked
                }))
            }))
        };

        try {
            // Save to local storage
            await storeItinerary(updatedItinerary);

            // Save to trip data
            // TODO: Get actual trip ID from navigation params
            const tripId = "current_trip_id";
            await updateTripItinerary(tripId, updatedItinerary);

            console.log("Changes saved to storage and trip data");
        } catch (error) {
            console.error("Failed to save changes:", error);
            Alert.alert("Error", "Failed to save changes. Please try again.");
        }
    };

    // Helper functions
    const getActivityIcon = (type: string): any => {
        return ACTIVITY_TYPE_CONFIG[type as keyof typeof ACTIVITY_TYPE_CONFIG]?.icon || 'circle';
    };

    const getActivityColor = (type: string): string => {
        return ACTIVITY_TYPE_CONFIG[type as keyof typeof ACTIVITY_TYPE_CONFIG]?.color || THEME.TEXT_PRIMARY;
    };

    // Prepare data for full-trip view
    const getAllEventsInOrder = () => {
        const allEvents: (ItineraryActivity & { dayIndex: number, dateLabel: string })[] = [];

        days.forEach((day, dayIndex) => {
            day.activities.forEach((activity) => {
                allEvents.push({
                    ...activity,
                    dayIndex,
                    dateLabel: day.date
                });
            });
        });

        // Sort by date and time
        return allEvents.sort((a, b) => {
            const dateA = days[a.dayIndex].rawDate;
            const dateB = days[b.dayIndex].rawDate;
            if (dateA !== dateB) return dateA.localeCompare(dateB);
            return a.time.localeCompare(b.time);
        });
    };

    const handleDragEnd = ({ data, from, to }: { data: ItineraryActivity[], from: number, to: number }) => {
        if (from === to) return;

        const updatedDays = [...days];
        const fromTime = updatedDays[selectedDayIndex!].activities[from].time;
        const toTime = updatedDays[selectedDayIndex!].activities[to].time;

        // Swap the times instead of the positions
        updatedDays[selectedDayIndex!].activities[from].time = toTime;
        updatedDays[selectedDayIndex!].activities[to].time = fromTime;

        // Re-sort by time
        updatedDays[selectedDayIndex!].activities.sort((a, b) => a.time.localeCompare(b.time));

        setDays(updatedDays);
        saveChangesToStorage(updatedDays);
    };

    const toggleEventLock = (eventId: string, dayIndex: number, eventIndex: number) => {
        const updatedDays = [...days];
        const event = updatedDays[dayIndex].activities[eventIndex];
        event.isLocked = !event.isLocked;

        setDays(updatedDays);
        saveChangesToStorage(updatedDays);

        // Update locked events array for easier tracking
        if (event.isLocked) {
            setLockedEvents(prev => [...prev, eventId]);
        } else {
            setLockedEvents(prev => prev.filter(id => id !== eventId));
        }
    };

    const handleCancelEvent = () => {
        if (selectedDayIndex !== null && selectedEventIndex !== null) {
            Alert.alert(
                "Cancel Event",
                "Would you like to find an alternative event?",
                [
                    { text: "Just Cancel", style: "destructive", onPress: () => handleDeleteEvent() },
                    {
                        text: "Find Alternative",
                        onPress: () => {
                            // Here we would call GPT to suggest alternatives
                            Alert.alert(
                                "Finding Alternatives",
                                "We'll suggest alternative events based on your preferences (Coming soon)"
                            );
                            setModalVisible(false);
                        }
                    },
                    { text: "Cancel", style: "cancel" }
                ]
            );
        }
    };

    // Function to show flight options when a transport event is selected
    const handleTransportEventPress = (event: ItineraryActivity, dayIndex: number, eventIndex: number) => {
        // First set the event as the currently selected event
        setSelectedEvent(event);
        setSelectedDayIndex(dayIndex);
        setSelectedEventIndex(eventIndex);

        // Check if this is a transport type event
        if (event.type === 'transport' && event.details?.isFlight) {
            // Load available flights
            setAvailableFlights(mockFlights);

            // Set the currently selected flight if there is one
            if (event.details?.flightOption) {
                setSelectedFlight(event.details.flightOption);
            } else {
                setSelectedFlight(null);
            }

            // Show the flight selection modal
            setFlightSelectionModalVisible(true);
        } else {
            // For non-flight events, show the regular event modal
            setEditTitle(event.title);
            setEditTime(event.time);
            setEditDescription(event.description);
            setEditLocation(event.location || '');
            setEditType(event.type);
            setModalVisible(true);
        }
    };

    // Function to select a flight
    const selectFlight = (flight: FlightOption) => {
        if (selectedDayIndex !== null && selectedEventIndex !== null) {
            const updatedDays = [...days];
            const event = updatedDays[selectedDayIndex].activities[selectedEventIndex];

            // Update the event with the selected flight details
            event.details = {
                ...event.details,
                flightOption: flight,
                isFlight: true
            };

            // Update the event title to reflect the selected flight
            event.title = `Flight ${flight.flightNumber}: ${flight.departure.airport} to ${flight.arrival.airport}`;
            event.time = flight.departure.time;
            event.description = `${flight.airline} - ${flight.duration} - ${flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}`;

            setDays(updatedDays);
            saveChangesToStorage(updatedDays);
            setFlightSelectionModalVisible(false);

            // Show confirmation to the user
            Alert.alert(
                "Flight Selected",
                `Your itinerary has been updated with the new flight selection.`,
                [{ text: "OK" }]
            );
        }
    };

    // Modify existing components
    const renderActivityItem = ({ item, index, dayIndex, drag }: {
        item: ItineraryActivity,
        index: number,
        dayIndex: number,
        drag?: () => void
    }) => {
        const isExpanded = expandedEventId === item.id;
        const isLocked = item.isLocked;

        return (
            <TouchableOpacity
                style={[
                    styles.activityItem,
                    isLocked && styles.activityItemLocked
                ]}
                onPress={() => handleEventPress(item, dayIndex, index)}
                onLongPress={isLocked ? undefined : drag}
                delayLongPress={200}
                activeOpacity={0.7}
            >
                <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{item.time}</Text>
                    {item.type === 'transport' && (
                        <Text style={styles.dayIndicator}>→</Text>
                    )}
                </View>

                <View style={[
                    styles.activityContent,
                    { borderLeftColor: getActivityColor(item.type) }
                ]}>
                    <View style={styles.activityHeader}>
                        <FontAwesome
                            name={getActivityIcon(item.type)}
                            size={16}
                            color={getActivityColor(item.type)}
                            style={styles.activityIcon}
                        />
                        <Text style={styles.activityTitle}>
                            {item.title}
                        </Text>
                        {isLocked && (
                            <Feather name="lock" size={14} color={THEME.ACCENT} style={styles.lockIcon} />
                        )}
                    </View>

                    {item.location && (
                        <View style={styles.locationRow}>
                            <Feather name="map-pin" size={12} color={THEME.TEXT_TERTIARY} />
                            <Text style={styles.locationText}>
                                {item.location}
                            </Text>
                        </View>
                    )}

                    {item.description && (
                        <Text style={styles.descriptionText}>
                            {item.description}
                        </Text>
                    )}
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
                            onPress={() => {
                                // Add new event logic
                                Alert.alert("Coming soon", "Add event functionality will be available soon");
                            }}
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
                            drag: isEditMode ? drag : undefined
                        })
                    }
                    onDragEnd={({ data }) => {
                        setSelectedDayIndex(index);
                        handleDragEnd({ data, from: 0, to: 0 }); // Actual indices are handled internally
                    }}
                    activationDistance={isEditMode ? 10 : 1000} // Disable drag in view mode
                />
            </View>
        </View>
    );

    // Render a single list of all events in chronological order
    const renderFullTripView = () => {
        const allEvents = getAllEventsInOrder();
        let currentDate = '';

        return (
            <FlatList
                data={allEvents}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => {
                    const dateHeader = item.dateLabel !== currentDate ? (
                        <View style={styles.fullViewDateHeader}>
                            <Text style={styles.fullViewDateText}>{item.dateLabel}</Text>
                        </View>
                    ) : null;

                    currentDate = item.dateLabel;

                    return (
                        <>
                            {dateHeader}
                            {renderActivityItem({
                                item,
                                index,
                                dayIndex: item.dayIndex
                            })}
                        </>
                    );
                }}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={true}
            />
        );
    };

    // Function to render a flight option card
    const renderFlightOption = ({ item }: { item: FlightOption }) => {
        const isSelected = selectedFlight?.id === item.id;

        return (
            <TouchableOpacity
                style={[
                    styles.flightCard,
                    isSelected && styles.flightCardSelected
                ]}
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
                        style={[
                            styles.selectFlightButton,
                            isSelected && styles.selectedFlightButton
                        ]}
                        onPress={() => selectFlight(item)}
                    >
                        <Text style={styles.selectFlightButtonText}>
                            {isSelected ? 'Selected' : 'Select'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    // Loading state
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading itinerary...</Text>
            </View>
        );
    }

    // No data state
    if (!storedItinerary || days.length === 0) {
        return (
            <View style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <Stack.Screen
                        options={{
                            title: 'Itinerary',
                            headerShown: true,
                        }}
                    />
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>No Itinerary Found</Text>
                        <Text style={styles.emptyText}>Create a trip to generate an itinerary</Text>
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => {
                                // Save empty trip data first
                                const newTrip: TripData = {
                                    reason_for_trip: 'Personal',
                                    location: 'Not specified',
                                    start_time: new Date().toISOString(),
                                    end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                                    budget: 1000,
                                    itinerary: []
                                };

                                saveTripData(newTrip)
                                    .then(() => {
                                        router.push('/survey');
                                    })
                                    .catch((error: Error) => {
                                        console.error('Error creating trip:', error);
                                        Alert.alert('Error', 'Failed to create trip. Please try again.');
                                    });
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
            <SafeAreaView style={styles.safeArea}>
                <Stack.Screen
                    options={{
                        title: 'Trip Itinerary',
                        headerShown: true,
                        headerLeft: () => (
                            <TouchableOpacity
                                onPress={() => router.push('/')}
                                style={styles.headerButton}
                            >
                                <Feather name="chevron-left" size={24} color={THEME.TEXT_PRIMARY} />
                            </TouchableOpacity>
                        ),
                        headerRight: () => (
                            <View style={styles.headerRightContainer}>
                                <TouchableOpacity
                                    style={styles.headerButton}
                                    onPress={() => setIsEditMode(!isEditMode)}
                                >
                                    <Feather name={isEditMode ? "check" : "edit-2"} size={20} color={THEME.TEXT_PRIMARY} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.headerButton}
                                    onPress={() => {
                                        Alert.alert(
                                            "Itinerary Options",
                                            "What would you like to do?",
                                            [
                                                {
                                                    text: "Share",
                                                    onPress: () => console.log("Share pressed")
                                                },
                                                {
                                                    text: "Export",
                                                    onPress: () => console.log("Export pressed")
                                                },
                                                {
                                                    text: "Cancel",
                                                    style: "cancel"
                                                }
                                            ]
                                        );
                                    }}
                                >
                                    <Feather name="more-horizontal" size={24} color={THEME.TEXT_PRIMARY} />
                                </TouchableOpacity>
                            </View>
                        )
                    }}
                />

                <GestureHandlerRootView style={{ flex: 1 }}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.headerTitle}>
                            {storedItinerary.itinerary[0].events[0]?.location?.split(' → ')[1] || 'Trip Itinerary'}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            {`${moment(storedItinerary.itinerary[0].date).format('MMM D')} - ${moment(storedItinerary.itinerary[storedItinerary.itinerary.length - 1].date).format('MMM D, YYYY')}`}
                        </Text>
                    </View>

                    <FlatList
                        data={days}
                        renderItem={renderDay}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={true}
                        initialNumToRender={7}
                        maxToRenderPerBatch={10}
                        windowSize={10}
                    />

                    {/* Event Detail/Edit Modal */}
                    <Modal
                        animationType="fade"
                        transparent={true}
                        visible={modalVisible}
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <BlurView
                            intensity={20}
                            tint="dark"
                            style={styles.modalOverlay}
                        >
                            <Animated.View style={[
                                styles.modalContent,
                                {
                                    transform: [{
                                        translateY: fadeAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [600, 0]
                                        })
                                    }]
                                }
                            ]}>
                                <LinearGradient
                                    colors={[THEME.BACKGROUND, THEME.BACKGROUND_LIGHTER]}
                                    style={styles.modalGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Event Details</Text>
                                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                                            <Feather name="x" size={24} color={THEME.TEXT_PRIMARY} />
                                        </TouchableOpacity>
                                    </View>

                                    <ScrollView style={styles.modalScrollView}>
                                        <View style={styles.eventDetailsContainer}>
                                            <View style={styles.eventTypeHeader}>
                                                <FontAwesome
                                                    name={getActivityIcon(editType)}
                                                    size={24}
                                                    color={getActivityColor(editType)}
                                                />
                                                <Text style={styles.eventTypeText}>
                                                    {editType.charAt(0).toUpperCase() + editType.slice(1)}
                                                </Text>
                                            </View>

                                            <Text style={styles.eventTitle}>{editTitle}</Text>

                                            <View style={styles.eventTimeRow}>
                                                <Feather name="clock" size={16} color={THEME.TEXT_SECONDARY} />
                                                <Text style={styles.eventTime}>{editTime}</Text>
                                            </View>

                                            {editLocation && (
                                                <View style={styles.eventLocationRow}>
                                                    <Feather name="map-pin" size={16} color={THEME.TEXT_SECONDARY} />
                                                    <Text style={styles.eventLocation}>{editLocation}</Text>
                                                </View>
                                            )}

                                            {editDescription && (
                                                <View style={styles.eventDescriptionContainer}>
                                                    <Text style={styles.eventDescription}>{editDescription}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </ScrollView>

                                    <View style={styles.modalActions}>
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.findAlternativeButton]}
                                            onPress={() => {
                                                Alert.alert(
                                                    "Find Alternative",
                                                    "We'll suggest alternative events based on your preferences and itinerary context",
                                                    [
                                                        { text: "Cancel", style: "cancel" },
                                                        {
                                                            text: "Find Options",
                                                            onPress: () => {
                                                                // Here we would call GPT to suggest alternatives
                                                                Alert.alert(
                                                                    "Finding Alternatives",
                                                                    "Analyzing your itinerary to find suitable alternatives..."
                                                                );
                                                            }
                                                        }
                                                    ]
                                                );
                                            }}
                                        >
                                            <Feather name="refresh-cw" size={18} color="#fff" style={styles.actionButtonIcon} />
                                            <Text style={styles.actionButtonText}>Find Alternative</Text>
                                        </TouchableOpacity>

                                        {selectedEvent && (
                                            <TouchableOpacity
                                                style={[
                                                    styles.actionButton,
                                                    selectedEvent.isLocked ? styles.unlockButton : styles.lockButton
                                                ]}
                                                onPress={() => {
                                                    if (selectedDayIndex !== null && selectedEventIndex !== null && selectedEvent) {
                                                        toggleEventLock(selectedEvent.id, selectedDayIndex, selectedEventIndex);
                                                        setSelectedEvent({
                                                            ...selectedEvent,
                                                            isLocked: !selectedEvent.isLocked
                                                        });
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
                                        )}

                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.deleteButton]}
                                            onPress={handleDeleteEvent}
                                        >
                                            <Feather name="trash-2" size={18} color="#fff" style={styles.actionButtonIcon} />
                                            <Text style={styles.actionButtonText}>Delete Event</Text>
                                        </TouchableOpacity>
                                    </View>
                                </LinearGradient>
                            </Animated.View>
                        </BlurView>
                    </Modal>

                    {/* Flight Selection Modal */}
                    <Modal
                        animationType="fade"
                        transparent={true}
                        visible={flightSelectionModalVisible}
                        onRequestClose={() => setFlightSelectionModalVisible(false)}
                    >
                        <BlurView
                            intensity={20}
                            tint="dark"
                            style={styles.modalOverlay}
                        >
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
                                    <Text style={styles.flightModalFooterText}>
                                        Selecting a flight will update your itinerary automatically
                                    </Text>
                                </View>
                            </View>
                        </BlurView>
                    </Modal>
                </GestureHandlerRootView>
            </SafeAreaView>
        </View>
    );
}

// Styles - organized for easier generation and modification
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.BACKGROUND,
    },
    safeArea: {
        flex: 1,
    },

    // Loading state styles
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

    // Empty state styles
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

    // Header styles
    headerButton: {
        padding: 8,
    },
    headerContainer: {
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: THEME.TEXT_PRIMARY,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: THEME.TEXT_SECONDARY,
    },

    // List styles
    listContainer: {
        padding: 16,
        paddingBottom: 40,
    },

    // Day styles
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
    activitiesContainer: {

    },
    dayTitle: {
        fontSize: 18,
        color: THEME.TEXT_PRIMARY,
        marginBottom: 16,
    },

    // Activities styles
    activitiesList: {
        paddingBottom: 30,
    },
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
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'flex-end',
        padding: 0,
    },
    modalContent: {
        backgroundColor: THEME.BACKGROUND,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
        maxHeight: '80%',
        width: '100%',
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
    eventDetailsContainer: {
        marginBottom: 24,
    },
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
    eventTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: THEME.TEXT_PRIMARY,
        marginBottom: 16,
    },
    eventTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    eventTime: {
        fontSize: 16,
        color: THEME.TEXT_SECONDARY,
        marginLeft: 8,
    },
    eventLocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    eventLocation: {
        fontSize: 16,
        color: THEME.TEXT_SECONDARY,
        marginLeft: 8,
    },
    eventDescriptionContainer: {
        marginTop: 16,
        padding: 16,
        backgroundColor: THEME.BACKGROUND_LIGHTER,
        borderRadius: 12,
    },
    eventDescription: {
        fontSize: 16,
        color: THEME.TEXT_SECONDARY,
        lineHeight: 24,
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
    actionButtonIcon: {
        marginRight: 8,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    findAlternativeButton: {
        backgroundColor: THEME.PRIMARY,
    },
    lockButton: {
        backgroundColor: THEME.ACCENT,
    },
    unlockButton: {
        backgroundColor: THEME.TEXT_TERTIARY,
    },
    deleteButton: {
        backgroundColor: '#e53e3e',
    },
    viewToggleContainer: {
        flexDirection: 'row',
        backgroundColor: THEME.CARD_BACKGROUND,
        borderRadius: 8,
        marginTop: 16,
        padding: 2,
    },
    viewToggleButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    viewToggleButtonActive: {
        backgroundColor: THEME.PRIMARY,
    },
    viewToggleText: {
        fontSize: 14,
        color: THEME.TEXT_SECONDARY,
    },
    viewToggleTextActive: {
        color: '#fff',
        fontWeight: '500',
    },
    fullViewDateHeader: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: THEME.BORDER,
        marginTop: 16,
        marginBottom: 8,
    },
    fullViewDateText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: THEME.TEXT_PRIMARY,
    },
    dayIndicator: {
        fontSize: 12,
        color: THEME.TEXT_TERTIARY,
        marginTop: 2,
    },
    editSwipeButton: {
        backgroundColor: THEME.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
    },
    activityItemLocked: {
        borderColor: THEME.ACCENT,
        borderWidth: 2,
    },
    lockIcon: {
        marginLeft: 8,
    },
    headerRightContainer: {
        flexDirection: 'row',
    },
    dayHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addEventButton: {
        marginLeft: 10,
        padding: 4,
    },
    flightModalContent: {
        backgroundColor: THEME.BACKGROUND,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 20,
        maxHeight: '80%',
    },
    flightList: {
        paddingBottom: 16,
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
    modalScrollView: {
        flex: 1,
    },
}); 