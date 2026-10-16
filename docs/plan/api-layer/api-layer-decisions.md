# GlobalLinkup — Daftar keputusan API layer (S1 & S2)

Dokumen ini dibuat supaya **orang lain bisa ikut membantu menjawab**. Tidak perlu
paham seluruh kode; cukup baca konteks singkat + glosarium di bawah.

Status: **TERKUNCI (2026-10-16).** Semua item mengikuti **Rekomendasi**, kecuali
**SD-3, SD-6, SD-9** yang dioverride dengan prinsip "**UI menang**": elemen UI
yang sudah disukai klien tidak diubah, skema yang menyesuaikan (walau di luar
PRD). Pilihan final ada di tabel §4; kolom **Jawaban** pada tiap item tidak perlu
diisi lagi.

---

## 1. Konteks singkat (2 menit)

**Produknya apa.** GlobalLinkup = aplikasi web dua bahasa (EN/ES) untuk
menemukan orang. Pengguna membuat **Persona** (profil), menjelajah orang lain
(discover), membagikan **Post**, mengirim **Connect** (permintaan koneksi), lalu
**info kontak pribadi baru terbuka setelah koneksi diterima dua belah pihak**.
Ada juga **Marketplace** resmi yang hanya dikelola Admin. Tidak ada chat/DM.

**Tahap sekarang.** Tampilan (UI) sudah selesai dan masih memakai **data palsu**
(fixture) yang ditulis tangan di `src/features/*/data.ts`. Backendnya belum ada.
Pekerjaan yang sedang kita rencanakan menambahkan **database (Supabase/Postgres)
sebagai sumber data asli**.

**Kenapa ada keputusan ini.** Karena UI sudah dibuat lebih dulu, sebagian UI
menampilkan atau mengumpulkan data yang **belum punya tempat di skema database
PRD**. Untuk tiap field seperti itu, kita harus memilih: **buat kolomnya di
database**, atau **ubah UI-nya**. S1 adalah tahap pembuatan skema/tabel/aturan
keamanan/seeder, jadi semua kolom "lahir" di sini.

**Dua istilah tahap:**

- **S1** = membuat tabel, constraint, RLS (aturan keamanan tingkat-baris),
  dan data seed. Tidak ada perubahan yang terlihat pengguna.
- **S2** = menyambungkan Supabase Auth ke layar login/daftar/reset + gating
  persetujuan akun.

---

## 2. Glosarium singkat

| Istilah                 | Arti dalam konteks ini                                                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Fixture / mock data** | Data palsu di `src/features/*/data.ts` yang dipakai UI sekarang.                                                                        |
| **DTO**                 | Bentuk data yang dipakai komponen UI (mis. `Persona`, `Post`, `Product`).                                                               |
| **Mapper**              | Potongan kode yang mengubah baris database → DTO yang UI harapkan.                                                                      |
| **Migration**           | File SQL yang membuat/mengubah tabel di database (`supabase/migrations/`).                                                              |
| **Seed**                | Data contoh yang diisi ke DB khusus lokal (`supabase/seed.sql`).                                                                        |
| **RLS**                 | _Row-Level Security_: aturan di dalam database yang menentukan baris mana boleh dibaca/ditulis siapa. Tidak bisa ditembus dari browser. |
| **pgTAP**               | Tes otomatis untuk aturan RLS di database.                                                                                              |
| **Server Action**       | Fungsi khusus Next.js yang berjalan di server untuk menulis data (validasi + hak akses).                                                |
| **DAL**                 | _Data Access Layer_: helper server yang mengecek sesi/hak akses sebelum data diambil.                                                   |
| **enum**                | Tipe database yang nilainya dibatasi daftar tetap (mis. `pending/approved`).                                                            |

---

## 3. Bukti di kode (biar bisa dicek sendiri)

- Bentuk DTO per fitur: `src/features/{persona,connect,posts,marketplace,profile,admin}/data.ts`
- Form pembuatan persona (field yang benar-benar dikumpulkan):
  `src/features/persona/components/create-persona-view.tsx`
- Skema acuan PRD: `docs/PRD.md` §6.1 (tabel) dan §6.3 (storage)
- Rencana S1: `docs/plan/api-layer/s1-schema-rls-seed.md`
- Rencana S2: `docs/plan/api-layer/s2-auth.md`

---

