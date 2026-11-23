# Final Word editorial accuracy and hint-quality audit (v1.5.2)

## Scope

The new active bank contains **56 category-specific, medium-hard/hard questions** and **112 paid hints** (two per question), separate from the **672** regular-game questions. The former 18 Final Word questions remain as compatibility data for games started on earlier releases, but are not chosen for new games.

## Review method

Each question was reviewed for a single defensible canonical answer, accepted aliases and spelling, facts in the question and clues, unambiguous wording, and suitability for the category. Two questions that were too basic were replaced, and a Christmas carol prompt was modified to avoid reliance on a contested historical date. Distractors are deliberately absent from the Final Word data because all final answers must be written.

Each pair of hints was assessed **as a purchase worth 500 points**, not merely for whether the text was true. Hint one should provide useful orientation without restating the prompt. Hint two should narrow the possibilities more meaningfully, while still not explicitly identifying the answer. Examples revised: a source-control technology clue that referenced its popular repository service too directly; a language clue that merely restated its question; a holiday idiom clue that effectively used the answer as the name of a gift exchange; a mythology clue that was too close to a literal translation.

`FINAL_WORD_CATEGORY_REVIEW.csv` provides the full per-question worksheet: exact question, correct response and aliases, two hints, difficulty, eligible months, editorial changes, and **53 historical/scientific/cultural reference URLs plus three independently derived mathematical answers**. Sources include NASA, UNESCO, the Library of Congress, U.S. National Archives, NIST, national museums, sports organizations and specialized dictionaries. These reference links make spot checking and subsequent corrections possible.

## Programmatic validations

The automated engine suite asserts exactly 56 category-specific finales, unique category and question identifiers, two hints each, no direct answer text in a hint, no collision with standard-game canonical answers, and Final Word category selection only from active categories that do not appear on the current board. It tests repeat avoidance and the two-hint purchase/reveal cap. A passing test is **not a substitute for editorial fact-checking**, but it catches content and rule regressions.

## Boundaries

Some factual claims involve historical interpretation or conventional terminology (such as the traditional explanation of the “white elephant” idiom); these are worded with appropriate qualification rather than presenting a contested origin story as certainty. The review does **not** establish that every possible alternative spoken answer or spelling will be automatically recognized in a live game. Hosts can arbitrate disputes. Full Next.js production build and multi-device playtesting remain separate checks to complete after deployment.
