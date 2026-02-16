/**
 * Centralized platform detection using Capacitor.
 */

import { Capacitor } from '@capacitor/core';

const platform = Capacitor.getPlatform();

export const Platform = {
  isNative: Capacitor.isNativePlatform(),
  isIOS: platform === 'ios',
  isAndroid: platform === 'android',
  isWeb: platform === 'web',
} as const;
