# GlobalLinkup — Audit Fungsi & Logika (2026-10-20)

**Commit diaudit:** `39b0a28` (branch `dev`)
**Metode:** static review end-to-end (UI → Server Action → RLS/DB → balik ke UI), inspeksi
migrasi/seed/policy, tanpa mengubah kode dan tanpa menjalankan mutasi.
**Database:** lokal, sudah `db:reset`; seed standar.
**Di luar cakupan:** polish visual, performa non-N+1, cutover cloud, fitur baru.

> Semua temuan di bawah **terkonfirmasi dari kode** kecuali yang ditandai
> _(perlu verifikasi runtime)_. Langkah reproduksi memakai akun seed
> (`Password123`): `admin@globallinkup.test`, `sofia.martinez@example.com`,
> `mateo.silva@example.com`, `pending.user@example.com`,
> `rejected.user@example.com`, `suspended.user@example.com`.

---

## 1. Ringkasan

| Severity | Jumlah | Inti                                                                                                                                                                                                                                                    |
| -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0**   | 0      | Tidak ada kebocoran data/kontak lintas-user atau eskalasi role yang ditemukan. RLS kontak, guard role, dan gerbang admin terbukti benar.                                                                                                                |
| **P1**   | 10     | Alur must-have rusak/tidak ada: reset password 404, pagination menduplikasi item, state Connect salah, re-request mati, identitas navbar palsu, dossier mock membocorkan kontak palsu, search/filter & detail persona & report & edit produk belum ada. |
| **P2**   | 16     | Silent success, media/storage, edge state, kontrol UI yang tidak berfungsi, gap moderasi.                                                                                                                                                               |
| **P3**   | 8      | Integritas kecil, fixture mati, coverage tes, catatan operasional.                                                                                                                                                                                      |

Gate saat audit (terakhir diketahui): `db:test` 38/38, unit 25/25, `@auth` e2e 15/15,
default e2e 9/9, build bersih. **Tidak** ada tes untuk reset callback, pagination,
re-request, CRUD admin, maupun mapper.

---

## 2. P1 — alur must-have

### P1-01 · Pagination menduplikasi item

**Bukti:** `src/features/shared/use-pagination.ts:24-28`

```ts
const pageItems = Array.from({ length: Math.min(pageSize, items.length) }, (_, offset) => {
  const index = start + offset;
  return items[index % items.length]; // ← memutar balik ke awal
});
```

Slice "diputar" agar setiap halaman penuh. Dulu untuk data fixture; sekarang data nyata,
jadi halaman terakhir menampilkan ulang item pertama.

**Dampak:** semua listing.

- Discover Sofia (5 persona, page size 4): halaman 2 = Reset Flow User **+ Camila, Elena, Lucas lagi**.
- Marketplace (6 produk, size 4): halaman 2 = 2 produk baru **+ 2 produk pertama lagi**.
- Posts (3 post, size 2): halaman 2 = post ke-3 **+ post pertama lagi**.

**Repro:** login Sofia → `/en/discover` → klik "2". Bandingkan kartu dengan halaman 1.
**Saran:** `items.slice(start, start + pageSize)` (tanpa modulus); `totalPages` tetap.

---

### P1-02 · Reset password berakhir di 404 (`/en/en/reset-password`)

**Bukti:**

- `src/features/auth/actions.ts:123` — `next=/${locale}/reset-password`
- `src/app/[locale]/auth/callback/route.ts:18-28` — `new URL(\`/${locale}${next}\`, ...)`

`next` sudah berisi locale, lalu locale ditambahkan lagi → **`/en/en/reset-password`**,
tidak cocok dengan route `/[locale]/reset-password` → 404. Flow FR-1.4/FR-1.5 tidak pernah
sampai ke form password baru.

**Repro:** `/en/forgot-password` → isi email seed → buka link reset dari Inbucket
(`http://127.0.0.1:54524` atau sesuai `supabase status`) → amati URL 404.
**Saran:** kirim `next=/reset-password` (tanpa locale) **atau** redirect ke `next` apa adanya.
Setelah itu verifikasi cookie recovery benar-benar terpasang (lihat P2-13).

