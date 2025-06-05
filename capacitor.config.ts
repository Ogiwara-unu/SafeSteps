import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.una.trabajo',
  appName: 'unaapp',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    cleartext: true, 
    androidScheme: 'http', 
    
  },
  plugins: {
    Camera: {
      permissions: ["camera", "photos"]
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: [
        "google.com"
      ]
    },
    
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    GoogleMaps: {
        apiKey: "AIzaSyD32TSwPDCUrFbWea_r7zkCzuxfXXOZbkM",
      },
  }
};

export default config;
 