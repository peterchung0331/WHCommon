#!/bin/bash
#==============================================================================
# PostgreSQL Backup Cleanup Script
# Location: /home/ubuntu/workhub/backups/scripts/backup-cleanup.sh
#
# Removes old backups based on retention policy:
# - Daily backups: 7 days
# - Weekly backups: 4 weeks
# - Monthly backups: 12 months
# - Log files: 30 days
#==============================================================================

set -euo pipefail

BACKUP_ROOT="/home/ubuntu/workhub/backups"
LOG_DIR="${BACKUP_ROOT}/logs"

# Timezone
export TZ="Asia/Seoul"
DATE=$(date +%Y-%m-%d)

# Retention policy
DAILY_RETENTION_DAYS=7
WEEKLY_RETENTION_WEEKS=4
MONTHLY_RETENTION_MONTHS=12
LOG_RETENTION_DAYS=30

log() {
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S %Z")
    echo "[${timestamp}] [CLEANUP] $@" | tee -a "${LOG_DIR}/cleanup_${DATE}.log"
}

#------------------------------------------------------------------------------
# Daily backup cleanup (delete backups older than 7 days)
#------------------------------------------------------------------------------
cleanup_daily() {
    log "Starting daily backup cleanup (older than ${DAILY_RETENTION_DAYS} days)"

    local deleted=0
    if [ -d "${BACKUP_ROOT}/daily" ]; then
        while IFS= read -r -d '' dir; do
            log "Deleting: ${dir}"
            rm -rf "${dir}"
            ((deleted++))
        done < <(find "${BACKUP_ROOT}/daily" -mindepth 1 -maxdepth 1 -type d -mtime +${DAILY_RETENTION_DAYS} -print0 2>/dev/null || true)
    fi

    log "Daily backup cleanup completed: ${deleted} directories deleted"
}

#------------------------------------------------------------------------------
# Weekly backup cleanup (delete backups older than 4 weeks)
#------------------------------------------------------------------------------
cleanup_weekly() {
    local retention_days=$((WEEKLY_RETENTION_WEEKS * 7))
    log "Starting weekly backup cleanup (older than ${WEEKLY_RETENTION_WEEKS} weeks)"

    local deleted=0
    if [ -d "${BACKUP_ROOT}/weekly" ]; then
        while IFS= read -r -d '' dir; do
            log "Deleting: ${dir}"
            rm -rf "${dir}"
            ((deleted++))
        done < <(find "${BACKUP_ROOT}/weekly" -mindepth 1 -maxdepth 1 -type d -mtime +${retention_days} -print0 2>/dev/null || true)
    fi

    log "Weekly backup cleanup completed: ${deleted} directories deleted"
}

#------------------------------------------------------------------------------
# Monthly backup cleanup (delete backups older than 12 months)
#------------------------------------------------------------------------------
cleanup_monthly() {
    local retention_days=$((MONTHLY_RETENTION_MONTHS * 30))
    log "Starting monthly backup cleanup (older than ${MONTHLY_RETENTION_MONTHS} months)"

    local deleted=0
    if [ -d "${BACKUP_ROOT}/monthly" ]; then
        while IFS= read -r -d '' dir; do
            log "Deleting: ${dir}"
            rm -rf "${dir}"
            ((deleted++))
        done < <(find "${BACKUP_ROOT}/monthly" -mindepth 1 -maxdepth 1 -type d -mtime +${retention_days} -print0 2>/dev/null || true)
    fi

    log "Monthly backup cleanup completed: ${deleted} directories deleted"
}

#------------------------------------------------------------------------------
# Log file cleanup (delete logs older than 30 days)
#------------------------------------------------------------------------------
cleanup_logs() {
    log "Starting log cleanup (older than ${LOG_RETENTION_DAYS} days)"

    local deleted=0
    if [ -d "${LOG_DIR}" ]; then
        deleted=$(find "${LOG_DIR}" -name "*.log" -mtime +${LOG_RETENTION_DAYS} -delete -print 2>/dev/null | wc -l || echo "0")
    fi

    log "Log cleanup completed: ${deleted} files deleted"
}

#------------------------------------------------------------------------------
# Disk usage report
#------------------------------------------------------------------------------
report_disk_usage() {
    log "=== Backup Disk Usage Report ==="

    local daily_size="0"
    local weekly_size="0"
    local monthly_size="0"
    local total_size="0"

    if [ -d "${BACKUP_ROOT}/daily" ]; then
        daily_size=$(du -sh "${BACKUP_ROOT}/daily" 2>/dev/null | cut -f1 || echo "0")
    fi
    if [ -d "${BACKUP_ROOT}/weekly" ]; then
        weekly_size=$(du -sh "${BACKUP_ROOT}/weekly" 2>/dev/null | cut -f1 || echo "0")
    fi
    if [ -d "${BACKUP_ROOT}/monthly" ]; then
        monthly_size=$(du -sh "${BACKUP_ROOT}/monthly" 2>/dev/null | cut -f1 || echo "0")
    fi
    total_size=$(du -sh "${BACKUP_ROOT}" 2>/dev/null | cut -f1 || echo "0")

    log "Daily backups:   ${daily_size}"
    log "Weekly backups:  ${weekly_size}"
    log "Monthly backups: ${monthly_size}"
    log "Total:           ${total_size}"
    log "Root partition available: $(df -h / | tail -1 | awk '{print $4}')"
}

#------------------------------------------------------------------------------
# Main execution
#------------------------------------------------------------------------------
main() {
    mkdir -p "${LOG_DIR}"

    log "=============================================="
    log "Backup Cleanup Started"
    log "=============================================="

    cleanup_daily
    cleanup_weekly
    cleanup_monthly
    cleanup_logs
    report_disk_usage

    log "=============================================="
    log "Backup Cleanup Completed"
    log "=============================================="
}

main "$@"
