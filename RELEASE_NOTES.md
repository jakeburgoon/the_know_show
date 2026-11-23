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
