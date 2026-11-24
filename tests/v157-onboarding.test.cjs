const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const wizard=fs.readFileSync('src/components/HostWizard.tsx','utf8');
const room=fs.readFileSync('src/components/ShowRoom.tsx','utf8');
const css=fs.readFileSync('src/app/globals.css','utf8');
const guide=fs.readFileSync('src/app/guide/page.tsx','utf8');

test('TV setup identifies dedicated shared display and does not demand a laptop in every case',()=>{
 assert.match(wizard,/TV \+ phones/);
 assert.match(wizard,/shared game board on a TV/);
 assert.match(wizard,/compatible smart-TV browser/);
 assert.match(wizard,/HDMI or screen casting/);
});
test('only the TV selection shows more help, not the phones-only selection',()=>{
 assert.match(wizard,/step===1&&selected==='tv'&&<aside/);
 assert.match(wizard,/No TV or laptop needed/);
 assert.match(wizard,/Mirroring someone’s Player View/);
 assert.match(css,/\.ks-wizard-tv-help/);
});
test('Green Room reminder appears only in TV setup and retains TV link condition',()=>{
 assert.match(room,/displayMode\?\?'tv'\)==='tv'&&<p className="ks-lobby-tv-help"/);
 assert.match(room,/Open TV display/);
});
test('How to Play guide briefly explains shared TV and separate player phones',()=>{
 assert.match(guide,/dedicated TV display on a laptop connected or cast to your TV/);
 assert.match(guide,/players still answer on their phones/);
 assert.match(guide,/highest score wins/);
 assert.doesNotMatch(guide,/development process|schemaVersion|Standard Trivia is the single v1\.0/);
});
