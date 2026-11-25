# v1.13.12 — Rules refresh

Updated full How to Play guide and shortened mode-aware player quick rules. No gameplay, question-bank, or SQL changes.

# v1.13.9 — Production typecheck hotfix

Preserve required active question identifiers in the game view so hint actions pass strict TypeScript checking. Replace CSS align-items:end with flex-end. No SQL changes. All v1.13.8 features retained.

# v1.13.8 — First-show recommendation and next-show tips

Everyone chooses is the new-room default and appears first with a first-show recommendation. Curtain Call offers a short suggestion for a different answer format; rematches retain settings unless changed. See V138_FIRST_SHOW_SETUP.md. No new SQL beyond v1.13.5.

# v1.13.7 — Hint purchase controls

Gold lightbulb buttons in regular play; sequential, refundable Final Word hint tiles before wager lock; fixed wager with affordability clamp and live score projections. See V137_HINT_TILES_SETUP.md. No new SQL.

# v1.13.6 — Final Word editorial audit

All 76 Final Word records reviewed, topic previews added, eight puzzle/completion categories restricted to regular rounds; 68 category-final records eligible before seasonal and availability filters. Sequential paid hints unchanged. See V136_FINAL_WORD_SETUP.md.

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

## Summary
This release adds a private developer-side Question Lab so published questions can be inspected and playtested without launching a normal game and waiting for categories to appear.

## What changed
- Added a developer dashboard tab called **Question Lab**
- Added question-bank browsing with filters for category, difficulty, image-based questions, and text search
- Added a preview panel for player-like question review
- Added an answer checker that uses the current app acceptance rules
- Added a playtest-set builder for manual category selection
- Kept the feedback dashboard intact and sign-in protected

## Notes
- No new SQL or environment variables are required if developer feedback is already configured from v1.10.0.
- Question Lab previews are read-only and do not affect normal question history or future performance statistics.


---

# v1.11.1 — Visual trivia pilot

- Flags of the World: 12 regular questions and one Final Word, all visual. 76 categories, 1,072 playable questions.
- Optional local image metadata, shared phone/host/TV renderer, image-aware feedback and export. No new database migration after v1.10.0.
- See `V111_IMAGE_PILOT.md` and `IMAGE_CREDITS.json`. Deploy between shows.

# v1.10.0 — Feedback pilot

- Question feedback, post-show feedback, developer review and CSV export. Signed feedback invitations preserve question context across phase changes; anonymous reports are deduplicated by participant and show.
- Additive Supabase migration and private developer password required. See FEEDBACK_SETUP.md.

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

# v1.8.1 — Fixed eight-category draft and seasonal variety

- Every new Build the Board phase offers eight categories for 2–8 players or teams; four are selected per round.
- Reserve one weighted offer for an eligible in-season category, if one remains; draw the remaining offers without replacement from all other eligible categories, including additional in-season categories. No seasonal cap or required seasonal selection.
- Preserve history-based weights, calendar eligibility, unique offers, and Round 2 exclusion of Round 1 selections. In-progress drafts keep their original offers for compatibility.
- Update homepage version and How to Play copy; correct stale year-round count in Game settings (59).
- Keep all 942 regular questions, 72 current Final Word questions, approved logo/app icons, and Supabase schema unchanged. No migration or environment changes required.
- **Validation:** Focused TypeScript engine compilation and all 92 engine/UI/content tests passed. Full Next.js production build not run because application dependencies are not installed in this environment; verify on Vercel.

# v1.8.0 — Three new categories and the 1,000-question milestone

- **The No-Show!** is available year-round (12 regular questions); **Christmas Legends & Lore** runs November–December (18 regular); **Creepy Creatures** runs October–November (18 regular).
- Adds 48 new regular questions and 3 dedicated Final Word questions with two paid hints each, taking the application to **72 categories, 942 regular questions, and 72 final questions (1,014 total)**.
- Changes the homepage's category promotion to **over 70 categories** and **over 1,000 regular and seasonal questions**; How to Play states **over 1,000 questions** with exact counts.
- Preserves the full v1.7.0 application, regular questions, Final Word questions, game mechanics, approved logo and app icons, Supabase schema, and host setup.
- See `V180_REGULAR_REVIEW.csv`, `V180_FINAL_WORD_REVIEW.csv`, and `V180_AUDIT_NOTES.md` for detailed audits and evidence limitations. The full Next.js production build must still be verified on Vercel if not reported separately.
- **Validation:** 89 Node engine/UI tests passed, along with a focused TypeScript engine compilation. The complete Next.js production build was not run: npm registry access failed with DNS error `EAI_AGAIN`. Confirm compilation on Vercel.

