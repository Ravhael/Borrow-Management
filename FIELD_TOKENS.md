# Daftar Field (Token) — Lengkap

Dokumen ini merangkum semua field yang ada pada form beserta token yang bisa Anda gunakan untuk keperluan trigger custom notification.

Format token: gunakan double curly braces, contohnya `{{borrowerName}}`.
Jika sistem target tidak mendukung titik pada nama token, ganti titik dengan underscore (mis. `demo_namaCustomer`).

## Field utama

- **borrowerName**
  - Label: Nama Peminjam
  - Token: `{{borrowerName}}`
  - Tipe: string
  - Required: ya
  - Contoh: `"Budi Santoso"`

- **entitasId**
  - Label: Entitas Peminjam
  - Token: `{{entitasId}}`
  - Tipe: string
  - Required: ya
  - Opsi: `SGM, PKU, SGP, IDC, BDG, SMG, SGJ, SBY, BALI, ENT, DEC, HAVS, SKP, VIS, OSS, ISS, HRD, IVP, MLDS, UMP, Marcomm, Micro PDN`
  - Contoh: `"SGM"`

- **borrowerPhone**
  - Label: No Telepon Peminjam
  - Token: `{{borrowerPhone}}`
  - Tipe: string
  - Required: ya
  - Contoh: `"+628123456789"`

- **needType**
  - Label: Jenis Kebutuhan
  - Token: `{{needType}}`
  - Tipe: string
  - Required: ya
  - Opsi: `DEMO_PRODUCT, BARANG_BACKUP, ANALISA_TESTING, DEMO_SHOWROOM, PAMERAN_EVENT, PERPANJANGAN, LAINNYA`

- **company** (multi-select)
  - Label: Company
  - Token: `{{company}}` (JSON array), `{{company_csv}}` (comma-separated), `{{company_count}}` (jumlah)
  - Tipe: string[]
  - Required: ya (minimal 1 dipilih)
  - Contoh: `["IVP Richard","MLDS Rafi"]` -> `{{company_csv}}` = `"IVP Richard, MLDS Rafi"`

- **outDate**
  - Label: Tanggal barang keluar dari gudang
  - Token: `{{outDate}}`, `{{outDate_ts}}` (unix ms)
  - Tipe: string (ISO yyyy-mm-dd)
  - Required: ya

- **useDate**
  - Label: Tanggal barang dipakai
  - Token: `{{useDate}}`, `{{useDate_ts}}`
  - Tipe: string (ISO)
  - Required: ya

- **returnDate**
  - Label: Tanggal barang dikembalikan
  - Token: `{{returnDate}}`, `{{returnDate_ts}}`
  - Tipe: string (ISO)
  - Required: ya

- **productDetailsText**
  - Label: Rincian Product
  - Token: `{{productDetailsText}}`
  - Tipe: string
  - Required: ya

- **pickupMethod**
  - Label: Metode Pengambilan Barang
  - Token: `{{pickupMethod}}`
  - Tipe: string
  - Required: ya
  - Opsi: `SELF_PICKUP, WAREHOUSE_DELIVERY, THIRD_PARTY`

- **note**
  - Label: Catatan
  - Token: `{{note}}`
  - Tipe: string
  - Required: tidak

- **approvalAgreementFlag**
  - Label: Persetujuan Approval
  - Token: `{{approvalAgreementFlag}}`
  - Tipe: boolean ("true"/"false")
  - Required: ya

- **lainnya**
  - Label: Kebutuhan Lainnya
  - Token: `{{lainnya}}`
  - Tipe: string
  - Required: hanya jika `needType === 'LAINNYA'`

## Field nested (demo & backup)
Gunakan token dengan nama termasuk titik, mis. `{{needDetails.namaCustomer}}` untuk jenis kebutuhan yang memakai field spesifik. Jika sistem Anda tidak mendukung titik, gunakan underscore.

- **needDetails.namaCustomer** — `{{needDetails.namaCustomer}}`
- **needDetails.namaPerusahaan** — `{{needDetails.namaPerusahaan}}`
- **needDetails.alamat** — `{{needDetails.alamat}}`
- **needDetails.telepon** — `{{needDetails.telepon}}`

