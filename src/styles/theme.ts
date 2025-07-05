import { Platform } from 'react-native';

// Cores base
const baseColors = {
    // Primárias
    primary: '#2563EB',      // Azul profissional
    primaryLight: '#3B82F6',
    primaryDark: '#1D4ED8',

    // Secundárias
    secondary: '#10B981',    // Verde construção
    secondaryLight: '#34D399',
    secondaryDark: '#059669',

    // Accent
    accent: '#F59E0B',       // Amarelo atenção
    accentLight: '#FCD34D',
    accentDark: '#D97706',

    // Neutras
    white: '#FFFFFF',
    black: '#000000',

    // Cinzas
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',

    // Status
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Transparências
    backdrop: 'rgba(0, 0, 0, 0.5)',
    overlay: 'rgba(0, 0, 0, 0.3)',
};

// Espaçamentos
export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
    '4xl': 80,
    '5xl': 96,
};

// Tipografia
export const typography = {
    fontFamily: {
        regular: Platform.OS === 'ios' ? 'Inter-Regular' : 'Inter-Regular',
        medium: Platform.OS === 'ios' ? 'Inter-Medium' : 'Inter-Medium',
        bold: Platform.OS === 'ios' ? 'Inter-Bold' : 'Inter-Bold',
    },

    fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
        '5xl': 48,
    },

    fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },

    lineHeight: {
        tight: 1.2,
        normal: 1.4,
        relaxed: 1.6,
    },
};

// Bordas e raios
export const borderRadius = {
    none: 0,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
};

// Tamanhos de componentes
export const sizes = {
    // Botões
    button: {
        small: { height: 36, paddingHorizontal: 16 },
        medium: { height: 44, paddingHorizontal: 20 },
        large: { height: 52, paddingHorizontal: 24 },
    },

    // Inputs
    input: {
        small: { height: 36 },
        medium: { height: 44 },
        large: { height: 52 },
    },

    // Icons
    icon: {
        xs: 16,
        sm: 20,
        base: 24,
        lg: 28,
        xl: 32,
        '2xl': 40,
    },

    // Avatar
    avatar: {
        xs: 24,
        sm: 32,
        base: 40,
        lg: 48,
        xl: 56,
        '2xl': 64,
    },

    // Containers
    container: {
        maxWidth: 1200,
        paddingHorizontal: spacing.md,
    },
};

// Animações
export const animations = {
    duration: {
        fast: 150,
        normal: 200,
        slow: 300,
    },

    easing: {
        linear: 'linear',
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
    },
};

// Z-Index
export const zIndex = {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
};

// Tema claro
const lightTheme = {
    colors: {
        ...baseColors,

        // Superfícies
        background: baseColors.white,
        surface: baseColors.white,
        surfaceVariant: baseColors.gray50,
        surfaceDisabled: baseColors.gray100,

        // Textos
        text: baseColors.gray900,
        textSecondary: baseColors.gray600,
        textTertiary: baseColors.gray400,
        textDisabled: baseColors.gray300,
        textInverse: baseColors.white,

        // Bordas
        border: baseColors.gray200,
        borderLight: baseColors.gray100,
        borderDark: baseColors.gray300,

        // Inputs
        inputBackground: baseColors.white,
        inputBorder: baseColors.gray300,
        inputFocused: baseColors.primary,
        inputError: baseColors.error,

        // Cards
        cardBackground: baseColors.white,
        cardBorder: baseColors.gray200,
        cardShadow: baseColors.gray900,

        // Navigation
        navigationBackground: baseColors.white,
        navigationBorder: baseColors.gray200,
        navigationText: baseColors.gray900,
        navigationTextActive: baseColors.primary,

        // Status específicos
        successLight: '#ECFDF5',
        warningLight: '#FFFBEB',
        errorLight: '#FEF2F2',
        infoLight: '#EFF6FF',
    },

    // Sombras
    shadows: {
        small: {
            shadowColor: baseColors.gray900,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        medium: {
            shadowColor: baseColors.gray900,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 4,
        },
        large: {
            shadowColor: baseColors.gray900,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 8,
            elevation: 8,
        },
    },

    // Incluir todas as outras propriedades
    spacing,
    typography,
    borderRadius,
    sizes,
    animations,
    zIndex,
};

// Tema escuro
const darkTheme = {
    colors: {
        ...baseColors,

        // Superfícies
        background: baseColors.gray900,
        surface: baseColors.gray800,
        surfaceVariant: baseColors.gray700,
        surfaceDisabled: baseColors.gray600,

        // Textos
        text: baseColors.white,
        textSecondary: baseColors.gray300,
        textTertiary: baseColors.gray400,
        textDisabled: baseColors.gray500,
        textInverse: baseColors.gray900,

        // Bordas
        border: baseColors.gray700,
        borderLight: baseColors.gray600,
        borderDark: baseColors.gray800,

        // Inputs
        inputBackground: baseColors.gray800,
        inputBorder: baseColors.gray600,
        inputFocused: baseColors.primaryLight,
        inputError: baseColors.error,

        // Cards
        cardBackground: baseColors.gray800,
        cardBorder: baseColors.gray700,
        cardShadow: baseColors.black,

        // Navigation
        navigationBackground: baseColors.gray900,
        navigationBorder: baseColors.gray800,
        navigationText: baseColors.white,
        navigationTextActive: baseColors.primaryLight,

        // Status específicos
        successLight: '#065F46',
        warningLight: '#92400E',
        errorLight: '#991B1B',
        infoLight: '#1E40AF',
    },

    // Sombras
    shadows: {
        small: {
            shadowColor: baseColors.black,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 2,
            elevation: 2,
        },
        medium: {
            shadowColor: baseColors.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
        },
        large: {
            shadowColor: baseColors.black,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 8,
        },
    },

    // Incluir todas as outras propriedades
    spacing,
    typography,
    borderRadius,
    sizes,
    animations,
    zIndex,
};

// Tema principal
export const Theme = {
    light: lightTheme,
    dark: darkTheme,
    spacing,
    typography,
    borderRadius,
    sizes,
    animations,
    zIndex,
};

export type ThemeType = typeof lightTheme;
export type ColorKeys = keyof ThemeType['colors'];
export type SpacingKeys = keyof typeof spacing;
export type FontSizeKeys = keyof typeof typography.fontSize;

export default Theme;