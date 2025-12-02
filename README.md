# Elite Code Assistant

An AI-powered code assistant mobile app built with React, TypeScript, and Capacitor for Android.

## Features

- 🤖 AI-powered code assistant with streaming responses
- 💬 Chat-based interface with conversation history
- 🧠 Memory system that learns your coding patterns
- 🎨 Modern, responsive UI with dark theme
- 📱 Native Android app support via Capacitor

## Technologies Used

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS, Radix UI
- **Mobile**: Capacitor (Android)
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **State Management**: React Query (TanStack Query)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- [Android Studio](https://developer.android.com/studio) (for Android development)
- Java JDK 17+ (for Android builds)

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Environment Variables

Create a `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

## Building for Android

### Build the Web App

```sh
# Build the production web app
npm run build
```

### Sync to Android

```sh
# Sync web assets to Android project
npx cap sync android
```

### Build APK in Android Studio

1. Open the `android` folder in Android Studio:

   ```sh
   npx cap open android
   ```

2. Wait for Gradle sync to complete

3. Build the APK:
   - **Debug APK**: Build → Build Bundle(s) / APK(s) → Build APK(s)
   - **Release APK**: Build → Generate Signed Bundle / APK

4. The APK will be located in:
   - Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
   - Release: `android/app/build/outputs/apk/release/app-release.apk`

### Build APK via Command Line

```sh
# Navigate to android folder
cd android

# Build debug APK
./gradlew assembleDebug

# Build release APK (requires signing configuration)
./gradlew assembleRelease
```

## Project Structure

```
├── android/              # Android native project (Capacitor)
├── src/
│   ├── components/       # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── Terminal.tsx  # Main chat interface
│   │   ├── Sidebar.tsx   # Navigation sidebar
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # External service integrations
│   ├── pages/            # Page components
│   └── lib/              # Utility functions
├── capacitor.config.ts   # Capacitor configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── vite.config.ts        # Vite configuration
```

## Scripts

| Script                  | Description                    |
| ----------------------- | ------------------------------ |
| `npm run dev`           | Start development server       |
| `npm run build`         | Build for production           |
| `npm run lint`          | Run ESLint                     |
| `npm run preview`       | Preview production build       |
| `npm run format`        | Format code with Prettier      |
| `npm run format:check`  | Check code formatting          |
| `npm run test`          | Run unit tests with Vitest     |
| `npm run test:watch`    | Run tests in watch mode        |
| `npm run test:coverage` | Run tests with coverage report |

## License

This project is private and not licensed for public use.
