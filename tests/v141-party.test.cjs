const {test}=require('node:test');
const assert=require('node:assert/strict');
const g=require('../.engine-build/game.js');
const bank=require('../.engine-build/questions.js');
const host={kind:'host'};
const now=Date.parse('2026-11-28T18:00:00-05:00');
const categories=bank.availableCategories(new Date(now));
const regular=categories.filter(c=>!c.activeMonths).slice(0,5).map(c=>c.id);
const seasonal=categories.find(c=>c.activeMonths).id;
function setup(n=2,mode='individual'){
 let s=g.makeGame();s=g.mutate(s,{type:'settings',settings:{mode,answerStyle:'written'}},host,now);
 for(let i=0;i<n;i++)s=g.joinGame(s,`Player ${i+1}`,undefined,now+i).state;
 return s;
}
function draft(s,t){if(s.categoryVote){for(const p of s.players)s=g.mutate(s,{type:'category-ballot',voteId:s.categoryVote.id,categoryIds:s.draftPool.slice(0,4)},{kind:'player',id:p.id},t++);}else for(const id of s.draftPool.slice(0,4))s=g.mutate(s,{type:'draft-category',categoryId:id},host,t++);return s;}
test('16 individual seats, 8 teams and mode changes cannot bypass capacity',()=>{
 const s=setup(16);assert.equal(g.makeView(s,host,0,now).maxSeats,16);assert.throws(()=>g.joinGame(s,'Player 17'),/room is full/);
 assert.throws(()=>g.mutate(s,{type:'settings',settings:{mode:'teams'}},host,now),/eight/);
 const teams=setup(8,'teams');assert.equal(g.makeView(teams,host,0,now).maxSeats,8);assert.throws(()=>g.joinGame(teams,'Team 9'),/room is full/);
});
test('host picks only: validation, seasonal availability, disabled IDs, view privacy',()=>{
 let s=setup();const player={kind:'player',id:s.players[0].id};const off=bank.CATEGORIES.find(c=>c.activeMonths&&!categories.includes(c)).id;
 for(const ids of [[...regular], [regular[0],regular[0]],['missing'],[off],null])assert.throws(()=>g.mutate(s,{type:'set-featured-categories',categoryIds:ids},host,now),g.GameError);
 assert.throws(()=>g.mutate(s,{type:'set-featured-categories',categoryIds:[regular[0]]},player,now),/Only the host/);
 s.disabledCategoryIds=[regular[0]];assert.throws(()=>g.mutate(s,{type:'set-featured-categories',categoryIds:[regular[0]]},host,now),/unavailable/);
 s=g.mutate(s,{type:'set-featured-categories',categoryIds:[regular[1],seasonal]},host,now);
 assert.deepEqual(g.makeView(s,host,0,now).hostFeaturedCategories,[regular[1],seasonal]);
 assert.deepEqual(g.makeView(s,player,0,now).hostFeaturedCategories,[]);
 s.disabledCategoryIds.push(seasonal);assert.throws(()=>g.mutate(s,{type:'start-draft'},host,now),/no longer available/);
 s=g.mutate(s,{type:'set-featured-categories',categoryIds:[]},host,now);assert.deepEqual(s.hostFeaturedCategories,[]);
});
test('four picks split between rounds, no Round 2 pick leaks into Round 1, seasonal and random choices survive',()=>{
 for(let attempt=0;attempt<20;attempt++){
  let s=setup();const picks=regular.slice(0,4);s=g.mutate(s,{type:'set-featured-categories',categoryIds:picks},host,now);
  s=g.mutate(s,{type:'start-draft'},host,now);assert.equal(s.draftPool.length,8);assert.equal(new Set(s.draftPool).size,8);
  for(const id of [picks[0],picks[2]])assert.ok(s.draftPool.includes(id));for(const id of [picks[1],picks[3]])assert.ok(!s.draftPool.includes(id));
  assert.ok(s.draftPool.some(id=>bank.CATEGORY_LOOKUP.get(id).activeMonths));assert.deepEqual(g.makeView(s,{kind:'spectator'},1,now).featuredCategoryIds,[picks[0],picks[2]]);
  assert.throws(()=>g.mutate(s,{type:'set-featured-categories',categoryIds:[]},host,now),/before starting/);
  // Players can choose four nonfeatured categories. Simulate the normal end-of-round transition.
  for(const id of s.draftPool.filter(id=>!picks.includes(id)).slice(0,4))s=g.mutate(s,{type:'draft-category',categoryId:id},host,now);
  assert.ok(s.selected[0].every(id=>!picks.includes(id)));
  s.usedKeys=s.selected[0].flatMap(id=>[0,1,2].map(l=>`${id}:${l}`));s.phase='results';s.resolution={endsAt:now,disputeIds:[]};s=g.tick(s,now+1);
  assert.equal(s.round,1);assert.equal(s.draftPool.length,8);assert.ok(s.draftPool.includes(picks[1])&&s.draftPool.includes(picks[3]));assert.ok(s.draftPool.every(id=>!s.selected[0].includes(id)));assert.ok(s.draftPool.some(id=>bank.CATEGORY_LOOKUP.get(id).activeMonths));
 }
});
test('one to three picks split as evenly as possible; rematches reset curation',()=>{
 for(let n=0;n<=3;n++){
  let s=setup();s=g.mutate(s,{type:'set-featured-categories',categoryIds:regular.slice(0,n)},host,now);s=g.mutate(s,{type:'start-draft'},host,now);
  assert.equal(g.makeView(s,host,1,now).featuredCategoryIds.length,Math.ceil(n/2));s.phase='finished';s=g.mutate(s,{type:'new-game'},host,now);assert.deepEqual(g.makeView(s,host,2,now).hostFeaturedCategories,[]);
 }
});
test('16 players complete both rounds and Final Word, all receive scores and a question-selection turn',()=>{
 let s=setup(16);s=g.mutate(s,{type:'set-featured-categories',categoryIds:[seasonal,regular[0],regular[1],regular[2]]},host,now);s=g.mutate(s,{type:'start-draft'},host,now);
 let t=now+1000;const choosers=new Set();const actors=s.players.map(p=>({kind:'player',id:p.id}));
 for(let round=0;round<2;round++){
  s=draft(s,t);t+=10;
  for(const key of s.selected[round].flatMap(id=>[0,1,2].map(i=>`${id}:${i}`))){
   const actor=actors[s.chooserIndex%actors.length];choosers.add(actor.id);s=g.mutate(s,{type:'open-question',key},actor,t);s=g.tick(s,t+2600);
   const answer=bank.getQuestion(s.active.questionId).answer;
   actors.forEach((a,i)=>{s=g.mutate(s,{type:'submit-answer',answer},a,t+2700+i);});assert.equal(s.phase,'results');assert.equal(Object.keys(s.resolution.answers).length,16);assert.equal(s.resolution.eligibleSeats,16);t=s.resolution.endsAt+1;s=g.tick(s,t);
  }
 }
 assert.equal(choosers.size,16);assert.equal(s.phase,'final-wager');for(const a of actors)s=g.mutate(s,{type:'wager',amount:100},a,++t);assert.equal(s.phase,'final-question');const final=bank.FINALS.find(f=>f.id===s.final.id);
 for(const a of actors)s=g.mutate(s,{type:'final-answer',answer:final.answer},a,++t);assert.equal(s.phase,'final-results');assert.equal(g.makeView(s,host,0,t).final.results.length,16);s=g.tick(s,s.final.endsAt+1);assert.equal(s.phase,'finished');assert.ok(s.players.every(p=>p.score>0));
});
