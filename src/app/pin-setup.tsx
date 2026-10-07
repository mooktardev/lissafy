import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { PinPad } from '@/components/pin-pad';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { clearPin, savePin, verifyPin } from '@/lib/security';
import { useStore } from '@/store';
import { useLock } from '@/store/lock';

type Mode = 'create' | 'change' | 'disable';
type Step = 'current' | 'new' | 'confirm';

export default function PinSetup() {
  const theme = useTheme();
  const { mode = 'create' } = useLocalSearchParams<{ mode?: Mode }>();
  const updateSettings = useStore((s) => s.updateSettings);
  const unlock = useLock((s) => s.unlock);

  const [step, setStep] = useState<Step>(mode === 'create' ? 'new' : 'current');
  const [first, setFirst] = useState('');
  const [error, setError] = useState<string | null>(null);

  const titles: Record<Step, { title: string; subtitle: string }> = {
    current: {
      title: 'Code actuel',
      subtitle: mode === 'disable' ? 'Confirmez votre code pour désactiver le verrouillage.' : 'Saisissez votre code actuel.',
    },
    new: { title: 'Nouveau code', subtitle: 'Choisissez un code à 4 chiffres.' },
    confirm: { title: 'Confirmez le code', subtitle: 'Saisissez-le une seconde fois.' },
  };

  const onComplete = async (pin: string) => {
    setError(null);
    if (step === 'current') {
      if (!(await verifyPin(pin))) return false;
      if (mode === 'disable') {
        await clearPin();
        updateSettings({ lockEnabled: false, biometricEnabled: false });
        router.back();
        return true;
      }
      setStep('new');
      return true;
    }
    if (step === 'new') {
      if (/^(\d)\1+$/.test(pin) || '0123456789'.includes(pin) || '9876543210'.includes(pin)) {
        setError('Code trop simple : évitez 0000, 1234…');
        return true;
      }
      setFirst(pin);
      setStep('confirm');
      return true;
    }
    if (pin !== first) {
      setError('Les deux codes sont différents. Recommencez.');
      setFirst('');
      setStep('new');
      return true;
    }
    await savePin(pin);
    // L'utilisateur vient de prouver qu'il connaît le code : pas de verrouillage immédiat.
    unlock();
    updateSettings({ lockEnabled: true });
    router.back();
    return true;
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, padding: Spacing.xl, justifyContent: 'center' }}>
      <Stack.Screen options={{ title: mode === 'disable' ? 'Désactiver le code' : mode === 'change' ? 'Changer le code' : 'Créer un code' }} />
      {/* `key` remet le pavé à zéro à chaque étape. */}
      <PinPad key={step} title={titles[step].title} subtitle={titles[step].subtitle} error={error} onComplete={onComplete} />
    </View>
  );
}
