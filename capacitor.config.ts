import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.elitecodeassistant.app',
  appName: 'Elite Code Assistant',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
  },
};

export default config;
