import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FontFamily, Spacing, BorderRadius, Shadow } from '../../constants/Theme';
import { useSurvey } from './SurveyContext';
import { CITIES } from '../data/cities';

export default function Departure() {
    const router = useRouter();
    const { updateSurveyData, surveyData } = useSurvey();
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredCities, setFilteredCities] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (searchQuery.length > 0) {
            const filtered = CITIES.filter(city =>
                city.toLowerCase().includes(searchQuery.toLowerCase()) &&
                city.toLowerCase() !== surveyData.destination?.toLowerCase()
            );
            setFilteredCities(filtered);
            setShowSuggestions(true);
        } else {
            setFilteredCities([]);
            setShowSuggestions(false);
        }
    }, [searchQuery]);

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

    const renderCityItem = ({ item }: { item: string }) => (
        <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() => handleCitySelect(item)}
        >
            <FontAwesome name="plane" size={16} color="#4299E1" style={[styles.suggestionIcon, { transform: [{ rotate: '-45deg' }] }]} />
            <Text style={styles.suggestionText}>{item}</Text>
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
}); 