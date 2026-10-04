import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { View } from 'react-native';

import { Card, CategoryIcon, Row, Screen, SectionHeader, StatTile, T } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useCurrency, useTheme } from '@/hooks/use-theme';
import { debtBalance, goalSaved } from '@/lib/finance';
import { formatMoney } from '@/lib/format';
import type { IconName } from '@/lib/types';
import { useStore } from '@/store';

function ToolCard({ icon, color, title, subtitle, href }: { icon: IconName; color: string; title: string; subtitle: string; href: Href }) {
  const theme = useTheme();
  return (
    <Card onPress={() => router.push(href)}>
      <Row gap={Spacing.md}>
        <CategoryIcon icon={icon} color={color} size={44} />
        <View style={{ flex: 1 }}>
          <T variant="bodyBold">{title}</T>
          <T variant="caption" tone="secondary">
            {subtitle}
          </T>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </Row>
    </Card>
  );
}

export default function Tools() {
  const currency = useCurrency();
  const goals = useStore((s) => s.goals);
  const debts = useStore((s) => s.debts);
  const categories = useStore((s) => s.categories);

  const savings = goals.reduce((a, g) => a + goalSaved(g), 0);
  const totalDebt = debts.reduce((a, d) => a + debtBalance(d), 0);
  const net = savings - totalDebt;

  return (
    <Screen>
      <Row gap={Spacing.md}>
        <StatTile label="Épargne" value={formatMoney(savings, currency)} tone="income" icon="wallet" />
        <StatTile label="Dettes" value={formatMoney(totalDebt, currency)} tone="expense" icon="card" />
      </Row>
      <Card style={{ gap: Spacing.xs }}>
        <T variant="caption" tone="secondary">
          Situation nette (épargne − dettes)
        </T>
        <T variant="amountLarge" tone={net < 0 ? 'expense' : 'income'}>
          {formatMoney(net, currency, { sign: true })}
        </T>
      </Card>

      <SectionHeader title="Planification" />
      <ToolCard
        icon="trending-up"
        color="#10B981"
        title="Simulateur d'épargne"
        subtitle="Projetez votre épargne avec les intérêts composés"
        href="/simulator"
      />
      <ToolCard
        icon="card"
        color="#EF4444"
        title="Dettes & prêts"
        subtitle={debts.length ? `${debts.length} en cours · ${formatMoney(totalDebt, currency)}` : 'Suivez vos crédits et leur échéancier'}
        href="/debts"
      />

      <SectionHeader title="Paramètres" />
      <ToolCard
        icon="pricetags"
        color="#A855F7"
        title="Catégories"
        subtitle={`${categories.length} catégories de dépenses et revenus`}
        href="/categories"
      />
      <ToolCard icon="settings" color="#64748B" title="Réglages" subtitle="Devise, thème, sauvegarde des données" href="/settings" />
    </Screen>
  );
}
