import { useEffect } from 'react';
import { useSettingsStore } from '@application/store/useSettingsStore';

/**
 * Syncs the active theme to the DOM by setting `data-theme` on `<html>`.
 * Also updates `<meta name="theme-color">` for the PWA status bar.
 */
export function useThemeEffect() {
  const theme = useSettingsStore((s) => s.preferences.theme);

  useEffect(() => {
    function apply(resolved: 'dark' | 'light') {
      document.documentElement.dataset.theme = resolved;
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', resolved === 'dark' ? '#1a1614' : '#faf7f4');
      }
    }

    if (theme !== 'system') {
      apply(theme);
      return;
    }

    // System: resolve from OS preference and listen for changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    apply(mq.matches ? 'dark' : 'light');

    function onChange(e: MediaQueryListEvent) {
      apply(e.matches ? 'dark' : 'light');
    }
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);
}
