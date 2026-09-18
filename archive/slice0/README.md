# Slice-0 (ARCHIVED — superseded by live stack)

Kode eksperimental "MAJESTA-as-code" (Slice 0) dari awal repo Replicate:
branding layer, CLI, system-prompt builder, memory extension, Telegram
gateway skeleton, plus unit/e2e tests.

**Superseded by live stack — One Brain / Three Doors.** Lihat
[../../README.md](../../README.md) untuk arsitektur of record dan
`.scratch/majesta-consolidation/spec.md` untuk spec konsolidasinya.

Stack live sekarang:

- **Otak** — satu profil pi (mnemosyne + Trinity + compound + learning-loop).
- **Pintu** — bb ⇄ pi-acp native (utama), beye-bridge → Telegram, pi TUI.
- Konfigurasi & doctrine of record: `config/`, `persona/`, `doctrine/` di root repo.

Kode di sini **tidak dipakai runtime mana pun** dan disimpan murni untuk
sejarah (keputusan: arsip, bukan hapus — lihat spec, Out of Scope).
`package.json` ikut dipindah ke arsip: dependencies-nya hanya relevan untuk
kode Slice-0, dan root repo kini berisi config/doctrine/persona (Markdown +
template), bukan proyek Node.
