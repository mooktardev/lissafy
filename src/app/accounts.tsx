import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, CategoryIcon, GradientCard, Row, Screen, SectionHeader, T } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAccountBalances } from '@/hooks/use-accounts';
import { useCurrency, useTheme } from '@/hooks/use-theme';
import { ACCOUNT_TYPES } from '@/lib/accounts';
import { formatMoney } from '@/lib/format';

export default function Accounts() {
  const theme = useTheme();
  const currency = useCurrency();
  const { accounts, balances, total } = useAccountBalances();

  return (
    <Screen>
      <GradientCard style={{ gap: Spacing.xs }}>
        <T variant="caption" tone="inverse" style={{ opacity: 0.85 }}>
          Disponible sur mes comptes
        </T>
        <T variant="hero" tone="inverse" numberOfLines={1} adjustsFontSizeToFit>
          {formatMoney(total, currency)}
        </T>
        <T variant="caption" tone="inverse" style={{ opacity: 0.8 }}>
          {accounts.length} compte{accounts.length > 1 ? 's' : ''}
        </T>
      </GradientCard>

      <Row gap={Spacing.md}>
        <Button
          title="Virement"
          icon="swap-horizontal"
          variant="secondary"
          style={{ flex: 1 }}
          disabled={accounts.length < 2}
          onPress={() => router.push('/transfer')}
        />
        <Button title="Nouveau compte" icon="add" style={{ flex: 1 }} onPress={() => router.push('/account-edit')} />
      </Row>
      {accounts.length < 2 ? (
        <T variant="caption" tone="secondary">
          Ajoutez un deuxième compte (espèces, mobile money…) pour faire des virements entre eux.
        </T>
      ) : null}

      <SectionHeader title="Mes comptes" />
      {accounts.map((a) => {
        const balance = balances.get(a.id) ?? 0;
        return (
          <Card key={a.id} onPress={() => router.push({ pathname: '/account/[id]', params: { id: a.id } })}>
            <Row gap={Spacing.md}>
              <CategoryIcon icon={ACCOUNT_TYPES[a.type].icon} color={a.color} />
              <View style={{ flex: 1 }}>
                <T variant="bodyBold" numberOfLines={1}>
                  {a.name}
                </T>
                <T variant="caption" tone="secondary">
                  {ACCOUNT_TYPES[a.type].label}
                </T>
              </View>
              <T variant="amount" tone={balance < 0 ? 'expense' : 'default'}>
                {formatMoney(balance, currency)}
              </T>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </Row>
          </Card>
        );
      })}
    </Screen>
  );
}
