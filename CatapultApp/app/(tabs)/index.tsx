import { Animated, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRef, useEffect } from 'react';

import Colors from '@/constants/Colors';
import { BorderRadius, FontFamily, FontSizes, Shadow, Spacing, TextStyle, ButtonStyle, CardStyle } from '@/constants/Theme';

export default function HomeScreen() {
  // Animation for the Create Trip button
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // Animation for fade-in cards
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
        imageStyle={{ opacity: 0.1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={TextStyle.body}>Good morning,</Text>
            <Text style={TextStyle.heading}>Traveler</Text>
          </View>

          <View style={styles.section}>
            <Text style={TextStyle.subheading}>Upcoming Trip</Text>
            <Animated.View style={[styles.cardContainer, { opacity: fadeAnim }]}>
              <View style={styles.tripCard}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' }}
                  style={styles.tripImage}
                />
                <View style={styles.tripInfo}>
                  <Text style={TextStyle.heading}>Paris, France</Text>
                  <View style={styles.tripDates}>
                    <FontAwesome name="calendar" size={16} color={Colors.primary} style={styles.dateIcon} />
                    <Text style={TextStyle.highlighted}>June 15 - June 22, 2025</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.tripItineraryPreview}>
                    <FontAwesome name="map-marker" size={16} color={Colors.primary} style={styles.previewIcon} />
                    <Text style={TextStyle.body}>3 activities planned</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>

          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable
              style={styles.createTripButton}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={() => console.log('Create Trip pressed')}>
              <FontAwesome name="plus" size={18} color={Colors.white} style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Create Trip</Text>
            </Pressable>
          </Animated.View>

          <View style={styles.section}>
            <Text style={TextStyle.subheading}>Travel Tips</Text>
            <Animated.View style={[styles.cardContainer, { opacity: fadeAnim }]}>
              <View style={styles.tipCard}>
                <FontAwesome name="lightbulb-o" size={20} color={Colors.gold} style={styles.tipIcon} />
                <Text style={TextStyle.body}>Remember to check the local weather before packing for your trip!</Text>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
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
  scrollContainer: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
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
  tripDates: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  dateIcon: {
    marginRight: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.accent,
    marginVertical: Spacing.sm,
  },
  tripItineraryPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  previewIcon: {
    marginRight: Spacing.sm,
  },
  createTripButton: {
    ...ButtonStyle.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: Spacing.xl,
  },
  buttonIcon: {
    marginRight: Spacing.sm,
  },
  buttonText: {
    ...ButtonStyle.primaryText,
  },
  tipCard: {
    ...CardStyle.container,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipIcon: {
    marginRight: Spacing.md,
  },
});
