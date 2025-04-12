import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSurvey } from './SurveyContext';
import { FontFamily, Spacing, BorderRadius, Shadow } from '../../constants/Theme';

// Sample cities data - Replace with API call in production
const CITIES = [
    "New York, USA",
    "London, UK",
    "Paris, France",
    "Tokyo, Japan",
    "Sydney, Australia",
    "Dubai, UAE",
    "Singapore",
    "Hong Kong",
    "Barcelona, Spain",
    "Rome, Italy",
    "Amsterdam, Netherlands",
    "Berlin, Germany",
    "Toronto, Canada",
    "San Francisco, USA",
    "Los Angeles, USA",
    "Chicago, USA",
    "Miami, USA",
    "Las Vegas, USA",
    "Vancouver, Canada",
    "Montreal, Canada"
];

export default function Location() {
    const router = useRouter();
    const { updateSurveyData } = useSurvey();
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredCities, setFilteredCities] = useState<string[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isSelected, setIsSelected] = useState(false);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (searchQuery.length > 0) {
            const filtered = CITIES.filter(city =>
                city.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredCities(filtered);
            setShowDropdown(true);
            setIsSelected(false);
        } else {
            setFilteredCities([]);
            setShowDropdown(false);
            setIsSelected(false);
        }
    }, [searchQuery]);

    const handleCitySelect = (city: string) => {
        setSearchQuery(city);
        setShowDropdown(false);
        setIsSelected(true);
        updateSurveyData('location', city);
        Keyboard.dismiss();
        inputRef.current?.blur();
        // Automatically proceed to next screen
        router.push('/survey/calendar');
    };

    const handleNext = () => {
        if (searchQuery.trim()) {
            updateSurveyData('location', searchQuery.trim());
            router.push('/survey/calendar');
        }
    };

    const handleBack = () => {
        router.back();
    };

    const handleSubmitEditing = () => {
        if (searchQuery.trim() && (filteredCities.length === 1 || isSelected)) {
            if (filteredCities.length === 1 && !isSelected) {
                handleCitySelect(filteredCities[0]);
            }
            handleNext();
        }
    };

    const renderCityItem = ({ item }: { item: string }) => (
        <TouchableOpacity
            style={[
                styles.cityItem,
                searchQuery === item && styles.selectedCityItem
            ]}
            onPress={() => handleCitySelect(item)}
        >
            <FontAwesome
                name="map-marker"
                size={16}
                color={searchQuery === item ? "#4285F4" : "#A0AEC0"}
                style={styles.cityItemIcon}
            />
            <Text style={[
                styles.cityItemText,
                searchQuery === item && styles.selectedCityItemText
            ]}>{item}</Text>
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

                        <Text style={styles.title}>Where would you like to go?</Text>
                        <Text style={styles.subtitle}>Enter the city you'd like to visit</Text>

                        <View style={styles.searchContainer}>
                            <View style={[
                                styles.inputContainer,
                                showDropdown && { marginBottom: 0 },
                                isSelected && styles.selectedInput
                            ]}>
                                <FontAwesome
                                    name="map-marker"
                                    size={20}
                                    color={isSelected ? "#4285F4" : "#A0AEC0"}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    ref={inputRef}
                                    style={styles.input}
                                    placeholder="Search for a city"
                                    placeholderTextColor="#718096"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoFocus
                                    returnKeyType="go"
                                    onSubmitEditing={handleSubmitEditing}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity
                                        style={styles.clearButton}
                                        onPress={() => {
                                            setSearchQuery('');
                                            inputRef.current?.focus();
                                        }}
                                    >
                                        <FontAwesome name="times-circle" size={16} color="#A0AEC0" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {showDropdown && (
                                <View style={styles.dropdown}>
                                    <FlatList
                                        data={filteredCities}
                                        renderItem={renderCityItem}
                                        keyExtractor={(item) => item}
                                        keyboardShouldPersistTaps="handled"
                                        style={styles.dropdownList}
                                    />
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.nextButton,
                                (!searchQuery.trim() || (!isSelected && filteredCities.length !== 1)) && styles.disabledButton,
                                isSelected && styles.selectedNextButton
                            ]}
                            onPress={handleNext}
                            disabled={!searchQuery.trim() || (!isSelected && filteredCities.length !== 1)}
                        >
                            <Text style={styles.buttonText}>Next</Text>
                            <FontAwesome name="chevron-right" size={16} color="#FFFFFF" style={styles.buttonIcon} />
                        </TouchableOpacity>
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
    searchContainer: {
        position: 'relative',
        zIndex: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        marginBottom: Spacing.xl,
        padding: Spacing.md,
    },
    inputIcon: {
        marginRight: Spacing.md,
    },
    input: {
        flex: 1,
        height: 40,
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: FontFamily.montserratMedium,
    },
    clearButton: {
        padding: Spacing.sm,
    },
    dropdown: {
        backgroundColor: '#2d3748',
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        marginTop: 4,
        maxHeight: 200,
        ...Shadow.medium,
    },
    dropdownList: {
        padding: Spacing.sm,
    },
    cityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    cityItemIcon: {
        marginRight: Spacing.sm,
    },
    cityItemText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: FontFamily.montserratMedium,
    },
    nextButton: {
        backgroundColor: '#4285F4',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 'auto',
        ...Shadow.medium,
    },
    disabledButton: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: FontFamily.montserratSemiBold,
        marginRight: Spacing.sm,
    },
    buttonIcon: {
        marginLeft: Spacing.sm,
    },
    selectedInput: {
        borderColor: '#4285F4',
        backgroundColor: 'rgba(66, 133, 244, 0.1)',
    },
    selectedCityItem: {
        backgroundColor: 'rgba(66, 133, 244, 0.1)',
    },
    selectedCityItemText: {
        color: '#4285F4',
    },
    selectedNextButton: {
        backgroundColor: '#4285F4',
        transform: [{ scale: 1.02 }],
    },
}); 