import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.una.trabajo',
  appName: 'SafeSteps',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    GoogleMaps: {
      apiKey: "AIzaSyDSCv6W8l5bCHFyl5cG4VE4PCzkGNZr7mg",
      androidKey: "AIzaSyAAb1_mY84IYvsaN6HKTgFnrQkHxawgOcM"
    }
  },
    server: {
    allowNavigation: [
      "maps.googleapis.com"
    ]
  }
};

export default config;