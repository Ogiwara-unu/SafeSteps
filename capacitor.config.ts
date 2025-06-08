import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.una.trabajo',
  appName: 'SafeSteps',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    GoogleMaps: {
      apiKey: "AIzaSyD32TSwPDCUrFbWea_r7zkCzuxfXXOZbkM",
      androidKey: "AIzaSyD32TSwPDCUrFbWea_r7zkCzuxfXXOZbkM"
    }
  },
    server: {
    allowNavigation: [
      "maps.googleapis.com"
    ]
  }
};

export default config;