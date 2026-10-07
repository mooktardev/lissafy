import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Card, CategoryIcon, Divider, Fab, Row, Screen, Segmented, T } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isSystemCategory } from '@/lib/defaults';
import type { TransactionKind } from '@/lib/types';
import { useStore } from '@/store';

export default function Categories() {
  const theme = useTheme();
  const categories = useStore((s) => s.categories);
  const transactions = useStore((s) => s.transactions);
  const [kind, setKind] = useState<TransactionKind>('expense');

  const counts = new Map<string, number>();
  for (const t of transactions) counts.set(t.categoryId, (counts.get(t.categoryId) ?? 0) + 1);
  const list = categories.filter((c) => c.kind === kind);

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <Segmented<TransactionKind>
          value={kind}
          onChange={setKind}
          options={[
            { value: 'expense', label: 'Dépenses', color: theme.expense },
            { value: 'income', label: 'Revenus', color: theme.income },
          ]}
        />
        <Card style={{ paddingVertical: Spacing.xs }}>
          {list.map((c, i) => (
            <View key={c.id}>
              {i > 0 ? <Divider /> : null}
              <Pressable
                onPress={() => router.push({ pathname: '/category', params: { id: c.id } })}
                style={({ pressed }) => [{ paddingVertical: Spacing.sm }, pressed && { opacity: 0.6 }]}>
                <Row gap={Spacing.md}>
                  <CategoryIcon icon={c.icon} color={c.color} />
                  <View style={{ flex: 1 }}>
                    <T variant="bodyBold">{c.name}</T>
                    <T variant="caption" tone="secondary">
                      {counts.get(c.id) ?? 0} transaction{(counts.get(c.id) ?? 0) > 1 ? 's' : ''}
                      {isSystemCategory(c.id) ? ' · automatique' : ''}
                    </T>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                </Row>
              </Pressable>
            </View>
          ))}
        </Card>
      </Screen>
      <Fab label="Nouvelle catégorie" onPress={() => router.push({ pathname: '/category', params: { kind } })} />
    </View>
  );
}
