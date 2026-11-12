export default {
  expo: {
    name: "Tempo Spanish",
    slug: "rn-starter",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    scheme: "tempospanish",
    plugins: [
      "expo-web-browser",
      "expo-speech-recognition",
      "expo-iap",
      "expo-asset",
      "expo-audio",
      "expo-secure-store",
      "expo-status-bar",
    ],
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#1a1a2e",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.benmartinson92.tempo",
      usesAppleSignIn: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSMicrophoneUsageDescription:
          "This app uses the microphone to record audio.",
        NSSpeechRecognitionUsageDescription:
          "This app uses speech recognition for voice commands.",
        NSPhotoLibraryUsageDescription:
          "This app does not access your photo library.",
      },
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1a1a2e",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      package: "com.benmartinson92.tempo",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      eas: {
        projectId: "5125c995-e30c-4914-a96f-ec9c59acea81",
      },
      // Development URLs - for local testing
      devBaseUrl: "http://192.168.1.124:8000",
      // devBaseUrl: "https://aqgubuisev.us-west-2.awsapprunner.com",
      // Production URLs - set via EAS environment variables or replace with your actual URLs
      productionBaseUrl: "https://aqgubuisev.us-west-2.awsapprunner.com",
      EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:
        process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      // Personal version: no sign-in. The app runs as LOCAL_USER_ID and uses
      // the Supabase admin key, which gets bundled into the app. Never
      // publish or share a build of this branch.
      LOCAL_USER_ID: process.env.LOCAL_USER_ID,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    owner: "benmartinson92",
  },
};
