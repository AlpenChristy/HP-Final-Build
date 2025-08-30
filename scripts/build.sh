#!/bin/bash

# HP Gas App Build Script
# This script provides an interactive menu for building the app

echo "🚀 HP Gas App Build Script"
echo "=========================="
echo ""

# Function to check if EAS CLI is installed
check_eas_cli() {
    if ! npx eas --version &> /dev/null; then
        echo "❌ EAS CLI is not available. Installing now..."
        npm install -g eas-cli
    else
        echo "✅ EAS CLI is available"
    fi
}

# Function to check if user is logged in
check_login() {
    if ! npx eas whoami &> /dev/null; then
        echo "❌ Not logged in to Expo. Please login:"
        npx eas login
    else
        echo "✅ Logged in to Expo"
    fi
}

# Function to build Android
build_android() {
    echo "📱 Building for Android..."
    case $1 in
        "dev")
            echo "🔧 Building development version..."
            npx eas build --platform android --profile development
            ;;
        "preview")
            echo "📦 Building preview version (APK)..."
            npx eas build --platform android --profile preview
            ;;
        "prod")
            echo "🏭 Building production version (AAB)..."
            npx eas build --platform android --profile production
            ;;
        "local")
            echo "🏠 Building locally..."
            expo run:android
            ;;
    esac
}

# Function to build iOS
build_ios() {
    echo "🍎 Building for iOS..."
    case $1 in
        "dev")
            echo "🔧 Building development version..."
            npx eas build --platform ios --profile development
            ;;
        "prod")
            echo "🏭 Building production version..."
            npx eas build --platform ios --profile production
            ;;
        "local")
            echo "🏠 Building locally..."
            expo run:ios
            ;;
    esac
}

# Function to submit to store
submit_to_store() {
    case $1 in
        "android")
            echo "📤 Submitting to Google Play Store..."
            npx eas submit --platform android
            ;;
        "ios")
            echo "📤 Submitting to Apple App Store..."
            npx eas submit --platform ios
            ;;
    esac
}

# Function to show build status
show_build_status() {
    echo "📊 Recent builds:"
    npx eas build:list --limit 5
}

# Main menu
show_menu() {
    echo ""
    echo "Choose an option:"
    echo "1) Build Android Development"
    echo "2) Build Android Preview (APK)"
    echo "3) Build Android Production (AAB)"
    echo "4) Build Android Locally"
    echo "5) Build iOS Development"
    echo "6) Build iOS Production"
    echo "7) Build iOS Locally"
    echo "8) Submit to Google Play Store"
    echo "9) Submit to Apple App Store"
    echo "10) Show Build Status"
    echo "11) Clear Cache"
    echo "12) Exit"
    echo ""
    read -p "Enter your choice (1-12): " choice
}

# Check prerequisites
echo "🔍 Checking prerequisites..."
check_eas_cli
check_login

# Main loop
while true; do
    show_menu
    
    case $choice in
        1)
            build_android "dev"
            ;;
        2)
            build_android "preview"
            ;;
        3)
            build_android "prod"
            ;;
        4)
            build_android "local"
            ;;
        5)
            build_ios "dev"
            ;;
        6)
            build_ios "prod"
            ;;
        7)
            build_ios "local"
            ;;
        8)
            submit_to_store "android"
            ;;
        9)
            submit_to_store "ios"
            ;;
        10)
            show_build_status
            ;;
        11)
            echo "🧹 Clearing cache..."
            npx expo start --clear
            ;;
        12)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid option. Please try again."
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
done
