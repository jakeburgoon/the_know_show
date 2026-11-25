const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const guide=fs.readFileSync('src/app/guide/page.tsx','utf8'),room=fs.readFileSync('src/components/ShowRoom.tsx','utf8');
test('full rules explain paid hints, prices, and Final Word refunds',()=>{
 for(const term of [/25% of the question’s base value/,/25, 75 or 125/,/50, 150 or 250/,/not refundable/,/remove two incorrect options/,/500 points each/,/Selecting Hint 2 also selects Hint 1/,/before locking your wager/,/topic preview/])assert.match(guide,term);
 assert.doesNotMatch(guide,/free hints|hints remaining|regular written hints/);
});
test('full rules distinguish answer disputes and time-limited feedback breaks',()=>{
 assert.match(guide,/before the next question is selected/);assert.match(guide,/pauses until the host decides/);assert.match(guide,/one shared five-second break/);assert.match(guide,/resumes even if you are still writing/);
});
test('gear quick rules are four compact reminders with Double Take only in individual mode',()=>{
 const quick=room.match(/<details className="ks-player-quick-rules">.*?<\/details>/s)[0];
 assert.equal((quick.match(/<li>/g)||[]).length,4);assert.match(quick,/25% of question value each/);assert.match(quick,/view.settings.mode==='individual'&&<li><strong>Double Take/);assert.match(quick,/Review:/);assert.match(quick,/500 each/);assert.ok(quick.replace(/<[^>]+>/g,' ').replace(/\{[^}]+\}/g,' ').trim().split(/\s+/).length<=50);
});
