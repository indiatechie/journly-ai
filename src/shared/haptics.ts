/**
 * Haptic feedback wrappers — no-op on web.
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Platform } from './platform';

export async function hapticLight(): Promise<void> {
  if (!Platform.isNative) return;
  await Haptics.impact({ style: ImpactStyle.Light });
}

export async function hapticSuccess(): Promise<void> {
  if (!Platform.isNative) return;
  await Haptics.notification({ type: NotificationType.Success });
}
