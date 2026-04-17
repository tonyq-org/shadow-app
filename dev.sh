#!/usr/bin/env bash
# Start Metro + ADB reverse in background for development
# Usage: bash dev.sh

set -e

echo "==> Setting up ADB reverse port..."
adb reverse tcp:8081 tcp:8081

echo "==> Starting Metro bundler in background..."
npx react-native start --port 8081 &
METRO_PID=$!

cleanup() {
  echo ""
  echo "==> Shutting down Metro (PID $METRO_PID)..."
  kill $METRO_PID 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

echo "==> Metro running (PID $METRO_PID)"
echo "==> ADB reverse tcp:8081 active"
echo ""
echo "Commands:"
echo "  npm run adb:install   - Build & install APK"
echo "  npm run adb:launch    - Launch app"
echo "  npm run adb:restart   - Force restart app"
echo "  Ctrl+C                - Stop Metro"
echo ""

wait $METRO_PID
