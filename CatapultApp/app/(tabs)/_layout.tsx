import React, { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Pressable, 
  Animated, 
  Easing 
} from 'react-native';
import { BlurView } from 'expo-blur';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/Colors';
import { FontFamily, FontSizes, Shadow } from '@/constants/Theme';

const { width } = Dimensions.get('window');

// Custom animated tab bar icon component with reduced effects
function AnimatedTabBarIcon({ 
  name, 
  color, 
  isFocused 
}: { 
  name: React.ComponentProps<typeof FontAwesome>['name']; 
  color: string; 
  isFocused: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFocused) {
      // Animation when tab becomes active
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animation when tab becomes inactive
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isFocused]);

  return (
    <Animated.View
      style={[
        styles.iconWrapper,
        {
          transform: [
            { scale: scaleAnim }
          ],
        },
      ]}
    >
      <FontAwesome size={18} name={name} color={color} />
    </Animated.View>
  );
}

// Custom tab bar component
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(100)).current;
  
  // Sliding in animation on mount
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.tabBarContainer,
        { transform: [{ translateY: slideAnim }] },
        { paddingBottom: insets.bottom > 0 ? 0 : 10 }
      ]}
    >
      <BlurView intensity={30} tint="dark" style={styles.blurView}>
        <LinearGradient
          colors={['rgba(15, 23, 42, 0.7)', 'rgba(30, 41, 59, 0.85)']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Lightning effect line */}
          <View style={styles.lightningLine} />
          
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const label = options.title;
            const isFocused = state.index === index;
            
            const iconName = 
              route.name === 'index' ? 'suitcase' :
              route.name === 'settings' ? 'cog' : 
              'circle';

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable
                key={index}
                onPress={onPress}
                style={[
                  styles.tabItem,
                  isFocused && styles.tabItemFocused,
                ]}
                android_ripple={{ color: 'rgba(255, 255, 255, 0.1)', borderless: true }}
              >
                <AnimatedTabBarIcon 
                  name={iconName} 
                  color={isFocused ? '#3B82F6' : '#94A3B8'} 
                  isFocused={isFocused} 
                />
                
                <Text 
                  style={[
                    styles.tabLabel,
                    { 
                      color: isFocused ? '#3B82F6' : '#94A3B8',
                      opacity: isFocused ? 1 : 0.7,
                    }
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0F172A',
        },
        headerTitleStyle: {
          fontFamily: FontFamily.montserratSemiBold,
          fontSize: 18,
          color: '#F8FAFC',
        },
        headerTitleAlign: 'center',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trips',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 25,
    left: '50%',
    marginLeft: -width * 0.4,
    width: width * 0.8,
    borderRadius: 30,
    overflow: 'hidden',
    height: 60, // Reduced height
    ...Shadow.medium,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.3,
    elevation: 8,
  },
  blurView: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gradient: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 30,
    overflow: 'hidden',
  },
  lightningLine: {
    position: 'absolute',
    top: 0,
    left: '10%',
    width: '80%',
    height: 2,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row', // Changed to row for icon and text side by side
    paddingHorizontal: 8,
  },
  tabItemFocused: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  tabLabel: {
    fontFamily: FontFamily.montserratMedium,
    fontSize: 13, // Increased font size
    marginLeft: 6, // Add space between icon and text
  },
  iconWrapper: {
    width: 18, // Smaller icon wrapper
    height: 18, // Smaller icon wrapper
    justifyContent: 'center',
    alignItems: 'center',
  },
});