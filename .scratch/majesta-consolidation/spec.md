# Spec — MAJESTA Consolidation: One Brain, Three Doors (pi-native, ACP-custom retired)

Status: **draft-for-review** (belum ready-for-agent; jangan eksekusi)
Supersedes: `.scratch/majesta-core/spec.md` (Slice 0 "MAJESTA-as-code" diarsipkan, tidak dilanjutkan)
Source: review session 2026-09-18 (audit ACP vs pi-native vs beye-bridge)

## Problem Statement

Owner mengakses agent-nya lewat beberapa pintu yang tumbuh sendiri — thread bb
via pi-acp (profil default), gateway Telegram via `beye-bridge.py` (profil
paci-x), dan pi-acp custom "Beye (paci-x)". Akibatnya:

- Arsitektur yang sudah diinginkan (Trinity memory placement, memory layer
  system, compound engineering) hidup **hanya di profil paci-x** dan tidak
  mengikuti pintu akses utama owner (bb pi-acp native).
- Pintu ACP-custom menambah satu jalur spawn + satu watchdog cron yang
  redundan terhadap pi-acp native bb untuk use case yang sama.
- Ada tiga identitas berjalan berdampingan (MAJESTA / Beye / profil Hermes lama)
  dan dua repo kandidat "rumah" (Replicate vs paci-x-repo).
- Slice 0 repo Replicate (gateway.ts, memory.ts, CLI) adalah reimplementasi
  lebih muda dari stack yang sudah live — redundansi murni.

## Solution

Satu otak, tiga pintu, tanpa lapisan custom di jalur runtime:

- **OTAK** — satu profil pi (profil default bb, diarahkan menjadi profil
  MAJESTA) yang memuat: mnemosyne-mcp (memory layer), skills Trinity
  (T0–T4 doctrine, session routing, verification gates), compound engineering
  (compound / compound-refresh / pi-compound-engineering), dan learning-loop.
  Aset-aset ini **dipindahkan/direplikasi dari profil paci-x** — bukan
  di-porting ulang, karena semuanya memang aset profil pi-native, bukan
  komponen ACP.
- **PINTU ① (utama)** — akses owner via bb ⇄ pi-acp native. Thread coding &
  operasional berjalan di profil otak; memori & learning loop aktif otomatis
  (sudah terbukti: mnemosyne reachable dari thread bb).
- **PINTU ②** — beye-bridge.py → Telegram 24/7, tanpa perubahan perilaku.
- **PINTU ③ (opsional)** — pi TUI lokal.
- **ACP-custom dibongkar**: entry `customAcpAgents` (beye + hermes), bridge
  script `pi-paci-x-acp.sh`, watchdog `bb-acp-bridge-watchdog-cron.sh`,
  dan arsip `~/.bb/pi-bridge-sessions/`. Otak tidak tersentuh — ini
  pembongkaran pintu, bukan merge.
- **Approval adalah urusan pintu, bukan urusan otak.** approval-gate.ts
  (tombol Telegram) tetap milik pintu Telegram dan TIDAK ikut ke profil otak;
  pintu bb punya permission flow ACP native-nya sendiri. Salin mentah akan
  membuat aksi dangerous ter-block tanpa jalur approve.
- **Repo of record**: Replicate (rename MAJESTA) menyimpan konfigurasi,
  persona, doctrine, dan satu bootstrap script untuk merekonstruksi stack di
  VPS baru. Kode Slice 0 yang redundan diarsipkan dalam repo, tidak dihapus.

## User Stories

1. As the owner, I want one pi profile (MAJESTA) that carries my memory bank,
   Trinity doctrine, and compound skills, so that every door I open serves the
   same brain.
2. As the owner, I want my primary access (bb pi-acp native) to load persistent
   memory and the learning loop automatically, so that I never configure
   anything per-session.
3. As the owner, I want the custom ACP doors and their watchdog retired, so
   that there is exactly one spawn path per surface and no redundant bridge
   processes to babysit.
4. As the owner, I want Telegram to keep working exactly as today (buttons,
   routing, failover), so that the consolidation never breaks my phone
   companion.
5. As the owner, I want dangerous-action approval handled by the door I'm
   actually using (bb permission flow in threads, [Approve]/[Deny] buttons on
   Telegram), so that no action is ever approved-less or blocked forever.
6. As the owner, I want memory captured in a bb thread to be readable from
   Telegram and vice versa, so that my agent is one being across doors.
7. As the owner, I want a single repo of record that can reconstruct the whole
   stack on a fresh VPS, so that my setup survives machine loss.
8. As the owner, I want the redundant Slice-0 code archived, so that nobody
   (including future me) mistakes it for the live architecture.
