# GlobalLinkup — Audit Loading State, Feedback & Skala Data (2026-10-23)

**Commit diaudit:** `baefd24` (branch `dev`)
**Metode pass 1:** static review menyeluruh pada client component, Server Action, query
layer, layout/navigation, `next.config.ts`, dan migrasi Supabase. Tidak ada kode yang
diubah dan tidak ada mutasi database yang dijalankan.
**Metode pass 2 (2026-10-23):** static review area yang belum disentuh (landing/public,
legal, dialog/a11y, font/icon, i18n payload, fixture, read-path error handling, config
Supabase, constraint DB, test/CI) plus probe HTTP read-only untuk font, gambar, dan ukuran
payload. Tidak menjalankan app, test, atau mutasi DB.
**Cakupan:** loading state/indicator/gate untuk tombol dan navigasi, feedback error,
pencegahan double-click, skeleton, aksesibilitas loading, serta optimasi query backend
untuk pertumbuhan data.
**Di luar cakupan:** polish visual, fitur baru, perubahan model data/RLS (kecuali index dan
pola evaluasi policy), cutover cloud.

> Audit ini melanjutkan `docs/audits/2026-10-20-functionality-audit.md` — khususnya
> **P2-17 (N+1 signed URL)** dan **P2-12 (race like)** — dengan analisis yang lebih dalam
> dan rencana perbaikan bertahap. Temuan pass 1 ada di §2–§6; temuan dan koreksi pass 2 ada
> di §7–§10.

---

## 1. Ringkasan

| Severity    | Jumlah | Inti                                                                                                                                                                               |
| ----------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P1**      | 8      | Tidak ada loading boundary sama sekali; 18/27 aksi async tanpa gate; dialog connect menutup sebelum request; kegagalan senyap; tidak ada error boundary; query tanpa batas.        |
| **P2**      | 12     | `router.refresh` tanpa indikator, aksi destruktif tanpa konfirmasi, state optimistis hilang saat search, gambar tanpa placeholder, a11y loading, over-fetch, index kurang.         |
| **P3**      | 6      | Await serial, auth ganda di proxy + RSC, inkonsistensi copy upload, remount kartu, kontrol mati, coverage tes.                                                                     |
| **Backend** | 10     | N+1 signed URL (5 modul), tanpa pagination server, `select("*")`, index komposit, RLS dievaluasi per baris, agregasi like, admin memuat semua tab, `profile_age` N+1, upload 1 MB. |

**Pass 2 menambahkan:**

| Severity | Jumlah | Inti                                                                                                                                                                                                    |
| -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P1**   | 5      | Font ikon 4 MB di setiap halaman; error query baca ditelan (data kosong dianggap tidak ada); profile masih menampilkan arsip palsu; form persona bisa submit tanpa field wajib; race accept→decline.    |
| **P2**   | 11     | Dialog tanpa focus trap; error form tidak terhubung ke input; payload i18n penuh + landing client; constraint DB/RPC kurang; `Reveal` flash; hydration time; composer >600 gagal senyap; profile blank. |
| **P3**   | 9      | Prefill serial, umur dihitung dua cara, state like tidak sinkron, fixture mati, origin header, coverage tes, effect dialog, aksi in-flight, CTA/footer.                                                 |

Angka kunci pass 2 (terukur):

- Font ikon Material Symbols: **4.001.808 byte**; subset `icon_names` + axes tetap untuk 104
  ikon: **23.696 byte**.
- 11 gambar landing: semua **200 OK**, total **±622 KB**, dari `lh3.googleusercontent.com`.
- `supabase/config.toml:18`: `max_rows = 1000`.
- Katalog i18n: 918 key, **52 KB / 56 KB** (≈17 KB gzip per locale) dikirim ke setiap route.

Gate saat audit: working tree bersih. Angka kunci:

- **0** file `loading.tsx`, **0** `error.tsx`, **0** `not-found.tsx` di `src/app`.
- **18 dari 27** handler async tidak punya pending state, disabled state, atau guard
  in-flight.
- **15** pemanggilan `router.refresh()` tanpa indikator progres.
- **0** `aria-busy` / `role="status"` pada spinner atau tombol yang sedang memproses.
- **5 modul query** melakukan signed URL per baris (N+1); salah satunya serial di dalam
  `for` loop.
- Semua listing mengambil **seluruh tabel** lalu memotong 2–4 item per halaman di client.

Definisi "done" di `docs/PRD.md:564` mewajibkan loading state dan error state; FR-10.3
melarang kontrol navigasi yang terlihat aktif tetapi tidak berfungsi. Kondisi sekarang
belum memenuhi keduanya.

---

## 2. P1 — feedback dan gate yang kritis

### P1-01 · Tidak ada loading boundary di seluruh route

**Bukti:** `find src/app -name "loading.tsx" -o -name "error.tsx" -o -name "not-found.tsx"`
tidak mengembalikan hasil. Semua halaman app adalah dynamic route yang membaca cookie dan
query (contoh `src/app/[locale]/(app)/discover/page.tsx:17-21`,
`src/app/[locale]/(app)/posts/page.tsx:18-31`).

**Dampak:** Setelah klik navigasi (tab navbar, kartu persona, "Lihat spesifikasi"), layar
tetap pada halaman lama tanpa perubahan apa pun sampai RSC round-trip selesai. Prefetch
`<Link>` pada dynamic route hanya berguna sampai loading boundary terdekat; tanpa
`loading.tsx`, tidak ada yang bisa di-prefetch.

**Perbaikan:** Tambahkan `loading.tsx` per segment (`discover`, `posts`, `marketplace`,
`connections`, `profile`, `persona/[id]`, `admin`, `create-persona`) berisi skeleton yang
meniru layout asli. Catatan Next 16: `loading.tsx` tidak menolong render pertama layout
yang membaca `cookies()`/data runtime; `(app)/layout.tsx:14-25` termasuk kasus itu. Untuk
navigasi antar-page di dalam layout yang sama, boundary tetap bekerja.

---

### P1-02 · 18 aksi async tanpa gate double-click

**Bukti:** Inventaris lengkap ada di §6. Yang punya gate hanya: login, register, forgot
password, reset password, submit persona, publish post, like, submit report, dan form
produk admin. Sisanya tidak menonaktifkan tombol dan tidak menandai in-flight.

**Dampak:** Klik ganda mengirim dua Server Action. Beberapa operasi idempoten karena
constraint DB, tetapi banyak yang tidak:

- `createProductAction` dapat membuat dua produk.
- `sendConnectRequestAction` kedua gagal `23505` lalu mengembalikan `unknown`; di posisi
  pemanggil error itu diabaikan.
- `deleteProductAction` kedua mengembalikan `forbidden` tanpa pesan.
- `reviewPersonaAction` kedua menulis ulang status dan `reviewed_at`.
- User melihat tombol kembali aktif sebelum data berubah, lalu mengulang aksi.

**Perbaikan:** Satu primitive `usePendingAction` dengan guard **ref sinkron** (bukan hanya
state React) + state untuk UI + dukungan pesan "masih memproses" setelah ±8 detik. Setiap
aksi memakai key per baris (`review:<id>`, `delete:<id>`) agar satu baris tidak memblokir
baris lain.

---

### P1-03 · Connect dialog menutup sebelum request selesai

**Bukti:** `src/features/shared/connect-dialog.tsx:31` — `onSend: (note: string) => void`.
Ketiga pemanggil menutup dialog lebih dulu, lalu `await` action:

- `src/features/posts/components/posts-view.tsx:54-60`
- `src/features/persona/components/persona-feed.tsx:38-50`
- `src/features/persona/components/persona-detail-view.tsx:30-36`

**Dampak:** Dialog hilang seketika, tidak ada indikator "mengirim", dan kegagalan tidak
terlihat. Di `posts-view`, `result` yang gagal bahkan tidak dipakai sama sekali. State
kartu tetap "Connect" sampai refresh, sehingga user dapat mengirim request kedua.

**Perbaikan:** Ubah kontrak menjadi `onSend: (note: string) => Promise<boolean>`; dialog
mengelola `sending` sendiri, menampilkan error inline, dan hanya menutup saat sukses.
Parent memperbarui state optimistis ke `requested` dan melakukan rollback bila gagal.

---

### P1-04 · Kegagalan aksi ditelan tanpa pesan

**Bukti:**

