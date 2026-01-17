#!/bin/bash
#==============================================================================
# PostgreSQL Backup Verification Script
# Location: /home/ubuntu/workhub/backups/scripts/backup-verify.sh
#
# Usage:
#   ./backup-verify.sh                    # Verify today's backup
#   ./backup-verify.sh 2026-01-17         # Verify specific date backup
#   ./backup-verify.sh --all              # Verify all backup types
#==============================================================================

set -euo pipefail

BACKUP_ROOT="/home/ubuntu/workhub/backups"
LOG_DIR="${BACKUP_ROOT}/logs"

# Timezone
export TZ="Asia/Seoul"
DATE=$(date +%Y-%m-%d)
CHECK_DATE="${1:-${DATE}}"

log() {
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S %Z")
    echo "[${timestamp}] [VERIFY] $@" | tee -a "${LOG_DIR}/verify_${DATE}.log"
}

#------------------------------------------------------------------------------
# Function: Verify single backup file
#------------------------------------------------------------------------------
verify_backup_file() {
    local file=$1
    local status="OK"
    local issues=()

    # Check file exists
    if [ ! -f "${file}" ]; then
        echo "MISSING"
        return 1
    fi

    # Check file size (minimum 200 bytes for empty DB)
    local size=$(stat -c%s "${file}")
    if [ ${size} -lt 200 ]; then
        issues+=("size_abnormal(${size}B)")
        status="WARN"
    fi

    # Check gzip integrity
    if ! gzip -t "${file}" 2>/dev/null; then
        issues+=("gzip_corrupted")
        status="FAIL"
    fi

    # Check SQL header (look in first 50 lines)
    local header_check
    header_check=$(zcat "${file}" 2>/dev/null | head -50 | grep "PostgreSQL" || echo "")
    if [ -z "$header_check" ]; then
        issues+=("header_invalid")
        status="FAIL"
    fi

    # Output result
    if [ ${#issues[@]} -gt 0 ]; then
        echo "${status}: ${issues[*]}"
    else
        # Format size for display using awk (no bc dependency)
        local formatted_size
        if [ ${size} -gt 1048576 ]; then
            formatted_size="$(awk "BEGIN {printf \"%.1fM\", ${size}/1048576}")"
        elif [ ${size} -gt 1024 ]; then
            formatted_size="$(awk "BEGIN {printf \"%.1fK\", ${size}/1024}")"
        else
            formatted_size="${size}B"
        fi
        echo "OK (${formatted_size})"
    fi

    [ "$status" == "FAIL" ] && return 1
    return 0
}

#------------------------------------------------------------------------------
# Function: Verify daily backup
#------------------------------------------------------------------------------
verify_daily() {
    local check_date=$1
    local backup_dir="${BACKUP_ROOT}/daily/${check_date}"

    log "Verifying daily backup: ${check_date}"

    if [ ! -d "${backup_dir}" ]; then
        log "Backup directory not found: ${backup_dir}"
        return 1
    fi

    echo ""
    printf "%-25s %-40s\n" "Database" "Status"
    echo "================================================================="

    local total=0
    local passed=0
    local failed=0

    for file in "${backup_dir}"/*.sql.gz; do
        if [ -f "${file}" ]; then
            local db_name=$(basename "${file}" | cut -d'_' -f1)
            local result=$(verify_backup_file "${file}")
            printf "%-25s %-40s\n" "${db_name}" "${result}"

            ((total++)) || true
            if [[ "$result" == OK* ]]; then
                ((passed++)) || true
            else
                ((failed++)) || true
            fi
        fi
    done

    echo "================================================================="
    echo "Total: ${total}, Passed: ${passed}, Failed: ${failed}"
    echo ""

    # Check manifest
    if [ -f "${backup_dir}/backup_manifest.json" ]; then
        log "Manifest exists: OK"
        echo "Manifest: OK"
    else
        log "Manifest missing: WARN"
        echo "Manifest: MISSING"
    fi

    return ${failed}
}

#------------------------------------------------------------------------------
# Function: Verify all backups
#------------------------------------------------------------------------------
verify_all() {
    log "Verifying all backup types"

    echo ""
    echo "=== Daily Backups ==="
    if [ -d "${BACKUP_ROOT}/daily" ]; then
        for dir in $(ls -d "${BACKUP_ROOT}/daily"/*/ 2>/dev/null | sort -r | head -5); do
            local date_dir=$(basename "${dir}")
            local count=$(find "${dir}" -name "*.sql.gz" 2>/dev/null | wc -l)
            local size=$(du -sh "${dir}" 2>/dev/null | cut -f1)
            echo "  ${date_dir}: ${count} files, ${size}"
        done
    else
        echo "  (no daily backups)"
    fi

    echo ""
    echo "=== Weekly Backups ==="
    if [ -d "${BACKUP_ROOT}/weekly" ]; then
        for dir in $(ls -d "${BACKUP_ROOT}/weekly"/*/ 2>/dev/null | sort -r | head -5); do
            local date_dir=$(basename "${dir}")
            local count=$(find "${dir}" -name "*.sql.gz" 2>/dev/null | wc -l)
            local size=$(du -sh "${dir}" 2>/dev/null | cut -f1)
            echo "  ${date_dir}: ${count} files, ${size}"
        done
    else
        echo "  (no weekly backups)"
    fi

    echo ""
    echo "=== Monthly Backups ==="
    if [ -d "${BACKUP_ROOT}/monthly" ]; then
        for dir in $(ls -d "${BACKUP_ROOT}/monthly"/*/ 2>/dev/null | sort -r | head -5); do
            local date_dir=$(basename "${dir}")
            local count=$(find "${dir}" -name "*.sql.gz" 2>/dev/null | wc -l)
            local size=$(du -sh "${dir}" 2>/dev/null | cut -f1)
            echo "  ${date_dir}: ${count} files, ${size}"
        done
    else
        echo "  (no monthly backups)"
    fi

    echo ""
    echo "=== Storage Summary ==="
    local total_size=$(du -sh "${BACKUP_ROOT}" 2>/dev/null | cut -f1)
    local disk_available=$(df -h / | tail -1 | awk '{print $4}')
    echo "  Total backup size: ${total_size}"
    echo "  Disk available: ${disk_available}"
}

#------------------------------------------------------------------------------
# Main execution
#------------------------------------------------------------------------------
main() {
    mkdir -p "${LOG_DIR}"

    case "${CHECK_DATE}" in
        --all)
            log "=============================================="
            log "Full Backup Verification Started"
            log "=============================================="
            verify_all
            log "=============================================="
            log "Full Backup Verification Completed"
            log "=============================================="
            ;;
        --help|-h)
            echo "PostgreSQL Backup Verification Script"
            echo ""
            echo "Usage:"
            echo "  $0                    Verify today's daily backup"
            echo "  $0 <YYYY-MM-DD>       Verify specific date's daily backup"
            echo "  $0 --all              Verify all backup types"
            echo "  $0 --help             Show this help"
            ;;
        *)
            log "=============================================="
            log "Backup Verification Started: ${CHECK_DATE}"
            log "=============================================="

            verify_daily "${CHECK_DATE}"
            local result=$?

            log "=============================================="
            log "Backup Verification Completed"
            log "=============================================="

            exit ${result}
            ;;
    esac
}

main "$@"
