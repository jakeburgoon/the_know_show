# The Know Show v1.4.0

The complete Next.js application. Hosts now start with a four-question setup wizard, share a live QR-code Green Room, and optionally join as a player. During play a larger countdown, user-controlled sound cues, and server-saved typed drafts help players avoid accidental missed answers. All established rules, approved art, and questions are preserved.

See `START_HERE.txt` for deployment and `RELEASE_NOTES.md` for detailed changes.

# The Know Show — v1.4.0

A live trivia-night app for up to eight players or teams, with a 45-category, 540-question Standard Trivia bank, two rounds of category drafting, optional private four-choice assistance, Double Takes, The Final Word, and a celebratory Curtain Call.

## Installation / upgrade from v1.2

This ZIP is a **complete replacement project** for the deployed v1.2 app. Extract it, open the inner `the-know-show` folder, and upload the files and folders **inside** that folder to the root of the existing GitHub repository using **Add file → Upload files**. Commit, then let the connected Vercel deployment run. Check the Vercel build log.

- **No new Supabase SQL or environment variables.** Existing v1.2 room data is compatible; a fresh room is nevertheless recommended for testing.
- Preserve your existing deployment configuration and server-side `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` secrets. Never put secrets in GitHub.
- The approved main logo `public/know-show-logo.png` is untouched, as are both PWA app icons.
- If the installed PWA has cached an older version, reopen or refresh it after deployment.

## Answer-format accommodations

The host can assign each player an Answer Format: **Write answers** (default), **Four choices on every regular question**, **Four choices on Medium and Hard**, or **Four choices on Hard**. Adjust these before the game or after pausing an active show.

Each four-choice player sees a private, single-tap selection on their phone for eligible **regular** questions. Written and multiple-choice correct answers receive the same base points. Regular-question speed bonuses are capped at 25% (written) and 10% (four-choice). Double Take rules are unchanged.

**The Final Word always requires an independently typed answer**, regardless of a player's answer-format accommodation. Final wagers and scoring are unchanged.

## Game rules and features

- Up to eight individual players or eight teams; the host can also participate on the same device.
- Players choose four categories per round. Three questions per category: 12 per round, 24 total.
- Opening Act: 100 / 300 / 500. Main Event: 200 / 600 / 1000.
- One Double Take per player per round; regular written hints and optional extra time are configurable.
- TV + Phones or Phones Only; Cool Jazz default with alternate Suno soundtracks.
- Host dispute/ruling controls, replay tracking, room codes, and QR joining.
- Navy-and-gold Curtain Call with trophy, confetti, prominently displayed winner(s) and one final standings table. Ties share the same rank.

## Question bank / quality audit

The original 540 prompts, answers, hints, and source tracking are preserved; 358 distractor sets were rewritten in this version and 182 retained after contextual review. See `CHOICE_OPTIONS_QA.csv` for every option and its review status and `QUESTION_LIBRARY_STATUS.md` for the unchanged independent verification status of the questions themselves. This remains a playtest-friendly set, not 540 independently fact-checked questions.

## Development / deployment

Requirements: Node 20+, Next.js 15, React 19, Supabase.

```bash
npm install
npm run typecheck
npm run test:engine
npm run build
npm run dev
```

Use `supabase/schema.sql` **only** when setting up a new Supabase project; do not rerun it over a working database.

For the detailed changes and validation limits, see `RELEASE_NOTES.md`. A full production build was not possible in this preparation environment because npm dependencies weren't available; verify the Vercel build and real devices after deployment.
