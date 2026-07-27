import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getAllMeals } from './db';
import { loadProfile } from './profile';

// Bundles everything needed for the Health & Fitness Hub analysis (see
// /Users/lily/Documents/Claude/health-and-fitness/README.md) into one JSON object.
export function buildExportData() {
  return {
    exportedAt: new Date().toISOString(),
    profile: loadProfile(),
    mealEntries: getAllMeals(),
  };
}

// Writes the export JSON to a temp file and opens the share sheet so the
// user can save it to Google Drive (folder: "Finder Food Exports").
export async function exportDataToShareSheet() {
  const data = buildExportData();
  const dateStr = new Date().toISOString().split('T')[0];
  const fileUri = `${FileSystem.cacheDirectory}finderfood-export-${dateStr}.json`;

  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/json',
    dialogTitle: 'Save Finder Food export to Drive',
    UTI: 'public.json',
  });

  return fileUri;
}
