# Keputusan — Loading, Feedback & Skala Data

Dokumen ini menampung keputusan produk yang belum diset. Item yang belum diputuskan
**tidak diimplementasikan** dan ditandai `butuh keputusan` di
`docs/audits/2026-10-23-loading-feedback-and-scale-audit.md`.

Format: konteks → opsi → rekomendasi → alasan.

---

## D1 · Strategi font ikon

**Status:** ✅ diputuskan sementara — subset `icon_names` sudah diimplementasikan.

**Konteks:** Google Material Symbols penuh berukuran **4 MB** dan dimuat di setiap halaman.
Subset `icon_names` + axes tetap berukuran **±24 KB** untuk 107 ikon.

**Opsi:**

1. Subset `icon_names` (sekarang).
2. Registry SVG inline (hilangkan font dan request pihak ketiga).

**Rekomendasi:** pertahankan opsi 1 untuk sekarang; migrasikan ke opsi 2 saat ada waktu
untuk memetakan semua ikon ke komponen SVG.

**Alasan:** opsi 1 adalah perbaikan 4 MB → 24 KB tanpa mengubah markup, tetapi masih
bergantung pada Google Fonts dan punya FOUT kecil. Opsi 2 menghilangkan 24 KB, FOUT, dan
dependency, tetapi menyentuh puluhan titik pemakaian.

---

## D2 · Arsip aktivitas profile

**Status:** ⏳ **butuh keputusan** — belum diimplementasikan.

**Konteks:** tab Dispatches, Saved, Circles, dan Security di `/profile` masih memakai fixture
(`src/features/profile/data.ts`). Tab Security menampilkan riwayat "unveiled/revoked" palsu,
dan angka tab (14/6/48) bertentangan dengan metrics asli di header.

**Opsi:**

1. Sembunyikan tab yang belum punya data; sisakan ringkasan asli (koneksi + post).
2. Wire ke data asli sekarang: dispatch = posts, circles = accepted connections, saved =
   tabel baru, security = audit log baru.
3. Ganti dengan empty state "Belum ada aktivitas" untuk semua tab.

**Rekomendasi:** opsi 1 untuk rilis yang bisa dites; opsi 2 sebagai follow-up produk.

**Alasan:** opsi 1 menghilangkan data palsu tanpa menambah tabel/CRUD baru. Opsi 2 benar
tetapi butuh model data dan keputusan produk (saved items dan audit log belum ada di PRD
yang diimplementasikan).

---

## D3 · Cara menampilkan kegagalan query baca

**Status:** ✅ diputuskan sementara — query melempar `QueryError` dan `error.tsx` menangkap.

**Opsi:**

1. Throw → route error boundary dengan tombol retry (sekarang).
2. Inline error per halaman/panel, empty state tetap untuk data kosong.

**Rekomendasi:** opsi 1 sebagai default; tambahkan opsi 2 hanya untuk panel yang punya
kegagalan parsial (mis. badge navbar).

**Alasan:** opsi 1 mencegah "tidak ada data" palsu dan memberi retry. Opsi 2 lebih ramah
tetapi memerlukan state error di setiap view.

---

## D4 · UX pagination server

**Status:** ⏳ **butuh keputusan** — pagination server belum diimplementasikan.

**Konteks:** semua listing masih mengambil seluruh tabel. Agar filter/search tetap benar,
pagination harus pindah ke server bersama filter/sort.

**Opsi:**

1. Pagination URL `?page=` (shareable, back button, cocok untuk listing).
2. Tombol "Muat lebih banyak" / infinite scroll (cocok untuk feed).
3. Hybrid: URL untuk Discover/Marketplace/Connections, load-more untuk Posts.

**Rekomendasi:** opsi 3.

**Alasan:** listing butuh posisi yang bisa dibagikan dan di-back; feed lebih natural dengan
load-more. Hybrid menambah dua pola, jadi tim harus siap dengan biaya perawatan.

---

## D5 · Loading admin per tab

**Status:** ⏳ **butuh keputusan** — belum diimplementasikan.

**Konteks:** `getAdminData()` memuat profil, laporan, produk, dan gambar sekaligus, padahal
tab default hanya users.

**Opsi:**

1. Route terpisah `/admin/users`, `/admin/marketplace`, `/admin/moderation` dengan layout
   bersama.
2. Satu route `/admin?tab=users` dengan query per tab.
3. Lazy fetch per tab lewat Server Action.

**Rekomendasi:** opsi 1.

**Alasan:** route terpisah memberi loading boundary, back button, dan URL yang jelas; opsi 2
lebih kecil perubahannya tetapi tetap memuat satu tab per navigasi; opsi 3 menambah
kompleksitas client state.

---

## D6 · Jalur upload gambar

**Status:** ✅ diputuskan sementara — `bodySizeLimit` dinaikkan ke 12 MB + validasi client.

**Opsi:**

1. Server Action dengan limit 12 MB (sekarang).
2. Upload langsung dari browser ke Supabase Storage via `createSignedUploadUrl`.

**Rekomendasi:** opsi 2 untuk produksi.

**Alasan:** opsi 1 cepat dan aman, tetapi file besar tetap melewati server dan tidak punya
progress granular. Opsi 2 menghindari limit body, memberi progress, dan lebih cepat di
mobile; butuh client Supabase dan policy storage yang sudah ada.