---

### P1-03 · Re-request setelah decline selalu gagal diam-diam

**Bukti:**

- `supabase/seed.sql:250-251` — Sofia → Lucas berstatus `declined`.
- `src/features/persona/queries.ts:36-37` — `declined` tidak dipetakan (jatuh ke `none`).
- `src/features/persona/components/persona-feed.tsx:36-40` — UI memanggil `sendConnectRequestAction`, lalu hanya bereaksi bila `ok`.
- `src/features/connect/actions.ts:33-39` — selalu **INSERT**; unique index
  `connections_unique_pair` (`initial_schema.sql:94-95`) menolak pasangan yang sudah ada.
- `src/features/connect/actions.ts:80-82` — `reRequestConnectionAction` (UPDATE
  `declined → requested`) ada tetapi **tidak dipakai siapa pun**.

**Dampak:** FR-5.6/OQ-2 tidak berfungsi; error tidak pernah tampil ke user.
**Repro:** login Sofia → Discover → Lucas Varela → Connect → isi catatan → Send.
Dialog menutup, tidak ada request, tidak ada pesan.
**Saran:** petakan `declined` → state `none` + flag `canReRequest`; panggil
`reRequestConnectionAction` (UPDATE) untuk baris yang sudah ada, dan tampilkan error.

---

### P1-04 · State Connect salah arah (RECEIVED diperlakukan sebagai REQUESTED)

**Bukti:**

- `src/features/persona/queries.ts:32-38` — `requested` dipetakan tanpa melihat sisi
  (requester vs recipient); FR-5.5 membedakan `REQUESTED` dan `RECEIVED`.
- `src/features/persona/components/persona-feed.tsx:165-172` — semua `requested` → "Request Sent".
- `src/features/posts/queries.ts:90-91` — feed hanya menghitung `connected`; status request
  tidak pernah dikirim.
- `src/features/posts/components/posts-view.tsx:125` — `requested={false}` hardcoded.

**Dampak:**

1. Sofia menerima request dari Mateo, tetapi di Discover Mateo tampil **"Request Sent"**
   (padahal dia yang mengirim). Harusnya `RECEIVED` + Accept/Decline.
2. Di feed, Mateo tampil **"Connect"**; klik → kirim request duplikat → unique violation →
   gagal tanpa pesan.

**Repro:** login Sofia → Discover (Mateo) dan Posts (post Mateo) → klik Connect di feed.
**Saran:** kirim `viewerState` (`none|requested|received|connected|declined`) dari query;
render Accept/Decline untuk `received`. `getFeed` perlu ikut menghitung state.

---

### P1-05 · Identitas navbar hardcoded "Sofia Martínez" untuk semua user

**Bukti:** `src/components/layout/navbar.tsx:150,158` memakai `CURRENT_USER`;
`src/lib/brand.ts:11-15` berisi nama + avatar eksternal Sofia. Layout hanya mengirim
`isAdmin` dan `pendingRequests` (`src/app/[locale]/(app)/layout.tsx:17-22`).

**Dampak:** Mateo/admin/pending melihat nama & foto Sofia di pill profil (desktop `xl`)
dan sheet mobile. Avatar eksternal juga bisa gagal dimuat (hotlink Google).
**Repro:** login `mateo.silva@example.com` → lihat pill kanan atas.
**Saran:** teruskan `display_name` + avatar (signed) dari layout, hapus `CURRENT_USER`.

---

### P1-06 · Dossier mock di Discover + tombol "Simulate acceptance" membuka kontak palsu

**Bukti:** `src/features/persona/components/persona-dossier.tsx:8,25-27,36,48,136-150,187-190`
memakai `DOSSIER` fixture; dirender permanen di sidebar Discover
(`discover-view.tsx:114`). Tombol "Simulate acceptance" (`setRevealed(true)`) langsung
menampilkan Instagram/WhatsApp/email palsu.

