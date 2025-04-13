import { Stack } from 'expo-router';
import { SurveyProvider } from './SurveyContext';

export default function SurveyLayout() {
    return (
        <SurveyProvider>
            <Stack
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    gestureEnabled: true,
                    gestureDirection: 'horizontal'
                }}
            >
                <Stack.Screen name="index" />
                <Stack.Screen name="type" />
                <Stack.Screen name="location" />
                <Stack.Screen name="duration" />
                <Stack.Screen name="calendar" />
                <Stack.Screen name="departure" />
                <Stack.Screen name="transport" />
                <Stack.Screen name="budget" />
                <Stack.Screen name="itinerary" />
            </Stack>
        </SurveyProvider>
    );
} 