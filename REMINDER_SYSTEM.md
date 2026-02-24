# Automated Reminder System

Sistem reminder otomatis untuk mengingatkan peminjam berdasarkan tanggal kembali yang diisi di form peminjaman.

## 🎯 Fitur Utama

### Reminder Schedule
- **7 hari sebelum** tanggal kembali
- **3 hari sebelum** tanggal kembali
- **1 hari sebelum** tanggal kembali
- **Hari yang sama** dengan tanggal kembali
- **1 sampai 30 hari setelah** tanggal kembali

### Email Recipients
- ✅ **Borrower Email**: Email peminjam yang diisi di form (jika tersedia)
- ✅ **Entitas Mapping**: Semua role di entitas terkait (Head, Finance, Admin, Others)
- ✅ **Company Mapping**: Semua role di perusahaan terkait (Head, Marketing, Finance, Admin, Warehouse, Others)

### Kondisi Pengiriman
- Hanya untuk peminjaman yang sudah disetujui (marketing approval)
- Tidak dikirim untuk peminjaman yang sudah dikembalikan
- Setiap reminder hanya dikirim sekali per loan per schedule
- Mengirim ke semua email mapping secara bersamaan

## 📧 Template Email Reminder

Email reminder dikirim dengan format yang informatif dan urgent:

```
Subject: 🔔 Pengingat Pengembalian Barang - [PESAN URGENT]

Isi:
- Header dengan emoji dan judul yang menarik perhatian
- Informasi lengkap loan (ID, tanggal, detail produk)
- Pesan urgent dengan countdown hari
- Warning dan instruksi untuk pengembalian
- Footer dengan informasi kontak
```

## 🔧 Implementasi Teknis

### File-file yang Ditambahkan/Dimodifikasi:

1. **`/pages/api/reminders.ts`** - API endpoint untuk menjalankan reminder check
2. **`/utils/email-templates/reminderBeforeTemplates.ts`** - Utility untuk scheduling reminder
3. **`/utils/email-templates/reminderAfterTemplates.ts`** - Utility untuk scheduling reminder
4. **`/pages/admin/reminders.tsx`** - Halaman admin untuk manual reminder check
5. **`/components/EntitasForm.tsx`** - Menambah field email peminjam
6. **`/types/form.ts`** - Menambah borrowerEmail ke interface
7. **`/pages/index.tsx`** - Validasi email di form utama
### Interface Updates:
- Menambah `borrowerEmail?: string` ke semua LoanData interfaces
- Menambah `reminderNotifications` untuk tracking reminder yang sudah dikirim

## 🚀 Cara Penggunaan

### 1. Manual Check (via Admin Panel)
```
Kunjungi: http://localhost:3000/admin/reminders
Klik tombol "Run Reminder Check"
```

### 2. Manual Check (via Command Line)
```bash
npm run reminders
```

### 3. Scheduled/Automated (Cron Job)
```bash
# Jalankan setiap hari pukul 9 pagi
0 9 * * * cd /path/to/project && npm run reminders
```

### 4. Auto-start reminders with PM2 (Windows Server)
If you use PM2 to run your production app (as you do with `pm2 start ecosystem.config.js --env production`), the repository now includes a lightweight daemon that will start alongside the Next.js process and schedule daily reminder checks at 09:00 local server time.

How it works:
- `scripts/reminder-daemon.js` is a persistent Node script that:
  - runs one check immediately at startup, and
  - schedules subsequent runs at the configured hour (default **09:00** server local time) every day. You can change the hour by setting `REMINDER_RUN_HOUR` (0–23) in your production environment.
- `ecosystem.config.js` has been updated to start a second PM2 process named **`formflow-reminder`** that runs the daemon in production.

What you need to do on your Windows server:
1. Make sure you have committed the latest code and pulled it on the server.
2. Restart PM2 using your normal workflow (example):

```powershell
pm2 reload ecosystem.config.js --env production
```

3. Verify the reminder daemon is running:

```powershell
pm2 status
pm2 logs formflow-reminder --lines 200
```

4. Verify scheduled run happened (or trigger early):
- Check `logs/reminder-out.log` for output, or check the admin UI `/admin/reminders` or DB `loan.reminderStatus` entries for updates.
- You can also query the new monitoring endpoint to get the last run and recent history:

```bash
curl http://localhost:3000/api/reminders/status
```

The endpoint returns `{ lastRun, recentRuns }` with timestamps and counts.

Database migration note:
- The reminder run history is saved to a new `ReminderRun` table (Prisma model added). After pulling the latest changes on your production server, run the migration to create the table:

