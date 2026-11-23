const {test}=require('node:test');
const assert=require('node:assert/strict');
const g=require('../.engine-build/game.js');
const bank=require('../.engine-build/questions.js');
const host={kind:'host'};
const keys=s=>s.selected[s.round].flatMap(id=>[0,1,2].map(l=>`${id}:${l}`));
function setup(count=4,mode='individual',prior=[]){let s=g.makeGame(prior);s=g.mutate(s,{type:'settings',settings:{mode}},host,1000);const a=[];
  for(let i=0;i<count;i++){const out=g.joinGame(s,'Player '+(i+1),undefined,2000+i);s=out.state;a.push({kind:'player',id:out.player.id});}return {s,a};}
function draft(s,a,now=10000){s=g.mutate(s,{type:'start-draft'},host,now);assert.equal(s.phase,'draft');assert.ok(s.draftPool.length>=4);
  for(let i=0;i<4;i++)s=g.mutate(s,{type:'draft-category',categoryId:s.draftPool[i]},a[(i+s.round*4)%a.length],now+i+1);
  assert.equal(s.phase,'board');assert.equal(s.selected[s.round].length,4);return s;}
function open(s,a,key,now=20000){s=g.mutate(s,{type:'open-question',key},a,now);assert.equal(s.phase,'intro');assert.equal(g.makeView(s,host,1,now).active,undefined);
 s=g.tick(s,now+2600);assert.equal(s.phase,'question');return s;}
function finishRound(s,a,start=20000){for(let i=0;i<12;i++){const key=keys(s).find(k=>!s.usedKeys.includes(k));assert.ok(key,`Question ${i} exists`);s=open(s,a[s.chooserIndex%a.length],key,start+i*18000);
   for(let x=0;x<a.length;x++)s=g.mutate(s,{type:'submit-answer',answer:'not the correct response'},a[x],start+i*18000+2800+x*50);
   assert.equal(s.phase,'results');s=g.tick(s,s.resolution.endsAt+10);
 }return s;}

