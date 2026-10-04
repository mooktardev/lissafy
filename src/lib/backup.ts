import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { isAppData, type AppData } from '@/store';

import { today } from './dates';

type Backup = { app: 'planifin'; version: 1; exportedAt: string; data: AppData };

export async function exportData(data: AppData): Promise<void> {
  const backup: Backup = { app: 'planifin', version: 1, exportedAt: new Date().toISOString(), data };
  const json = JSON.stringify(backup, null, 2);
  const filename = `planifin-${today()}.json`;

  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Le partage de fichiers n'est pas disponible sur cet appareil.");
  }
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Exporter mes données', UTI: 'public.json' });
}

/** Ouvre un fichier de sauvegarde. Retourne `null` si l'utilisateur annule. */
export async function pickBackup(): Promise<AppData | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const text = asset.file ? await asset.file.text() : await new File(asset.uri).text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Ce fichier n'est pas un JSON valide.");
  }
  const data = (parsed as Partial<Backup>)?.app === 'planifin' ? (parsed as Backup).data : parsed;
  if (!isAppData(data)) {
    throw new Error("Ce fichier n'est pas une sauvegarde Planifin.");
  }
  return data;
}