## 4. Keputusan final (locked)

| ID    | Keputusan final                                                                                                       |
| ----- | --------------------------------------------------------------------------------------------------------------------- |
| SD-1  | `profiles.date_of_birth date`; umur diturunkan. Input tanggal di form persona menyusul (S3).                          |
| SD-2  | `profiles.languages jsonb` `[{code, level}]`                                                                          |
| SD-3  | **(override UI-first)** `bio_en` + `bio_es` — tampilan bio dua bahasa tetap                                           |
| SD-4  | `profiles.origin_flavor text`                                                                                         |
| SD-5  | `contact_details.instagram` + `other jsonb` `{chat}`                                                                  |
| SD-6  | **(override UI-first)** UI `notes`/`hasComment` dibiarkan apa adanya; tidak ada kolom (dead UI sampai nanti)          |
| SD-7  | Tanpa kolom; `state` diturunkan, `badgeIcon`/`roleText` format-only                                                   |
| SD-8  | Mock-only; tidak dipersist                                                                                            |
| SD-9  | **(override UI-first)** `profiles.neighborhood` + `profiles.badge`; `region`/`connectedSince`/`tags` tetap diturunkan |
| SD-10 | `availability` enum (`in_stock\|out_of_stock\|made_to_order`); `category` text + check 5 nilai                        |
| SD-11 | `price_cents int` + `currency` tetap `USD`                                                                            |
| SD-12 | Tabel `platform_settings`                                                                                             |
| CFG-1 | `minimum_password_length = 8` + `password_requirements = "lower_upper_letters_digits"`                                |
| CFG-2 | `enable_confirmations = false` diterima untuk lokal                                                                   |
| SA-1  | `reviewPersonaAction` minimal masuk S2                                                                                |
| SA-2  | State `rejected` + `suspended` masuk S2                                                                               |
| SA-3  | e2e butuh `db:start` + `db:reset`; spec auth di-skip kalau stack mati; CI tetap stack-free                            |
| SA-4  | Seed akun tetap (admin/pending/approved/reset); password `Password123` (menyesuaikan CFG-1)                           |

Wujudnya di S1: `supabase/migrations/20261016000000_initial_schema.sql`,
`supabase/seed.sql`, dan `supabase/tests/rls.test.sql` (32 tes pgTAP), plus
perbaikan audit di `20261016120000_s1_fixes.sql`.

### 4b. Tindak lanjut audit S1 (locked 2026-10-16)

Audit pasca-S1 menemukan lubang RLS di `connections` dan beberapa item lain;
daftar lengkap + bukti ada di [`s1-audit-fixes.md`](./s1-audit-fixes.md).

| ID   | Keputusan                                                                           |
| ---- | ----------------------------------------------------------------------------------- |
| CA-1 | `date_of_birth` pindah ke `public.profile_private`; umur via `public.profile_age()` |
| CA-2 | CI menjalankan suite RLS (`supabase/**` + `package*.json` path filter)              |
| CA-3 | `ADMIN_EMAIL` = hook bootstrap cloud; seed lokal tetap hardcode admin               |
| CA-4 | Kolom baru (F-8), lihat tabel di bawah                                              |

Kolom/field CA-4 yang dikunci (migrasi susulan `s1_fixes`):

| Field UI                                        | Keputusan                                               |
| ----------------------------------------------- | ------------------------------------------------------- |
| marketplace `sku`                               | kolom `sku text` (unik, nullable)                       |
| marketplace `summary`                           | kolom `summary text`                                    |
| marketplace `originLabel`                       | kolom `origin_label text`                               |
| marketplace `badge`                             | kolom `badge text`                                      |
| marketplace `specs`                             | kolom `specs jsonb` (default `{}`)                      |
| connections `intro`                             | kolom `intro text` (surat perkenalan, dibatasi panjang) |
| connections `topic`                             | kolom `topic text`                                      |
| profile `role` (jabatan)                        | kolom `profiles.headline text`                          |
| profile `substack`                              | map ke `contact_details.other`                          |
| `sentAgo`, `maskedPreview`                      | derive/format                                           |
| `tier`, `PROTOCOL_RULES`                        | defer/drop                                              |
| admin metrics/`flagged`/`inquiries`/`INCIDENTS` | derive/defer dari `reports`                             |

---

## 5. Keputusan S1 — field ↔ kolom database

