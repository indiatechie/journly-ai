/**
 * Google Drive sync UI — renders inside SettingsPage.
 * Handles OAuth sign-in, push/pull, and status display.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleDriveService } from '@infrastructure/sync/GoogleDriveService';
import { SyncService } from '@infrastructure/sync/SyncService';
import { storageAdapter } from '@infrastructure/storage';

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const LAST_SYNC_KEY = 'journly-last-sync';

type Status = 'idle' | 'signing-in' | 'pushing' | 'pulling';

function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${GIS_SCRIPT_URL}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

export function GoogleDriveSync() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [feedback, setFeedback] = useState('');
  const [lastSync, setLastSync] = useState<string | null>(
    () => localStorage.getItem(LAST_SYNC_KEY),
  );
  const tokenClientRef = useRef<google.accounts.oauth2.TokenClient | null>(null);

  // Clean up token on unmount
  useEffect(() => {
    return () => {
      setAccessToken(null);
    };
  }, []);

  const handleSignIn = useCallback(async () => {
    if (!CLIENT_ID) {
      setFeedback('Google Client ID not configured. Set VITE_GOOGLE_CLIENT_ID in .env.local');
      return;
    }

    setStatus('signing-in');
    setFeedback('');

    try {
      await loadGisScript();

      if (!tokenClientRef.current) {
        tokenClientRef.current = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: DRIVE_SCOPE,
          callback: (response) => {
            if (response.error) {
              setFeedback(`Sign-in failed: ${response.error_description || response.error}`);
              setStatus('idle');
              return;
            }
            setAccessToken(response.access_token);
            setFeedback('Signed in to Google Drive.');
            setStatus('idle');
          },
          error_callback: (error) => {
            setFeedback(`Sign-in error: ${error.message}`);
            setStatus('idle');
          },
        });
      }

      tokenClientRef.current.requestAccessToken({ prompt: '' });
    } catch {
      setFeedback('Failed to load Google sign-in. Check your connection.');
      setStatus('idle');
    }
  }, []);

  const handleSignOut = useCallback(() => {
    if (accessToken) {
      google.accounts.oauth2.revoke(accessToken);
    }
    setAccessToken(null);
    tokenClientRef.current = null;
    setFeedback('Signed out of Google Drive.');
  }, [accessToken]);

  const handlePush = useCallback(async () => {
    if (!accessToken) return;
    setStatus('pushing');
    setFeedback('');
    try {
      const driveService = new GoogleDriveService(accessToken);
      const syncService = new SyncService(driveService, storageAdapter);
      const result = await syncService.push();
      const now = new Date().toISOString();
      localStorage.setItem(LAST_SYNC_KEY, now);
      setLastSync(now);
      setFeedback(`Pushed ${result.uploaded} record(s) to Google Drive.`);
    } catch (e) {
      setFeedback(`Push failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setStatus('idle');
    }
  }, [accessToken]);

  const handlePull = useCallback(async () => {
    if (!accessToken) return;
    setStatus('pulling');
    setFeedback('');
    try {
      const driveService = new GoogleDriveService(accessToken);
      const syncService = new SyncService(driveService, storageAdapter);
      const result = await syncService.pull();
      const now = new Date().toISOString();
      localStorage.setItem(LAST_SYNC_KEY, now);
      setLastSync(now);
      if (result.merged === 0) {
        setFeedback('No new changes from Drive.');
      } else {
        setFeedback(
          `Pulled ${result.added} new, ${result.updated} updated record(s). Reload to see changes.`,
        );
      }
    } catch (e) {
      setFeedback(`Pull failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setStatus('idle');
    }
  }, [accessToken]);

  const isWorking = status !== 'idle';

  return (
    <div>
      {!accessToken ? (
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
      ) : (
        <>
          <div className="flex flex-wrap gap-3 mb-3">
            <button
              onClick={handlePush}
              disabled={isWorking}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {status === 'pushing' ? 'Pushing...' : 'Push to Drive'}
            </button>
            <button
              onClick={handlePull}
              disabled={isWorking}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {status === 'pulling' ? 'Pulling...' : 'Pull from Drive'}
            </button>
            <button
              onClick={handleSignOut}
              disabled={isWorking}
              className="px-4 py-2 text-slate-500 rounded-lg text-sm hover:text-slate-300 transition-colors disabled:opacity-50"
            >
              Sign out
            </button>
          </div>
          {lastSync && (
            <p className="text-xs text-slate-500 mb-2">
              Last sync: {new Date(lastSync).toLocaleString()}
            </p>
          )}
        </>
      )}
      {feedback && (
        <p className="text-sm text-slate-400 mt-2">{feedback}</p>
      )}
      <p className="text-xs text-slate-600 mt-3">
        Data stays encrypted end-to-end. Google Drive stores only ciphertext.
        {!CLIENT_ID && (
          <span className="block mt-1 text-amber-500/80">
            Set VITE_GOOGLE_CLIENT_ID in .env.local to enable.
          </span>
        )}
      </p>
    </div>
  );
}