---

## D7 · Aset landing

**Status:** ⏳ **butuh keputusan** — belum diimplementasikan.

**Konteks:** 11 gambar landing berasal dari `lh3.googleusercontent.com` (±622 KB). Semua
200 OK, tetapi bergantung pada CDN pihak ketiga dan tanpa fallback.

**Opsi:**

1. Biarkan URL eksternal untuk sementara.
2. Unduh ke `public/` dan sajikan sebagai aset lokal (AVIF/WebP).
3. Pindahkan ke Supabase Storage + signed URL seperti media user.

**Rekomendasi:** opsi 2.

**Alasan:** landing adalah halaman publik dengan LCP paling terlihat; aset lokal
menghilangkan dependency, request pihak ketiga, dan risiko CDN berubah. Opsi 3 menambah
kompleksitas signing untuk aset statis yang tidak perlu RLS.

---

## D8 · Gaya feedback aksi

**Status:** ✅ diputuskan sementara — inline alert + pending per tombol.

**Opsi:**

1. Inline alert per panel + `aria-busy` (sekarang).
2. Toast global.
3. Keduanya (inline untuk form, toast untuk aksi baris).

**Rekomendasi:** opsi 3 jangka panjang; opsi 1 cukup untuk rilis ini.

**Alasan:** inline tidak menambah dependency dan dekat dengan konteks aksi; toast lebih baik
untuk aksi baris yang komponennya langsung hilang setelah sukses (mis. delete), tetapi
menambah provider dan urutan pengumuman screen reader.

---

## D9 · Konfirmasi aksi destruktif

**Status:** ✅ diimplementasikan.

**Keputusan:** semua aksi destruktif (hapus post, hapus produk, disconnect, reject/suspend,
hapus post dari moderasi) memakai `ConfirmDialog` dengan pending state.

**Alasan:** mencegah salah klik dan memberi kesempatan membaca konsekuensi.

---

## D10 · Auth shell minimal

**Status:** ✅ diimplementasikan.

**Keputusan:** route group `(auth)` (sibling `(public)`) dengan `SiteHeader mode="content"`
(logo + locale) dan `SiteFooter variant="auth"`.

**Alasan:** halaman login/register tidak perlu menampilkan tautan Sign in/Register
atau ikon profil. URL tidak berubah; revert cukup memindahkan folder kembali ke
`(public)` dan menghapus prop `variant`.

## D11 · Legal links dan Privacy Policy

**Status:** ✅ diimplementasikan.

**Keputusan:** link Terms + Privacy di footer landing, login, register, dan terms;
link consent inline di register tetap dipertahankan; `/[locale]/privacy`,
`/[locale]/support`, `/[locale]/safety`, dan `/[locale]/standards` dibuat sebagai
halaman placeholder sampai copy final tersedia.

**Alasan:** consent harus dekat checkbox, sedangkan footer adalah navigasi global.
Duplikasi di register disengaja dan dibuat ringkas.

## D12 · Remember me

**Status:** ✅ diimplementasikan.

**Keputusan:** default unchecked; checked = cookie auth 30 hari, unchecked = session
cookie; preferensi disimpan di cookie `gl-remember` agar proxy tidak mengubahnya
menjadi persisten saat refresh.

**Alasan:** sesuai copy “Remember this device for 30 days” dan tidak mengubah
sesi yang sudah ada tanpa preferensi.

---

## D13 · Satu header dan satu footer

**Status:** ✅ diimplementasikan.

**Keputusan:** `SiteHeader` dengan mode `landing`/`content`; `SiteFooter` dengan variant
`marketing`/`public`/`auth`/`app`. Locale switch memakai gaya switch yang sama di semua
halaman; burger hanya di landing.

**Alasan:** sebelumnya ada dua header dan tiga footer dengan layout berbeda. Shell yang
sama membuat halaman auth/legal tidak terasa seperti aplikasi terpisah. Isi kolom footer
tetap bisa berbeda per variant.

## D14 · Recovery support links dan guard

**Status:** ✅ diimplementasikan.

**Keputusan:** “Member Support Desk”, “Safety & Trust Guide”, dan “Standards” menjadi link
ke halaman placeholder; chip SSL dan baris “Bilingual Human Support” dihapus.
`/forgot-password/sent` dilindungi cookie `gl-reset-requested` selama 30 menit; akses
langsung tanpa cookie kembali ke `/forgot-password`.

**Alasan:** placeholder mempertahankan UI/UX tanpa tombol mati; guard mencegah halaman
konfirmasi palsu saat direct URL/refresh setelah state hilang, sementara anti-enumeration
tetap terjaga.

---

## D15 · Stale session handling

**Status:** ✅ diimplementasikan.

**Keputusan:** error `user_not_found`, `session_expired`, `bad_jwt`, dan sejenisnya
diperlakukan sebagai “belum login”, bukan outage. Proxy juga menghapus cookie auth
`sb-*-auth-token*` saat error tersebut muncul; cookie reset dibersihkan saat
sign-in/sign-out.

**Alasan:** cookie lama yang menunjuk user yang sudah dihapus tidak boleh memicu
error boundary di `/login`, tetapi juga tidak boleh dibiarkan memicu 403 berulang.