- `post-composer.tsx:50-60` — upload/post gagal → kembali ke `idle`, tanpa pesan.
- `post-card.tsx:41-46` — like gagal → revert diam-diam.
- `posts-view.tsx:54-71` — connect, delete, dan accept mengabaikan `result.ok`.
- `received-requests-panel.tsx:19-25`, `active-connections-panel.tsx:96-99` — tidak ada
  cabang error.
- `admin/components/users-tab.tsx:146-149`, `moderation-tab.tsx:70-82`,
  `marketplace-tab.tsx:314-325` — semua hanya `if (result.ok) router.refresh()`.

**Dampak:** User tidak tahu apakah aksi gagal karena jaringan, RLS, atau validasi. Mereka
mengulang, memicu double submit, lalu menganggap aplikasi rusak.

**Perbaikan:** Setiap aksi wajib memiliki tiga state yang terlihat: `pending`, `error`
(pesan yang bisa dibaca dan diumumkan `aria-live`), dan `success`. Gunakan toast global
atau status inline per panel — keputusan ada di §11.

---

### P1-05 · Tidak ada error boundary dan halaman 404 kustom

**Bukti:** Tidak ada `error.tsx` maupun `not-found.tsx`. `notFound()` dipanggil di
`src/app/[locale]/(app)/persona/[id]/page.tsx:23` dan `terms/page.tsx:27` tanpa UI khusus.

**Dampak:** Error runtime di produksi jatuh ke halaman default Next tanpa navigasi kembali
atau tombol retry. Persona yang tidak ada menampilkan 404 generik yang keluar dari bahasa
visual dan bahasa aplikasi.

**Perbaikan:** `src/app/[locale]/(app)/error.tsx` (client, tombol "Coba lagi" memanggil
`reset()`), `[locale]/not-found.tsx`, dan pertimbangkan `[locale]/error.tsx`. Semua teks
melalui `next-intl`.

---

### P1-06 · Semua listing mengambil seluruh tabel (tanpa pagination server)

**Bukti:**

- `persona/queries.ts:17-30` — semua `profiles_public` + semua `connections`.
- `posts/queries.ts:31-59` — semua post + semua like + semua koneksi.
- `marketplace/queries.ts:42-57` — semua produk + semua gambar.
- `connect/queries.ts:122-126` — semua koneksi.
- `admin/queries.ts:61-88` — semua profil + laporan + produk + gambar sekaligus.

Sementara client memotong 2 item per halaman di Posts (`posts-view.tsx:22`), 4 di Discover
dan Marketplace.

**Dampak:** Biaya query, transfer RSC, dan signed URL tumbuh linear terhadap seluruh data,
bukan terhadap halaman yang dilihat. Tanpa `.range()`/`.limit()`, PostgREST juga memotong
di batas `max-rows` (default Supabase 1.000 baris) sehingga data bisa hilang diam-diam.
Filter/search/sort saat ini berjalan di client, jadi tidak bisa dipindah sebagian saja.

**Perbaikan:** Pagination + filter + sort server-side melalui `searchParams`, DTO sempit,
`count: "exact"`, dan `Pagination` berbasis URL. Page size dinaikkan (Posts 6–10, Discover
12, Marketplace 12) agar tidak menghasilkan puluhan halaman.

---

### P1-07 · N+1 signed URL di lima modul query

**Bukti:** `createSignedImageUrl` (`src/lib/storage.ts:29-41`) dipanggil per baris:

- `persona/queries.ts:47-62` — satu per persona, dieksekusi `Promise.all`.
- `posts/queries.ts:78-113` — dua per post (gambar + avatar).
- `connect/queries.ts:154-197` — `await resolveAvatar(...)` di dalam `for` loop (serial).
- `marketplace/queries.ts:66-72` — satu per gambar galeri.
- `admin/queries.ts:97-148` — satu per user dan satu per produk.

**Dampak:** Satu kali buka feed dengan 100 post menghasilkan ±200 panggilan HTTP ke
Storage. Discover dengan 1.000 persona melakukan 1.000 panggilan paralel dan berisiko 429.
Connections melambat karena setiap avatar ditunggu berurutan.

**Perbaikan:** Helper batch `createSignedImageUrls(supabase, bucket, paths[])` memakai
`storage.createSignedUrls` (satu request), lalu map `path → url`. Dedupe per request dengan
`React.cache` atau `Map`; **jangan** cache signed URL lintas request karena itu bearer token
dan berpotensi melewati RLS.

---

### P1-08 · Upload gambar >1 MB gagal di layer framework

**Bukti:** `next.config.ts` tidak mengatur `serverActions.bodySizeLimit` (default Next
**1 MB**), sedangkan `BUCKET_MAX_BYTES` mengizinkan 5 MB untuk avatar dan 10 MB untuk
post/produk (`src/lib/storage.ts:12-18`). `uploadImageAction` menerima `File` utuh melalui
Server Action (`src/features/media/actions.ts:23-58`).

**Dampak:** Foto kamera normal (2–8 MB) gagal sebelum validasi Zod berjalan. Di UI,
kegagalan ini muncul sebagai error generik atau tidak muncul sama sekali (lihat P1-04).
Tidak ada validasi ukuran/tipe di client dan tidak ada progress upload.

**Perbaikan jangka pendek:** naikkan `serverActions.bodySizeLimit` ke `"10mb"` dan
validasi tipe/ukuran di client sebelum submit. **Perbaikan yang disarankan:** upload
langsung dari browser ke Storage via `createSignedUploadUrl`, lalu kirim path ke Server
Action — menghindari limit body, memungkinkan progress bar, dan lebih cepat di mobile.

---

## 3. P2 — gap feedback dan UX

### P2-01 · Locale switch tanpa indikator dan bisa diklik ganda

**Bukti:** `router.replace(pathname, { locale: next })` tanpa transition di
`navbar.tsx:49-52`, `public-header.tsx:66-69`, `marketing-header.tsx:80-83`.

**Dampak:** Pada koneksi lambat, tombol terasa mati; klik kedua menumpuk navigasi.
**Perbaikan:** bungkus dalam `useTransition`, disable chip yang dipilih, tampilkan spinner
kecil, dan pertahankan `aria-pressed`/`aria-current`.

### P2-02 · `router.refresh()` tanpa indikator

**Bukti:** 15 pemanggilan (Posts, Discover, Connections, Admin, Profile). Contoh
`posts-view.tsx:59-70`, `received-requests-panel.tsx:24`,
`admin/components/marketplace-tab.tsx:319-324`.

**Dampak:** Tombol kembali aktif sebelum data baru tiba; user mengira aksi tidak terjadi
lalu mengulang.
**Perbaikan:** bungkus refresh dalam transition + indikator halus (top progress bar atau
`aria-busy` pada panel), dan/atau update optimistis agar UI berubah segera.

### P2-03 · Aksi destruktif tanpa konfirmasi

**Bukti:** hapus post (`post-card.tsx:90-99`), disconnect
(`active-connections-panel.tsx:192-200`), hapus produk
(`admin/components/marketplace-tab.tsx:384-392`), reject/suspend user
(`users-tab.tsx:219-253`), hapus post dari moderasi (`moderation-tab.tsx:118-131`).

**Dampak:** Salah klik langsung mengubah/menghapus data.
**Perbaikan:** `ConfirmDialog` bersama; tombol destruktif tetap punya pending state setelah
dikonfirmasi.

### P2-04 · State optimistis Connect hilang saat mengetik pencarian

**Bukti:** `discover-workspace.tsx:62` memakai ``key={`${query}|${region}`}`` pada
`<PersonaFeed>`. Setiap perubahan query/region me-remount komponen dan menginisialisasi
ulang `states` dari props server (`persona-feed.tsx:27-29`).

**Dampak:** Setelah mengirim request, mengetik satu huruf mengembalikan tombol menjadi
"Connect" karena props belum di-refresh; user dapat mengirim request lagi.
**Perbaikan:** hapus `key`, pertahankan state per persona, dan reset halaman lewat handler
(bukan remount). Sinkronkan state dengan props memakai pola override (`statusOverrides`)
agar tetap benar setelah refresh.

### P2-05 · Gambar dan avatar tanpa placeholder/fallback

**Bukti:** Semua `<img>` polos (contoh `post-card.tsx:61-67,147-152`,
`marketplace-view.tsx:281-286`, `persona-detail-view.tsx:69-73`). Hanya sebagian yang
memakai `loading="lazy"`.

