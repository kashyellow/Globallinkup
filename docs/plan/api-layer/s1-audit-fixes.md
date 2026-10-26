# S1 — Audit findings & fix list

Hasil audit setelah S1 landed (`8b17cec`, `804721d`, `b15f604`, `c02d8a8`).
Dokumen ini adalah **checklist kerja** supaya tidak ada yang kelupaan. Tandai
`[x]` saat beres.

- **Status:** ✅ fixed (2026-10-16) — `20261016120000_s1_fixes.sql` + tests, all green
- **Lingkup:** `supabase/migrations/20261016000000_initial_schema.sql`,
  `supabase/tests/rls.test.sql`, `supabase/seed.sql`, CI, dan docs.
- **Konteks:** keputusan ada di [`api-layer-decisions.md`](./api-layer-decisions.md);
  slice ada di [`s1-schema-rls-seed.md`](./s1-schema-rls-seed.md).

Cara reproduksi audit (stack harus jalan; semua probe di bawah dibungkus
`begin; … rollback;` jadi DB tidak berubah):

```bash
npm run db:start
docker exec -i supabase_db_globallinkup psql -U postgres -d postgres <<'SQL'
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
insert into public.connections (requester_id, recipient_id, status)
  values ('22222222-2222-2222-2222-222222222222','66666666-6666-6666-6666-666666666666','requested');
update public.connections set status='accepted'
  where requester_id='22222222-2222-2222-2222-222222222222'
    and recipient_id='66666666-6666-6666-6666-666666666666';
select count(*) from public.contact_details
  where profile_id='66666666-6666-6666-6666-666666666666';  -- 1 = bocor
rollback;
SQL
```

---

## Yang sudah benar (jangan diubah)

- RLS aktif di **9/9** tabel; `anon` tidak punya policy apa pun → fail closed.
- `service_role` punya `rolbypassrls = t`, jadi `createAdminClient()` (S2) memang
  menembus RLS seperti yang dirancang.
- `protect_profile_privileges` menutup self-approve (terbukti di tes).
- Gate S1 hijau: `db:reset`, `db:test` (17/17), `format:check`, `lint`,
  `typecheck`, `test`, `build`, `e2e` (9/9).
- Riwayat commit bersih, tidak ada file nyasar.

---

## 🔴 P0 — Kritis: kontak bisa dibuka tanpa persetujuan

### F-1 — Pemohon bisa menerima permintaan Connect-nya sendiri

**Efek:** siapa pun bisa membuka `contact_details` orang lain, mematahkan
FR-5.3/FR-5.4 dan seluruh gating kontak.

**Bukti:** probe di atas → `count = 1` (kontak Elena terlihat oleh Sofia), dan
`are_connected(sofia, elena) = true` padahal tidak ada persetujuan.

**Penyebab:** `connections_update_party`
(`supabase/migrations/20261016000000_initial_schema.sql:389`) mengizinkan **kedua
pihak** mengubah baris apa pun, tanpa memeriksa transisi status. Varian lain:
`with check` hanya butuh _salah satu_ kolom pihak = `auth.uid()`, sehingga
pengirim bisa mengganti `recipient_id` ke target lain ("membelokkan" baris).

**Perbaikan:**

- [x] Buat trigger `connections_guard_transitions` (BEFORE UPDATE) yang:
  - mengunci `requester_id` dan `recipient_id` (immutable);
  - hanya mengizinkan transisi sah menurut aktor:
    - `requested → accepted` — **hanya penerima**
    - `requested → declined` — hanya penerima
    - `accepted → declined` — salah satu pihak (disconnect / OQ-3)
    - `declined → requested` — hanya pengirim (re-request / FR-5.6)
    - `X → X` (no-op) — boleh
    - selain itu → `raise exception`; admin (`is_admin()`) diizinkan.
- [x] Persempit policy `connections_update_party`: `with check` harus tetap
      menyertakan **kedua** kolom sebagai baris yang sama (bukan salah satu),
      mis. `requester_id = auth.uid() or recipient_id = auth.uid()` **plus**
      jaminan trigger di atas.
- [x] Tes pgTAP baru:
  - [x] pengirim **tidak bisa** mengubah `requested → accepted` (expect error);
  - [x] pengirim **tidak bisa** mengganti `recipient_id`;
  - [x] penerima **bisa** `requested → accepted` (jalur positif);
  - [x] `declined → requested` oleh pengirim boleh; oleh penerima ditolak.

---

## 🟠 P1 — Penting

### F-2 — `are_connected()` bocor lewat RPC

**Efek:** oracle "apakah X terhubung dengan Y". User mana pun bisa memanggil
`public.are_connected(X, Y)` untuk pasangan sembarang.

**Bukti:** `select public.are_connected('sofia','camila')` sebagai user biasa → `t`.

**Perbaikan:**

- [x] Di `are_connected` (`supabase/migrations/.../initial_schema.sql:245`),
      tolak kecuali salah satu argumen = `auth.uid()` atau pemanggil admin:
      `if not (a = auth.uid() or b = auth.uid() or is_admin()) then return false; end if;`
- [x] Tes: pasangan yang tidak melibatkan pemanggil → `false`.

### F-3 — Penulis bisa membatalkan moderasi admin

**Efek:** post yang dihapus admin bisa dipublikasikan ulang sendiri.

**Bukti:** admin set `moderation_status='removed'` → penulis `update … set
moderation_status='visible'` → `UPDATE 1`.

