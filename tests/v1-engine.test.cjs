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

test('the Standard bank has 45 year-round categories plus 11 seasonal categories, 672 balanced questions',()=>{
 assert.equal(bank.CATEGORIES.length,56);assert.equal(bank.QUESTION_LOOKUP.size,672);
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
 for(let i=1;i<4;i++){const next=other.s.draftPool.find(categoryId=>!other.s.selected[0].includes(categoryId));other.s=g.mutate(other.s,{type:'draft-category',categoryId:next},other.a[i%2],10001+i);}
 assert.equal(other.s.phase,'board');assert.notEqual(other.s.questionMap[`${id}:0`],chosen);
});
test('creating a new game in the same room carries the already-played history',()=>{
 let {s,a}=setup(2);s.phase='finished';s.recentQuestionIds=[bank.CATEGORIES[0].questionsByLevel['1'][0].id];const next=g.mutate(s,{type:'new-game'},host,3000);
 assert.deepEqual(next.recentQuestionIds,[bank.CATEGORIES[0].questionsByLevel['1'][0].id]);assert.equal(next.players[0].doubleTakesRemaining,1);
});
test('host can be a player on the same device without player/host credential mixing',()=>{
 const device=require('../.engine-build/device-session.js');assert.equal(device.actorToken('host',{hostToken:'host-key',playerToken:'player-key'}),'host-key');
 assert.equal(device.actorToken('player',{hostToken:'host-key',playerToken:'player-key'}),'player-key');
});

test('guided host answer-format choice applies to people who join afterward',()=>{
 let s=g.makeGame();
 s=g.mutate(s,{type:'settings',settings:{answerStyle:'choices'}},host,1000);
 let one=g.joinGame(s,'Choice Player',undefined,2000);s=one.state;
 assert.equal(s.players[0].choiceAccess,'all');
 s=g.mutate(s,{type:'settings',settings:{answerStyle:'mixed'}},host,2100);
 assert.equal(s.players[0].choiceAccess,'off');
 let two=g.joinGame(s,'Write Player',undefined,2200);s=two.state;
 assert.equal(s.players[1].choiceAccess,'off');
 s=g.mutate(s,{type:'player-bonuses',playerId:two.player.id,choiceAccess:'hard'},host,2300);
 assert.equal(s.players[1].choiceAccess,'hard');
 assert.equal(s.settings.answerStyle,'mixed');
});

test('typed question drafts are private and automatically scored at zero without a speed bonus',()=>{
 let {s,a}=setup(2);s=draft(s,a);s=open(s,a[0],keys(s)[0]);
 const q=bank.getQuestion(s.active.questionId),end=s.active.deadlineAt;
 s=g.mutate(s,{type:'save-draft',scope:'question',answer:q.answer,doubleTake:false},a[0],end-2000);
 assert.equal(g.makeView(s,a[0],1,end-1000).active.myDraft,q.answer);
 assert.equal(g.makeView(s,a[1],1,end-1000).active.myDraft,undefined);
 assert.equal(g.makeView(s,host,1,end-1000).active.myDraft,undefined);
 s=g.tick(s,end);
 assert.equal(s.phase,'results');assert.equal(s.resolution.answers[a[0].id].points,100);
 assert.equal(s.resolution.answers[a[0].id].answerFormat,'written');
 assert.equal(s.resolution.answers[a[1].id],undefined);
});

test('draft can be edited or erased, and only final saved non-empty answer is submitted',()=>{
 let {s,a}=setup(2);s=draft(s,a);s=open(s,a[0],keys(s)[0]);
 const end=s.active.deadlineAt;
 s=g.mutate(s,{type:'save-draft',scope:'question',answer:'wrong first'},a[0],end-5000);
 s=g.mutate(s,{type:'save-draft',scope:'question',answer:'corrected later'},a[0],end-2000);
 s=g.mutate(s,{type:'save-draft',scope:'question',answer:'unwanted'},a[1],end-1900);
 s=g.mutate(s,{type:'save-draft',scope:'question',answer:''},a[1],end-1800);
 s=g.tick(s,end);
 assert.equal(s.phase,'results');assert.equal(s.resolution.answers[a[0].id].answer,'corrected later');
 assert.equal(s.resolution.answers[a[1].id],undefined);
});

