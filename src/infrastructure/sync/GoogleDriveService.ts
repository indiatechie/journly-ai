/**
 * Google Drive API wrapper — uses raw fetch (no SDK).
 * Operates exclusively in the hidden appDataFolder so it cannot access user files.
 */

import type { EncryptedEnvelope } from '@domain/models/EncryptedEnvelope';

const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const BACKUP_FILENAME = 'journly-backup.json';

export interface SyncPayload {
  version: string;
  syncedAt: string;
  envelopes: EncryptedEnvelope[];
}

export class GoogleDriveService {
  constructor(private accessToken: string) {}

  private headers(): HeadersInit {
    return { Authorization: `Bearer ${this.accessToken}` };
  }

  /** Find the existing backup file in the hidden appdata folder. */
  async findBackupFile(): Promise<string | null> {
    const q = encodeURIComponent(`name='${BACKUP_FILENAME}'`);
    const res = await fetch(
      `${DRIVE_FILES}?spaces=appDataFolder&q=${q}&fields=files(id)`,
      { headers: this.headers() },
    );
    if (!res.ok) throw new Error(`Drive list failed: ${res.status}`);
    const data = await res.json();
    return data.files?.[0]?.id ?? null;
  }

  /** Upload the sync payload — creates or updates the backup file. */
  async upload(payload: SyncPayload): Promise<void> {
    const existingId = await this.findBackupFile();
    const body = JSON.stringify(payload);

    const metadata = existingId
      ? {}
      : { name: BACKUP_FILENAME, parents: ['appDataFolder'] };

    const boundary = '---journly-sync-boundary';
    const multipart =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${body}\r\n` +
      `--${boundary}--`;

    const url = existingId
      ? `${DRIVE_UPLOAD}/${existingId}?uploadType=multipart`
      : `${DRIVE_UPLOAD}?uploadType=multipart`;

    const method = existingId ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        ...this.headers(),
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipart,
    });

    if (!res.ok) throw new Error(`Drive upload failed: ${res.status}`);
  }

  /** Download the sync payload from Drive. */
  async download(fileId: string): Promise<SyncPayload> {
    const res = await fetch(`${DRIVE_FILES}/${fileId}?alt=media`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`Drive download failed: ${res.status}`);
    return res.json();
  }
}
