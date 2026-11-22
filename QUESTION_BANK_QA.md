# v0.2 curated question-bank QA

The included `src/lib/question-bank.json` has **453 questions across 45 categories**: 360 newly written and edited items, plus 93 original items retained from the earlier editorial audit. This includes **29 themed/creative categories** and **16 classic categories**. Each category has at least two available questions for every one of the four point-value levels. Individual games draw one alternative for each selected category and level.

## Work completed

- Carried forward the prior 505-item editorial audit, keeping the 93 originals marked editorially acceptable while omitting rejected and duplicated originals.
- Rewrote the 88 flagged new questions from the audit rather than deleting their slots.
- Replaced duplicate prompts in the newly merged bank and a misleading trick question; rewrote one hint that directly revealed the answer.
- Checked all 453 prompts programmatically for exact duplicate text, literal answer-in-prompt leakage, and literal answer-in-written-hint leakage. All three checks reported **zero** after the corrections.
- Confirmed every one of 45 categories has at least two alternatives at every level.
- Checked engine behavior on typo-tolerant answer matching, aliases, all-player scoring, and one-optional-assistance-per-question behavior.

## Important limitations

This is an **editorial review**, not comprehensive independent external-source verification of all 453 factual claims. An earlier audit checked selected claims using NASA, NOAA, the National Eye Institute, FIFA, IUPAC, and other primary sources, but not every question. Answer difficulty and appropriateness for mixed ages are judgment calls; game-play testing may identify further revisions. For a future public release, require source verification per question, human piloting, and a more exhaustive alias review. Automatic spelling tolerance is intentionally conservative; disputes allow host corrections.

## Source files

- `src/lib/question-bank.json`: complete machine-readable question catalog, with per-question IDs, level, hints, aliases and editorial status.
- `src/lib/questions.ts`: runtime mapping from the catalog to category and question IDs, plus The Final Word questions.
- `tests/v02-engine.test.cjs`: automated engine behavior tests.
