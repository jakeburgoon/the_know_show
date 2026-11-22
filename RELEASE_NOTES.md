# The Know Show v1.2 — Answer Choices Update

- Replaces first-letter and answer-length accommodations with **personal four-choice answers**.
- Host selects for each player: **Typed only / All questions / Medium & Hard / Hard only**. Can edit after pausing.
- Multiple-choice answers are one-tap buttons displayed privately on the player's phone. The host's admin view cannot access answer choices while the question is active.
- Four-choice speed bonus: **up to 10%**; typed speed bonus: **up to 25%**. Both receive full base points, and Double Take behavior is preserved.
- The Final Word counts as Hard for this accommodation; wagering and score calculations remain unchanged.
- Adds three proposed distractors for each of the 540 question-bank entries and for the Final Word question set. The 1620 regular-question distractors were structurally validated but are not all individually editorially checked. See `CHOICE_OPTIONS_QA.csv`.
- Fixes several near-spelling grading confusions between scientifically distinct terms, including **ectotherm/endotherm**, **ethology/ethnology**, and **refraction/reflection**.
- Preserves v1.1 branding, the user-approved logo unchanged, 4×3 board, all original gameplay modes, the 540-question Standard Trivia bank, and Cool Jazz soundtrack.
- **No database schema changes**, no new environment variables, and no required room reset for v1.1 rooms. Old first-letter/length accommodations are ignored and should be reassigned as Answer Format.

### Verification

19 gameplay and regression tests passed. A TypeScript shape check passed. Production Next.js build was not executable without installing dependencies. Choice distractors still need complete human editorial review; use this as a family-playtest build.