test('per-player extra time is respected when auto-submitting drafts',()=>{
 let {s,a}=setup(2);s=g.mutate(s,{type:'player-bonuses',playerId:a[1].id,bonusTimeSeconds:10},host,3000);
 s=draft(s,a);s=open(s,a[0],keys(s)[0]);
 const end=s.active.deadlineAt;
 s=g.mutate(s,{type:'save-draft',scope:'question',answer:'Player one'},a[0],end-1000);
 s=g.mutate(s,{type:'save-draft',scope:'question',answer:'Player two'},a[1],end-1000);
 s=g.tick(s,end);assert.equal(s.phase,'question');
 assert.equal(s.active.answers[a[0].id].answer,'Player one');
 assert.equal(s.active.answers[a[1].id],undefined);
 s=g.tick(s,end+10000);assert.equal(s.phase,'results');
 assert.equal(s.resolution.answers[a[1].id].answer,'Player two');
});

test('team answer draft auto-submits on turn expiry instead of unintentionally passing',()=>{
 let {s,a}=setup(2,'teams');s=draft(s,a);s=open(s,a[0],keys(s)[0]);
 const q=bank.getQuestion(s.active.questionId),end=s.active.deadlineAt;
 s=g.mutate(s,{type:'save-draft',scope:'question',answer:q.answer},a[0],end-1000);
 s=g.tick(s,end);assert.equal(s.phase,'results');
 assert.equal(s.resolution.answers[a[0].id].answer,q.answer);
});

test('Final Word saved draft is automatically scored at zero without requiring Lock answer',()=>{
 let {s,a}=setup(2);s.phase='final-wager';s.final={id:'f7',wagers:{},answers:{},disputeIds:[]};
 s=g.mutate(s,{type:'wager',amount:0},a[0],5000);
 s=g.mutate(s,{type:'wager',amount:0},a[1],5010);
 const end=s.final.deadlineAt,answer=bank.FINALS.find(q=>q.id==='f7').answer;
 s=g.mutate(s,{type:'save-draft',scope:'final',answer},a[0],end-1000);
 s=g.mutate(s,{type:'save-draft',scope:'final',answer:'wrong'},a[1],end-900);
 assert.equal(g.makeView(s,a[1],1,end-100).final.myDraft,'wrong');
 assert.equal(g.makeView(s,host,1,end-100).final.myDraft,undefined);
 s=g.tick(s,end);assert.equal(s.phase,'final-results');
 assert.equal(s.final.answers[a[0].id].correct,true);
 assert.equal(s.final.answers[a[1].id].correct,false);
 assert.equal(s.final.answers[a[0].id].answerFormat,'written');
});