**Penyebab:** `posts_update_author`
(`supabase/migrations/20261016000000_initial_schema.sql:427`) hanya cek
`author_id`.

**Perbaikan:**

- [x] Trigger guard: non-admin tidak boleh mengubah `moderation_status`,
      `removed_by`, `removed_at` (kecuali transisi oleh admin).
- [x] Tes: penulis gagal menaikkan `removed → visible`.

### F-4 — CI tidak menjalankan suite RLS

**Efek:** regresi RLS (termasuk F-1) tidak terdeteksi di CI; `db:test` cuma
manual. Ini SA-3 yang belum dieksekusi.

**Perbaikan:**

- [x] Tambah job CI (`.github/workflows/ci.yml`) yang menjalankan Supabase lokal + `npm run db:reset` + `npm run db:test`, **atau** putuskan CA-2 di bawah
      dan catat alasannya. Job baru tidak boleh memblokir PR yang tidak menyentuh
      `supabase/`.

### F-5 — `ADMIN_EMAIL` / D6 didokumentasikan tapi tidak dipakai

**Efek:** `PRD` D6, `README §4`, `.env.example:18`, dan `src/lib/env.server.ts`
menyebut seed mem-promote akun sesuai `ADMIN_EMAIL`; kenyataannya `seed.sql`
hardcode `admin@globallinkup.test`.

**Perbaikan (CA-3 → **b**, rekonsiliasi docs):**

- [x] Nyatakan seed lokal hardcode admin, dan `ADMIN_EMAIL` hanya untuk bootstrap
      cloud; perbarui `.env.example`, README §4, s0 doc.
- [x] Bootstrap cloud diimplementasikan sebagai `scripts/bootstrap-admin.mjs`
      (`npm run admin:bootstrap`, 2026-10-26): promote-only, butuh akun + baris
      `profiles` hasil persona submit.

### F-6 — `date_of_birth` ter-expose ke semua user approved

**Efek:** RLS itu row-level, jadi `profiles_select_approved`
(`.../initial_schema.sql:311`) mengirim DOB lengkap ke setiap user approved;
UI hanya butuh umur. Pertimbangan privasi (berkaitan OQ-11).

**Perbaikan (CA-1 → **b**, pisah tabel):**

- [x] Pindahkan `date_of_birth` ke tabel `public.profile_private` (RLS owner +
      admin) dan ekspos umur lewat fungsi `public.profile_age(uuid) returns int`.

---

## 🟡 P2 — Ringan / gap

### F-7 — Seed: umur Lucas salah

`supabase/seed.sql:151` `'1995-11-30'` → umur **30**, fixture menampilkan **31**.

- [x] Ganti ke `1994-11-30` (atau sesuai fixture).

### F-8 — Field UI tanpa rumah di skema (CA-4 → locked)

Keputusan (detail di [`api-layer-decisions.md`](./api-layer-decisions.md) §4b):

- **tambah kolom:** marketplace `sku`, `summary`, `origin_label`, `badge`,
  `specs jsonb`; connections `intro`, `topic`; profiles `headline`.
- **petakan:** `substack` → `contact_details.other`.
- **derive/format:** `sentAgo`, `maskedPreview`, admin metrics/tab counts.
- **defer/drop:** `tier`, `PROTOCOL_RULES`, admin status `flagged`, `inquiries`,
  `INCIDENTS`.

- [x] Terapkan kolom di migrasi `s1_fixes`.

### F-9 — Celah tes

- [x] Policy `marketplace_product_images` belum diuji.
- [x] Jalur positif admin approve/reject/suspend.
- [x] Eskalasi `role = 'admin'` (bukan hanya self-approve status).
- [x] Jalur penerima menerima koneksi (setelah F-1).
- [x] `anon` membaca `posts` → kosong.

### F-10 — Nits dokumen

- [x] `api-layer-decisions.md` §5 per-item masih menyarankan SD-3 "satu bio" dan
      SD-9 "(a) derive", padahal §4 locked `bio_en/bio_es` + `neighborhood/badge`.
- [x] `api-layer-decisions.md` §7 SA-4 menulis `password123`, §4 `Password123`.
- [x] Kolom "**Jawaban: ______**" di §5/§6/§7 masih kosong (sudah terkunci di §4).
- [x] `.env.example` / README §4 masih menyebut `ADMIN_EMAIL` (lihat F-5).

---

## Keputusan (locked 2026-10-16)

| ID   | Keputusan                                                                          |
| ---- | ---------------------------------------------------------------------------------- |
| CA-1 | **(b)** pisah `date_of_birth` ke `public.profile_private` + `public.profile_age()` |
| CA-2 | **(a)** job CI untuk RLS, dengan path filter `supabase/**` + `package*.json`       |
| CA-3 | **(b)** rekonsiliasi docs; `npm run admin:bootstrap` (2026-10-26)                  |
| CA-4 | **locked** — kolom/derive/drop seperti F-8                                         |

---

## Definisi selesai (gate)

- [x] F-1 & F-2 tertutup dan terbukti oleh probe (kontak tidak lagi bocor).
- [x] `npm run db:reset` bersih + `npm run db:test` hijau (dengan tes F-1/F-3/F-9).
- [x] `format:check` / `lint` / `typecheck` / `test` / `build` / `e2e` hijau.
- [x] Dokumen (decisions/README/s1) konsisten dengan kondisi akhir.
