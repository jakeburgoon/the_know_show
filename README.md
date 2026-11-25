# v1.13.12 — Rules refresh

Updated full How to Play guide and shortened mode-aware player quick rules. No gameplay, question-bank, or SQL changes.

# v1.13.11 — Player settings and direct host review

Simplified joined-player Green Room, gear menu for answer-format requests and quick rules, temporary player reminder, and automatic focus/scroll to the first pending host decision. No SQL changes.

# v1.13.10 — Simpler Green Room answer formats

The chosen common format is summarized; individual customization is collapsed by default. Individual preferences show expanded controls and requested formats. Optional ages stay visible; age suggestions only appear with the customization controls. No SQL changes.

# v1.13.9 — Production typecheck hotfix

Preserve required active question identifiers in the game view so hint actions pass strict TypeScript checking. Replace CSS align-items:end with flex-end. No SQL changes. All v1.13.8 features retained.

# v1.13.8 — First-show recommendation and next-show tips

Everyone chooses is the new-room default and appears first with a first-show recommendation. Curtain Call offers a short suggestion for a different answer format; rematches retain settings unless changed. See V138_FIRST_SHOW_SETUP.md. No new SQL beyond v1.13.5.

# v1.13.7 — Hint purchase controls

Gold lightbulb buttons in regular play; sequential, refundable Final Word hint tiles before wager lock; fixed wager with affordability clamp and live score projections. See V137_HINT_TILES_SETUP.md. No new SQL.

# v1.13.4 — Answer Format & Player Preferences

- Host setup has three steps, including four answer formats: Everyone writes (default), Everyone chooses, Everyone uses the same mixture (Hard or Medium and Hard), and Individual answer preferences.
- Common formats apply to new joiners; individual mode asks joiners and participating hosts for a preference. Hosts can override individual settings in the Green Room and live Host View. Age suggestions in the new setup are advisory, with a Use suggestion button; explicit player choices are not overwritten. Legacy rooms without the new format setup retain their prior age behavior.
- Players may request changes during a show; host approval/decline does not interrupt gameplay. Changes begin with the next question, with the current question's answer-format snapshot retained. Final Word is still written-only; setup calls it the final question. Scoring is unchanged. Preferences are room-state fields, not account profiles.
- No new SQL or environment variables if v1.13.2 or v1.13.3 is already deployed. The cumulative update-only ZIP includes files changed since v1.12.1; run the v1.13.0 and v1.13.2 SQL migrations if not already applied. Upload the contents of the the-know-show folder at the repository root, keeping paths intact.
- Validation: 100/101 engine tests pass (four new answer-format tests pass); the existing Famous Landmarks/Machu Picchu overlap remains. 58/58 UI source-contract tests pass. Changed TS/TSX files parse successfully. Full Next.js typecheck/build and real-device/Supabase tests are not available in this environment.
- Live smoke test: create a new room for each common format, join from two devices, verify question choices match the host selection; in individual mode verify player preference, age suggestion, host override, request/approval during an open question, and next-question behavior. Confirm the final question remains written for everyone.

# v1.13.3 — Gameplay flexibility and review breaks

- Live per-player answer support in Host View, effective at the next question; welcoming explanation and 9.5-second host onboarding tip with settings and score controls.
- One additional second of answer reveal; late review of the previous regular question before the next question begins; server-enforced pause for disputes, with corrected scores and statistics.
- One shared five-second feedback break per result, followed by a resumption notice. Feedback can still be finished after the break.
- No new Supabase migration or environment variables. See `V133_GAMEPLAY_SETUP.md`. Privacy and age-analysis scope unchanged.

# v1.13.2 — Age-based answer support

- Optional individual Green Room age selector: Under 10 and 10–12 → all regular questions; 13–15 → Medium and Hard; 16–17 → Hard only; 18–29, 30–49, 50+ → written. Not specified leaves existing support unchanged. The host can override the slider. Final Word stays written for everyone. Age does not affect category or question selection or scoring rules.
- Adult age bands are stored in the private active room state, retained for a rematch, and used for per-show/question aggregate counts, not attached to individual response rows or persistent exposure histories. Under-18 age bands are used to recommend support but are not saved; the host's local selection can reset on refresh or rematch, while the resulting support setting persists. Team seats do not collect age. No exact ages or dates of birth are requested. Child age-group analytics are deferred pending privacy review.
- In Developer → Show & Question Statistics → Question statistics, adult age-group accuracy appears only when at least 10 answers across 5 shows are available for a question/band, with the same threshold for each displayed answer format. These are attempts, not unique individuals. Overall performance collection remains active for all participants. Historical questions have no age breakdown until qualifying data accumulate. No age summaries appear in recent-show responses or on the public player/TV views.
- Run `supabase/upgrade_v1_13_2.sql` after the v1.13.0 migration, before uploading. The migration adds a service-role-only report function and no new tables. No new environment variables. Existing question bank, exposure selector and game rules are unchanged. Production integration is not tested locally.

