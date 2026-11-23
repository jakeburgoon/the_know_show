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
