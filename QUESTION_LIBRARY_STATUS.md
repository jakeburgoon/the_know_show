# Question-library verification status — v1.5.6

| Source status | Questions |
|---|---:|
| Independently corroborated in QA5 | 36 |
| Independently corroborated in QA4 | 30 |
| Inherited source link, recheck pending | 65 |
| Editorially screened, independent verification not recorded | 409 |
| Original year-round questions | **540** |
| New seasonal questions (editorial QA; individual sourcing pending) | **132** |
| Additional seasonal questions in v1.5.6 (editorial QA and source references) | **66** |
| **Total regular question library** | **738** |

The year-round library contains **45 categories**, each with four Easy, four Medium, and four Hard questions. The **11 seasonal categories** now have six questions at each level. The first 132 seasonal questions and all 66 added questions have editorial QA sheets, but source links alone do not establish independent item-level verification. Every question has a prompt, canonical answer, accepted aliases field, and written hint. The automatic checks do not establish that every fact or every plausible alternate answer has been independently verified.

The source status and URL fields are preserved within `src/lib/question-bank.json` to support future corrections. This release is intended for private family playtests. If an answer is reasonable but isn't accepted, use the in-game dispute option and record the wording for a future revision.

## v1.3.0 distractor review

The independent factual/source corroboration counts above are unchanged. Separately, the multiple-choice options for all 540 questions were reviewed for answer type and contextual plausibility: 358 distractor sets rewritten, 182 retained. See `CHOICE_OPTIONS_QA.csv`. Editorial review of choice quality does not constitute independent verification of the underlying trivia fact or all possible valid answers.

## v1.5.0 seasonal review

The 132 new seasonal questions were individually reviewed for four coherent choices, matching answer type, plausibility, one unambiguous correct response, and a hint that helps without repeating the canonical answer. The complete answer/distractor/hint checklist is in `SEASONAL_QUESTION_QA.csv`. Category-level source links are included as reference starting points; most facts have not been independently verified against an item-specific source.

The November additions contain four categories with 48 questions. Their standalone editorial checklist is in `NOVEMBER_CATEGORIES_QA.csv`. The consolidated `SEASONAL_QUESTION_QA.csv` contains all 132 seasonal questions.

## v1.5.6 expansion (66 additional seasonal questions)

The eleven seasonal categories each gain two questions per level, so each has six Easy, six Medium and six Hard items. The 66 new items appear in `SEASONAL_QUESTION_EXPANSION_QA.csv`, including source/reference URLs, editorial checks, question-specific hints and three plausible alternatives. The original 132 seasonal questions are preserved. The 56 Final Word questions are a separate bank and are not included in these 738 regular questions. Some source links are contextual and should not be treated as third-party certification of every answer.
