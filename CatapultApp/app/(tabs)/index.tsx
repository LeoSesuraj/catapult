import { StyleSheet, Text, View, Animated, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef, useEffect, useState } from 'react';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { FontFamily, FontSizes, Spacing, TextStyle, CardStyle, BorderRadius, Shadow } from '@/constants/Theme';
import ChatButton from '@/components/ChatButton';

type Trip = {
    id: string;
    destination: string;
    image: string;
    dates: string;
    status: 'upcoming' | 'past' | 'draft';
};

export default function TripsScreen() {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [trips, setTrips] = useState<Trip[]>([
        {
            id: '1',
            destination: 'Paris, France',
            image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
            dates: 'June 5-10',
            status: 'upcoming',
        },
        {
            id: '2',
            destination: 'Tokyo, Japan',
            image: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
            dates: 'August 12-22',
            status: 'upcoming',
        },
        {
            id: '3',
            destination: 'Barcelona, Spain',
            image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
            dates: 'March 3-8',
            status: 'past',
        },
        {
            id: '4',
            destination: 'New York, USA',
            image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
            dates: 'Planning in progress',
            status: 'draft',
        },
        {
            id: '5',
            destination: 'Chicago, USA',
            image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
            dates: 'July 15-20',
            status: 'upcoming',
        },
    ]);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleTripPress = (tripId: string) => {
        router.push(`/itinerary/${tripId}`);
    };

    const handleCreateTrip = () => {
        console.log('Create new trip');
        // Navigate to trip creation page
        // router.push('/create-trip');
    };

    const renderTripCard = ({ item }: { item: Trip }) => {
        return (
            <Animated.View style={[styles.cardContainer, { opacity: fadeAnim }]}>
                <TouchableOpacity
                    style={styles.tripCard}
                    onPress={() => handleTripPress(item.id)}
                    activeOpacity={0.9}
                >
                    <Image source={{ uri: item.image }} style={styles.tripImage} />
                    <View style={styles.tripInfo}>
                        <Text style={TextStyle.heading}>{item.destination}</Text>
                        <View style={styles.tripMeta}>
                            <Text style={TextStyle.body}>{item.dates}</Text>
                            <View style={[
                                styles.statusBadge,
                                item.status === 'upcoming' ? styles.upcomingBadge :
                                    item.status === 'past' ? styles.pastBadge : styles.draftBadge
                            ]}>
                                <Text style={[
                                    styles.statusText,
                                    item.status === 'upcoming' ? styles.upcomingText :
                                        item.status === 'past' ? styles.pastText : styles.draftText
                                ]}>
                                    {item.status === 'upcoming' ? 'Upcoming' :
                                        item.status === 'past' ? 'Past' : 'Draft'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={TextStyle.heading}>My Trips</Text>
                <TouchableOpacity style={styles.createButton} onPress={handleCreateTrip}>
                    <FontAwesome name="plus" size={16} color={Colors.white} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={trips}
                renderItem={renderTripCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />

            <ChatButton />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    createButton: {
        backgroundColor: Colors.accent,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.small,
    },
    listContainer: {
        padding: Spacing.lg,
        paddingTop: Spacing.sm,
    },
    cardContainer: {
        marginBottom: Spacing.lg,
    },
    tripCard: {
        ...CardStyle.container,
        overflow: 'hidden',
    },
    tripImage: {
        width: '100%',
        height: 150,
        resizeMode: 'cover',
    },
    tripInfo: {
        padding: Spacing.md,
    },
    tripMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.xs,
    },
    statusBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs / 2,
        borderRadius: BorderRadius.sm,
    },
    upcomingBadge: {
        backgroundColor: Colors.accent + '33', // 20% opacity
    },
    pastBadge: {
        backgroundColor: Colors.gray + '33',
    },
    draftBadge: {
        backgroundColor: Colors.primary + '33',
    },
    statusText: {
        fontSize: 12,
        fontFamily: FontFamily.montserratMedium,
    },
    upcomingText: {
        color: Colors.accent,
    },
    pastText: {
        color: Colors.darkGray,
    },
    draftText: {
        color: Colors.primary,
    },
}); 