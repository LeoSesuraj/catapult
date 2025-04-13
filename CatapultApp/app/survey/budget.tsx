import { View, Text, TouchableOpacity, StyleSheet, TextInput, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { useSurvey } from './SurveyContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FontFamily, Spacing, BorderRadius, Shadow } from '../../constants/Theme';
import LoadingScreen from '../components/LoadingScreen';

type BudgetTierIconType = 'dollar' | 'home' | 'star';

interface BudgetTier {
    name: string;
    description: string;
    icon: BudgetTierIconType;
    color: string;
}

const BUDGET_TIERS: Record<string, BudgetTier> = {
    budget: {
        name: 'Budget',
        description: 'Hostels & Motels\nPublic Transit & Walking\nStreet Food & Local Eats',
        icon: 'dollar',
        color: '#4299E1' // Blue
    },
    comfort: {
        name: 'Comfort',
        description: '3-Star Hotels\nRide Sharing & Car Rentals\nCasual Restaurants',
        icon: 'home',
        color: '#48BB78' // Green
    },
    luxury: {
        name: 'Luxury',
        description: '4-5 Star Hotels\nPrivate Transport\nFine Dining & Experiences',
        icon: 'star',
        color: '#9F7AEA' // Purple
    }
};

export default function Budget() {
    const router = useRouter();
    const { updateSurveyData, surveyData } = useSurvey();
    const [selectedTier, setSelectedTier] = useState<keyof typeof BUDGET_TIERS | null>(null);
    const [showCustomBudget, setShowCustomBudget] = useState(false);
    const [budget, setBudget] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleBudgetChange = (text: string) => {
        const cleanedText = text.replace(/[^0-9.]/g, '');
        const parts = cleanedText.split('.');
        const formattedText = parts.length > 1 ? `${parts[0]}.${parts[1]}` : cleanedText;

        setBudget(formattedText);

        const numBudget = parseFloat(formattedText);
        if (formattedText === '') {
            setError('Please enter your budget');
        } else if (isNaN(numBudget)) {
            setError('Please enter a valid number');
        } else if (numBudget <= 0) {
            setError('Budget must be greater than 0');
        } else if (numBudget > 1000000) {
            setError('Budget cannot exceed 1,000,000');
        } else {
            setError(null);
        }
    };

    const handleTierSelect = (tier: keyof typeof BUDGET_TIERS) => {
        setSelectedTier(tier);
        // Set a default budget based on the tier
        const defaultBudgets: Record<keyof typeof BUDGET_TIERS, number> = {
            budget: 1000,
            comfort: 2000,
            luxury: 3500
        };
        setBudget(defaultBudgets[tier].toString());
        setError(null);
    };

    const handleNext = () => {
        if (selectedTier) {
            const finalBudget = showCustomBudget && !error && budget ? parseFloat(budget) : parseFloat(budget);

            // Update survey context
            updateSurveyData('budget', finalBudget);
            updateSurveyData('budgetTier', selectedTier);

            // Navigate to confirmation screen
            router.push('/survey/confirmation');
        }
    };

    const handleBack = () => {
        router.back();
    };

    const isValid = selectedTier && (!showCustomBudget || (showCustomBudget && !error && parseFloat(budget) > 0));

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

                        <Text style={styles.title}>What's your style?</Text>
                        <Text style={styles.subtitle}>Choose your travel budget tier</Text>

                        <View style={styles.tiersContainer}>
                            {Object.entries(BUDGET_TIERS).map(([key, tier]) => (
                                <TouchableOpacity
                                    key={key}
                                    style={[
                                        styles.tierCard,
                                        selectedTier === key && { borderColor: tier.color }
                                    ]}
                                    onPress={() => handleTierSelect(key as keyof typeof BUDGET_TIERS)}
                                >
                                    <View style={styles.tierHeader}>
                                        <View style={[styles.tierIcon, { backgroundColor: tier.color }]}>
                                            <FontAwesome name={tier.icon} size={20} color="#FFFFFF" />
                                        </View>
                                        <Text style={styles.tierName}>{tier.name}</Text>
                                    </View>
                                    <Text style={styles.tierDescription}>{tier.description}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.customBudgetToggle}
                            onPress={() => setShowCustomBudget(!showCustomBudget)}
                        >
                            <Text style={styles.customBudgetText}>
                                {showCustomBudget ? 'Hide custom budget' : 'Add custom budget (optional)'}
                            </Text>
                            <FontAwesome
                                name={showCustomBudget ? 'chevron-up' : 'chevron-down'}
                                size={12}
                                color="#A0AEC0"
                                style={styles.customBudgetIcon}
                            />
                        </TouchableOpacity>

                        {showCustomBudget && (
                            <View style={styles.budgetContainer}>
                                <View style={styles.inputRow}>
                                    <View style={styles.iconContainer}>
                                        <FontAwesome name="dollar" size={16} color="#4285F4" />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        value={budget}
                                        onChangeText={handleBudgetChange}
                                        placeholder="0.00"
                                        placeholderTextColor="#718096"
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                {error && <Text style={styles.errorText}>{error}</Text>}
                            </View>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.nextButton,
                                !isValid && styles.disabledButton,
                                isValid && styles.activeButton
                            ]}
                            onPress={handleNext}
                            disabled={!isValid}
                        >
                            <Text style={styles.buttonText}>Next</Text>
                            <FontAwesome name="arrow-right" size={16} color="#FFFFFF" style={styles.buttonIcon} />
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
    tiersContainer: {
        marginBottom: Spacing.md,
    },
    tierCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        borderWidth: 2,
        borderColor: 'transparent',
        ...Shadow.medium,
    },
    tierHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    tierIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    tierName: {
        fontSize: 16,
        fontFamily: FontFamily.montserratBold,
        color: '#FFFFFF',
    },
    tierDescription: {
        fontSize: 13,
        fontFamily: FontFamily.montserratMedium,
        color: '#CBD5E0',
        lineHeight: 18,
        marginLeft: 40, // Align with the text after icon
    },
    customBudgetToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    customBudgetText: {
        fontSize: 14,
        fontFamily: FontFamily.montserratMedium,
        color: '#A0AEC0',
        marginRight: Spacing.xs,
    },
    customBudgetIcon: {
        marginLeft: 4,
    },
    budgetContainer: {
        borderRadius: BorderRadius.lg,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: Spacing.lg,
        marginBottom: Spacing.xl,
        ...Shadow.medium,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: BorderRadius.lg,
        padding: Spacing.sm,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(66, 133, 244, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    input: {
        flex: 1,
        height: 40,
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: FontFamily.montserratSemiBold,
    },
    errorText: {
        color: '#FC8181',
        fontSize: 14,
        fontFamily: FontFamily.montserratMedium,
        marginTop: Spacing.md,
        textAlign: 'center',
    },
    nextButton: {
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 'auto',
        ...Shadow.medium,
    },
    disabledButton: {
        backgroundColor: 'rgba(66, 133, 244, 0.5)',
        opacity: 0.5,
    },
    activeButton: {
        backgroundColor: '#4299E1', // Blue color for Next
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
});