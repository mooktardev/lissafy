export const Colors = {
  light: {
    background: '#F4F5F9',
    card: '#FFFFFF',
    cardMuted: '#EEF0F5',
    border: '#E2E5EC',
    text: '#0F172A',
    textSecondary: '#64748B',
    primary: '#4F46E5',
    primarySoft: '#E0E7FF',
    onPrimary: '#FFFFFF',
    income: '#059669',
    incomeSoft: '#D1FAE5',
    expense: '#DC2626',
    expenseSoft: '#FEE2E2',
    warning: '#D97706',
    warningSoft: '#FEF3C7',
    overlay: 'rgba(15, 23, 42, 0.45)',
  },
  dark: {
    background: '#0B0F19',
    card: '#151B2B',
    cardMuted: '#1E2638',
    border: '#273049',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    primary: '#818CF8',
    primarySoft: '#272C5A',
    onPrimary: '#0B0F19',
    income: '#34D399',
    incomeSoft: '#0F3B2E',
    expense: '#F87171',
    expenseSoft: '#45191C',
    warning: '#FBBF24',
    warningSoft: '#3D2E0A',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.light]: string };

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const MaxContentWidth = 720;
