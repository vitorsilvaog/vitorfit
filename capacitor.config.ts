import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vitorfit.app',
  appName: 'VitorFit',
  webDir: 'public',
  server: {
    url: 'https://vitorfit.es',
    cleartext: false,
  },
};

export default config;