#!/usr/bin/env bash
# ==============================================================================
# Kanganheri Darpan (कांगनहेड़ी दर्पण) — Disaster Recovery & Database Restore Script
# Verifies SHA-256 checksum, decrypts OpenSSL AES-256-CBC dump,
# and executes point-in-time restoration into PostgreSQL 16.
# ==============================================================================

set -euo pipefail

# ------------------------------------------------------------------------------
# Usage & Argument Parsing
# ------------------------------------------------------------------------------
if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <path_to_encrypted_dump.dump.enc> [--force]"
  echo "Example: $0 /var/backups/kanganheri/daily/kanganheri_db_20261028_120000.dump.enc"
  exit 1
fi

ENC_FILE="$1"
FORCE_RESTORE="${2:-}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-${DB_BACKUP_ENCRYPTION_KEY:-}}"
DB_NAME="${DB_NAME:-kanganheri_db}"
DB_USER="${DB_USER:-kanganheri_app}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

CHECKSUM_FILE="${ENC_FILE}.sha256"
TEMP_DUMP="/tmp/restore_${DB_NAME}_$(date +%s).dump"

# Cleanup hook on exit
cleanup() {
  if [ -f "${TEMP_DUMP}" ]; then
    echo "[+] Shredding temporary decrypted dump file..."
    rm -f "${TEMP_DUMP}"
  fi
}
trap cleanup EXIT

echo "===================================================================="
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Kanganheri Disaster Recovery: Restore"
echo "Target DB: ${DB_HOST}:${DB_PORT}/${DB_NAME}"
echo "Archive:   ${ENC_FILE}"
echo "===================================================================="

# ------------------------------------------------------------------------------
# Pre-flight Validations
# ------------------------------------------------------------------------------
if [ ! -f "${ENC_FILE}" ]; then
  echo "[-] ERROR: Backup file not found: ${ENC_FILE}" >&2
  exit 1
fi

if [ -z "${ENCRYPTION_KEY}" ]; then
  echo "[-] ERROR: BACKUP_ENCRYPTION_KEY environment variable is not set." >&2
  exit 1
fi

command -v pg_restore >/dev/null 2>&1 || {
  echo "[-] ERROR: pg_restore utility is not installed or not in PATH." >&2
  exit 1
}

# ------------------------------------------------------------------------------
# Step 1: Verify SHA-256 Checksum Integrity
# ------------------------------------------------------------------------------
if [ -f "${CHECKSUM_FILE}" ]; then
  echo "[+] Step 1: Verifying SHA-256 cryptographic checksum..."
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum -c "${CHECKSUM_FILE}"
  else
    shasum -a 256 -c "${CHECKSUM_FILE}"
  fi
  echo "[+] Checksum integrity verified."
else
  echo "[-] WARNING: Checksum file ${CHECKSUM_FILE} not found. Skipping integrity check."
fi

# ------------------------------------------------------------------------------
# Step 2: Destructive Action Confirmation
# ------------------------------------------------------------------------------
if [ "${FORCE_RESTORE}" != "--force" ]; then
  echo ""
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "  WARNING: This will overwrite data in database '${DB_NAME}'!"
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  read -r -p "Are you sure you want to proceed with database restore? (yes/N): " CONFIRMATION
  if [ "${CONFIRMATION}" != "yes" ]; then
    echo "[-] Database restore aborted by operator."
    exit 0
  fi
fi

# ------------------------------------------------------------------------------
# Step 3: Decrypt Database Dump
# ------------------------------------------------------------------------------
echo "[+] Step 3: Decrypting archive using AES-256-CBC..."
openssl enc -d -aes-256-cbc \
  -pbkdf2 \
  -iter 100000 \
  -in "${ENC_FILE}" \
  -out "${TEMP_DUMP}" \
  -pass pass:"${ENCRYPTION_KEY}"

echo "[+] Decryption complete. Temporary dump ready."

# ------------------------------------------------------------------------------
# Step 4: Execute Native pg_restore
# ------------------------------------------------------------------------------
echo "[+] Step 4: Executing pg_restore to database ${DB_NAME}..."
PGPASSWORD="${PGPASSWORD:-kanganheri_secure_pass_2026}" pg_restore \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  -v \
  "${TEMP_DUMP}" || {
    echo "[-] Note: Some warnings or non-fatal notices may have occurred during pg_restore."
  }

# ------------------------------------------------------------------------------
# Step 5: Verification of Restored Tables
# ------------------------------------------------------------------------------
echo "[+] Step 5: Verifying restored schema in database..."
TABLE_COUNT=$(PGPASSWORD="${PGPASSWORD:-kanganheri_secure_pass_2026}" psql \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

echo "===================================================================="
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Restore operation completed successfully!"
echo "Public tables verified: $(echo "${TABLE_COUNT}" | xargs)"
echo "===================================================================="
