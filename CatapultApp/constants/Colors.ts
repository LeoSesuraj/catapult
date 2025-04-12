/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

/**
 * Colors for the Minimalist Wanderlust style
 */

const tintColorLight = '#B3D4FF';
const tintColorDark = '#fff';

export const Colors = {
  primary: '#B3D4FF', // Light blue
  secondary: '#FFD1DC', // Blush pink
  accent: '#C1E1C1', // Mint green
  gold: '#E6C200', // Subtle gold
  white: '#FFFFFF', // White background
  offWhite: '#F8F8F8', // Off-white for cards
  black: '#000000',
  lightGray: '#F5F5F5',
  gray: '#CCCCCC',
  mediumGray: '#666666', // Medium gray text
  darkGray: '#333333', // Dark gray text
  text: '#333333',
  background: '#FFFFFF',
  error: '#FF6B6B',
  success: '#4BB543',
  warning: '#FFD700',
  light: {
    text: '#333333',
    background: '#fff',
    tint: tintColorLight,
    icon: '#333333',
    tabIconDefault: '#666666',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export default Colors;
