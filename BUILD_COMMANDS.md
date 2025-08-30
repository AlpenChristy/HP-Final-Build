# 🚀 HP Gas App - Quick Build Commands

## Essential Commands

### 📱 Android Builds
```bash
# Quick testing (APK)
npm run build:android-preview

# Production (AAB for Play Store)
npm run build:android-prod

# Development with dev client
npm run build:android-dev

# Local build (requires Android Studio)
npm run build:local-android
```

### 🍎 iOS Builds
```bash
# Production (for App Store)
npm run build:ios-prod

# Development with dev client
npm run build:ios-dev

# Local build (requires Xcode)
npm run build:local-ios
```

### 📤 Submit to Stores
```bash
# Submit Android to Play Store
npm run submit:android

# Submit iOS to App Store
npm run submit:ios
```

## Interactive Build Menu
```bash
# Run interactive build script
npm run build:interactive
```

## Utility Commands
```bash
# Clear cache and restart
npm run clean

# Lint code
npm run lint

# Prebuild native code
npm run prebuild
```

## Direct EAS Commands
```bash
# Android Preview (APK)
npx eas-cli build --platform android --profile preview

# Android Production (AAB)
npx eas-cli build --platform android --profile production

# iOS Production
npx eas-cli build --platform ios --profile production

# Check build status
npx eas-cli build:list

# Download build
npx eas-cli build:download [BUILD_ID]
```

## Local Development
```bash
# Start development server
npm start

# Start with Android
npm run android

# Start with iOS
npm run ios

# Start with web
npm run web
```

## Prerequisites Setup
```bash
# EAS CLI is available via npx (no global install needed)

# Login to Expo
npx eas-cli login

# Configure EAS
npx eas-cli build:configure
```

## Build Times
- **Development**: 10-15 minutes
- **Preview**: 15-20 minutes  
- **Production**: 20-30 minutes
- **Local**: 5-10 minutes

## Output Files
- **Android Preview**: APK file
- **Android Production**: AAB file
- **iOS**: IPA file
- **Development**: Includes Expo dev client

## Quick Start for Testing
1. `npm run build:android-preview` - Build APK for testing
2. Download and install APK on device
3. Test the app functionality
4. If issues found, fix and rebuild

## Quick Start for Production
1. `npm run build:android-prod` - Build AAB for Play Store
2. `npm run submit:android` - Submit to Play Store
3. Monitor submission in Play Console

---
**Note**: Always test preview builds before submitting to app stores!
