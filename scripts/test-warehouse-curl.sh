#!/usr/bin/env bash
# Quick repro script for /api/loans/<id>/warehouse
# Usage: BASE_URL=http://localhost:3000 ID=1764237746775 ./scripts/test-warehouse-curl.sh

BASE_URL=${BASE_URL:-http://localhost:3000}
ID=${ID:-1764237746775}

echo "POST JSON (process)"
curl -v -X POST "$BASE_URL/api/loans/$ID/warehouse" \
  -H 'Content-Type: application/json' \
  -d '{"action":"process","status":"Borrowed"}'

echo "\n\nPOST JSON (return)"
curl -v -X POST "$BASE_URL/api/loans/$ID/warehouse" \
  -H 'Content-Type: application/json' \
  -d '{"action":"return","status":"Returned","note":"test return via JSON"}'

echo "\n\nPOST multipart/form-data (return with files)"
echo "Replace /path/to/image.png with a real file on your machine when running this script"
curl -v -X POST "$BASE_URL/api/loans/$ID/warehouse" \
  -F action=return \
  -F status=Returned \
  -F note='test return with file' \
  -F files=@/path/to/image.png

echo "\nDone. If you get 400 'Invalid action' please paste the server response body here so I can inspect the debug fields we now return when action is missing."
