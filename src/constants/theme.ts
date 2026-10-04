export const Colors = {
  light: {
    background: '#F5F6FA',
    card: '#FFFFFF',
    cardMuted: '#EEF0F6',
    border: '#E6E8F0',
    text: '#111428',
    textSecondary: '#6B7190',
    primary: '#5B4CF0',
    primarySoft: '#ECEAFE',
    onPrimary: '#FFFFFF',
    income: '#0E9F6E',
    incomeSoft: '#DDF6EC',
    expense: '#E5484D',
    expenseSoft: '#FDE8E8',
    warning: '#D9822B',
    warningSoft: '#FDF0DF',
    overlay: 'rgba(17, 20, 40, 0.45)',
    shadow: '0px 6px 20px rgba(32, 36, 80, 0.07)',
    tabBar: '#FFFFFF',
  },
  dark: {
    background: '#0B0D17',
    card: '#151827',
    cardMuted: '#1F2336',
    border: '#262A40',
    text: '#F2F3FA',
    textSecondary: '#9196B3',
    primary: '#8C80FF',
    primarySoft: '#26224F',
    onPrimary: '#FFFFFF',
    income: '#3DD598',
    incomeSoft: '#123327',
    expense: '#FF6B70',
    expenseSoft: '#3B1A1D',
    warning: '#F5A54A',
    warningSoft: '#3A2812',
    overlay: 'rgba(0, 0, 0, 0.6)',
    shadow: '0px 6px 20px rgba(0, 0, 0, 0.35)',
    tabBar: '#131625',
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.light]: string };

/** Dégradé de la carte principale (identique en clair et sombre). */
export const HeroGradient = ['#7B5CFA', '#5B4CF0', '#3F3BD1'] as const;

export const Fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const MaxContentWidth = 720;
