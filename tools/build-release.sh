#!/usr/bin/env bash
# Builds the shippable game into ./dist, leaving out everything test-only:
#   test.html, css/test.css, js/debug/, tools/
# Usage:  bash tools/build-release.sh        (run from the project root)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"

rm -rf "$DIST"
mkdir -p "$DIST"

cp "$ROOT/index.html" "$DIST/"
cp -R "$ROOT/css" "$ROOT/js" "$ROOT/cards" "$DIST/"

rm -f "$DIST/css/test.css"
rm -rf "$DIST/js/debug"

# Safety check: the release must not reference any test code
if grep -RIl -e "TestTools" -e "PUN_TEST_MODE = true" -e "test.css" "$DIST/index.html" "$DIST/css" >/dev/null; then
  echo "ERROR: test-only code found in dist/" >&2
  exit 1
fi

echo "Release build ready in: $DIST"