# v1.7.0 — Year-round category expansion

- Adds **13 approved, year-round categories**: Villains We Love to Hate, Celebrity Spotlight, Video Game Vault, Brands & Slogans, Sci-Fi Worlds, Fantasy Realms, The Toy Box, Hail to the Chief, Wars & Turning Points, Extra! Extra!, Connect the Dots, Before & After, and Un-Done!.
- Adds **156 regular questions** (four per level per category) and **13 standalone Final Word questions** (two paid hints each). The complete bank now contains **69 categories, 894 regular questions, and 69 category-linked Final Word questions**.
- Separate review files: `NEW_REGULAR_CATEGORIES_QA.csv`, `NEW_FINAL_WORD_QA.csv`, `NEW_CATEGORIES_AUDIT_NOTES.md`.
- All existing 738 regular questions, 56 Final Word questions, game scoring and flow, assets, and Supabase schema are unchanged.
- This pack has automated validation and editorial review; per-question reference corroboration and production build remain separate verification steps.

# v1.6.2 — Action-oriented homepage highlight cards

The three homepage highlight cards are now ordered to introduce the variety of categories, the 25-question game structure, and the available hints and Double Takes. Copy is shorter and more inviting: “Choose from over 50 categories” / “Explore regular and seasonal trivia.”; “Take on 25 questions” / “Two rounds of 12, plus one final question.”; and “Make it yours” / “Use hints and try to double your points.” This is a complete cumulative application based on v1.6.1; no game logic, question banks, approved branding, or database schema changed.

# v1.6.1 — Clearer homepage game highlights

The three compact cards at the bottom of the homepage now explain the round structure (two rounds of 12 questions plus one final question), the choice of over 50 regular and seasonal categories, and the existing player tools (hints and Double Takes). No game logic, questions, settings, or branded artwork changed. This is a complete cumulative release that includes everything in v1.6.0.

# v1.6.0 — Two-step hosting, per-player support, and music discovery

This is a complete cumulative release based on v1.5.9. Hosts answer just two setup questions: **individuals or teams** (individuals preselected) and **TV + phones or Just phones** (Just phones preselected). Each selection stays visible until Next is pressed. The Green Room includes four-position answer-support sliders for every joined player: all written, choices on Hard, choices on Medium and Hard, or choices on all regular questions. Host choices are stored per player; The Final Word still requires a written answer. The per-player controls replace the global setup answer-format question. Host participation can still be added from the Green Room.

Music is no longer a setup step. The default jazz soundtrack remains selected. In a phones-only show, the host's embedded music player initially expands when gameplay begins; a short host-only banner points to the Music icon in the upper-right for choosing music. The soundtrack still requires a manual Play action within the Suno player and is shared from a single playback device. A TV + phones show continues to play its music through the dedicated shared TV display to avoid two simultaneous audio sources.

The Green Room collapsible section is named simply **Additional settings**. The duplicate soundtrack-arrangement control has been removed from that section; extra time and extra hints remain available there. Both the homepage and the short **How to Play** guide now explicitly describe the host's **two quick choices**. TV display setup, all game mechanics, scoring, 738 regular and 56 Final Word questions, and all approved artwork are preserved.

No Supabase schema migration or new environment variables are required. A fresh room is recommended when testing the revised onboarding. Full Next.js production build must be verified on Vercel if unavailable locally.

# v1.5.9 — Results, music, and How to Play polish

This is a **complete cumulative application**, built directly on v1.5.8. You may replace earlier versions in one deployment; no intermediate upgrades, Supabase migration, or new environment variables are required.

**Result reveals and disputes**
- Removes the redundant “Next up: back to the board” label from the standings beat.
- Increases correct-answer/individual-outcome display time by approximately one second. The scoreboard continues to display automatically afterward.
- Shows the friendly “Think you got it right? Ask the host to review your answer” request only to players with a nonempty answer that was marked incorrect. The server also rejects review requests from unanswered or already-correct players.
- When the host opens a review notification, Host View scrolls directly to the disputed player’s answer and highlights the row. After the last dispute is resolved, it returns to Player View.