# v1.13.1 — Clearer guest history opt-in

- Explains the benefit directly in the guest history checkbox label: helps avoid repeats. The optional, adults-only restriction and unchecked default remain. No new SQL or environment variables beyond v1.13.0.

# v1.13.0 — Replayability and exposure tracking

- Persistent server-side history at show start; record question exposure at reveal in the same transaction as the room update.
- Prioritize unseen questions and fresh categories; retain seasonal guarantee, eight options, and category availability settings.
- Optional adult guest browser history, show and question statistics, category and question selection diagnostics, CSV export.
- REQUIRED: Run `supabase/upgrade_v1_13_0.sql` before deployment; see `V130_EXPOSURE_SETUP.md` for setup, optional database smoke test and limitations. No new environment variables. Accounts, groups and age data deferred.
- 76 categories / 1,072 questions unchanged. Famous Landmarks remains disabled unless explicitly enabled.

# v1.12.1 — Accurate flags and category availability

- All 13 flag images are sourced from the user-supplied Flagpedia PNG archive, resized proportionally (maximum 1280 px), visually inspected, and documented in IMAGE_CREDITS.json. Question wording, IDs, hints and difficulty are unchanged. Old image files remain for historical feedback references.
- Developer dashboard → Category availability: enable or disable any category globally. Changes are stored server-side and captured when a new show starts, including rematches. Already-started shows are not interrupted. Disabled categories are excluded from both boards and Final Word but remain available in Question Lab. Seasonal availability still applies. At least 12 year-round categories must remain enabled.
- Famous Landmarks is initially disabled by the migration because it still contains temporary illustrations. Re-enable it after actual photos are installed. Rerunning the migration does not overwrite an existing choice.
- REQUIRED: Run `supabase/upgrade_v1_12_1.sql` in the existing Supabase SQL Editor **before** deploying. No new Vercel variables. If the migration is missing or database access fails, starting a new show returns an explanatory error rather than silently ignoring category settings.
- Focused engine compilation passed; 77/78 engine tests and 52/52 UI/source tests passed. The one pre-existing failure concerns Machu Picchu appearing in both the ordinary bank and the Famous Landmarks Final Word. Full Next.js production build and live Supabase/browser testing remain unverified.

# v1.12.0 — Developer Question Lab

This cumulative build adds a private Question Lab inside the existing developer dashboard.

## Highlights

- Browse the full published question bank without starting a show
- Filter by category, difficulty, image use, search text, or a manually built playtest set
- Preview any question in a phone-style or TV-style card
- Toggle Round 1 / Round 2 point values
- Preview written-answer or multiple-choice presentation
- Reveal hints and answers manually
- Try a sample response with the app's real answer-matching logic
- Build a category-based playtest set for targeted review

Existing feedback dashboard features remain in place.


---

# v1.11.1 — Visual trivia pilot

- Flags of the World: 12 regular questions and one Final Word, all visual. 76 categories, 1,072 playable questions.
- Optional local image metadata, shared phone/host/TV renderer, image-aware feedback and export. No new database migration after v1.10.0.
- See `V111_IMAGE_PILOT.md` and `IMAGE_CREDITS.json`. Deploy between shows.

# v1.10.0 — Player feedback and private developer dashboard

- Optional question feedback after regular and Final Word reveals; optional show feedback after the Curtain Call.
- Private `/developer` dashboard: review, filter, update status and export feedback.
- **Required one-time setup:** run `supabase/upgrade_v1_10_0.sql` and configure `DEVELOPER_PASSWORD` in Vercel. See `FEEDBACK_SETUP.md`.
- The 74 categories, 1,046 questions, branding and scoring rules are unchanged. Question-performance analytics are deferred.

# v1.9.2 — Two lyric categories

- Finish That Lyric! (year-round): 12 regular + 1 Final Word. Christmas Sing-Along (November–December): 18 regular + 1 Final Word.
- 74 categories; 972 regular and 74 Final Word questions (1,046 playable). Public-domain lyric text only; see `V192_LYRIC_REVIEW.csv` and `V192_AUDIT_NOTES.md`. No schema or engine changes. Deploy between shows.

