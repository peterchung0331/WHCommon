#!/bin/bash
#==============================================================================
# PostgreSQL Daily Backup Script
# Location: /home/ubuntu/workhub/backups/scripts/backup-daily.sh
#
# Usage:
#   ./backup-daily.sh              # Daily backup
#   ./backup-daily.sh --weekly     # Weekly backup
#   ./backup-daily.sh --monthly    # Monthly backup
#   ./backup-daily.sh <db_name>    # Single DB backup
#==============================================================================

set -euo pipefail

#------------------------------------------------------------------------------
# Configuration
#------------------------------------------------------------------------------
BACKUP_ROOT="/home/ubuntu/workhub/backups"
LOG_DIR="${BACKUP_ROOT}/logs"
SCRIPT_DIR="${BACKUP_ROOT}/scripts"

# Timezone (server is UTC, display in KST)
export TZ="Asia/Seoul"

# Date/time variables
DATE=$(date +%Y-%m-%d)
DATETIME=$(date +%Y%m%d_%H%M)
YEAR_MONTH=$(date +%Y-%m)

# PostgreSQL settings
PGUSER="postgres"
PGHOST="localhost"
PGPORT="5432"

# Target databases (12 total: 8 production + 4 development)
DATABASES=(
    # Production databases
    "wbhubmanager"
    "wbsaleshub"
    "finhub"
    "obhub"
    "testagent"
    "hubmanager"
    "hwtestagent"
    "saleshub"
    # Development databases
    "dev-hubmanager"
    "dev-saleshub"
    "dev-finhub"
    "dev-onboardinghub"
)

# Retention policy
DAILY_RETENTION_DAYS=7
WEEKLY_RETENTION_WEEKS=4
MONTHLY_RETENTION_MONTHS=12

#------------------------------------------------------------------------------
# Functions: Logging
#------------------------------------------------------------------------------
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S %Z")
    echo "[${timestamp}] [${level}] ${message}" | tee -a "${LOG_DIR}/backup_${DATE}.log"
}

log_info()  { log "INFO" "$@"; }
log_warn()  { log "WARN" "$@"; }
log_error() { log "ERROR" "$@"; }

#------------------------------------------------------------------------------
# Functions: Directory initialization
#------------------------------------------------------------------------------
init_directories() {
    mkdir -p "${BACKUP_ROOT}/daily/${DATE}"
    mkdir -p "${BACKUP_ROOT}/weekly"
    mkdir -p "${BACKUP_ROOT}/monthly"
    mkdir -p "${LOG_DIR}"
}

#------------------------------------------------------------------------------
# Functions: Check if database exists
#------------------------------------------------------------------------------
db_exists() {
    local db_name=$1
    sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "${db_name}" && return 0 || return 1
}

#------------------------------------------------------------------------------
# Functions: Single database backup
#------------------------------------------------------------------------------
backup_database() {
    local db_name=$1
    local backup_type=${2:-daily}
    local backup_dir=""

    case $backup_type in
        daily)   backup_dir="${BACKUP_ROOT}/daily/${DATE}" ;;
        weekly)  backup_dir="${BACKUP_ROOT}/weekly/${DATE}" ;;
        monthly) backup_dir="${BACKUP_ROOT}/monthly/${YEAR_MONTH}" ;;
    esac

    mkdir -p "${backup_dir}"

    # Check if database exists
    if ! db_exists "${db_name}"; then
        log_warn "Database does not exist, skipping: ${db_name}"
        return 0
    fi

    local backup_file="${backup_dir}/${db_name}_${DATETIME}.sql.gz"
    local start_time=$(date +%s)

    log_info "Backup started: ${db_name} -> ${backup_file}"

    # Run pg_dump with gzip compression
    # Note: Using local socket (peer auth) by omitting -h flag
    if sudo -u postgres pg_dump \
        -d "${db_name}" \
        --no-owner \
        --no-acl \
        --verbose \
        2>> "${LOG_DIR}/backup_${DATE}.log" | gzip > "${backup_file}"; then

        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        local file_size=$(ls -lh "${backup_file}" | awk '{print $5}')

        log_info "Backup completed: ${db_name} (size: ${file_size}, duration: ${duration}s)"

        # Verify backup
        if verify_backup "${backup_file}"; then
            log_info "Backup verification passed: ${db_name}"
            return 0
        else
            log_error "Backup verification failed: ${db_name}"
            return 1
        fi
    else
        log_error "Backup failed: ${db_name}"
        return 1
    fi
}

