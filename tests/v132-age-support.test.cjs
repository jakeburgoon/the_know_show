const {test}=require('node:test'),assert=require('node:assert/strict');
const g=require('../.engine-build/game.js'),e=require('../.engine-build/exposure.js'),b=require('../.engine-build/questions.js'),a=require('../.engine-build/age-support.js');
const host={kind:'host'},now=Date.UTC(2026,10,24,12);
function lobby(){let s=g.makeGame();for(const name of ['Player A','Player B','Player C'])s=g.joinGame(s,name,undefined,now).state;return s;}
function age(s,idx,ageBand){return g.mutate(s,{type:'player-age-band',playerId:s.players[idx].id,ageBand},host,now);}
test('all seven bands recommend correct support; minor age is not saved; unspecified leaves support unchanged; override wins',()=>{
 let s=lobby();for(const band of a.AGE_BANDS){s=age(s,0,band);assert.equal(s.players[0].choiceAccess,a.AGE_SUPPORT[band]);assert.equal(s.players[0].ageBand,a.isAdultAgeBand(band)?band:undefined);assert.equal(s.players[1].choiceAccess,'off');}
 s=age(s,0,'13-15');s=g.mutate(s,{type:'player-bonuses',playerId:s.players[0].id,choiceAccess:'hard'},host,now);s=age(s,0,null);assert.equal(s.players[0].choiceAccess,'hard');assert.equal(s.players[0].ageBand,undefined);
});
test('age choices require host, individual lobby, valid range; only host lobby sees adult age',()=>{
 let s=age(lobby(),0,'18-29');const action={type:'player-age-band',playerId:s.players[0].id,ageBand:'50-plus'};
 assert.throws(()=>g.mutate(s,action,{kind:'player',id:s.players[0].id},now),/Only the host/);assert.throws(()=>age(s,0,'invalid'),/Invalid age/);
 assert.equal(g.makeView(s,host,1,now).players[0].ageBand,'18-29');for(const actor of [{kind:'spectator'},{kind:'player',id:s.players[0].id}])assert.equal(g.makeView(s,actor,1,now).players[0].ageBand,undefined);
 let teams=g.mutate(s,{type:'settings',settings:{mode:'teams'}},host,now);assert.equal(teams.players[0].ageBand,undefined);assert.throws(()=>age(teams,0,'18-29'),/individual Green Room/);
 s=g.mutate(s,{type:'start-draft'},host,now);assert.equal(g.makeView(s,host,1,now).players[0].ageBand,undefined);assert.throws(()=>g.mutate(s,action,host,now),/individual Green Room/);
});
test('question journal retains overall stats for every player, but only adult aggregate age counts; corrections replace result; skipped and teams excluded',()=>{
 let s=age(age(age(lobby(),0,'18-29'),1,'10-12'),2,'50-plus');s.phase='question';const q=b.CATEGORIES[0].questionsByLevel['1'][0];
 const after=structuredClone(s);after.phase='results';after.resolution={questionId:q.id,key:q.categoryId+':0',finishedAt:now,revealedAt:now-2000,eligibleSeats:3,answers:{[s.players[0].id]:{answer:'secret text',correct:false,answerFormat:'written',responseMs:1000},[s.players[1].id]:{answer:q.answer,correct:true,answerFormat:'choices',responseMs:900}}};
 const result=e.exposureJournal(s,after,now).exposures[0].stats;assert.equal(result.attempted,2);assert.equal(result.correct,1);assert.equal(result.ageSummary['18-29'].attempts,1);assert.equal(result.ageSummary['50-plus'].noAnswer,1);assert.equal(result.ageSummary['10-12'],undefined);assert.ok(!JSON.stringify(result.ageSummary).includes(s.players[0].id));assert.ok(!JSON.stringify(result.ageSummary).includes('secret text'));
 let corrected=structuredClone(after);corrected.resolution.answers[s.players[0].id].correct=true;corrected.resolution.answers[s.players[0].id].overturned=true;assert.equal(e.exposureJournal(after,corrected).exposures[0].stats.ageSummary['18-29'].correct,1);
 after.settings.mode='teams';assert.deepEqual(e.exposureJournal(s,after).exposures[0].stats.ageSummary,{});after.settings.mode='individual';after.resolution.skipped=true;assert.deepEqual(e.exposureJournal(s,after).exposures[0].stats.ageSummary,{});
});
test('Final Word age aggregates use written responses only and rematches preserve adult band and manual support',()=>{
 let s=age(age(lobby(),0,'30-49'),1,'16-17');s=g.mutate(s,{type:'player-bonuses',playerId:s.players[0].id,choiceAccess:'all'},host,now);s.phase='final-question';const q=b.CATEGORY_FINALS[0];s.final={id:q.id,startedAt:now-1000,wagers:{},answers:{},disputeIds:[]};const after=structuredClone(s);after.phase='final-results';after.final.answers={[s.players[0].id]:{answer:q.answer,correct:true,answerFormat:'written'}};assert.equal(e.exposureJournal(s,after).exposures[0].stats.ageSummary['30-49'].writtenCorrect,1);assert.equal(e.exposureJournal(s,after).exposures[0].stats.ageSummary['16-17'],undefined);after.phase='finished';const rematch=g.mutate(after,{type:'new-game'},host,now);assert.equal(rematch.players[0].ageBand,'30-49');assert.equal(rematch.players[0].choiceAccess,'all');assert.equal(rematch.players[1].choiceAccess,'hard');
});
