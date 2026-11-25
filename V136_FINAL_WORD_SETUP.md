# The Know Show v1.13.6 — Final Word editorial audit

## What changed
- All 76 category-linked final records have a question-specific pre-wager topic preview and a revised ordered hint pair. The first clue supports subject recall; the second provides a different connection, association or stronger clue. The archived puzzle records instead have puzzle-appropriate clues for editorial reference.
- 68 final records are eligible by editorial policy, subject to normal seasonal, disabled-category and current-board exclusions. Eight categories are regular-round only: Number Crunch, Three Clues, One Answer, Rhyme Time, Wait, What?, Count On It, Before & After, Finish That Lyric!, Christmas Sing-Along. Their final records remain in Question Lab and historical lookups. Famous Landmarks remains governed by its existing developer availability setting; do not enable it until its photos and duplicate-answer issue are fixed.
- The same candidate set is used for selection and selection diagnostics. The start guard requires 12 enabled year-round categories, including at least nine Final Word eligible year-round categories, to ensure a final remains after eight board selections.
- Topic previews appear before wagering on the phone, host and TV views. The two hints remain sequential, 500 points each, purchased before the wager and revealed privately when the question opens. No randomized hint order or scoring change.
- Question Lab displays topic previews and eligibility/exclusion reasons. The CSV audit includes all old/new clue pairs, eligibility and targeted references. This is an editorial audit, not an independent source verification of every clue; actual hint effectiveness needs playtesting. Same IDs retained for exposure history; historical question statistics may combine attempts under different clue versions.
- The 996 regular questions, original 76 final prompts/answers/aliases/images, and existing history are unchanged.

## Deploy
If already running v1.13.5, no new Supabase migration or environment variables are needed. Upload the update-only ZIP contents into the existing repository, keeping relative paths. The update is cumulative from v1.12.1. For earlier deployments, follow the v1.13.0, v1.13.2 and v1.13.5 SQL setup instructions in order (and v1.12.1 if necessary). Do not delete old files. Complete existing shows before deployment, especially if many categories have been disabled.

## Validation
- Engine: 108/109 passed; 4/4 new regression tests passed. Existing failure: duplicate Machu Picchu answer in the unfinished Famous Landmarks category.
- UI contract tests: 59/59 passed.
- Verified the regular bank is byte-identical to v1.13.5 and all category-final prompt/answer/alias/image/ID fields are unchanged.
- Full Next/Vercel production build, live database integration and actual phone/TV gameplay have not been tested here.

## Playtest
1. Start a new show and confirm excluded categories still appear on regular boards, subject to normal availability.
2. At Final Word, check that the topic preview is visible to host, players and TV but question and image are not.
3. Buy one hint on one phone and two on another, then lock wagers. The first phone should receive only clue 1, the second both clues, and a player purchasing none should receive neither.
4. In Question Lab, check the archived category records and inspect previews and clues.
