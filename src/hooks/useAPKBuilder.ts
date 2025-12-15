import { useState, useCallback } from "react";

interface APKBuildState {
  isAPKRequest: boolean;
  buildStep: "idle" | "detected" | "preparing" | "ready";
  instructions: string[];
}

// Keywords that indicate user wants APK build
const APK_KEYWORDS = [
  "apk", "android", "build apk", "convert to apk", "make apk",
  "create apk", "export apk", "generate apk", "wrap as apk",
  "android app", "mobile app", "native app", "package app",
  "deploy android", "install on phone"
];

export const useAPKBuilder = () => {
  const [buildState, setBuildState] = useState<APKBuildState>({
    isAPKRequest: false,
    buildStep: "idle",
    instructions: [],
  });

  const detectAPKRequest = useCallback((message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    return APK_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
  }, []);

  const getAPKInstructions = useCallback((): string[] => {
    return [
      "1. Transfer project to GitHub via 'Export to GitHub' button",
      "2. Clone the repository locally: git clone <repo-url>",
      "3. Install dependencies: npm install",
      "4. Add Android platform: npx cap add android",
      "5. Build the project: npm run build",
      "6. Sync with Capacitor: npx cap sync android",
      "7. Open in Android Studio: npx cap open android",
      "8. Build APK: Build > Build Bundle(s) / APK(s) > Build APK(s)",
      "9. Find APK at: android/app/build/outputs/apk/debug/app-debug.apk"
    ];
  }, []);

  const triggerAPKBuild = useCallback(() => {
    setBuildState({
      isAPKRequest: true,
      buildStep: "detected",
      instructions: getAPKInstructions(),
    });
  }, [getAPKInstructions]);

  const resetBuildState = useCallback(() => {
    setBuildState({
      isAPKRequest: false,
      buildStep: "idle",
      instructions: [],
    });
  }, []);

  const processMessage = useCallback((message: string) => {
    if (detectAPKRequest(message)) {
      triggerAPKBuild();
      return true;
    }
    return false;
  }, [detectAPKRequest, triggerAPKBuild]);

  return {
    buildState,
    processMessage,
    triggerAPKBuild,
    resetBuildState,
    detectAPKRequest,
    getAPKInstructions,
  };
};
