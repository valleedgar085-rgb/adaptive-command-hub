import { useState, useCallback } from "react";

export interface APKInstruction {
  step: string;
  details: string;
  command?: string;
  tip?: string;
}

interface APKBuildState {
  isAPKRequest: boolean;
  buildStep: "idle" | "detected" | "preparing" | "ready";
  instructions: APKInstruction[];
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

  const getAPKInstructions = useCallback((): { step: string; details: string; command?: string; tip?: string }[] => {
    return [
      {
        step: "Export to GitHub",
        details: "Transfer your project to a GitHub repository using the 'Export to GitHub' button in the project settings. This creates a copy of your code that you can clone locally.",
        tip: "Make sure you have a GitHub account connected to Lovable"
      },
      {
        step: "Clone Repository",
        details: "Clone your newly created repository to your local machine. This downloads all the project files to your computer.",
        command: "git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git && cd YOUR_REPO",
        tip: "Replace YOUR_USERNAME and YOUR_REPO with your actual GitHub details"
      },
      {
        step: "Install Dependencies",
        details: "Install all Node.js dependencies required by the project. This includes React, Capacitor, and all other packages.",
        command: "npm install",
        tip: "Make sure you have Node.js v18+ installed"
      },
      {
        step: "Add Android Platform",
        details: "Add the Android platform to your Capacitor project. This creates the native Android project structure in the 'android' folder.",
        command: "npx cap add android",
        tip: "You only need to run this once per project"
      },
      {
        step: "Build Web Assets",
        details: "Build the production version of your web application. This compiles TypeScript, bundles assets, and creates optimized files.",
        command: "npm run build",
        tip: "Fix any TypeScript errors before proceeding"
      },
      {
        step: "Sync Capacitor",
        details: "Sync your web build with the native Android project. This copies your built web assets into the Android app and updates native plugins.",
        command: "npx cap sync android",
        tip: "Run this after every web build change"
      },
      {
        step: "Open Android Studio",
        details: "Open the Android project in Android Studio. This lets you configure app settings, signing, and build the final APK.",
        command: "npx cap open android",
        tip: "Android Studio must be installed (download from developer.android.com)"
      },
      {
        step: "Configure App",
        details: "In Android Studio: Update app name in android/app/src/main/res/values/strings.xml, replace app icons in android/app/src/main/res/mipmap-* folders, and configure version in android/app/build.gradle.",
        tip: "Use Android Asset Studio to generate proper icon sizes"
      },
      {
        step: "Build APK",
        details: "Generate the APK file: In Android Studio, go to Build > Build Bundle(s) / APK(s) > Build APK(s). Wait for the build to complete.",
        tip: "For release builds, you'll need to configure signing keys"
      },
      {
        step: "Locate APK",
        details: "Find your built APK at: android/app/build/outputs/apk/debug/app-debug.apk. You can install this directly on Android devices.",
        tip: "Enable 'Install from unknown sources' on your Android device to install the APK"
      }
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
