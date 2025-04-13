import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Keyboard, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FontFamily, Spacing, BorderRadius, Shadow } from '../../constants/Theme';
import { useSurvey } from './SurveyContext';
import { CITIES } from '../data/cities';

// Fuzzy search scoring function
const getMatchScore = (city: string, query: string): number => {
    const cityLower = city.toLowerCase();
    const queryLower = query.toLowerCase();

    // Exact match gets highest priority
    if (cityLower === queryLower) return 100;
    // Starts with gets second highest priority
    if (cityLower.startsWith(queryLower)) return 75;
    // Contains gets third priority
    if (cityLower.includes(queryLower)) return 50;

    // Fuzzy match score
    let score = 0;
    let cityIndex = 0;
    for (let queryChar of queryLower) {
        while (cityIndex < cityLower.length) {
            if (cityLower[cityIndex] === queryChar) {
                score += 1;
                cityIndex++;
                break;
            }
            cityIndex++;
        }
    }
    return score;
};

// Highlight matching text component
const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight.trim()) {
        return <Text style={styles.suggestionText}>{text}</Text>;
    }

    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <Text style={styles.suggestionText}>
            {parts.map((part, index) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <Text key={index} style={styles.highlightedText}>{part}</Text>
                ) : (
                    <Text key={index}>{part}</Text>
                )
            )}
        </Text>
    );
};

export default function Departure() {
    const router = useRouter();
    const { updateSurveyData, surveyData } = useSurvey();
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredCities, setFilteredCities] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [rotationAnim] = useState(new Animated.Value(0));

    const startRotationAnimation = () => {
        Animated.sequence([
            Animated.timing(rotationAnim, {
                toValue: 1,
                duration: 40000, // Much slower - 40 seconds per rotation
                useNativeDriver: true,
            }),
            Animated.timing(rotationAnim, {
                toValue: 0,
                duration: 0,
                useNativeDriver: true,
            })
        ]).start(() => startRotationAnimation());
    };

    useEffect(() => {
        startRotationAnimation();
    }, []);

    const spin = rotationAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['45deg', '-315deg'] // Start at 45 degrees and rotate counter-clockwise
    });

    useEffect(() => {
        if (searchQuery.length > 0) {
            const scored = CITIES
                .filter(city => city.toLowerCase() !== surveyData.destination?.toLowerCase())
                .map(city => ({
                    city,
                    score: getMatchScore(city, searchQuery)
                }))
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score)
                .map(item => item.city)
                .slice(0, 10);  // Limit to top 10 results

            setFilteredCities(scored);
            setShowSuggestions(true);
            setSelectedIndex(-1);
        } else {
            setFilteredCities([]);
            setShowSuggestions(false);
        }
    }, [searchQuery]);

    const handleKeyPress = (e: any) => {
        if (e.nativeEvent.key === 'ArrowDown') {
            setSelectedIndex(prev => Math.min(prev + 1, filteredCities.length - 1));
        } else if (e.nativeEvent.key === 'ArrowUp') {
            setSelectedIndex(prev => Math.max(prev - 1, -1));
        } else if (e.nativeEvent.key === 'Enter' && selectedIndex >= 0) {
            handleCitySelect(filteredCities[selectedIndex]);
        }
    };

    const handleCitySelect = (city: string) => {
        setSearchQuery(city);
        setShowSuggestions(false);
        Keyboard.dismiss();

        // Automatically proceed after a brief delay
        setTimeout(() => {
            updateSurveyData('departure', city);
            router.push('/survey/calendar');
        }, 300);
    };

    const handleBack = () => {
        router.back();
    };

    const renderCityItem = ({ item, index }: { item: string; index: number }) => (
        <TouchableOpacity
            style={[
                styles.suggestionItem,
                index === selectedIndex && styles.selectedSuggestion
            ]}
            onPress={() => handleCitySelect(item)}
        >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <FontAwesome name="plane" size={16} color="#4299E1" />
            </Animated.View>
            <HighlightedText text={item} highlight={searchQuery} />
        </TouchableOpacity>
    );

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

                        <Text style={styles.title}>Where are you flying from?</Text>
                        <Text style={styles.subtitle}>Start typing to see suggestions</Text>

                        <View style={styles.destinationCard}>
                            <View style={styles.destinationHeader}>
                                <FontAwesome name="map-marker" size={16} color="#4299E1" />
                                <Text style={styles.destinationLabel}>Flying to</Text>
                            </View>
                            <Text style={styles.destinationText}>{surveyData.destination}</Text>
                        </View>

                        <View style={styles.searchContainer}>
                            <View style={styles.inputContainer}>
                                <FontAwesome name="search" size={20} color="#4299E1" style={styles.searchIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholder="Search for a city"
                                    placeholderTextColor="#718096"
                                    autoFocus
                                    onKeyPress={handleKeyPress}
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

                            {showSuggestions && (
                                <View style={styles.suggestionsContainer}>
                                    <FlatList
                                        data={filteredCities}
                                        renderItem={renderCityItem}
                                        keyExtractor={item => item}
                                        keyboardShouldPersistTaps="handled"
                                    />
                                </View>
                            )}
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
        backgroundColor: '#1a202c',
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
    destinationCard: {
        backgroundColor: 'rgba(66, 153, 225, 0.1)',
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
    },
    destinationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    destinationLabel: {
        fontSize: 14,
        fontFamily: FontFamily.montserratMedium,
        color: '#4299E1',
        marginLeft: Spacing.sm,
    },
    destinationText: {
        fontSize: 18,
        fontFamily: FontFamily.montserratSemiBold,
        color: '#FFFFFF',
        marginLeft: 28,
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
        marginTop: 4,
        maxHeight: 300,
        ...Shadow.medium,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    suggestionIcon: {
        marginRight: Spacing.sm,
    },
    suggestionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: FontFamily.montserratMedium,
    },
    highlightedText: {
        backgroundColor: 'rgba(66, 153, 225, 0.3)',
        color: '#FFFFFF',
    },
    selectedSuggestion: {
        backgroundColor: 'rgba(66, 153, 225, 0.2)',
    },
} as const); 