# v1.9.1 — Wordplay follow-up

- Restore full Before & After blended phrases (six regular questions and one Final Word); the Cuckoo’s Nest Egg answer intentionally combines the novel title with “nest egg.” Clarify that the full blended phrase is required.
- Replace the grandmother puzzle with a race-position puzzle (Second place), retaining its Medium slot and ID.
- All other v1.9.0 audit decisions retained. No category removal, scoring, or schema changes. See `V191_QUESTION_CHANGE_LOG.csv` for exact follow-up edits. The v1.9.0 log remains a historical record. Deploy between games.

# v1.9.0 — Conservative question-quality audit

- Screened the 942 regular and 72 category Final Word records by difficulty and answer length, with targeted editorial review of flagged items and aliases. Changed 91 questions (82 regular and 9 Final Word); 923 unchanged. Five paired difficulty swaps (10 questions), 15 prompt revisions and 82 alias-list changes, with overlap between these counts.
- Retain four regular questions per level (six for seasonal categories), all 72 categories and all 1,014 IDs. No new category, no general fuzzy-matching change, no scoring or database changes.
- Short answers encouraged; long proper names/titles may remain the displayed canonical answers with shorter context-specific aliases. For some Before & After clues ask for the missing part of the blended phrase.
- See `V190_QUESTION_CHANGE_LOG.csv` for exact before/after text, levels, choices, aliases, hints and reasons; `V190_AUDIT_NOTES.md` for calibration decisions and limits.
- All 105 engine/UI tests passed (64 engine, 41 UI), including new acceptance and negative-answer regression tests. Focused TypeScript compilation passed with locally available Node type definitions. Full Next.js production build and live player testing not verified here. Deploy between shows.

# v1.8.6 — Final Word reveal timing and champion title

- Use “The Show’s Champion” instead of “Tonight’s Champion”; co-winner wording is unchanged.
- Purchase up to two Final Word hints before locking wagers, at the existing cost of 500 points each. Hint text is withheld by the server during wagering; purchases and costs are still visible.
- Automatically reveal each player's purchased hints when the question and timer start, including when the host starts Final Word manually. No extra taps or sharing of hints with other players.
- Enforce locked wagers on the server. Preserve scoring, question banks, branding, and schema. Question difficulty and answer-alias audits are deferred to v1.9.0.

# v1.8.5 — Balanced landing page

- Restore a slim cream header with a small dimensional navy-and-gold How to play button, without a duplicate logo.
- Increase hero, headline, tagline and entry-card spacing on desktop and mobile; adapt spacing on short phone screens.
- No gameplay, question bank, branding assets, or database changes.

# v1.8.4 — Landing page spacing

- Restore modest spacing between the hero elements, Ready to play heading, entry cards and secondary features on desktop and mobile. Short phone viewports retain tighter vertical spacing.
- Preserve the upper-right guide link, tagline, branding, all gameplay, question banks and database schema.

# v1.8.3 — Small usability improvements

- Replace the landing-page How to play pill with a gold underlined link in the top-right of the navy hero on all screen sizes.
- Prevent unintended iOS focus zoom with text fields and selects at least 16px on mobile/touch devices; preserve manual pinch zoom.
- Green Room answer-choice slider: explicit question, four clearly labeled stops, full current-selection wording, 44px input height and larger 32px thumb. The Final Word remains written for everyone.
- No gameplay, database, question bank or branding changes.

# v1.8.2 — Compact landing page on phones and desktops

- Remove the separate top banner and duplicate logo on all screen sizes; center How to play beneath the approved headline and new tagline: “Over 70 categories. More than 1,000 questions. A different show every time.”
- Reduce hero height, whitespace and card decoration; put Host a show and Join a show ahead of secondary feature badges. Keep the QR scanner and six-character player join code.
- Hide the hosting passcode field by default. If the existing server-side ROOM_CREATION_PASSCODE gate rejects creation, reveal a password field and allow a retry. This is a deployment-wide hosting credential, not the automatically generated player join code; no authentication changes or Green Room passcode feature.
- No gameplay, question bank, logo, icon, database or environment changes. All v1.8.1 draft improvements are retained.
- Validation: 95 automated engine and UI/content tests passed; full production build requires Vercel because application dependencies are not installed locally.

# v1.8.1 — Build the Board: eight choices, more seasonal variety

Each round offers **eight categories**, regardless of the number of players or teams, and players select four. When an unselected, in-season category is eligible, one offer is guaranteed; the remaining seven are drawn from all other eligible categories with the existing history and question-variety weights. There is no seasonal cap, and no obligation to choose seasonal content. Round 2 excludes all four Round 1 selections. Existing in-progress drafts keep their stored offers; new drafts use the new rules.

