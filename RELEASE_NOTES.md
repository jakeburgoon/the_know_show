# The Know Show — v0.2.5 (Phones Only + TV + Phones)

This is a **cumulative, full project** update that can be uploaded **directly over v0.2.2**. No v0.2.3 or v0.2.4 installation is required.

## New in v0.2.5

- **Display arrangement:** In Host Controls choose **TV + Phones** (the familiar default) or **Phones Only**. The host may change it during a game without resetting rounds, answers, timers, or scores. The selection is a **presentation preference**, not a separate game mode; Individual Everyone Answers and Team Turn-Based both work with either choice.
- **Full game on each player phone:** The existing mobile category draft, question selection board, category/value introduction, answer entry, and reveal now work as a complete play experience without the TV. In Phones Only, a compact sticky **live scoreboard** is visible near the top, including player rankings and scores.
- **QR/link invitation from the host phone:** Host Controls shows the public Join QR in the Green Room. New **Share invite** (native mobile share sheet where available) and **Copy join link** controls are included. Players can still join by entering the room code. The private host QR is only needed to transfer host privileges to a second device.
- **Soundtrack on the host phone:** In Phones Only, the host gets a persistent Suno player; it stays mounted while switching the **Player** and **Host Controls** tabs. Other phones remain silent. In TV + Phones mode music stays on the TV. Cool Jazz arrangement 1 remains default. Embedded music must be started manually and browser policies may interrupt it; Suno's own player handles playback and volume.
- **Hint preservation:** Changing a soundtrack or display arrangement mid-game no longer replenishes already-used player hints.
- **Host can play:** Independent host and player credentials remain supported; the host can switch tabs to play and administer the room. Regular players do not see the TV Preview tab.

## Everything included from v0.2.3 and audited v0.2.4

- General Trivia default; Family Friendly and Challenging alternatives, with question-level audience tags.
- 549 candidate questions across 45 classic + creative category themes, including 96 additional audience-specific items and the 14 question corrections from the audited 0.2.4 package. These are **editorially screened**, not exhaustively independently source verified.
- Join by name only (no age), five categories x four levels per round, compact answer entry and distinct category/value intro.
- Restored creative category descriptions, separate **Build the Board** draft presentation on phones and TV, and curated draft pools based on the number of players.
- Automatic answer checking, modest accuracy/speed scoring, two Double Takes per player per round, hints, dispute overrides, team steals, pause/edit accommodations, and The Final Word.
- 12 Suno arrangements in six styles; Cool Jazz default.

## Technical / rollout

- No new Supabase tables, SQL changes, or Vercel environment variables.
- The existing v0.2 room state shape remains compatible. Rooms created on v0.2.2 default to TV + Phones unless the host selects Phones Only. New room recommended to experience the new question settings before drafting.
- **27 engine/regression tests passed**, plus TypeScript source/type-shape validation with stand-in declarations. A complete Next.js production build was not verified here because npm dependencies could not be installed; treat this as a playtest release.
- See `UPGRADE_FROM_V0.2.2.md` for exact instructions, including how to handle two stale development-only files that GitHub may retain.
