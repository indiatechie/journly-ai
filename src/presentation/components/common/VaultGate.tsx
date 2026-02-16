/**
 * VaultGate — warm, welcoming vault setup and unlock screen.
 */

import { useState } from 'react';
import { useEncryption } from '@presentation/hooks/useEncryption';
import { MIN_PASSPHRASE_LENGTH } from '@shared/constants';
import { hapticSuccess } from '@shared/haptics';

export function VaultGate({ children }: { children: React.ReactNode }) {
  const { isUnlocked, isFirstLaunch, setupVault, unlockVault } = useEncryption();
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (isUnlocked) return <>{children}</>;

  const handleSetup = async () => {
    if (passphrase.length < MIN_PASSPHRASE_LENGTH) {
      setError(`Passphrase must be at least ${MIN_PASSPHRASE_LENGTH} characters`);
      return;
    }
    if (passphrase !== confirmPassphrase) {
      setError('Passphrases do not match');
      return;
    }
    setError('');
    setIsLoading(true);
    const ok = await setupVault(passphrase);
    setIsLoading(false);
    if (ok) void hapticSuccess();
    else setError('Failed to set up vault. Please try again.');
  };

  const handleUnlock = async () => {
    setError('');
    setIsLoading(true);
    const ok = await unlockVault(passphrase);
    setIsLoading(false);
    if (ok) void hapticSuccess();
    else setError('Wrong passphrase. Please try again.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void (isFirstLaunch ? handleSetup() : handleUnlock());
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-slate-950 text-slate-100 p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-slate-100">
            {isFirstLaunch ? 'Journly' : 'Welcome back'}
          </h1>
          <p className="text-slate-400 text-sm">
            {isFirstLaunch
              ? 'Create a passphrase to encrypt your journal'
              : 'Enter your passphrase to unlock'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Passphrase"
            autoFocus
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 placeholder:text-slate-400 outline-none focus:border-primary transition-colors"
          />

          {isFirstLaunch && (
            <input
              type="password"
              value={confirmPassphrase}
              onChange={(e) => setConfirmPassphrase(e.target.value)}
              placeholder="Confirm passphrase"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 placeholder:text-slate-400 outline-none focus:border-primary transition-colors"
            />
          )}

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || passphrase.length === 0}
            className="w-full bg-primary hover:bg-primary-hover text-slate-950 rounded-lg px-4 py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? 'Please wait...'
              : isFirstLaunch
                ? 'Create Vault'
                : 'Unlock'}
          </button>
        </form>

        <p className="text-slate-400 text-xs text-center mt-6">
          Everything here is private and encrypted.
          {isFirstLaunch && ' Remember your passphrase — it cannot be recovered.'}
        </p>
      </div>
    </div>
  );
}
