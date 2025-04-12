import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useSurvey } from './SurveyContext';
import Colors from '../../constants/Colors';
import { Calendar } from 'react-native-calendars';
import moment from 'moment';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FontFamily, Spacing, BorderRadius, Shadow } from '../../constants/Theme';

export default function CalendarScreen() {
    const router = useRouter();
    const { updateSurveyData } = useSurvey();
    const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);
    const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);

    const handleDayPress = (day: any) => {
        if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
            setSelectedStartDate(day.dateString);
            setSelectedEndDate(null);
        } else {
            if (moment(day.dateString).isBefore(selectedStartDate)) {
                setSelectedStartDate(day.dateString);
                setSelectedEndDate(null);
            } else {
                setSelectedEndDate(day.dateString);
            }
        }
    };

    const getMarkedDates = () => {
        const markedDates: any = {};

        if (selectedStartDate) {
            markedDates[selectedStartDate] = {
                selected: true,
                color: '#4285F4',
                textColor: 'white',
                startingDay: true
            };
        }

        if (selectedStartDate && selectedEndDate) {
            markedDates[selectedEndDate] = {
                selected: true,
                color: '#4285F4',
                textColor: 'white',
                endingDay: true
            };

            // Mark dates in between
            let currentDate = moment(selectedStartDate).add(1, 'days');
            const endDate = moment(selectedEndDate);

            while (currentDate.isBefore(endDate)) {
                const dateString = currentDate.format('YYYY-MM-DD');
                markedDates[dateString] = {
                    selected: true,
                    color: 'rgba(66, 133, 244, 0.3)',
                    textColor: '#1a202c'
                };
                currentDate.add(1, 'days');
            }
        }

        return markedDates;
    };

    const handleNext = () => {
        if (selectedStartDate && selectedEndDate) {
            const duration = moment(selectedEndDate).diff(moment(selectedStartDate), 'days') + 1;
            updateSurveyData('duration', duration);
            updateSurveyData('startDate', selectedStartDate);
            updateSurveyData('endDate', selectedEndDate);
            router.push('/survey/budget');
        }
    };

    const handleBack = () => {
        router.back();
    };

    const isValid = selectedStartDate && selectedEndDate;
    const minDate = moment().format('YYYY-MM-DD');
    const maxDate = moment().add(2, 'years').format('YYYY-MM-DD');

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

                        <Text style={styles.title}>When is your trip?</Text>
                        <Text style={styles.subtitle}>Select your travel dates</Text>

                        <View style={styles.calendarContainer}>
                            <Calendar
                                minDate={minDate}
                                maxDate={maxDate}
                                onDayPress={handleDayPress}
                                markedDates={getMarkedDates()}
                                markingType="period"
                                enableSwipeMonths={true}
                                theme={{
                                    backgroundColor: 'transparent',
                                    calendarBackground: 'transparent',
                                    textSectionTitleColor: '#A0AEC0',
                                    selectedDayBackgroundColor: '#4285F4',
                                    selectedDayTextColor: '#FFFFFF',
                                    todayTextColor: '#4285F4',
                                    dayTextColor: '#FFFFFF',
                                    textDisabledColor: '#718096',
                                    dotColor: '#4285F4',
                                    selectedDotColor: '#FFFFFF',
                                    arrowColor: '#FFFFFF',
                                    monthTextColor: '#FFFFFF',
                                    textDayFontFamily: FontFamily.montserratMedium,
                                    textMonthFontFamily: FontFamily.montserratSemiBold,
                                    textDayHeaderFontFamily: FontFamily.montserratMedium,
                                    textDayFontSize: 16,
                                    textMonthFontSize: 18,
                                    textDayHeaderFontSize: 14
                                }}
                            />
                        </View>

                        {selectedStartDate && !selectedEndDate && (
                            <View style={styles.infoContainer}>
                                <Text style={styles.infoText}>
                                    <FontAwesome
                                        name="calendar"
                                        size={16}
                                        color="#4285F4"
                                        style={styles.infoIcon}
                                    />
                                    Select end date
                                </Text>
                            </View>
                        )}

                        {selectedStartDate && selectedEndDate && (
                            <View style={styles.infoContainer}>
                                <Text style={styles.dateRangeText}>
                                    <FontAwesome
                                        name="calendar"
                                        size={16}
                                        color="#4285F4"
                                        style={styles.infoIcon}
                                    />
                                    {moment(selectedStartDate).format('MMM D')} - {moment(selectedEndDate).format('MMM D, YYYY')}
                                </Text>
                                <Text style={styles.durationText}>
                                    Trip duration: {moment(selectedEndDate).diff(moment(selectedStartDate), 'days') + 1} days
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.nextButton,
                                !isValid && styles.disabledButton,
                                isValid && styles.selectedNextButton
                            ]}
                            onPress={handleNext}
                            disabled={!isValid}
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
    calendarContainer: {
        borderRadius: BorderRadius.lg,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: Spacing.md,
        marginBottom: Spacing.xl,
        ...Shadow.medium,
    },
    infoContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.xl,
    },
    infoText: {
        fontSize: 16,
        fontFamily: FontFamily.montserratMedium,
        color: '#A0AEC0',
        alignItems: 'center',
        textAlign: 'center',
    },
    infoIcon: {
        marginRight: Spacing.sm,
    },
    dateRangeText: {
        fontSize: 16,
        fontFamily: FontFamily.montserratSemiBold,
        color: '#FFFFFF',
        marginBottom: Spacing.sm,
    },
    durationText: {
        fontSize: 16,
        fontFamily: FontFamily.montserratMedium,
        color: '#4285F4',
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
    selectedNextButton: {
        backgroundColor: '#4285F4',
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