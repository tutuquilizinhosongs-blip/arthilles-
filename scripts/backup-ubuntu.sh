#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p backups

set -a
source .env
set +a

timestamp="$(date +%Y%m%d-%H%M%S)"
file="backups/arthillesbot-${timestamp}.sql"

docker exec arthilles_postgres pg_dump -U "${POSTGRES_USER:-arthilles}" -d "${POSTGRES_DB:-arthillesbot}" > "$file"
echo "Backup criado em $file"
