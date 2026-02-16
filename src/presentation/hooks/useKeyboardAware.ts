/**
 * Hook: Keyboard visibility for native platforms.
 *
 * Returns whether the software keyboard is currently visible.
 * Always returns false on web.
 */

import { useState, useEffect } from 'react';
import { Platform } from '@shared/platform';

export function useKeyboardAware(): boolean {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (!Platform.isNative) return;

    let cleanup: (() => void) | undefined;

    import('@capacitor/keyboard').then(({ Keyboard }) => {
      const showListener = Keyboard.addListener('keyboardWillShow', () => {
        setIsKeyboardVisible(true);
      });
      const hideListener = Keyboard.addListener('keyboardWillHide', () => {
        setIsKeyboardVisible(false);
      });

      cleanup = () => {
        showListener.then((l) => l.remove());
        hideListener.then((l) => l.remove());
      };
    });

    return () => {
      cleanup?.();
    };
  }, []);

  return isKeyboardVisible;
}
