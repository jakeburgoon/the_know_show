const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const wizard=fs.readFileSync('src/components/HostWizard.tsx','utf8');
const room=fs.readFileSync('src/components/ShowRoom.tsx','utf8');
const game=fs.readFileSync('src/lib/game.ts','utf8');
const home=fs.readFileSync('src/app/page.tsx','utf8');
const guide=fs.readFileSync('src/app/guide/page.tsx','utf8');
const css=fs.readFileSync('src/app/globals.css','utf8');
test('individual/phones are selected by default, without needing to touch the options',()=>{
 assert.match(game,/mode:'individual'/);
 assert.match(game,/displayMode:'phones',answerStyle:'written'/);
 assert.match(wizard,/settings\.mode:step===1\?\(settings\.displayMode\?\?'phones'\)/);
 assert.match(wizard,/onClick=\{\(\)=>setSelected\(opt\.value\)\}/);
 assert.match(wizard,/onClick=\{\(\)=>void next\(\)\}/);
});
test('onboarding is three questions and the return path is cumulative',()=>{
 assert.match(room,/Math\.min\(3,Math\.max\(0,Number\(localStorage\.getItem/);
 assert.match(room,/setupStep<3/);
 assert.match(room,/setupStep>=3/);
 assert.match(room,/Review the three setup questions/);
 assert.match(home,/Make three quick choices/);
 assert.match(guide,/three quick choices/);
 assert.match(guide,/Review each player’s answer format/);
});
test('support slider changes just the selected player and does not touch global styles',()=>{
 assert.match(room,/PLAYER_SUPPORT=\['off','hard','medium-hard','all'\]/);
 assert.match(room,/onSave=\{choiceAccess=>act\(\{type:'player-bonuses',playerId:p\.id,choiceAccess\},hostToken\)\}/);
 assert.match(room,/The final question is written for everyone/);
 assert.match(css,/\.ks-player-support input\[type=range\]/);
});
test('Green Room settings have a short name and no redundant music arrangement',()=>{
 const start=room.indexOf('<details className="ks-lobby-extras">');
 const end=room.indexOf('</details>',start);
 const section=room.slice(start,end);
 assert.match(section,/<summary>Additional settings<\/summary>/);
 assert.doesNotMatch(section,/Soundtrack arrangement|Additional settings &amp; accommodations/);
 assert.match(section,/Extra time/);
 assert.doesNotMatch(section,/Extra hints|Standard hints/);
});
test('host music player opens with the first track; tip shows once and fades',()=>{
 assert.match(room,/const \[open,setOpen\]=useState\(Boolean\(track\)\)/);
 assert.match(room,/firstPlayerMusicTip\.current=true;setShowMusicTip\(true\)/);
 assert.match(room,/setTimeout\(\(\)=>setShowMusicTip\(false\),9500\)/);
 assert.match(room,/Music<\/strong> icon at the top right/);
 assert.match(room,/phonesOnly&&hostToken&&<PhoneSoundtrack/);
 assert.match(room,/Press Play on the shared TV display/);
});

test('live support control, welcoming explanation, host startup tip and late review action are present',()=>{
 assert.match(room,/Player answer format/);assert.match(room,/more relaxing and enjoyable/);assert.match(room,/live-support-\$\{p.id\}/);assert.match(room,/Open <strong>Host View<\/strong> anytime to adjust settings, answer format, or scores/);assert.match(room,/view.lastReview/);assert.match(room,/requestFeedbackPause/);
});
