#!/bin/sh
set -e
PLATFORM_PATH="node_modules/react-native/Libraries/Utilities/Platform.js"
echo "[EAS] Ensuring Platform.js exists at $PLATFORM_PATH"
if [ ! -f "$PLATFORM_PATH" ]; then
  cat <<EOF > $PLATFORM_PATH
const Platform = {
  OS: 'android', // or 'ios' as needed
  select: (specifics) => specifics[Platform.OS] || specifics.default,
};
module.exports = Platform;
EOF
  echo "[EAS] Platform.js created."
else
  echo "[EAS] Platform.js already exists."
fi