**Dampak:** melanggar janji produk "kontak hanya terbuka setelah koneksi diterima"
(FR-3.3/FR-5.4), walaupun datanya fixture. Sangat menyesatkan di UI produksi dan
menutupi ketiadaan persona detail (P1-08).
**Repro:** login Sofia → Discover → klik "Simulate acceptance" di kartu kanan.
**Saran:** hapus/ubah menjadi preview statis tanpa reveal, atau ganti dengan detail
persona nyata yang datanya diambil dari baris terpilih.

---

### P1-07 · Search & filter Discover tidak berfungsi

**Bukti:** `src/features/persona/components/search-ribbon.tsx:24-28` (input tanpa state),
`:44-51` ("Clear filters" hanya set region), `:56-72` (region hanya mengubah tampilan chip),
`:74-93` (Languages/Interests tidak punya handler). `discover-view.tsx:111` merender
`PersonaFeed` dengan daftar penuh — region tidak pernah dipakai.

**Dampak:** FR-4.2 (cari/filter nama, negara, kota, interest) belum ada. Kontrol terlihat
aktif tetapi tidak mengubah hasil.
**Repro:** Discover → ketik "Mateo" atau pilih region → daftar tidak berubah.
**Saran:** sambungkan ke query (server-side `ilike` + filter kolom) atau filter client-side
yang benar-benar memotong `personas`.

---

### P1-08 · Persona detail view tidak ada

**Bukti:** tidak ada route `src/app/[locale]/(app)/persona/**` (lihat daftar route);
`PersonaFeed` hanya punya tombol Connect (`persona-feed.tsx:174-184`). FR-4.3 meminta
detail persona + state Connect.

**Dampak:** user tidak bisa melihat bio, interest, bahasa, dan status koneksi satu persona
sebelum memutuskan connect; kartu Discover hanya menampilkan nama/umur/lokasi/language chip.
**Repro:** Discover → klik kartu (bukan tombol) → tidak terjadi apa-apa.
**Saran:** route `/[locale]/persona/[id]` (RLS-approved) + tombol Connect di sana.

---

### P1-09 · Marketplace: search, sort, dan filter tidak berfungsi

**Bukti:** `src/features/marketplace/components/marketplace-view.tsx:102-106` (input tanpa
state/handler); `:117-129` (`<select>` tanpa `onChange`/state); pemanggilan
`usePagination(products, PAGE_SIZE)` memakai daftar penuh.

**Dampak:** FR-7.3 (browse, search, filter) belum ada. Sort "Price low/high", "Newest"
tidak berefek.
**Repro:** `/en/marketplace` → ketik "coffee" atau ganti sort → katalog tidak berubah.
**Saran:** state `query`/`sort`, `useMemo`/derived list, lalu paginate hasil filter.
Catatan: kolom `category` sudah di-drop (migrasi `20261019140000`), jadi "filter" harus
didefinisikan ulang (lihat P2-14).

---

### P1-10 · Report user/post tidak bisa dibuat dari UI

**Bukti:** tidak ada pemanggilan insert `reports` di `src/features/**` (grep hanya menemukan
admin read/resolve). `AdminModerationTab` membaca `reports` (`admin/queries.ts:71-76`),
tetapi seed tidak punya report dan user tidak punya tombol Report. RLS insert sudah siap
(`initial_schema.sql:499-506`).

**Dampak:** FR-8.1/FR-8.2/FR-9.4 tidak bisa diuji end-to-end; tab Moderation selalu kosong
di database bersih.
**Repro:** login user mana pun → tidak ada aksi Report di post/persona; login admin →
Moderation kosong.
**Saran:** tombol Report di post & persona + dialog alasan + Server Action
`createReportAction` (Zod + RLS).

---

### P1-11 · Admin tidak bisa mengedit produk

**Bukti:** `src/features/admin/actions.ts` hanya punya `createProductAction`,
`setProductPublishedAction`, `deleteProductAction`; `admin/components/marketplace-tab.tsx`
hanya merender publish/unpublish + delete (`:247-268`). Tidak ada `updateProductAction`
maupun tombol edit.

**Dampak:** FR-7.1/FR-9.3 ("create, edit, delete") tidak lengkap. Salah harga/nama/origin
harus dihapus lalu dibuat ulang (id + gambar lama hilang).
**Repro:** Admin → Marketplace → tidak ada tombol edit pada baris produk.
**Saran:** form edit (prefill) + `updateProductAction` dengan schema yang sama.