**A Total No-Show!**
- Removes the “THE KNOW SHOW PRESENTS” preface; the easter egg begins directly with the announcement.
- Extends the animated announcement from roughly 2.5 to 3.5 seconds. The answer reveal also gains the extra second above. Existing triggers and reduced-motion behavior remain unchanged.

**Music player**
- The shared music selector closes immediately after a track is chosen. A brief non-host confirmation tells the player to ask the host to press Play.
- On the host phone during Just phones play, a newly selected track (including one chosen by another player) expands the host music player. Its header changes from “Open music player” to “Hide music player” when expanded. The host still needs to press Play in Suno's embedded controls. TV playback remains on the separate TV display.
- The music menu temporarily appears above the sticky Player/Host tabs while open, so its options are not obscured.

**How to Play**
- Replaces the technical guide with a short family-facing explanation of how the game works, how to win, hosting, playing, Final Word, and music. Calls out 56 categories, 738 regular questions, and 56 dedicated Final Word questions.
- Makes the small homepage How to Play link more visible without moving it into the main actions.

**Validation:** 56 engine tests and 19 focused UI contract tests passed. All 21 TS/TSX source files passed syntax parsing. No full Next.js production build was possible locally because the npm registry dependencies were unavailable; verify the final build on Vercel. The exact question banks, main logo, app icons, and Supabase schema are unchanged.

# v1.5.8 — A Total No-Show! (small presentation patch)

This complete, cumulative update builds on **v1.5.7**. When **all players submit an incorrect answer** to a regular question or The Final Word, the results sequence briefly displays **“A TOTAL NO-SHOW! Nobody knew that one!”** with a restrained navy-and-gold spotlight and falling-star animation, then automatically reveals the correct answer, player results, and usual updated standings. The celebration lasts about 2.5 seconds. It does not appear for timeouts without an answer, host-skipped questions, or when any player answers correctly. The No-Show is not a bonus, penalty, or additional game rule.

- Only the results sequence changes; normal scoring, disputes, rounds, question content, music, branding, and settings are preserved.
- The engine lengthens all-incorrect results by only 2.5 seconds so the correct answer and leaderboard remain readable. Other results keep their original timings.
- Host disputes can still change a ruling; a corrected result suppresses the all-incorrect flag.
- Motion respects operating-system reduced-motion preferences.
- The supplied application is the **complete app**, not incremental patch files. All assets and questions remain exactly as supplied in v1.5.7.
- **Validation:** 54 automated game-engine tests and 14 targeted UI contract checks passed. All 21 TS/TSX source files passed syntax parsing. Approved art, regular/Final Word banks, and schema are byte-for-byte unchanged. A full Next.js production build still must be verified on Vercel.

# v1.5.7 — Clearer TV-versus-phones host onboarding

This cumulative update keeps the v1.5.6 game engine, questions, music functionality, and artwork unchanged. It makes the display-mode choice understandable for hosts setting up The Know Show without prior instructions.

- The host setup question is now **How will everyone see the show?**
- **TV + phones** clearly identifies the dedicated shared game display, distinct from any player's own screen.
- A short conditional explanation appears only when TV mode is chosen. It covers laptop HDMI or screen casting, a compatible smart-TV browser, and the option for the host to play from a separate phone.
- **Just phones** explicitly says no TV or laptop is needed.
- The Green Room includes a compact TV-setup reminder next to the **Open TV display** link.
- The How to Play guide explains the public player link versus the private host-pairing link, and warns that mirroring a Player View is not the shared board.
- Future roadmap (not in this release): optional cross-device player accounts and question-performance statistics for difficulty calibration.

**Validation:** 49 engine tests and 11 UI contract checks passed using the existing local engine build. The engine compilation command could not be rerun because this environment lacks complete Node type declarations; no engine source was changed.

**Deployment:** This is a complete app ZIP. No Supabase schema migration or new environment variables. The full Next.js production build still needs Vercel verification.

# v1.5.6 — Seasonal question expansion, weighted category offers, and shared music controls

This cumulative update includes **66 new seasonal questions** (two more Easy, Medium and Hard questions across each of 11 seasonal categories), bringing the regular question bank to **738 questions in 56 categories**: 540 year-round and 198 seasonal. All 56 dedicated Final Word questions remain separate and unchanged. The initial 672 question records and approved artwork are retained.

