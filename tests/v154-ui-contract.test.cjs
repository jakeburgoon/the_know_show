const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const wizard=fs.readFileSync('src/components/HostWizard.tsx','utf8');
const show=fs.readFileSync('src/components/ShowRoom.tsx','utf8');
const css=fs.readFileSync('src/app/globals.css','utf8');

test('written answer setup clearly says no choices are displayed',()=>{
  assert.match(wizard,/Everyone types their answers\. No answer options are given\./);
  assert.doesNotMatch(wizard,/All players type their answers\. Final Word is always written\./);
});
test('the other formats describe the final question in plain language and inclusive mix',()=>{
  assert.match(wizard,/The final question is written/);
  assert.match(wizard,/level the playing field across ages or abilities/);
  assert.doesNotMatch(wizard,/Final Word is written/);
});
test('loading uses unchanged logo path, branded styling and reduced-motion support',()=>{
  assert.match(show,/function BrandedRoomLoading/);
  assert.match(show,/ks-stage-loading/);
  assert.match(show,/src="\/know-show-logo\.png"/);
  assert.match(css,/ks-stage-loading-meter/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
test('the lobby TV link only appears with the TV-plus-phones setting',()=>{
  assert.match(show,/\(view\.settings\.displayMode\?\?'tv'\)==='tv'&&<Link href=\{`\/display\/\$\{code\}`\}>Open TV display/);
  assert.match(show,/!phonesOnly&&<Link className="v2button" href=\{`\/display\/\$\{code\}`\}>Open TV display/);
});
test('host TV return is linked and works when the host has a player credential too',()=>{
  assert.match(show,/returnToHost&&<Link className="ks-tv-back" href=\{`\/room\/\$\{code\}\?view=host`\}/);
  assert.match(show,/returningToHost&&h\?'host':p\?'player'/);
  assert.match(show,/localStorage\.getItem\(`knowshow:\$\{code\}:host`\)/);
});

test('compact header music menu presents a single shared selection and host permission',()=>{
  assert.match(show,/function RoomMusicMenu/);
  assert.match(show,/aria-label="Choose music for the whole show"/);
  assert.match(show,/Let players choose music/);
  assert.match(show,/ks-room-head-actions/);
  assert.match(css,/ks-room-music-panel/);
});
test('music selection is on room header instead of opening deep host controls',()=>{
  assert.match(show,/view\.phase!=='lobby'&&<RoomMusicMenu/);
  assert.match(show,/type:'choose-music',music,arrangement/);
  assert.match(show,/settings:\{playerMusic:enabled\}/);
});
