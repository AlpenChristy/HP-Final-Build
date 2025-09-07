#!/bin/bash

# Build script with environment variable support
# Usage: ./scripts/build-with-env.sh [development|production]

set -e  # Exit on any error

# Default to development if no argument provided
ENVIRONMENT=${1:-development}

echo "🚀 Building for $ENVIRONMENT environment..."

# Check if environment file exists
ENV_FILE=".env.$ENVIRONMENT"
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Environment file $ENV_FILE not found!"
    echo "Available environment files:"
    ls -la .env* 2>/dev/null || echo "No .env files found"
    exit 1
fi

# Copy environment file to .env.local for Expo to use
echo "📋 Copying $ENV_FILE to .env.local..."
cp "$ENV_FILE" .env.local

# Load environment variables
echo "🔧 Loading environment variables..."
export $(grep -v '^#' .env.local | xargs)

# Validate required variables
echo "✅ Validating environment variables..."

# Check Firebase variables
if [ -z "$EXPO_PUBLIC_FIREBASE_API_KEY" ]; then
    echo "❌ EXPO_PUBLIC_FIREBASE_API_KEY is not set"
    exit 1
fi

if [ -z "$EXPO_PUBLIC_FIREBASE_PROJECT_ID" ]; then
    echo "❌ EXPO_PUBLIC_FIREBASE_PROJECT_ID is not set"
    exit 1
fi

# Check Cloudinary variables
if [ -z "$EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME" ]; then
    echo "❌ EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME is not set"
    exit 1
fi

echo "✅ Environment variables validated successfully!"

# Build based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🏗️  Building production APK..."
    
    # Check for production Android signing
    if [ -n "$ANDROID_RELEASE_KEYSTORE_FILE" ]; then
        echo "🔐 Using production keystore: $ANDROID_RELEASE_KEYSTORE_FILE"
        
        # Check if keystore file exists
        if [ ! -f "android/app/$ANDROID_RELEASE_KEYSTORE_FILE" ]; then
            echo "❌ Keystore file android/app/$ANDROID_RELEASE_KEYSTORE_FILE not found!"
            exit 1
        fi
    else
        echo "⚠️  No production keystore configured, using debug keystore"
    fi
    
    # Build production APK
    cd android
    ./gradlew assembleRelease
    cd ..
    
    echo "✅ Production APK built successfully!"
    echo "📱 APK location: android/app/build/outputs/apk/release/app-release.apk"
    
else
    echo "🏗️  Building development APK..."
    
    # Build development APK
    cd android
    ./gradlew assembleDebug
    cd ..
    
    echo "✅ Development APK built successfully!"
    echo "📱 APK location: android/app/build/outputs/apk/debug/app-debug.apk"
fi

# Clean up
echo "🧹 Cleaning up..."
rm -f .env.local

echo "🎉 Build completed successfully!"
