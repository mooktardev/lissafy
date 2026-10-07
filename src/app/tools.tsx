import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { View } from 'react-native';

import { Card, CategoryIcon, GradientCard, Row, Screen, SectionHeader, StatTile, T } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useCurrency, useTheme } from '@/hooks/use-theme';
import { debtBalance, goalSaved } from '@/lib/finance';
import { formatMoney } from '@/lib/format';
import type { IconName } from '@/lib/types';
import { useStore } from '@/store';

const NET_GRADIENT = ['#2A2F55', '#1A1D38', '#111428'] as const;

function ToolCard({ icon, color, title, subtitle, href }: { icon: IconName; color: string; title: string; subtitle: string; href: Href }) {
  const theme = useTheme();
  return (
    <Card onPress={() => router.push(href)}>
      <Row gap={Spacing.md}>
        <CategoryIcon icon={icon} color={color} size={38} />
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
  const recurringCount = useStore((s) => s.recurrings.filter((r) => r.active).length);

  const savings = goals.reduce((a, g) => a + goalSaved(g), 0);
  const totalDebt = debts.reduce((a, d) => a + debtBalance(d), 0);
  const net = savings - totalDebt;

  return (
    <Screen>
      <GradientCard colors={NET_GRADIENT} style={{ gap: Spacing.xs, boxShadow: '0px 4px 12px rgba(17, 20, 40, 0.2)' }}>
        <T variant="caption" tone="inverse" style={{ opacity: 0.8 }}>
          Situation nette (épargne − dettes)
        </T>
        <T variant="hero" style={{ color: net < 0 ? '#FFB4B6' : '#7CF5C4' }} numberOfLines={1} adjustsFontSizeToFit>
          {formatMoney(net, currency, { sign: true })}
        </T>
      </GradientCard>
      <Row gap={Spacing.md}>
        <StatTile label="Épargne" value={formatMoney(savings, currency)} tone="income" icon="wallet" />
        <StatTile label="Dettes" value={formatMoney(totalDebt, currency)} tone="expense" icon="card" />
      </Row>

      <SectionHeader title="Planification" />
      <ToolCard
        icon="repeat"
        color="#34C924"
        title="Récurrences"
        subtitle={
          recurringCount
            ? `${recurringCount} active${recurringCount > 1 ? 's' : ''} · salaire, loyer, abonnements…`
            : 'Salaire, loyer, abonnements ajoutés automatiquement'
        }
        href="/recurring"
      />
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