The 72-category, 1,014-question library and approved branding are unchanged. No Supabase migration or new environment variables are needed.

# v1.8.0 — 1,000-question milestone

Complete cumulative application update based on v1.7.0. Adds **The No-Show!** (year-round; 12 regular questions), **Christmas Legends & Lore** (November–December; 18 regular questions), and **Creepy Creatures** (October–November; 18 regular questions), plus **three separate Final Word questions**. Totals: **72 categories, 942 regular questions, 72 category-linked Final Word questions — 1,014 questions**.

The homepage now promotes **over 70 categories** and **over 1,000 questions**, and the How to Play guide reflects the updated library. All previous features, approved logos and app icons, and Supabase schema are retained. See `V180_REGULAR_REVIEW.csv`, `V180_FINAL_WORD_REVIEW.csv`, and `V180_AUDIT_NOTES.md` for this release's question audit. This is an editorially reviewed question expansion, not a guarantee of independent expert certification of every fact. No new environment variables or Supabase migrations are needed.

## v1.7.0 — 13 new year-round categories

Adds 156 regular trivia questions and 13 separate Final Word questions, bringing the bank to **69 categories / 894 regular questions / 69 category-linked Final Word questions**. Review `NEW_REGULAR_CATEGORIES_QA.csv`, `NEW_FINAL_WORD_QA.csv`, and `NEW_CATEGORIES_AUDIT_NOTES.md`. Existing trivia, branding, game logic, and database schema are retained.

# The Know Show v1.7.0

The complete cumulative Next.js app, including 69 categories, 894 regular questions, and 69 Final Word questions. This update simplifies hosting for families: hosts make **two quick choices**—individuals or teams (individuals selected by default), then Just phones or TV + phones (Just phones selected by default). The Green Room lets hosts set a four-position answer-support slider individually for each player. Music is no longer part of initial setup; the host's music player opens when the show begins in phones-only mode, with a short tip pointing to the music menu.

The homepage highlight cards now explain the two 12-question rounds and final question, the 50+ regular and seasonal categories, and available player tools.

All earlier gameplay, seasonal-category, question-variety, Final Word, answer-review, and approved branding improvements remain included. See `START_HERE.txt` and `RELEASE_NOTES.md` for upgrade instructions and details.

## Installation / upgrade from v1.2

This ZIP is a **complete replacement project** for the deployed v1.2 app. Extract it, open the inner `the-know-show` folder, and upload the files and folders **inside** that folder to the root of the existing GitHub repository using **Add file → Upload files**. Commit, then let the connected Vercel deployment run. Check the Vercel build log.

- For v1.10.0, run the additive SQL migration and set DEVELOPER_PASSWORD as described in FEEDBACK_SETUP.md. Existing room data is compatible; a fresh room is recommended for testing.
- Preserve your existing deployment configuration and server-side `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` secrets. Never put secrets in GitHub.
- The approved main logo `public/know-show-logo.png` is untouched, as are both PWA app icons.
- If the installed PWA has cached an older version, reopen or refresh it after deployment.

## Answer-format accommodations

The host uses the Green Room slider to assign each player an answer format: **Write answers** (default), **Four choices on every regular question**, **Four choices on Medium and Hard**, or **Four choices on Hard**. Adjust these before the game or after pausing an active show.

Each four-choice player sees a private, single-tap selection on their phone for eligible **regular** questions. Written and multiple-choice correct answers receive the same base points. Regular-question speed bonuses are capped at 25% (written) and 10% (four-choice). Double Take rules are unchanged.

**The Final Word always requires an independently typed answer**, regardless of a player's answer-format accommodation. There are two progressive Final Word hints per question in the new standalone 69-question Final Word bank. Regular-game hints never carry into Final Word; each player may instead purchase up to two Final Word hints for 500 points each **before wagering**. Each purchase immediately reduces their balance and maximum wager. Purchased hints stay hidden until the question opens, then appear automatically and privately.

## Game rules and features