**Dampak:** Saat signed URL lambat, area gambar tampak kosong; bila URL kedaluwarsa/gagal,
tidak ada fallback. Hero/detail juga tidak diberi prioritas fetch.
**Perbaikan:** komponen `MediaImage`/`MediaAvatar` dengan skeleton shimmer, `decoding="async"`,
fallback ikon, `loading="lazy"` untuk grid, dan eager/high priority untuk hero.

### P2-06 · Loading tidak diumumkan ke screen reader

**Bukti:** Tidak ada `aria-busy`, `role="status"`, atau teks sr-only pada spinner. Satu-
satunya `aria-live` ada di `persona-feed.tsx:233`.

**Dampak:** Pengguna screen reader tidak mendapat sinyal bahwa aksi sedang diproses atau
selesai.
**Perbaikan:** spinner dengan `role="status"` + sr-only "Memproses…", `aria-busy` pada
tombol/panel, dan pengumuman sukses/gagal melalui live region.

### P2-07 · Over-fetch kolom

**Bukti:** `profiles_public.select("*")` di `persona/queries.ts:19,76`,
`posts/queries.ts:40`, `connect/queries.ts:134`. Kartu hanya butuh nama, kota, negara,
avatar, umur, bahasa, minat.
**Dampak:** Payload dan memori membengkak seiring data; kolom bio ikut terkirim ke listing.
**Perbaikan:** DTO sempit per layar dan `select("id, display_name, ...")` eksplisit.

### P2-08 · Index database belum cocok dengan pola akses

**Bukti:** Index yang ada hanya `connections` (pair + dua arah), `posts_author`,
`posts_created_at`, PK `post_likes`, `reports_status`, `reports_reporter`, dan
`marketplace_product_images(product_id, sort)`.
**Dampak:** Query listing dan badge count melakukan scan/filter yang makin mahal.
**Perbaikan (migrasi baru):**

- `profiles (approval_status, role, display_name)` — discovery.
- `connections (recipient_id, status)` dan `(requester_id, status)` — badge + tab.
- `posts (moderation_status, created_at desc)` — feed.
- `marketplace_products (is_published, created_at desc)` — katalog.
- `reports (status, created_at desc)` dan `reports (target_post_id)` — moderasi.

### P2-09 · Policy RLS mengevaluasi helper per baris _(belum terbukti — perlu EXPLAIN)_

**Bukti:** `public.is_approved()` / `public.is_admin()` dipanggil langsung di banyak policy
(`initial_schema.sql:311-318`, `:409-415`, `:456-462`, dst.).
**Dampak:** Jika planner tidak meng-hoist-nya menjadi InitPlan, fungsi security-definer
dievaluasi per baris. Karena fungsinya tanpa argumen dan `stable`, ada kemungkinan sudah
di-hoist; jangan jadikan blocker sebelum diukur.
**Perbaikan:** ukur dengan `EXPLAIN (ANALYZE, BUFFERS)` pada query listing. Jika terbukti
per baris, bungkus sebagai subquery: `(select public.is_approved())`,
`(select public.is_admin())`.

### P2-10 · Admin memuat semua tab sekaligus

**Bukti:** `getAdminData()` (`admin/queries.ts:61-88`) mengambil profil, laporan, produk,
dan gambar dalam satu request, padahal tab default hanya `users`
(`admin-view.tsx:21`).
**Dampak:** Buka `/admin` menunggu empat dataset + signed URL untuk semua user dan produk.
**Perbaikan:** pisahkan query per tab. Opsi: route `/admin/users`, `/admin/marketplace`,
`/admin/moderation` dengan layout bersama (back button + loading per tab), atau lazy
Server Action saat tab dipilih.

### P2-11 · `profile_age()` N+1 di view

**Bukti:** `profiles_public` memanggil `public.profile_age(p.id)` per baris
(`supabase/migrations/20261019120200_s3_profiles_public.sql:28`), dan fungsi tersebut
melakukan `select ... from profile_private where profile_id = ...`
(`20261016120000_s1_fixes.sql:196-212`).
**Dampak:** Discovery dengan N baris menjalankan N query tambahan di database, sebelum
signed URL bahkan dipanggil.
**Perbaikan:** scope ke halaman yang di-fetch terlebih dahulu. Jangka panjang: expose hanya
`age` lewat view/function set-based (mis. join ke `profile_ages`) dengan review security,
atau materialisasi umur yang diperbarui saat tanggal lahir berubah.

### P2-12 · Pagination merender satu tombol per halaman

**Bukti:** `pagination.tsx:34` — `Array.from({ length: totalPages }, ...)`.
**Dampak:** Dengan page size 2 dan 1.000 post, ada 500 tombol di DOM.
**Perbaikan:** page size lebih besar, windowing halaman (1 … n-1, n, n+1 … last), dan
pagination berbasis URL setelah P1-06 dikerjakan.

---

## 4. P3 — kecil dan operasional

| ID    | Temuan                                                                                                   | Bukti                                                               | Saran                                                        |
| ----- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| P3-01 | Submit persona sudah di-disable tetapi tanpa spinner/`aria-busy`.                                        | `create-persona-view.tsx:637-652`                                   | Pakai `Spinner` yang sama dengan form auth.                  |
| P3-02 | Tombol **Back** di form persona dan **Resend** di layar "link terkirim" tidak punya handler.             | `create-persona-view.tsx:630-636`, `reset-link-sent-view.tsx:29-39` | Implementasikan navigasi/aksi atau hapus (FR-10.3).          |
| P3-03 | Copy batas upload tidak konsisten: pesan menyebut 10 MB, bucket avatar 5 MB.                             | `messages/en.json:861`, `src/lib/storage.ts:14-18`                  | Samakan copy per konteks (avatar 5 MB, post/produk 10 MB).   |
| P3-04 | `PostCard` di-key dengan `${post.id}-${page}-${index}` sehingga remount saat pindah halaman.             | `posts-view.tsx:129`                                                | Gunakan `post.id` saja; reset state lewat props/override.    |
| P3-05 | Layout dan beberapa query melakukan await serial yang bisa diparallelkan.                                | `(app)/layout.tsx:14-25`, `connect/queries.ts:154-197`              | `Promise.all` untuk count + avatar; batch/paralelkan avatar. |
| P3-06 | Tidak ada tes untuk perilaku pending/double-click; `proxy` dan RSC sama-sama memanggil `auth.getUser()`. | `src/proxy.ts:16-34`, `lib/supabase/proxy.ts:68-72`                 | Tambah tes unit hook + pertimbangkan `getClaims()` di proxy. |

---

## 5. Backend — inventaris query dan rekomendasi

| ID   | Severity | Query                    | Yang diambil sekarang                      | Panggilan eksternal     | Perbaikan                                                    |
| ---- | -------- | ------------------------ | ------------------------------------------ | ----------------------- | ------------------------------------------------------------ |
| B-01 | P1       | `getDiscoverPersonas`    | semua persona + semua koneksi              | N signed URL (paralel)  | pagination + DTO sempit + batch signed URL                   |
| B-02 | P1       | `getFeed`                | semua post + semua like + semua koneksi    | 2N signed URL           | pagination + agregasi like + batch signed URL                |
| B-03 | P1       | `getConnectionsData`     | semua koneksi + profil + kontak            | N signed URL **serial** | filter status per grup + batch signed URL                    |
| B-04 | P1       | `getPublishedProducts`   | semua produk + semua gambar                | M signed URL            | pagination + sort server + batch signed URL                  |
| B-05 | P1       | `getAdminData`           | semua profil + laporan + produk + gambar   | N + M signed URL        | pecah per tab + pagination + batch signed URL                |
| B-06 | P2       | Semua listing            | `select("*")` pada `profiles_public`       | —                       | pilih kolom eksplisit                                        |
| B-07 | P2       | Semua listing            | tanpa `.range()`/`.limit()`                | —                       | pagination server + `count`                                  |
| B-08 | P2       | `post_likes`             | semua baris like untuk semua post          | —                       | view/RPC agregat (`post_id, count`) + like milik viewer saja |
| B-09 | P2       | RLS + `profiles_public`  | helper per baris + `profile_age` per baris | N query DB              | InitPlan + join umur set-based                               |
| B-10 | P3       | `getPendingRequestCount` | count per request layout                   | 1 query                 | index `(recipient_id, status)`; pertimbangkan Suspense       |

**Catatan penting:** signed URL adalah bearer token. Jangan pernah menyimpannya di cache
lintas user/request. Dedupe hanya dalam satu request (`React.cache`/`Map`).

---

## 6. Inventaris handler async