#------------------------------------------------------------------------------
# Functions: Backup verification
#------------------------------------------------------------------------------
verify_backup() {
    local backup_file=$1

    # Check file exists
    if [ ! -f "${backup_file}" ]; then
        log_error "Backup file does not exist: ${backup_file}"
        return 1
    fi

    # Check file size (minimum 200 bytes for empty DB with schema)
    local file_size=$(stat -c%s "${backup_file}")
    if [ "${file_size}" -lt 200 ]; then
        log_error "Backup file size abnormal: ${file_size} bytes"
        return 1
    fi

    # Check gzip integrity
    if ! gzip -t "${backup_file}" 2>/dev/null; then
        log_error "gzip integrity check failed: ${backup_file}"
        return 1
    fi

    # Check SQL structure (header check - look in first 50 lines)
    if ! zcat "${backup_file}" | head -50 | grep -q "PostgreSQL"; then
        log_error "SQL structure check failed: ${backup_file}"
        return 1
    fi

    return 0
}

#------------------------------------------------------------------------------
# Functions: Create manifest
#------------------------------------------------------------------------------
create_manifest() {
    local backup_type=$1
    local backup_dir=""

    case $backup_type in
        daily)   backup_dir="${BACKUP_ROOT}/daily/${DATE}" ;;
        weekly)  backup_dir="${BACKUP_ROOT}/weekly/${DATE}" ;;
        monthly) backup_dir="${BACKUP_ROOT}/monthly/${YEAR_MONTH}" ;;
    esac

    local manifest_file="${backup_dir}/backup_manifest.json"
    local pg_version=$(sudo -u postgres psql --version | head -1)

    # Build JSON manually for compatibility
    echo "{" > "${manifest_file}"
    echo "    \"backup_date\": \"$(date -Iseconds)\"," >> "${manifest_file}"
    echo "    \"backup_type\": \"${backup_type}\"," >> "${manifest_file}"
    echo "    \"server\": \"oracle-cloud\"," >> "${manifest_file}"
    echo "    \"postgresql_version\": \"${pg_version}\"," >> "${manifest_file}"
    echo "    \"databases\": [" >> "${manifest_file}"

    local first=true
    for file in "${backup_dir}"/*.sql.gz; do
        if [ -f "${file}" ]; then
            local db_name=$(basename "${file}" | cut -d'_' -f1)
            local size=$(stat -c%s "${file}")
            local checksum=$(md5sum "${file}" | cut -d' ' -f1)

            if [ "$first" = true ]; then
                first=false
            else
                echo "," >> "${manifest_file}"
            fi
            echo -n "        {\"name\": \"${db_name}\", \"file\": \"$(basename ${file})\", \"size\": ${size}, \"md5\": \"${checksum}\"}" >> "${manifest_file}"
        fi
    done

    echo "" >> "${manifest_file}"
    echo "    ]," >> "${manifest_file}"
    echo "    \"total_size\": \"$(du -sh ${backup_dir} | cut -f1)\"," >> "${manifest_file}"
    echo "    \"retention_days\": ${DAILY_RETENTION_DAYS}" >> "${manifest_file}"
    echo "}" >> "${manifest_file}"

    log_info "Manifest created: ${manifest_file}"
}

#------------------------------------------------------------------------------
# Main execution
#------------------------------------------------------------------------------
main() {
    local backup_type="daily"

    # Parse arguments
    case "${1:-}" in
        --weekly)  backup_type="weekly"; mkdir -p "${BACKUP_ROOT}/weekly/${DATE}" ;;
        --monthly) backup_type="monthly"; mkdir -p "${BACKUP_ROOT}/monthly/${YEAR_MONTH}" ;;
        --all)     backup_type="all" ;;
        "")        backup_type="daily" ;;
        *)
            # Single DB name provided
            if [[ " ${DATABASES[*]} " =~ " ${1} " ]]; then
                init_directories
                backup_database "$1" "daily"
                exit $?
            else
                echo "Unknown argument: $1"
                echo "Usage: $0 [--weekly|--monthly|<database_name>]"
                exit 1
            fi
            ;;
    esac

    log_info "=============================================="
    log_info "PostgreSQL Backup Started (${backup_type})"
    log_info "=============================================="

    init_directories

    local success_count=0
    local fail_count=0
    local skip_count=0

    for db in "${DATABASES[@]}"; do
        if db_exists "${db}"; then
            if backup_database "${db}" "${backup_type}"; then
                ((success_count++)) || true
            else
                ((fail_count++)) || true
            fi
        else
            log_warn "Skipping non-existent database: ${db}"
            ((skip_count++)) || true
        fi
    done

    # Create manifest
    create_manifest "${backup_type}"

    log_info "=============================================="
    log_info "Backup Completed: Success ${success_count}, Failed ${fail_count}, Skipped ${skip_count}"
    log_info "=============================================="

    # Return failure code if any backup failed
    if [ ${fail_count} -gt 0 ]; then
        exit 1
    fi
}

main "$@"
