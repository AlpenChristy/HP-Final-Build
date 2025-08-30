# HP Gas App

A React Native mobile application for HP Gas delivery services, built with Expo and TypeScript.

## Features

- **Customer Features**: Browse products, add to cart, place orders, track deliveries
- **Admin Features**: Manage products, orders, delivery agents, and users
- **Delivery Agent Features**: View assigned orders, update delivery status
- **Authentication**: Phone number-based authentication with OTP
- **Real-time Updates**: Firebase integration for real-time data
- **Modern UI**: Built with NativeWind (Tailwind CSS for React Native)

## Tech Stack

- **Framework**: React Native with Expo SDK 53
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind CSS)
- **Navigation**: Expo Router
- **Backend**: Firebase (Firestore, Authentication, Functions)
- **Icons**: Lucide React Native
- **State Management**: React Context API

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hpapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Expo CLI globally**
   ```bash
   npm install -g @expo/cli
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

## Development

### Running the App

- **Android**: Press `a` in the terminal or scan QR code with Expo Go
- **iOS**: Press `i` in the terminal or scan QR code with Camera app
- **Web**: Press `w` in the terminal

### Project Structure

```
hpapp/
├── app/                    # Expo Router pages
│   ├── admin/             # Admin panel screens
│   ├── customer/          # Customer screens
│   ├── delivery/          # Delivery agent screens
│   └── auth/              # Authentication screens
├── components/            # Reusable UI components
├── core/                  # Core functionality
│   ├── auth/             # Authentication logic
│   ├── context/          # React Context providers
│   ├── firebase/         # Firebase configuration
│   ├── services/         # API services
│   └── utils/            # Utility functions
├── assets/               # Images, fonts, etc.
└── constants/            # App constants
```

## Building for Production

### Using EAS Build

1. **Install EAS CLI**
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Configure EAS**
   ```bash
   eas build:configure
   ```

4. **Build for Android**
   ```bash
   # Development build
   eas build --platform android --profile development
   
   # Preview build (APK)
   eas build --platform android --profile preview
   
   # Production build (AAB)
   eas build --platform android --profile production
   ```

5. **Build for iOS**
   ```bash
   # Development build
   eas build --platform ios --profile development
   
   # Production build
   eas build --platform ios --profile production
   ```

### Local Build (Android)

1. **Install Android Studio and configure Android SDK**
2. **Set up environment variables**
3. **Run build command**
   ```bash
   npx expo run:android
   ```

## Configuration Files

- `app.json` - Expo configuration
- `eas.json` - EAS Build configuration
- `metro.config.js` - Metro bundler configuration
- `babel.config.js` - Babel configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration

## Environment Setup

### Firebase Configuration

1. Create a Firebase project
2. Enable Authentication, Firestore, and Functions
3. Add your Firebase configuration to `core/firebase/firebase.ts`

### Required Permissions

The app requires the following permissions:
- Camera (for QR scanning and photo uploads)
- Location (for delivery tracking)
- Storage (for image uploads)
- Internet (for API calls)

## Troubleshooting

### Common Issues

1. **RNSVG Error**: Make sure `react-native-svg` is installed
2. **Metro Cache Issues**: Clear cache with `npx expo start --clear`
3. **Build Failures**: Check EAS build logs for specific errors

### Development Tips

- Use `npx expo start --clear` to clear cache when experiencing issues
- Check the Expo documentation for the latest SDK updates
- Use TypeScript for better code quality and IDE support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software for HP Gas.

## Support

For support and questions, please contact the development team.
