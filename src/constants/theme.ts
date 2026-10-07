export const Colors = {
  light: {
    background: '#F5F6FA',
    card: '#FFFFFF',
    cardMuted: '#EEF0F6',
    border: '#E6E8F0',
    text: '#111428',
    textSecondary: '#6B7190',
    /** Vert pomme de la marque, pour les aplats (boutons, sélections). */
    primary: '#34C924',
    /** Vert foncé lisible pour le texte et les icônes sur fond clair (5,1:1). */
    primaryText: '#1F7F13',
    primarySoft: '#E4F8E0',
    /** Texte sur aplat vert pomme (le blanc n'y atteint que 2,2:1). */
    onPrimary: '#0B2A06',
    income: '#0E9F6E',
    incomeSoft: '#DDF6EC',
    expense: '#E5484D',
    expenseSoft: '#FDE8E8',
    warning: '#D9822B',
    warningSoft: '#FDF0DF',
    overlay: 'rgba(17, 20, 40, 0.45)',
    shadow: '0px 1px 3px rgba(32, 36, 80, 0.06)',
    tabBar: '#FFFFFF',
  },
  dark: {
    background: '#0B0D17',
    card: '#151827',
    cardMuted: '#1F2336',
    border: '#262A40',
    text: '#F2F3FA',
    textSecondary: '#9196B3',
    primary: '#34C924',
    primaryText: '#34C924',
    primarySoft: '#16301A',
    onPrimary: '#0B2A06',
    income: '#3DD598',
    incomeSoft: '#123327',
    expense: '#FF6B70',
    expenseSoft: '#3B1A1D',
    warning: '#F5A54A',
    warningSoft: '#3A2812',
    overlay: 'rgba(0, 0, 0, 0.6)',
    shadow: '0px 1px 3px rgba(0, 0, 0, 0.3)',
    tabBar: '#131625',
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.light]: string };

/** Dégradé de la carte principale (identique en clair et sombre). */
// Verts assez profonds pour que le texte blanc reste lisible.
export const HeroGradient = ['#2BA81E', '#1F8A14', '#156A0D'] as const;

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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const MaxContentWidth = 720;
