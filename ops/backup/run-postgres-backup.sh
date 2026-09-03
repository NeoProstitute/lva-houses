#!/bin/sh
set -eu

: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD must be set}"
: "${BACKUP_RETENTION_DAYS:=30}"
: "${BACKUP_INTERVAL_SECONDS:=86400}"

case "$BACKUP_RETENTION_DAYS:$BACKUP_INTERVAL_SECONDS" in
  *[!0-9:]* | :* | *:) echo "Backup retention and interval must be positive integers" >&2; exit 1 ;;
esac

umask 077
export PGPASSWORD="$POSTGRES_PASSWORD"
mkdir -p /backups

while true; do
  timestamp=$(date -u +%Y-%m-%dT%H-%M-%SZ)
  temporary="/backups/leonardo_v_academy_houses_${timestamp}.dump.partial"
  destination="/backups/leonardo_v_academy_houses_${timestamp}.dump"

  pg_dump --host=postgres --username=school_app --dbname=leonardo_v_academy_houses --format=custom --no-owner --no-privileges --file="$temporary"
  mv "$temporary" "$destination"
  find /backups -type f -name 'leonardo_v_academy_houses_*.dump' -mtime "+$BACKUP_RETENTION_DAYS" -delete
  sleep "$BACKUP_INTERVAL_SECONDS"
done
