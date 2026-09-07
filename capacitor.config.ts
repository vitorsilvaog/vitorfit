import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vitorfit.app',
  appName: 'VitorFit',
  webDir: 'public',

  server: {
    url: 'AQUI_PONDREMOS_TU_URL_DE_VERCEL',
    cleartext: false,
  },
};

export default config;