---

## 3. P2 — perilaku salah / gap

### P2-01 · Aksi admin melaporkan sukses padahal 0 baris berubah

**Bukti:** `admin/actions.ts:73-84` (resolve report), `:96-107` (remove post), `:172-180`
(publish), `:192-200` (delete) tidak memakai `.select()`/cek jumlah baris. Hanya
`reviewPersonaAction` yang sudah benar (`:42-53`).
**Dampak:** id tidak ada/RLS menolak → `{ok:true}` → UI refresh, tidak ada perubahan.
**Repro:** panggil action dengan `postId` acak (devtools) → sukses palsu.

### P2-02 · Form produk: harga tidak valid = gagal senyap

**Bukti:** `admin/components/marketplace-tab.tsx:63` `Math.round(Number(price || "0") * 100)`;
input "12,50"/"abc" → `NaN` → Zod menolak → action `invalid` → UI tidak menampilkan error
(`:73-82`).
**Dampak:** admin mengira produk tersimpan.
**Repro:** Admin → isi harga `12,50` → Publish → form kosong? Tidak; tidak terjadi apa-apa
tanpa pesan.

### P2-03 · Drawer produk menampilkan SKU & spesifikasi kosong

**Bukti:** form admin hanya mengirim name/price/origin/phone/description (`marketplace-tab.tsx:61-70`);
`product-drawer.tsx:88-90` mencetak `SKU:` kosong dan `:128-144` merender 6 baris spec
kosong (fulfillment default). `summary` dipetakan (`queries.ts:83`) tetapi tidak dirender.
**Dampak:** produk baru terlihat "setengah jadi"; berbeda dari 6 produk seed.
**Repro:** buat produk baru → buka drawer-nya.

### P2-04 · Hanya satu gambar per produk

**Bukti:** `createProductAction` menyisipkan satu baris `marketplace_product_images`
(`admin/actions.ts:152-156`); form hanya satu input file. Skema mendukung banyak gambar.
**Dampak:** FR-7.6 (multiple images) belum terpenuhi untuk produk baru.

### P2-05 · Path gambar post tidak divalidasi; file tidak pernah dihapus

**Bukti:** `posts/actions.ts:28-37` menerima `imagePath` apa adanya (tidak dicek prefix
`<uid>/`); `:76-81` soft-delete hanya mengubah status. `admin/actions.ts:96-103` juga tidak
menghapus objek.
**Dampak:** (a) user bisa menempelkan path objek user lain ke post-nya; (b) gambar post yang
dihapus/dimoderasi tetap bisa di-list & di-sign oleh semua approved user
(`s3_storage.sql:65-69` select bucket-wide) — moderasi tidak benar-benar menyembunyikan gambar.
**Repro:** hapus post sendiri → gambar masih bisa dibuka lewat signed URL lama/listing.

### P2-06 · User pending/rejected tidak bisa melihat avatar yang mereka unggah

**Bukti:** policy `avatars` select hanya `is_approved()` (`s3_storage.sql:26-29`);
`create-persona/page.tsx:38-43` meminta signed URL sebagai user itu (rejected → null).
**Dampak:** halaman resubmit menampilkan placeholder walau file sudah terunggah.
**Repro:** login `rejected.user@example.com` → `/en/create-persona` → avatar kosong.
(Seed memang tanpa objek; uji dengan upload baru.)

### P2-07 · Batas upload tidak konsisten (10 MB vs 5 MB)

**Bukti:** `src/lib/storage.ts:12` `MAX_IMAGE_BYTES = 10MB`; bucket `avatars`
`file_size_limit = 5242880` (`s3_storage.sql:13`).
**Dampak:** file 5–10 MB lolos validasi action lalu gagal di storage dengan error generik
(`uploadImageAction` → `unknown`).
**Repro:** unggah avatar 6 MB.

### P2-08 · Suspend tidak menyembunyikan konten / mencabut kontak

