# HP Gas App - Build Guide

This guide provides all the necessary commands to build your HP Gas app for different platforms and environments.

## Prerequisites

Before building, ensure you have:

1. **Node.js** (v18 or higher)
2. **Expo CLI** installed globally: `npm install -g @expo/cli`
3. **EAS CLI** installed globally: `npm install -g eas-cli`
4. **Expo account** and logged in: `npx eas login`

## Quick Build Commands

### Using npm scripts (Recommended)

```bash
# Development builds
npm run build:android-dev    # Android development build
npm run build:ios-dev        # iOS development build

# Preview builds (for testing)
npm run build:android-preview # Android APK for testing

# Production builds
npm run build:android-prod   # Android AAB for Play Store
npm run build:ios-prod       # iOS for App Store

# Local builds (requires Android Studio/Xcode)
npm run build:local-android  # Local Android build
npm run build:local-ios      # Local iOS build

# Submit to stores
npm run submit:android       # Submit Android to Play Store
npm run submit:ios          # Submit iOS to App Store
```

## Detailed Build Commands

### 1. Development Builds

Development builds include the Expo development client and allow you to use Expo Go features.

```bash
# Android Development Build
npx eas build --platform android --profile development

# iOS Development Build
npx eas build --platform ios --profile development
```

### 2. Preview Builds

Preview builds create installable APK files for testing.

```bash
# Android Preview Build (APK)
npx eas build --platform android --profile preview
```

### 3. Production Builds

Production builds create optimized files for app store submission.

```bash
# Android Production Build (AAB)
npx eas build --platform android --profile production

# iOS Production Build
npx eas build --platform ios --profile production
```

### 4. Local Builds

Local builds require Android Studio (Android) or Xcode (iOS) to be installed.

```bash
# Prebuild native code
expo prebuild --clean

# Local Android build
expo run:android

# Local iOS build
expo run:ios
```

## Build Configuration

### EAS Build Profiles

The build profiles are defined in `eas.json`:

- **development**: Includes development client, debug configuration
- **preview**: Creates APK for testing, internal distribution
- **production**: Creates AAB for Play Store, optimized for release

### Environment Variables

For production builds, you may need to set environment variables:

```bash
# Set environment variables
export EXPO_PUBLIC_API_URL="your-api-url"
export EXPO_PUBLIC_FIREBASE_CONFIG="your-firebase-config"

# Then run build
npx eas build --platform android --profile production
```

## Build Process Steps

### 1. Prepare for Build

```bash
# Clear cache and start fresh
npm run clean

# Install dependencies
npm install

# Check for any issues
npm run lint
```

### 2. Configure EAS (First time only)

```bash
# Login to Expo
npx eas login

# Configure EAS build
npx eas build:configure
```

### 3. Build the App

```bash
# Choose your build type and run
npm run build:android-preview  # For testing
npm run build:android-prod     # For production
```

### 4. Monitor Build Progress

- Builds run on Expo's servers
- Monitor progress in terminal or Expo dashboard
- Download builds when complete

## Platform-Specific Commands

### Android Builds

```bash
# Development build with development client
npx eas build --platform android --profile development

# Preview build (APK) for testing
npx eas build --platform android --profile preview

# Production build (AAB) for Play Store
npx eas build --platform android --profile production

# Local build with Android Studio
expo run:android
```

### iOS Builds

```bash
# Development build
npx eas build --platform ios --profile development

# Production build for App Store
npx eas build --platform ios --profile production

# Local build with Xcode
expo run:ios
```

## Troubleshooting Build Issues

### Common Issues and Solutions

1. **Build Fails with Dependencies**
   ```bash
   # Clear cache and reinstall
   npm run clean
   npm install
   ```

2. **Metro Cache Issues**
   ```bash
   # Clear Metro cache
   npx expo start --clear
   ```

3. **Native Module Issues**
   ```bash
   # Rebuild native code
   expo prebuild --clean
   ```

4. **EAS Build Timeout**
   ```bash
   # Check build logs
npx eas build:list
npx eas build:view [BUILD_ID]
   ```

### Build Optimization

1. **Reduce Bundle Size**
   - Use dynamic imports
   - Optimize images
   - Remove unused dependencies

2. **Faster Builds**
   - Use development builds for testing
   - Use local builds for quick iterations

## Build Artifacts

### Android
- **Development**: APK with development client
- **Preview**: APK for testing
- **Production**: AAB for Play Store

### iOS
- **Development**: IPA with development client
- **Production**: IPA for App Store

## Submitting to App Stores

### Google Play Store (Android)

```bash
# Build production AAB
npm run build:android-prod

# Submit to Play Store
npm run submit:android
```

### Apple App Store (iOS)

```bash
# Build production IPA
npm run build:ios-prod

# Submit to App Store
npm run submit:ios
```

## Build Status and Monitoring

### Check Build Status

```bash
# List recent builds
npx eas build:list

# View specific build details
npx eas build:view [BUILD_ID]

# Download build
npx eas build:download [BUILD_ID]
```

### Build Logs

```bash
# View build logs
npx eas build:logs [BUILD_ID]
```

## Environment-Specific Builds

### Development Environment

```bash
# Use development profile
npm run build:android-dev
```

### Staging Environment

```bash
# Use preview profile
npm run build:android-preview
```

### Production Environment

```bash
# Use production profile
npm run build:android-prod
```

## Quick Reference

| Command | Description | Output |
|---------|-------------|---------|
| `npm run build:android-dev` | Android development build | APK with dev client |
| `npm run build:android-preview` | Android preview build | APK for testing |
| `npm run build:android-prod` | Android production build | AAB for Play Store |
| `npm run build:ios-dev` | iOS development build | IPA with dev client |
| `npm run build:ios-prod` | iOS production build | IPA for App Store |
| `npm run build:local-android` | Local Android build | APK |
| `npm run build:local-ios` | Local iOS build | IPA |
| `npm run submit:android` | Submit to Play Store | - |
| `npm run submit:ios` | Submit to App Store | - |

## Notes

- Development builds include the Expo development client
- Preview builds create APK files for easy testing
- Production builds are optimized for app store submission
- Local builds require Android Studio/Xcode installation
- EAS builds run on Expo's servers and take 10-30 minutes
- Always test builds before submitting to app stores