| #   | Modul          | Handler                 | Gate sekarang         | Error terlihat | Catatan                   |
| --- | -------------- | ----------------------- | --------------------- | -------------- | ------------------------- |
| 1   | Auth           | login                   | ✅ disabled + spinner | ✅             | acuan                     |
| 2   | Auth           | register                | ✅ disabled + spinner | ✅             | acuan                     |
| 3   | Auth           | forgot password         | ✅ disabled + spinner | ✅             | acuan                     |
| 4   | Auth           | reset password          | ✅ disabled + spinner | ✅             | acuan                     |
| 5   | Persona        | submit form             | ✅ disabled           | ✅             | spinner belum ada         |
| 6   | Posts          | publish                 | ✅ disabled + spinner | ❌             | gagal upload/post senyap  |
| 7   | Posts          | like                    | ✅ guard              | ❌             | guard state, bukan ref    |
| 8   | Posts          | delete                  | ❌                    | ❌             | tanpa konfirmasi          |
| 9   | Posts          | connect (dialog)        | ❌                    | ❌             | dialog menutup lebih dulu |
| 10  | Posts          | accept                  | ❌                    | ❌             | —                         |
| 11  | Discover       | connect (dialog)        | ❌                    | ◐              | banner global             |
| 12  | Discover       | accept/decline          | ❌                    | ◐              | banner global             |
| 13  | Persona detail | connect (dialog)        | ❌                    | ◐              | banner global             |
| 14  | Persona detail | accept/decline          | ❌                    | ◐              | banner global             |
| 15  | Connections    | accept/decline          | ❌                    | ❌             | —                         |
| 16  | Connections    | disconnect              | ❌                    | ❌             | tanpa konfirmasi          |
| 17  | Reports        | submit                  | ✅ disabled           | ✅             | acuan                     |
| 18  | Admin          | review persona          | ❌                    | ❌             | destruktif                |
| 19  | Admin          | resolve/dismiss report  | ❌                    | ❌             | —                         |
| 20  | Admin          | remove post             | ❌                    | ❌             | dua action berurutan      |
| 21  | Admin          | product create/update   | ✅ busy + spinner     | ✅             | acuan                     |
| 22  | Admin          | product publish toggle  | ❌                    | ❌             | —                         |
| 23  | Admin          | product delete          | ❌                    | ❌             | tanpa konfirmasi          |
| 24  | Profile        | logout                  | ❌                    | ❌             | —                         |
| 25  | Profile        | share/copy              | ✅ feedback           | —              | tidak async ke server     |
| 26  | Connections    | copy contact            | ✅ feedback           | —              | tidak async ke server     |
| 27  | Shared         | pagination/filter lokal | —                     | —              | tidak async ke server     |

Ringkas: **9 bergate, 18 tidak**; **7 tidak pernah menampilkan error**.

---

## 7. Pass 2 — verifikasi runtime dan koreksi pass 1

**Sifat:** static review + probe HTTP read-only. Tidak menjalankan app, test, atau mutasi DB.

### 7.1 Hasil pengukuran

| Yang diukur                                                     | Hasil                                                      | Implikasi                                        |
| --------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| Font Material Symbols (link di `app/[locale]/layout.tsx:62-65`) | **4.001.808 byte (±4 MB)**, `font/woff2`                   | Setiap page mengunduh 4 MB font ikon             |
| Subset `icon_names` + axes tetap, 104 ikon                      | **23.696 byte (±24 KB)**                                   | 4 MB → 24 KB tanpa mengubah markup ikon          |
| 11 gambar landing (`landing/data.ts:11-23`)                     | Semua **200 OK**, total **±622 KB**                        | Tersedia, tetapi bergantung pada Google CDN      |
| `supabase/config.toml:18`                                       | `max_rows = 1000`                                          | Query tanpa `.limit()` terpotong di 1.000 baris  |
| `messages/{en,es}.json`                                         | 918 key; **52 KB / 56 KB** (≈17 KB gzip per locale)        | Seluruh katalog dikirim ke client di semua route |
| `profile/data.ts` + `marketplace/data.ts`                       | 9,7 KB + 12,7 KB fixture                                   | Ikut ke client bundle route profile              |
| Redirect `next` di auth callback                                | `//evil.com`, backslash, dan URL absolut tetap same-origin | Tidak ada open redirect                          |

### 7.2 Koreksi dan konfirmasi

| Klaim pass 1                                  | Status pass 2                                                                                                  |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `disconnect` = `accepted → declined`          | **Aman.** Trigger mengizinkan kedua pihak disconnect (`s1_fixes.sql:44-50`).                                   |
| `save_persona` tidak cocok dengan action      | **Sudah cocok.** Versi terbaru punya 14 argumen + `p_avatar_url` (`20261019130000_s4_avatar.sql`).             |
| Query tanpa limit terpotong 1.000 baris       | **Terkonfirmasi** (`config.toml:18`).                                                                          |
| RLS `is_approved()` dievaluasi per baris      | **Belum pasti.** Fungsi SQL stable tanpa argumen bisa di-hoist jadi InitPlan (lihat P2-09).                    |
| `profile_age()` N+1                           | **Terkonfirmasi.** Dipanggil per baris view dan query `profile_private` per baris.                             |
| Upload >1 MB gagal                            | **Terkonfirmasi** (default Server Action 1 MB), dan tidak ada validasi client.                                 |
| Gambar landing eksternal                      | **200 OK**, bukan broken; risikonya dependency/privacy, bukan 404.                                             |
| `loading.tsx` / `error.tsx` tidak ada         | **Terkonfirmasi 0 file.**                                                                                      |
| Audit lama P1-06 "mock dossier" sudah dihapus | **Sebagian benar.** Identitas/kontak palsu sudah hilang, tetapi arsip aktivitas profile masih fixture (F2-03). |

---

## 8. Pass 2 — temuan baru P1

### F2-01 · Font ikon 4 MB dimuat di setiap halaman

**Bukti:** `src/app/[locale]/layout.tsx:62-65` memuat stylesheet Google Material Symbols
dengan satu `@font-face` penuh. Font yang dirujuk berukuran **4.001.808 byte**. CSS-nya
render-blocking, dan `display=swap` membuat nama ikon tampil sebagai teks (mis.
`arrow_forward`) sebelum font selesai.

**Dampak:** Ini kandidat terbesar "load terlalu lama" di seluruh aplikasi — lebih besar dari
semua gambar landing digabung. Di mobile, 4 MB bersaing dengan RSC, gambar, dan font teks.

**Perbaikan:** Gunakan `icon_names` + axes tetap, lalu self-host:

```
Material Symbols Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0
&icon_names=add,arrow_back,...
```

Hasil ukur: **±24 KB untuk 105 ikon**. Alternatif terbaik: ganti `Icon` dengan registry SVG
inline (hilangkan font sama sekali). Langkah minimal: subset + `next/font/local`, dan hapus
link stylesheet eksternal dari `<head>`.

### F2-02 · Semua query baca menelan `error` → "kosong" dianggap "tidak ada data"

**Bukti:** Semua query hanya mengambil `data`/`count`, tidak pernah `error`:

- `persona/queries.ts:17-30`, `:74-89`
- `posts/queries.ts:31-59`
- `connect/queries.ts:110-147`
- `profile/queries.ts:29-60`
- `marketplace/queries.ts:42-57`, `:108-112`
- `admin/queries.ts:64-88`
- `lib/auth.ts:32-55`

**Dampak:** Saat Supabase lambat/error/RLS berubah:

- Discover menampilkan "No personas"; Posts/Connections/Marketplace menampilkan kosong;
  Admin menampilkan dashboard kosong.
- `getCurrentProfile()` gagal → `requireApprovedUser` mengira user belum punya persona →
  **redirect ke `/create-persona`**.
- `getCurrentUser()` gagal → **redirect ke `/login`** (user terlihat logout padahal sesi
  masih ada).
- `/profile` bisa blank total (F2-12).

**Perbaikan:** Buat hasil query eksplisit `{ data, error }` atau throw saat `error` sehingga
`error.tsx` menangkapnya. Minimal: bedakan empty state vs failure state. Untuk auth gate,
jangan perlakukan error jaringan sebagai "belum onboarding".

### F2-03 · Arsip aktivitas profile masih data palsu, dan bertentangan dengan data asli

**Bukti:** `profile-view.tsx:10-15` mengakui arsip masih fixture. `activity-panel.tsx:8-17`
mengimpor `DISPATCHES`, `SAVED_GOODS`, `CIRCLE_MEMBERS`, `SECURITY_LOG`, `PROFILE_TOTALS`;
semuanya di `profile/data.ts:135-214`.

