# S2 — Audit findings & fix list

Hasil audit setelah S2 landed (`05b2a67`, `7059381`, `9606ec8`, `506ebae`).
Checklist kerja supaya tidak ada yang kelupaan. Tandai `[x]` saat beres.

- **Status:** open — belum ada yang diperbaiki
- **Lingkup:** `src/features/{auth,persona,admin}` (Server Actions),
  `src/lib/{auth.ts,i18n/request.ts}`, `src/features/persona/components/`,
  `.github/workflows/db.yml`, dan tes.
- **Konteks:** rencana + keputusan di [`s2-auth.md`](./s2-auth.md) dan
  [`api-layer-decisions.md`](./api-layer-decisions.md) §4c.

## Cara reproduksi

Perlu stack + dev server jalan (`npm run db:start`, `npm run dev`). Yang paling
cepat membuktikan P0:

```bash
# sebagai rejected user, isi & submit form persona lalu lihat log dev:
#   POST /en/create-persona 500
#   Error: `import('next/root-params').locale()` was used inside a Server Action
# dan cek DB: approval_status tetap 'rejected'.
docker exec supabase_db_globallinkup psql -U postgres -d postgres -c \
  "select approval_status, country_code from public.profiles where id='99999999-9999-9999-9999-999999999999';"
```

---

## Yang sudah benar (jangan diubah)

- Gating: no session → `/login`, pending → `/verify`, non-admin diblokir dari
  `/admin` (dibuktikan dengan probe nyata).
- Tidak ada sisa `TODO(auth)` / mock / `setTimeout` di `src`; paritas key i18n
  EN↔ES 0 selisih.
- Sign-in benar-benar bekerja setelah perbaikan kolom token `auth.users` di seed.
- RLS suite 34/34 hijau.

---

## 🔴 P0 — Persona submit & reset rusak

### F-S2-1 — `getLocale()` di dalam Server Action melempar

`src/lib/i18n/request.ts:16` me-resolve locale lewat `next/root-params`, yang
**tidak tersedia di Server Action**. Bukti log dev:

```
POST /es/create-persona 500
⨯ unhandledRejection: Error: `import('next/root-params').locale()` was used inside a Server Action. This is not supported.
   at savePersonaAction (src/features/persona/actions.ts:27:33)
```

Probe: submit form persona sebagai rejected user → 500, DB tidak berubah.

Call-site terdampak:

- `src/features/persona/actions.ts:27` — **onboarding & resubmit mati total**.
- `src/features/auth/actions.ts:108` — ada di dalam `try`, jadi **ditelan**:
  **email reset tak pernah terkirim** padahal UI bilang "sent".
- `src/features/admin/actions.ts` → `requireAdmin` (`src/lib/auth.ts:67`) →
  `requireApprovedUser` (`src/lib/auth.ts:54`) → **500**.

Aman: `signUp/signIn/signOut/updatePassword` (tak pakai `getLocale`), dan DAL di
layout/page (konteks route).

**Perbaikan:**

- [ ] Kirim `locale` dari klien (`useLocale()`) di payload action
      (validasi `z.enum(["en","es"])`); pakai untuk bio-column + `redirectTo`
      reset.
- [ ] `reviewPersonaAction`: ganti `requireAdmin()` dengan cek non-redirect
      (`getCurrentUser` + `getCurrentProfile`, balikan `{ ok: false }` bila bukan
      admin) — jangan redirect dari dalam action.
- [ ] Beri catatan di `src/lib/auth.ts`: helper redirect **hanya untuk route**,
      bukan Server Action.
- [ ] Bungkus pemanggilan action di view dengan `try/catch` supaya action yang
      gagal tidak jadi unhandled rejection.

### F-S2-2 — Tidak ada tes yang menutup jalur ini

`@auth` e2e tidak pernah submit form persona atau mengirim reset link; pgTAP tak
melihat action. Itu sebabnya P0 lolos.

- [ ] e2e: rejected/pending user submit form persona → cek `/verify` **dan**
      status di DB.
- [ ] e2e (opsional): register baru → submit persona → `/verify`.

---

## 🟠 P1

### F-S2-3 — Prefill form persona membuang data

- `country_code` di luar `COUNTRIES` (`create-persona-view.tsx:15`) **diam-diam
  jadi "ES"** (`:337`). Probe: seed rejected `PT` → form menampilkan `ES` →
  submit mengubah negara salah. Kena juga user `CL`/`CR`.
