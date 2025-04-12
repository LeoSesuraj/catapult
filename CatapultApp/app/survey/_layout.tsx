import { Stack } from 'expo-router';

export default function SurveyLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="type" />
            <Stack.Screen name="location" />
            <Stack.Screen name="duration" />
            <Stack.Screen name="budget" />
        </Stack>
    );
} 