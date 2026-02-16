import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.journly.app',
  appName: 'Journly.ai',
  webDir: 'dist',
  plugins: {
    SocialLogin: {
      google: {
        webClientId: process.env.VITE_GOOGLE_CLIENT_ID ?? '',
      },
    },
  },
};

export default config;