**Bukti:** `posts_select_visible` hanya mengecek status **viewer**
(`initial_schema.sql:409-416`); `getFeed` tidak memfilter penulis (`posts/queries.ts:29-39`),
sehingga post penulis suspended tetap muncul dengan nama/avatar kosong (RLS
`profiles_public` menyembunyikannya). `contact_details_select_connection` hanya
`are_connected` (`initial_schema.sql:348-351`) sehingga kontak tetap terbuka bila peer
disuspend.
**Dampak:** moderasi tidak konsisten; kartu "hantu".
**Repro:** suspend Mateo (admin) → buka feed → post-nya tetap ada tanpa nama; cek kontak
koneksi lama.

### P2-09 · Reconnect asimetris setelah disconnect

**Bukti:** disconnect = `accepted → declined` (`connect/actions.ts:76-78`); trigger hanya
mengizinkan `declined → requested` oleh **requester asli** (`s1_fixes.sql:48-53`).
**Dampak:** pihak yang bukan requester asli tidak pernah bisa mengirim request baru ke
pasangan itu (unique pair + trigger), tanpa jalan keluar di UI.

### P2-10 · Kolom `contact_details.email` mati

**Bukti:** skema punya `email` (`initial_schema.sql:77`), seed mengisinya
(`seed.sql:234-239`), tetapi form persona tidak mengumpulkan email dan query tidak pernah
membacanya (`connect/queries.ts:88-93`, `profile/queries.ts:49-72`).
**Dampak:** channel email tidak pernah tampil; data seed tidak terpakai.

### P2-11 · Kontrol yang terlihat aktif tetapi tidak melakukan apa pun

- `connections-view.tsx:167-171` search tanpa state; `:174-199` region hanya mengubah chip;
  `:93-104` "Export vCard" tanpa handler.
- `sent-requests-panel.tsx:77-87` "View note" tanpa handler; tidak ada withdraw pending
  (bukan wajib PRD, tetapi tombolnya ada).
- `login-view.tsx:224-235` "Remember device" tidak memengaruhi sesi.
- Discover "Refine criteria", Languages, Interests (`search-ribbon.tsx`) tanpa handler.
  **Dampak:** user menekan kontrol dan tidak terjadi apa-apa (FR-10.3 semangatnya).

### P2-12 · Like: race & state tidak sinkron

**Bukti:** `post-card.tsx:31-41` mengirim toggle tanpa penjagaan in-flight; dua klik cepat
bisa mengirim insert+delete dengan urutan tak tentu. `useState(post.likedByViewer/likes)`
tidak di-reset saat props berubah setelah `router.refresh()`.
**Dampak:** hitungan bisa berbeda dari DB sampai reload penuh.

### P2-13 · Alur signup mengasumsikan langsung punya sesi

**Bukti:** `signUpAction` (`auth/actions.ts:68-80`) tidak mengirim `emailRedirectTo`, lalu
langsung redirect ke `/create-persona`. Lokal `enable_confirmations = false`
(`supabase/config.toml:228`), tetapi bila produksi mengaktifkannya, link konfirmasi mendarat
di root dan tidak ada handler yang menukar code.
**Dampak:** onboarding buntu di deployment dengan konfirmasi email aktif.
**Repro:** ubah config `enable_confirmations = true`, daftar akun baru.
**Saran:** tentukan kebijakan (matikan konfirmasi, atau tambah `emailRedirectTo` ke
`/[locale]/auth/callback?next=/create-persona`).

### P2-14 · Gap admin: Settings & kategori/availability produk

**Bukti:** tidak ada tab Settings (FR-9.5); `Admin` hanya users/marketplace/moderation
(`admin-view.tsx`). Migrasi `20261019140000_product_form_rework.sql` menghapus
`category` + `availability` (FR-7.2/7.8). Kontak concierge hanya dari seed
(`platform_settings`, tanpa UI).
**Dampak:** admin tidak bisa mengubah kontak marketplace; deviasi PRD perlu dikonfirmasi
(disengaja karena "UI menang").

### P2-15 · Account settings tidak ada

**Bukti:** profil hanya punya Edit persona + Logout (`dossier-header.tsx:99-110`); tidak ada
ganti password/akun. FR-3.5 menyebut akses password/account settings.
**Dampak:** satu-satunya cara ganti password adalah alur reset (yang saat ini 404, P1-02).

