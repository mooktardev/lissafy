import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import type { IconName } from '@/lib/types';

type TabIconProps = { color: ColorValue; focused: boolean; size: number };

function TabIcon({ name, focusedName, color, focused, size }: TabIconProps & { name: IconName; focusedName: IconName }) {
  return <Ionicons name={focused ? focusedName : name} color={color} size={size} />;
}

const icon = (name: IconName, focusedName: IconName) =>
  function TabBarIcon(props: TabIconProps) {
    return <TabIcon name={name} focusedName={focusedName} {...props} />;
  };

export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
        headerStyle: { backgroundColor: theme.background },
        headerShadowVisible: false,
        headerTitleStyle: { color: theme.text, fontWeight: '700' },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen
        name="transactions"
        options={{ title: 'Transactions', tabBarIcon: icon('swap-vertical-outline', 'swap-vertical') }}
      />
      <Tabs.Screen name="budget" options={{ title: 'Budget', tabBarIcon: icon('pie-chart-outline', 'pie-chart') }} />
      <Tabs.Screen name="goals" options={{ title: 'Objectifs', tabBarIcon: icon('flag-outline', 'flag') }} />
      <Tabs.Screen name="tools" options={{ title: 'Outils', tabBarIcon: icon('grid-outline', 'grid') }} />
    </Tabs>
  );
}
