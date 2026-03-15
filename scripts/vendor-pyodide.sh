#!/usr/bin/env bash
# scripts/vendor-pyodide.sh
#
# Downloads the Pyodide core runtime files from jsDelivr CDN into public/pyodide/.
# Serving Pyodide from our own origin eliminates the cross-origin resource
# that triggers COEP violations on the Python editor page.
#
# Only the minimal runtime files are downloaded (no package wheels):
#   pyodide.mjs          — ESM entry point
#   pyodide.asm.js       — Emscripten JS runtime
#   pyodide.asm.wasm     — WebAssembly binary (~8 MB)
#   python_stdlib.zip    — Python standard library (~4 MB)
#   pyodide-lock.json    — Package registry (required by loadPyodide)
#
# Idempotent: skips files that already exist.
# To force a re-download, delete public/pyodide/ first.
set -euo pipefail

PYODIDE_VERSION="0.27.0"
CDN_BASE="https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full"
DEST="public/pyodide"

CORE_FILES=(
  "pyodide.mjs"
  "pyodide.asm.js"
  "pyodide.asm.wasm"
  "python_stdlib.zip"
  "pyodide-lock.json"
)

mkdir -p "$DEST"

echo "Vendoring Pyodide ${PYODIDE_VERSION} → ${DEST}/"
for file in "${CORE_FILES[@]}"; do
  dest_file="$DEST/$file"
  if [ -f "$dest_file" ]; then
    echo "  [skip]     $file"
    continue
  fi
  echo "  [download] $file"
  curl -fSL --progress-bar "${CDN_BASE}/${file}" -o "$dest_file"
done
echo "Done."
