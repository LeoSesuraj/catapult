import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Link } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async () => {
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Store token using AsyncStorage
            await AsyncStorage.setItem('token', data.token);
            await AsyncStorage.setItem('user', JSON.stringify(data.user));

            // Redirect to dashboard
            router.replace('/dashboard' as any);
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
            <View style={{ padding: 20, maxWidth: 400, width: '100%', alignSelf: 'center', marginTop: 40 }}>
                <View>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#111827' }}>
                        Sign in to your account
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
                        <Text style={{ fontSize: 14, color: '#6b7280' }}>
                            Or{' '}
                        </Text>
                        <Link href={'/register' as any} asChild>
                            <Text style={{ fontSize: 14, color: '#4f46e5' }}>
                                create a new account
                            </Text>
                        </Link>
                    </View>
                </View>

                <View style={{ marginTop: 24 }}>
                    {error ? (
                        <View style={{ backgroundColor: '#fef2f2', padding: 16, borderRadius: 6, marginBottom: 16 }}>
                            <Text style={{ color: '#b91c1c', fontSize: 14 }}>{error}</Text>
                        </View>
                    ) : null}

                    <View style={{ marginBottom: 16 }}>
                        <TextInput
                            placeholder="Email address"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={{
                                borderWidth: 1,
                                borderColor: '#d1d5db',
                                padding: 12,
                                borderRadius: 6,
                                fontSize: 14
                            }}
                        />
                    </View>

                    <View style={{ marginBottom: 24 }}>
                        <TextInput
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            style={{
                                borderWidth: 1,
                                borderColor: '#d1d5db',
                                padding: 12,
                                borderRadius: 6,
                                fontSize: 14
                            }}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleSubmit}
                        style={{
                            backgroundColor: '#4f46e5',
                            padding: 12,
                            borderRadius: 6,
                            alignItems: 'center'
                        }}
                    >
                        <Text style={{ color: 'white', fontWeight: '500', fontSize: 14 }}>
                            Sign in
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
} 