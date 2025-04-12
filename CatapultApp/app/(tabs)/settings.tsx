import { StyleSheet, Text, View, Animated, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { FontFamily, FontSizes, BorderRadius, Spacing, TextStyle, CardStyle, Shadow } from '@/constants/Theme';

export default function SettingsScreen() {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleSettingPress = (setting: string) => {
        console.log(`${setting} pressed`);
        // Handle navigation or action for specific setting
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
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Settings</Text>
                    </View>

                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                    >
                        <Animated.View style={[styles.settingSection, { opacity: fadeAnim }]}>
                            <Text style={styles.sectionTitle}>Account</Text>
                            <TouchableOpacity
                                style={styles.settingItem}
                                onPress={() => handleSettingPress('Profile')}
                                activeOpacity={0.8}
                            >
                                <FontAwesome name="user" size={20} color="#A0AEC0" style={styles.settingIcon} />
                                <Text style={styles.settingText}>Profile</Text>
                                <FontAwesome name="chevron-right" size={14} color="#A0AEC0" style={styles.chevron} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.settingItem}
                                onPress={() => handleSettingPress('Notifications')}
                                activeOpacity={0.8}
                            >
                                <FontAwesome name="bell" size={20} color="#A0AEC0" style={styles.settingIcon} />
                                <Text style={styles.settingText}>Notifications</Text>
                                <FontAwesome name="chevron-right" size={14} color="#A0AEC0" style={styles.chevron} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.settingItem}
                                onPress={() => handleSettingPress('Privacy')}
                                activeOpacity={0.8}
                            >
                                <FontAwesome name="lock" size={20} color="#A0AEC0" style={styles.settingIcon} />
                                <Text style={styles.settingText}>Privacy</Text>
                                <FontAwesome name="chevron-right" size={14} color="#A0AEC0" style={styles.chevron} />
                            </TouchableOpacity>
                        </Animated.View>

                        <Animated.View style={[styles.settingSection, { opacity: fadeAnim }]}>
                            <Text style={styles.sectionTitle}>Preferences</Text>
                            <TouchableOpacity
                                style={styles.settingItem}
                                onPress={() => handleSettingPress('Language')}
                                activeOpacity={0.8}
                            >
                                <FontAwesome name="language" size={20} color="#A0AEC0" style={styles.settingIcon} />
                                <Text style={styles.settingText}>Language</Text>
                                <FontAwesome name="chevron-right" size={14} color="#A0AEC0" style={styles.chevron} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.settingItem}
                                onPress={() => handleSettingPress('Currency')}
                                activeOpacity={0.8}
                            >
                                <FontAwesome name="money" size={20} color="#A0AEC0" style={styles.settingIcon} />
                                <Text style={styles.settingText}>Currency</Text>
                                <FontAwesome name="chevron-right" size={14} color="#A0AEC0" style={styles.chevron} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.settingItem}
                                onPress={() => handleSettingPress('Units')}
                                activeOpacity={0.8}
                            >
                                <FontAwesome name="sliders" size={20} color="#A0AEC0" style={styles.settingIcon} />
                                <Text style={styles.settingText}>Units</Text>
                                <FontAwesome name="chevron-right" size={14} color="#A0AEC0" style={styles.chevron} />
                            </TouchableOpacity>
                        </Animated.View>

                        <Animated.View style={[styles.settingSection, { opacity: fadeAnim }]}>
                            <Text style={styles.sectionTitle}>Support</Text>
                            <TouchableOpacity
                                style={styles.settingItem}
                                onPress={() => handleSettingPress('Contact Us')}
                                activeOpacity={0.8}
                            >
                                <FontAwesome name="envelope" size={20} color="#A0AEC0" style={styles.settingIcon} />
                                <Text style={styles.settingText}>Contact Us</Text>
                                <FontAwesome name="chevron-right" size={14} color="#A0AEC0" style={styles.chevron} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.settingItem}
                                onPress={() => handleSettingPress('FAQ')}
                                activeOpacity={0.8}
                            >
                                <FontAwesome name="question-circle" size={20} color="#A0AEC0" style={styles.settingIcon} />
                                <Text style={styles.settingText}>FAQ</Text>
                                <FontAwesome name="chevron-right" size={14} color="#A0AEC0" style={styles.chevron} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.settingItem}
                                onPress={() => handleSettingPress('About')}
                                activeOpacity={0.8}
                            >
                                <FontAwesome name="info-circle" size={20} color="#A0AEC0" style={styles.settingIcon} />
                                <Text style={styles.settingText}>About</Text>
                                <FontAwesome name="chevron-right" size={14} color="#A0AEC0" style={styles.chevron} />
                            </TouchableOpacity>
                        </Animated.View>
                    </ScrollView>
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
    header: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    headerTitle: {
        fontSize: 28,
        fontFamily: FontFamily.montserratBold,
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    content: {
        flex: 1,
        padding: Spacing.lg,
        paddingBottom: 100, // Extra padding for nav bar
    },
    settingSection: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontFamily: FontFamily.montserratSemiBold,
        fontSize: FontSizes.md,
        color: '#E2E8F0',
        marginBottom: Spacing.sm,
        letterSpacing: 0.5,
    },
    settingItem: {
        backgroundColor: '#2d3748',
        borderRadius: BorderRadius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        ...Shadow.small,
    },
    settingIcon: {
        marginRight: Spacing.md,
    },
    settingText: {
        flex: 1,
        fontFamily: FontFamily.montserratMedium,
        fontSize: FontSizes.md,
        color: '#E2E8F0',
    },
    chevron: {
        opacity: 0.7,
    },
});