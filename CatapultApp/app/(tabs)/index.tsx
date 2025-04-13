// /CatapultApp/app/(tabs)/index.tsx
import { StyleSheet, Text, View, Animated, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef, useEffect } from 'react';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { FontFamily, Spacing, BorderRadius, Shadow } from '@/constants/Theme';
import { useSurvey } from '../survey/SurveyContext';

type Trip = {
  id: string;
  destination: string;
  image: string;
  dates: string;
  status: 'upcoming' | 'past' | 'draft';
};

export default function TripsScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { trips } = useSurvey();

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
    router.push('/survey');
  };

  const handleTestItinerary = () => {
    router.push('/test-itinerary');
  };

  const renderTripCard = ({ item }: { item: Trip }) => {
    return (
      <Animated.View style={[styles.cardContainer, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.tripCard}
          onPress={() => handleTripPress(item.id)}
          activeOpacity={0.8}
        >
          <Image source={{ uri: item.image }} style={styles.tripImage} />
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />
          <View style={styles.tripInfo}>
            <Text style={styles.destinationText}>{item.destination}</Text>
            <View style={styles.tripMeta}>
              <Text style={styles.dateText}>{item.dates}</Text>
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
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a202c', '#2d3748']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Trips</Text>
            <View style={styles.headerButtons}>
              {/* <TouchableOpacity style={styles.testButton} onPress={handleTestItinerary}>
                <FontAwesome name="list" size={16} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Test Itinerary</Text>
              </TouchableOpacity> */}
              <TouchableOpacity style={styles.createButton} onPress={handleCreateTrip}>
                <FontAwesome name="plus" size={16} color="#FFFFFF" style={styles.createButtonIcon} />
                <Text style={styles.createButtonText}>New Trip</Text>
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={trips}
            renderItem={renderTripCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
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
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: FontFamily.montserratBold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#4A5568',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadow.medium,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FontFamily.montserratSemiBold,
  },
  createButton: {
    backgroundColor: '#4A5568',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.medium,
  },
  createButtonIcon: {
    marginRight: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FontFamily.montserratSemiBold,
  },
  listContainer: {
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 100,
  },
  cardContainer: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadow.medium,
    shadowOpacity: 0.3,
  },
  tripCard: {
    overflow: 'hidden',
    borderRadius: BorderRadius.lg,
    backgroundColor: '#2d3748',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    height: 180,
  },
  tripImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tripInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
  },
  destinationText: {
    fontFamily: FontFamily.montserratBold,
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tripMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontFamily: FontFamily.montserratMedium,
    fontSize: 14,
    color: '#e2e8f0',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  upcomingBadge: {
    backgroundColor: 'rgba(72, 187, 120, 0.3)',
    borderWidth: 1,
    borderColor: '#48BB78',
  },
  pastBadge: {
    backgroundColor: 'rgba(160, 174, 192, 0.3)',
    borderWidth: 1,
    borderColor: '#A0AEC0',
  },
  draftBadge: {
    backgroundColor: 'rgba(236, 201, 75, 0.3)',
    borderWidth: 1,
    borderColor: '#ECC94B',
  },
  statusText: {
    fontFamily: FontFamily.montserratMedium,
    fontSize: 12,
  },
  upcomingText: {
    color: '#48BB78',
  },
  pastText: {
    color: '#A0AEC0',
  },
  draftText: {
    color: '#ECC94B',
  },
});