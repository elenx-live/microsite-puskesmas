/**
 * Pengganti `auditService` web utama untuk aplikasi microsite mandiri.
 *
 * Jalur publik microsite tidak menulis log audit (pemanggilan `recordLog`
 * hanya ada di method admin: duplikat/impor/hapus). Di aplikasi tanpa admin
 * ini, log audit menjadi no-op agar modul service yang disalin tetap utuh.
 */
export const auditService = {
  async recordLog(_entry: Record<string, unknown>): Promise<void> {
    // No-op: aplikasi publik microsite tidak memiliki modul audit.
  }
};
