# The Know Show v1.5.7

The complete Next.js application, cumulative through v1.5.7. In addition to reviewed, Next/Previous guided host setup, refreshed homepage copy with four feature chips, reliable countdowns, and automatic submission of saved typed drafts, Final Word now offers a clear server-synchronized timer, a separate 56-question championship pool, and two private hints purchased exclusively for 500 points each before wagering. The host/player flow, in-app QR scanning, score reveals, game-board styling, season-aware category selection, and across-show repeat reduction are also updated. Existing trivia and approved artwork are preserved.

In v1.5.5, the room-opening screen uses the approved logo and a subtle gold progress animation. Host answer-format descriptions explain written versus four-choice play in plain language, with a note about balancing ages and abilities. The Green Room shows the TV-display action only for TV + Phones, and hosts opening the display can return directly to Host View, including when also participating as a player. See `START_HERE.txt` for deployment and `RELEASE_NOTES.md` for detailed changes.

# The Know Show — v1.5.7

A live trivia-night app for up to eight players or teams, with a 56-category, 738-question library (45 year-round categories plus eleven seasonal ones), two rounds of category drafting, optional private four-choice assistance, Double Takes, The Final Word with a two-hint cap and pre-wager hint purchases, and a celebratory Curtain Call.

## Installation / upgrade from v1.2

This ZIP is a **complete replacement project** for the deployed v1.2 app. Extract it, open the inner `the-know-show` folder, and upload the files and folders **inside** that folder to the root of the existing GitHub repository using **Add file → Upload files**. Commit, then let the connected Vercel deployment run. Check the Vercel build log.

- **No new Supabase SQL or environment variables.** Existing room data is compatible; a fresh room is nevertheless recommended for testing.
- Preserve your existing deployment configuration and server-side `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` secrets. Never put secrets in GitHub.
- The approved main logo `public/know-show-logo.png` is untouched, as are both PWA app icons.
- If the installed PWA has cached an older version, reopen or refresh it after deployment.

## Answer-format accommodations

The host can assign each player an Answer Format: **Write answers** (default), **Four choices on every regular question**, **Four choices on Medium and Hard**, or **Four choices on Hard**. Adjust these before the game or after pausing an active show.

Each four-choice player sees a private, single-tap selection on their phone for eligible **regular** questions. Written and multiple-choice correct answers receive the same base points. Regular-question speed bonuses are capped at 25% (written) and 10% (four-choice). Double Take rules are unchanged.

**The Final Word always requires an independently typed answer**, regardless of a player's answer-format accommodation. There are two progressive Final Word hints per question in the new standalone 56-question Final Word bank. Regular-game hints never carry into Final Word; each player may instead purchase up to two Final Word hints for 500 points each **before wagering**. Each purchase immediately reduces their balance and maximum wager.

## Game rules and features

- Up to eight individual players or eight teams; the host can also participate on the same device.
- Players choose four categories per round. Three questions per category: 12 per round, 24 total.
- Opening Act: 100 / 300 / 500. Main Event: 200 / 600 / 1000.
- One Double Take per player per round; regular written hints and optional extra time are configurable.
- TV + Phones or Phones Only; Cool Jazz default with alternate Suno soundtracks. During a show, a compact header music menu lets anyone in the room select the shared track, unless the host turns that permission off. Audio plays only from the host phone or TV. The embedded player may require pressing Play after a track change.
- Host dispute/ruling controls, automatic return to Player View, replay tracking between rematches and new shows created on the same host browser, room codes, and in-app camera QR joining.
- The larger sound-effects panel is deferred; prominent synced Final Word timer. Answer-first results animation with ✓/✕, points changes and a leaderboard beat.
- Seasonal categories become eligible automatically in the applicable months using US Eastern calendar time. Every Build the Board phase offers one eligible seasonal category (when at least one is in season), alongside year-round categories; players are not required to select it. The 45 year-round categories remain available at all times.
- Navy-and-gold Curtain Call with trophy, confetti, prominently displayed winner(s) and one final standings table. Ties share the same rank.

## Final Word question selection and audit

Final Word has a **dedicated bank of 56 medium-hard/hard questions**, one for each year-round or seasonal category. They do not appear in standard play; Final Word chooses from seasonally eligible categories **not on either board in the current game**, preferring questions not recently seen. The 18 former final questions remain only as compatibility entries for already running rooms.

All 56 active questions and both progressive hints were editorially reviewed for answer accuracy, aliases, and hints that help without spelling out answers. The per-question source/reference and audit worksheet is `FINAL_WORD_CATEGORY_REVIEW.csv`. Consult `FINAL_WORD_FACT_CHECK.md` for review method and limits. This Final Word audit is separate from the 738 regular-game questions.

## Question bank / quality audit

The original 540 prompts, answers, hints, and source tracking are preserved, together with their previously reviewed options. The seasonal bank now contains 198 questions across eleven categories, with six questions per difficulty; 66 are new in v1.5.7, bringing regular play to 738 questions. The original multiple-choice review covered 358 rewritten and 182 retained sets. See `CHOICE_OPTIONS_QA.csv` for the original bank and `SEASONAL_QUESTION_QA.csv` for the first 132 seasonal questions, plus `SEASONAL_QUESTION_EXPANSION_QA.csv` for the 66 additions and their alternatives, hints, and references; consult `QUESTION_LIBRARY_STATUS.md` for the status of source verification. This remains a playtest-ready question set, not a claim that every question has been independently verified.

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

## Calendar categories and repetition

Seasonal category visibility is automatic: Thanksgiving, Veterans Day & Military Traditions, and Native American History & Culture (November); Christmas Movies and Christmas Music (November–December); Harvest Time and College Football Traditions (September–November); Winter Holidays, Winter Traditions and Winter Olympics (December–February); New Year Traditions (December–January). Each now offers 18 questions (six per difficulty). Category offers use weighted random selection: recently played or offered categories are less likely but are never excluded solely for being used before. The number of unseen questions in each category also affects its probability. One eligible seasonal category is still offered per draft when in season. Individual question selection prioritizes unseen questions, then least-recently-used questions. A finite pool can still eventually repeat. For a **new show created from the same hosting browser**, game history is retained in local storage; **Rematch** retains it in the room state as well. A different host device/browser does not share that history automatically.

The 66 added seasonal questions were screened for contextual answer types, plausible alternatives, hint usefulness, category balance, and answer overlap with Final Word. Their individual reference links and editorial notes are in `SEASONAL_QUESTION_EXPANSION_QA.csv`. Original seasonal questions are in `SEASONAL_QUESTION_QA.csv`. This editorial review is not independent source corroboration of every trivia fact.

**v1.5.2:** The Final Word player view combines the hint shop, balance, wager slider, and instant correct/incorrect projections on one screen. See `FINAL_WORD_CATEGORY_REVIEW.csv` for the new 56-question Final Word pool and two paid hints per question. The earlier `FINAL_WORD_HINTS_REVIEW.csv` remains as a legacy reference for games that started in an older version.


### Repeat protection (v1.5.5)
The app remembers recent categories and questions within a host browser and recovers the host's recent room histories from Supabase when starting a new show. This reduces repeats across new room codes and rematches on the same browser; it does not yet synchronize histories across browsers or account logins. For the best experience, keep hosting from the same browser until optional account sign-in becomes available. See RELEASE_NOTES.md for details.