**Question QA:** All 66 additions are listed in `SEASONAL_QUESTION_EXPANSION_QA.csv` with correct answers, three same-type alternative choices, aliases, a non-giveaway hint, a reference link, and editorial notes. The questions were checked for duplicate options, overlap with protected Final Word answers, and appropriate difficulty distribution. Source links provide supporting references; they do **not** imply every question has been fully independently verified by a subject-matter expert. Two candidate additions that overlapped Final Word answers were replaced before release.

**Build the Board:** Weighted random offers replace rigid preference for unplayed categories. A recently selected category remains eligible but less likely; the odds recover as time passes. Newly offered-but-unselected categories get a gentler penalty. The engine also considers how many unseen questions remain. One eligible seasonal category is guaranteed in each draft while seasonals are active, but it need not be chosen. Regular categories remain available alongside it. Categories already drafted in the current show cannot reappear in a later category slot during the same show.

**Music control:** A small Music menu in the player/host header displays the selected soundtrack and offers No music or one of 12 track arrangements. **Joined players can select the room-wide track by default**, with a five-second cooldown to avoid rapid conflicting changes. The host can disable player choices, retaining sole music selection permission. Only the host device (phones-only) or TV plays the soundtrack; changing tracks remotely does not remotely press Play on Suno's embed, and browsers may require a manual tap. There are no changes to the deferred sound-effects feature. Music permissions and the chosen track use existing room settings: **no Supabase schema migration or new environment variables**.

**Validation:** 49 game-engine tests passed, including new player-music authorization tests. Targeted UI contract and changed TypeScript syntax tests were performed separately. A complete Next.js production build was not available locally because the full npm dependencies were not installed; the Vercel deployment must verify the build.

# v1.5.5 — Repeat reduction and player-screen refinements

v1.5.5 strengthened recent category/question history retention within a browser and rematches, with Final Word decision-screen and gameplay UI refinements, as described in the bundled preceding files. This release retains all those features.

# v1.5.5 — Repeat Protection and Player View Refinements

This is a complete, cumulative app release built on v1.5.4. It does **not** add sign-in accounts yet.

## Repeat protection
- Creates an anonymous host-history identifier in each hosting browser. When that browser starts another room, the server can recover previous question/category history from existing Supabase room records, in addition to the browser's cached history.
- Prioritizes unplayed categories, then categories with more unseen questions, to reduce repetition across separate shows.
- Prioritizes unseen regular questions and avoids recently used answers when choosing among still-unseen questions.
- Keeps Final Word history and recent category offers; retains histories through rematches.
- Limits repeat histories to the complete 672 regular + 56 Final Word question pool.
- No database schema migration is needed. Anonymous history remains tied to the current browser. A future optional account feature can allow cross-device and cross-host player histories.

## Playing view and Final Word
- Final Word category description and a short explanation of the wager outcome now appear above the wager controls.
- Current standings appear openly on the Final Word decision panel, rather than behind an expandable section.
- Each purchased Final Word hint appears immediately, before the player chooses whether to buy the second hint or lock a wager. Hints remain private to that player.
- Removes the large Sound Effects panel (audio cues can be revisited later).
- Removes duplicate top scores while choosing questions. Keeps the main leaderboard at the bottom of the player view.
- Replaces Double Take's emoji with a gold, outlined overlapping-cards icon.
- Labels regular rounds simply Round 1 and Round 2; the Round 2 opening says “Double the pressure. Double the points.” The Final Word keeps its established name.
- Updates outdated homepage footer wording.

## Validation
- 45 game-engine tests and 5 UI-contract tests pass.
- Eight-show local selection simulation (24 questions per show, using preserved history): 192 questions with no exact repeats. This illustrates the algorithm; it is not a cross-device guarantee.
- Modified TypeScript/TSX files pass parsing checks. A complete Next.js/Vercel production build was not run in this environment.
- Question bank, main logo, and app icon files remain unchanged.

## Deploy
Copy all files inside `the-know-show/` over the existing repository files, then commit and deploy to Vercel. No new environment variables or Supabase migration required for this version.

---

# v1.5.4 — Branded room loading, clearer host wording, and TV navigation

Complete cumulative update over v1.5.3. The temporary “Preparing The Know Show…” page is now a branded cream/navy-and-gold loading screen featuring the **approved original logo unchanged**, a short “Setting the Stage” message, and a subtle animated progress accent (respecting reduced-motion settings).

