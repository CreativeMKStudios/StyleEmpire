#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export SITE="${SITE:-http://localhost:4321}"
export SMTP_HOST="${SMTP_HOST:-127.0.0.1}"
export SMTP_PORT="${SMTP_PORT:-1025}"
export SMTP_FROM="${SMTP_FROM:-Style Empire <bookings@localhost>}"
export MANAGER_EMAIL="${MANAGER_EMAIL:-style.empire@outlook.com}"
export PAYMENT_MODE="${PAYMENT_MODE:-demo}"
case "${NODE_OPTIONS:-}" in
  *--experimental-sqlite*) ;;
  *) export NODE_OPTIONS="${NODE_OPTIONS:-} --experimental-sqlite" ;;
esac

if [[ ! -f package.json ]]; then
  echo "No app in this checkout yet. Mail is ready if mailpit started."
  exit 0
fi

if ! command -v mailpit >/dev/null 2>&1; then
  echo "mailpit is missing. The install script should have put it on PATH." >&2
  exit 1
fi

port_open() {
  python3 - "$1" << 'PY'
import socket, sys
sock = socket.socket()
sock.settimeout(0.3)
try:
    sock.connect(("127.0.0.1", int(sys.argv[1])))
except OSError:
    sys.exit(1)
else:
    sys.exit(0)
finally:
    sock.close()
PY
}

if ! port_open 1025; then
  mailpit --smtp 127.0.0.1:1025 --listen 127.0.0.1:8025 >/tmp/mailpit.log 2>&1 &
  for _ in $(seq 1 50); do
    if port_open 1025; then
      break
    fi
    sleep 0.1
  done
fi

if ! port_open 1025; then
  echo "mailpit did not open port 1025" >&2
  exit 1
fi

if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:4321/; then
  echo "Style Empire dev server is already running on port 4321."
  exit 0
fi

exec npm run dev
