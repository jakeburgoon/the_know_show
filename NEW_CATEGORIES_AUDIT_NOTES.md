# v1.7.0 — New category editorial audit

Thirteen approved **year-round** categories with four Easy, four Medium and four Hard questions apiece; 13 separate medium-hard/hard Final Word questions with two paid hints each.

- Every question contains an answer, three same-type alternatives, and a unique editorial hint. Wordplay alternatives are other plausible compound titles, and Un-Done alternatives all begin with **un**.
- Final Word questions have two progressively useful hints; no multiple-choice options during Final Word.
- **Extra! Extra!** uses deliberately fictional headline-style wording. These are *not* purported historical newspaper quotations.
- Automated checks cover record schema, category-level balance, unique IDs, exact prompt overlap, alias/option conflicts, and Final Word vs regular answer overlap.
- A supplied source URL is a **reference starting point**, not proof of full independent fact-checking. All 13 Final Word items received targeted checks, including twelve external reference matches and one original wordplay derivation. Eighteen regular items received targeted, claim-specific external corroboration. The remaining regular items have an editorial plausibility check rather than an independent per-item source audit; they need that additional review before the whole pack can be called fully externally fact-checked.
- Full browser/device and production-build verification must be performed on deployment; do not represent syntax-only checks as a production build.

## Confirmed Final Word references

- **Villains We Love to Hate**: Iago. https://www.folger.edu/explore/shakespeares-works/othello/read/characterList/
- **Celebrity Spotlight**: Olivia Colman. https://www.oscars.org/oscars/ceremonies/2019
- **Video Game Vault**: Naughty Dog. https://www.naughtydog.com/company
- **Brands & Slogans**: Old Spice. https://www.dandad.org/insights/awards/old-spice-case-study-insights
- **Sci-Fi Worlds**: Isaac Asimov. https://sf-encyclopedia.com/entry/psychohistory
- **Fantasy Realms**: Elessar. https://www.encyclopedia-of-arda.com/e/elfstonearagorn.php
- **The Toy Box**: Richard James. https://www.museumofplay.org/toys/slinky/
- **Hail to the Chief**: Martin Van Buren. https://prod.millercenter.org/president/vanburen/life-before-the-presidency
- **Wars & Turning Points**: Battle of Blenheim. https://www.nam.ac.uk/explore/battle-blenheim
- **Extra! Extra!**: Discovery of Tutankhamun's tomb. https://tutankhamun.griffith.ox.ac.uk/people/howard-carter
- **Connect the Dots**: A Midsummer Night's Dream. https://www.folger.edu/explore/shakespeares-works/a-midsummer-nights-dream/
- **Before & After**: A Clockwork Orange Is the New Black. Original wordplay puzzle: independently constructed from two published titles; not a historical claim
- **Un-Done!**: Unfathomable. https://dictionary.cambridge.org/us/dictionary/english/unfathomable

## Issue log

- Replaced an invalid “un-” Final Word word with **unfathomable**, a documented English word.
- Replaced a U.S. presidents question that exactly duplicated an existing prompt.
- Reworked distractors in **Before & After** so all four options look like plausible blended titles.
- Preserved a few intentionally shared answers where entirely different prompts naturally refer to widely known historical figures or conflicts; question-history logic tracks question IDs.