The host answer-format explanations have been rewritten: **Everyone writes** explicitly says **no answer options are given** without redundant Final Word wording; **Everyone chooses** notes that four regular-question options are shown but the **final question** must be written; and **A mix of both** explains that per-player formats can help level the playing field across different ages and abilities, with the final question always written.

The **Open TV display** button appears in the Green Room only if the host selected **TV + phones**, and TV-display links in the host controls and player footer also respect the **Just phones** mode. The Green Room link now navigates in the same app window so a mobile host is not stranded in a second tab. A host accessing the TV display on their own device sees a visible **Back to Green Room** (or **Back to Host View** once the show begins) action. That return explicitly selects Host View even if the host is also a player; non-host TV displays remain uncluttered. The private host token is never placed in the display URL.

**Preserved:** All 672 regular questions, 56 active category-specific Final Word questions and their two paid hints, gameplay/scoring, the four-step setup flow, and the approved main logo and app icons. No Supabase schema or environment changes are needed.

**Validation:** All 42 game-engine tests passed, plus focused static UI checks and TypeScript/TSX syntax parsing. A complete production Next.js build could not be run because access to the npm registry failed (`EAI_AGAIN`). Verify the Vercel build and test navigation on a host phone after deployment.

# v1.5.3 — Reviewed host setup and refreshed homepage

Complete cumulative update over v1.5.2. Host setup choices now highlight locally when tapped; each step advances **only** when the host uses the visible **Next** button. **Previous** stays on the left from step two onward, and the last step shows **Continue to Green Room** on the right. Saving the selected choice remains server-side and must succeed before advancing; failures appear on the setup screen. Returning to earlier steps loads the previously saved settings. The four-question flow, existing settings, and Green Room are otherwise unchanged.

Homepage copy now reads **“It’s time to SHOW what you KNOW.”** with distinct typographic emphasis, followed by **“Choose your categories, answer your way, and find out who knows the most.”** The four feature chips read **2–8 players**, **50+ categories**, **Answer your way**, and **Individuals or teams**. The section label is **GAME NIGHT STARTS HERE**; **Ready to play?** and the host/join instructions remain as agreed. All logo/icon image files are copied unchanged.

**Validation:** Static checks for the four feature chips, homepage copy, non-advancing option buttons, footer navigation, wiring to the server action, and asset hashes. All 42 regression engine tests pass, and TSX syntax checks pass for the edited components. The full production Next.js build must still be verified by Vercel if dependencies are unavailable. No database or environment changes.

# v1.5.2 — One-screen wager and 56 category-specific Final Word questions

Complete cumulative update over v1.5.1. The Final Word **player** screen now combines the category, remaining points, a two-hint purchase section, a wager slider (plus optional exact entry and quick selections), and live projected balances for a right or wrong answer. Hints cost 500 points each; at most **two hints** may be purchased before locking a wager. Purchased points are deducted immediately, purchases are final, and regular-round hints do not carry over. The question itself remains hidden until all wagers are locked, and the final answer is typed only.

**Expanded Final Word bank:** A separate, purpose-built collection of **56 active Final Word questions, one for each of the 56 regular or seasonal categories**. New finals are selected *only* from a category not selected on either round of the current show. Seasonal finals are offered only in their active months, and the engine prioritizes finals not recently played. These 56 questions never appear as regular board questions; the previous 18 entries are retained **only to support games already in progress at deployment**, not used to start new finals. Final questions are intentionally medium-hard or hard.

**Editorial and source review:** All 56 questions, accepted answers, and two progressive paid hints were individually reviewed. Two easy questions were replaced; another prompt lost a potentially disputed date. Weak hints that restated the question or revealed too much were rewritten. The separate audit file `FINAL_WORD_CATEGORY_REVIEW.csv` includes a question-specific source/reference link for 53 items and a mathematical derivation for the other three, as well as accepted aliases, seasonality, both paid hints, and editorial notes. See also `FINAL_WORD_FACT_CHECK.md` for audit boundaries. The original 672-question regular-game bank and the approved brand assets are unchanged.

**Regression validation:** 42 automated game-engine tests pass, including both-hint purchase/reveal enforcement, score math, availability by month, exclusion of current board categories, avoidance of regular-bank answers, and avoiding recently used finals. Engine TypeScript compilation succeeds. A full Next.js production build and live two-device test could not be performed in this environment because the complete dependency set was unavailable; Vercel is the deployment build check. No Supabase schema changes or new environment variables.

# v1.5.1 — Final Word hints are purchased only

