import { Colors } from './Colors';

export const FontSizes = {
    xs: 12,
    sm: 14, // Body text
    md: 16, // Subheadings
    lg: 18,
    xl: 20, // Headings
    xxl: 24,
    xxxl: 30,
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const BorderRadius = {
    sm: 4,
    md: 8,
    lg: 15, // Cards - 15px radius
    xl: 20,
    xxl: 25, // Buttons - 25px radius
    round: 9999,
};

export const FontFamily = {
    montserratRegular: 'Montserrat_400Regular',
    montserratMedium: 'Montserrat_500Medium',
    montserratSemiBold: 'Montserrat_600SemiBold',
    montserratBold: 'Montserrat_700Bold',
};

export const Shadow = {
    subtle: {
        shadowColor: Colors.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    small: {
        shadowColor: Colors.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    medium: {
        shadowColor: Colors.black,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
};

export const CardStyle = {
    container: {
        backgroundColor: Colors.offWhite,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.secondary, // Blush pink border
        ...Shadow.small,
    },
};

export const ButtonStyle = {
    primary: {
        backgroundColor: Colors.accent, // Mint green background
        borderRadius: BorderRadius.xxl, // 25px radius
        borderWidth: 1,
        borderColor: Colors.gold, // Subtle gold border
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        ...Shadow.small,
    },
    primaryText: {
        fontFamily: FontFamily.montserratSemiBold,
        fontSize: FontSizes.sm,
        color: Colors.white, // White text
    },
};

export const TextStyle = {
    heading: {
        fontFamily: FontFamily.montserratBold,
        fontSize: FontSizes.xl, // 20px
        color: Colors.darkGray, // #333333
    },
    subheading: {
        fontFamily: FontFamily.montserratMedium,
        fontSize: FontSizes.md, // 16px
        color: Colors.darkGray, // #333333
    },
    body: {
        fontFamily: FontFamily.montserratRegular,
        fontSize: FontSizes.sm, // 14px
        color: Colors.mediumGray, // #666666
    },
    highlighted: {
        fontFamily: FontFamily.montserratMedium,
        fontSize: FontSizes.sm,
        color: Colors.primary, // Light blue #B3D4FF
    },
};

export const IconStyle = {
    default: {
        size: 20,
        color: Colors.darkGray,
    },
    accent: {
        size: 20,
        color: Colors.primary,
    },
};

export const Divider = {
    default: {
        height: 1,
        backgroundColor: Colors.accent, // Mint green
        marginVertical: Spacing.md,
    },
};

const Theme = {
    colors: Colors,
    fontSizes: FontSizes,
    spacing: Spacing,
    borderRadius: BorderRadius,
    fontFamily: FontFamily,
    shadow: Shadow,
    cardStyle: CardStyle,
    buttonStyle: ButtonStyle,
    textStyle: TextStyle,
    iconStyle: IconStyle,
    divider: Divider,
};

export default Theme; 