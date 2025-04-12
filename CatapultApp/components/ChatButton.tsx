import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text, Animated } from 'react-native';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { Shadow, FontFamily } from '@/constants/Theme';

interface ChatButtonProps {
    onPress?: () => void;
}

export default function ChatButton({ onPress }: ChatButtonProps) {
    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            // Navigate to the chat screen
            router.push('/chat');
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.button}
                onPress={handlePress}
                activeOpacity={0.8}
            >
                <FontAwesome name="comment" size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>1</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        zIndex: 999,
    },
    button: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.medium,
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: Colors.secondary,
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.white,
    },
    badgeText: {
        color: Colors.white,
        fontSize: 12,
        fontFamily: FontFamily.montserratSemiBold,
    },
}); 