test('every Final Word question has three distinct, private, ordered hints',()=>{
 assert.equal(bank.FINALS.length,18);
 for(const q of bank.FINALS){
   assert.equal(q.hints.length,3,q.id);
   assert.equal(new Set(q.hints.map(h=>h.trim().toLowerCase())).size,3,q.id);
   for(const h of q.hints)assert.ok(h.length>=12,`${q.id} has a very short clue`);
 }
});
test('Final Word hints cost 500 points, purchase before wagering, and deduct immediately',()=>{
 let {s,a}=setup(2);s.players[0].score=1100;s.players[0].hintsRemaining=1;
 s.phase='final-wager';s.final={id:'f15',wagers:{},answers:{},disputeIds:[]};
 let v=g.makeView(s,a[0],1,10000);
 assert.equal(v.final.myPurchasableHints,3,'A remaining regular hint cannot restrict Final Word purchases');
 assert.equal(v.final.myAvailableHints,0,'No free Final Word hints even with regular hints');
 s=g.mutate(s,{type:'buy-final-hint'},a[0],10001);
 assert.equal(s.players[0].score,600);assert.equal(s.final.purchasedHints[a[0].id],1);
 s=g.mutate(s,{type:'buy-final-hint'},a[0],10002);
 assert.equal(s.players[0].score,100);assert.equal(g.makeView(s,a[0],1,10002).final.myPurchasableHints,1);
 assert.throws(()=>g.mutate(s,{type:'buy-final-hint'},a[0],10003),/at least 500/);
 assert.throws(()=>g.mutate(s,{type:'wager',amount:101},a[0],10004),/Wager must/);
 s=g.mutate(s,{type:'wager',amount:100},a[0],10005);
 assert.throws(()=>g.mutate(s,{type:'buy-final-hint'},a[0],10006),/before locking/);
 s=g.mutate(s,{type:'wager',amount:0},a[1],10007);
 assert.equal(s.phase,'final-question');
 assert.throws(()=>g.mutate(s,{type:'buy-final-hint'},a[0],10008),/purchases are closed/);
 assert.equal(s.players[0].hintsRemaining,1,'Regular hint balance must remain untouched');
});
test('a Final Word hint cannot be purchased when the player lacks 500 points',()=>{
 let {s,a}=setup(2);s.players[0].score=499;s.players[0].hintsRemaining=4;
 s.phase='final-wager';s.final={id:'f15',wagers:{},answers:{},disputeIds:[]};
 assert.throws(()=>g.mutate(s,{type:'buy-final-hint'},a[0],4000),/at least 500/);
 assert.equal(s.players[0].score,499);
 assert.equal(g.makeView(s,a[0],1,4001).final.myAvailableHints,0);
 assert.equal(g.makeView(s,a[0],1,4001).final.myPurchasableHints,3);
});
test('only purchased Final Word hints can be revealed; regular hints are never consumed',()=>{
 let {s,a}=setup(2);s.players[0].score=2000;s.players[0].hintsRemaining=1;s.players[1].hintsRemaining=3;
 s.phase='final-wager';s.final={id:'f15',wagers:{},answers:{},disputeIds:[]};
 for(let i=0;i<3;i++)s=g.mutate(s,{type:'buy-final-hint'},a[0],3000+i);
 assert.equal(s.players[0].score,500);
 s=g.mutate(s,{type:'wager',amount:500},a[0],4000);
 s=g.mutate(s,{type:'wager',amount:0},a[1],4001);
 let v=g.makeView(s,a[0],1,4050);assert.equal(v.final.myRevealedHints.length,0);
 assert.equal(v.final.myAvailableHints,3);
 assert.equal(g.makeView(s,a[1],1,4050).final.myAvailableHints,0);
 assert.throws(()=>g.mutate(s,{type:'final-hint'},a[1],4075),/No purchased Final Word hints remaining/);
 for(let i=0;i<3;i++){
   s=g.mutate(s,{type:'final-hint'},a[0],4100+i);
   v=g.makeView(s,a[0],1,4200+i);
   assert.deepEqual(v.final.myRevealedHints,bank.FINALS.find(q=>q.id==='f15').hints.slice(0,i+1));
   assert.equal(v.final.myAvailableHints,2-i);
   assert.deepEqual(g.makeView(s,a[1],1,4250+i).final.myRevealedHints,[]);
   assert.deepEqual(g.makeView(s,host,1,4250+i).final.myRevealedHints,[]);
 }
 assert.equal(s.players[0].hintsRemaining,1);
 assert.equal(s.players[1].hintsRemaining,3);
 assert.equal(s.final.purchasedHintsUsed[a[0].id],3);
 assert.throws(()=>g.mutate(s,{type:'final-hint'},a[0],4300),/three hints/);
 s=g.mutate(s,{type:'final-answer',answer:'Gabriel García Márquez'},a[0],4500);
 assert.equal(s.final.answers[a[0].id].hintUsed,true);
 assert.throws(()=>g.mutate(s,{type:'final-hint'},a[0],4600),/already locked/);
});
test('regular hints are independent from Final Word purchases and all three can be bought',()=>{
 let {s,a}=setup(2);s.phase='final-wager';s.final={id:'f12',wagers:{},answers:{},disputeIds:[]};
 s.players[0].score=2000;s.players[0].hintsRemaining=5;
 assert.equal(g.makeView(s,a[0],1,5000).final.myPurchasableHints,3);
 assert.equal(g.makeView(s,a[0],1,5000).final.myAvailableHints,0);
 for(let i=0;i<3;i++)s=g.mutate(s,{type:'buy-final-hint'},a[0],5001+i);
 assert.equal(s.players[0].score,500);assert.equal(s.players[0].hintsRemaining,5);
 assert.equal(g.makeView(s,a[0],1,5004).final.myPurchasableHints,0);
 assert.throws(()=>g.mutate(s,{type:'buy-final-hint'},a[0],5005),/three Final Word hints/);
 s.players[1].score=1600;s.players[1].hintsRemaining=0;
 for(let i=0;i<3;i++)s=g.mutate(s,{type:'buy-final-hint'},a[1],5101+i);
 assert.equal(s.players[1].score,100);
 assert.throws(()=>g.mutate(s,{type:'buy-final-hint'},a[1],5105),/three Final Word hints/);
});
test('Final Word hints respect the deadline, and draft auto-submission remembers purchased hint use',()=>{
 let {s,a}=setup(2);s.players[0].score=800;s.players[0].hintsRemaining=2;
 s.phase='final-wager';s.final={id:'f7',wagers:{},answers:{},disputeIds:[]};
 s=g.mutate(s,{type:'buy-final-hint'},a[0],7500);
 s=g.mutate(s,{type:'wager',amount:0},a[0],8000);s=g.mutate(s,{type:'wager',amount:0},a[1],8001);
 s=g.mutate(s,{type:'final-hint'},a[0],8100);
 const due=s.final.deadlineAt;
 s=g.mutate(s,{type:'save-draft',scope:'final',answer:'antonym'},a[0],due-100);
 assert.throws(()=>g.mutate(s,{type:'final-hint'},a[0],due+1),/not available|expired/);
 s=g.tick(s,due);
 assert.equal(s.phase,'final-results');assert.equal(s.final.answers[a[0].id].correct,true);
 assert.equal(s.final.answers[a[0].id].hintUsed,true);
 assert.equal(s.players[0].hintsRemaining,2);
});


