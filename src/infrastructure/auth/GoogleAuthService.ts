/**
 * Platform-aware Google Auth service.
 * Uses @capgo/capacitor-social-login for native (Android/iOS) and web.
 * Only the sign-in mechanism differs — GoogleDriveService and SyncService
 * remain platform-agnostic (they just need an access token string).
 */

import { SocialLogin } from '@capgo/capacitor-social-login';
import type { GoogleLoginResponseOnline } from '@capgo/capacitor-social-login';

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

let initialized = false;

export const GoogleAuthService = {
  /** Initialize the plugin (safe to call multiple times). */
  async initialize(): Promise<void> {
    if (initialized) return;
    if (!CLIENT_ID) {
      throw new Error('Google Client ID not configured. Set VITE_GOOGLE_CLIENT_ID in .env.local');
    }

    await SocialLogin.initialize({
      google: {
        webClientId: CLIENT_ID,
        mode: 'online',
      },
    });
    initialized = true;
  },

  /** Sign in and return an access token for Google Drive API calls. */
  async signIn(): Promise<string> {
    await this.initialize();

    const { result } = await SocialLogin.login({
      provider: 'google',
      options: {
        scopes: [DRIVE_SCOPE],
      },
    });

    if (result.responseType !== 'online') {
      throw new Error('Unexpected offline response from Google Sign-In');
    }

    const online = result as GoogleLoginResponseOnline;
    if (!online.accessToken?.token) {
      throw new Error('No access token received from Google Sign-In');
    }

    return online.accessToken.token;
  },

  /**
   * Return the access token from the persisted capgo session, or null if none.
   * Synchronous — reads directly from localStorage. No network call.
   * The token may be expired; callers should handle auth failures gracefully.
   */
  getStoredToken(): string | null {
    try {
      const raw = localStorage.getItem('capgo_social_login_google_state');
      if (!raw) return null;
      const { accessToken } = JSON.parse(raw) as { accessToken?: string };
      return accessToken || null;
    } catch {
      return null;
    }
  },

  /** Sign out of Google. */
  async signOut(): Promise<void> {
    await SocialLogin.logout({ provider: 'google' });
  },

  /** Refresh the current session (re-triggers token fetch). */
  async refresh(): Promise<void> {
    await SocialLogin.refresh({
      provider: 'google',
      options: {
        scopes: [DRIVE_SCOPE],
      },
    });
  },
} as const;
