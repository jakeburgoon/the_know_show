const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const room=fs.readFileSync('src/components/ShowRoom.tsx','utf8');
const page=fs.readFileSync('src/app/page.tsx','utf8');
const css=fs.readFileSync('src/app/globals.css','utf8');
const layout=fs.readFileSync('src/app/layout.tsx','utf8');
test('guide is a simple upper-right link, not a second primary action',()=>{
 assert.ok(page.indexOf('className="v11howlink"')<page.indexOf('className="v11overline"'));
 assert.match(css,/\.v11landing \.v11howlink\{display:flex;width:max-content;margin:0 0 4px auto;[^}]*background:transparent;[^}]*text-decoration:underline/);
});
test('touch form controls prevent small-font focus zoom without disabling pinch zoom',()=>{
 assert.match(css,/@media\(max-width:700px\), \(hover:none\) and \(pointer:coarse\)/);
 assert.match(css,/:where\(input:not\(\[type=checkbox\]\)[^\n]*,textarea,select\)\{font-size:16px!important\}/);
 assert.doesNotMatch(layout,/maximumScale|userScalable/);
});
test('slider poses a direct question, explains selected choice, and retains original four settings',()=>{
 assert.match(room,/When should this player see answer choices\?/);
 assert.match(room,/\['Never — all answers are written','Only for Hard questions','For Medium and Hard questions','For all regular questions'\]/);
 assert.match(room,/PLAYER_SUPPORT=\['off','hard','medium-hard','all'\]/);
 assert.match(room,/min=\{0\} max=\{3\} step=\{1\}/);
 assert.match(room,/aria-valuetext=\{PLAYER_SUPPORT_LABELS\[level\]\}/);
 assert.match(room,/The final question is written for everyone/);
});
test('support slider has a 44px hit area, 12px track and 32px thumb on both browser engines',()=>{
 assert.match(css,/\.ks-player-support input\[type=range\]\{display:block;[^}]*height:44px/);
 for(const [track,thumb] of [['-webkit-slider-runnable-track','-webkit-slider-thumb'],['-moz-range-track','-moz-range-thumb']]){
  assert.ok(css.includes(`::${track}{height:12px`));
  assert.ok(css.includes(`::${thumb}{width:32px;height:32px`));
 }
});
