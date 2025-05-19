import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.una.trabajo',
  appName: 'SafeSteps',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    cleartext: true, 
    androidScheme: 'http', 
    
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: [
        "google.com"
      ]
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }, GoogleMaps: {
      apiKey: "-----", // Reemplaza con tu clave de API      
    },
  }
};

export default config;