### SD-1 — Field `age` (umur)

**Fakta:** umur tampil di kartu discover, kartu koneksi, permintaan masuk, dan
profil (`persona/data.ts`, `connect/data.ts`, `profile/data.ts`), **tetapi tidak
dikumpulkan di form mana pun**. Form persona hanya mengumpulkan: nama, negara,
kota, "anchor", bahasa, bio, minat, Instagram, handle chat.

**Opsi:**

- **(a)** Simpan `date_of_birth` (tanggal lahir); umur dihitung otomatis saat
  ditampilkan. Perlu menambah 1 input tanggal di form persona. Umur selalu
  akurat dan siap jika nanti fitur "batas umur" (PRD OQ-11) diaktifkan.
- **(b)** Simpan `age` (angka) langsung. Paling sedikit kode, tapi umur tidak
  pernah bertambah sendiri dan tidak bisa menopang fitur batas umur.
- **(c)** Hapus umur dari UI. Skema paling sesuai PRD, tapi ada perubahan
  tampilan di 3 halaman.

**Rekomendasi: (a).** **Jawaban: locked** (§4).

---

### SD-2 — Daftar bahasa yang dikuasai

**Fakta:** bahasa tampil sebagai chip `[{code, level}]` (mis. `ES native`) di
kartu discover/koneksi, dan dipilih di form persona. PRD tidak menyebutnya
sama sekali.

**Opsi:**

- **(a)** Kolom `languages jsonb` berisi array `[{code, level}]`.
- **(b)** Tabel relasi `profile_languages` (lebih rapi, bisa difilter, tapi lebih
  banyak kode).
- **(c)** Hapus dari UI.

**Rekomendasi: (a)** — tidak ada kebutuhan filter bahasa di PRD, jadi tidak
perlu tabel penuh. **Jawaban: locked** (§4).

---

### SD-3 — Bio dua bahasa vs satu bio

**Fakta:** halaman profil menampilkan dua bio berdampingan
(`PROFILE_BIO.en` + `PROFILE_BIO.es` di `profile/data.ts`), tapi form persona
hanya mengumpulkan **satu** bio (maks 160 karakter).

**Opsi:**

- **(a)** Satu kolom `bio`; UI profil menampilkan satu bio (hapus tampilan
  berdampingan).
- **(b)** Dua kolom `bio_en` + `bio_es`; form perlu dua kolom isian (satu EN,
  satu ES).

**Rekomendasi: (a)** — form sudah satu bio, jadi (b) menambah kerja UI.

> **Keputusan final: (b)** (override "UI menang", §4): `bio_en` + `bio_es` supaya
> tampilan dua bahasa tetap.

---

### SD-4 — Field "Anchor / Origin flavour"

**Fakta:** form persona punya input `name="origin-flavor"` (label "Anchor"),
tidak ada di PRD.

**Opsi:**

- **(a)** Tambah kolom `origin_flavor` (teks, boleh kosong) — UI tidak berubah.
- **(b)** Hapus field dari form.

**Rekomendasi: (a)** — satu kolom murah, UI tetap. **Jawaban: locked** (§4).

---

### SD-5 — Contact vault: Instagram + handle chat

**Fakta:** form mengumpulkan Instagram dan sebuah "chat handle". Tabel
`contact_details` di PRD punya `whatsapp`, `instagram`, `email`, `other (jsonb)`.
Data koneksi (`connect/data.ts`) bahkan menyebut label `whatsapp` **atau**
`whatsappTelegram`, jadi "chat handle" bisa berarti WhatsApp **atau** Telegram.

**Opsi:**

- **(a)** Handle chat → kolom `whatsapp`.
- **(b)** Hanya pakai `other jsonb` generik untuk handle chat.
- **(c)** Instagram → `instagram`; handle chat → `other jsonb` (mis.
  `{ "chat": "..." }`).

**Rekomendasi: (c)** — jujur terhadap makna "chat handle" yang belum pasti.
**Jawaban: locked** (§4).

---

### SD-6 — `notes` + jumlah komentar di Post

**Fakta:** `posts/data.ts` punya `notes` (jumlah catatan) dan `hasComment`.
Komentar **di luar cakupan** (tidak ada chat/DM di produk).

**Opsi:**

