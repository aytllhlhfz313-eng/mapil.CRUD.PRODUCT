export function getApiErrorMessage(error) {
  if (error.code === 'ER_BAD_FIELD_ERROR' || error.code === 'ER_NO_SUCH_TABLE') {
    return 'Skema database belum sesuai. Jalankan migrate_categories.sql pada database defaultdb, lalu muat ulang aplikasi.';
  }

  return error.message;
}