- `interests` di luar key UI dibuang (`:66`). Seed pakai `photography`,
  `espresso`; UI pakai `analogPhotography`, `ceramicsCraft`, … **DTO discover
  (`architecture`,`photography`,`espresso`) tidak cocok dengan key form** →
  konsistensi untuk S3 dipertanyakan.
- Level bahasa di luar daftar UI hilang (`:58`).

**Perbaikan:**

- [ ] Selaraskan daftar `COUNTRIES`/`INTERESTS`/`LANGUAGES` dengan data
      tersimpan (atau simpan `country_code` bebas + sediakan opsi "lainnya").
- [ ] Tetapkan satu taksonomi interest bersama (form ↔ discover ↔ posts).

### F-S2-4 — Resubmit bisa tak bisa di-submit

Akibat F-S2-3: prefill yang menghasilkan <3 interest yang cocok membuat tombol
submit `disabled` (`canSubmit = selectedInterests >= 3`, `:75`). Probe:
`submit_disabled = true`.

- [ ] Tampilkan minimal 3 interest yang tersimpan, atau longgarkan batas, atau
      beri petunjuk jelas bahwa user harus memilih ≥3.

### F-S2-16 — Path filter CI salah (sebab bug lolos)

`.github/workflows/db.yml` hanya jalan untuk `supabase/**` + `package*.json`,
**tidak** untuk `src/**`. Padahal auth e2e bergantung pada kode `src`.

- [ ] Tambah `src/**` dan `tests/e2e/**` ke `paths` (push + pull_request).

### F-S2-10 — Host-header poisoning pada reset link

`getRequestOrigin()` (`src/features/auth/actions.ts:48`) mempercayai
`x-forwarded-host`; di belakang proxy, `redirectTo` bisa dipaksa ke host lain →
link recovery mengarah ke domain penyerang.

- [ ] Bangun origin dari konfigurasi tepercaya (mis. `site_url`/env), bukan
      header mentah.

### F-S2-5 / F-S2-6 — Persona write tak transaksional & DOB tak bisa dikosongkan

- `savePersonaAction` menulis `profiles` → `profile_private` → `contact_details`
  terpisah; gagal di tengah = data separuh.
- Mengosongkan DOB tidak menghapusnya (upsert dilewati saat kosong).

- [ ] Bungkus dalam satu transaksi (RPC `security definer`) atau tangani
      kegagalan parsial.
- [ ] Kosongkan `date_of_birth` bila field dikosongkan.

---

## 🟡 P2

- [ ] **F-S2-7** — Reset sukses → `/login` tapi sesi masih aktif; pertimbangkan
      sign-out setelah update password.
- [ ] **F-S2-8** — "Explore Stories" di `/verify` mengarah ke `/discover` untuk
      user non-approved → mental balik ke `/verify`. Sembunyikan/ubah untuk
      status non-approved.
- [ ] **F-S2-9** — Link "Admin Portal" di navbar tampil untuk semua orang
      (FR-10.4 minta nav admin terpisah); sembunyikan untuk non-admin.
- [ ] **F-S2-12** — User yang sudah login masih bisa membuka `/login`/`/register`.
- [ ] **F-S2-13** — Preview dossier di `/verify` masih data mock (nama/lokasi/
      minat "Sofia"), bukan data user asli.
- [ ] **F-S2-15** — Catat: jika `enable_confirmations` diaktifkan di cloud,
      `signUp` tanpa sesi → `/create-persona` → `savePersona` balik ke `/login`.

---

## Definisi selesai (gate)

- [ ] F-S2-1 tertutup dan terbukti: submit persona (create + resubmit) sukses
      dari UI, status DB berubah benar; reset link benar-benar terkirim.
- [ ] `reviewPersonaAction` tak lagi 500 saat dipanggil dari klien.
- [ ] e2e menutup jalur persona submit (F-S2-2); `db.yml` memicu pada `src/**`.
- [ ] `db:reset` + `db:test` (34) + `format:check` + `lint` + `typecheck` +
      `test` + `build` + `e2e` (+ `AUTH_E2E=1`) hijau.
- [ ] Dokumen (`s2-auth.md`) diperbarui bila salah satu keputusan berubah.
