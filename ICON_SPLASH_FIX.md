# App Icon and Splash Screen Fix for Play Store

## Issues Fixed

### 1. App Name Configuration
- **Problem**: App was showing as "expo-app" instead of "Dietary Guide"
- **Solution**: Updated `android/app/src/main/res/values/strings.xml`

### 2. App Icon Configuration
- **Problem**: Icon not showing properly on Play Store
- **Solution**: Updated `app.json` with proper icon paths and Android-specific configuration

### 3. Splash Screen Configuration
- **Problem**: Splash screen not displaying correctly in production
- **Solution**: Simplified splash screen configuration and added Android-specific settings

## Changes Made

### 1. Updated app.json
```json
{
  "expo": {
    "name": "Dietary Guide",
    "icon": "./assets/images/icon.png",
    "android": {
      "icon": "./assets/images/icon.png",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "splash": {
        "image": "./assets/images/splash-icon.png",
        "resizeMode": "contain",
        "backgroundColor": "#ffffff"
      }
    },
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    }
  }
}
```

### 2. Updated Android Strings
```xml
<resources>
  <string name="app_name">Dietary Guide</string>
</resources>
```

### 3. Enhanced EAS Build Configuration
```json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle",
        "gradleCommand": ":app:bundleRelease"
      }
    }
  }
}
```

## Required Assets

Ensure these image files exist in `assets/images/`:
- `icon.png` - Main app icon (1024x1024 recommended)
- `adaptive-icon.png` - Android adaptive icon foreground (1024x1024)
- `splash-icon.png` - Splash screen image

## Build Instructions

### 1. Clean Build
```bash
# Clear Expo cache
npx expo install --fix

# Clear EAS build cache
eas build --clear-cache
```

### 2. Production Build
```bash
# Build for Android
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android --profile production
```

## Verification Steps

### 1. Local Testing
- Test with `npx expo run:android` to verify icons show locally
- Check splash screen appears correctly

### 2. Production Testing
- Install the APK/AAB on a physical device
- Verify app icon appears in launcher
- Check splash screen displays properly
- Test app name shows as "Dietary Guide"

## Common Issues and Solutions

### Issue: Icon still not showing
**Solution**: Ensure icon files are:
- PNG format
- Proper dimensions (1024x1024 for main icon)
- Not corrupted
- Properly referenced in app.json

### Issue: Splash screen not working
**Solution**: 
- Use `resizeMode: "contain"` instead of "cover"
- Ensure splash image has transparent background if needed
- Check image dimensions and format

### Issue: App name still shows as "expo-app"
**Solution**:
- Verify strings.xml was updated
- Clean and rebuild the project
- Check Android manifest references correct string resource

## Additional Recommendations

1. **Icon Guidelines**: Follow Google Play Store icon guidelines
2. **Testing**: Always test on multiple devices and Android versions
3. **Asset Optimization**: Optimize image sizes for faster loading
4. **Backup**: Keep original high-resolution assets for future updates

## Next Steps

After implementing these changes:
1. Build a new production version
2. Test thoroughly on physical devices
3. Upload to Play Store internal testing first
4. Verify all assets display correctly before public release
