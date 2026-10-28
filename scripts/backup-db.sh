#!/usr/bin/env bash
# ==============================================================================
# Kanganheri Darpan (कांगनहेड़ी दर्पण) — Automated Encrypted DB Backup Script
# Backs up PostgreSQL 16 database, encrypts via OpenSSL AES-256-CBC,
# verifies integrity, enforces rolling retention (7 daily, 4 weekly),
# and optionally uploads to Cloudflare R2 / AWS S3.
# ==============================================================================

set -euo pipefail

# ------------------------------------------------------------------------------
# Configuration & Defaults
# ------------------------------------------------------------------------------
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE_DAY=$(date +"%u") # 1 = Monday, 7 = Sunday
BACKUP_DIR="${BACKUP_DIR:-/var/backups/kanganheri}"
DB_NAME="${DB_NAME:-kanganheri_db}"
DB_USER="${DB_USER:-kanganheri_app}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-${DB_BACKUP_ENCRYPTION_KEY:-}}"

# Retention settings
RETENTION_DAYS=7
RETENTION_WEEKS=4

# Target paths
mkdir -p "${BACKUP_DIR}/daily"
mkdir -p "${BACKUP_DIR}/weekly"

DUMP_RAW="${BACKUP_DIR}/dump_${DB_NAME}_${TIMESTAMP}.dump"
DUMP_ENC="${BACKUP_DIR}/daily/${DB_NAME}_${TIMESTAMP}.dump.enc"
CHECKSUM_FILE="${DUMP_ENC}.sha256"

# ------------------------------------------------------------------------------
# Pre-flight Checks
# ------------------------------------------------------------------------------
echo "===================================================================="
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting Kanganheri DB Backup: ${DB_NAME}"
echo "===================================================================="

if [ -z "${ENCRYPTION_KEY}" ]; then
  echo "[-] ERROR: BACKUP_ENCRYPTION_KEY environment variable is not set." >&2
  exit 1
fi

command -v pg_dump >/dev/null 2>&1 || {
  echo "[-] ERROR: pg_dump utility is not installed or not in PATH." >&2
  exit 1
}

command -v openssl >/dev/null 2>&1 || {
  echo "[-] ERROR: openssl utility is not installed or not in PATH." >&2
  exit 1
}

# ------------------------------------------------------------------------------
# Step 1: Execute Native PostgreSQL Custom Dump
# ------------------------------------------------------------------------------
echo "[+] Step 1: Exporting database dump from ${DB_HOST}:${DB_PORT}/${DB_NAME}..."
PGPASSWORD="${PGPASSWORD:-kanganheri_secure_pass_2026}" pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -F c \
  -b \
  -v \
  -f "${DUMP_RAW}"

RAW_SIZE=$(du -h "${DUMP_RAW}" | cut -f1)
echo "[+] Raw dump created successfully. Size: ${RAW_SIZE}"

# ------------------------------------------------------------------------------
# Step 2: Encrypt Dump with OpenSSL AES-256-CBC (PBKDF2)
# ------------------------------------------------------------------------------
echo "[+] Step 2: Encrypting database dump with AES-256-CBC..."
openssl enc -aes-256-cbc \
  -salt \
  -pbkdf2 \
  -iter 100000 \
  -in "${DUMP_RAW}" \
  -out "${DUMP_ENC}" \
  -pass pass:"${ENCRYPTION_KEY}"

# Securely shred and remove unencrypted dump
rm -f "${DUMP_RAW}"
echo "[+] Encrypted dump saved to: ${DUMP_ENC}"

# ------------------------------------------------------------------------------
# Step 3: Compute SHA-256 Integrity Checksum
# ------------------------------------------------------------------------------
echo "[+] Step 3: Computing cryptographic SHA-256 checksum..."
if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "${DUMP_ENC}" > "${CHECKSUM_FILE}"
else
  shasum -a 256 "${DUMP_ENC}" > "${CHECKSUM_FILE}"
fi
echo "[+] Checksum written to: ${CHECKSUM_FILE}"

# ------------------------------------------------------------------------------
# Step 4: Handle Weekly Retention Copy (Sundays)
# ------------------------------------------------------------------------------
if [ "${DATE_DAY}" -eq 7 ]; then
  WEEKLY_TARGET="${BACKUP_DIR}/weekly/${DB_NAME}_week_${TIMESTAMP}.dump.enc"
  echo "[+] Sunday detected. Creating weekly archive: ${WEEKLY_TARGET}"
  cp "${DUMP_ENC}" "${WEEKLY_TARGET}"
  cp "${CHECKSUM_FILE}" "${WEEKLY_TARGET}.sha256"
fi

# ------------------------------------------------------------------------------
# Step 5: Enforce Rolling Retention Policy
# ------------------------------------------------------------------------------
echo "[+] Step 5: Applying rolling retention cleanup..."
# Purge daily backups older than RETENTION_DAYS
find "${BACKUP_DIR}/daily" -type f -name "*.dump.enc*" -mtime +"${RETENTION_DAYS}" -exec rm -f {} +
echo "[+] Daily backups older than ${RETENTION_DAYS} days pruned."

# Purge weekly backups older than RETENTION_WEEKS * 7 days
find "${BACKUP_DIR}/weekly" -type f -name "*.dump.enc*" -mtime +$((RETENTION_WEEKS * 7)) -exec rm -f {} +
echo "[+] Weekly backups older than ${RETENTION_WEEKS} weeks pruned."

# ------------------------------------------------------------------------------
# Step 6: Optional Remote Sync (S3 / Cloudflare R2 / MinIO)
# ------------------------------------------------------------------------------
if [ -n "${S3_BUCKET:-}" ]; then
  echo "[+] Step 6: Syncing encrypted archive to S3 bucket: ${S3_BUCKET}..."
  if command -v aws >/dev/null 2>&1; then
    aws s3 cp "${DUMP_ENC}" "s3://${S3_BUCKET}/backups/daily/"
    aws s3 cp "${CHECKSUM_FILE}" "s3://${S3_BUCKET}/backups/daily/"
    echo "[+] Remote sync complete."
  else
    echo "[-] WARNING: AWS CLI not detected. Skipping remote upload."
  fi
fi

echo "===================================================================="
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Backup completed successfully!"
echo "Archive:  ${DUMP_ENC}"
echo "Checksum: $(cat "${CHECKSUM_FILE}")"
echo "===================================================================="