```powershell
# Create a migration locally (development)
npx prisma migrate dev --name add-reminderrun

# For production, deploy migrations
npx prisma migrate deploy
```

- After migration, the daemon and the `/api/reminders` endpoint will persist run history and you'll see entries when checking `/api/reminders/status`.

Security note:
- The daemon uses `REMINDER_API_URL` (or `INTERNAL_BASE_URL` fallback) to call the internal endpoint. To secure this endpoint the system supports a token-based protection mechanism:

  1. Set an authentication token (example: a 32-byte hex string) in your production environment variable `REMINDER_AUTH_TOKEN` (in `./.env.production` or your process manager env):

     REMINDER_AUTH_TOKEN=your-secret-token-here

     Example (generate a token on Windows with PowerShell):
     ```powershell
     # generates a 32-byte hex token
     $t = -join ((0..31) | ForEach-Object { Get-Random -Maximum 16 | ForEach-Object { $_.ToString("x") } }) ; echo $t
     ```

  2. The daemon (started by PM2) will automatically include this token in the `Authorization: Bearer <token>` header when calling `/api/reminders`.
  3. The `/pages/api/reminders` endpoint now **requires** the token when `REMINDER_AUTH_TOKEN` is configured — Admin UI triggers are still allowed for users with admin/superadmin role.

  4. After setting `REMINDER_AUTH_TOKEN` in your `.env.production`, restart PM2 so the new variable is applied:
     ```powershell
     pm2 reload ecosystem.config.js --env production
     ```

This ensures only the scheduled daemon (or authorized admin users) can trigger automated reminder runs.

## 📊 Monitoring & Tracking

### Reminder Status Tracking:
- Setiap reminder yang dikirim dicatat dengan timestamp
- Key format: `{loanId}_{reminderType}` (contoh: `12345_reminder_3_days`)
- Mencegah duplicate reminder untuk schedule yang sama

### Admin Dashboard:
- Menampilkan statistik reminder terakhir
- Jumlah reminder yang dikirim
- Total loan yang diperiksa
- Timestamp eksekusi terakhir

## 🔒 Keamanan & Validasi

### Email Validation:
- Required field di form peminjaman
- Format email validation (regex)
- Error message untuk format tidak valid

### Data Protection:
- Email borrower hanya digunakan untuk reminder
- Tidak disimpan di log eksternal
- Hanya accessible oleh sistem internal

## 🎨 UI/UX Features

### Form Enhancement:
- Field email dengan hint informatif
- Required validation dengan pesan error
- Responsive design untuk mobile

### Admin Interface:
- Clean dashboard dengan statistik real-time
- Loading states dan error handling
- Command examples untuk setup cron job

## 📈 Future Enhancements

### Potential Improvements:
1. **Customizable Reminder Schedule** - Admin dapat mengatur interval reminder
2. **Email Templates** - Template email yang dapat dikustomisasi
3. **Reminder History** - Log lengkap semua reminder yang dikirim
4. **Bulk Operations** - Kirim reminder untuk multiple loans sekaligus
5. **Integration dengan Calendar** - Sync dengan Google Calendar/Outlook

### Monitoring & Analytics:
1. **Success Rate Tracking** - Persentase email yang berhasil dikirim
2. **Open Rate Tracking** - Tracking email yang dibuka peminjam
3. **Return Rate Correlation** - Analisis efektivitas reminder terhadap return rate

## 🛠️ Setup & Deployment

### Environment Setup:
```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build
npm start
```

### Cron Job Setup (Linux/Mac):
```bash
# Edit crontab
crontab -e

# Add this line (adjust path sesuai server)
0 9 * * * cd /var/www/form-notification && npm run reminders
```

### Cron Job Setup (Windows):
```batch
# Using Task Scheduler
# Create new task:
# - Trigger: Daily at 9:00 AM
# - Action: Start a program
# - Program: cmd.exe
# - Arguments: /c "cd /d D:\Project\Form Notification\form && npm run reminders"
```

## 📞 Support & Troubleshooting

### Common Issues:
1. **Email tidak terkirim**: Check console logs untuk error SMTP
2. **Reminder duplicate**: Pastikan reminder tracking berfungsi dengan baik
3. **Date calculation error**: Verify timezone settings

### Debug Commands:
```bash
# Test reminder API
curl -X POST http://localhost:3000/api/reminders

# Check loan data
curl http://localhost:3000/api/loans

# Manual reminder run
npm run reminders
```