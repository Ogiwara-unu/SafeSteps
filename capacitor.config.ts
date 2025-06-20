import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.una.trabajo',
  appName: 'SafeSteps',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: [
      "maps.googleapis.com"
    ]
  },
  plugins: {
     FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: [
        "google.com"
      ]
    },
    GoogleMaps: {
      apiKey: "AIzaSyD32TSwPDCUrFbWea_r7zkCzuxfXXOZbkM",
      androidKey: "AIzaSyD32TSwPDCUrFbWea_r7zkCzuxfXXOZbkM"
    },
    
  }
  
};

export default config;