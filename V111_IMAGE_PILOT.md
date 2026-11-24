# v1.11.1 — Visual trivia pilot

## Release
76 categories (62 year-round, 14 seasonal), 996 regular questions, 76 active Final Word questions: 1,072 total. Existing question objects and IDs preserved. Flags of the World remains year-round with a softer Hard tier focused on recognizable countries. Famous Landmarks is now added as a second year-round image category. All image assets are original local vector renderings created for the app; the source websites were consulted for factual reference and design guidance, but no third-party binary images were copied. The landmark illustrations are simplified, recognizable depictions intended for gameplay rather than photographic reproductions.

## Storage
The images live under `public/trivia-images/`, referenced by an optional `image` field with opaque same-origin asset path, non-answer descriptive alt text, width and height. Images are not embedded in JSON or in Supabase snapshots. `IMAGE_CREDITS.json` records the mapping and reference sources. Future externally sourced images should include creator, actual file URL, license URL/version, modification record and required attribution, shown after answer reveal or through an appropriate credits mechanism (not implemented for third-party assets in this pilot). Preserve stable image paths for old feedback records.

## Presentation
The regular question and Final Word images appear only in the appropriate question view, on TV, player and host screens. The result reveal includes a smaller version. Final Word image is not included in the API response while wagers are being entered. The image issue reason is offered only on visual questions; feedback stores the image metadata in the existing JSON field, with dashboard preview and CSV export. The SVG files are small, locally hosted and use opaque filenames and neutral visual descriptions. The public files are not a secret or an anti-cheating boundary; no answer metadata is delivered during regular question play except existing authorized answer choices. Timers are unchanged. Images use natural proportions and do not crop. An image failure displays a visual description and suggests asking the host to skip; the timer continues. For photo expansion, evaluate delivery latency before scaling and consider separate storage/CDN with optimized image sizes and a fair loading protocol.

## Validation and deployment
Run the existing and new engine/UI tests. Full production Next.js build and live phone/TV checks remain necessary. Existing v1.10.0 Supabase configuration is sufficient. For older installs complete the v1.10.0 feedback migration and password setup first. Deploy between shows, create a new room, play Flags of the World in both display arrangements, try written and choice answers, inspect reveal, submit an image issue, and verify the dashboard. Check Final Word when the flags finale is drawn. Category selection is unchanged; the new category is not forced onto every board. Repeatedly create fresh test rooms or use a local test fixture for deterministic coverage.

## Question review
Difficulty is editorial, not empirically calibrated. All 12 regular questions ask players to name the country from the flag; the image is the clue. Distractors are chosen from similar flag designs and/or related countries. Capital/region and cultural hints provide an alternate path. Palau's image-only Final Word has two geographic hints. All answer/distractor combinations are exercised by the scoring tests. Reference sources are recorded individually. The SVGs are drawn with simple geometric shapes and representative colors, not official artwork downloads; compare with original country flag sources before a broad public rollout.

| Level | Answer | Incorrect choices | Hint | Reference |
|---|---|---|---|---|
| Easy | Japan | Bangladesh, South Korea, China | Its capital is Tokyo. | [Flag design](https://flagpedia.net/japan) |
| Easy | France | Italy, Netherlands, Belgium | Its capital is Paris. | [Flag design](https://flagpedia.net/france) |
| Easy | Germany | Belgium, Austria, Spain | Berlin is its capital. | [Flag design](https://flagpedia.net/germany) |
| Easy | Italy | Ireland, France, Mexico | Rome is its capital. | [Flag design](https://flagpedia.net/italy) |
| Medium | Sweden | Finland, Norway, Denmark | Stockholm is its capital. | [Flag design](https://flagpedia.net/sweden) |
| Medium | Ukraine | Lithuania, Romania, Sweden | Kyiv is its capital. | [Flag design](https://flagpedia.net/ukraine) |
| Medium | Switzerland | Denmark, Austria, Georgia | This Alpine country has Bern as its federal city. | [Flag design](https://flagpedia.net/switzerland) |
| Medium | Bangladesh | Pakistan, Japan, Maldives | Dhaka is its capital. | [Flag design](https://flagpedia.net/bangladesh) |
| Hard | Estonia | Latvia, Lithuania, Finland | Tallinn is its capital. | [Flag design](https://flagpedia.net/estonia) |
| Hard | Botswana | Namibia, Zambia, Lesotho | The Okavango Delta lies in this southern African country. | [Flag design](https://flagpedia.net/botswana) |
| Hard | Latvia | Austria, Lithuania, Estonia | Riga is its capital. | [Flag design](https://flagpedia.net/latvia) |
| Hard | Mauritius | Seychelles, Madagascar, Comoros | This Indian Ocean island nation was home to the extinct dodo. | [Flag design](https://flagpedia.net/mauritius) |

Final Word: **Palau**. Hints: This Pacific island nation includes the Rock Islands, famous for their marine biodiversity. / Its capital is Ngerulmud, on the island of Babeldaob.. [Flag design](https://flagpedia.net/palau).
