# S1 — Audit findings & fix list

Hasil audit setelah S1 landed (`8b17cec`, `804721d`, `b15f604`, `c02d8a8`).
Dokumen ini adalah **checklist kerja** supaya tidak ada yang kelupaan. Tandai
`[x]` saat beres.

- **Status:** open — belum ada yang diperbaiki
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

- [ ] Buat trigger `connections_guard_transitions` (BEFORE UPDATE) yang:
  - mengunci `requester_id` dan `recipient_id` (immutable);
  - hanya mengizinkan transisi sah menurut aktor:
    - `requested → accepted` — **hanya penerima**
    - `requested → declined` — hanya penerima
    - `accepted → declined` — salah satu pihak (disconnect / OQ-3)
    - `declined → requested` — hanya pengirim (re-request / FR-5.6)
    - `X → X` (no-op) — boleh
    - selain itu → `raise exception`; admin (`is_admin()`) diizinkan.
- [ ] Persempit policy `connections_update_party`: `with check` harus tetap
      menyertakan **kedua** kolom sebagai baris yang sama (bukan salah satu),
      mis. `requester_id = auth.uid() or recipient_id = auth.uid()` **plus**
      jaminan trigger di atas.
- [ ] Tes pgTAP baru:
  - [ ] pengirim **tidak bisa** mengubah `requested → accepted` (expect error);
  - [ ] pengirim **tidak bisa** mengganti `recipient_id`;
  - [ ] penerima **bisa** `requested → accepted` (jalur positif);
  - [ ] `declined → requested` oleh pengirim boleh; oleh penerima ditolak.

---

## 🟠 P1 — Penting

### F-2 — `are_connected()` bocor lewat RPC

**Efek:** oracle "apakah X terhubung dengan Y". User mana pun bisa memanggil
`public.are_connected(X, Y)` untuk pasangan sembarang.

**Bukti:** `select public.are_connected('sofia','camila')` sebagai user biasa → `t`.

**Perbaikan:**

- [ ] Di `are_connected` (`supabase/migrations/.../initial_schema.sql:245`),
      tolak kecuali salah satu argumen = `auth.uid()` atau pemanggil admin:
      `if not (a = auth.uid() or b = auth.uid() or is_admin()) then return false; end if;`
- [ ] Tes: pasangan yang tidak melibatkan pemanggil → `false`.

### F-3 — Penulis bisa membatalkan moderasi admin

**Efek:** post yang dihapus admin bisa dipublikasikan ulang sendiri.

**Bukti:** admin set `moderation_status='removed'` → penulis `update … set
moderation_status='visible'` → `UPDATE 1`.

**Penyebab:** `posts_update_author`
(`supabase/migrations/20261016000000_initial_schema.sql:427`) hanya cek
`author_id`.

**Perbaikan:**

- [ ] Trigger guard: non-admin tidak boleh mengubah `moderation_status`,
      `removed_by`, `removed_at` (kecuali transisi oleh admin).
- [ ] Tes: penulis gagal menaikkan `removed → visible`.

### F-4 — CI tidak menjalankan suite RLS

**Efek:** regresi RLS (termasuk F-1) tidak terdeteksi di CI; `db:test` cuma
manual. Ini SA-3 yang belum dieksekusi.

**Perbaikan:**

- [ ] Tambah job CI (`.github/workflows/ci.yml`) yang menjalankan Supabase lokal + `npm run db:reset` + `npm run db:test`, **atau** putuskan CA-2 di bawah
      dan catat alasannya. Job baru tidak boleh memblokir PR yang tidak menyentuh
      `supabase/`.

### F-5 — `ADMIN_EMAIL` / D6 didokumentasikan tapi tidak dipakai

**Efek:** `PRD` D6, `README §4`, `.env.example:18`, dan `src/lib/env.server.ts`
menyebut seed mem-promote akun sesuai `ADMIN_EMAIL`; kenyataannya `seed.sql`
hardcode `admin@globallinkup.test`.

**Perbaikan (pilih satu):**

- [ ] (a) Implementasikan: seed membaca env (mis. lewat `psql -v` / wrapper) —
      lebih rumit untuk SQL murni; atau
