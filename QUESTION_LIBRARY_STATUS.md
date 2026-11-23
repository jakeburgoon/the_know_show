# v1.0 question-library status

| Source status | Questions |
|---|---:|
| Independently corroborated in QA5 | 36 |
| Independently corroborated in QA4 | 30 |
| Inherited source link, recheck pending | 65 |
| Editorially screened, independent verification not recorded | 409 |
| **Total** | **540** |

The library contains **45 categories** and exactly **four Easy, four Medium, and four Hard alternatives per category**. Every question has a prompt, canonical answer, accepted aliases field, and written hint. The automatic checks do not establish that every fact or every plausible alternate answer has been independently verified.

The source status and URL fields are preserved within `src/lib/question-bank.json` to support future corrections. This release is intended for private family playtests. If an answer is reasonable but isn't accepted, use the in-game dispute option and record the wording for a future revision.

## v1.3.0 distractor review

The independent factual/source corroboration counts above are unchanged. Separately, the multiple-choice options for all 540 questions were reviewed for answer type and contextual plausibility: 358 distractor sets rewritten, 182 retained. See `CHOICE_OPTIONS_QA.csv`. Editorial review of choice quality does not constitute independent verification of the underlying trivia fact or all possible valid answers.
