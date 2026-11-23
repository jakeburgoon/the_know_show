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
