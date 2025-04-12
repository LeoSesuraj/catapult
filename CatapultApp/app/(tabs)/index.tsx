import { Animated, Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { useRef, useEffect } from 'react';

import Colors from '@/constants/Colors';
import { BorderRadius, FontFamily, FontSizes, Shadow, Spacing, TextStyle, ButtonStyle, CardStyle } from '@/constants/Theme';

export default function HomeScreen() {
  // Animation for the Create Trip button
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // Animation for fade-in card
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/map-texture.png')}
        style={styles.bgImage}
        imageStyle={{ opacity: 0.1 }}
      >
        <View style={styles.content}>
          {/* Create Trip Button */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable
              style={styles.createTripButton}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={() => console.log('Create Trip pressed')}
            >
              <Text style={styles.buttonText}>Create Trip</Text>
            </Pressable>
          </Animated.View>

          {/* Upcoming Trip Card */}
          <Text style={[TextStyle.subheading, styles.sectionTitle]}>Upcoming Trip</Text>
          <Animated.View style={[styles.cardContainer, { opacity: fadeAnim }]}>
            <View style={styles.tripCard}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' }}
                style={styles.tripImage}
              />
              <View style={styles.tripInfo}>
                <Text style={TextStyle.heading}>Paris, France</Text>
                <Text style={TextStyle.body}>June 5-10</Text>
                <Text style={[TextStyle.subheading, styles.itineraryTitle]}>Itinerary</Text>
                <View style={styles.itineraryPreview}>
                  <View style={styles.itineraryItem}>
                    <Feather name="clock" size={16} color={Colors.primary} style={styles.clockIcon} />
                    <Text style={TextStyle.highlighted}>9:00</Text>
                    <Text style={[TextStyle.body, styles.itineraryText]}>Breakfast</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.itineraryItem}>
                    <Feather name="clock" size={16} color={Colors.primary} style={styles.clockIcon} />
                    <Text style={TextStyle.highlighted}>11:00</Text>
                    <Text style={[TextStyle.body, styles.itineraryText]}>Louvre Museum</Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bgImage: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.xl, // Increased padding for a spacious feel
  },
  createTripButton: {
    ...ButtonStyle.primary,
    alignSelf: 'center',
    marginBottom: Spacing.xl,
  },
  buttonText: {
    ...ButtonStyle.primaryText,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  cardContainer: {
    marginTop: Spacing.sm,
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
  itineraryTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  itineraryPreview: {
    marginTop: Spacing.xs,
  },
  itineraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  clockIcon: {
    marginRight: Spacing.sm,
  },
  itineraryText: {
    marginLeft: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.accent,
    marginVertical: Spacing.sm,
  },
});