- **backup.namaCustomer** — `{{backup.namaCustomer}}`
- **backup.namaPerusahaan** — `{{backup.namaPerusahaan}}`
- **backup.alamat** — `{{backup.alamat}}`
- **backup.telepon** — `{{backup.telepon}}`
- **backup.alasan** — `{{backup.alasan}}`

## Token komputasi tambahan (disediakan helper)
- `{{company_csv}}` — daftar company sebagai string dipisah koma
- `{{company_count}}` — jumlah company yang dipilih
- `{{loan_days}}` — selisih hari antara `useDate` dan `returnDate`
- `{{is_long_loan}}` — boolean string ('true'/'false') jika `loan_days > 7`
- `{{useDate_ts}}`, `{{outDate_ts}}`, `{{returnDate_ts}}` — timestamp (ms)
- `{{is_weekend_use}}` — 'true' jika `useDate` jatuh di Sabtu/Minggu

## Contoh aturan (rule) sederhana
- Kirim notifikasi jika `entitasId === 'SGP'` dan `company_csv` mengandung `IVP Richard`.
- Kirim notifikasi reminder jika `loan_days >= 7`.

## Cara menggunakan helper `utils/tokenizeForm.ts`
1. Import helper:
```ts
import { tokenizeForm } from './utils/tokenizeForm'
```
2. Panggil untuk mendapatkan map token => string:
```ts
const tokens = tokenizeForm(formData)
// tokens['borrowerName'] => 'Budi Santoso'
// tokens['company_csv'] => 'IVP Richard, MLDS Rafi'
```
3. Gunakan `tokens` untuk evaluasi rule dan render template.

---

Jika Anda ingin, saya bisa juga membuat contoh `rules.json` dan evaluator kecil untuk memeriksa kondisi lebih kompleks (AND/OR/contains/date comparisons).

# Dedicated Email Templates
Di dalam folder `utils/email-templates/`, terdapat berbagai file template email yang digunakan untuk berbagai keperluan notifikasi. Berikut adalah daftar lengkap template beserta fungsi ekspor yang tersedia:

- authTemplates.ts (Done)
-- export const generatePasswordResetEmail (Link Reset Password)
-- export const generateAccountCreationEmail
-- export const generateAccountApprovalEmail

- onSubmitTemplates.ts (Done)
-- export const generateonSubmitBorrowerEmail
-- export const generateonSubmitEntitasEmail
-- export const generateonSubmitCompanyEmail
-- export const generateonSubmitMarketingEmail (Link Approval)

- approvedTemplates.ts (Done)
-- export const generateApprovedBorrowerEmail
-- export const generateApprovedCompanyEmail
-- export const generateApprovedEntitasEmail
-- export const generateApprovedWarehouseEmail (Link Approval)

- extendRequestTemplates.ts (Done)
-- export const generateExtendSubBorrowerEmail
-- export const generateExtendSubCompanyEmail
-- export const generateExtendSubEntitasEmail
-- export const generateExtendSubMarketingEmail (Link Approval)

- extendApprovedTemplates.ts (Done)
-- export const generateExtendAppBorrowerEmail
-- export const generateExtendAppCompanyEmail
-- export const generateExtendAppEntitasEmail

- returnedRequestTemplates.ts (Done)
-- export const generateReturnedSubpBorrowerEmail
-- export const generateReturnedSubCompanyEmail
-- export const generateReturnedSubEntitasEmail
-- export const generateReturnedSubWarehouseEmail (Link Approval)

- returnedApprovedTemplates.ts (Done)
-- export const generateReturnedAppBorrowerEmail
-- export const generateReturnedAppCompanyEmail
-- export const generateReturnedAppEntitasEmail

- statusCompletedTemplates.ts (Done)
-- export const generateCompletedBorrowerEmail
-- export const generateCompletedCompanyEmail
-- export const generateCompletedEntitasEmail

- reminderBeforeTemplates.ts (Done)
-- export const generateReminderBeforeBorrowerEmail
-- export const generateReminderBeforeCompanyEmail
-- export const generateReminderBeforeEntitasEmail