- **(a)** Hapus keduanya dari data + bersihkan `post-card.tsx`.
- **(b)** Biarkan di UI sebagai elemen kosong permanen.

**Rekomendasi: (a).**

> **Keputusan final: (b)** (override "UI menang", §4): UI dibiarkan, tidak ada
> kolom (dead UI sampai nanti).

---

### SD-7 — Badge ikon, `roleText`, `state`, dan union penulis di Post

**Fakta:** `posts/data.ts` punya `badgeIcon`, `roleText` (mis. "CDMX"),
`state` (`connect`/`connected`), dan `id` penulis berupa union nama
(`"sofia" | "mateo" | "elena"`). Semua ini bisa dihitung/diformat, bukan data
inti.

**Opsi:**

- **(a)** Tidak ada kolom khusus; semuanya diturunkan (`state` dari relasi
  koneksi, sisanya format tampilan).
- **(b)** Simpan sebagai kolom.

**Rekomendasi: (a).** **Jawaban: locked** (§4).

---

### SD-8 — Chrome halaman profil (ID dossier, Trust Score, metrik)

**Fakta:** `profile/data.ts` punya `dossierId` (mis. "GL-BCN-84920"),
`TRUST_SCORE` (0–100), dan `PROFILE_METRICS` (jumlah koneksi, dsb).

**Opsi:**

- **(a)** Anggap hiasan mock — tidak disimpan di database.
- **(b)** Buat tabel/kolom untuk menyimpannya.

**Rekomendasi: (a)** — belum ada kebutuhan produk; server bisa menghitung angka
nyata nanti kalau perlu. **Jawaban: locked** (§4).

---

### SD-9 — Data tambahan di kartu koneksi

**Fakta:** `connect/data.ts` menampilkan `neighborhood`, `region`
(`latam`/`europe`), `badge` (`ambassador`/`resident`/`creator`),
`connectedSince`, dan `tags`. Dari sekian itu, PRD hanya tahu `country_code`,
`interests`, dan baris koneksi itu sendiri.

**Opsi:**

- **(a)** Turunkan/format dari data yang ada: `region` dari `country_code`,
  `connectedSince` dari baris koneksi, `tags` dari `interests`;
  `neighborhood` & `badge` dilepas dari UI.
- **(b)** Tambah kolom/tabel untuk semuanya.

**Rekomendasi: (a)** — kecuali kamu ingin mempertahankan tampilan
`neighborhood` (butuh 1 kolom opsional di profil) dan `badge` (butuh kolom
status).

> **Keputusan final: (b) versi ringan** (override "UI menang", §4): tambah
> `profiles.neighborhood` + `profiles.badge`; `region`/`connectedSince`/`tags`
> tetap diturunkan.

---

### SD-10 — Kategori & ketersediaan produk

**Fakta:** `marketplace/data.ts` punya 5 kategori
(`artisanCrafts`, `homeLiving`, `booksCulture`, `localGoods`, `travelGear`).
Ketersediaan menurut PRD: `in_stock | out_of_stock | made_to_order`.

**Opsi:**

- **(a)** Kategori: teks + check constraint (daftar beku 5 nilai di atas);
  ketersediaan: enum.
- **(b)** Semua jadi enum.

**Rekomendasi: (a)** — kategori lebih mungkin berkembang daripada
ketersediaan. **Jawaban: locked** (§4).

---

### SD-11 — Harga & mata uang

**Fakta:** UI menampilkan `price: 120` (dolar). PRD memakai `price_cents`
(bilangan bulat, satuan sen) + `currency`.

**Opsi:**

- **(a)** Simpan `price_cents`, mata uang tetap **USD** (satu mata uang).
- **(b)** Dukung banyak mata uang penuh.

**Rekomendasi: (a)** — belum ada kebutuhan multi-currency. **Jawaban: locked** (§4).

---

### SD-12 — Menu "Settings" di Admin (PRD FR-9.5)

**Fakta:** Admin punya navigasi **Settings**, tapi tidak ada tabelnya di rencana
mana pun.

**Opsi:**

- **(a)** Tambah tabel `platform_settings` minimal (mis. kontak default
  marketplace).
- **(b)** Tunda fitur ini secara eksplisit.

**Rekomendasi: (a)** — FR-9.5 berprioritas M (wajib MVP). **Jawaban: locked** (§4).

---

## 6. Koreksi konfigurasi (bukan keputusan produk)

