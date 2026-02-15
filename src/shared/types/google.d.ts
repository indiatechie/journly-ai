/**
 * Type declarations for Google Identity Services (GIS) — oauth2 implicit flow.
 * @see https://developers.google.com/identity/oauth2/web/reference/js-reference
 */

declare namespace google.accounts.oauth2 {
  interface TokenClient {
    requestAccessToken(overrides?: { prompt?: string }): void;
  }

  interface TokenResponse {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
    error?: string;
    error_description?: string;
  }

  interface TokenClientConfig {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: { type: string; message: string }) => void;
    prompt?: string;
  }

  function initTokenClient(config: TokenClientConfig): TokenClient;

  function revoke(token: string, callback?: () => void): void;
}
