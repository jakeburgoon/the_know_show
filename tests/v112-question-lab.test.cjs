const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const page=fs.readFileSync('src/app/developer/page.tsx','utf8');
const layout=fs.readFileSync('src/app/developer/layout.tsx','utf8');
const css=fs.readFileSync('src/app/globals.css','utf8');

test('developer dashboard includes Question Lab with browser, preview and playtest builder',()=>{
 assert.match(page,/Developer dashboard/);
 assert.match(page,/Question Lab/);
 assert.match(page,/Question browser/);
 assert.match(page,/Live question preview/);
 assert.match(page,/Playtest set builder/);
 assert.match(page,/Build playtest set/);
});

test('Question Lab uses full-bank filters and the app answer matcher',()=>{
 assert.match(page,/Entire question bank/);
 assert.match(page,/Image-based questions only/);
 assert.match(page,/Search prompt or answer/);
 assert.match(page,/Try an answer/);
 assert.match(page,/isCorrectForQuestion/);
 assert.match(page,/This uses the app’s normal acceptance logic/);
});

test('Question Lab styling and metadata are present',()=>{
 assert.match(layout,/Developer dashboard \| The Know Show/);
 assert.match(css,/\.ks-dev-tabs\{/);
 assert.match(css,/\.ks-lab-layout\{/);
 assert.match(css,/\.ks-lab-preview\{/);
});

test('full question bank is delivered only through a session-protected no-store API',()=>{const route=fs.readFileSync('src/app/api/developer/questions/route.ts','utf8');assert.doesNotMatch(page,/import \{CATEGORIES/);assert.match(page,/fetch\('\/api\/developer\/questions'/);assert.match(route,/if\(!validDeveloperSession[\s\S]*401/);assert.match(route,/headers:noStore/);});