Yang ditampilkan ke user nyata:

- 3 "dispatch" palsu dengan foto eksternal.
- 6 "saved goods" dari fixture marketplace.
- 6 anggota circle palsu.
- **Security log palsu** ("Mateo Silva unveiled 4 days ago", "Diego Salas revoked…").
- Tab count **14 / 6 / 48**, sementara header memakai metrics asli.
- `ContactLocker` di halaman yang sama menampilkan `unveiled` **asli**
  (`contact-locker.tsx:98`).

**Dampak:** User melihat riwayat keamanan dan koneksi yang tidak pernah terjadi. Fixture ini
juga menarik `marketplace/data.ts` (12,7 KB) ke client bundle profile.

**Perbaikan:** Pilih salah satu: wire ke data asli, atau sembunyikan tab yang belum ada
datanya dan hapus fixture dari komponen client. Jangan biarkan fixture di produksi.

### F2-04 · Form persona bisa disubmit tanpa nama/kota/bio, lalu gagal generik

**Bukti:** `create-persona-view.tsx:121-124`:

```ts
const canSubmit = selectedInterests >= 3 && hasContact && selectedLanguages >= 1;
```

`fullName`, `city`, dan `bio` tidak dihitung. Input tidak `required` (`:355-418`,
`:505-514`). Server menolak (`validation/persona.ts:16-18`, `:31`), lalu UI memetakan semua
error ke `errorInvalid` generik (`:252-258`) tanpa menandai field.

**Dampak:** Tombol aktif, submit, lalu "Please check the highlighted fields" padahal tidak
ada field yang di-highlight.

**Perbaikan:** Masukkan field wajib ke `canSubmit`; tambahkan error per field +
`aria-invalid`/`aria-describedby`; map issue Zod ke field terkait; tambahkan `required`.

### F2-05 · Race Accept → Decline memutus koneksi yang baru diterima

**Bukti:** `received-requests-panel.tsx:19-25` dan `persona-feed.tsx:52-64` tidak
menonaktifkan tombol selama request. `acceptConnectionAction` lalu
`declineConnectionAction` = `accepted → declined`, dan trigger mengizinkan transisi itu
sebagai disconnect (`s1_fixes.sql:44-50`).

**Dampak:** Accept lalu cepat Decline sebelum refresh → koneksi diterima lalu langsung
diputus.

**Perbaikan:** Gate per baris (pending + disabled); setelah sukses, ganti kedua tombol
dengan status hasil, jangan biarkan keduanya aktif sampai refresh.

---

## 9. Pass 2 — temuan baru P2

### F2-06 · Tidak ada focus trap / background inert di tiga dialog

**Bukti:**

- `connect-dialog.tsx:38-59`: memfokuskan textarea, tetapi tidak menahan Tab; background
  tidak `inert` saat open.
- `report-dialog.tsx:34-48`: tidak memindahkan fokus sama sekali; background tetap bisa
  di-tab.
- `product-drawer.tsx:20-35`: hanya Escape + scroll lock; fokus tetap di kartu di belakang.

Ketiganya punya `role="dialog"` dan `aria-modal`, tetapi `aria-modal` saja tidak menahan
fokus.

**Dampak:** Keyboard/screen-reader user bisa keluar dari dialog ke halaman belakang;
ProductDrawer tidak pernah menerima fokus.

**Perbaikan:** Primitive dialog bersama: simpan fokus terakhir, pindahkan fokus ke
heading/field pertama, trap Tab, `inert` pada konten halaman, restore fokus saat close.

### F2-07 · Error form tidak terhubung ke input, dan login tidak ramah password manager

**Bukti:** Tidak ada `aria-describedby` di seluruh `src` (grep kosong). `login-view.tsx:152-167`
dan `:192-204` tidak punya `autoComplete` (`email` / `current-password`). Banner error
login/register tidak diberi `id` yang dirujuk input.

**Dampak:** Screen reader tidak mengumumkan error per field; password manager sulit mengisi
form login.
**Perbaikan:** `aria-invalid`, `aria-describedby` ke teks error/help, `role="alert"` untuk
error baru, dan `autoComplete` yang benar.

### F2-08 · Payload i18n penuh dikirim ke setiap route; landing seluruhnya client component

**Bukti:** `app/[locale]/layout.tsx:70` memberikan seluruh 918 key (52–56 KB, ≈17 KB gzip)
ke `NextIntlClientProvider`. Enam section landing semuanya `"use client"` (`hero.tsx:1`,
`steps-section.tsx:1`, `people-section.tsx:1`, `dispatches-section.tsx:1`,
`marketplace-section.tsx:1`, `closing-cta.tsx:1`) hanya karena `useTranslations`.

**Dampak:** Setiap route mengirim namespace yang tidak dipakai (Auth 8,2 KB, Landing 6,8 KB,
Admin 4,3 KB, dst.). Landing menghidrasi React untuk konten statis.
**Perbaikan:** Kirim hanya namespace yang dipakai client component per route/route-group;
ubah section landing menjadi Server Component dengan `Reveal` tetap client wrapper.

### F2-09 · Validasi konten hanya di Server Action, tetapi PostgREST bisa dipanggil langsung

**Bukti:** RLS mengizinkan user menulis baris miliknya, dan RPC `save_persona` di-grant ke
`authenticated`. Namun hampir tidak ada constraint panjang di DB:

- `profiles.display_name` — `text` tanpa check (`initial_schema.sql:45`).
- `posts.caption` — tanpa check (`:104`).
- `marketplace_products.name/summary/description` — tanpa check (`:124-131`).
- `reports.details` — tanpa check (`:157`).
- `save_persona` menerima `p_display_name`, `p_bio`, `p_languages`, `p_interests`, dan
  channel tanpa validasi panjang; yang dicek hanya minimal satu channel dan prefix avatar.

**Dampak:** Dengan anon key + JWT, user bisa memanggil PostgREST/RPC langsung dan menyimpan
teks/JSON/array raksasa atau data yang tidak lolos Zod.
**Perbaikan:** Tambahkan `check (char_length(...) <= n)` untuk field yang sudah dibatasi Zod,
dan guard panjang di dalam `save_persona`. Zod di Server Action tetap ada sebagai validasi
UX, bukan satu-satunya pagar.

### F2-10 · `Reveal` berpotensi flash: konten tampil lalu disembunyikan setelah paint

**Bukti:** `.reveal` default `opacity: 1` (`globals.css:229-232`). `Reveal` menyetel
`data-armed` di `useEffect` (`reveal.tsx:33-40`), yang berjalan **setelah** paint. Begitu
armed, CSS mengubah opacity ke 0, lalu IntersectionObserver menampilkan lagi dengan
transisi 720 ms (`globals.css:234-247`).

**Dampak:** Untuk elemen above-the-fold (profil memakai `Reveal` di identity/ledger,
`dossier-header.tsx:101,168`), konten bisa berkedip: terlihat → hilang → fade-in. _(Perlu
verifikasi runtime dengan CPU throttling.)_
**Perbaikan:** Arm sebelum paint (`useLayoutEffect` dengan guard SSR, atau inline script yang
menambahkan kelas di `<html>`), atau ganti dengan CSS scroll-driven animation. Pastikan
tanpa JS konten tetap terlihat.

### F2-11 · `new Date()` saat render berpotensi hydration mismatch

**Bukti:** Enam tempat menghitung relative time dengan `new Date()` di render:
`post-card.tsx:84`, `received-requests-panel.tsx:70`, `sent-requests-panel.tsx:72`,
`moderation-tab.tsx:96`, `users-tab.tsx:199`, `contact-locker.tsx:118`.

**Dampak:** Server dan client memakai waktu/timezone berbeda; output bisa berbeda di batas
menit/jam/hari. _(Perlu verifikasi runtime.)_
**Perbaikan:** Hitung `now` sekali di server dan teruskan string terformat, atau snapshot
`now` per halaman seperti `connections-view.tsx:62`; alternatif cepat:
`suppressHydrationWarning` pada elemen waktu.

### F2-12 · `/profile` blank total saat query gagal

**Bukti:** `profile/page.tsx:20-23` — `if (!profile) return null;`. Karena error query
ditelan (F2-02), `getOwnProfile` mengembalikan `null` untuk error apa pun.