9. As the owner, I want one identity and one memory bank after cutover, so
   that MAJESTA / Beye / legacy profiles stop fragmenting knowledge.
10. As the owner, I want the Trinity doctrine de-Hermes-ified (references to
    Hermes-era tools updated to pi/Mnemosyne), so that the doctrine's own
    verification tiers stay truthful in the new stack.

## Implementation Decisions

- One-brain topology: a single pi profile is the sole carrier of persona,
  skills, memory bank, and sessions; doors are interchangeable and stateless
  about identity.
- Adoption is asset relocation, not porting: Trinity skills, compound skills,
  learning-loop extension, and the mnemosyne bank pointer are copied from the
  paci-x profile into the target profile. Copy-first (paci-x stays intact
  until cutover), flip at the identity-cutover moment.
- Approval gating stays door-scoped: the Telegram approval-gate extension is
  not loaded in the bb profile; bb threads rely on the host's native
  permission flow. Structural rules that are door-agnostic (workspace-rooting
  refusal) may be re-expressed per door, but the Telegram button flow is not
  shared.
- ACP-custom decommission is subtraction only: remove the bb config entry, the
  bridge script, and its watchdog cron; archive bridge session files. No
  runtime component is merged anywhere.
- Doctrine hygiene: Trinity/memory-architecture references to Hermes-era
  mechanisms are updated to their pi/Mnemosyne equivalents as part of adoption,
  so the doctrine does not carry stale verification anchors.
- Repo of record pivot: the Replicate repo becomes configuration + persona +
  doctrine + bootstrap; its Slice-0 TypeScript (gateway, memory extension,
  CLI scaffold) is moved under an archive path in-repo.
- Bootstrap defines done: a single idempotent script that provisions
  directories, installs profile settings (extensions, packages, skills),
  wires the Telegram bridge env, and registers the watchdog crons — verified
  by actually running it on a clean directory.
- Identity cutover (one persona, one name, one memory bank) is a separate,
  explicitly gated decision moment — it aligns with the existing PXC-13
  cutover gate and is NOT bundled into the mechanical tickets.
- Model catalog consolidation: the vikey provider in the bb profile's model
  catalog gains GLM 5.3, GPT 5.6 SOL, and GPT 5.6 Luna (CONS-08 / MAJ-24), so
  the primary access door never depends on another profile for model choice.

## Testing Decisions

- Behavior over structure: every ticket's acceptance is verified by exercising
  the real door (a bb thread that recalls a memory written from Telegram's
  profile, a Telegram turn that works after ACP-custom removal), not by
  reading config files.
- Profile-loading seam: the highest seam is "spawn pi with the target profile
  and assert the loaded surface" (extensions registered, skills listed,
  mnemosyne bank reachable). Existing precedent: the profile-scoped session
  files and the bridge's subprocess tests.
- Cross-door memory contract: write a memory from door A's session, read it
  from door B's session in the same bank — the round-trip is the test.
- Bootstrap proof: run the bootstrap script against a temp home; assert the
  resulting tree matches the live stack's shape and that pi starts with the
  expected extensions. No snapshot-of-current-data assertions.
- No new test frameworks; bridge keeps its existing subprocess test pattern.

## Out of Scope

- Merging/porting any ACP logic into anything (there is nothing to merge).
- Any new messaging platform (WhatsApp, Google Chat remain cancelled).
- Per-intent routing changes — model routing stays as-is in the bridge.
- Modifying beye-bridge.py behavior beyond nothing (it is frozen this cycle).
- Deleting any data: bridge sessions, paci-x profile, and Slice-0 code are
  archived, not removed.
- Building a dashboard/UI or OSS packaging.

## Further Notes

- Definitions of done: (1) `pi --profile <otak>` (atau profil default bb)
  exposes memory + Trinity + compound + learning-loop from a bb thread and
  from Telegram; (2) ACP-custom doors and watchdog gone with zero regression
  on Telegram; (3) fresh-VPS reconstruction documented and exercised via
  bootstrap.
- Tickets: `.scratch/majesta-consolidation/issues/NN-<slug>.md`, mirrored 1:1 ke
  bb Tasks sebagai seri CONS (MAJ-17..MAJ-24) setelah review owner; seri ini
  jadi sumber kerja aktif. Tiket lama majesta-core (MAJ-5/7/8/9/10/11/12/13)
  dibiarkan apa adanya sampai owner memutuskan penutupannya — seri CONS yang
  menjadi acuan, bukan yang lama. MAJ-14 (PXC-13, gated) tetap momen cutover
  identitas.
- Atomicity rule (review owner): satu tiket = satu perubahan kecil dengan satu
  bukti; worker harus ringan dan fokus. Makanya adopsi otak dipecah dua
  (skills vs memory), dan penambahan model provider jadi tiket sendiri.