test('the Standard bank has exactly 45 categories and 540 balanced questions',()=>{
 assert.equal(bank.CATEGORIES.length,45);assert.equal(bank.QUESTION_LOOKUP.size,540);
 for(const c of bank.CATEGORIES){assert.ok(c.description.length>5);assert.deepEqual(Object.keys(c.questionsByLevel).sort(),['1','2','3']);
  for(const qs of Object.values(c.questionsByLevel)){assert.equal(qs.length,4);for(const q of qs){assert.ok(q.prompt&&q.answer&&q.hint);assert.ok(q.id);assert.ok(q.aliases instanceof Array);}}
 }
});
test('default settings use single Standard Trivia, Jazz, and 4x3 point values',()=>{
 const s=g.makeGame();assert.equal(s.schemaVersion,3);assert.equal(s.settings.music,'jazz');assert.ok(!('questionSet' in s.settings));
 assert.equal(s.players.length,0);assert.deepEqual(g.ROUND_VALUES,[[100,300,500],[200,600,1000]]);
});
test('new draft offers limited categories, four selections and three rows',()=>{
 let {s,a}=setup(4);s=draft(s,a);assert.equal(s.draftPool.length,9);assert.equal(keys(s).length,12);assert.equal(Object.keys(s.questionMap).length,12);
 assert.equal(new Set(Object.values(s.questionMap)).size,12);
});
test('one Double Take per player per round, correct and incorrect scoring',()=>{
 let {s,a}=setup(2);s=draft(s,a);s=open(s,a[0],keys(s)[0]);const q=bank.getQuestion(s.active.questionId);
 assert.equal(s.players[0].doubleTakesRemaining,1);
 s=g.mutate(s,{type:'submit-answer',answer:q.answer,doubleTake:true},a[0],23000);
 assert.equal(s.players[0].doubleTakesRemaining,0);
 s=g.mutate(s,{type:'submit-answer',answer:'nonsense'},a[1],23100);
 assert.equal(s.phase,'results');assert.ok(s.players[0].score>=200);assert.equal(s.players[1].score,0);
});
test('question content hidden during introduction and never reveals key to host in play',()=>{
 let {s,a}=setup(2);s=draft(s,a);const key=keys(s)[0];s=g.mutate(s,{type:'open-question',key},a[0],20000);
 let v=g.makeView(s,host,1,20500);assert.equal(v.active,undefined);assert.ok(v.intro.category);assert.equal(v.intro.points,100);
 s=g.tick(s,23000);v=g.makeView(s,host,2,23000);assert.ok(v.active.prompt);assert.equal(v.active.hostAnswer,undefined);
});
test('private choices appear only for eligible question levels, not host or other players',()=>{
 let {s,a}=setup(2);
 s=g.mutate(s,{type:'player-bonuses',playerId:a[0].id,choiceAccess:'medium-hard'},host,3000);
 s=draft(s,a);const cat=s.selected[0][0];
 s=open(s,a[0],cat+':0');
 assert.equal(g.makeView(s,a[0],1,23000).active.myChoices,undefined);
 assert.equal(g.makeView(s,host,1,23000).active.myChoices,undefined);
 // A later medium question should offer a stable, private four-choice list.
 s.phase='board';s.active=undefined;s.chooserIndex=0;
 s=open(s,a[0],cat+':1',40000);
 const first=g.makeView(s,a[0],1,43000).active.myChoices;
 assert.equal(first.length,4);
 assert.deepEqual(first,g.makeView(s,a[0],4,44000).active.myChoices);
 assert.equal(g.makeView(s,a[1],1,43000).active.myChoices,undefined);
 assert.equal(g.makeView(s,host,1,43000).active.myChoices,undefined);
});
test('choice setting can be assigned and changed only before game or when paused',()=>{
 let {s,a}=setup(2);
 s=g.mutate(s,{type:'player-bonuses',playerId:a[0].id,choiceAccess:'hard'},host,3000);
 assert.equal(s.players[0].choiceAccess,'hard');
 s=draft(s,a);s=open(s,a[0],keys(s)[0]);
 assert.throws(()=>g.mutate(s,{type:'player-bonuses',playerId:a[0].id,choiceAccess:'all'},host,23100),/Pause/);
 s=g.mutate(s,{type:'pause'},host,23100);
 s=g.mutate(s,{type:'player-bonuses',playerId:a[0].id,choiceAccess:'all'},host,23110);
 assert.equal(s.players[0].choiceAccess,'all');
 assert.equal(g.makeView(s,a[0],1,23150).active.myChoices.length,4);
 assert.throws(()=>g.mutate(s,{type:'player-bonuses',playerId:a[0].id,choiceAccess:'other'},host,23150),/Invalid/);
});
test('four-choice players earn full base points with a reduced speed bonus',()=>{
 let {s,a}=setup(2);
 s=g.mutate(s,{type:'player-bonuses',playerId:a[0].id,choiceAccess:'all'},host,3000);
 s=draft(s,a);s=open(s,a[0],keys(s)[0]);
 const q=bank.getQuestion(s.active.questionId);
 const v=g.makeView(s,a[0],1,22900);
 assert.ok(v.active.myChoices.includes(q.answer));
 assert.throws(()=>g.mutate(s,{type:'submit-answer',answer:'a made up option'},a[0],23000),/displayed/);
 s=g.mutate(s,{type:'submit-answer',answer:q.answer},a[0],23000);
 s=g.mutate(s,{type:'submit-answer',answer:q.answer},a[1],23000);
 assert.equal(s.phase,'results');
 const mc=s.resolution.answers[a[0].id],written=s.resolution.answers[a[1].id];
 assert.equal(mc.answerFormat,'choices');assert.equal(written.answerFormat,'written');
 assert.ok(mc.points>=100&&mc.points<=110);
 assert.ok(written.points>=100&&written.points<=125);
 assert.ok(mc.points<=written.points);
});
test('each category question has four distinct options that do not match aliases',()=>{
 for(const q of bank.QUESTION_LOOKUP.values()){
  assert.equal(q.distractors?.length,3,q.id);
  const opts=[q.answer,...q.distractors];assert.equal(new Set(opts.map(x=>x.toLowerCase().trim())).size,4,q.id);
  for(const d of q.distractors)assert.equal(g.isCorrectForQuestion(d,q),false,`${q.id}: ${d}`);
 }
});
test('Hard-only accommodations affect regular hard questions, but Final Word always requires writing',()=>{
 let {s,a}=setup(2);
 s=g.mutate(s,{type:'player-bonuses',playerId:a[0].id,choiceAccess:'hard'},host,3000);
 s=draft(s,a);const cat=s.selected[0][0];
 for(let lev of [0,1,2]){
  s.phase='board';s.active=undefined;s.chooserIndex=0;
  s=open(s,a[0],cat+':'+lev,20000+lev*10000);
  const v=g.makeView(s,a[0],1,23000+lev*10000);
  assert.equal(Boolean(v.active.myChoices),lev===2);
 }
 s.phase='final-wager';s.active=undefined;s.final={id:'f7',wagers:{},answers:{},disputeIds:[]};
 s=g.mutate(s,{type:'wager',amount:0},a[0],60000);
 s=g.mutate(s,{type:'wager',amount:0},a[1],60010);
 assert.equal(s.phase,'final-question');
 const f=g.makeView(s,a[0],1,60100).final;
 assert.equal(f.myChoices,undefined);
 assert.equal(g.makeView(s,a[1],1,60100).final.myChoices,undefined);
 assert.equal(g.makeView(s,host,1,60100).final.myChoices,undefined);
 // Free text cannot be rejected for failing to match a multiple-choice option.
 s=g.mutate(s,{type:'final-answer',answer:'my own written guess'},a[0],60200);
 assert.equal(s.final.answers[a[0].id].answerFormat,'written');
 assert.equal(s.final.answers[a[0].id].correct,false);
 const good=bank.FINALS.find(q=>q.id==='f7').answer;
 s=g.mutate(s,{type:'final-answer',answer:good},a[1],60300);
 assert.equal(s.final.answers[a[1].id].answerFormat,'written');
 assert.equal(s.final.answers[a[1].id].correct,true);
});
test('all written Final Word submissions work even when every player has always-on choices',()=>{
 let {s,a}=setup(3);
 for(const p of a)s=g.mutate(s,{type:'player-bonuses',playerId:p.id,choiceAccess:'all'},host,3000);
 s.phase='final-wager';s.final={id:'f1',wagers:{},answers:{},disputeIds:[]};
 for(const p of a)s=g.mutate(s,{type:'wager',amount:0},p,5000);
 for(const p of a)assert.equal(g.makeView(s,p,1,5100).final.myChoices,undefined);
 for(const [i,p] of a.entries())s=g.mutate(s,{type:'final-answer',answer:i?'Africa':'a written guess'},p,5500+i);
 assert.equal(s.phase,'final-results');
 for(const r of Object.values(s.final.answers))assert.equal(r.answerFormat,'written');
});
test('final scoreboard gives equal rank and recognition to tied winners',()=>{
 const {finalStandings}=require('../.engine-build/standings.js');
 const players=[{id:'a',name:'A',score:400},{id:'b',name:'B',score:500},{id:'c',name:'C',score:200},{id:'d',name:'D',score:500}];
 const result=finalStandings(players);
 assert.equal(result.tied,true);
 assert.deepEqual(result.winners.map(p=>p.name),['B','D']);
 assert.deepEqual(result.standings.map(s=>s.place),[1,1,3,4]);
 assert.equal(result.standings.filter(s=>s.isWinner).length,2);
});
test('similar-looking opposite and distinct scientific terms are not accepted as typos',()=>{
 assert.equal(g.isCorrect('endotherm','ectotherm'),false);
 assert.equal(g.isCorrect('ethnology','ethology'),false);
 assert.equal(g.isCorrect('reflection','refraction'),false);
});
test('reasonable aliases and typo tolerance but not wrong numbers',()=>{
 assert.ok(g.isCorrect('cold-blooded','Ectotherm',['Cold blooded','Cold-blooded']));
 assert.ok(g.isCorrect('19th','19th Amendment',['19th','19']));assert.ok(g.isCorrect('nineteenth','19th Amendment',['nineteenth']));
 assert.ok(g.isCorrect('cilumbus','Columbus'));
 assert.ok(!g.isCorrect('16th Amendment','19th Amendment'));
 assert.ok(!g.isCorrect('18th Amendment','19th Amendment'));
 assert.ok(!g.isCorrect('18','19'));
 assert.ok(!g.isCorrect('Venice','Venus'));
});
test('single steal by next team and half points for correct answer',()=>{
 let {s,a}=setup(3,'teams');s=draft(s,a);s=open(s,a[0],keys(s)[0]);
 s=g.mutate(s,{type:'submit-answer',answer:'wrong'},a[0],23100);assert.equal(s.active.stealId,a[1].id);
 s=g.mutate(s,{type:'submit-answer',answer:bank.getQuestion(s.active.questionId).answer},a[1],23200);
 assert.equal(s.phase,'results');assert.equal(s.players[1].score,50);
});
test('dispute blocks auto-advance and host ruling corrects score',()=>{
 let {s,a}=setup(2);s=draft(s,a);s=open(s,a[0],keys(s)[0]);
 s=g.mutate(s,{type:'submit-answer',answer:'wrong'},a[0],23100);s=g.mutate(s,{type:'submit-answer',answer:'wrong'},a[1],23200);
 s=g.mutate(s,{type:'dispute'},a[0],23400);assert.equal(s.resolution.disputeIds.length,1);
 s=g.tick(s,90000);assert.equal(s.phase,'results');assert.deepEqual(g.makeView(s,a[1],1,90000).results.disputeIds,[a[0].id]);
 s=g.mutate(s,{type:'resolve-dispute',playerId:a[0].id,correct:true},host,90010);
 assert.equal(s.players[0].score,100);s=g.tick(s,100000);assert.equal(s.phase,'board');
});
test('pause and accommodation updates preserve spent hints',()=>{
 let {s,a}=setup(2);s=draft(s,a);s=open(s,a[0],keys(s)[0]);
 s=g.mutate(s,{type:'hint',kind:'written'},a[0],23100);assert.equal(s.players[0].hintsRemaining,2);
 assert.throws(()=>g.mutate(s,{type:'player-bonuses',playerId:a[0].id,bonusHints:2},host,23200),/Pause/);
 s=g.mutate(s,{type:'pause'},host,23300);s=g.mutate(s,{type:'player-bonuses',playerId:a[0].id,bonusHints:2},host,23500);
 assert.equal(s.players[0].hintsRemaining,4);
});
test('full 24-question game advances automatically to Final Word and auto-reveals when all wagers are in',()=>{
 let {s,a}=setup(2);s=draft(s,a);
 s=finishRound(s,a,20000);assert.equal(s.phase,'draft');assert.equal(s.round,1);
 s=draftFromSecond(s,a);s=finishRound(s,a,300000);
 assert.equal(s.phase,'final-wager');assert.equal(s.selected[0].length,4);assert.equal(s.selected[1].length,4);
 assert.equal(new Set([...s.selected[0],...s.selected[1]]).size,8);
 s=g.mutate(s,{type:'wager',amount:0},a[0],600000);assert.equal(s.phase,'final-wager');
 s=g.mutate(s,{type:'wager',amount:0},a[1],600100);assert.equal(s.phase,'final-question');
 assert.equal(s.final.deadlineAt,600100+s.settings.finalSeconds*1000);
 s=g.mutate(s,{type:'final-answer',answer:'wrong'},a[0],600200);
 s=g.mutate(s,{type:'final-answer',answer:'wrong'},a[1],600300);assert.equal(s.phase,'final-results');
 s=g.tick(s,s.final.endsAt+1);assert.equal(s.phase,'finished');
 function draftFromSecond(state,actors){for(let i=0;i<4;i++)state=g.mutate(state,{type:'draft-category',categoryId:state.draftPool[i]},actors[(i+4)%actors.length],280000+i);return state;}
});
test('replay tracker prefers unseen questions, within and between game rooms',()=>{
 let {s,a}=setup(2);s=draft(s,a);const chosen=Object.values(s.questionMap)[0];const id=s.selected[0][0];
 const saved=[chosen];let other=setup(2,'individual',saved); // draft pool is random, force direct category selection in a controlled room
 other.s=g.mutate(other.s,{type:'start-draft'},host,10000);other.s.draftPool[0]=id;
 other.s=g.mutate(other.s,{type:'draft-category',categoryId:id},other.a[0],10001);
 for(let i=1;i<4;i++)other.s=g.mutate(other.s,{type:'draft-category',categoryId:other.s.draftPool[i]},other.a[i%2],10001+i);
 assert.equal(other.s.phase,'board');assert.notEqual(other.s.questionMap[`${id}:0`],chosen);
});
test('creating a new game in the same room carries the already-played history',()=>{
 let {s,a}=setup(2);s.phase='finished';s.recentQuestionIds=['example-history-id'];const next=g.mutate(s,{type:'new-game'},host,3000);
 assert.deepEqual(next.recentQuestionIds,['example-history-id']);assert.equal(next.players[0].doubleTakesRemaining,1);
});
test('host can be a player on the same device without player/host credential mixing',()=>{
 const device=require('../.engine-build/device-session.js');assert.equal(device.actorToken('host',{hostToken:'host-key',playerToken:'player-key'}),'host-key');
 assert.equal(device.actorToken('player',{hostToken:'host-key',playerToken:'player-key'}),'player-key');
});