### CFG-1 — Aturan password

**Fakta:** Supabase dikonfigurasi minimum 6 karakter tanpa syarat, sementara form
daftar & reset di UI mewajibkan **≥ 8 + huruf besar + huruf kecil + angka**.
Artinya API bisa menerima password lebih lemah dari yang diizinkan form.

**Usulan:** samakan menjadi `minimum_password_length = 8` dan
`password_requirements = "lower_upper_letters_digits"`.

**Rekomendasi: setuju.** **Jawaban: locked** (§4).

---

### CFG-2 — Konfirmasi email

**Fakta:** di lokal, konfirmasi email sudah **dimatikan**, jadi daftar langsung
dapat sesi. Ini cocok dengan default PRD: satu-satunya gerbang adalah persetujuan
admin. Keputusan ulang ditunda ke saat pindah ke cloud.

**Rekomendasi: terima kondisi lokal sekarang.** **Jawaban: locked** (§4).

---

## 7. Keputusan S2 — auth

### SA-1 — Aksi admin approve / reject / suspend

**Fakta:** di rencana S2, aksi review admin hanya muncul sebagai baris uji
opsional, sementara halaman `/admin` masih mock. Tanpa aksi ini, alur "user
daftar → pending → disetujui" tidak bisa diuji/ditutup end-to-end.

**Opsi:**

- **(a)** Buat aksi `reviewPersonaAction` versi minimal di S2.
- **(b)** Tunda ke S3; S2 mengandalkan akun seed yang sudah approved.

**Rekomendasi: (a).** **Jawaban: locked** (§4).

---

### SA-2 — State akun `rejected` & `suspended`

**Fakta:** `verify-view.tsx` hanya mengenal 3 tampilan: `pending`, `approved`,
`action` (rejected digabung ke "action"); `suspended` belum ada. PRD FR-2.5
(rejected bisa edit & kirim ulang) dan FR-2.6 (suspended lihat notice) wajib MVP.

**Opsi:** masukkan state **rejected** (edit + resubmit) dan **suspended** di S2
sekarang, atau tunda.

**Rekomendasi: masukkan sekarang.** **Jawaban: locked** (§4).

---

### SA-3 — Strategi tes auth (butuh database jalan)

**Fakta:** tes e2e auth butuh stack Supabase yang jalan + seed, tapi konfigurasi
Playwright saat ini hanya menjalankan `npm run dev`, dan CI tidak menyediakan
Supabase.

**Opsi:**

- **(a)** Wajibkan `db:start` + `db:reset`, dan **lewati (skip)** tes auth kalau
  stack tidak jalan; CI tetap tanpa Supabase, aturan RLS diuji lewat pgTAP lokal.
- **(b)** Pertahankan e2e tanpa stack; auth hanya diuji lewat unit + pgTAP.

**Rekomendasi: (a)** — tes tetap ada untuk dev lokal, CI tidak rusak.
**Jawaban: locked** (§4).

---

### SA-4 — Akun contoh untuk tes & seed

**Fakta:** perlu akun tetap: 1 admin, 1 pending, 1 approved, 1 untuk alur reset.
Semua "pre-confirmed" supaya tidak perlu email asli.

**Usulan:** `admin@globallinkup.test` / `Password123` (boleh diganti). Password
akun user seed mengikuti aturan CFG-1 (≥ 8, campuran).

**Rekomendasi: pakai usulan, boleh ganti password.**
**Jawaban: locked** (§4).

---

## 8. Keputusan lain yang belum wajib (catatan)

Ini **bukan blocker**, hanya tercatat di rencana:

- **"Remember device"** saat login: simpan sebagai cookie berumur panjang
  (persistent) atau dihapus?
- **Rate limiting** (FR-1.8): cukup mengandalkan pengaturan bawaan Supabase?
- **ADR** untuk pola "Server Component + Server Action + RLS" belum ditulis.

---

## 9. Setelah semua dijawab

1. Keputusan dipindah ke status **locked** di
   `docs/plan/api-layer/s1-schema-rls-seed.md` & `s2-auth.md`.
2. Mulai S1: migration tabel + helper RLS + policy + seed + tes pgTAP.
3. Gerbang S1 harus hijau (`db:reset` bersih, tes RLS hijau, `typecheck` &
   `build` hijau) sebelum lanjut ke S2.
