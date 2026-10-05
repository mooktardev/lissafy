import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { ColorPicker, IconPicker } from '@/components/pickers';
import { Button, CategoryIcon, confirm, Field, Input, notify, Row, Screen, Segmented, T } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CATEGORY_ICONS, PALETTE } from '@/lib/defaults';
import type { IconName, TransactionKind } from '@/lib/types';
import { useStore } from '@/store';

export default function CategoryEdit() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string; kind?: TransactionKind }>();
  const categories = useStore((s) => s.categories);
  const existing = categories.find((c) => c.id === params.id);
  const saveCategory = useStore((s) => s.saveCategory);
  const deleteCategory = useStore((s) => s.deleteCategory);
  const usage = useStore((s) => s.transactions.filter((t) => t.categoryId === params.id).length);

  const [kind, setKind] = useState<TransactionKind>(existing?.kind ?? params.kind ?? 'expense');
  const [name, setName] = useState(existing?.name ?? '');
  const [icon, setIcon] = useState<IconName>(existing?.icon ?? 'pricetag');
  const [color, setColor] = useState(existing?.color ?? PALETTE[0]);

  const valid = name.trim().length > 0;

  const save = () => {
    if (!valid) return;
    saveCategory({ id: existing?.id, kind, name: name.trim(), icon, color });
    router.back();
  };

  const remove = async () => {
    if (!existing) return;
    const fallback = categories.find((c) => c.kind === existing.kind && c.id !== existing.id);
    if (!fallback) {
      notify('Suppression impossible', 'Il doit rester au moins une catégorie de ce type.');
      return;
    }
    const message =
      usage > 0
        ? `${usage} transaction${usage > 1 ? 's seront déplacées' : ' sera déplacée'} vers « ${fallback.name} ». Le budget associé sera supprimé.`
        : 'Le budget associé sera supprimé.';
    if (await confirm(`Supprimer « ${existing.name} » ?`, message)) {
      deleteCategory(existing.id, fallback.id);
      router.back();
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Modifier la catégorie' : 'Nouvelle catégorie' }} />
      <Row gap={Spacing.md} style={{ justifyContent: 'center' }}>
        <CategoryIcon icon={icon} color={color} size={56} />
      </Row>
      {!existing ? (
        <Segmented<TransactionKind>
          value={kind}
          onChange={setKind}
          options={[
            { value: 'expense', label: 'Dépense', color: theme.expense },
            { value: 'income', label: 'Revenu', color: theme.income },
          ]}
        />
      ) : (
        <T tone="secondary" style={{ textAlign: 'center' }}>
          Catégorie de {existing.kind === 'expense' ? 'dépenses' : 'revenus'}
        </T>
      )}
      <Field label="Nom">
        <Input value={name} onChangeText={setName} placeholder="Ex. Abonnements" maxLength={30} />
      </Field>
      <Field label="Icône">
        <IconPicker icons={CATEGORY_ICONS} value={icon} color={color} onChange={setIcon} />
      </Field>
      <Field label="Couleur">
        <ColorPicker colors={PALETTE} value={color} onChange={setColor} />
      </Field>
      <Button title="Enregistrer" icon="checkmark" onPress={save} disabled={!valid} />
      {existing ? <Button title="Supprimer" icon="trash-outline" variant="danger" onPress={remove} /> : null}
    </Screen>
  );
}
