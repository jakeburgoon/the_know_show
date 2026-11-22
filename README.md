**v0.2.5 direct upgrade:** You can install this full project directly over your current **v0.2.2**. You do not need v0.2.3 or v0.2.4 first. See `UPGRADE_FROM_V0.2.2.md` and `RELEASE_NOTES.md`.

## NEW: TV + Phones / Phones Only

Choose in **Host Controls → Where everyone plays**. The familiar TV + Phones experience remains the default; Phones Only puts a live scoreboard, category board, category/value preview, questions, and results on everyone's phone. The host can present the **public Join QR** directly from their phone or text an invite link. Host controls and Player View coexist on the same phone. The host phone can play Suno music in Phones Only; the TV plays music in TV + Phones. These are display arrangements, independent of Individual/Team gameplay, and can be switched mid-show without resetting progress.

**Audited direct-upgrade release:** This package fixes TypeScript configuration so a development-only shim file left behind by v0.2.2 will not affect production. For v0.2.2 users, see `UPGRADE_FROM_V0.2.2.md`. For the 96 new questions, see `QUESTION_AUDIT_96.md` and `QUESTION_AUDIT_96.csv`.

# The Know Show — v0.2.5 family playtest

A full Next.js project package for the existing Vercel + GitHub + Supabase deployment. This is a cumulative update that can be installed directly over v0.2.2, v0.2.3, or v0.2.4; it builds on v0.2.3 and **does not require new Supabase tables or environment variables**.

## Updating an existing installation

1. Extract `the-know-show-v0.2.5-direct-from-v0.2.2.zip`.
2. In the `the-know-show-v0.2.4` folder, upload its contents to the root of your current GitHub `theknowshow` repository, replacing matching paths. Do **not** upload the outer folder or the `.zip`; do not upload a local `.env` file. Commit the changes.
3. Wait for Vercel to deploy, then reload the site. New games default to **General Trivia**. Existing v0.2 room states remain compatible; however, start a fresh room to configure the new question set before drafting categories.
4. On the host phone, go to **Host Controls → Game settings → Trivia questions** and choose General Trivia, Family Friendly, or Challenging. That choice stays fixed after the draft starts. Host still sets hints and accommodations separately.
5. Player/Team joining now asks for **name only**. People who played in an existing room keep their current player credentials and scores.

## Category draft improvements (v0.2.4)

- After the Green Room, phones switch to a distinct **Build the Board** draft stage with dark teal styling, five-pick progress, and a prominent "your turn" / "choosing now" status.
- Every available category now includes an explanation, especially useful for creative names such as **Three Clues, One Answer**, **Myth Behaving**, and **Wait, What?**. These descriptions are visible to everyone, including people waiting for their turn; only the current player can select one. The host can also choose from Host Controls.
- The TV has its own draft screen with the available category names **and descriptions**, the current chooser, and the evolving five-category lineup.
- Descriptions for the 29 original creative categories have been clarified; the 16 classic descriptions are retained. No question text, scoring rules, pool sizes, category counts, or database schema changed.
- Existing rooms in the draft phase are compatible; refresh their pages to see the new screen. No new Supabase SQL is needed.

## Trivia settings and question bank

- **General Trivia (default):** uses the existing editorially reviewed general candidate questions.
- **Family Friendly:** favors recognizable categories and easier alternatives within twelve overlapping categories.
- **Challenging:** favors deeper-knowledge categories and harder alternatives in those same twelve categories.
- All settings still mix classic and creative categories, with 5 categories × 4 levels per round. The host chooses the question set for the **whole game**, never individually by age.
- The library now has **549 question candidates across 45 categories**, including **96 additional questions** written for Family Friendly / Challenging variants of 12 shared categories (four levels × two tailored settings per category). The other 33 categories reuse the broad question candidates for now.
- Question records now contain an `audiences` array, e.g. `['family']`, `['general']`, or `['family','general','challenging']`. Existing questions are accessible in all settings. The game normally prioritizes questions tagged for the chosen setting, but retains the shared questions as alternatives for replayability.
- The Final Word now selects a question from its existing family/teen/adult pool based on the **room's chosen trivia setting** instead of player ages.
- All 96 newly added questions passed a wording/structure and duplicate-prompt check. They have **not yet been individually independently fact-verified from external sources**. Some of the original candidate items also still need independent fact checks; use host dispute/skip controls for any issues during playtests.

## Player phone usability

- **Category/value preview** is now a contrasting dark-blue/teal stage with large gold points and a clear 'Get ready' message.
- **Live question** uses a compact high-contrast panel with category, point value, timer, question and answer field together. The player can tap the input immediately below the question without scrolling past a big score card.
- **Double Take** appears just above the answer input and can be activated after viewing the question, before submission.
- **Hints & assistance** are in an expandable section beneath the answer field, reducing routine scrolling. Revealed assistance is kept private.
- The iOS-safe 16px input font remains to reduce automatic text zoom. The keyboard closes on answer submission.
- Ordinary players still do not see TV Preview; hosts can switch between Player/Host/TV views.

## Other v0.2 gameplay retained

Individual Everyone Answers, Team Turn-Based, Double Takes, automatic answer checking, disputes, host score overrides, host + player dual roles, paused accommodation changes, five-by-four question boards, the dedicated TV leaderboard, public and private QR codes, and the 12 linked Suno arrangements remain unchanged. **Cool Jazz** is still the default soundtrack, played through Suno's embedded player on the TV. Suno playback and volume may require direct TV interaction.

## Technical validation

This version passed 27 Node engine tests and TypeScript syntax/type-shape validation using temporary dependency shims. A complete production `next build` was not run because installable npm dependencies were not available in this environment. Treat this as a **family playtest release**. In a normal development environment, run `npm install`, `npm run typecheck`, `npm run test:engine` and `npm run build` before broader deployment.

The host secret and service-role key must never be committed to GitHub. Vercel still needs only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
