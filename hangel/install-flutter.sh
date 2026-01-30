#!/bin/bash

# Define Flutter version (or use stable)
FLUTTER_VERSION="stable"
FLUTTER_URL="https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.24.3-stable.tar.xz"

# Download and extract Flutter
echo "Downloading Flutter..."
curl -O $FLUTTER_URL
tar xf flutter_linux_3.24.3-stable.tar.xz
export PATH="$PATH:`pwd`/flutter/bin"

# Pre-download artifacts
flutter doctor -v
flutter config --enable-web

# Build web - using the command from build-web.sh but tailored for CI
echo "Building Flutter Web..."
flutter build web --release --web-renderer html --pwa-strategy=none --dart-define=BASE_URL="https://hangel.org/hangel_app"

# Prepare output
# The build results are in build/web. Vercel will serve from the root of the project if we are not careful.
# Usually, we set the output directory in Vercel to 'hangel/build/web'.
