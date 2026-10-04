import { useColorScheme } from 'react-native';

import { Colors, type ThemeColors } from '@/constants/theme';
import { useStore } from '@/store';

export function useResolvedScheme(): 'light' | 'dark' {
  const system = useColorScheme();
  const mode = useStore((s) => s.settings.themeMode);
  if (mode === 'light' || mode === 'dark') return mode;
  return system === 'dark' ? 'dark' : 'light';
}

export function useTheme(): ThemeColors {
  return Colors[useResolvedScheme()];
}

export function useCurrency(): string {
  return useStore((s) => s.settings.currency);
}
