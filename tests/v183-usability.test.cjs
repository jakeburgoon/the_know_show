const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const room=fs.readFileSync('src/components/ShowRoom.tsx','utf8');
const page=fs.readFileSync('src/app/page.tsx','utf8');
const css=fs.readFileSync('src/app/globals.css','utf8');
const layout=fs.readFileSync('src/app/layout.tsx','utf8');
test('guide is a compact navy and gold link styled as a button in a separate cream header',()=>{
 assert.match(page,/<header className="v11landingbar">[\s\S]*?<Link href="\/guide" className="v11howlink"><HelpCircle[^>]*\/> How to play<\/Link>[\s\S]*?<\/header>\s*<section className="v11showcase"/);
 assert.match(css,/\.v11landing \.v11landingbar\{[^}]*justify-content:flex-end;[^}]*background:var\(--v11cream\)/);
 assert.match(css,/\.v11landing \.v11landingbar \.v11howlink\{[^}]*background:linear-gradient[^}]*color:#f5cf78;[^}]*box-shadow:/);
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

 test('Final Word wagering UI shows only purchase status, and hints accompany the prompt',()=>{
 const fs=require('node:fs');const room=fs.readFileSync('src/components/ShowRoom.tsx','utf8');
 const wager=room.slice(room.indexOf("{view.phase==='final-wager'&&<section className=\"ks-finaldecision\""),room.indexOf("{view.phase==='final-question'&&<section className=\"v2card v2questioncard ks-finalquestion\""));
 assert.ok(wager.length>0);assert.match(wager,/Purchased hints will be revealed alongside the Final Word question/);assert.doesNotMatch(wager,/myRevealedHints/);
 const question=room.slice(room.indexOf("{view.phase==='final-question'&&<section className=\"v2card v2questioncard ks-finalquestion\""));
 assert.ok(question.indexOf('myRevealedHints')<question.indexOf('<AnswerForm key="final-word"'));assert.match(room,/THE SHOW’S CHAMPION/);assert.doesNotMatch(room,/TONIGHT’S CHAMPION/);
 });