- reminderAfterTemplates.ts (Done)
-- export const generateReminderAfterBorrowerEmail
-- export const generateReminderAfterCompanyEmail
-- export const generateReminderAfterEntitasEmail


# Urutan Tab

- Raw Email Account
- Raw Email On Submit
- Raw Email Approved
- Raw Email Extend Submit
- Raw Email Extend Approved
- Raw Email Returned Request
- Raw Email Returned Approved
- Raw Email Completed
- Raw Email Reminder Before
- Raw Email Reminder After

# shared body email

<div style="font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; padding: 20px; background:#f4f6f8;">
      ${isUpdate ? `<div style="background:#fff8e1;padding:10px;border-radius:6px;border:1px solid #ffe08a;margin-bottom:12px;color:#6a4a00;font-weight:600;">UPDATE: This is an update version of the notification</div>` : ''}

      <div style="max-width:900px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 8px 20px rgba(20,20,40,0.06);overflow:hidden;border:1.5px solid rgba(0,0,0,0.12);">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1976d2 0%,#0d47a1 100%);color:#fff;padding:14px 0;border-collapse:collapse">
          <tr>
            <td align="center">
              <table role="presentation" width="900" cellpadding="0" cellspacing="0" style="width:100%;max-width:900px;margin:0 auto;border-collapse:collapse;">
                <tr>
                  <td style="padding:12px 16px;vertical-align:middle;width:64px;text-align:left;">
                    <div style="display:inline-block;width:46px;height:46px;border-radius:6px;background:rgba(255,255,255,0.12);color:white;font-weight:700;line-height:46px;text-align:center;font-family:Inter, Arial, sans-serif;">BRW</div>
                  </td>
                  <td style="padding:12px 16px;vertical-align:middle;text-align:left;">
                    <div style="font-family:Inter, Arial, sans-serif;font-size:18px;font-weight:700;">Permintaan Peminjaman</div>
                    <div style="font-size:13px;opacity:0.92;margin-top:6px;color:rgba(255,255,255,0.92);">Tanggal Pengajuan : ${submittedAt}</div>
                  </td>
                  <td style="padding:12px 16px;vertical-align:middle;text-align:right;width:180px;">
                    <div style="background:rgba(255,255,255,0.12);color:#fff;padding:6px 10px;border-radius:6px;display:inline-block;font-weight:700;font-size:13px;font-family:Inter, Arial, sans-serif;">Form #${loan.id || loan.form_number || '-'}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <div style="padding:20px 28px;">
        
          
          <section style="margin-bottom:18px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:10px;">
              <tr>
                <td style="width:46px;vertical-align:middle;padding-right:12px;">
                  <div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#e3f2ff,#cfe9ff);display:inline-block;text-align:center;color:#0d47a1;font-weight:800;font-size:14px;line-height:36px;">#</div>
                </td>
                <td style="vertical-align:middle;padding:0;">
                  <div style="font-weight:800;color:#0d2338;font-size:15px;">Informasi Peminjam</div>
                  <div style="font-size:12px;color:rgba(0, 0, 0, 0.89);display:block;padding-top:6px;line-height:1.25;">Detail informasi peminjam yang akan menerima barang</div>
                </td>
              </tr>
            </table>
            <div style="height:1.5px;background:linear-gradient(90deg, rgba(16,40,67,0.14), rgba(16,40,67,0.06));margin:10px 0 14px;border-radius:2px;"></div>
            <table style="width:100%;border-collapse:collapse;color:#16324b;font-size:13px;border-spacing:0;">
              <tbody>
                <tr style="vertical-align:top;border-bottom:1.4px solid rgba(0,0,0,0.12);">
                  <td style="width:260px;padding:8px 0;font-weight:700;color:#253053;">Nama Peminjam :</td>
                  <td style="padding:8px 0;color:#24425f">${borrowerName}</td>
                </tr>
                <tr style="vertical-align:top;border-bottom:1.4px solid rgba(0,0,0,0.12);">
                  <td style="padding:8px 0;font-weight:700;color:#253053;">Entitas Peminjam :</td>
                  <td style="padding:8px 0;color:#24425f">${entitasName}</td>
                </tr>
                <tr style="vertical-align:top;border-bottom:1.4px solid rgba(0,0,0,0.12);">
                  <td style="padding:8px 0;font-weight:700;color:#253053;">No Telepon Peminjam :</td>
                  <td style="padding:8px 0;color:#24425f">${borrowerPhone}</td>
                </tr>
                <tr style="vertical-align:top;border-bottom:1.2px solid rgba(0,0,0,0.08);">
                  <td style="padding:8px 0;font-weight:700;color:#253053;">Jenis Kebutuhan :</td>
                  <td style="padding:8px 0;color:#24425f">${needType}</td>
                </tr>
              </tbody>
            </table>
          </section>

  ${showNeedDetailsSection ? `
          <section style="margin-bottom:18px;">
            <div style="margin-bottom:10px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="width:46px;vertical-align:middle;padding-right:12px;">
                    <div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#fff2e6,#ffe7d1);display:inline-block;text-align:center;color:#b45309;font-weight:800;font-size:14px;line-height:36px;">#</div>
                  </td>
                  <td style="vertical-align:middle;padding:0;">
                    <div style="font-weight:800;color:#0d2338;font-size:15px;">Informasi Kebutuhan Peminjaman &quot;${needType}&quot;</div>
                    <div style="font-size:12px;color:rgba(0, 0, 0, 0.77);display:block;padding-top:6px;line-height:1.25;">Data spesifik kebutuhan peminjaman dan alamat/instansi terkait</div>
                  </td>
                </tr>
              </table>
            </div>
            <div style="height:1.5px;background:linear-gradient(90deg, rgba(16,40,67,0.14), rgba(16,40,67,0.06));margin:10px 0 14px;border-radius:2px;"></div>
            <table style="width:100%;border-collapse:collapse;color:#16324b;font-size:13px;border-spacing:0;">
              <tbody>
                <tr style="vertical-align:top;border-bottom:1.4px solid rgba(0,0,0,0.12);">
                  <td style="width:260px;padding:8px 0;font-weight:700;color:#253053;">Nama Customer :</td>
                  <td style="padding:8px 0;color:#24425f">${customerName}</td>
                </tr>
                <tr style="vertical-align:top;border-bottom:1.4px solid rgba(0,0,0,0.12);">
                  <td style="padding:8px 0;font-weight:700;color:#253053;">Nama Perusahaan / Institusi :</td>
                  <td style="padding:8px 0;color:#24425f">${companyName}</td>
                </tr>
                <tr style="vertical-align:top;border-bottom:1.4px solid rgba(0,0,0,0.12);">
                  <td style="padding:8px 0;font-weight:700;color:#253053;">Alamat :</td>
                  <td style="padding:8px 0;color:#24425f;white-space:pre-wrap;">${address}</td>
                </tr>
                <tr style="vertical-align:top;border-bottom:1.2px solid rgba(0,0,0,0.08);">
                  <td style="padding:8px 0;font-weight:700;color:#253053;">No Telepon :</td>
                  <td style="padding:8px 0;color:#24425f">${phone}</td>
                </tr>
              </tbody>
            </table>
          </section>
          ` : ''}

          <section>
            <div style="margin-bottom:10px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="width:46px;vertical-align:middle;padding-right:12px;">
                    <div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#e8f5e9,#dff2e4);display:inline-block;text-align:center;color:#2e7d32;font-weight:800;font-size:14px;line-height:36px;">#</div>
                  </td>
                  <td style="vertical-align:middle;padding:0;">
                    <div style="font-weight:800;color:#0d2338;font-size:15px;">Informasi Detail Peminjaman</div>
                    <div style="font-size:12px;color:rgba(0,0,0,0.86);display:block;padding-top:6px;line-height:1.25;">Informasi detail produk, tanggal keluar, pemakaian, dan pengembalian</div>
                  </td>
                </tr>
              </table>
            </div>
            <div style="height:1.5px;background:linear-gradient(90deg, rgba(16,40,67,0.14), rgba(16,40,67,0.06));margin:10px 0 14px;border-radius:2px;"></div>
            <table style="width:100%;border-collapse:collapse;color:#16324b;font-size:13px;border-spacing:0;">
              <tbody>
                <tr style="vertical-align:top;border-bottom:1.4px solid rgba(0,0,0,0.12);">
                  <td style="width:260px;padding:8px 0;font-weight:700;color:#253053;">Marketing Company :</td>
                  <td style="padding:8px 0;color:#24425f">${marketingCompany}</td>
                </tr>
                <tr style="vertical-align:top;border-bottom:1.4px solid rgba(0,0,0,0.12);">
                  <td style="padding:8px 0;font-weight:700;color:#253053;">Tanggal barang keluar dari gudang :</td>
                  <td style="padding:8px 0;color:#24425f">${outDate}</td>
                </tr>
                <tr style="vertical-align:top;border-bottom:1.4px solid rgba(0,0,0,0.12);">
                  <td style="padding:8px 0;font-weight:700;color:#253053;">Tanggal barang dipakai :</td>
                  <td style="padding:8px 0;color:#24425f">${useDate}</td>
                </tr>
                <tr style="vertical-align:top;border-bottom:1.4px solid rgba(0,0,0,0.12);">
                  <td style="padding:8px 0;font-weight:700;color:#253053;">Tanggal barang dikembalikan :</td>
                  <td style="padding:8px 0;color:#24425f">${returnDate}</td>
                </tr>
                <tr style="vertical-align:top;border-bottom:1px solid rgba(16,40,67,0.06);">
                  <td style="padding:8px 0;font-weight:700;color:#253053;">Rincian Product :</td>
                  <td style="padding:8px 0;color:#24425f;white-space:pre-wrap;">${productDetails}</td>
                </tr>
                <tr style="vertical-align:top;border-bottom:1px solid rgba(16,40,67,0.06);">
                  <td style="padding:8px 0;font-weight:700;color:#253053;">Metode Pengambilan Barang :</td>
                  <td style="padding:8px 0;color:#24425f">${pickupMethod}</td>
                </tr>
                <tr style="vertical-align:top;">
                  <td style="padding:8px 0;font-weight:700;color:#253053;">Catatan :</td>
                  <td style="padding:8px 0;color:#24425f;white-space:pre-wrap;">${note}</td>
                </tr>
              </tbody>
            </table>
          </section>

        </div>
      </div>
    </div>

