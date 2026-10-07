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
  return <Ionicons name={focused ? focusedName : name} color={color} size={22} />;
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
          { backgroundColor: theme.primary, boxShadow: `0px 3px 8px ${theme.primary}4D`, borderColor: theme.tabBar },
          pressed && { transform: [{ scale: 0.94 }] },
        ]}>
        <Ionicons name="add" size={28} color={theme.onPrimary} />
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
        tabBarActiveTintColor: theme.primaryText,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: { fontFamily: Fonts.semibold, fontSize: 11, lineHeight: 14, height: 14, flexShrink: 0 },
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopWidth: 0,
          height: 58 + insets.bottom,
          paddingTop: 0,
          paddingBottom: insets.bottom,
          boxShadow: '0px -1px 4px rgba(20, 24, 60, 0.06)',
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
    width: 52,
    height: 52,
    borderRadius: 26,
    marginTop: -18,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