- [ ] (b) Rekonsiliasi docs: nyatakan seed lokal hardcode admin, dan `ADMIN_EMAIL`
      hanya untuk bootstrap cloud; perbarui `.env.example`, README §4, s0 doc.

### F-6 — `date_of_birth` ter-expose ke semua user approved

**Efek:** RLS itu row-level, jadi `profiles_select_approved`
(`.../initial_schema.sql:311`) mengirim DOB lengkap ke setiap user approved;
UI hanya butuh umur. Pertimbangan privasi (berkaitan OQ-11).

**Perbaikan (pilih satu):**

- [ ] (a) Terima apa adanya + catat sebagai risiko privasi; atau
- [ ] (b) Pindahkan `date_of_birth` ke tabel terpisah yang RLS-nya lebih ketat
      (owner/admin), lalu expose umur sebagai view/kolom turunan.

---

## 🟡 P2 — Ringan / gap

### F-7 — Seed: umur Lucas salah

`supabase/seed.sql:151` `'1995-11-30'` → umur **30**, fixture menampilkan **31**.

- [ ] Ganti ke `1994-11-30` (atau sesuai fixture).

### F-8 — Field UI tanpa rumah di skema (di luar daftar SD-1…SD-12)

Belum masuk kuesioner keputusan, jadi belum ada keputusan:

- [ ] Marketplace: `sku`, `badge`, `summary`, `originLabel`, `specs`
      (origin/artisan/material/dimensions/weight/fulfillment).
- [ ] Connect: `intro` (surat perkenalan user-authored), `topic`, `sentAgo`,
      `maskedPreview`.
- [ ] Profile: `role` (jabatan), `tier`, handle `substack`, `PROTOCOL_RULES`.
- [ ] Admin: `ADMIN_METRICS`, status `flagged`, `inquiries`, `INCIDENTS`.

Untuk tiap item putuskan: **tambah kolom**, **derive/format-only**, atau
**drop dari UI**. `intro`, `sku`, `specs`, dan `role` jelas data nyata.
Catat hasilnya di `api-layer-decisions.md`.

### F-9 — Celah tes

- [ ] Policy `marketplace_product_images` belum diuji.
- [ ] Jalur positif admin approve/reject/suspend.
- [ ] Eskalasi `role = 'admin'` (bukan hanya self-approve status).
- [ ] Jalur penerima menerima koneksi (setelah F-1).
- [ ] `anon` membaca `posts` → kosong.

### F-10 — Nits dokumen

- [ ] `api-layer-decisions.md` §5 per-item masih menyarankan SD-3 "satu bio" dan
      SD-9 "(a) derive", padahal §4 locked `bio_en/bio_es` + `neighborhood/badge`.
- [ ] `api-layer-decisions.md` §7 SA-4 menulis `password123`, §4 `Password123`.
- [ ] Kolom "**Jawaban: ______**" di §5/§6/§7 masih kosong (sudah terkunci di §4).
- [ ] `.env.example` / README §4 masih menyebut `ADMIN_EMAIL` (lihat F-5).

---

## Keputusan yang dibutuhkan sebelum sebagian fix

| ID   | Pertanyaan                                                       | Opsi                       |
| ---- | ---------------------------------------------------------------- | -------------------------- |
| CA-1 | F-6 `date_of_birth`: terima eksposur atau pisah tabel?           | (a) terima; (b) tabel baru |
| CA-2 | F-4 CI: tambah job Supabase, atau tetap lokal + catat alasannya? | (a) job CI; (b) lokal saja |
| CA-3 | F-5 `ADMIN_EMAIL`: implementasi atau rekonsiliasi docs?          | (a) implementasi; (b) docs |
| CA-4 | F-8 field S3: kolom / derive / drop untuk tiap item              | per item                   |

---

## Definisi selesai (gate)

- [ ] F-1 & F-2 tertutup dan terbukti oleh probe (kontak tidak lagi bocor).
- [ ] `npm run db:reset` bersih + `npm run db:test` hijau (dengan tes F-1/F-3/F-9).
- [ ] `format:check` / `lint` / `typecheck` / `test` / `build` / `e2e` hijau.
- [ ] Dokumen (decisions/README/s1) konsisten dengan kondisi akhir.
