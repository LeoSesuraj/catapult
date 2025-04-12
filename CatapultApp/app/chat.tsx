import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { TextStyle, Shadow, Spacing, BorderRadius, FontFamily } from '@/constants/Theme';

type Message = {
    id: string;
    text: string;
    sender: 'user' | 'agent';
    timestamp: Date;
};

export default function ChatScreen() {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Hello! I\'m your travel assistant. How can I help you with your trip to Paris?',
            sender: 'agent',
            timestamp: new Date(),
        },
    ]);

    const sendMessage = () => {
        if (message.trim() === '') return;

        const newUserMessage: Message = {
            id: Date.now().toString(),
            text: message,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prevMessages) => [...prevMessages, newUserMessage]);
        setMessage('');

        // Simulate agent response after a short delay
        setTimeout(() => {
            const agentResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: 'I\'ll help you plan the perfect itinerary for your Paris trip. Would you like recommendations for restaurants, museums, or local experiences?',
                sender: 'agent',
                timestamp: new Date(),
            };
            setMessages((prevMessages) => [...prevMessages, agentResponse]);
        }, 1000);
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isAgent = item.sender === 'agent';

        return (
            <View style={[
                styles.messageContainer,
                isAgent ? styles.agentMessage : styles.userMessage
            ]}>
                <Text style={[
                    styles.messageText,
                    isAgent ? styles.agentMessageText : styles.userMessageText
                ]}>
                    {item.text}
                </Text>
                <Text style={styles.timestamp}>
                    {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
            <Stack.Screen
                options={{
                    title: 'Travel Assistant',
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <FontAwesome name="chevron-left" size={16} color={Colors.darkGray} />
                        </TouchableOpacity>
                    )
                }}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <FlatList
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messagesContainer}
                    inverted={false}
                />

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={message}
                        onChangeText={setMessage}
                        placeholder="Type a message..."
                        placeholderTextColor={Colors.mediumGray}
                        multiline
                    />
                    <TouchableOpacity
                        style={styles.sendButton}
                        onPress={sendMessage}
                        disabled={message.trim() === ''}
                    >
                        <FontAwesome
                            name="paper-plane"
                            size={20}
                            color={message.trim() === '' ? Colors.gray : Colors.primary}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    backButton: {
        padding: 8,
    },
    messagesContainer: {
        padding: Spacing.md,
        paddingBottom: Spacing.xl,
    },
    messageContainer: {
        maxWidth: '80%',
        marginVertical: Spacing.xs,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        ...Shadow.small,
    },
    agentMessage: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.offWhite,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: Colors.primary,
    },
    messageText: {
        fontSize: 16,
        marginBottom: 4,
    },
    agentMessageText: {
        color: Colors.text,
    },
    userMessageText: {
        color: Colors.white,
    },
    timestamp: {
        fontSize: 12,
        color: Colors.mediumGray,
        alignSelf: 'flex-end',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.lightGray,
        backgroundColor: Colors.white,
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 120,
        backgroundColor: Colors.offWhite,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontFamily: FontFamily.montserratRegular,
        fontSize: 16,
        color: Colors.text,
    },
    sendButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: Spacing.sm,
    },
}); 