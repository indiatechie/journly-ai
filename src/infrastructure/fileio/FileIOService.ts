/**
 * Cross-platform file I/O service.
 *
 * Native: Filesystem + Share for export, FilePicker for import.
 * Web: DOM Blob/anchor download, file input for import.
 */

import { Platform } from '@shared/platform';
import { APP_VERSION } from '@shared/constants';
import { storageAdapter } from '@infrastructure/storage';

async function exportNative(): Promise<void> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const { Share } = await import('@capacitor/share');

  const envelopes = await storageAdapter.exportAll();
  const json = JSON.stringify(
    { version: APP_VERSION, exportedAt: new Date().toISOString(), envelopes },
    null,
    2,
  );
  const fileName = `journly-backup-${new Date().toISOString().slice(0, 10)}.json`;

  const result = await Filesystem.writeFile({
    path: fileName,
    data: json,
    directory: Directory.Cache,
  });

  await Share.share({
    title: 'Journly Backup',
    url: result.uri,
  });
}

function exportWeb(): Promise<void> {
  return storageAdapter.exportAll().then((envelopes) => {
    const blob = new Blob(
      [JSON.stringify({ version: APP_VERSION, exportedAt: new Date().toISOString(), envelopes }, null, 2)],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journly-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

async function importNative(): Promise<unknown[]> {
  const { FilePicker } = await import('@capawesome/capacitor-file-picker');
  const { Filesystem } = await import('@capacitor/filesystem');

  const result = await FilePicker.pickFiles({
    types: ['application/json'],
    limit: 1,
  });

  const file = result.files[0];
  if (!file?.path) throw new Error('No file selected');

  const contents = await Filesystem.readFile({ path: file.path });
  const text = typeof contents.data === 'string'
    ? contents.data
    : new TextDecoder().decode(contents.data as unknown as ArrayBuffer);
  const data = JSON.parse(text);

  if (!data.envelopes || !Array.isArray(data.envelopes)) {
    throw new Error('Invalid backup file');
  }

  await storageAdapter.importAll(data.envelopes);
  return data.envelopes;
}

function importWeb(): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.envelopes || !Array.isArray(data.envelopes)) {
          throw new Error('Invalid backup file');
        }
        await storageAdapter.importAll(data.envelopes);
        resolve(data.envelopes);
      } catch (err) {
        reject(err);
      }
    };
    input.click();
  });
}

export const FileIOService = {
  exportJSON: Platform.isNative ? exportNative : exportWeb,
  importJSON: Platform.isNative ? importNative : importWeb,
};
