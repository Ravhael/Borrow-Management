# Google Sheets Integration Setup

Panduan untuk mengintegrasikan form submission dengan Google Sheets menggunakan Google Apps Script.

## Langkah-langkah Setup

### 1. Buat Google Spreadsheet
1. Buka [Google Sheets](https://sheets.google.com)
2. Buat spreadsheet baru
3. Salin Spreadsheet ID dari URL (bagian antara `/d/` dan `/edit`)

### 2. Buat Header Manual di Google Sheets
1. Di Google Sheets Anda, buat header di **baris 3** (kolom A sampai W) sesuai dengan mapping berikut:

| Kolom | Header |
|-------|--------|
| A | Timestamp |
| B | Nama Peminjam |
| C | Entitas Peminjam |
| D | No Telepon Peminjam |
| E | Kebutuhan Peminjaman |
| F | Nama Customer (from needDetails when needType = DEMO_PRODUCT) |
| G | Nama Perusahaan / Institusi (from needDetails when needType = DEMO_PRODUCT) |
| H | Alamat (from needDetails when needType = DEMO_PRODUCT) |
| I | No Telepon Customer (from needDetails when needType = DEMO_PRODUCT) |
| J | Nama Customer (from needDetails when needType = BARANG_BACKUP) |
| K | Nama Perusahaan / Institusi (from needDetails when needType = BARANG_BACKUP) |
| L | Alamat (from needDetails when needType = BARANG_BACKUP) |
| M | No Telepon Customer (from needDetails when needType = BARANG_BACKUP) |
| N | Alasan Kebutuhan Barang Backup? (from needDetails.alasan when needType = BARANG_BACKUP) |
| O | Tuliskan Kebutuhan Peminjaman |
| P | Company |
| Q | Tanggal barang keluar dari gudang |
| R | Tanggal barang dipakai |
| S | Tanggal barang dikembalikan |
| T | Rincian Product |
| U | Metode Pengambilan Barang |
| V | Catatan |
| W | Dengan mengirimkan Form Request ini, saya sudah membaca, mengerti dan menyetujui persyaratan serta prosedur tentang Peminjaman Barang nomor MKT-001 tanggal 01 Jan 2025 yg ada di link berikut: bit.ly/sop_peminjaman_barang |

**PENTING**: Header HARUS dibuat manual di baris 3. Script tidak akan membuat header otomatis.

### 3. Deploy sebagai Web App
1. Klik "Deploy" > "New deployment"
2. Pilih type "Web app"
3. Set "Execute as" ke "Me"
4. Set "Who has access" ke "Anyone"
5. Klik "Deploy"
6. Copy deployment URL

### 4. Konfigurasi di Aplikasi
1. Login sebagai Administrator
2. Akses menu "Appscript" (appscript-config) di sidebar
3. Isi form:
   - **Spreadsheet ID**: ID dari langkah 1
   - **Apps Script URL**: URL deployment dari langkah 3
   - **Sheet Name**: Nama sheet di Google Spreadsheet (default: "Loan Submissions")
4. Klik "Save Settings"

### 5. Test Integration
1. Submit form di `/form`
2. Cek Google Spreadsheet - data harus muncul otomatis

## Struktur Data di Spreadsheet

Data form akan disimpan ke Google Sheets **mulai dari baris 3** dengan mapping kolom berikut:

| Kolom | Header | Data Form | Status |
|-------|--------|-----------|--------|
| A | Timestamp | Waktu pengiriman form | ✅ Tersedia |
| B | Nama Peminjam | Nama peminjam | ⚠️ Belum ada di form |
| C | Entitas Peminjam | ID entitas yang dipilih | ✅ Tersedia |
| D | No Telepon Peminjam | Nomor telepon peminjam | ✅ Tersedia |
| E | Kebutuhan Peminjaman | Tipe kebutuhan | ✅ Tersedia |
| F | Nama Customer | - | ❌ Belum ada |
| G | Nama Perusahaan / Institusi | - | ❌ Belum ada |
| H | Alamat (from needDetails for DEMO_PRODUCT) | - | ❌ Belum ada |
| I | No Telepon Customer | - | ❌ Belum ada |
| J | Nama Customer (from needDetails for BARANG_BACKUP) | - | ❌ Belum ada |
| K | Nama Perusahaan / Institusi (from needDetails for BARANG_BACKUP) | - | ❌ Belum ada |
| L | Alamat (from needDetails for BARANG_BACKUP) | - | ❌ Belum ada |
| M | No Telepon Customer (from needDetails for BARANG_BACKUP) | - | ❌ Belum ada |
| N | Alasan Kebutuhan Barang Backup? (from needDetails.alasan) | - | ❌ Belum ada |
| O | Tuliskan Kebutuhan Peminjaman | Detail produk | ✅ Tersedia |
| P | Company | Perusahaan terkait | ✅ Tersedia |
| Q | Tanggal barang keluar dari gudang | Tanggal keluar | ✅ Tersedia |
| R | Tanggal barang dipakai | Tanggal penggunaan | ✅ Tersedia |
| S | Tanggal barang dikembalikan | Tanggal kembali | ✅ Tersedia |
| T | Rincian Product | Detail produk | ✅ Tersedia |
| U | Metode Pengambilan Barang | Metode pengambilan | ✅ Tersedia |
| V | Catatan | Catatan tambahan | ✅ Tersedia |
| W | Persetujuan SOP | Flag persetujuan | ✅ Tersedia |

**Catatan**:
- Header HARUS dibuat manual di baris 3 sebelum menggunakan sistem ini
- Data akan ditambahkan otomatis mulai dari baris 4
- Script TIDAK akan membuat header otomatis

## Troubleshooting

### Data tidak muncul di Spreadsheet
1. Pastikan Spreadsheet ID benar
2. Pastikan Apps Script URL benar dan deployed
3. Cek Apps Script logs untuk error
4. Pastikan sheet memiliki permission untuk diakses

### Error di Apps Script
1. Buka Apps Script editor
2. Cek "Executions" untuk melihat error logs
3. Pastikan kode tidak ada syntax error

### Error di aplikasi
1. Cek browser console untuk error
2. Cek server logs untuk error Google Sheets submission
3. Pastikan pengaturan tersimpan dengan benar

## Keamanan

- Apps Script di-deploy sebagai "Anyone" untuk memungkinkan akses dari aplikasi
- Pertimbangkan untuk menambahkan authentication jika diperlukan
- Data sensitif tidak boleh disimpan di spreadsheet publik

## Future Enhancements

- Service Account authentication untuk keamanan lebih baik
- Batch submission untuk multiple entries
- Error handling dan retry mechanism
- Real-time sync status