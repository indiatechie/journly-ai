/**
 * Google Drive sync UI — renders inside SettingsPage.
 * Handles OAuth sign-in via GoogleAuthService, push/pull, and status display.
 */

import { useState, useCallback, useEffect } from 'react';
import { GoogleDriveService } from '@infrastructure/sync/GoogleDriveService';
import { SyncService } from '@infrastructure/sync/SyncService';
import { GoogleAuthService } from '@infrastructure/auth';
import { storageAdapter } from '@infrastructure/storage';
import { useToastStore } from '@application/store/useToastStore';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const isConfigured = Boolean(CLIENT_ID);
const LAST_SYNC_KEY = 'journly-last-sync';

type Status = 'idle' | 'signing-in' | 'syncing' | 'pushing' | 'pulling';

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function GoogleDriveSync() {
  const addToast = useToastStore((s) => s.addToast);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [lastSync, setLastSync] = useState<string | null>(
    () => localStorage.getItem(LAST_SYNC_KEY),
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Restore persisted session on mount so navigating away and back doesn't log out.
  // tryRestoreSession validates the token against Google — expired tokens are cleared.
  useEffect(() => {
    if (!isConfigured || accessToken) return;
    GoogleAuthService.tryRestoreSession().then((token) => {
      if (token) setAccessToken(token);
    });
  // Only on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignIn = useCallback(async () => {
    setStatus('signing-in');
    try {
      const token = await GoogleAuthService.signIn();
      setAccessToken(token);
      addToast('Signed in to Google Drive', 'success');
    } catch (e) {
      addToast(
        'Sign-in failed',
        'error',
        e instanceof Error ? e.message : 'Unknown error',
      );
    } finally {
      setStatus('idle');
    }
  }, [addToast]);

  const handleSignOut = useCallback(async () => {
    try {
      await GoogleAuthService.signOut();
    } catch {
      // Best-effort sign out
    }
    setAccessToken(null);
    addToast('Signed out of Google Drive', 'info');
  }, [addToast]);

  const handleSync = useCallback(async () => {
    if (!accessToken) return;
    setStatus('syncing');
    try {
      const driveService = new GoogleDriveService(accessToken);
      const syncService = new SyncService(driveService, storageAdapter);
      const pushResult = await syncService.push();
      const pullResult = await syncService.pull();
      const now = new Date().toISOString();
      localStorage.setItem(LAST_SYNC_KEY, now);
      setLastSync(now);
      const uploaded = pushResult.uploaded;
      const merged = pullResult.merged;
      if (uploaded === 0 && merged === 0) {
        addToast('Already up to date', 'info');
      } else {
        addToast(
          'Sync complete',
          'success',
          [
            uploaded > 0 ? `${uploaded} backed up` : '',
            merged > 0 ? `${merged} pulled` : '',
          ]
            .filter(Boolean)
            .join(' · '),
        );
      }
    } catch (e) {
      addToast(
        'Sync failed',
        'error',
        e instanceof Error ? e.message : 'Unknown error',
      );
    } finally {
      setStatus('idle');
    }
  }, [accessToken, addToast]);

  const handlePush = useCallback(async () => {
    if (!accessToken) return;
    setStatus('pushing');
    try {
      const driveService = new GoogleDriveService(accessToken);
      const syncService = new SyncService(driveService, storageAdapter);
      const result = await syncService.push();
      const now = new Date().toISOString();
      localStorage.setItem(LAST_SYNC_KEY, now);
      setLastSync(now);
      addToast(`Backed up ${result.uploaded} record(s)`, 'success');
    } catch (e) {
      addToast(
        'Backup failed',
        'error',
        e instanceof Error ? e.message : 'Unknown error',
      );
    } finally {
      setStatus('idle');
    }
  }, [accessToken, addToast]);

  const handlePull = useCallback(async () => {
    if (!accessToken) return;
    setStatus('pulling');
    try {
      const driveService = new GoogleDriveService(accessToken);
      const syncService = new SyncService(driveService, storageAdapter);
      const result = await syncService.pull();
      const now = new Date().toISOString();
      localStorage.setItem(LAST_SYNC_KEY, now);
      setLastSync(now);
      if (result.merged === 0) {
        addToast('No new changes from Drive', 'info');
      } else {
        addToast(
          `Restored ${result.merged} record(s)`,
          'success',
          'Reload to see changes.',
        );
      }
    } catch (e) {
      addToast(
        'Restore failed',
        'error',
        e instanceof Error ? e.message : 'Unknown error',
      );
    } finally {
      setStatus('idle');
    }
  }, [accessToken, addToast]);

  const isWorking = status !== 'idle';

  if (!isConfigured) {
    return (
      <div>
        <p className="text-sm text-slate-500">
          Cloud sync requires a Google OAuth client ID.{' '}
          <span className="text-slate-400">Set <code className="text-xs bg-slate-800 px-1 py-0.5 rounded">VITE_GOOGLE_CLIENT_ID</code> in <code className="text-xs bg-slate-800 px-1 py-0.5 rounded">.env.local</code> to enable.</span>
        </p>
      </div>
    );
  }

  return (
    <div>
      {!accessToken ? (
        <>
          <button
            onClick={handleSignIn}
            disabled={isWorking}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            {status === 'signing-in' ? 'Signing in...' : 'Sign in with Google'}
          </button>
          <p className="text-xs text-slate-500 mt-2">
            If the sign-in popup is blocked, allow popups for this site in your browser settings.
          </p>
        </>
      ) : (
        <>
          {/* Primary sync CTA */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <button
              onClick={handleSync}
              disabled={isWorking}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-slate-950 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M8 16H3v5"/>
              </svg>
              {status === 'syncing' ? 'Syncing...' : 'Sync'}
            </button>
            <button
              onClick={handleSignOut}
              disabled={isWorking}
              className="px-3 py-2 text-slate-500 rounded-lg text-sm hover:text-slate-300 transition-colors disabled:opacity-50"
            >
              Sign out
            </button>
          </div>

          {/* Last synced */}
          {lastSync && (
            <p className="text-xs text-slate-500 mb-3">
              Last synced {relativeTime(lastSync)}
            </p>
          )}

          {/* Advanced: individual push / pull */}
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-400 transition-colors mb-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
            >
              <path d="m9 18 6-6-6-6"/>
            </svg>
            Advanced
          </button>
          {showAdvanced && (
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                onClick={handlePush}
                disabled={isWorking}
                className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs hover:bg-slate-700 hover:text-slate-200 transition-colors disabled:opacity-50"
              >
                {status === 'pushing' ? 'Backing up...' : '↑ Backup'}
              </button>
              <button
                onClick={handlePull}
                disabled={isWorking}
                className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs hover:bg-slate-700 hover:text-slate-200 transition-colors disabled:opacity-50"
              >
                {status === 'pulling' ? 'Restoring...' : '↓ Restore'}
              </button>
            </div>
          )}
        </>
      )}
      <p className="text-xs text-slate-600 mt-3">
        Data stays encrypted end-to-end. Google Drive stores only ciphertext.
      </p>
    </div>
  );
}
