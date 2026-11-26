const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const room=fs.readFileSync('src/components/ShowRoom.tsx','utf8');
const home=fs.readFileSync('src/app/page.tsx','utf8');
const css=fs.readFileSync('src/app/globals.css','utf8');
const display=fs.readFileSync('src/app/display/[code]/page.tsx','utf8');
test('TV uses one stable audio iframe and parks sidebar instead of unmounting on results',()=>{
 const tv=room.slice(room.indexOf('function TV('),room.indexOf('function PhoneSoundtrack('));
 assert.match(tv,/const fullStage=\['finished','results','final-results'\]\.includes\(view.phase\)/);
 assert.match(tv,/<aside className=\{"v2tvside"\+\(fullStage\?" ks-tv-side-parked":""\)\}/);
 assert.equal((tv.match(/<iframe /g)||[]).length,1);
 assert.match(tv,/<iframe key=\{track.id\}/);
 assert.match(tv,/!preview&&\(view.settings.displayMode\?\?'tv'\)==='tv'/);
 assert.match(css,/\.v2tvside\.ks-tv-side-parked\{position:absolute/);
});
test('display entry uses public read-only route, not participant join or host credentials',()=>{
 assert.match(home,/router.push\(`\/display\/\$\{displayCode\}`\)/);
 assert.match(home,/This does not join as a player/);
 assert.match(display,/<ShowRoom displayOnly\/>/);
 assert.match(room,/const authToken=displayOnly\?'':actorToken/);
});
test('host pairing is visible outside additional settings, preserves player credentials and skips the completed wizard',()=>{
 const extras=room.indexOf('<details className="ks-lobby-extras">');
 const pair=room.indexOf('<details className="ks-lobby-pair ks-lobby-host-pair">');
 assert.ok(room.indexOf('</details>',extras)<pair);
 assert.match(room,/if\(paired\)\{setSetupStep\(3\)/);
 assert.match(room,/switchTab\(playerToken\?'player':'host'\)/);
 assert.match(room,/if\(p\)localStorage.setItem\(`knowshow:\$\{code\}:player`,p\)/);
});

test('a host command made from player view does not replace the private player view',()=>{
 assert.match(room,/if\(actingToken===authToken\)\{if\(d.revision>=lastRev.current\)/);
 assert.match(room,/else\{void refresh\(\);\}\s*onResult/);
});
test('new private pairing links use fragments, and old query links remain supported',()=>{
 assert.match(room,/fragment.get\('hostToken'\)\|\|query.get\('hostToken'\)/);
 assert.match(room,/\$\{roomUrl\}#hostToken=/);
 assert.match(room,/fragment.delete\('hostToken'\)/);
});