**Dampak:** Layar kosong tanpa pesan. Selain itu, `channels`/`unveiled` kosong membuat
ContactLocker menampilkan "all revoked" padahal data ada; prefill edit yang gagal bisa
membuat channel tertimpa saat submit.
**Perbaikan:** Lempar error ke `error.tsx`, atau tampilkan state "Gagal memuat dossier"
dengan retry. Jangan `return null`.

### F2-13 · Composer: caption >600 gagal senyap; validasi foto tidak informatif

**Bukti:** `post-composer.tsx:95-107` tidak punya `maxLength`/counter; server membatasi 600
(`posts/actions.ts:14`). Jika caption terlalu panjang, action gagal dan UI hanya
`setPublishState("idle")` tanpa pesan (`:57-60`). `canPublish` mewajibkan file (`:36`),
tetapi tombol tetap bisa diklik; yang muncul hanya `showEmptyPrompt` pada textarea.
`showEmptyPrompt` tidak pernah di-reset (`:100`).

**Dampak:** User mengetik panjang, menekan Publish, tidak terjadi apa-apa; placeholder error
tetap tertinggal setelah masalah diperbaiki.
**Perbaikan:** `maxLength={600}` + counter, pesan error eksplisit untuk caption/foto, reset
prompt saat input berubah, dan tampilkan error upload/post.

### F2-14 · Landing: 622 KB gambar eksternal tanpa fallback; fixture profile eager

**Bukti:** 11 URL `lh3.googleusercontent.com` di `landing/data.ts:11-23`, total ±622 KB
(hero 42 KB eager, sisanya lazy). `activity-panel.tsx:121-125` (saved goods) dan
`dispatch-card.tsx:49,59` (dispatches) memakai `<img>` tanpa `loading="lazy"`.

**Dampak:** Ketergantungan pada CDN pihak ketiga, privasi request ke Google, dan tambahan
payload di profile.
**Perbaikan:** Pindahkan aset final ke `public/`/Storage, sajikan ukuran responsif
(AVIF/WebP), tambahkan fallback; hapus/lazy-load fixture profile (F2-03).

### F2-15 · Aset/metadata dasar belum ada

**Bukti:** `public/` hanya berisi 5 SVG default Next. Tidak ada `favicon.ico`, `manifest`,
`robots.ts`, `sitemap.ts`, `metadataBase`, `openGraph`, atau `icons` (grep kosong).

**Dampak:** Request favicon → 404; share link tanpa preview; metadata absolut bisa warning.
**Perbaikan:** Tambahkan `src/app/icon.svg`, `apple-icon`, `manifest.ts`, `robots.ts`,
`sitemap.ts`, `metadataBase`, dan OG image.

### F2-16 · Locale switch membuang query string dan hash

**Bukti:** `navbar.tsx:49-52`, `public-header.tsx:66-69`, `marketing-header.tsx:80-83`
memakai `router.replace(pathname)`; `usePathname()` tidak menyertakan `?page=` atau `#section`.

**Dampak:** Setelah pagination berbasis URL ditambahkan, ganti bahasa mereset ke halaman 1;
di landing, ganti bahasa dari `#people` melompat ke atas.
**Perbaikan:** Teruskan `useSearchParams()` dan hash saat switch, atau simpan state halaman
di cookie/segment.

---

## 10. Pass 2 — temuan baru P3

| ID    | Temuan                                                                                                                                                     | Bukti                                                 | Saran                                                              |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------ |
| F2-17 | Prefill edit persona serial: signed avatar → contact → private DOB.                                                                                        | `create-persona/page.tsx:38-64`                       | `Promise.all` untuk ketiganya.                                     |
| F2-18 | Umur dihitung dua cara: JS `365.25` vs SQL `age()`.                                                                                                        | `profile/queries.ts:69-72`, `s1_fixes.sql:196-208`    | Satukan; pakai `profile_age`/view atau helper tanggal sama.        |
| F2-19 | Like lokal tidak tersinkron setelah props refresh.                                                                                                         | `post-card.tsx:29-31`, `posts-view.tsx:129`           | Pakai pola override/optimistic; hapus `page` dari key.             |
| F2-20 | Fixture mati: `brand.ts` `CURRENT_USER`, `PERSONAS`, `ACTIVE_CONNECTIONS`, `RECEIVED_REQUESTS`, `SENT_REQUESTS`, `POSTS`, `ADMIN_USERS`, `ADMIN_PRODUCTS`. | grep impor fixture                                    | Hapus atau pindahkan ke `stories/`.                                |
| F2-21 | `getRequestOrigin` tetap memakai header host bila `NEXT_PUBLIC_SITE_URL` kosong, tanpa cek production.                                                     | `auth/actions.ts:51-66`                               | Wajibkan env di production; jangan fallback ke `x-forwarded-host`. |
| F2-22 | Test gap: tidak ada tes pending/double-click, storage write policy, `profile_age` lintas user, admin report resolution.                                    | `rls.test.sql` (plan 40), `tests/e2e/*`               | Tambah tes hook pending, dialog trap, storage owner, age.          |
| F2-23 | Dialog effect bergantung pada `onClose` inline; parent re-render bisa memicu cleanup + focus ulang.                                                        | `connect-dialog.tsx:38-59`, `report-dialog.tsx:34-48` | Stabilkan callback/ref atau pasang listener sekali.                |
| F2-24 | In-flight action tetap berjalan setelah dialog ditutup/user navigasi.                                                                                      | `ConnectDialog`, `ReportDialog`                       | Blokir close saat sending atau tampilkan status global.            |
| F2-25 | Landing CTA "Explore" dan footer admin link mengarah ke route auth-gated; non-admin redirect diam-diam.                                                    | `hero.tsx:49`, `footer.tsx:33-38`                     | Arahkan anon ke login/register; sembunyikan admin link.            |

---

## 11. Desain solusi yang diusulkan

### 11.1 Primitive baru

- `src/components/ui/spinner.tsx` — spinner dengan `role="status"` + label sr-only.
- `src/components/ui/skeleton.tsx` — shimmer/pulse, `motion-reduce`, delay 150 ms agar
  tidak berkedip pada respons cepat.
- `src/components/ui/media-image.tsx` — gambar dengan skeleton, fallback, dan prioritas
  fetch.
- `src/components/ui/dialog.tsx` — primitive dialog: focus trap, initial focus, background
  `inert`, restore focus, Escape/backdrop. Dipakai Connect/Report/ProductDrawer.
- `src/components/ui/confirm-dialog.tsx` — konfirmasi aksi destruktif.
- `src/features/shared/use-pending-action.ts` — guard ref sinkron + state UI + deteksi
  "lambat" setelah ±8 detik.
- `src/features/shared/action-feedback.tsx` — toast global **atau** status inline.
- Read-error envelope: query mengembalikan `{ data, error }` atau throw saat `error`,
  sehingga `error.tsx` bisa menangkap dan empty state tidak dipakai untuk kegagalan.
- `src/components/ui/icon.tsx` — pertahankan markup, tetapi font ikon diganti subset
  `icon_names` (±24 KB) atau registry SVG; hapus stylesheet eksternal dari `<head>`.
- Key i18n baru di `src/messages/{en,es}.json` untuk loading, error, retry, dan a11y.

### 11.2 Pola state

- **Pending per key**, bukan global: `usePendingAction()` mengembalikan `isPending(key)`
  dan `run(key, fn)`.
- **Optimistic overlay** di atas props:
  `removedIds: Set<string>`, `statusOverrides: Record<string, Status>`.
  Pola ini bertahan saat `router.refresh()` mengirim props baru dan tidak memerlukan
  `useEffect` (ramah React Compiler).
- **Idempoten di server** sebagai backstop: like memakai `upsert` dengan
  `ignoreDuplicates`, connect sudah ditangani constraint + update baris `declined`.

### 11.3 Kontrak dialog

```ts
onSend: (note: string) => Promise<boolean>;
```

Dialog menampilkan `sending`, error inline, dan baru menutup saat `true`. Ini memperbaiki
tiga pemanggil sekaligus.

### 11.4 Route feedback

- Skeleton per halaman yang meniru header, filter bar, dan grid/feed.
- `error.tsx` dengan tombol retry; `not-found.tsx` dengan tautan kembali.
- `LinkPending` memakai `useLinkStatus()` di navbar/bottom nav (indikator opacity,
  ukuran tetap, tanpa layout shift).
