import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { IconName } from '@/lib/types';

type TabIconProps = { color: ColorValue; focused: boolean; size: number };

function TabIcon({ name, focusedName, color, focused }: TabIconProps & { name: IconName; focusedName: IconName }) {
  return <Ionicons name={focused ? focusedName : name} color={color} size={24} />;
}

const icon = (name: IconName, focusedName: IconName) =>
  function TabBarIcon(props: TabIconProps) {
    return <TabIcon name={name} focusedName={focusedName} {...props} />;
  };

function AddButton() {
  const theme = useTheme();
  return (
    <View style={styles.addSlot}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ajouter une transaction"
        onPress={() => router.push('/transaction')}
        style={({ pressed }) => [
          styles.addButton,
          { backgroundColor: theme.primary, boxShadow: `0px 8px 20px ${theme.primary}66`, borderColor: theme.tabBar },
          pressed && { transform: [{ scale: 0.94 }] },
        ]}>
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: { fontFamily: Fonts.semibold, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopWidth: 0,
          height: 64 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
          boxShadow: '0px -4px 24px rgba(20, 24, 60, 0.08)',
        },
        sceneStyle: { backgroundColor: theme.background },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen
        name="transactions"
        options={{ title: 'Activité', tabBarIcon: icon('receipt-outline', 'receipt') }}
      />
      <Tabs.Screen
        name="add"
        options={{ title: 'Ajouter', tabBarButton: () => <AddButton /> }}
      />
      <Tabs.Screen name="budget" options={{ title: 'Budget', tabBarIcon: icon('pie-chart-outline', 'pie-chart') }} />
      <Tabs.Screen name="goals" options={{ title: 'Objectifs', tabBarIcon: icon('flag-outline', 'flag') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addSlot: { flex: 1, alignItems: 'center' },
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginTop: -22,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
