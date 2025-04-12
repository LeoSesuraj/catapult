import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';

import Colors from '@/constants/Colors';
import { FontFamily, FontSizes, Shadow } from '@/constants/Theme';

function TabBarIcon({ name, color }: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome size={20} name={name} color={color} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.darkGray,
        tabBarLabelStyle: {
          fontFamily: FontFamily.montserratMedium,
          fontSize: 12,
        },
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
          backgroundColor: Colors.white,
          ...Shadow.small,
        },
        headerStyle: {
          backgroundColor: Colors.white,
          ...Shadow.subtle,
        },
        headerTitleStyle: {
          fontFamily: FontFamily.montserratSemiBold,
          fontSize: 18,
          color: Colors.darkGray,
        },
        headerTitleAlign: 'center',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color }) => <TabBarIcon name="suitcase" color={color} />,
        }}
      />
      <Tabs.Screen
        name="itinerary"
        options={{
          title: 'Itinerary',
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
        }}
      />
    </Tabs>
  );
}
