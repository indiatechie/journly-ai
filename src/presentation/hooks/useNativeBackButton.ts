/**
 * Hook: Android hardware back button handling via @capacitor/app.
 *
 * On root route → minimize app. Otherwise → navigate back.
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Platform } from '@shared/platform';

export function useNativeBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Platform.isAndroid) return;

    let cleanup: (() => void) | undefined;

    import('@capacitor/app').then(({ App }) => {
      const listener = App.addListener('backButton', () => {
        if (location.pathname === '/') {
          App.minimizeApp();
        } else {
          navigate(-1);
        }
      });

      cleanup = () => {
        listener.then((l) => l.remove());
      };
    });

    return () => {
      cleanup?.();
    };
  }, [navigate, location.pathname]);
}
