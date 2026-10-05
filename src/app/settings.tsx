import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, View } from "react-native";

import {
    Button,
    Card,
    confirm,
    Divider,
    Input,
    notify,
    Row,
    Screen,
    SectionHeader,
    Segmented,
    T,
} from "@/components/ui";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { exportData, pickBackup } from "@/lib/backup";
import { CURRENCIES, formatMoney } from "@/lib/format";
import type { ThemeMode } from "@/lib/types";
import { selectData, useStore } from "@/store";

export default function Settings() {
  const theme = useTheme();
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const importData = useStore((s) => s.importData);
  const resetAll = useStore((s) => s.resetAll);
  const counts = {
    t: useStore((s) => s.transactions.length),
    g: useStore((s) => s.goals.length),
    d: useStore((s) => s.debts.length),
  };
  const [showAllCurrencies, setShowAllCurrencies] = useState(false);
  const [customCode, setCustomCode] = useState("");

  const visibleCurrencies = showAllCurrencies
    ? CURRENCIES
    : CURRENCIES.filter((c, i) => i < 5 || c.code === settings.currency);

  const applyCustom = () => {
    const code = customCode.trim().toUpperCase();
    try {
      new Intl.NumberFormat("fr-FR", { style: "currency", currency: code });
      if (!/^[A-Z]{3}$/.test(code)) throw new Error();
      updateSettings({ currency: code });
      setCustomCode("");
    } catch {
      notify(
        "Code invalide",
        "Saisissez un code ISO 4217 à 3 lettres (ex. EUR, XOF, USD).",
      );
    }
  };

  const onExport = async () => {
    try {
      await exportData(selectData(useStore.getState()));
    } catch (e) {
      notify("Export impossible", e instanceof Error ? e.message : String(e));
    }
  };

  const onImport = async () => {
    try {
      const data = await pickBackup();
      if (!data) return;
      const ok = await confirm(
        "Remplacer les données ?",
        `La sauvegarde contient ${data.transactions.length} transactions, ${data.goals.length} objectifs et ${data.debts.length} dettes. Vos données actuelles seront remplacées.`,
        "Importer",
      );
      if (ok) {
        importData(data);
        notify("Import terminé", "Vos données ont été restaurées.");
      }
    } catch (e) {
      notify("Import impossible", e instanceof Error ? e.message : String(e));
    }
  };

  const onReset = async () => {
    if (
      await confirm(
        "Tout effacer ?",
        "Toutes vos transactions, budgets, objectifs et dettes seront supprimés définitivement.",
        "Tout effacer",
      )
    ) {
      resetAll();
    }
  };

  return (
    <Screen>
      <SectionHeader title="Apparence" />
      <Segmented<ThemeMode>
        value={settings.themeMode}
        onChange={(themeMode) => updateSettings({ themeMode })}
        options={[
          { value: "system", label: "Système" },
          { value: "light", label: "Clair" },
          { value: "dark", label: "Sombre" },
        ]}
      />

      <SectionHeader title="Devise" />
      <Card style={{ paddingVertical: Spacing.xs }}>
        {visibleCurrencies.map((c, i) => {
          const selected = c.code === settings.currency;
          return (
            <View key={c.code}>
              {i > 0 ? <Divider /> : null}
              <Pressable
                onPress={() => updateSettings({ currency: c.code })}
                style={{ paddingVertical: Spacing.md }}
              >
                <Row>
                  <View style={{ flex: 1 }}>
                    <T variant={selected ? "bodyBold" : "body"}>{c.label}</T>
                    <T variant="caption" tone="secondary">
                      {formatMoney(1234.5, c.code)}
                    </T>
                  </View>
                  {selected ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={theme.primary}
                    />
                  ) : null}
                </Row>
              </Pressable>
            </View>
          );
        })}
      </Card>
      <Button
        title={showAllCurrencies ? "Moins de devises" : "Plus de devises"}
        variant="ghost"
        onPress={() => setShowAllCurrencies(!showAllCurrencies)}
      />
      {!CURRENCIES.some((c) => c.code === settings.currency) ? (
        <T tone="secondary">
          Devise personnalisée active : {settings.currency}
        </T>
      ) : null}
      <Row>
        <View style={{ flex: 1 }}>
          <Input
            value={customCode}
            onChangeText={setCustomCode}
            placeholder="Autre code (ex. JPY)"
            autoCapitalize="characters"
            maxLength={3}
          />
        </View>
        <Button
          title="Utiliser"
          variant="secondary"
          onPress={applyCustom}
          disabled={customCode.trim().length !== 3}
        />
      </Row>

      <SectionHeader title="Données" />
      <Card style={{ gap: Spacing.md }}>
        <Row>
          <Ionicons name="lock-closed" size={16} color={theme.income} />
          <T variant="caption" tone="secondary" style={{ flex: 1 }}>
            Vos données restent sur cet appareil. Exportez-les régulièrement
            pour les sauvegarder ou les transférer.
          </T>
        </Row>
        <T variant="caption" tone="secondary">
          {counts.t} transactions · {counts.g} objectifs · {counts.d} dettes
        </T>
        <Button
          title="Exporter (JSON)"
          icon="download-outline"
          variant="secondary"
          onPress={onExport}
        />
        <Button
          title="Importer une sauvegarde"
          icon="cloud-upload-outline"
          variant="secondary"
          onPress={onImport}
        />
        <Button
          title="Tout effacer"
          icon="trash-outline"
          variant="danger"
          onPress={onReset}
        />
      </Card>

      <T variant="caption" tone="secondary" style={{ textAlign: "center" }}>
        Lissafy · version 1.0.0
      </T>
    </Screen>
  );
}