# prompt
oke sekarang file reminderAfterTemplates.ts, terapkan juga, panggil atau gunakan buildBorrowerEmailHtml dari shared.ts, headernya gunakan header yang digunakan sebelumnya untuk semua export. buatkan jenis export nya :

-- export const generateReminderAfterBorrowerEmail
-- export const generateReminderAfterCompanyEmail
-- export const generateReminderAfterEntitasEmail

preview nya render ke tab Raw Email Reminder After buat baru tab nya di email-preview.

# prompt
apa sudah di render di email-preview, di tab Raw Email Approved?

# prompt
oke sekarang render di email-preview di tab Raw Email Approved


# prompt
oke sekarang, tolong gunakan email template pada utils/email-templates/reminderAfterTemplates.ts. di kirimkan sebagai reminder setiap hari setelah tanggal pengembalian (returnDate) selama 30 hari berturut-turut.

gunakan export template berikut ini.

export const generateReminderAfterCompanyEmail untuk notifikasi email yang di kirimkan ke semua email mapping di "MktCompany"

export const generateReminderAfterEntitasEmail untuk notifikasi email yang di kirimkan ke semua email mapping di "Entitas"

export const generateReminderAfterBorrowerEmail untuk notifikasi email yang di kirimkan ke email si peminjam.

# prompt
oke, sekarang tolong rubah format tanggal yang seperti ini :

Tanggal barang keluar dari gudang : 13/12/2025
Tanggal barang dipakai : 13/12/2025
Tanggal barang dikembalikan : 15/12/2025

menjadi seperti ini :

Tanggal barang keluar dari gudang : 13/Des/2025
Tanggal barang dipakai : 13/Des/2025
Tanggal barang dikembalikan : 15/Des/2025

pada semua jenis export const