### P2-16 · `/create-persona` bisa dibuka & disubmit anonim

**Bukti:** `create-persona/page.tsx:85-89` tidak memanggil `getCurrentUser`;
`savePersonaAction` mengembalikan `{ok:true, redirectTo:"/login"}` (`persona/actions.ts:23-24`).
**Dampak:** form onboarding tampil publik; user mengisi lalu ditendang ke login tanpa pesan.

### P2-17 · N+1 signed URL

**Bukti:** `posts/queries.ts:67-79` (sign gambar + avatar per post di dalam `Promise.all`),
`admin/queries.ts:94-144`, `connect/queries.ts:159`. Satu request bisa membuat puluhan
panggilan storage.
**Dampak:** feed/admin melambat saat data bertambah (bukan bug fungsional, tapi terasa).

### P2-18 · Media seed tidak ada → semua gambar placeholder

**Bukti:** `seed.sql:124,184,258-260,317-323` hanya path; tidak ada objek di bucket. Signed
URL mengembalikan null → komponen fallback. (Sudah tercatat sebagai follow-up S4.)

---

## 4. P3 — integritas kecil / operasional

| ID    | Temuan                                                                                                                                                             | Bukti                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| P3-01 | `profile_age(uuid)` security-definer & granted ke authenticated: siapa pun bisa query umur profile id apa pun (termasuk pending/suspended/admin).                  | `s1_fixes.sql:196-212`                                                 |
| P3-02 | Author bisa mengubah `created_at` post sendiri (tidak dijaga trigger), sehingga urutan feed bisa dimanipulasi.                                                     | `initial_schema.sql:427-431`, `s1_fixes.sql:96-118`                    |
| P3-03 | Kedua pihak bisa mengubah `intro`/`topic` selama status tidak berubah (penerima bisa menulis ulang catatan pengirim).                                              | `s1_fixes.sql:27-29`, `initial_schema.sql:389-401`                     |
| P3-04 | Fixture mati masih terbundel: `marketplace/data.ts` (PRODUCTS/categories), `profile/data.ts` (ACTIVITY/DISPATCHES), `persona/data.ts` (DOSSIER).                   | `marketplace/data.ts:236-243`, `profile/components/activity-panel.tsx` |
| P3-05 | Admin users hanya `.eq("role","user")`; admin tidak bisa suspend admin lain dari UI.                                                                               | `admin/queries.ts:69`                                                  |
| P3-06 | Tidak ada rate limit pada action (connect/like/report/upload). FR-1.8 opsional.                                                                                    | `connect/actions.ts`, `media/actions.ts`                               |
| P3-07 | Coverage tes tipis: 5 file unit (env/utils/validasi/legal), e2e hanya auth + marketing; tidak ada tes reset callback, pagination, re-request, CRUD admin, mapper.  | `find src -name '*.test.*'`, `tests/e2e`                               |
| P3-08 | `db:test` sensitif urutan: e2e mengubah seed (approve pending, resubmit rejected), jadi `db:test` harus didahului `db:reset` (CI sudah begitu; lokal mudah salah). | `.github/workflows/db.yml`                                             |
| P3-09 | Avatar tidak bisa dikosongkan: `coalesce(v_avatar, avatar_url)`.                                                                                                   | `s4_avatar.sql:97`                                                     |

---

## 5. Yang sudah benar (dicek, tidak ada temuan)

- **RLS kontak:** hanya owner, accepted connection (`are_connected`), atau admin
  (`initial_schema.sql:342-368`). Tidak ada kebocoran via `profiles`.
- **Guard role/approval:** `protect_profile_privileges` memblokir self-promote/self-approve,
  hanya mengizinkan `rejected → pending` oleh owner (`s2_resubmit_guard.sql:17-37`).
- **Transisi koneksi:** trigger menolak requester menerima request sendiri; parties
  immutable (`s1_fixes.sql:16-58`).
- **`save_persona`:** satu transaksi (profiles + private + contact), `auth.uid()`, validasi
  minimal satu channel, dan validasi prefix folder avatar (`s4_avatar.sql:46-66`).
