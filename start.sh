#!/bin/bash
# Start Expo in the background — close this terminal after launch, Metro keeps running.
# Logs: /tmp/expo-finder.log
# Stop: kill $(cat /tmp/expo-finder.pid)

cd "$(dirname "$0")"
nohup npx expo start --android > /tmp/expo-finder.log 2>&1 &
echo $! > /tmp/expo-finder.pid
echo "✓ Expo started (PID $(cat /tmp/expo-finder.pid))"
echo "  Logs:  tail -f /tmp/expo-finder.log"
echo "  Stop:  kill \$(cat /tmp/expo-finder.pid)"
echo ""
echo "Tip for a fully standalone build (no server needed):"
echo "  npx eas build --profile preview --platform android"
