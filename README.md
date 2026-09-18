# MAJESTA — repo of record

Repo ini adalah **rumah konfigurasi, persona, dan doctrine** MAJESTA — bukan
lagi proyek kode. Kode Slice-0 lama diarsipkan di
[`archive/slice0/`](archive/slice0/) (superseded).

## Arsitektur of record: One Brain / Three Doors

- **ONE BRAIN** — satu profil pi yang membawa seluruh identitas dan memori:
  mnemosyne-mcp (memory layer), skills Trinity (T0–T4 placement, session
  routing, verification gates), compound engineering (compound /
  compound-refresh), dan learning-loop. Pintu bersifat stateless soal
  identitas — satu otak untuk semua pintu.
- **THREE DOORS** — tiga pintu akses owner, semuanya ke otak yang sama:
  1. **bb ⇄ pi-acp native** (pintu utama) — thread coding & operasional,
     permission flow ACP native untuk approval.
  2. **beye-bridge → Telegram 24/7** — companion di ponsel; approval lewat
     tombol [Approve]/[Deny] milik pintu Telegram.
  3. **pi TUI lokal** (opsional).
- **Approval bersifat door-scoped** — urusan pintu, bukan urusan otak. Setiap
  pintu memakai mekanisme approval-nya sendiri; tidak ada gating yang dibagi
  lintas pintu.
- **ACP-custom retired** (MAJ-22) — jalur pi-acp custom beserta watchdog-nya
  dibongkar; hanya subtraksi, otak tidak tersentuh.

## Isi repo

| Path | Isi |
|---|---|
| `config/profile/` | template settings profil pi + cara generate `models.json` |
| `config/bridge/` | template env pintu Telegram + model routing |
| `persona/` | persona current-gen (salinan; final di MAJ-14) |
| `doctrine/skills/` | salinan terdokumentasi skills doctrine (sumber runtime = profil pi) |
| `archive/slice0/` | kode Slice-0 lama — tidak dipakai runtime mana pun |
| `.scratch/majesta-core/spec.md` | spec konsolidasi (superseded oleh seri CONS) |

Spec lengkap: `.scratch/majesta-consolidation/spec.md` (One Brain / Three
Doors). Tiket kerja: bb Tasks seri **CONS** (MAJ-17..MAJ-25) — seri ini sumber
kerja aktif; tiket majesta-core lama (MAJ-5..13) dibiarkan apa adanya.

Bootstrap untuk rekonstruksi stack di VPS baru: tiket CONS-05 / MAJ-21.
