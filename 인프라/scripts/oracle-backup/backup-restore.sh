#!/bin/bash
#==============================================================================
# PostgreSQL Backup Restore Script
# Location: /home/ubuntu/workhub/backups/scripts/backup-restore.sh
#
# Usage:
#   ./backup-restore.sh <backup_path> <target_database>
#   ./backup-restore.sh daily/2026-01-17/wbhubmanager_20260117_0300.sql.gz wbhubmanager
#   ./backup-restore.sh --list                    # List available backups
#   ./backup-restore.sh --list wbhubmanager       # List backups for specific DB
#==============================================================================

set -euo pipefail

BACKUP_ROOT="/home/ubuntu/workhub/backups"
LOG_DIR="${BACKUP_ROOT}/logs"

# Timezone
export TZ="Asia/Seoul"
DATE=$(date +%Y-%m-%d)

log() {
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S %Z")
    echo "[${timestamp}] [RESTORE] $@" | tee -a "${LOG_DIR}/restore_${DATE}.log"
}

#------------------------------------------------------------------------------
# Function: List available backups
#------------------------------------------------------------------------------
list_backups() {
    local db_filter="${1:-}"

    echo "=== Available Backups ==="
    echo ""

    for type in daily weekly monthly; do
        echo "[$type]"
        if [ -d "${BACKUP_ROOT}/${type}" ]; then
            if [ -n "${db_filter}" ]; then
                find "${BACKUP_ROOT}/${type}" -name "${db_filter}_*.sql.gz" -printf "  %P (%s bytes, %Tc)\n" 2>/dev/null | sort -r | head -10 || echo "  (none)"
            else
                find "${BACKUP_ROOT}/${type}" -name "*.sql.gz" -printf "  %P (%s bytes, %Tc)\n" 2>/dev/null | sort -r | head -20 || echo "  (none)"
            fi
        else
            echo "  (directory not found)"
        fi
        echo ""
    done
}

#------------------------------------------------------------------------------
# Function: Show backup info
#------------------------------------------------------------------------------
show_backup_info() {
    local backup_file=$1

    if [ ! -f "${backup_file}" ]; then
        echo "Error: File not found: ${backup_file}"
        return 1
    fi

    echo "=== Backup File Info ==="
    echo "  File: ${backup_file}"
    echo "  Size: $(ls -lh ${backup_file} | awk '{print $5}')"
    echo "  Modified: $(stat -c '%y' ${backup_file})"
    echo "  MD5: $(md5sum ${backup_file} | cut -d' ' -f1)"

    # Show SQL metadata from dump header
    echo ""
    echo "=== Dump Metadata ==="
    zcat "${backup_file}" 2>/dev/null | head -30 | grep -E "^--" | head -10 || echo "  (unable to read metadata)"
    echo ""
}

#------------------------------------------------------------------------------
# Function: Execute restore
#------------------------------------------------------------------------------
restore_database() {
    local backup_path=$1
    local target_db=$2
    local backup_file="${BACKUP_ROOT}/${backup_path}"

    # If absolute path provided, use it directly
    if [[ "${backup_path}" == /* ]]; then
        backup_file="${backup_path}"
    fi

    # Check file exists
    if [ ! -f "${backup_file}" ]; then
        echo "Error: Backup file not found: ${backup_file}"
        echo ""
        echo "Usage: $0 <backup_path> <target_database>"
        echo "Example: $0 daily/2026-01-17/wbhubmanager_20260117_0300.sql.gz wbhubmanager"
        exit 1
    fi

    # Show backup info
    show_backup_info "${backup_file}"

    # Confirmation prompt
    echo "=================================================="
    echo "WARNING: This will overwrite existing data!"
    echo ""
    echo "  Backup file: ${backup_file}"
    echo "  Target DB:   ${target_db}"
    echo "  File size:   $(ls -lh ${backup_file} | awk '{print $5}')"
    echo "=================================================="
    echo ""
    read -p "Are you sure you want to proceed? (yes/no): " confirm

    if [ "${confirm}" != "yes" ]; then
        log "Restore cancelled by user"
        echo "Restore cancelled."
        exit 0
    fi

    log "Restore started: ${backup_file} -> ${target_db}"

    # Check if database exists
    if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "${target_db}"; then
        echo "Database '${target_db}' does not exist."
        read -p "Create it? (yes/no): " create_confirm
        if [ "${create_confirm}" == "yes" ]; then
            log "Creating database: ${target_db}"
            sudo -u postgres createdb "${target_db}"
        else
            log "Restore cancelled - database does not exist"
            exit 1
        fi
    fi

    # Terminate existing connections
    log "Terminating existing connections to ${target_db}"
    sudo -u postgres psql -c "
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = '${target_db}' AND pid <> pg_backend_pid();
    " 2>/dev/null || true

    # Execute restore
    echo "Restoring database..."
    local start_time=$(date +%s)

    if zcat "${backup_file}" | sudo -u postgres psql -d "${target_db}" 2>&1 | tee -a "${LOG_DIR}/restore_${DATE}.log"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log "Restore completed: ${target_db} (duration: ${duration}s)"
        echo ""
        echo "Restore completed successfully in ${duration} seconds."
    else
        log "Restore failed: ${target_db}"
        echo ""
        echo "Error: Restore failed. Check logs at ${LOG_DIR}/restore_${DATE}.log"
        exit 1
    fi
}

#------------------------------------------------------------------------------
# Main execution
#------------------------------------------------------------------------------
main() {
    mkdir -p "${LOG_DIR}"

    case "${1:-}" in
        --list)
            list_backups "${2:-}"
            ;;
        --info)
            if [ -z "${2:-}" ]; then
                echo "Usage: $0 --info <backup_path>"
                exit 1
            fi
            show_backup_info "${BACKUP_ROOT}/${2}"
            ;;
        --help|-h|"")
            echo "PostgreSQL Backup Restore Script"
            echo ""
            echo "Usage:"
            echo "  $0 <backup_path> <target_database>   Restore backup to database"
            echo "  $0 --list [database_name]            List available backups"
            echo "  $0 --info <backup_path>              Show backup file info"
            echo "  $0 --help                            Show this help"
            echo ""
            echo "Examples:"
            echo "  $0 daily/2026-01-17/wbhubmanager_20260117_0300.sql.gz wbhubmanager"
            echo "  $0 --list wbhubmanager"
            echo "  $0 --info daily/2026-01-17/wbhubmanager_20260117_0300.sql.gz"
            ;;
        *)
            if [ -z "${2:-}" ]; then
                echo "Error: Target database not specified"
                echo "Usage: $0 <backup_path> <target_database>"
                exit 1
            fi
            restore_database "$1" "$2"
            ;;
    esac
}

main "$@"