- **Admin:** `requireAdmin` di route + cek role di setiap action; tanpa service-role.
- **`z.uuid()`** sudah diganti `uuidSchema` (perbaikan S3) — tidak ada sisa.
- **i18n:** EN/ES paritas 0 selisih; tidak ada key yang hanya di satu bahasa.
- **Storage write:** path `<uid>/…` untuk avatar/post, admin-only untuk produk.
- **Auth state:** pending/rejected/suspended → `/verify`; approved → app; anon → login.
- **Admin approval:** end-to-end terbukti (e2e).

---

## 6. Checklist tes manual (urut, satu reset)

**Persiapan**

```bash
npm run db:start
npm run db:reset
npm run dev
```

(Inbucket untuk email lokal: cek `npm run db:status -- -o env` → `INBUCKET_URL`.)

**A. Auth**

1. Login `mateo` → cek pill navbar (P1-05).
2. Forgot password `sofia` → buka email → **catat URL** (P1-02).
3. Login `rejected` → `/create-persona` → apakah avatar tampil (P2-06).
4. Login `suspended` → `/verify` (harus notice).

**B. Discover** 5. Sofia → Discover → halaman 2 (P1-01). 6. Cek Mateo: "Request Sent" padahal dia pengirim (P1-04). 7. Klik "Simulate acceptance" (P1-06). 8. Ketik di search / pilih region (P1-07). 9. Lucas → Connect → catat hasil (P1-03).

**C. Connections** 10. Search, region, Export vCard (P2-11). 11. Disconnect Camila → login Camila → coba Connect ke Sofia (P2-09).

**D. Posts** 12. Halaman 2 feed (P1-01). 13. Klik Connect pada post Mateo (P1-04). 14. Like dobel cepat (P2-12). 15. Hapus post sendiri → cek gambar (P2-05).

**E. Marketplace** 16. Search "coffee", ganti sort (P1-09). 17. Admin → buat produk harga `12,50` (P2-02) → buka drawer (P2-03). 18. Cari tombol edit produk (P1-11).

**F. Admin** 19. Approve `pending` (harusnya sudah jalan). 20. Suspend Mateo → cek feed & kontak (P2-08). 21. Moderation tab (kosong; P1-10).

**G. Profile** 22. Cek channel email tidak muncul (P2-10). 23. Cek arsip aktivitas (fixture, known).

---

## 7. Urutan perbaikan yang disarankan

1. **P1-02** (reset 404) — satu baris, memblokir flow auth.
2. **P1-01** (pagination) — satu fungsi, dampak di semua listing.
3. **P1-03/P1-04** (state connect + re-request) — satu perubahan query/DTO + dua action.
4. **P1-05** (navbar) — teruskan profil dari layout.
5. **P1-06/P1-08** (mock dossier & detail persona) — hapus mock, tambah route detail.
6. **P1-07/P1-09** (search/filter) — query + state.
7. **P1-10/P1-11** (report UI, edit produk).
8. P2 storage/media & silent failures.
9. P3 + coverage tes.

> Semua perbaikan sebaiknya disertai tes: unit untuk `usePagination`/mapper, e2e untuk
> reset callback, re-request, pagination, dan CRUD admin.

---

## 8. Status perbaikan (2026-10-20, belum di-commit)

Perbaikan dikerjakan langsung di working tree; **belum ada commit**. Jalankan
`npm run db:reset` untuk menerapkan migrasi baru
`supabase/migrations/20261020120000_avatars_owner_read.sql`.

