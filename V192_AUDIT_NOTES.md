# v1.9.2 — Lyric category expansion audit

## Scope
- Finish That Lyric!: 12 regular questions (4 each Easy/Medium/Hard) and one category-linked Final Word; year-round.
- Christmas Sing-Along: 18 regular questions (6 each Easy/Medium/Hard) and one category-linked Final Word; November–December, Eastern time.
- 74 total categories (60 year-round, 14 seasonal), 972 regular questions, 74 category-linked Final Word questions; 1,046 playable questions. The 18 legacy finals remain for compatibility and are not counted.
- Exactly 32 new lyric records. Existing 1,014 playable records remain unchanged. No game-engine, scoring, or Supabase schema changes.

## Editorial review
- Used public-domain song texts only; no audio, modern lyric adaptations, recordings, or arrangements. This is a deliberately older-skewing first bank. Contemporary pop lyrics require appropriate permission before inclusion. Rights conclusions are based on historical publication and source provenance, not a legal opinion or international clearance.
- Compared lyric fragments and completions to the linked source pages. Sources include public-domain lyric transcriptions, the Irish Sheet Music Archives, PD Info, and Caroling's historical-text and translation notes. These are not all original scans or independent scholarly editions. The review CSV records the exact source for each question and an editorial difficulty rationale. Traditional songs can have alternate versions; the questions select familiar or explicitly identifiable wording and avoid known variant-dependent blanks where possible.
- Each ordinary clue has one blank, a named song, one short expected completion (one to three words), three grammatically plausible alternatives, and a contextual/meaning/rhyme hint. Aliases cover acceptable orthography and common variants; synonyms are not generally accepted for exact lyric completion. Each Final Word has two different paid hints and a distinct song and answer from the ordinary bank.
- Difficulty: Easy uses prominent familiar lines; Medium uses more specific phrases and less familiar lines; Hard uses older standards or less prominent verses, with one deeper cut among four year-round Hard items and two among six Christmas Hard items. These are editorial judgments, not observed correct-answer percentages. Some younger players may find the older repertoire more challenging than the labels imply. Use actual playtesting for calibration.
- Checked the inherited bank for overlapping lyric clues, and tested all answers/aliases and rejected published distractors using the actual scoring engine. No general spelling or answer-normalization changes.
- New source-backed examples: Give My Regards to Broadway (1904 archival chorus), The Twelve Days of Christmas (1909 standard gift order), What Child Is This (1865 text), and I Heard the Bells on Christmas Day (1865 published poem text). No lyrics from modern songs are used.

## Validation and deployment
- Focused TypeScript engine compilation, 65 engine tests, and 41 UI contract tests passed (106 total). The local compile used an available global Node type declaration package; the production dependencies are not installed here, so full Next.js production build and live browser behavior remain unverified.
- Existing bank records, brand assets, and schema compared against v1.9.1. Update the full app between games. No migration. Existing season-selection rules remain unchanged.
