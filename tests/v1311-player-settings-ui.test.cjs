const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const room=fs.readFileSync('src/components/ShowRoom.tsx','utf8');
test('answer-format review waits for host role and targets the first actionable request',()=>{
 assert.match(room,/setFocusFormatReview\(true\);switchTab\('host'\)/);
 assert.match(room,/if\(!focusFormatReview\|\|!isHost\)return/);
 assert.match(room,/formatReviewTargetRef\.current;if\(target\)\{target\.focus\(\{preventScroll:true\}\);target\.scrollIntoView/);
 assert.match(room,/ref=\{i===0\?formatReviewTargetRef:undefined\} tabIndex=\{-1\}/);
 assert.match(room,/Current: \{formatLabel\(p\.choiceAccess\)\} · Requested: \{formatLabel\(p\.pendingChoiceAccess\)\}/);
 assert.match(room,/resolve-answer-format',playerId:p\.id,approve:true/);
 assert.match(room,/resolve-answer-format',playerId:p\.id,approve:false/);
});
test('dispute review preserves first disputed player targeting for both regular and final answers',()=>{
 assert.equal((room.match(/ref=\{p\.id===disputes\[0\]\?disputeTargetRef:undefined\} tabIndex=\{-1\}/g)||[]).length,2);
 assert.match(room,/autoReturnFromDispute\.current=true;setFocusFormatReview\(false\);setFocusDispute\(true\);switchTab\('host'\)/);
 assert.match(room,/if\(!focusDispute\|\|!isHost\)return/);
 assert.match(room,/if\(!disputes\.length\)\{setFocusDispute\(false\);return;\}/);
});
test('joined-player lobby has names and current format without score or legacy hints',()=>{
 assert.match(room,/ks-joined-waiting[\s\S]*?Waiting for the host to start the show/);
 assert.match(room,/ks-joined-list[\s\S]*?view\.players\.map\(p=>/);
 assert.doesNotMatch(room,/regular-game hints remaining/);
 assert.match(room,/!\['lobby','results','final-results','final-wager','final-question'\]\.includes\(view\.phase\)/);
});
test('gear houses the request and quick rules, with a temporary start-of-show reminder',()=>{
 assert.match(room,/isPlayer&&me&&view\.phase!=='lobby'&&<details className="ks-player-settings"/);
 assert.match(room,/SettingsIcon size=\{19\}/);
 assert.match(room,/ks-player-settings-panel[\s\S]*?type:'request-answer-format'[\s\S]*?ks-player-quick-rules/);
 assert.doesNotMatch(room,/<details className="ks-format-request"/);
 assert.match(room,/setTimeout\(\(\)=>setShowPlayerSettingsTip\(false\),9500\)/);
 assert.match(room,/firstPlayerSettingsTip\.current=false;setShowPlayerSettingsTip\(false\)/);
});