This is a focused, complete cumulative update to v1.5.0. **Unused regular-game hints never carry into The Final Word.** The host still controls regular-round hint allowances (including player accommodations), but those allowances apply only to ordinary questions.

- Each player starts Final Word with **zero** usable hints, regardless of how many regular hints remain.
- Before locking their wager, players may purchase **up to three** Final Word hints for **500 points each**. Each purchase immediately reduces their score and therefore their maximum wager.
- During Final Word, a player can reveal only the hints they personally purchased. Hints are progressive and private. Revealing them never changes `hintsRemaining` from regular rounds.
- Unpurchased hints cannot be revealed, unused purchases do not provide a refund, and hints cannot be purchased after locking the wager.
- The Final Word screen explains these rules and indicates purchased / available hint counts. No changes to other mechanics, the 672-question library, or approved artwork.
- **Verification:** All 39 automated game-engine tests passed with updated checks that distinguish regular and Final Word hints. Engine TypeScript compilation passed using existing local Node type definitions. Production Next.js build and end-to-end device testing were not performed here; verify the Vercel build after deployment.
- **Deployment:** Replace the repository with this complete v1.5.1 application (no need to install v1.5.0 first). No SQL migration or environment-variable changes are needed. Start a fresh room to test the new hint rules.

# v1.5.0 — Show Flow, Seasonal Trivia & Improved Variety

Complete cumulative update from v1.4.1, including the previous, unreleased v1.4.2 Final Word work.

- **Final Word:** countdown remains prominently visible from the beginning, synced to server time, with pause handling. All 18 original final questions have three private progressive hints. Leftover standard hints work in Final Word. Additional hint credits cost 500 points each, bought only before the wager is locked, immediately deducted from the player’s balance. At most three hints per player per final question. Final responses remain typed-only, with autosaved drafts.
- **Player experience:** visible Sound Effects toggle for five-second ticks and time-up chime; answer-first results reveal showing each contestant’s ✓/✕ and point change, followed by updated standings before the board; reduced redundant score displays during reveal. Navy-and-gold board shading and more legible category draft/pick state.
- **New show:** From the Curtain Call, host chooses Rematch (same players/settings, scores reset) or Start a new show (room closes and clients return to homepage). The homepage offers Host a Show or Join a Show with in-app QR camera scanning or manual code entry. The QR scanner accepts only app-style room codes.
- **Variety:** recent category selection and offers are tracked in room state, and recent questions are preferentially avoided. A host’s browser also retains this history for later new rooms via localStorage; rematches preserve it server-side. Repeats are still possible after the finite supply runs low, and separate host devices do not automatically share browsing history.
- **Seasonal trivia:** Eleven calendar-aware categories, 132 new questions (12 per category, four Easy/Medium/Hard each). Thanksgiving Traditions, Veterans Day & Military Traditions, Native American History & Culture (November); Christmas Movies and Christmas Music (November–December); Harvest Time and College Football Traditions (September–November); Winter Holidays, Winter Traditions, Winter Olympics (December–February); New Year Traditions (December–January). Month eligibility is based on the Eastern time zone. **Each Build the Board draft contains exactly one eligible seasonal choice (whenever seasonal categories are active), and the rest of the offered categories are year-round.** Selecting the seasonal option remains optional. If all eligible seasonal categories were recently offered, the least-recently offered returns. In months without a seasonal pack, all offered categories are year-round. The original 45 categories / 540 questions are untouched, bringing the bank to **56 categories and 672 questions**.
- **Content QA:** All 132 seasonal questions have three same-answer-type, contextually plausible alternatives and a question-specific written hint; reviewed for ambiguity, aliases, and obvious answer leaks. See `SEASONAL_QUESTION_QA.csv`, with the four new November categories separately in `NOVEMBER_CATEGORIES_QA.csv`. All 18 Final Word hint lists remain as in the earlier update. Existing `CHOICE_OPTIONS_QA.csv` covers the original 540 questions. Editorial screening is not independent fact verification of every claim.
- **Assets and deployment:** Approved logo and both icons remain byte-for-byte identical to v1.4.1. Existing database schema stays compatible, with no new environment variables. **39 automated game-engine tests passed**; focused TypeScript checking passed. Full Next.js production build/device testing was unavailable (npm dependency installation timed out), so Vercel deployment is the final build check.

# v1.4.2 — Final Word timer, hint library & pre-wager purchases

