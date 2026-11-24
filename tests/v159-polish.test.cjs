const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const show=fs.readFileSync('src/components/ShowRoom.tsx','utf8');
const game=fs.readFileSync('src/lib/game.ts','utf8');
const css=fs.readFileSync('src/app/globals.css','utf8');
const guide=fs.readFileSync('src/app/guide/page.tsx','utf8');
const home=fs.readFileSync('src/app/page.tsx','utf8');
test('No Show animation skips old presenter, runs longer, and leaderboard needs no next up text',()=>{
 assert.doesNotMatch(show,/THE KNOW SHOW PRESENTS/);
 assert.match(show,/A TOTAL NO-SHOW!/);
 assert.doesNotMatch(show,/Next up: back to the board/);
 assert.match(show,/timeLeft>\(final\?13000:7500\)/);
 assert.match(css,/\.ks-noshow-stars span\{animation-duration:3\.4s\}/);
});
test('results grant more time to see answers, and incorrect submissions alone can dispute',()=>{
 assert.match(game,/endsAt:now\+\(noShow\?11000:7500\)/);
 assert.match(game,/f\.endsAt=now\+\(f\.noShow\?16500:13000\)/);
 assert.match(game,/Only submitted answers marked incorrect can be reviewed/);
 assert.match(show,/Think you got it right\?/);
 assert.match(show,/Ask the host to review your answer/);
 assert.match(show,/r&&!r\.correct&&r\.answer\.trim\(\)/);
});
test('dispute notification switches to host and scrolls to highlighted review row',()=>{
 assert.match(show,/setFocusDispute\(true\);switchTab\('host'\)/);
 assert.match(show,/disputeTargetRef\.current/);
 assert.match(show,/scrollIntoView\(\{behavior:'smooth',block:'center'\}\)/);
 assert.match(show,/ks-host-disputed/);
 assert.match(show,/autoReturnFromDispute\.current/);
});
test('music dropdown closes after selection and gives host and players instructions',()=>{
 assert.match(show,/menuRef\.current\.open=false/);
 assert.match(show,/Ask the host to press Play to start your selected music/);
 assert.match(show,/Open the music player and press Play/);
 assert.match(show,/Hide music player/);
 assert.match(show,/lastTrack\.current!==track\?\.id/);
 assert.match(css,/\.v2phonehead:has\(\.ks-room-music\[open\]\)/);
});
test('How to Play guide is short, nontechnical and highlights bank size',()=>{
 assert.match(guide,/over 70 categories/);
 assert.match(guide,/996 regular questions/);
 assert.match(guide,/76 Final Word questions/);
 assert.match(guide,/highest score wins/);
 assert.doesNotMatch(guide,/schemaVersion|source verification|v1\.0|tolerant spelling/);
 assert.match(home,/How to play/);
 assert.match(css,/\.v11howlink\{border:1\.5px solid/);
});
