# Question-library verification status — v1.5.0

| Source status | Questions |
|---|---:|
| Independently corroborated in QA5 | 36 |
| Independently corroborated in QA4 | 30 |
| Inherited source link, recheck pending | 65 |
| Editorially screened, independent verification not recorded | 409 |
| Original year-round questions | **540** |
| New seasonal questions (editorial QA; individual sourcing pending) | **132** |
| **Total library** | **672** |

The original year-round library contains **45 categories** (plus **11 seasonal categories** in v1.5.0) and exactly **four Easy, four Medium, and four Hard questions per category**. Every question has a prompt, canonical answer, accepted aliases field, and written hint. The automatic checks do not establish that every fact or every plausible alternate answer has been independently verified.

The source status and URL fields are preserved within `src/lib/question-bank.json` to support future corrections. This release is intended for private family playtests. If an answer is reasonable but isn't accepted, use the in-game dispute option and record the wording for a future revision.

## v1.3.0 distractor review

The independent factual/source corroboration counts above are unchanged. Separately, the multiple-choice options for all 540 questions were reviewed for answer type and contextual plausibility: 358 distractor sets rewritten, 182 retained. See `CHOICE_OPTIONS_QA.csv`. Editorial review of choice quality does not constitute independent verification of the underlying trivia fact or all possible valid answers.

## v1.5.0 seasonal review

The 132 new seasonal questions were individually reviewed for four coherent choices, matching answer type, plausibility, one unambiguous correct response, and a hint that helps without repeating the canonical answer. The complete answer/distractor/hint checklist is in `SEASONAL_QUESTION_QA.csv`. Category-level source links are included as reference starting points; most facts have not been independently verified against an item-specific source.

The November additions contain four categories with 48 questions. Their standalone editorial checklist is in `NOVEMBER_CATEGORIES_QA.csv`. The consolidated `SEASONAL_QUESTION_QA.csv` contains all 132 seasonal questions.