A complete, cumulative release built from the original v1.4.1 full-app ZIP; no intermediate installation needed.

- **Visible countdown:** Final Word now has a prominent timer in the question header, a time-progress bar, and the same final-five-second urgency treatment as regular questions. The countdown uses server-time alignment rather than assuming the phone's clock is exact, and holds its position if the host pauses the game. Optional existing tick/bell sounds continue to work.
- **Three private hints per Final Word:** Every one of the 18 Final Word questions has three distinct progressive written hints. Hints are revealed to the requesting player only, one at a time during the Final Word question. Their unused regular-game hint credits can be spent here; no more than three hints can be revealed for any Final Word question.
- **Hint shop before wagering:** Before locking a wager, a player may purchase additional Final Word-only hint credits for **500 points each**, limited by the remaining three-hint capacity and available points. Buying immediately deducts from the player's score, so the wager ceiling reflects the new balance. Purchases are irrevocable once made, cannot be made after locking a wager, and don't disclose any question hints before the question begins. Remaining free hints are used before purchased credits.
- Final Word is still **written-answer only**, saved drafts auto-submit on timeout, and the usual wager scoring is unchanged. Hint usage is tracked in the final submission.
- Standard 540-question bank / 45 categories, approved logo, and both app icons are byte-for-byte unchanged. All previous hosting, choice, and finish-screen improvements remain included.
- **Verification:** 33 automated engine tests passed and a focused TypeScript semantic check with temporary dependency shims passed. A complete production Next.js build requires the dependencies supplied by Vercel; please verify its deployment log.
- **Deployment:** Replace the repository files from this complete ZIP. No SQL migration, new credentials, or environment variables. Start a new game room after deployment for the clearest test.

# v1.4.1 — Leaner Green Room

- Removed the legacy standalone **Join as a player** card from host setup. Host participation remains an optional checkbox and name field immediately under the live joining-player list, with no separate oversized panel.
- Removed the redundant oversized Green Room heading and its duplicate legacy hero. The new host Green Room uses one small gold **GREEN ROOM** label and puts the QR, room code and player list first.
- No changes to the setup questions, trivia content, gameplay, roles, scoring, logo, app icons, or database schema.
- The v1.4.0 two-tab player/host navigation is retained; the TV display remains a separate link.

# v1.4.0 — Guided Host Setup, Player Formats & Countdown

Built from the complete v1.3.1 application, retaining every other game engine feature and the 540-question / 45-category bank.

### A host-first flow
- Home now emphasizes **Host a show**; manual room-code entry is a secondary fallback to a QR scan.
- Hosts choose in four steps: individual or team play; TV + phones or phones only; no music or one of the existing soundtrack styles; written answers, four choices, or per-player mixture.
- The final Green Room centers on a large joining QR code and room code. Player/team names populate live beneath it with each person's answer-format selection. Hosts can override every player's format, including Easy/Medium/Hard choices, and adjust hints and time under optional advanced settings.
- **Will you be participating?** allows the host to join as a player by name without losing host privileges. At least two contestants/teams are needed to begin.
- **START THE SHOW!** starts the category draft and automatically switches the host's device to Player View. A nonplaying host receives a live spectator display there instead.
- Two top tabs replace three: Player View (primary) and smaller Host View. The dedicated TV display is still accessible through a link or direct `/display/{code}` URL. Hosts reviewing a dispute return to Player View automatically after the dispute is resolved.

### Countdown and saved typed answers
- Prominent large timer, progress bar, urgency effect in the final five seconds, plus a prominent final-round timer.
- Each player can turn optional five-second tick sounds and a time-up bell on/off. They are off until activated and use the browser's Web Audio system (no separate music files or licensing).
- Written answers are now saved to the server as the player types (after a short debounce). If time expires without tapping Lock answer, the server automatically grades the latest saved **nonempty draft** at the player's own deadline. This also works for team turns and Final Word.
- Automatic submissions receive zero speed bonus; Double Take choice is preserved if valid; extra time is honored. Four-choice answers still require a tap. Drafts stay private to the person typing until answers are revealed.
- Browsers require a tap to activate sound; an offline or very last-second draft may not reach the server before the timer closes. The UI shows whether the draft was saved.

