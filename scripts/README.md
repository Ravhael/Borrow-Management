Test scripts for /api/loans/[id]/warehouse

Use the bundled curl script to quickly reproduce POST flows for the warehouse API route.

Examples (from project root):

1) Test JSON payloads

```bash
BASE_URL=http://localhost:3000 ID=1764237746775 ./scripts/test-warehouse-curl.sh
```

2) Test multipart/form-data uploads (replace path with a real file)

```bash
BASE_URL=http://localhost:3000 ID=1764237746775 ./scripts/test-warehouse-curl.sh
```

If the server returns 400 Invalid action, the response will include a debug object (development only) showing headers, query and counts so you can paste the body here.
