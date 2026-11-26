# v1.13.17 — Name That Movie: Christmas Classics (private review)

79 categories / 1,047 regular / 82 category-linked Final Word records (1,129 total). Adds 18 regular film/TV stills (six per difficulty) and two written finals, Prancer and Meet Me in St. Louis. Active November and December (US Eastern); enabled unless disabled in Developer > Category Availability. Original images preserved proportionally, encoded as neutral-name JPEGs. See CHRISTMAS_SCENE_IMAGE_AUDIT.csv and IMAGE_CREDITS.json. All movie stills remain uncleared; remove or replace before public/commercial release. Image-to-title mapping based on supplied filenames and scene review, not independent frame authentication. Potential future Christmas/movie expansion content, no monetization gating. Revised both tapir hints as agreed. No SQL or gameplay mechanics changes. Deploy between games.

# v1.13.16 — Picture This: Animals (private review)

78 categories / 1,029 regular / 80 category-linked Final Word records (1,109 total). Adds 18 animal photos, six per level, and two reserved written Final Word photos (tapir and secretary bird). Ocelot held in reserve. Photos resized proportionally to a maximum of 1,600 pixels; credits and source IDs recorded. No schema changes. Retains previous movie-poster private-review rights caveat. Deploy between games.

# v1.13.15 — Edited classic movie posters (private review)

77 categories / 1,011 regular / 78 category-linked Final Word questions (1,089 total). Four regular posters per difficulty and one Final Word (The Mark of Zorro). Uses the 13 supplied edited files, not the previous opaque masks. Exact poster edition rights still require verification; do not deploy publicly. No SQL changes.

# v1.13.14 — Classic movie posters (private review)

77 categories, 1,014 regular questions and 79 category-linked Final Word records (1,093 total). New category has five posters per level and two Final Word questions. Provisional rights review: do not deploy this build publicly until exact poster editions are cleared.

# v1.13.13 — Photographic landmarks and app icon

Picture This: Famous Landmarks replaces the illustration pilot (15 regular photographs, two Final Word photos). New full-bleed home-screen icon. 76 categories / 999 regular / 77 category finals. See V1313_LANDMARKS_SETUP.md. Enable the renamed category from Developer > Category Availability when ready. No SQL changes.

# v1.9.2 — Two lyric categories

- Finish That Lyric! (year-round): 12 regular + 1 Final Word. Christmas Sing-Along (November–December): 18 regular + 1 Final Word.
- 74 categories; 972 regular and 74 Final Word questions (1,046 playable). Public-domain lyric text only; see `V192_LYRIC_REVIEW.csv` and `V192_AUDIT_NOTES.md`. No schema or engine changes. Deploy between shows.

# v1.8.0 question-library verification addendum

- 72 total categories: **59 year-round and 13 seasonal**.
- 942 regular-game questions (894 existing + 48 newly added).
- 72 category-specific Final Word questions (69 existing + 3 newly added).
- **1,014 total**, with all old entries retained.
- The 51 new questions underwent individual editorial review with source references, but are not claimed as independently fact-certified by experts. See `V180_AUDIT_NOTES.md` and the two V180 review CSVs.
- Historical statuses below document the earlier bank and have not been silently upgraded.

---

# v1.7.0 category expansion — verification addendum

- **Year-round categories:** 58 (45 original plus 13 new).
- **Seasonal categories:** 11 (unchanged).
- **Regular questions:** 894 (738 inherited + 156 new).
- **Dedicated Final Word questions:** 69 (56 inherited + 13 new).
- **Total playable questions:** 963.
- **Review coverage:** All 156 new regular questions received editorial answer/option/hint screening; 18 have separately recorded claim-specific external source corroboration. All 13 new Final Word questions received targeted review (12 supported by external references and one constructed wordplay answer). Remaining new regular facts require individual independent source checks; do not describe the entire new bank as fully externally verified.
- Review documents: `NEW_REGULAR_CATEGORIES_QA.csv`, `NEW_FINAL_WORD_QA.csv`, and `NEW_CATEGORIES_AUDIT_NOTES.md`.
- The historical verification numbers below refer to the inherited v1.5.6 regular library and are retained for traceability.

---

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
