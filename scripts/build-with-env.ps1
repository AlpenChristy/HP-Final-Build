# Build script with environment variable support for Windows PowerShell
# Usage: .\scripts\build-with-env.ps1 [development|production]

param(
    [string]$Environment = "development"
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Building for $Environment environment..." -ForegroundColor Green

# Check if environment file exists
$EnvFile = ".env.$Environment"
if (-not (Test-Path $EnvFile)) {
    Write-Host "❌ Environment file $EnvFile not found!" -ForegroundColor Red
    Write-Host "Available environment files:" -ForegroundColor Yellow
    Get-ChildItem -Name ".env*" -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "  $_" }
    exit 1
}

# Copy environment file to .env.local for Expo to use
Write-Host "📋 Copying $EnvFile to .env.local..." -ForegroundColor Blue
Copy-Item $EnvFile ".env.local"

# Load environment variables from .env.local
Write-Host "🔧 Loading environment variables..." -ForegroundColor Blue
$envVars = Get-Content ".env.local" | Where-Object { $_ -match "^[^#]" -and $_ -match "=" }
foreach ($envVar in $envVars) {
    $key, $value = $envVar -split "=", 2
    if ($key -and $value) {
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

# Validate required variables
Write-Host "✅ Validating environment variables..." -ForegroundColor Blue

# Check Firebase variables
if (-not $env:EXPO_PUBLIC_FIREBASE_API_KEY) {
    Write-Host "❌ EXPO_PUBLIC_FIREBASE_API_KEY is not set" -ForegroundColor Red
    exit 1
}

if (-not $env:EXPO_PUBLIC_FIREBASE_PROJECT_ID) {
    Write-Host "❌ EXPO_PUBLIC_FIREBASE_PROJECT_ID is not set" -ForegroundColor Red
    exit 1
}

# Check Cloudinary variables
if (-not $env:EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    Write-Host "❌ EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME is not set" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Environment variables validated successfully!" -ForegroundColor Green

# Build based on environment
if ($Environment -eq "production") {
    Write-Host "🏗️  Building production APK..." -ForegroundColor Yellow
    
    # Check for production Android signing
    if ($env:ANDROID_RELEASE_KEYSTORE_FILE) {
        Write-Host "🔐 Using production keystore: $($env:ANDROID_RELEASE_KEYSTORE_FILE)" -ForegroundColor Blue
        
        # Check if keystore file exists
        $keystorePath = "android\app\$($env:ANDROID_RELEASE_KEYSTORE_FILE)"
        if (-not (Test-Path $keystorePath)) {
            Write-Host "❌ Keystore file $keystorePath not found!" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "⚠️  No production keystore configured, using debug keystore" -ForegroundColor Yellow
    }
    
    # Build production APK
    Set-Location android
    & .\gradlew.bat assembleRelease
    Set-Location ..
    
    Write-Host "✅ Production APK built successfully!" -ForegroundColor Green
    Write-Host "📱 APK location: android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor Cyan
    
} else {
    Write-Host "🏗️  Building development APK..." -ForegroundColor Yellow
    
    # Build development APK
    Set-Location android
    & .\gradlew.bat assembleDebug
    Set-Location ..
    
    Write-Host "✅ Development APK built successfully!" -ForegroundColor Green
    Write-Host "📱 APK location: android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Cyan
}

# Clean up
Write-Host "🧹 Cleaning up..." -ForegroundColor Blue
Remove-Item ".env.local" -ErrorAction SilentlyContinue

Write-Host "🎉 Build completed successfully!" -ForegroundColor Green
