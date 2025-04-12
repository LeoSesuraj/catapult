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
                                <View style={styles.dateRow}>
                                    <View style={styles.iconContainer}>
                                        <FontAwesome name="calendar" size={16} color="#4285F4" />
                                    </View>
                                    <View style={styles.dateInfo}>
                                        <View style={styles.dateRange}>
                                            <Text style={styles.dateLabel}>Start</Text>
                                            <Text style={styles.dateText}>{moment(selectedStartDate).format('MMM D, YYYY')}</Text>
                                        </View>
                                        <View style={styles.dateDivider} />
                                        <View style={styles.dateRange}>
                                            <Text style={styles.dateLabel}>End</Text>
                                            <Text style={styles.dateText}>{moment(selectedEndDate).format('MMM D, YYYY')}</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.durationContainer}>
                                    <Text style={styles.durationText}>
                                        {moment(selectedEndDate).diff(moment(selectedStartDate), 'days') + 1} days
                                    </Text>
                                </View>
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
        padding: Spacing.lg,
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
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
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
    dateInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateRange: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 12,
        fontFamily: FontFamily.montserratMedium,
        color: '#A0AEC0',
        marginBottom: 4,
    },
    dateText: {
        fontSize: 16,
        fontFamily: FontFamily.montserratSemiBold,
        color: '#FFFFFF',
    },
    dateDivider: {
        width: 1,
        height: '80%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginHorizontal: Spacing.md,
    },
    durationContainer: {
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    durationText: {
        fontSize: 16,
        fontFamily: FontFamily.montserratMedium,
        color: '#4285F4',
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