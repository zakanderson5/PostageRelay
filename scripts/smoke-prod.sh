#!/usr/bin/env bash
set -euo pipefail

BASE="https://www.gatepostinbox.com"

echo "== Smoke test against: $BASE =="

echo ""
echo "1) /inbox should be blocked in prod (expect 404)"
curl -s -o /dev/null -w "status=%{http_code}\n" "$BASE/inbox/demo"

echo ""
echo "2) /api/dev should be blocked in prod (expect 404)"
curl -s -o /dev/null -w "status=%{http_code}\n" "$BASE/api/dev/test-email"

echo ""
echo "3) cron endpoint without auth should be 401"
curl -s -o /dev/null -w "status=%{http_code}\n" -X POST "$BASE/api/cron/expire"

echo ""
echo "4) cron endpoint with auth should be 200"
: "${CRON_SECRET:?Set CRON_SECRET in your shell first}"
curl -s -o /dev/null -w "status=%{http_code}\n" -X POST "$BASE/api/cron/expire" -H "Authorization: Bearer $CRON_SECRET"

echo ""
echo "5) /start should load (200)"
curl -s -o /dev/null -w "status=%{http_code}\n" "$BASE/start"

echo ""
echo "DONE"
