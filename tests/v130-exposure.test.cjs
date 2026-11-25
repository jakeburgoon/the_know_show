const {test}=require('node:test'),assert=require('node:assert/strict');
const g=require('../.engine-build/game.js'),b=require('../.engine-build/questions.js'),e=require('../.engine-build/exposure.js');
const now=Date.parse('2026-11-24T16:00:00Z'),host={kind:'host'};
function ready(){let s=g.makeGame([],[],[],'00000000-0000-4000-8000-000000000001');s=g.joinGame(s,'One').state;s=g.joinGame(s,'Two').state;return s;}
function board(s,category,at=now){s=g.mutate(s,{type:'start-draft'},host,at);if(!s.draftPool.includes(category))s.draftPool[7]=category;s=g.mutate(s,{type:'draft-category',categoryId:category},host,at+1);for(let i=1;i<4;i++)s=g.mutate(s,{type:'draft-category',categoryId:s.draftPool.find(id=>!s.selected[0].includes(id))},host,at+i+1);return s;}
const season=b.availableCategories(new Date(now)).find(c=>c.activeMonths);
const regular=b.CATEGORIES.find(c=>!c.activeMonths);
const ids=c=>Object.values(c.questionsByLevel).flat().map(q=>q.id);
test('every eligible seasonal category exhausts its six questions at each difficulty before repeating, over six sequential shows',()=>{
 for(const c of b.availableCategories(new Date(now)).filter(c=>c.activeMonths)){
  let history=[];for(let i=0;i<6;i++){let s=ready();s.recentQuestionIds=[...history];s=board(s,c.id);for(let n=0;n<3;n++){const id=s.questionMap[`${c.id}:${n}`];assert.ok(!history.includes(id),`${c.id} ${n} repeat ${i}`);assert.equal(s.selectionAudit[id].seenBefore,false);history.push(id);}}
 }
});
test('draft preserves eight choices, fresh categories first, seasonal guarantee, disabled exclusions',()=>{
 const fresh=b.CATEGORIES.filter(c=>!c.activeMonths).slice(0,9);const freshIds=new Set([...fresh.map(c=>c.id),season.id]);let s=ready();s.recentQuestionIds=b.CATEGORIES.filter(c=>!freshIds.has(c.id)).flatMap(ids);s.disabledCategoryIds=[fresh[0].id];
 for(let i=0;i<35;i++){const d=g.mutate(s,{type:'start-draft'},host,now);assert.equal(d.draftPool.length,8);assert.equal(new Set(d.draftPool).size,8);assert.ok(d.draftPool.includes(season.id));assert.ok(d.draftPool.every(id=>freshIds.has(id)&&id!==fresh[0].id));assert.ok(d.categoryAudit['1'].every(c=>c.unseenByLevel.every(n=>n>0)));}
});
test('exhausted seasonal category still offered when required; no other exhausted categories displace fresh choices',()=>{
 let s=ready();const seasonal=b.availableCategories(new Date(now)).filter(c=>c.activeMonths);s.recentQuestionIds=seasonal.flatMap(ids);const d=g.mutate(s,{type:'start-draft'},host,now);assert.equal(d.draftPool.length,8);assert.equal(d.categoryAudit['1'].filter(c=>c.seasonalGuaranteed).length,1);assert.equal(d.categoryAudit['1'].filter(c=>c.unseenByLevel.every(n=>n===0)).length,1);
});
test('fallback uses fewest tracked histories before recency, then least recent; unseen always beats all repeats',()=>{
 const qs=regular.questionsByLevel['1'];let s=ready();s.recentQuestionIds=qs.slice(0,-1).map(q=>q.id);s.questionSeenCounts=Object.fromEntries(s.recentQuestionIds.map(id=>[id,1]));s.historyScopeCount=3;let d=board(s,regular.id);assert.equal(d.questionMap[regular.id+':0'],qs.at(-1).id);
 s.recentQuestionIds=qs.map(q=>q.id);s.questionSeenCounts=Object.fromEntries(qs.map((q,i)=>[q.id,i===0?3:i===1?2:1]));d=board(s,regular.id);assert.equal(d.questionMap[regular.id+':0'],qs[2].id);assert.equal(d.selectionAudit[qs[2].id].seenBy,1);assert.equal(d.selectionAudit[qs[2].id].unseenAvailable,0);
});
test('Final Word also prioritizes unseen, then fewest tracked histories and oldest; excludes current boards and disabled categories',()=>{
 let s=ready();const active=new Set(b.availableCategories(new Date(now)).map(c=>c.id));const eligible=b.ELIGIBLE_CATEGORY_FINALS.filter(q=>active.has(q.categoryId));s.selected[0]=eligible.slice(0,4).map(q=>q.categoryId);s.disabledCategoryIds=[eligible[4].categoryId];const candidates=eligible.slice(5);s.recentQuestionIds=candidates.slice(0,-1).map(q=>q.id);assert.equal(g.chooseFinalQuestion(s,now).id,candidates.at(-1).id);s.recentQuestionIds=candidates.map(q=>q.id);s.questionSeenCounts=Object.fromEntries(candidates.map((q,i)=>[q.id,i===0?3:1]));assert.equal(g.chooseFinalQuestion(s,now).id,candidates[1].id);
});
test('exposure journal logs start, offers, selected categories, reveal, format/time/hints, host correction, and separate rematch IDs',()=>{
 let s=ready();s.guestHistoryKeys={[s.players[0].id]:e.deviceHistoryKey('guest-id')};let d=g.mutate(s,{type:'start-draft'},host,now);let j=e.exposureJournal(s,d,now);assert.ok(j.started);assert.equal(j.historyKeys.length,2);assert.equal(j.offers['1'].length,8);assert.equal(j.offerDiagnostics['1'].length,8);assert.equal(j.exposures.length,0);
 for(let i=0;i<4;i++){let next=g.mutate(d,{type:'draft-category',categoryId:d.draftPool.find(id=>!d.selected[0].includes(id))},host,now+i+1);j=e.exposureJournal(d,next,now+i+1);assert.equal(j.newSelected.length,1);assert.equal(j.exposures.length,0);d=next;}
 const key=d.selected[0][0]+':0';const a={kind:'player',id:d.players[0].id},z={kind:'player',id:d.players[1].id};d.players[1].choiceAccess='all';let intro=g.mutate(d,{type:'open-question',key},host,now+10);assert.equal(e.exposureJournal(d,intro).exposures.length,0);let open=g.tick(intro,now+2510);j=e.exposureJournal(intro,open);assert.equal(j.exposures.length,1);assert.equal(j.exposures[0].stats,null);assert.equal(j.exposures[0].diagnostic.seenBefore,false);assert.ok(open.recentQuestionIds.includes(open.active.questionId));assert.equal(g.makeView(intro,host,1,now+10000,true).active,undefined);
 let q=b.getQuestion(open.active.questionId);open.players[0].score=100;open=g.mutate(open,{type:'hint',kind:'options',key},a,now+2600);let mid=g.mutate(open,{type:'submit-answer',answer:q.distractors[0]},a,now+3000);let result=g.mutate(mid,{type:'submit-answer',answer:q.answer},z,now+3500);j=e.exposureJournal(mid,result);const stats=j.exposures[0].stats;assert.equal(stats.attempted,2);assert.equal(stats.correct,1);assert.equal(stats.written,0);assert.equal(stats.choices,2);assert.equal(stats.optionsPurchases,1);assert.equal(stats.responses[0].assistance,'purchased-options');assert.equal(stats.hintUsers,1);assert.equal(stats.hints,1);assert.equal(stats.timed,2);assert.equal(stats.responseMs,1480);assert.equal(stats.responses[1].optionIndex,0);assert.ok(!JSON.stringify(stats).includes(q.distractors[0]));assert.equal(e.exposureJournal(result,result).exposures.length,0);
 let corrected=g.mutate(result,{type:'resolve-dispute',playerId:a.id,correct:true},host,now+3600);j=e.exposureJournal(result,corrected);assert.equal(j.exposures[0].stats.overturned,1);assert.equal(j.exposures[0].stats.correct,2);assert.equal(j.exposures[0].stats.responses[0].initialCorrect,false);
 corrected.phase='finished';const rematch=g.mutate(corrected,{type:'new-game'},host,now+10000);assert.notEqual(rematch.feedbackShowId,corrected.feedbackShowId);assert.deepEqual(e.historyKeys(rematch),e.historyKeys(corrected));assert.equal(e.exposureJournal(corrected,rematch).exposures.length,0);
});
test('Final Word only records exposure after wagering closes; skipped regular questions are distinguished',()=>{
 let s=ready();s.phase='final-wager';const f=b.CATEGORY_FINALS[0];s.final={id:f.id,wagers:{},answers:{},disputeIds:[]};const a=g.mutate(s,{type:'start-final'},host,now);assert.equal(e.exposureJournal(s,a,now).exposures[0].level,4);assert.equal(e.exposureJournal(s,a,now).exposures[0].stats,null);const b2=g.tick(a,now+46000);let stats=e.exposureJournal(a,b2).exposures[0].stats;assert.equal(stats.notAnswered,2);assert.equal(stats.attempted,0);
});
test('skipped question retains one exposure with skipped status; show completion emits a distinct completion event',()=>{
 let s=board(ready(),regular.id);const intro=g.mutate(s,{type:'open-question',key:regular.id+':0'},host,now+100);const open=g.tick(intro,now+2600);const skipped=g.mutate(open,{type:'skip-question'},host,now+2700);const j=e.exposureJournal(open,skipped);assert.equal(j.exposures.length,1);assert.equal(j.exposures[0].stats.skipped,true);assert.equal(j.exposures[0].stats.attempted,0);
 let f=ready();f.phase='final-wager';f.final={id:b.CATEGORY_FINALS[0].id,wagers:{},answers:{},disputeIds:[]};f=g.mutate(f,{type:'start-final'},host,now);f=g.tick(f,now+46000);const done=g.mutate(f,{type:'finish'},host,now+47000);assert.equal(e.exposureJournal(f,done).complete,true);
});