test('seasonal availability follows the Eastern date, keeping all 45 year-round categories eligible',()=>{
 const cases=[
  ['2026-11-23T15:00:00Z',['thanksgiving','christmas-movies','christmas-music','veterans-military','native-american','harvest-time','college-football'],['winter-olympics','winter-traditions','winter-holidays','new-years']],
  ['2026-12-20T15:00:00Z',['christmas-movies','christmas-music','winter-olympics','winter-traditions','winter-holidays','new-years'],['thanksgiving','veterans-military','native-american','harvest-time','college-football']],
  ['2027-01-15T15:00:00Z',['winter-olympics','winter-traditions','winter-holidays','new-years'],['thanksgiving','christmas-movies','christmas-music','veterans-military','native-american']],
  ['2027-02-15T15:00:00Z',['winter-olympics','winter-traditions','winter-holidays'],['thanksgiving','christmas-movies','christmas-music','new-years','harvest-time']],
  ['2027-03-15T15:00:00Z',[],['thanksgiving','christmas-movies','christmas-music','winter-olympics','winter-traditions','winter-holidays','new-years','veterans-military','native-american','harvest-time','college-football']],
  ['2027-09-15T15:00:00Z',['harvest-time','college-football'],['christmas-movies','native-american','veterans-military']],
  ['2027-10-15T15:00:00Z',['harvest-time','college-football'],['thanksgiving','native-american','veterans-military']]
 ];
 const seasonalIds=new Set(bank.CATEGORIES.filter(c=>c.activeMonths).map(c=>c.id));
 for(const [date,active,off] of cases){const ids=new Set(bank.availableCategories(new Date(date)).map(c=>c.id));
  for(const id of active)assert.ok(ids.has(id),`${id} should appear on ${date}`);
  for(const id of off)assert.equal(ids.has(id),false,`${id} should not appear on ${date}`);
  assert.equal([...ids].filter(id=>!seasonalIds.has(id)).length,45);
 }
 // Eastern date rather than UTC date determines the season boundary.
 assert.ok(bank.availableCategories(new Date('2026-12-01T03:00:00Z')).some(c=>c.id==='thanksgiving'));
 assert.ok(!bank.availableCategories(new Date('2026-12-01T06:00:00Z')).some(c=>c.id==='thanksgiving'));
});

test('draft pools never include seasonal categories outside their permitted months',()=>{
 for(const date of ['2026-11-23','2026-12-23','2027-01-23','2027-02-23','2027-03-23']){
  const {s,a}=setup(2);const now=Date.parse(date+'T16:00:00Z');
  const started=g.mutate(s,{type:'start-draft'},host,now);
  const allowed=new Set(bank.availableCategories(new Date(now)).map(c=>c.id));
  for(const id of started.draftPool)assert.ok(allowed.has(id),`${id} not permitted on ${date}`);
 }
});

