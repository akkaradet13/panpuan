#!/usr/bin/env bash
# Applies the Storage lifecycle rule (delete leftover uploads/ after 1 day).
# Usage: scripts/setup-storage.sh <bucket>   e.g. panpuan-dev.firebasestorage.app
set -euo pipefail
BUCKET="${1:?bucket name required}"
gcloud storage buckets update "gs://${BUCKET}" --lifecycle-file="$(dirname "$0")/storage-lifecycle.json"
