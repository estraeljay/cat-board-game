# Build & Release Checklist

<!-- Update platform specifics (bundle IDs, signing details) once those are set up in
Unity's Player Settings. -->

## Before every build

1. Bump the version number (Player Settings → version string + build number — these are
   separate fields on both iOS and Android, bump both deliberately)
2. Confirm the target platform in Build Settings matches intent — don't ship a Development
   Build to a store listing
3. Run EditMode + PlayMode tests first; don't build on a red test suite

## iOS

- Bundle identifier is set and matches the App Store Connect record
- Signing: automatic (Xcode-managed) is simplest for a solo/small-team project over manual
  provisioning profiles
- Flow: Unity build → generates an Xcode project → archive & upload from Xcode

## Android

- Package name matches the Play Console listing
- Use an Android App Bundle (`.aab`), not a raw `.apk`, for Play Store submissions
- Back up the keystore file outside the project repo — losing it permanently blocks future
  updates to an already-published listing, there's no recovery path

## Both platforms

- Test on an actual low-end/mid-range device before release, not just the Editor or a
  simulator — animation timing, touch input, and a fully-populated 20×20 board render can
  behave very differently under real device frame timing than they do in the Editor
