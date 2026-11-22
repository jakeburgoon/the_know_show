# Updated audit addendum

The original QA status below predates this audit. **The 96 new questions have now received an item-by-item editorial review and 14 revisions, but only the 14 amended items have external reference links recorded.** See `QUESTION_AUDIT_96.md` and `.csv`.

# v0.2.3 Question Bank Review

**549 total candidate questions** across **45 categories**. The previous v0.2.2 package contained 453. This package adds **96 new items** (12 shared categories × 4 levels × 2 targeted question-set versions).

## New tag field

Each record includes `audiences`, an array of question-set keys: `family`, `general`, `challenging`. Previous general items have all three keys to preserve them as replayable alternatives. New targeted items have only the intended key. `externalSourceVerified` is `false` for all 96 new items.

## Categories with new audience-specific versions

Space Case; Game Night; U.S. Geography; World Geography; U.S. History; Biology; Chemistry; Astronomy; Sports; Movies & TV; Literature; Food & Drink.

Each of these has a newly written Family Friendly question and a newly written Challenging question at **each of four point-value levels**, alongside the existing general alternatives.

## Checks completed

- Every question has an ID, category, level, prompt, answer, hint, and audience tag.
- The 96 new question IDs are unique.
- Across the complete 549-question bank, there are no exactly repeated normalized prompts.
- New question prompts do not contain their full normalized answer as a substring.
- Every audience setting has at least two eligible candidates at each level of each category.
- Gameplay tests confirm category selection and questions use the room-selected profile and final question tier.

**Limitations:** These are automated and editorial checks, *not* external fact verification of each item. A fully source-backed factual audit of every question is still outstanding. Difficulty has been editorially estimated, not empirically calibrated across player age/knowledge groups. In the 33 categories without targeted additions yet, the same broad questions may appear across multiple settings.
