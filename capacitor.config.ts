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
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a1614',
      overlaysWebView: true,
    },
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#1a1614',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'body',
      scrollAssist: true,
    },
  },
  server: {
    allowNavigation: [],
  },
};

export default config;
