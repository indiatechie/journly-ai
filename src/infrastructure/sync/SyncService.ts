/**
 * Sync orchestrator — push/pull encrypted envelopes to/from Google Drive.
 *
 * Merge strategy (pull): last-write-wins per record based on `updatedAt`.
 */

import { APP_VERSION } from '@shared/constants';
import type { DexieStorageAdapter } from '@infrastructure/storage/DexieStorageAdapter';
import { GoogleDriveService } from './GoogleDriveService';

export interface PushResult {
  uploaded: number;
}

export interface PullResult {
  merged: number;
  added: number;
  updated: number;
}

export class SyncService {
  constructor(
    private driveService: GoogleDriveService,
    private storageAdapter: DexieStorageAdapter,
  ) {}

  /** Export all local envelopes and upload to Drive. */
  async push(): Promise<PushResult> {
    const envelopes = await this.storageAdapter.exportAll();
    await this.driveService.upload({
      version: APP_VERSION,
      syncedAt: new Date().toISOString(),
      envelopes,
    });
    return { uploaded: envelopes.length };
  }

  /** Download from Drive and merge into local storage (last-write-wins). */
  async pull(): Promise<PullResult> {
    const fileId = await this.driveService.findBackupFile();
    if (!fileId) return { merged: 0, added: 0, updated: 0 };

    const payload = await this.driveService.download(fileId);
    if (!payload.envelopes?.length) return { merged: 0, added: 0, updated: 0 };

    let added = 0;
    let updated = 0;

    for (const remote of payload.envelopes) {
      const local = await this.storageAdapter.get(remote.id);
      if (!local) {
        await this.storageAdapter.put(remote);
        added++;
      } else if (remote.updatedAt > local.updatedAt) {
        await this.storageAdapter.put(remote);
        updated++;
      }
      // else: local is newer or same — keep local
    }

    return { merged: added + updated, added, updated };
  }
}
