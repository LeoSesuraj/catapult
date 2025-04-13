import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Keyboard, ActivityIndicator, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontFamily, Spacing, BorderRadius, Shadow } from '../../constants/Theme';
import { useSurvey } from './SurveyContext';
import { CITIES } from '../data/cities';

// Fuzzy search function
const fuzzySearch = (query: string, city: string): number => {
    query = query.toLowerCase();
    city = city.toLowerCase();

    if (city.startsWith(query)) return 2; // Highest priority for starts with
    if (city.includes(query)) return 1; // Medium priority for includes

    let score = 0;
    let queryIndex = 0;

    for (let i = 0; i < city.length && queryIndex < query.length; i++) {
        if (city[i] === query[queryIndex]) {
            score += 1;
            queryIndex++;
        }
    }

    return queryIndex === query.length ? score / city.length : 0;
};

// Group cities by region
const GROUPED_CITIES = CITIES.reduce((acc, city) => {
    const region = city.split(', ')[1] || 'Other';
    if (!acc[region]) {
        acc[region] = [];
    }
    acc[region].push(city);
    return acc;
}, {} as Record<string, string[]>);

export default function Location() {
    const router = useRouter();
    const { updateSurveyData } = useSurvey();
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredCities, setFilteredCities] = useState<Array<{ city: string; score: number }>>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Load recent searches
    useEffect(() => {
        const loadRecentSearches = async () => {
            try {
                const saved = await AsyncStorage.getItem('recentSearches');
                if (saved) {
                    setRecentSearches(JSON.parse(saved));
                }
            } catch (error) {
                console.error('Error loading recent searches:', error);
            }
        };
        loadRecentSearches();
    }, []);

    // Save recent search
    const saveRecentSearch = async (city: string) => {
        try {
            const updatedSearches = [
                city,
                ...recentSearches.filter(s => s !== city)
            ].slice(0, 5);
            setRecentSearches(updatedSearches);
            await AsyncStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
        } catch (error) {
            console.error('Error saving recent search:', error);
        }
    };

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        if (searchQuery.length > 0) {
            setIsLoading(true);
            timeoutId = setTimeout(() => {
                const results = CITIES.map(city => ({
                    city,
                    score: fuzzySearch(searchQuery, city)
                }))
                    .filter(result => result.score > 0)
                    .sort((a, b) => b.score - a.score);

                setFilteredCities(results);
                setShowSuggestions(true);
                setIsLoading(false);

                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true
                }).start();
            }, 300);
        } else {
            setFilteredCities([]);
            setShowSuggestions(false);
            fadeAnim.setValue(0);
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [searchQuery]);

    const handleCitySelect = async (city: string) => {
        setSearchQuery(city);
        setShowSuggestions(false);
        Keyboard.dismiss();
        await saveRecentSearch(city);

        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true
        }).start(() => {
            updateSurveyData('destination', city);
            router.push('/survey/transport');
        });
    };

    const handleBack = () => {
        router.back();
    };

    const renderCityItem = ({ item }: { item: { city: string; score: number } }) => (
        <TouchableOpacity
            style={[styles.suggestionItem, { opacity: item.score > 1 ? 1 : 0.8 }]}
            onPress={() => handleCitySelect(item.city)}
        >
            <FontAwesome name="map-marker" size={16} color="#4299E1" style={styles.suggestionIcon} />
            <View style={styles.suggestionTextContainer}>
                <Text style={styles.suggestionText}>{item.city}</Text>
                {item.city.includes(',') && (
                    <Text style={styles.regionText}>{item.city.split(',')[1].trim()}</Text>
                )}
            </View>
        </TouchableOpacity>
    );

    const renderRecentSearches = () => {
        if (recentSearches.length === 0 || searchQuery.length > 0) return null;

        return (
            <View style={styles.recentSearchesContainer}>
                <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
                {recentSearches.map((city, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.recentSearchItem}
                        onPress={() => handleCitySelect(city)}
                    >
                        <FontAwesome name="history" size={16} color="#718096" style={styles.suggestionIcon} />
                        <Text style={styles.recentSearchText}>{city}</Text>
                    </TouchableOpacity>
                ))}
            </View>
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
                    <View style={styles.content}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={handleBack}
                        >
                            <FontAwesome name="chevron-left" size={16} color="#FFFFFF" />
                        </TouchableOpacity>

                        <Text style={styles.title}>Where would you like to go?</Text>
                        <Text style={styles.subtitle}>Start typing to see suggestions</Text>

                        <View style={styles.searchContainer}>
                            <View style={styles.inputContainer}>
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#4299E1" style={styles.searchIcon} />
                                ) : (
                                    <FontAwesome name="search" size={20} color="#4299E1" style={styles.searchIcon} />
                                )}
                                <TextInput
                                    style={styles.input}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholder="Search for a city"
                                    placeholderTextColor="#718096"
                                    autoFocus
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity
                                        style={styles.clearButton}
                                        onPress={() => setSearchQuery('')}
                                    >
                                        <FontAwesome name="times-circle" size={16} color="#A0AEC0" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <Animated.View
                                style={[
                                    styles.suggestionsContainer,
                                    { opacity: fadeAnim }
                                ]}
                            >
                                {showSuggestions ? (
                                    <FlatList
                                        data={filteredCities}
                                        renderItem={renderCityItem}
                                        keyExtractor={item => item.city}
                                        keyboardShouldPersistTaps="handled"
                                    />
                                ) : (
                                    renderRecentSearches()
                                )}
                            </Animated.View>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7FAFC',
    },
    gradient: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: Spacing.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
    },
    title: {
        fontSize: 28,
        fontFamily: FontFamily.montserratBold,
        color: '#FFFFFF',
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: FontFamily.montserratMedium,
        color: '#A0AEC0',
        marginBottom: Spacing.xl,
    },
    searchContainer: {
        position: 'relative',
        zIndex: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        ...Shadow.medium,
    },
    searchIcon: {
        marginRight: Spacing.md,
    },
    input: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: FontFamily.montserratSemiBold,
        height: 40,
    },
    clearButton: {
        padding: Spacing.xs,
    },
    suggestionsContainer: {
        backgroundColor: '#2d3748',
        borderRadius: BorderRadius.lg,
        marginTop: 8,
        maxHeight: 300,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        ...Shadow.medium,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    suggestionIcon: {
        marginRight: Spacing.sm,
    },
    suggestionTextContainer: {
        flex: 1,
    },
    suggestionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: FontFamily.montserratMedium,
        letterSpacing: 0.3,
    },
    regionText: {
        color: '#718096',
        fontSize: 12,
        fontFamily: FontFamily.montserratRegular,
        marginTop: 2,
    },
    recentSearchesContainer: {
        padding: Spacing.md,
    },
    recentSearchesTitle: {
        color: '#718096',
        fontSize: 14,
        fontFamily: FontFamily.montserratSemiBold,
        marginBottom: Spacing.sm,
    },
    recentSearchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    recentSearchText: {
        color: '#A0AEC0',
        fontSize: 14,
        fontFamily: FontFamily.montserratMedium,
        marginLeft: Spacing.sm,
    },
    destinationCard: {
        backgroundColor: '#BEE3F8',
        borderRadius: 15,
        padding: 20,
        margin: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
}); 