test('seasonal distractors are unique, not accepted as answers, and season hints are present',()=>{
 const seasonal=bank.CATEGORIES.filter(c=>c.activeMonths);
 assert.equal(seasonal.length,11);
 for(const category of seasonal){assert.equal(Object.values(category.questionsByLevel).flat().length,12);
  for(const q of Object.values(category.questionsByLevel).flat()){
   const opts=[q.answer,...q.distractors];assert.equal(new Set(opts.map(o=>o.toLowerCase())).size,4,q.id);
   assert.equal(q.distractors.length,3,q.id);
   assert.ok(q.hint.length>12,q.id);
   assert.equal(q.hint.toLowerCase().includes(q.answer.toLowerCase()),false,`${q.id} hint gives away answer`);
   for(const d of q.distractors){assert.equal(q.aliases.some(a=>a.toLowerCase()===d.toLowerCase()),false,`${q.id} matches alias`);assert.equal(g.isCorrectForQuestion(d,q),false,`${q.id}: ${d}`);}
  }
 }
});

test('each Build the Board draft offers one eligible seasonal and nonseasonal choices',()=>{
 for(const date of ['2026-09-23','2026-11-23','2026-12-23','2027-01-23','2027-02-23']){
  let {s,a}=setup(4);const now=Date.parse(date+'T16:00:00Z');
  s=g.mutate(s,{type:'start-draft'},host,now);
  assert.equal(s.draftPool.filter(id=>bank.CATEGORY_LOOKUP.get(id).activeMonths).length,1,`one seasonal: ${date}`);
  assert.equal(s.draftPool.length,9);
  assert.equal(s.draftPool.filter(id=>!bank.CATEGORY_LOOKUP.get(id).activeMonths).length,8,`eight classics: ${date}`);
  const season1=s.draftPool.find(id=>bank.CATEGORY_LOOKUP.get(id).activeMonths);
  // Simulate four selections (including the seasonal one), so round two excludes those picks.
  s.selected[0]=[season1,...s.draftPool.filter(id=>id!==season1).slice(0,3)];
  s.round=1;s.phase='lobby';s=g.mutate(s,{type:'start-draft'},host,now+10000);
  assert.equal(s.draftPool.filter(id=>bank.CATEGORY_LOOKUP.get(id).activeMonths).length,1,`second seasonal: ${date}`);
  assert.ok(!s.draftPool.includes(season1),`do not repeat selected season: ${date}`);
 }
});

test('seasonal offer is mandatory even when every seasonal category was recently offered or played',()=>{
 let {s,a}=setup(3);const now=Date.parse('2026-11-23T16:00:00Z');
 const seasonal=bank.availableCategories(new Date(now)).filter(c=>c.activeMonths).map(c=>c.id);
 s.recentCategoryIds=[...seasonal];s.recentCategoryOffers=[...seasonal];
 s=g.mutate(s,{type:'start-draft'},host,now);
 const offered=s.draftPool.filter(id=>bank.CATEGORY_LOOKUP.get(id).activeMonths);
 assert.equal(offered.length,1);
 assert.equal(offered[0],seasonal[0]); // Oldest offered is first back in rotation.
 assert.equal(s.draftPool.length,7);
 s.selected[0]=[offered[0],...s.draftPool.filter(id=>id!==offered[0]).slice(0,3)];s.round=1;s.phase='lobby';
 s=g.mutate(s,{type:'start-draft'},host,now+10000);
 const offered2=s.draftPool.filter(id=>bank.CATEGORY_LOOKUP.get(id).activeMonths);
 assert.equal(offered2.length,1);
 assert.notEqual(offered2[0],offered[0]);
});

test('out-of-season months do not falsely offer holiday categories',()=>{
 let {s}=setup(3);s=g.mutate(s,{type:'start-draft'},host,Date.parse('2027-03-23T15:00:00Z'));
 assert.ok(s.draftPool.every(id=>!bank.CATEGORY_LOOKUP.get(id).activeMonths));
});
