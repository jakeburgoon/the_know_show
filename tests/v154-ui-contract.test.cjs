const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const wizard=fs.readFileSync('src/components/HostWizard.tsx','utf8');
const show=fs.readFileSync('src/components/ShowRoom.tsx','utf8');
const css=fs.readFileSync('src/app/globals.css','utf8');

test('host setup asks who plays, display and answer format, not music',()=>{
  assert.match(wizard,/const stages=\['Who is playing\?','How will everyone see the show\?','How will players answer questions\?'\]/);
  assert.match(wizard,/QUESTION \{step\+1\} OF 3/);
  assert.doesNotMatch(wizard,/What is the soundtrack\?/);assert.match(wizard,/Everyone chooses/);
  assert.match(wizard,/Continue to Green Room/);
});
test('Green Room offers player-by-player answer support including all-written and all-choices',()=>{
  assert.match(show,/function PlayerAnswerSupport/);
  assert.match(show,/PLAYER_SUPPORT=\['off','hard','medium-hard','all'\]/);
  assert.match(show,/type="range" min=\{0\} max=\{3\} step=\{1\}/);
  assert.match(show,/Different answer formats can help level the playing field/);
  assert.match(show,/The final question is written for everyone/);
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
