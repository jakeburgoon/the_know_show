# The Know Show — v1.8.0 question audit

## Scope and counts

The v1.7.0 complete application is the baseline. The three additions bring the game to **72 categories, 942 regular questions, and 72 separate Final Word questions: 1,014 total.**

| New category | Months eligible | Easy | Medium | Hard | Reserved Final Word |
| --- | --- | ---: | ---: | ---: | ---: |
| The No-Show! | All year | 4 | 4 | 4 | 1 |
| Christmas Legends & Lore | November–December | 6 | 6 | 6 | 1 |
| Creepy Creatures | October–November | 6 | 6 | 6 | 1 |

**48** regular questions and **3** dedicated Final Word questions were added. No old question or previous Final Word entry was deliberately rewritten. Two-hint Final Word rules and the three-option regular-question data format were preserved.

## Editorial checking

1. Each new regular question has one specified correct answer, three different options in the relevant answer domain, an accepted-answer alias list, a hint, and a reference URL. Prompts were checked for basic accuracy and clarity against topic-specific authoritative or relevant historical references; links are retained in the accompanying CSV for follow-up inspection.
2. All 48 new records were checked for option count, answer/option identity collisions, source presence, expected difficulty balance, and overlap with prior regular-answer strings. Four exact answer overlaps with previous questions were rewritten.
3. An ambiguity review caught that medieval *basilisk* and *cockatrice* traditions frequently overlap and can denote the same beast; those items were replaced with **Wolpertinger** and **Dullahan** instead of using them as competing single-answer items. The new Final Word answers are distinct from the full regular-answer bank.
4. The three Final Word prompts have two progressive purchasable clues that do not contain the target answer. The question is not included in regular gameplay, and final category eligibility follows its season and the game's rule to avoid categories used on the board.
5. Historical cancellation, disappearance, and folklore questions were phrased carefully so legends are described *as legends* rather than as established zoological or supernatural facts.

## Verification limits

These additions received an editorial fact check with individually supplied source references, but not every link has been independently tested for long-term availability and the questions have **not** been certified by subject-matter experts. Historical folklore has multiple versions; future disputes should be checked against the linked reference and the specific wording. Existing v1.7.0 questions have their own separate source-verification status, documented in `QUESTION_LIBRARY_STATUS.md` and `NEW_CATEGORIES_AUDIT_NOTES.md`.

## Release validation

The automated checks validate schema, 72/942/72 counts, balanced new difficulty levels, season windows, distinct options, exact final-answer exclusion, and homepage guide copy. A focused TypeScript engine compilation and all 89 Node engine/UI regression tests passed. The Next.js production build remains unverified because the npm registry could not be reached (`EAI_AGAIN`); Vercel is the next full-build verification point.
