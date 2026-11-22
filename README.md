# The Know Show — v1.2.0 (Answer Choices Update)

A complete replacement project for the existing **The Know Show v1.1** website. This release replaces first-letter and answer-length accommodations with a per-player multiple-choice option. It preserves the approved logo, navy/gold UI, and all v1.1 game rules.

## What's new

The host can select each player's **Answer format** in the Green Room or, during a game, after pausing in Host Controls:

- **Write answers (default):** No four-choice assistance. Normal typed answer field.
- **Four choices — every question:** Four answers on every regular question.
- **Four choices — Medium & Hard:** Four answers on the middle and top difficulty rows, typed on Easy.
- **Four choices — Hard only:** Four answers on the highest difficulty row, typed on Easy/Medium.

The Final Word is treated as **Hard** for answer-format accommodations. Each eligible player sees four answer buttons on their own phone, with **one-tap submission**. Other players and the host's management view don't see the choices; a host who also plays sees their own choices only in **Player View**.

Correct answers earn the **same base points** in both formats. The regular-question speed bonus is capped at **10% for four-choice answers** and **25% for typed answers**. Double Takes still double the base points before the normal speed bonus. Wrong answers earn zero. The Final Word's wager-based scoring is unchanged and has no separate speed bonus.

Regular written hints and optional extra time remain available and can be customized. First-letter and answer-length support have been removed from the UI and grading logic.

## Multiple-choice content quality

The 540 Standard Trivia questions now each contain **three incorrect answer options** alongside the correct answer (1620 distractors total). Many were generated from topic-specific pools and some were individually refined. Automated checks confirmed four distinct options and checked that none of the explicit distractors is graded as a correct answer. The complete review spreadsheet is **`CHOICE_OPTIONS_QA.csv`**.

**Important editorial caveat:** Not all 1620 new distractors have been individually reviewed for plausibility or ambiguity; some may be too easy or oddly matched to their question. This is a family-playtest release, **not a claim that every multiple-choice option has been quality-certified**. The 540 original Standard Trivia questions and original hint text retain their previous (partially verified) status. The host may still skip a faulty question or rule on a dispute.

## Upgrading v1.1 to v1.2

1. Download and extract the full v1.2 ZIP.
2. Open the inner **`the-know-show`** folder.
3. In the root of your existing GitHub `theknowshow` repository, select **Add file → Upload files**.
4. Drag all files and folders from **inside** the extracted `the-know-show` folder into GitHub, replace matching paths, and commit. Vercel will redeploy if connected.
5. Refresh the website (reopen the installed PWA if it still shows an old cached version).
6. In each room, open **Host Controls → Player accommodations**, then assign answer formats. Existing first-letter/answer-length settings are intentionally ignored.

**No Supabase SQL changes, keys, or new environment variables** are required. Existing v1.0/v1.1 game-room snapshots are compatible with the game engine. Creating a new room is recommended for a clean playtest, but isn't required for an existing v1.1 room.

If you're upgrading from an older release than v1.0, create a fresh room because the core game schema changed in v1.0.

## What stays the same

- Standard Trivia only: 45 categories, four categories × three questions per round, 24 regular questions total.
- Round 1: 100/300/500; Round 2: 200/600/1000.
- One Double Take per player per round.
- Individual Everyone Answers or turn-based Teams.
- TV + Phones or Phones Only; host may also play from the same device.
- Private host controls, QR joining, dispute review, and automatic Final Word reveal after wagering.
- Approved logo file **`public/know-show-logo.png`**, identical to the original user-approved image.
- Suno-hosted soundtrack choices with Cool Jazz as default.

## Installation requirements

Node 20+, Next.js, and the existing Supabase project. On Vercel, keep the current server-side environment variables:

```env
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVER-SIDE-KEY
```

Do not commit credentials. If installing from scratch, run `supabase/schema.sql` once in a new Supabase project. Do not rerun it over your working database.

## Tests and limits

- 19 engine/regression tests passed, including choice privacy, difficulty gating, scoring, answer validation, compatibility with the Final Word, score disputes, replay selection, and a complete two-round game.
- A TypeScript/TSX shape check passed in a dependency shim environment.
- A full Next.js production build was **not** run because the required npm packages weren't installed in the working environment. Check the Vercel deployment log for final build confirmation.
- Multiple-choice answer plausibility and the original question bank remain subject to additional editorial and factual verification.
