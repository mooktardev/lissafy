import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { ColorPicker, DateField, IconPicker } from '@/components/pickers';
import { AmountInput, Button, Field, Input, Screen } from '@/components/ui';
import { useCurrency } from '@/hooks/use-theme';
import { GOAL_ICONS, PALETTE } from '@/lib/defaults';
import { amountToInput, parseAmount } from '@/lib/format';
import type { IconName, ISODate } from '@/lib/types';
import { useStore } from '@/store';

export default function GoalEdit() {
  const currency = useCurrency();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useStore((s) => s.goals.find((g) => g.id === id));
  const saveGoal = useStore((s) => s.saveGoal);

  const [name, setName] = useState(existing?.name ?? '');
  const [target, setTarget] = useState(amountToInput(existing?.target ?? 0));
  const [deadline, setDeadline] = useState<ISODate | null>(existing?.deadline ?? null);
  const [icon, setIcon] = useState<IconName>(existing?.icon ?? 'airplane');
  const [color, setColor] = useState(existing?.color ?? PALETTE[0]);

  const value = parseAmount(target);
  const valid = name.trim().length > 0 && Number.isFinite(value) && value > 0;

  const save = () => {
    if (!valid) return;
    saveGoal({ id: existing?.id, name: name.trim(), target: value, deadline, icon, color });
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? "Modifier l'objectif" : 'Nouvel objectif' }} />
      <Field label="Nom">
        <Input value={name} onChangeText={setName} placeholder="Ex. Fonds d'urgence" maxLength={50} autoFocus={!existing} />
      </Field>
      <Field label="Montant cible">
        <AmountInput value={target} onChangeText={setTarget} suffix={currency} />
      </Field>
      <Field label="Échéance (facultatif)" hint="Avec une échéance, l'effort d'épargne mensuel est calculé automatiquement.">
        <DateField value={deadline} onChange={setDeadline} allowClear placeholder="Aucune échéance" />
      </Field>
      <Field label="Icône">
        <IconPicker icons={GOAL_ICONS} value={icon} color={color} onChange={setIcon} />
      </Field>
      <Field label="Couleur">
        <ColorPicker colors={PALETTE} value={color} onChange={setColor} />
      </Field>
      <Button title="Enregistrer" icon="checkmark" onPress={save} disabled={!valid} />
    </Screen>
  );
}
