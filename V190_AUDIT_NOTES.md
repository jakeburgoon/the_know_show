# v1.9.0 question audit notes

## Scope and editorial criteria
- Screened all 1,014 playable records by answer, category and difficulty; reviewed flagged prompts, aliases, hints and distractors in more detail. This is a targeted editorial pass, not a new independent fact-check of every question. Actual correct-answer rates have not been measured. Existing source references and earlier QA worksheets are historical records, not proof that every unchanged claim was verified again.
- Preserve borderline classifications. Hard should generally be challenging but attainable, with occasional deep cuts; the earlier design target is roughly one deep cut per four Hard questions in a regular category. No claim that this subjective split is empirically established for every category.
- Keep the Battle of Hastings question Medium (borderline but familiar in history curricula); leave the Treaty of Tordesillas Hard as an example of a deep cut. Avoid downgrading Hard just because it is difficult.
- Five paired swaps: Doublethink / HAL 9000; Gimbels / Kermit the Frog; Knecht Ruprecht / Prince Albert; Metamorphosis / Bat; handshake counting / electric train smoke. The ten moves preserve balanced category pools.
- Rhyme Time: Hard Expel and Strait replaced with Eschew and Deride; Atone and Abate remain. Goat prompt narrowed to a farm animal, because stoat also rhymes with boat. Cambridge definitions: https://dictionary.cambridge.org/dictionary/english/eschew and https://dictionary.cambridge.org/dictionary/english/deride.
- Wait, What?: ask for the oldest person's relationship to the youngest, rather than an explanation of the entire family. Answer Grandmother, with common alternatives. Electric train accepts No smoke.
- Accept Byzantine, Eastern Roman Empire, and Eastern Roman in the relevant empire question, but not Empire alone or Roman Empire. Add context-specific shortened names, alternate terms, and spellings while preserving the matching algorithm. Do not accept the acronym itself when asked to expand it, e.g., USB.
- Before & After: selected long combined phrases are now short completion puzzles. Full former combined answer is still accepted where it answers the revised prompt. This does provide extra scaffolding, so playtest these specifically. Some long recognizable titles remain canonical, but shorter aliases are registered where sensible. No blanket acceptance of incomplete names.
- No-Show!: Apollo question specifies the number directly after the final crewed Moon landing, because multiple planned mission numbers did not fly. NASA reference: https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_18_20.html. Apollo 18 is the intended number, not a claim that only one mission was canceled.
- All IDs preserved; if adding analytics later, store content version or snapshot as well as ID because a handful of prompts changed substantially.

## Test and deployment
- 64 engine tests, 41 UI contract tests passed. Tests include every registered alias and correct answer across both banks, rejection of every published distractor, specific positive/negative cases, and balanced question pools.
- Local focused TypeScript compilation used available Node types. Full production build and live difficulty calibration not verified. Deploy between shows, since active rooms can contain references to questions whose content or difficulty has changed.
- All game logic, branding and Supabase schema are unchanged. No migration.
- Historical CSV/QA records from prior releases were retained as historical snapshots. The new change log documents this release's changes.