- Up to eight individual players or eight teams; the host can also participate on the same device.
- Players choose four categories from eight offers per round, independent of player count. Three questions per category: 12 per round, 24 total.
- Round 1: 100 / 300 / 500. Round 2: 200 / 600 / 1000.
- One Double Take per player per round; regular written hints and optional extra time are configurable.
- TV + Phones or Phones Only; Cool Jazz default with alternate Suno soundtracks. During a show, a compact header music menu lets anyone in the room select the shared track, unless the host turns that permission off. Audio plays only from the host phone or TV. The embedded player may require pressing Play after a track change.
- Host dispute/ruling controls, automatic return to Player View, replay tracking between rematches and new shows created on the same host browser, room codes, and in-app camera QR joining.
- The larger sound-effects panel is deferred; prominent synced Final Word timer. Answer-first results animation with ✓/✕, points changes and a leaderboard beat.
- Seasonal categories become eligible automatically in the applicable months using US Eastern calendar time. Every Build the Board phase guarantees at least one eligible seasonal category if available; other eligible seasonal categories also compete for the remaining spots. Players are not required to choose one. The 60 year-round categories remain eligible throughout the year, subject to the same-show exclusion.
- Navy-and-gold Curtain Call with trophy, confetti, prominently displayed winner(s) and one final standings table. Ties share the same rank.

## Final Word question selection and audit

Final Word has a **dedicated bank of 56 medium-hard/hard questions**, one for each year-round or seasonal category. They do not appear in standard play; Final Word chooses from seasonally eligible categories **not on either board in the current game**, preferring questions not recently seen. The 18 former final questions remain only as compatibility entries for already running rooms.

The original 56 Final Word questions and both progressive hints were editorially reviewed for answer accuracy, aliases, and hints that help without spelling out answers. The per-question source/reference and audit worksheet is `FINAL_WORD_CATEGORY_REVIEW.csv`. Consult `FINAL_WORD_FACT_CHECK.md` for review method and limits. This Final Word audit is separate from the 894 regular-game questions.

## Question bank / quality audit

The original 540 prompts, answers, hints, and source tracking are preserved, together with their previously reviewed options. The seasonal bank now contains 198 questions across eleven categories, with six questions per difficulty; 66 were introduced in v1.5.6, bringing regular play to 738 questions. The original multiple-choice review covered 358 rewritten and 182 retained sets. See `CHOICE_OPTIONS_QA.csv` for the original bank and `SEASONAL_QUESTION_QA.csv` for the first 132 seasonal questions, plus `SEASONAL_QUESTION_EXPANSION_QA.csv` for the 66 additions and their alternatives, hints, and references; consult `QUESTION_LIBRARY_STATUS.md` for the status of source verification. This remains a playtest-ready question set, not a claim that every question has been independently verified.

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

Seasonal category visibility is automatic: Thanksgiving, Veterans Day & Military Traditions, and Native American History & Culture (November); Christmas Movies and Christmas Music (November–December); Harvest Time and College Football Traditions (September–November); Winter Holidays, Winter Traditions and Winter Olympics (December–February); New Year Traditions (December–January); Christmas Legends & Lore (November–December); Creepy Creatures (October–November). Each offers 18 questions (six per difficulty). Category offers use weighted random selection: recently played or offered categories are less likely but are never excluded solely for being used before. The number of unseen questions in each category also affects its probability. At least one eligible seasonal category is offered per draft when available; additional seasonal categories may also appear. Individual question selection prioritizes unseen questions, then least-recently-used questions. A finite pool can still eventually repeat. For a **new show created from the same hosting browser**, game history is retained in local storage; **Rematch** retains it in the room state as well. A different host device/browser does not share that history automatically.

The 66 added seasonal questions were screened for contextual answer types, plausible alternatives, hint usefulness, category balance, and answer overlap with Final Word. Their individual reference links and editorial notes are in `SEASONAL_QUESTION_EXPANSION_QA.csv`. Original seasonal questions are in `SEASONAL_QUESTION_QA.csv`. This editorial review is not independent source corroboration of every trivia fact.

**v1.5.2:** The Final Word player view combines the hint shop, balance, wager slider, and instant correct/incorrect projections on one screen. See `FINAL_WORD_CATEGORY_REVIEW.csv` for the new 69-question Final Word pool and two paid hints per question. The earlier `FINAL_WORD_HINTS_REVIEW.csv` remains as a legacy reference for games that started in an older version.


### Repeat protection (v1.5.5)
The app remembers recent categories and questions within a host browser and recovers the host's recent room histories from Supabase when starting a new show. This reduces repeats across new room codes and rematches on the same browser; it does not yet synchronize histories across browsers or account logins. For the best experience, keep hosting from the same browser until optional account sign-in becomes available. See RELEASE_NOTES.md for details.


- Famous Landmarks: 12 regular questions and one Final Word, all visual.
- Flags of the World: Hard tier adjusted toward recognizable countries for better playtesting calibration.
