#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ "${1:-}" != "" ]; then
  docker compose logs -f "$1"
else
  docker compose logs -f
fi