- Locale switch dan `router.refresh()` memakai `useTransition`; pertahankan query/hash.
- Kirim hanya namespace i18n yang dipakai client component per route/route-group.
- Ubah section landing menjadi Server Component; `Reveal` tetap client wrapper.
- Arm `Reveal` sebelum paint agar tidak flash; snapshot `now` untuk menghindari hydration
  mismatch.
- Empty state dan failure state harus berbeda; `error.tsx` menangkap query yang throw.

---

## 12. Rencana bertahap

| Fase   | Isi                                                                                                                         | Ukuran |
| ------ | --------------------------------------------------------------------------------------------------------------------------- | ------ |
| **A0** | Subset font ikon (4 MB → 24 KB) + read-error envelope (query throw/`{data,error}`)                                          | S      |
| **A1** | Primitive (`Spinner`, `Skeleton`, `MediaImage`, `Dialog`, `ConfirmDialog`, `usePendingAction`, feedback) + key i18n         | M      |
| **A2** | `loading.tsx` per route + `error.tsx` + `not-found.tsx` + `LinkPending` + locale switch transition + i18n filtering         | M      |
| **A3** | Gate 18 handler + kontrak `ConnectDialog` + optimistic overlay + konfirmasi destruktif + perbaikan like + form field errors | L      |
| **A4** | Validasi upload client + status dua tahap + naikkan `bodySizeLimit` (atau direct upload)                                    | S–M    |
| **A5** | Landing server components + `Reveal` tanpa flash + snapshot `now` + metadata/aset dasar                                     | M      |
| **B1** | Batch signed URL + DTO sempit                                                                                               | M      |
| **B2** | Pagination/filter/sort server + page size + `Pagination` URL-based + filter author approved sebelum pagination              | L      |
| **B3** | Admin per tab (route atau lazy query)                                                                                       | M      |
| **B4** | Migrasi index + InitPlan RLS + agregasi like + `profile_age` set-based                                                      | M      |
| **B5** | Upload langsung ke Storage + progress                                                                                       | M      |
| **B6** | Constraint panjang konten di DB + guard `save_persona`                                                                      | S      |

Urutan PR yang disarankan: **A0 → A1 → A2 → A3 → B1 → B2 → B3 → B4 → A4/A5/B5/B6**.

### Keputusan produk yang memblokir

Item yang belum diset **tidak diimplementasikan** dan ditandai `butuh keputusan` di §14.
Rincian opsi + rekomendasi ada di **`docs/plan/loading-feedback-decisions.md`**.

- **D2 arsip profile:** sembunyikan tab palsu atau wire data asli.
- **D4 pagination server:** URL `?page=` vs load-more vs hybrid.
- **D5 loading admin:** route per tab vs lazy query.
- **D7 aset landing:** biarkan CDN vs aset lokal vs Storage.

Keputusan yang sudah diambil sementara: D1 subset ikon, D3 throw ke error boundary,
D6 `bodySizeLimit` 12 MB, D8 inline alert, D9 konfirmasi destruktif.

### Acceptance criteria

- Setiap aksi async: klik ganda cepat menghasilkan **tepat satu** request; tombol
  nonaktif + spinner pada frame yang sama.
- Setiap kegagalan menampilkan pesan yang bisa dibaca dan diumumkan `aria-live`.
- Setiap navigasi app menampilkan skeleton; error route punya tombol retry; tidak ada layar
  blank.
- Font ikon yang diunduh ≤20 KB (bukan 4 MB); tidak ada teks ligatur yang terlihat saat
  load; tidak ada request stylesheet ikon ke pihak ketiga.
- Supabase error tidak pernah dirender sebagai empty state: tampil error + retry.
- Profil tidak menampilkan dispatch/saved/circles/security palsu.
- Dialog: fokus masuk, Tab terkurung, Escape menutup, fokus kembali ke pemicu.
- Form: submit hanya aktif saat field wajib valid; error menunjuk field yang salah.
- Feed 1.000 post: jumlah query konstan (≤5 query DB + 1 batch Storage), bukan linear.
- Discover 1.000 persona: halaman 1 hanya mengambil ±12 baris + 1 batch signed URL.
- Admin tab users tidak mengambil produk/laporan.
- Tidak ada panggilan Storage per item.

---

## 13. Checklist tes manual (fokus double-click & feedback)

1. **Login/register/reset** — klik ganda; pastikan satu request dan spinner tetap sampai
   navigasi.
2. **Posts publish** — klik ganda; lalu upload file 3 MB dan file 12 MB; pastikan pesan
   jelas untuk keduanya.
3. **Like** — klik cepat 3×; hitungan akhir harus konsisten dan tidak revert.
4. **Delete post** — klik ganda sebelum refresh; hanya satu permintaan, ada konfirmasi.
5. **Connect dari Posts** — kirim catatan, lalu klik Connect lagi sebelum refresh; harus
   muncul "Request sent" dan tidak ada request kedua.
6. **Discover** — kirim request, ketik di search, hapus search; state "Request sent" harus
   bertahan.
7. **Connections** — accept/decline dua kali; disconnect dengan konfirmasi.
8. **Admin** — approve/reject/suspend dua kali; toggle publish dan hapus produk; semua
   harus punya pending + hasil yang terlihat.
9. **Navigasi** — throttle jaringan ke Fast 3G, klik semua tab; skeleton harus muncul.
10. **Error** — matikan Supabase lokal saat membuka halaman; error boundary harus muncul
    dengan tombol retry, bukan layar putih.
11. **Locale switch** — klik EN/ES berulang; hanya satu navigasi, ada indikator; query
    `?page=` dan hash `#section` tetap.
12. **Screen reader** — aktifkan VoiceOver/NVDA; aksi mengumumkan "memproses" dan hasil.
13. **Ikon** — buka DevTools → Network, filter Font; ukuran font ikon harus ≤20 KB (bukan
    4 MB), dan tidak ada teks seperti `arrow_forward` yang terlihat saat load.
14. **Read error** — hentikan Supabase, buka Discover/Posts/Connections/Profile; harus muncul
    error + retry, bukan empty state atau redirect ke onboarding/login.
15. **Profile** — pastikan tidak ada dispatch/saved/circles/security palsu; angka tab cocok
    dengan data asli.
16. **Dialog keyboard** — buka Connect/Report/ProductDrawer; Tab tidak keluar dialog,
    Escape menutup, fokus kembali ke tombol pemicu.
17. **Form persona** — kosongkan nama/kota/bio; tombol submit harus nonaktif atau
    menampilkan error per field, bukan banner generik.
18. **Landing 3G** — throttle ke Fast 3G; hero dan teks harus tampil tanpa menunggu font
    ikon 4 MB.

---

## 14. Status perbaikan

Keputusan produk yang belum diset ada di **`docs/plan/loading-feedback-decisions.md`**.
Item di bawah yang bertanda **butuh keputusan** sengaja belum diimplementasikan.

