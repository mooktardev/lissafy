import { notify } from '@/components/ui';
import { exportData } from '@/lib/backup';
import { today } from '@/lib/dates';
import { selectData, useStore } from '@/store';

/** Exporte les données et retient la date de la dernière sauvegarde. */
export function useBackupExport() {
  const updateSettings = useStore((s) => s.updateSettings);
  return async () => {
    try {
      await exportData(selectData(useStore.getState()));
      updateSettings({ lastBackupAt: today(), backupSnoozedUntil: null });
    } catch (e) {
      notify('Export impossible', e instanceof Error ? e.message : String(e));
    }
  };
}
