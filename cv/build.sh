#!/usr/bin/env bash
# Prints cv/cv.html to public/files/Hsin-En_Huang_CV.pdf with headless Chrome.
# Usage: bash cv/build.sh [input.html] [output.pdf]
set -euo pipefail
cd "$(dirname "$0")/.."

in="${1:-cv/cv.html}"
out="${2:-public/files/Hsin-En_Huang_CV.pdf}"

chrome="${CHROME:-}"
for c in "/c/Program Files/Google/Chrome/Application/chrome.exe" \
         "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
         google-chrome chromium; do
  [ -n "$chrome" ] && break
  if [ -x "$c" ] || command -v "$c" >/dev/null 2>&1; then chrome="$c"; fi
done
[ -n "$chrome" ] || { echo "No Chrome or Edge found; set CHROME=/path/to/chrome" >&2; exit 1; }

mkdir -p "$(dirname "$out")"
abs_in="$(cd "$(dirname "$in")" && pwd -W 2>/dev/null || pwd)/$(basename "$in")"
abs_out="$(cd "$(dirname "$out")" && pwd -W 2>/dev/null || pwd)/$(basename "$out")"

"$chrome" --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$abs_out" "file:///${abs_in#/}" 2>/dev/null
echo "Wrote $out"
