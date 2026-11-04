#!/usr/bin/env bash
set -euo pipefail

if ! command -v mailpit >/dev/null 2>&1; then
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  curl -fsSL -o "$tmp/mailpit.tar.gz" \
    "https://github.com/axllent/mailpit/releases/download/v1.33.0/mailpit-linux-amd64.tar.gz"
  tar -xzf "$tmp/mailpit.tar.gz" -C "$tmp"
  sudo install -m 755 "$tmp/mailpit" /usr/local/bin/mailpit
fi

if [[ -f package-lock.json ]]; then
  npm ci
else
  echo "No package-lock.json in this checkout; skipping npm ci."
fi
