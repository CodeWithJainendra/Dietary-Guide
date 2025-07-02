#!/bin/sh
set -e

PLATFORM_PATH="node_modules/react-native/Libraries/Utilities/Platform.js"
PLATFORM_DIR="node_modules/react-native/Libraries/Utilities"

echo "[EAS] Ensuring Platform.js exists at $PLATFORM_PATH"

# Wait for node_modules/react-native/Libraries/Utilities to exist
TRIES=0
while [ ! -d "$PLATFORM_DIR" ] && [ $TRIES -lt 10 ]; do
  echo "[EAS] Waiting for $PLATFORM_DIR to exist..."
  sleep 2
  TRIES=$((TRIES+1))
done

if [ ! -d "$PLATFORM_DIR" ]; then
  echo "[EAS] ERROR: $PLATFORM_DIR does not exist after waiting."
  exit 1
fi

cat <<EOF > $PLATFORM_PATH
const Platform = {
  OS: 'android', // or 'ios' as needed
  select: (specifics) => specifics[Platform.OS] || specifics.default,
};
module.exports = Platform;
EOF

echo "[EAS] Platform.js created/overwritten."