| Temuan                       | Status                 | Bukti / catatan                                                    |
| ---------------------------- | ---------------------- | ------------------------------------------------------------------ |
| P1-01 loading boundary       | ✅ implemented         | `loading.tsx` per route app + group public/app                     |
| P1-02 gate 18 handler        | ✅ implemented         | `usePendingAction` + disabled/spinner di semua panel               |
| P1-03 kontrak ConnectDialog  | ✅ implemented         | `onSend: Promise<boolean>`, dialog tetap terbuka saat gagal        |
| P1-04 error feedback         | ✅ implemented         | `InlineAlert`, toastless inline, `aria-live`                       |
| P1-05 error/not-found        | ✅ implemented         | `(app)/error.tsx`, `[locale]/error.tsx`, `[locale]/not-found.tsx`  |
| P1-06 pagination server      | ⏳ **butuh keputusan** | D4 — URL vs load-more; listing masih memuat semua baris            |
| P1-07 batch signed URL       | ✅ implemented         | `createSignedImageUrls` di persona/posts/connect/marketplace/admin |
| P1-08 upload limit           | ✅ implemented         | `bodySizeLimit: 12mb` + validasi tipe/ukuran client                |
| P2-01 locale switch          | ✅ implemented         | `useLocaleSwitch` + pending/disabled + query/hash dipertahankan    |
| P2-02 refresh indicator      | ✅ implemented         | `RefreshProvider` + top progress bar                               |
| P2-03 konfirmasi destruktif  | ✅ implemented         | `ConfirmDialog` di post/produk/disconnect/review/moderasi          |
| P2-04 state Connect          | ✅ implemented         | Override map + `key` remount dihapus                               |
| P2-05 gambar/avatar          | ✅ implemented         | `MediaImage` skeleton + fallback + `decoding=async`                |
| P2-06 a11y loading           | ✅ implemented         | `Spinner` role status, `aria-busy`, sr-only label                  |
| P2-07 over-fetch             | ✅ implemented         | Kolom eksplisit di listing & detail                                |
| P2-08 index DB               | ✅ implemented         | Migrasi `20261023120000_s5_indexes_constraints.sql`                |
| P2-09 RLS per baris          | ⏳ deferred            | Perlu `EXPLAIN` sebelum mengubah policy                            |
| P2-10 admin per tab          | ⏳ **butuh keputusan** | D5 — route vs lazy query                                           |
| P2-11 `profile_age` N+1      | ⏳ deferred            | Butuh review security untuk view set-based                         |
| P2-12 pagination O(n)        | ⏳ **butuh keputusan** | Ikut D4                                                            |
| P3-01 spinner persona        | ✅ implemented         | `CreatePersonaView` pakai `Spinner`                                |
| P3-02 tombol mati            | ✅ implemented         | Back memakai `router.back()`; Resend palsu dihapus                 |
| P3-03 copy upload            | ⏳ open                | Pesan avatar masih menyebut 10 MB                                  |
| P3-04 key remount            | ✅ implemented         | `PostCard key={post.id}`, `PersonaFeed` tanpa key filter           |
| P3-05 await serial           | ✅ implemented         | Layout count+avatar dan posts feed+avatar paralel                  |
| P3-06 tes/proxy              | ⏳ open                | Belum ada tes pending/double-click                                 |
| B-01 … B-05 batch URL        | ◐ partial              | Batch ✅; pagination/limit masih D4                                |
| B-06 DTO sempit              | ✅ implemented         | Listing persona/posts/connect memakai kolom eksplisit              |
| B-07 limit/range             | ⏳ **butuh keputusan** | D4                                                                 |
| B-08 agregasi like           | ⏳ deferred            | Masih menarik semua baris like                                     |
| B-09 RLS/umur set-based      | ⏳ deferred            | Sama dengan P2-09/P2-11                                            |
| B-10 index badge             | ✅ implemented         | `connections_recipient_status_idx`                                 |
| F2-01 font ikon              | ✅ implemented         | Subset `icon_names`; terukur **23.696 byte / 105 ikon**            |
| F2-02 read error             | ✅ implemented         | `unwrap`/`QueryError` + error boundary                             |
| F2-03 arsip profile palsu    | ⏳ **butuh keputusan** | D2 — sembunyikan vs wire data asli                                 |
| F2-04 form persona           | ✅ implemented         | `canSubmit` mencakup nama/kota/bio                                 |
| F2-05 race accept→decline    | ✅ implemented         | Pending per baris + tombol hasil                                   |
| F2-06 dialog focus trap      | ✅ implemented         | `useDialogA11y` dipakai Connect/Report/ProductDrawer/Confirm       |
| F2-07 form a11y/autocomplete | ◐ partial              | Login + composer; form lain belum semua `aria-describedby`         |
| F2-08 i18n/landing payload   | ◐ partial              | Landing jadi Server Component; filtering namespace belum           |
| F2-09 constraint DB/RPC      | ✅ implemented         | Migrasi constraint `not valid` (berlaku untuk baris baru)          |
| F2-10 Reveal flash           | ✅ implemented         | `useIsomorphicLayoutEffect` sebelum paint                          |
| F2-11 hydration waktu        | ◐ partial              | `suppressHydrationWarning` pada waktu relatif                      |
| F2-12 profile blank          | ✅ implemented         | `notFound()` + throw pada query error                              |
| F2-13 composer validation    | ✅ implemented         | `maxLength`, counter, error upload/publish                         |
| F2-14 gambar eksternal       | ◐ partial              | `MediaImage` fallback; aset masih Google CDN (D7)                  |
| F2-15 metadata/aset dasar    | ✅ implemented         | `icon.svg`, `manifest`, `robots`, `sitemap`, `metadataBase`, OG    |
| F2-16 locale switch params   | ✅ implemented         | Query + hash dipertahankan                                         |
| F2-17 prefill serial         | ✅ implemented         | `Promise.all` avatar/contact/private                               |
| F2-18 umur dua cara          | ✅ implemented         | `ageFromDateOfBirth`                                               |
| F2-19 like state             | ✅ implemented         | Key halaman dihapus; error sr-only                                 |
| F2-20 fixture mati           | ⏳ open                | Belum dihapus                                                      |
| F2-21 origin header          | ✅ implemented         | Production wajib `NEXT_PUBLIC_SITE_URL`                            |
| F2-22 coverage tes           | ◐ partial              | Tes hook pending ditambah; e2e double-click belum                  |
| F2-23 dialog effect          | ✅ implemented         | `useDialogA11y` menyimpan callback di ref                          |
| F2-24 aksi in-flight         | ◐ partial              | ConnectDialog memblokir close saat sending                         |
| F2-25 CTA/footer             | ◐ partial              | Admin link footer dihapus; landing CTA belum diubah                |

### Verifikasi implementasi (2026-10-23)

- `npm run typecheck` — pass.
- `npm run lint` — pass.
- `npm test` — 7 files / **30 tests** pass.
- `npm run build` — pass (37 halaman, termasuk `/icon.svg`, `/manifest.webmanifest`,
  `/robots.txt`, `/sitemap.xml`).
- `npm run format:check` — pass.
- Font ikon subset diukur ulang: **23.696 byte** untuk 105 ikon (sebelumnya 4.001.808).
- E2E **belum dijalankan** pada iterasi ini (butuh Supabase lokal).

---

## 15. Follow-up UI (2026-10-24)

Perbaikan setelah review landing/auth. Semua sudah diimplementasikan dan lolos gate.

| ID    | Temuan                                                      | Status         | Perubahan                                                                 |
| ----- | ----------------------------------------------------------- | -------------- | ------------------------------------------------------------------------- |
| F2-26 | Burger landing tampil sebagai teks "MENU"                   | ✅ implemented | `menu` + `hourglass_top` ditambahkan ke subset ikon                       |
| F2-27 | Foto hero lambat tampil / `onLoad` terlewat sebelum hydrate | ✅ implemented | cek `img.complete` di `MediaImage` + preload hero                         |
| F2-28 | Card Sofia tampil di layar kecil                            | ✅ implemented | card disembunyikan di bawah `lg`                                          |
| F2-29 | Posisi scroll EN/ES berbeda (cache/history per locale)      | ✅ implemented | `useLocaleSwitch` menyimpan hash + `scrollY`, restore setelah locale baru |
| F2-30 | Header auth menampilkan Sign in/Register/profile            | ✅ implemented | `(auth)` + `SiteHeader mode="content"`                                    |
| F2-31 | Footer auth penuh dan copyright 2024                        | ✅ implemented | `SiteFooter variant="auth"`, copyright 2026 + motto + legal links         |
| F2-32 | Privacy Policy belum punya route                            | ✅ implemented | `/[locale]/privacy` + `/support`, `/safety`, `/standards` placeholder     |
| F2-33 | Remember me tidak berfungsi, default checked                | ✅ implemented | default unchecked; cookie 30 hari vs session; preferensi `gl-remember`    |
| F2-34 | Teks TLS 1.3 + chip tracker/policies di login               | ✅ implemented | dihapus                                                                   |
| F2-35 | Dua header dan tiga footer dengan layout berbeda            | ✅ implemented | `SiteHeader` landing/content + `SiteFooter` 4 variant                     |
| F2-36 | Back link login/register ada di kanan header                | ✅ implemented | `AuthBackLink` di kiri atas card; recovery di atas step tracker           |
| F2-37 | Recovery support items tidak berfungsi                      | ✅ implemented | Support/Safety/Standards jadi link placeholder; SSL/support note dihapus  |
| F2-38 | `/forgot-password/sent` bisa diakses langsung               | ✅ implemented | guard cookie `gl-reset-requested` 30 menit                                |

### Verifikasi follow-up

- `npm run typecheck` — pass.
- `npm run lint` — pass.
- `npm test` — 8 files / **34 tests** pass (termasuk tes cookie remember-me).
- `npm run build` — pass; route `/[locale]/privacy`, `/support`, `/safety`, `/standards` terdaftar.
- `npm run format:check` — pass.
- Font ikon subset diukur ulang: **23.916 byte** untuk 107 ikon.
- Uji manual yang masih disarankan: cookie `gl-remember` setelah login unchecked/checked, dan back/scroll behavior di browser nyata.