| Temuan                         | Status      | Perubahan                                                                                                                                         |
| ------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-01 pagination               | ✅ fixed    | `usePagination` memakai `slice`; unit test baru (`use-pagination.test.ts`).                                                                       |
| P1-02 reset 404                | ✅ fixed    | `next=/reset-password` (locale hanya ditambahkan callback).                                                                                       |
| P1-03 re-request               | ✅ fixed    | `sendConnectRequestAction` menangani `23505` → UPDATE baris `declined` milik pengirim.                                                            |
| P1-04 state Connect            | ✅ fixed    | Discover/feed menghitung `requested`/`received`/`declined`; feed punya Accept. Discover menampilkan Accept/Decline untuk inbound.                 |
| P1-05 navbar                   | ✅ fixed    | Layout mengirim nama + avatar signed; `CURRENT_USER` tidak dipakai lagi.                                                                          |
| P1-06 mock dossier             | ✅ fixed    | `persona-dossier.tsx` + `DOSSIER` dihapus; tidak ada lagi "Simulate acceptance".                                                                  |
| P1-07 search/filter Discover   | ✅ fixed    | `DiscoverWorkspace` mengontrol query + region; filter benar-benar memotong daftar.                                                                |
| P1-08 persona detail           | ✅ fixed    | Route `/[locale]/persona/[id]` + `getPersonaDetail` + `PersonaDetailView`.                                                                        |
| P1-09 marketplace search/sort  | ✅ fixed    | State query/sort memfilter & mengurutkan sebelum pagination.                                                                                      |
| P1-10 report                   | ✅ fixed    | `createReportAction` + `ReportDialog` di post dan persona detail.                                                                                 |
| P1-11 edit produk              | ✅ fixed    | `updateProductAction` + mode edit pada form admin.                                                                                                |
| P2-01 silent admin writes      | ✅ fixed    | `.select("id")` + cek 0 baris.                                                                                                                    |
| P2-02 harga invalid            | ✅ fixed    | Parse harga + pesan error; kegagalan upload juga dilaporkan.                                                                                      |
| P2-03 drawer kosong            | ✅ fixed    | SKU & baris spec kosong tidak dirender.                                                                                                           |
| P2-05 path gambar post         | ◐ partial   | Prefix `<uid>/` divalidasi; pembersihan objek storage belum.                                                                                      |
| P2-06 avatar pending           | ✅ fixed    | Policy `avatars_select_own`.                                                                                                                      |
| P2-07 limit upload             | ✅ fixed    | Batas per-bucket (avatar 5 MB).                                                                                                                   |
| P2-08 suspend                  | ◐ partial   | Post penulis non-approved tidak lagi dirender di feed; kontak koneksi lama belum dicabut.                                                         |
| P2-11 kontrol inert            | ◐ partial   | Search/region Connections aktif, "View note" berfungsi, tombol vCard dihapus, kontrol Discover yang mati dihapus. "Remember device" masih hiasan. |
| P2-12 race like                | ✅ fixed    | Guard `liking` saat request berjalan.                                                                                                             |
| P2-16 create-persona anonim    | ✅ fixed    | Halaman redirect ke login tanpa sesi.                                                                                                             |
| P2-04/09/10/13/14/15/17/18, P3 | ⏳ deferred | Perlu keputusan produk/migrasi, lihat §3–§4.                                                                                                      |

**Verifikasi yang dijalankan setelah perubahan** dicatat di ringkasan percakapan
(format/lint/typecheck/unit/db:test/build/e2e).

### Verifikasi runtime (2026-10-20)

| Alur                       | Hasil                                                                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Reset password (P1-02)     | Email Mailpit → link → berakhir di `http://localhost:3000/en/reset-password`, form password tampil (bukan 404).                     |
| Re-request decline (P1-03) | Sofia → Lucas → Connect → baris `c0000000-…-003` berubah `declined → requested` dan catatan baru tersimpan; UI jadi "Request Sent". |
| State received (P1-04)     | Sofia melihat Mateo dengan tombol **Accept/Decline**, bukan "Request Sent".                                                         |
| Pagination (P1-01)         | Discover halaman 2 unik; Marketplace halaman 2 = 2 produk tersisa (tidak menduplikasi).                                             |
| Search marketplace (P1-09) | Query "coffee" hanya menyisakan produk Chiapas; produk lain hilang.                                                                 |
| Report (P1-10)             | Report post tersimpan (`reports`: 1 baris, target `post`).                                                                          |
| Persona detail (P1-08)     | `/en/persona/<id>` merender bio; Mateo = Accept/Decline, Camila = Connected.                                                        |
| Edit produk (P1-11)        | Admin ubah harga → `price_cents = 99900` tersimpan, mode edit tertutup.                                                             |