### Preservation and verification
- The approved logo and both icons are byte-for-byte unchanged; question-bank JSON and three-alternative distractors are unchanged from v1.3.1.
- 27 engine/regression tests passed (original 21 plus six for setup defaults and draft submission behaviors).
- TypeScript syntax + focused semantic checks passed with temporary dependency declarations. A complete Next.js production build/browser QA was not possible because dependencies were unavailable in the local runner. Vercel deployment should be verified.
- No Supabase migration or new environment variables; new state keys are stored within the existing JSON room snapshot.

## v1.3.1 — Build fix

- Fixed the TypeScript error in `src/components/ShowRoom.tsx` caused by a redundant `finished` phase comparison after the finished-screen early return.
- Removed two unreachable legacy finished-screen sections. The Curtain Call remains the only finished-state display.
- Updated the engine-test build command to include the existing standings module and stabilized a random category-selection test.
- No changes to gameplay rules, question bank, assets, environment variables, or database schema.

# The Know Show — v1.3.0 · Better Choices + Curtain Call

Based directly on the supplied **v1.2.0** project ZIP. The 540 original trivia questions, 45 categories, canonical answers, answer aliases, hints, existing game rules, and approved logo are preserved.

## 1. Multiple-choice answer quality

Reviewed all **540** standard-trivia questions and their three wrong-answer options, checking the expected answer type and contextual plausibility. **358 question sets were rewritten** and **182 were retained after review**. The candidate alternatives favor geographically adjacent states/countries for geographic clues, historically relevant battles/empires for history clues, comparable people/instruments/processes for other clues, and similarly structured numerical choices for number problems. The full question-by-question audit is in `CHOICE_OPTIONS_QA.csv`.

Each item still has **four distinct choices** (one correct answer and three distractors), without duplicates or explicit accepted-answer aliases. The engine now also explicitly rejects published distractors, so close-spelling but distinct alternatives cannot accidentally receive credit from its typed-answer typo tolerance (e.g., World War I vs. World War II, Ming vs. Qing, and DNA vs. RNA). Roman numerals are protected in fuzzy matching as well.

**Quality limit:** This is a contextual editorial pass, not independent historical/scientific fact-checking of all 540 questions or definitive classroom/test validation. Some clues may warrant additional refinement from playtesting. The question source-verification statuses remain unchanged.

## 2. Final Word is written only

**Every player types their answer** to The Final Word, even when their normal-question accommodation is set to All, Medium & Hard, or Hard only. The server never sends final answer buttons, does not enforce a final answer against a choice list, and records the response as `written`. Wager scoring and the Final Word timer are unchanged.

The multiple-choice accommodation and adjusted speed bonus continue to work for **regular questions only**.

## 3. New celebratory finish

Replaced the old small winner label and competing score listings with a dedicated navy-and-gold Curtain Call on **TV and phones**:

- Large trophy, champion name, bold winning score, and brief falling confetti (disabled for reduced-motion users).
- All joint winners are displayed with **equal prominence**, including shared first place in the final standings (e.g., 1, 1, 3).
- **One** final standings section, with the regular leaderboard, pocket score strip, score-adjustment controls, and leftover game panels hidden from the finished view.
- The host can start a new show from the finish screen, including on a phone where they also have a player credential.

## Verification and deployment

- **21 engine/regression tests passed**, including all 540 distractor sets, regular-choice privacy and scoring, final written submissions for accommodated players, tied ranking, and a full game.
- TypeScript syntax parsing of the changed React and engine files passed; the engine compiled and ran its tests with temporary Node type declarations.
- **A complete Next.js production build and browser-based visual QA were not run** in this environment because the npm dependencies could not be installed. Inspect your Vercel build output after uploading, and try the finish screen on a phone and TV.
- No Supabase schema changes, environment variable changes, or credential changes are needed. Existing v1.2 rooms and player accommodation settings remain compatible.
- `public/know-show-logo.png` is **byte-for-byte identical** to the supplied v1.2 logo. The existing app icons are also unmodified.


- Famous Landmarks: 12 regular questions and one Final Word, all visual.
- Flags of the World: Hard tier adjusted toward recognizable countries for better playtesting calibration.

## v1.13.5 — Paid hints and Final Word clues
Regular hints are now point-funded Reveal Answer Options and 50/50. Host free-hint controls are removed; regular written hints are archived. Final Word retains two 500-point written hints, with 29 of its 76 hint pairs revised. Exposure statistics now distinguish paid assistance. Apply `supabase/upgrade_v1_13_5.sql` to enable the expanded developer report. See `V135_PAID_HINTS_SETUP.md`.
