import { StyleSheet, Text, View, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef, useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { FontFamily, FontSizes, BorderRadius, Spacing, TextStyle, CardStyle } from '@/constants/Theme';

export default function SettingsScreen() {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={TextStyle.heading}>Settings</Text>

                <Animated.View style={{ opacity: fadeAnim }}>
                    <View style={styles.settingSection}>
                        <Text style={styles.sectionTitle}>Account</Text>
                        <View style={styles.settingItem}>
                            <FontAwesome name="user" size={20} color={Colors.primary} style={styles.settingIcon} />
                            <Text style={TextStyle.body}>Profile</Text>
                        </View>
                        <View style={styles.settingItem}>
                            <FontAwesome name="bell" size={20} color={Colors.primary} style={styles.settingIcon} />
                            <Text style={TextStyle.body}>Notifications</Text>
                        </View>
                        <View style={styles.settingItem}>
                            <FontAwesome name="lock" size={20} color={Colors.primary} style={styles.settingIcon} />
                            <Text style={TextStyle.body}>Privacy</Text>
                        </View>
                    </View>
                </Animated.View>

                <Animated.View style={{ opacity: fadeAnim }}>
                    <View style={styles.settingSection}>
                        <Text style={styles.sectionTitle}>Preferences</Text>
                        <View style={styles.settingItem}>
                            <FontAwesome name="language" size={20} color={Colors.primary} style={styles.settingIcon} />
                            <Text style={TextStyle.body}>Language</Text>
                        </View>
                        <View style={styles.settingItem}>
                            <FontAwesome name="money" size={20} color={Colors.primary} style={styles.settingIcon} />
                            <Text style={TextStyle.body}>Currency</Text>
                        </View>
                        <View style={styles.settingItem}>
                            <FontAwesome name="sliders" size={20} color={Colors.primary} style={styles.settingIcon} />
                            <Text style={TextStyle.body}>Units</Text>
                        </View>
                    </View>
                </Animated.View>

                <Animated.View style={{ opacity: fadeAnim }}>
                    <View style={styles.settingSection}>
                        <Text style={styles.sectionTitle}>Support</Text>
                        <View style={styles.settingItem}>
                            <FontAwesome name="envelope" size={20} color={Colors.primary} style={styles.settingIcon} />
                            <Text style={TextStyle.body}>Contact Us</Text>
                        </View>
                        <View style={styles.settingItem}>
                            <FontAwesome name="question-circle" size={20} color={Colors.primary} style={styles.settingIcon} />
                            <Text style={TextStyle.body}>FAQ</Text>
                        </View>
                        <View style={styles.settingItem}>
                            <FontAwesome name="info-circle" size={20} color={Colors.primary} style={styles.settingIcon} />
                            <Text style={TextStyle.body}>About</Text>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
        padding: Spacing.lg,
    },
    settingSection: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        ...TextStyle.subheading,
        color: Colors.primary,
        marginBottom: Spacing.sm,
    },
    settingItem: {
        ...CardStyle.container,
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        marginBottom: Spacing.sm,
    },
    settingIcon: {
        marginRight: Spacing.md,
    },
}); 