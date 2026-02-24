export const generatePasswordResetEmail = (userName: string, resetLink: string, temporaryPassword?: string): string => {
  return `
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 20px; text-align: center; border-radius: 8px;">
          <h2>Reset Password!</h2>
          <p>Permintaan reset password untuk akun Anda</p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="color: #007bff; margin-top: 0;">Halo ${userName},</h3>
          <p>Anda telah meminta untuk mereset password akun Anda di sistem Peminjaman Barang.</p>
          <p>Klik tombol di bawah ini untuk membuat password baru:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">Reset Password</a>
          </div>

          <p style="color: #6c757d; font-size: 14px;">Link ini akan kadaluarsa dalam 24 jam. Jika Anda tidak meminta reset password, abaikan email ini.</p>
        </div>

        <div style="text-align: center; margin: 30px 0; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 14px;">Email ini dikirim secara otomatis oleh Sistem Notifikasi Peminjaman Barang.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateAccountCreationEmail = (userName: string, email: string, username: string): string => {
  return `
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ffc107 0%, #ff8f00 100%); color: white; padding: 20px; text-align: center; border-radius: 8px;">
          <h2>Pendaftaran Akun Menunggu Persetujuan!</h2>
          <p>Akun Anda telah dibuat dan menunggu persetujuan Admin Account</p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="color: #ffc107; margin-top: 0;">Halo ${userName},</h3>
          <p>Terima kasih telah mendaftar di sistem Peminjaman Barang.</p>
          <p>Akun Anda telah berhasil dibuat dengan detail berikut:</p>

          <div style="background: #fff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <strong>Detail Akun:</strong><br>
            Email: ${email}<br>
            Username: ${username}<br>
            <em>Gunakan password yang Anda masukkan saat pendaftaran</em><br>
            <span style="color: #ffc107; font-weight: bold;">Status: Menunggu Persetujuan</span>
          </div>

          <p>Jika Anda memiliki pertanyaan tentang proses persetujuan, silakan hubungi Admin Account.</p>
        </div>

        <div style="text-align: center; margin: 30px 0; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 14px;">Email ini dikirim secara otomatis oleh Sistem Notifikasi Peminjaman Barang.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateAccountApprovalEmail = (userName: string, email: string, username: string): string => {
  return `
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%); color: white; padding: 20px; text-align: center; border-radius: 8px;">
          <h2>🎉 Akun Anda Telah Disetujui!!</h2>
          <p>Selamat datang di sistem Sistem Notifikasi Peminjaman Barang</p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="color: #28a745; margin-top: 0;">Halo ${userName},</h3>
          <p>Selamat! Akun Anda telah <strong>disetujui</strong> oleh Admin Account dan sekarang aktif.</p>

          <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong style="color: #155724;">✅ Status Akun: AKTIF</strong><br>
            <span style="color: #155724;">Email: ${email}</span><br>
            <span style="color: #155724;">Username: ${username}</span>
          </div>

          <p>Anda sekarang dapat login ke sistem Sistem Notifikasi Peminjaman Barang menggunakan:</p>
          <ul style="color: #155724;">
            <li>Email atau username yang Anda daftarkan</li>
            <li>Gunakan password yang Anda masukkan saat pendaftaran</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 14px;">Email ini dikirim secara otomatis oleh Sistem Notifikasi Peminjaman Barang.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
