const {test}=require('node:test');const assert=require('node:assert/strict');
const g=require('../.engine-build/game.js'),b=require('../.engine-build/questions.js');
const now=Date.parse('2026-11-24T12:00:00Z'),host={kind:'host'};
function ready(){let s=g.makeGame();s=g.joinGame(s,'One').state;s=g.joinGame(s,'Two').state;return s;}
test('disabled categories are excluded from both drafts and the Final Word, including seasonal categories',()=>{
 const keep=b.CATEGORIES.filter(c=>!c.activeMonths).slice(0,12).map(c=>c.id);const disabled=b.CATEGORIES.filter(c=>!keep.includes(c.id)).map(c=>c.id);
 let s=ready();s.disabledCategoryIds=disabled;s=g.mutate(s,{type:'start-draft'},host,now);assert.equal(s.draftPool.length,8);assert.ok(s.draftPool.every(id=>keep.includes(id)));
 for(let i=0;i<4;i++)s=g.mutate(s,{type:'draft-category',categoryId:s.draftPool.find(id=>!s.selected[0].includes(id))},host,now);
 s.round=0;s.phase='results';s.usedKeys=s.selected[0].flatMap(id=>[0,1,2].map(n=>`${id}:${n}`));s.resolution={key:s.usedKeys[0],questionId:s.questionMap[s.usedKeys[0]],answer:'x',category:'x',points:100,answers:{},finishedAt:now,endsAt:now,disputeIds:[]};
 s=g.tick(s,now+1);assert.equal(s.phase,'draft');assert.equal(s.round,1);assert.equal(s.draftPool.length,8);assert.ok(s.draftPool.every(id=>keep.includes(id)&&!s.selected[0].includes(id)));
 for(let i=0;i<4;i++)s=g.mutate(s,{type:'draft-category',categoryId:s.draftPool.find(id=>!s.selected[1].includes(id))},host,now+2);
 for(let i=0;i<40;i++){const f=g.chooseFinalQuestion(s,now);assert.ok(keep.includes(f.categoryId));assert.ok(!s.selected.flat().includes(f.categoryId));}
});
test('disabling all but eleven year-round categories blocks show start instead of creating an incomplete board',()=>{const s=ready();const keep=b.CATEGORIES.filter(c=>!c.activeMonths).slice(0,11).map(c=>c.id);s.disabledCategoryIds=b.CATEGORIES.filter(c=>!keep.includes(c.id)).map(c=>c.id);assert.throws(()=>g.mutate(s,{type:'start-draft'},host,now),/At least 12 year-round/);});
test('a rematch starts a fresh lobby so the server can load the latest policy',()=>{let s=ready();s.disabledCategoryIds=['famous-landmarks'];s.phase='finished';const n=g.mutate(s,{type:'new-game'},host,now);assert.equal(n.phase,'lobby');assert.equal(n.disabledCategoryIds,undefined);});
