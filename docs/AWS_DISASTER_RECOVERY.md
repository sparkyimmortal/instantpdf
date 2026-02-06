# InstantPDF - AWS Disaster Recovery & Backup Strategy

This document outlines the disaster recovery strategy for InstantPDF when deployed on AWS infrastructure.

## Table of Contents
1. [Overview](#overview)
2. [Database Backup Strategy](#database-backup-strategy)
3. [S3 Storage Strategy (Future)](#s3-storage-strategy-future)
4. [Subscription Management](#subscription-management)
5. [Restore Procedures](#restore-procedures)
6. [Monitoring & Alerts](#monitoring--alerts)
7. [Recovery Time Objectives](#recovery-time-objectives)

---

## Overview

### Architecture Components
- **Application Server**: EC2 / ECS / App Runner
- **Database**: Amazon RDS PostgreSQL
- **File Storage**: Amazon S3 (future - for Pro user PDF storage)
- **Payments**: Stripe (source of truth for subscriptions)

### Key Principles
1. **Data Isolation**: Backups stored in separate AWS account or external provider
2. **Encryption at Rest**: All backups encrypted with customer-managed KMS keys
3. **Encryption in Transit**: All data transfers over TLS
4. **Automated**: Daily automated backups with no manual intervention required
5. **Tested**: Regular restore drills to verify backup integrity

---

## Database Backup Strategy

### Daily Automated PostgreSQL Backups

#### Option 1: RDS Automated Backups (Recommended)

RDS provides automated daily backups with point-in-time recovery.

```bash
# Enable automated backups when creating RDS instance
aws rds create-db-instance \
  --db-instance-identifier instantpdf-prod \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15 \
  --master-username admin \
  --master-user-password <secure-password> \
  --allocated-storage 100 \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00" \
  --storage-encrypted \
  --kms-key-id alias/instantpdf-rds-key \
  --copy-tags-to-snapshot
```

**RDS Backup Settings:**
- Retention Period: 30 days
- Backup Window: 03:00-04:00 UTC (low traffic)
- Storage Encryption: Enabled with KMS

#### Option 2: Manual pg_dump to External Storage

For cross-account or external provider backup, use pg_dump with encryption.

**Daily Backup Script (`scripts/backup_database.sh`):**

```bash
#!/bin/bash
set -euo pipefail

# Configuration
DB_HOST="${RDS_HOST}"
DB_NAME="${RDS_DATABASE:-instantpdf}"
DB_USER="${RDS_USER:-admin}"
DB_PASSWORD="${RDS_PASSWORD}"
BACKUP_BUCKET="${BACKUP_S3_BUCKET}"
BACKUP_ACCOUNT_PROFILE="${BACKUP_AWS_PROFILE:-backup-account}"
KMS_KEY_ID="${BACKUP_KMS_KEY_ID}"
RETENTION_DAYS=30

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="instantpdf_backup_${TIMESTAMP}.dump"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

echo "[$(date)] Starting database backup..."

# Create backup using pg_dump with custom format (supports pg_restore)
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --format=custom \
  --no-owner \
  --no-acl \
  --verbose \
  --file="/tmp/${BACKUP_FILE}"

echo "[$(date)] Database dump completed. Compressing..."

# Compress the backup
gzip -9 "/tmp/${BACKUP_FILE}"

echo "[$(date)] Uploading to S3 with server-side KMS encryption..."

# Upload to S3 with SSE-KMS encryption (handles encryption automatically)
# This is the recommended approach for large files
aws s3 cp "/tmp/${COMPRESSED_FILE}" \
  "s3://${BACKUP_BUCKET}/database/${COMPRESSED_FILE}" \
  --profile "${BACKUP_ACCOUNT_PROFILE}" \
  --storage-class STANDARD_IA \
  --sse aws:kms \
  --sse-kms-key-id "${KMS_KEY_ID}"

echo "[$(date)] Cleaning up temporary files..."

# Cleanup
rm -f "/tmp/${COMPRESSED_FILE}"

echo "[$(date)] Removing backups older than ${RETENTION_DAYS} days..."

# Remove old backups (keep last 30 days)
aws s3 ls "s3://${BACKUP_BUCKET}/database/" \
  --profile "${BACKUP_ACCOUNT_PROFILE}" | \
  while read -r line; do
    file_date=$(echo "$line" | awk '{print $1}')
    file_name=$(echo "$line" | awk '{print $4}')
    if [[ -n "$file_name" ]]; then
      days_old=$(( ($(date +%s) - $(date -d "$file_date" +%s)) / 86400 ))
      if [[ $days_old -gt $RETENTION_DAYS ]]; then
        aws s3 rm "s3://${BACKUP_BUCKET}/database/${file_name}" \
          --profile "${BACKUP_ACCOUNT_PROFILE}"
        echo "Deleted old backup: ${file_name}"
      fi
    fi
  done

echo "[$(date)] Backup completed successfully: ${COMPRESSED_FILE}"
```

**Note on Encryption:**
- S3 SSE-KMS handles encryption/decryption automatically during upload/download
- No size limits (unlike direct KMS encrypt which is limited to 4KB)
- Backup files are encrypted at rest with your KMS key
- Decryption happens transparently when downloading with proper IAM permissions

**Cron Schedule (AWS EventBridge or crontab):**
```bash
# Daily at 3 AM UTC
0 3 * * * /opt/instantpdf/scripts/backup_database.sh >> /var/log/backup.log 2>&1
```

### Cross-Account Backup Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION ACCOUNT                               │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────────────┐   │
│  │   RDS       │────▶│  EC2/Lambda │────▶│  Encrypted Backup File  │   │
│  │  PostgreSQL │     │  Backup Job │     └───────────┬─────────────┘   │
│  └─────────────┘     └─────────────┘                 │                  │
└──────────────────────────────────────────────────────┼──────────────────┘
                                                       │ Cross-Account
                                                       │ S3 Upload
                                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          BACKUP ACCOUNT                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    S3 Backup Bucket                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│  │  │ Day 1 Backup │  │ Day 2 Backup │  │ Day 30 Backup│  ...     │   │
│  │  │ (encrypted)  │  │ (encrypted)  │  │ (encrypted)  │          │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │   │
│  │                                                                  │   │
│  │  Lifecycle: Transition to Glacier after 90 days                 │   │
│  │  Versioning: Enabled                                            │   │
│  │  MFA Delete: Enabled                                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────┐                                                    │
│  │   KMS Key       │  Customer-managed, separate from production        │
│  │   (Encryption)  │                                                    │
│  └─────────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Backup Account S3 Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowProductionAccountWrite",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::PRODUCTION_ACCOUNT_ID:role/BackupRole"
      },
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::instantpdf-backups/*"
    },
    {
      "Sid": "DenyUnencryptedUploads",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::instantpdf-backups/*",
      "Condition": {
        "StringNotEquals": {
          "s3:x-amz-server-side-encryption": "aws:kms"
        }
      }
    }
  ]
}
```

---

## S3 Storage Strategy (Future)

When S3 PDF storage is implemented for Pro users:

### Bucket Configuration
```bash
# Create bucket with versioning and encryption
aws s3api create-bucket \
  --bucket instantpdf-user-files \
  --region us-east-1 \
  --object-lock-enabled-for-bucket

aws s3api put-bucket-versioning \
  --bucket instantpdf-user-files \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket instantpdf-user-files \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "aws:kms",
        "KMSMasterKeyID": "alias/instantpdf-s3-key"
      }
    }]
  }'
```

### Cross-Region Replication
```json
{
  "Role": "arn:aws:iam::ACCOUNT_ID:role/S3ReplicationRole",
  "Rules": [
    {
      "Status": "Enabled",
      "Priority": 1,
      "Filter": {},
      "Destination": {
        "Bucket": "arn:aws:s3:::instantpdf-user-files-replica",
        "ReplicaKmsKeyID": "arn:aws:kms:us-west-2:ACCOUNT_ID:key/KEY_ID",
        "StorageClass": "STANDARD_IA"
      },
      "SourceSelectionCriteria": {
        "SseKmsEncryptedObjects": {
          "Status": "Enabled"
        }
      },
      "DeleteMarkerReplication": {
        "Status": "Disabled"
      }
    }
  ]
}
```

---

## Subscription Management

### Stripe as Source of Truth

Stripe is the authoritative source for subscription status. The local database caches subscription info for performance but syncs with Stripe.

**Sync Strategy:**
1. Webhook events update local database in real-time
2. Daily reconciliation job compares Stripe records with local DB
3. On conflict, Stripe data takes precedence

**Webhook Events to Handle:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

**Reconciliation Script (`scripts/sync_subscriptions.sh`):** *(TODO: Implement when Stripe integration is added)*
```bash
#!/bin/bash
# Run daily to ensure local DB matches Stripe
# NOTE: This endpoint will be created when Stripe integration is implemented
curl -X POST https://your-domain.com/api/admin/sync-subscriptions \
  -H "Authorization: Bearer ${ADMIN_API_KEY}"
```

---

## Restore Procedures

### Database Restore from RDS Snapshot

```bash
# List available snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier instantpdf-prod

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier instantpdf-restored \
  --db-snapshot-identifier rds:instantpdf-prod-2026-02-05-03-00 \
  --db-instance-class db.t3.medium \
  --vpc-security-group-ids sg-xxxxxxxx

# Wait for instance to be available
aws rds wait db-instance-available \
  --db-instance-identifier instantpdf-restored

# Update application to use restored database
# (update DATABASE_URL environment variable)
```

### Database Restore from pg_dump Backup

**Restore Script (`scripts/restore_database.sh`):**

```bash
#!/bin/bash
set -euo pipefail

# Configuration
BACKUP_FILE="${1:-}"
BACKUP_BUCKET="${BACKUP_S3_BUCKET}"
BACKUP_ACCOUNT_PROFILE="${BACKUP_AWS_PROFILE:-backup-account}"

TARGET_HOST="${RDS_HOST}"
TARGET_DB="${RDS_DATABASE:-instantpdf}"
TARGET_USER="${RDS_USER:-admin}"
TARGET_PASSWORD="${RDS_PASSWORD}"

if [[ -z "${BACKUP_FILE}" ]]; then
  echo "Usage: $0 <backup_filename>"
  echo ""
  echo "Available backups:"
  aws s3 ls "s3://${BACKUP_BUCKET}/database/" \
    --profile "${BACKUP_ACCOUNT_PROFILE}" | tail -10
  exit 1
fi

echo "[$(date)] Downloading backup file from S3..."

# Download backup (S3 SSE-KMS decrypts automatically with proper IAM permissions)
aws s3 cp "s3://${BACKUP_BUCKET}/database/${BACKUP_FILE}" \
  "/tmp/${BACKUP_FILE}" \
  --profile "${BACKUP_ACCOUNT_PROFILE}"

echo "[$(date)] Decompressing backup..."

# Decompress
gunzip -k "/tmp/${BACKUP_FILE}"
DUMP_FILE="${BACKUP_FILE%.gz}"

echo "[$(date)] Creating backup of current database before restore..."

# Backup current database before restore
PGPASSWORD="${TARGET_PASSWORD}" pg_dump \
  -h "${TARGET_HOST}" \
  -U "${TARGET_USER}" \
  -d "${TARGET_DB}" \
  --format=custom \
  --file="/tmp/pre_restore_backup_$(date +%Y%m%d_%H%M%S).dump"

echo "[$(date)] Restoring database using pg_restore..."

# Restore using pg_restore (for custom format dumps)
# --clean drops existing objects before restoring
# --if-exists prevents errors if objects don't exist
PGPASSWORD="${TARGET_PASSWORD}" pg_restore \
  -h "${TARGET_HOST}" \
  -U "${TARGET_USER}" \
  -d "${TARGET_DB}" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  --verbose \
  "/tmp/${DUMP_FILE}"

echo "[$(date)] Cleaning up..."

# Cleanup
rm -f "/tmp/${BACKUP_FILE}" "/tmp/${DUMP_FILE}"

echo "[$(date)] Restore completed successfully!"
echo ""
echo "IMPORTANT: Verify the restore by checking:"
echo "  1. User count matches expected"
echo "  2. Recent operations are present"
echo "  3. Application functionality works"
```

**Note:** The backup uses custom format (`--format=custom`) which requires `pg_restore` for restoration. This format offers:
- Parallel restore support for faster recovery
- Selective table/schema restoration
- Better compression than plain SQL
- Data reordering for optimal load performance

### Point-in-Time Recovery (RDS)

```bash
# Restore to specific point in time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier instantpdf-prod \
  --target-db-instance-identifier instantpdf-pit-restore \
  --restore-time "2026-02-05T10:30:00Z" \
  --db-instance-class db.t3.medium

# Alternative: restore to latest restorable time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier instantpdf-prod \
  --target-db-instance-identifier instantpdf-pit-restore \
  --use-latest-restorable-time
```

---

## Monitoring & Alerts

### CloudWatch Alarms

```bash
# Backup job failure alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "InstantPDF-BackupFailure" \
  --alarm-description "Database backup job failed" \
  --metric-name "BackupSuccess" \
  --namespace "InstantPDF/Backups" \
  --statistic "Sum" \
  --period 86400 \
  --evaluation-periods 1 \
  --threshold 1 \
  --comparison-operator "LessThanThreshold" \
  --alarm-actions "arn:aws:sns:us-east-1:ACCOUNT_ID:alerts"

# RDS storage alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "InstantPDF-RDS-StorageLow" \
  --alarm-description "RDS storage space running low" \
  --metric-name "FreeStorageSpace" \
  --namespace "AWS/RDS" \
  --dimensions "Name=DBInstanceIdentifier,Value=instantpdf-prod" \
  --statistic "Average" \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 10737418240 \
  --comparison-operator "LessThanThreshold" \
  --alarm-actions "arn:aws:sns:us-east-1:ACCOUNT_ID:alerts"
```

### Backup Verification

Run weekly to ensure backups are valid:

```bash
#!/bin/bash
# scripts/verify_backup.sh

# Download latest backup
LATEST_BACKUP=$(aws s3 ls "s3://${BACKUP_BUCKET}/database/" \
  --profile "${BACKUP_ACCOUNT_PROFILE}" | tail -1 | awk '{print $4}')

# Restore to test database
./restore_database.sh "${LATEST_BACKUP}" --target-db=instantpdf_test

# Run verification queries
PGPASSWORD="${TEST_PASSWORD}" psql -h "${TEST_HOST}" -U admin -d instantpdf_test << EOF
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as ops_count FROM pdf_operations;
SELECT MAX(created_at) as latest_operation FROM pdf_operations;
EOF

# Cleanup test database
PGPASSWORD="${TEST_PASSWORD}" psql -h "${TEST_HOST}" -U admin -d postgres \
  -c "DROP DATABASE IF EXISTS instantpdf_test;"
```

---

## Recovery Time Objectives

| Scenario | RTO (Recovery Time) | RPO (Data Loss) |
|----------|---------------------|-----------------|
| RDS Instance Failure | 5 minutes (Multi-AZ) | 0 (synchronous replication) |
| Accidental Data Deletion | 30 minutes | Up to 5 minutes (PITR) |
| Region Outage | 2-4 hours | Up to 1 day (daily backups) |
| Account Compromise | 2-4 hours | Up to 1 day (cross-account backup) |
| Complete Disaster | 4-8 hours | Up to 1 day |

---

## Checklist: Before Going to Production

- [ ] RDS Multi-AZ enabled
- [ ] RDS automated backups enabled (30 day retention)
- [ ] Cross-account backup bucket created
- [ ] KMS keys created in both accounts
- [ ] Backup IAM role with cross-account permissions
- [ ] Daily backup cron job configured
- [ ] CloudWatch alarms configured
- [ ] SNS topic for alerts
- [ ] Backup verification job scheduled (weekly)
- [ ] Restore procedure tested
- [ ] Runbook documented and accessible
- [ ] On-call rotation established

---

## Contact & Escalation

In case of disaster:

1. **First Response**: Check CloudWatch for specific failure
2. **Database Issues**: Initiate RDS restore or pg_restore
3. **S3 Issues**: Check versioning, initiate cross-region failover
4. **Account Compromise**: Activate incident response, restore from backup account

Document last updated: February 2026
