# Build Nuosic Music Player APK with GitHub Actions

1. Upload the **contents** of this `music-player` folder to the root of a GitHub repository (so `package.json` is at the repository root).
2. Ensure `.github/workflows/build-android-apk.yml` is included.
3. Commit to the `main` branch, or open **Actions → Build Nuosic Android APK → Run workflow**.
4. After a successful run, open the run and download the `nuosic-music-player-debug-apk` artifact.
5. Extract the artifact ZIP and install `app-debug.apk` on your Android device.

The workflow builds a debug APK for testing. FamGateway payments are not integrated by this build workflow and require a separate secure backend.
