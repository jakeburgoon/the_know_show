const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const show=fs.readFileSync('src/components/ShowRoom.tsx','utf8');
const css=fs.readFileSync('src/app/globals.css','utf8');
const game=fs.readFileSync('src/lib/game.ts','utf8');

test('no-show presentation is a short first beat on phones and TV, before normal answer and standings',()=>{
 assert.match(show,/function NoShowBeat\(\)/);
 assert.match(show,/A TOTAL NO-SHOW!/);
 assert.match(show,/Nobody knew that one!/);
 assert.match(show,/noShowBeat\?<NoShowBeat\/>:standingsBeat/);
 assert.match(show,/view\.phase==='results'&&view\.results&&<AnswerReveal view=\{view\}/);
 assert.match(show,/view\.phase==='final-results'&&<AnswerReveal view=\{view\}/);
});
test('animation matches the existing gold/navy palette and respects reduced motion',()=>{
 assert.match(css,/\.ks-noshow\{/);
 assert.match(css,/@keyframes ks-noshow-starfall/);
 assert.match(css,/prefers-reduced-motion:reduce\)\{\.ks-noshow/);
 assert.match(show,/Clapperboard size=\{52\}/);
});
test('engine gates the animation on wrong submitted answers and preserves standard timings',()=>{
 assert.match(game,/const noShow=!skipped&&everyoneMissed\(s,a\.answers\)/);
 assert.match(game,/endsAt:now\+\(noShow\?9000:6500\)/);
 assert.match(game,/f\.endsAt=now\+\(f\.noShow\?14500:12000\)/);
});
