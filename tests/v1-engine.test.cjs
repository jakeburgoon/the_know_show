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

test('the Standard bank has 62 year-round categories plus 14 seasonal categories, 996 balanced questions',()=>{
 assert.equal(bank.CATEGORIES.length,76);assert.equal(bank.QUESTION_LOOKUP.size,996);
 for(const c of bank.CATEGORIES){assert.ok(c.description.length>5);assert.deepEqual(Object.keys(c.questionsByLevel).sort(),['1','2','3']);
  for(const qs of Object.values(c.questionsByLevel)){assert.equal(qs.length,c.activeMonths?6:4);for(const q of qs){assert.ok(q.prompt&&q.answer&&q.hint);assert.ok(q.id);assert.ok(q.aliases instanceof Array);}}
 }
});
test('default settings use single Standard Trivia, Jazz, and 4x3 point values',()=>{
 const s=g.makeGame();assert.equal(s.schemaVersion,3);assert.equal(s.settings.music,'jazz');assert.ok(!('questionSet' in s.settings));
 assert.equal(s.players.length,0);assert.deepEqual(g.ROUND_VALUES,[[100,300,500],[200,600,1000]]);
});
test('new draft offers limited categories, four selections and three rows',()=>{
 let {s,a}=setup(4);s=draft(s,a);assert.equal(s.draftPool.length,8);assert.equal(keys(s).length,12);assert.equal(Object.keys(s.questionMap).length,12);
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
test('choice setting changes live but takes effect on the next question',()=>{
 let {s,a}=setup(2);
 s=g.mutate(s,{type:'player-bonuses',playerId:a[0].id,choiceAccess:'hard'},host,3000);
 assert.equal(s.players[0].choiceAccess,'hard');
 s=draft(s,a);s=open(s,a[0],keys(s)[0]);
 s=g.mutate(s,{type:'player-bonuses',playerId:a[0].id,choiceAccess:'all'},host,23100);
 assert.equal(s.players[0].choiceAccess,'all');
 assert.equal(g.makeView(s,a[0],1,23150).active.myChoices,undefined);
 s=g.mutate(s,{type:'submit-answer',answer:'wrong'},a[0],23200);s=g.mutate(s,{type:'submit-answer',answer:'wrong'},a[1],23300);s=g.tick(s,s.resolution.endsAt+1);s=open(s,a[1],keys(s)[1],40000);assert.equal(g.makeView(s,a[0],1,43000).active.myChoices.length,4);
 assert.throws(()=>g.mutate(s,{type:'player-bonuses',playerId:a[0].id,choiceAccess:'other'},host,43150),/Invalid/);
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
test('pause and accommodation updates preserve purchased hints and points',()=>{
 let {s,a}=setup(2);s=draft(s,a);s=open(s,a[0],keys(s)[0]);s.players[0].score=100;
 s=g.mutate(s,{type:'hint',kind:'options',key:s.active.key},a[0],23100);assert.equal(s.players[0].score,75);
 assert.throws(()=>g.mutate(s,{type:'player-bonuses',playerId:a[0].id,bonusTimeSeconds:5},host,23200),/Pause/);
 s=g.mutate(s,{type:'pause'},host,23300);s=g.mutate(s,{type:'player-bonuses',playerId:a[0].id,bonusTimeSeconds:5},host,23500);
 assert.equal(s.players[0].score,75);assert.equal(s.active.hintPurchases[a[0].id].options,true);
 assert.throws(()=>g.mutate(s,{type:'player-bonuses',playerId:a[0].id,bonusHints:2},host,23501),/purchased/);
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
 assert.equal(s.players[0].choiceAccess,'hard');
 let two=g.joinGame(s,'Write Player',undefined,2200);s=two.state;
 assert.equal(s.players[1].choiceAccess,'hard');
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

test('every Final Word question has two distinct, private, ordered hints',()=>{
 assert.equal(bank.LEGACY_FINALS.length,18);
 assert.equal(bank.CATEGORY_FINALS.length,bank.CATEGORIES.length);
 assert.equal(bank.FINALS.length,94);
 for(const q of bank.FINALS){
   assert.equal(q.hints.length,2,q.id);
   assert.equal(new Set(q.hints.map(h=>h.trim().toLowerCase())).size,2,q.id);
   for(const h of q.hints){assert.ok(h.length>=12,`${q.id} has a very short clue`);assert.ok(!h.toLowerCase().includes(q.answer.toLowerCase()),`${q.id} names the answer in a clue`);}
 }
});
test('76 category-linked Final Word questions are unique, medium-hard or hard and never used as ordinary board questions',()=>{
 const normalPrompts=new Set([...bank.QUESTION_LOOKUP.values()].map(q=>q.prompt.toLowerCase().replace(/\W/g,'')));
 const normalAnswers=new Set([...bank.QUESTION_LOOKUP.values()].map(q=>q.answer.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g,'')));
 const categoryIds=new Set(bank.CATEGORIES.map(c=>c.id));
 const unique=new Set();
 for(const f of bank.CATEGORY_FINALS){
  assert.ok(categoryIds.has(f.categoryId),f.id);
  assert.ok(['medium-hard','hard'].includes(f.difficulty),f.id);
  assert.ok(!unique.has(f.categoryId),'Duplicate finale for '+f.categoryId);unique.add(f.categoryId);
  assert.ok(!normalPrompts.has(f.prompt.toLowerCase().replace(/\W/g,'')),'Ordinary prompt was reused for '+f.id);
  assert.ok(!normalAnswers.has(f.answer.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g,'')),'Ordinary answer was reused for '+f.id);
  assert.equal(f.hints.length,2,f.id);
  for(const hint of f.hints){assert.ok(hint.length>=35,f.id);assert.ok(!hint.toLowerCase().includes(f.answer.toLowerCase()),'Hint discloses answer: '+f.id);}
 }
 assert.equal(unique.size,76);
});
test('Final Word draw respects seasonal months and avoids recent finals and categories played on the board',()=>{
 const s=g.makeGame();
 s.selected=[['space','animals','world','words'],['history','science','music','movies']];
 const july=Date.UTC(2026,6,15,14); const nov=Date.UTC(2026,10,15,14);
 for(let i=0;i<60;i++){
  const q=g.chooseFinalQuestion(s,july);
  assert.ok(q.categoryId);assert.ok(!bank.CATEGORY_LOOKUP.get(q.categoryId).activeMonths,q.id+' not active in July');
  assert.ok(!s.selected.flat().includes(q.categoryId),q.id+' appeared on the current board');
 }
 const activeNov=new Set(bank.availableCategories(new Date(nov)).map(c=>c.id));
 for(let i=0;i<60;i++)assert.ok(activeNov.has(g.chooseFinalQuestion(s,nov).categoryId));
 const seen=new Set();
 const expected=g.finalCandidates(s,july).length;
 for(let i=0;i<expected;i++){
  const q=g.chooseFinalQuestion(s,july);
  // Maintain history in the same form the real game records completed finals.
  s.recentQuestionIds.push(q.id);
  assert.ok(!seen.has(q.id),'A final was repeated before the unseen pool was exhausted');seen.add(q.id);
 }
 assert.equal(seen.size,expected);
 // After every unused category outside the board has been played,
 // continue drawing ONLY from categories outside the board.
 for(let i=0;i<30;i++)assert.ok(!s.selected.flat().includes(g.chooseFinalQuestion(s,july).categoryId));
});
test('Final Word hints cost 500 points, purchase before wagering, and deduct immediately',()=>{
 let {s,a}=setup(2);s.players[0].score=1100;s.players[0].hintsRemaining=1;
 s.phase='final-wager';s.final={id:'f15',wagers:{},answers:{},disputeIds:[]};
 let v=g.makeView(s,a[0],1,10000);
 assert.equal(v.final.myPurchasableHints,2,'A remaining regular hint cannot restrict Final Word purchases');
 assert.equal(v.final.myAvailableHints,0,'No free Final Word hints even with regular hints');
 s=g.mutate(s,{type:'buy-final-hint'},a[0],10001);
 assert.equal(s.players[0].score,600);assert.equal(s.final.purchasedHints[a[0].id],1);
 s=g.mutate(s,{type:'buy-final-hint'},a[0],10002);
 assert.equal(s.players[0].score,100);assert.equal(g.makeView(s,a[0],1,10002).final.myPurchasableHints,0);
 assert.throws(()=>g.mutate(s,{type:'buy-final-hint'},a[0],10003),/both Final Word hints/);
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
 assert.equal(g.makeView(s,a[0],1,4001).final.myPurchasableHints,2);
});
test('purchased Final Word hints remain hidden until all wagers lock, reveal privately, and do not consume regular hints',()=>{
 let {s,a}=setup(2);s.players[0].score=2000;s.players[0].hintsRemaining=1;s.players[1].hintsRemaining=3;
 s.phase='final-wager';s.final={id:'f15',wagers:{},answers:{},disputeIds:[]};
 s=g.mutate(s,{type:'buy-final-hint'},a[0],3000);
 let v=g.makeView(s,a[0],1,3001);
 assert.deepEqual(v.final.myRevealedHints,[]);
 assert.equal(v.final.myPurchasedHints,1);
 assert.equal(v.final.prompt,undefined);
 assert.equal(v.final.myAvailableHints,0);
 assert.deepEqual(g.makeView(s,a[1],1,3002).final.myRevealedHints,[]);
 assert.deepEqual(g.makeView(s,host,1,3002).final.myRevealedHints,[]);
 s=g.mutate(s,{type:'buy-final-hint'},a[0],3003);
 v=g.makeView(s,a[0],1,3004);
 assert.deepEqual(v.final.myRevealedHints,[]);
 assert.equal(v.final.myPurchasedHints,2);
 assert.equal(v.final.prompt,undefined);
 assert.equal(s.players[0].score,1000);
 assert.throws(()=>g.mutate(s,{type:'buy-final-hint'},a[0],3005),/both Final Word hints/);
 s=g.mutate(s,{type:'wager',amount:500},a[0],4000);
 assert.deepEqual(g.makeView(s,a[0],1,4000).final.myRevealedHints,[]);
 assert.throws(()=>g.mutate(s,{type:'wager',amount:0},a[0],4000),/already locked/);
 assert.throws(()=>g.mutate(s,{type:'final-hint'},a[0],4000),/not available/);
 s=g.mutate(s,{type:'wager',amount:0},a[1],4001);
 v=g.makeView(s,a[0],1,4001);
 const q=bank.FINALS.find(q=>q.id==='f15');
 assert.equal(v.final.prompt,q.prompt);
 assert.deepEqual(v.final.myRevealedHints,q.hints);
 assert.equal(v.final.deadlineAt,4001+s.settings.finalSeconds*1000);
 assert.deepEqual(g.makeView(s,a[1],1,4001).final.myRevealedHints,[]);
 assert.deepEqual(g.makeView(s,host,1,4001).final.myRevealedHints,[]);
 assert.deepEqual(g.makeView(s,{kind:'display'},1,4001).final.myRevealedHints,[]);
 assert.throws(()=>g.mutate(s,{type:'final-hint'},a[0],4002),/Both hints are already revealed/);
 assert.equal(s.players[0].hintsRemaining,1);
 assert.equal(s.players[1].hintsRemaining,3);
 assert.equal(s.final.purchasedHintsUsed[a[0].id],2);
 s=g.mutate(s,{type:'final-answer',answer:'Gabriel García Márquez'},a[0],4500);
 assert.equal(s.final.answers[a[0].id].hintUsed,true);
 assert.throws(()=>g.mutate(s,{type:'final-hint'},a[0],4600),/already locked/);
});
test('regular hints are independent from Final Word purchases and only two can be bought',()=>{
 let {s,a}=setup(2);s.phase='final-wager';s.final={id:'f12',wagers:{},answers:{},disputeIds:[]};
 s.players[0].score=2000;s.players[0].hintsRemaining=5;
 assert.equal(g.makeView(s,a[0],1,5000).final.myPurchasableHints,2);
 assert.equal(g.makeView(s,a[0],1,5000).final.myAvailableHints,0);
 for(let i=0;i<2;i++)s=g.mutate(s,{type:'buy-final-hint'},a[0],5001+i);
 assert.equal(s.players[0].score,1000);assert.equal(s.players[0].hintsRemaining,5);
 assert.equal(g.makeView(s,a[0],1,5004).final.myPurchasableHints,0);
 assert.throws(()=>g.mutate(s,{type:'buy-final-hint'},a[0],5005),/both Final Word hints/);
 s.players[1].score=1600;s.players[1].hintsRemaining=0;
 for(let i=0;i<2;i++)s=g.mutate(s,{type:'buy-final-hint'},a[1],5101+i);
 assert.equal(s.players[1].score,600);
 assert.throws(()=>g.mutate(s,{type:'buy-final-hint'},a[1],5105),/both Final Word hints/);
});
test('Final Word drafts remember pre-purchased hint use when auto-submitted',()=>{
 let {s,a}=setup(2);s.players[0].score=800;s.players[0].hintsRemaining=2;
 s.phase='final-wager';s.final={id:'f7',wagers:{},answers:{},disputeIds:[]};
 s=g.mutate(s,{type:'buy-final-hint'},a[0],7500);
 s=g.mutate(s,{type:'wager',amount:0},a[0],8000);s=g.mutate(s,{type:'wager',amount:0},a[1],8001);
 assert.equal(g.makeView(s,a[0],1,8100).final.myRevealedHints.length,1);
 const due=s.final.deadlineAt;
 s=g.mutate(s,{type:'save-draft',scope:'final',answer:'antonym'},a[0],due-100);
 assert.throws(()=>g.mutate(s,{type:'final-hint'},a[0],due+1),/not available|expired/);
 s=g.tick(s,due);
 assert.equal(s.phase,'final-results');assert.equal(s.final.answers[a[0].id].correct,true);
 assert.equal(s.final.answers[a[0].id].hintUsed,true);
 assert.equal(s.players[0].hintsRemaining,2);
});


test('seasonal availability follows the Eastern date, keeping all 62 year-round categories eligible',()=>{
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
  assert.equal([...ids].filter(id=>!seasonalIds.has(id)).length,62);
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
 assert.equal(seasonal.length,14);
 for(const category of seasonal){assert.equal(Object.values(category.questionsByLevel).flat().length,18);
  for(const q of Object.values(category.questionsByLevel).flat()){
   const opts=[q.answer,...q.distractors];assert.equal(new Set(opts.map(o=>o.toLowerCase())).size,4,q.id);
   assert.equal(q.distractors.length,3,q.id);
   assert.ok(q.hint.length>12,q.id);
   assert.equal(q.hint.toLowerCase().includes(q.answer.toLowerCase()),false,`${q.id} hint gives away answer`);
   for(const d of q.distractors){assert.equal(q.aliases.some(a=>a.toLowerCase()===d.toLowerCase()),false,`${q.id} matches alias`);assert.equal(g.isCorrectForQuestion(d,q),false,`${q.id}: ${d}`);}
  }
 }
});

test('each Build the Board draft offers at least one eligible seasonal category when available',()=>{
 for(const date of ['2026-09-23','2026-11-23','2026-12-23','2027-01-23','2027-02-23']){
  let {s,a}=setup(4);const now=Date.parse(date+'T16:00:00Z');
  s=g.mutate(s,{type:'start-draft'},host,now);
  assert.ok(s.draftPool.some(id=>bank.CATEGORY_LOOKUP.get(id).activeMonths),`seasonal guarantee: ${date}`);
  assert.equal(s.draftPool.length,8);
  const season1=s.draftPool.find(id=>bank.CATEGORY_LOOKUP.get(id).activeMonths);
  // Simulate four selections (including the seasonal one), so round two excludes those picks.
  s.selected[0]=[season1,...s.draftPool.filter(id=>id!==season1).slice(0,3)];
  s.round=1;s.phase='lobby';s=g.mutate(s,{type:'start-draft'},host,now+10000);
  const remainingSeasonal=bank.availableCategories(new Date(now+10000)).some(c=>c.activeMonths&&!s.selected[0].includes(c.id));
  assert.equal(s.draftPool.some(id=>bank.CATEGORY_LOOKUP.get(id).activeMonths),remainingSeasonal,`second seasonal: ${date}`);
  assert.ok(!s.draftPool.includes(season1),`do not repeat selected season: ${date}`);
 }
});

test('seasonal offer is mandatory even when every seasonal category was recently offered or played',()=>{
 let {s,a}=setup(3);const now=Date.parse('2026-11-23T16:00:00Z');
 const seasonal=bank.availableCategories(new Date(now)).filter(c=>c.activeMonths).map(c=>c.id);
 s.recentCategoryIds=[...seasonal];s.recentCategoryOffers=[...seasonal];
 s=g.mutate(s,{type:'start-draft'},host,now);
 const offered=s.draftPool.filter(id=>bank.CATEGORY_LOOKUP.get(id).activeMonths);
 assert.ok(offered.length>=1);
 assert.ok(seasonal.includes(offered[0]),'seasonal offer must remain available after being used');
 assert.equal(s.draftPool.length,8);
 s.selected[0]=[offered[0],...s.draftPool.filter(id=>id!==offered[0]).slice(0,3)];s.round=1;s.phase='lobby';
 s=g.mutate(s,{type:'start-draft'},host,now+10000);
 const offered2=s.draftPool.filter(id=>bank.CATEGORY_LOOKUP.get(id).activeMonths);
 assert.ok(offered2.length>=1);
 assert.notEqual(offered2[0],offered[0]);
});

test('weighted seasonal choices can repeat but favor categories not recently played or offered',()=>{
 const now=Date.parse('2026-11-23T16:00:00Z');
 const available=bank.availableCategories(new Date(now)).filter(c=>c.activeMonths);
 assert.ok(available.length>=3);
 const recent=available[0];
 let {s}=setup(3);s.recentCategoryIds=[recent.id];s.recentCategoryOffers=[recent.id];
 const sampleCounts=new Map(available.map(c=>[c.id,0]));
 // The host is in the lobby, so each run represents an independent draft.
 for(let i=0;i<1200;i++){
  const draft=g.mutate(s,{type:'start-draft'},host,now);
  const eligible=draft.draftPool.filter(id=>bank.CATEGORY_LOOKUP.get(id).activeMonths);
  assert.ok(eligible.length>=1);
  // The first offer is the weighted seasonal guarantee; audit that draw specifically.
  assert.equal(draft.draftPool[0],eligible[0]);
  sampleCounts.set(eligible[0],sampleCounts.get(eligible[0])+1);
 }
 const recentlyPlayedCount=sampleCounts.get(recent.id);
 const freshCounts=available.slice(1).map(c=>sampleCounts.get(c.id));
 assert.ok(recentlyPlayedCount>0,'previously played category must have nonzero probability');
 assert.ok(freshCounts.every(count=>count>recentlyPlayedCount),`recent ${recentlyPlayedCount}, fresh ${freshCounts.join(',')}`);
});

test('weighted selection preserves distinct categories and the current-show exclusion',()=>{
 const now=Date.parse('2026-11-23T16:00:00Z');
 let {s}=setup(5);s.recentCategoryIds=bank.CATEGORIES.map(c=>c.id);
 s.recentCategoryOffers=[...s.recentCategoryIds];
 s.recentQuestionIds=bank.CATEGORIES.flatMap(c=>Object.values(c.questionsByLevel).flat().slice(0,2).map(q=>q.id));
 s=g.mutate(s,{type:'start-draft'},host,now);
 assert.equal(s.draftPool.length,8);
 assert.equal(new Set(s.draftPool).size,s.draftPool.length);
 const picked=s.draftPool.slice(0,4);s.selected[0]=picked;s.round=1;s.phase='lobby';
 s=g.mutate(s,{type:'start-draft'},host,now+5000);
 assert.equal(s.draftPool.length,8);
 assert.ok(s.draftPool.every(id=>!picked.includes(id)));
 assert.ok(s.draftPool.some(id=>bank.CATEGORY_LOOKUP.get(id).activeMonths));
});

test('out-of-season months do not falsely offer holiday categories',()=>{
 let {s}=setup(3);s=g.mutate(s,{type:'start-draft'},host,Date.parse('2027-03-23T15:00:00Z'));
 assert.ok(s.draftPool.every(id=>!bank.CATEGORY_LOOKUP.get(id).activeMonths));
});

test('buying hints changes balance and the maximum wager; outcomes use the post-purchase score',()=>{
 let {s,a}=setup(2);s.players[0].score=3000;s.phase='final-wager';s.final={id:'f16',wagers:{},answers:{},disputeIds:[]};
 s=g.mutate(s,{type:'buy-final-hint'},a[0],9000);
 let v=g.makeView(s,a[0],1,9001);
 assert.equal(v.players.find(p=>p.id===a[0].id).score,2500);
 assert.equal(v.final.myPurchasedHints,1);assert.equal(v.final.maxHints,2);
 assert.throws(()=>g.mutate(s,{type:'wager',amount:2501},a[0],9002),/Wager must/);
 s=g.mutate(s,{type:'wager',amount:1000},a[0],9003);
 v=g.makeView(s,a[0],1,9004);
 assert.equal(v.final.myWager,1000);
 assert.equal(v.players.find(p=>p.id===a[0].id).score+v.final.myWager,3500);
 assert.equal(v.players.find(p=>p.id===a[0].id).score-v.final.myWager,1500);
 assert.throws(()=>g.mutate(s,{type:'buy-final-hint'},a[0],9005),/before locking/);
});

const hh=require('../.engine-build/host-history.js');
test('history merging preserves newest encounter ordering across separate hosted rooms',()=>{
 const prior=[
   {recentQuestionIds:['q01','q02','q03'],recentCategoryIds:['a','b'],recentCategoryOffers:['a','b','c']},
   {recentQuestionIds:['q02','q03','q04'],recentCategoryIds:['b','c'],recentCategoryOffers:['c','d']},
 ];
 const merged=hh.mergeHostHistories(prior,{recentQuestionIds:['q05','q02'],recentCategoryIds:['d'],recentCategoryOffers:['a']});
 assert.deepEqual(merged.recentQuestionIds,['q01','q03','q04','q05','q02']);
 assert.deepEqual(merged.recentCategoryIds,['a','b','c','d']);
 assert.deepEqual(merged.recentCategoryOffers,['b','c','d','a']);
});
test('previously played categories remain eligible but appear less often than fresh classics',()=>{
 let {s}=setup(4);
 const classic=bank.CATEGORIES.filter(c=>!c.activeMonths);
 const recent=classic.slice(0,8).map(c=>c.id);
 s.recentCategoryIds=[...recent];s.recentCategoryOffers=[...recent];
 let recentOffers=0;
 for(let i=0;i<350;i++){
  const draft=g.mutate(s,{type:'start-draft'},host,Date.parse('2027-03-23T15:00:00Z'));
  recentOffers+=draft.draftPool.filter(id=>recent.includes(id)).length;
 }
 const freshOffers=350*8-recentOffers;
 assert.ok(recentOffers>0,'played categories must not be hard-blocked');
 assert.ok(recentOffers/8<freshOffers/(classic.length-8),'recent categories should have lower average odds');
});
test('rematches preserve the host history ID and recent question IDs',()=>{
 let {s}=setup(2);
 s.hostHistoryId='550e8400-e29b-41d4-a716-446655440000';
 s.recentQuestionIds=['f1','f2'];
 s.recentCategoryIds=['space-case'];
 s.phase='finished';
 const next=g.mutate(s,{type:'new-game'},host,1000);
 assert.equal(next.hostHistoryId,s.hostHistoryId);
 assert.deepEqual(next.recentQuestionIds,['f1','f2']);
});

test('joined players can choose the one shared soundtrack; other players see that selection',()=>{
 let {s,a}=setup(3);
 assert.equal(s.settings.playerMusic,true);
 s=g.mutate(s,{type:'choose-music',music:'retro',arrangement:1},a[0],10000);
 assert.equal(s.settings.music,'retro');assert.equal(s.settings.arrangement,1);
 const view=g.makeView(s,a[1],2,10001);
 assert.equal(view.settings.music,'retro');assert.equal(view.settings.arrangement,1);
 assert.throws(()=>g.mutate(s,{type:'choose-music',music:'jazz',arrangement:0},{kind:'spectator'},16000),/Join the show/);
 assert.throws(()=>g.mutate(s,{type:'choose-music',music:'indie',arrangement:0},a[1],11000),/just changed/);
 s=g.mutate(s,{type:'choose-music',music:'indie',arrangement:0},a[1],16001);
 assert.equal(s.settings.music,'indie');
});

test('host may reserve music controls and change the soundtrack without a cooldown',()=>{
 let {s,a}=setup(2);
 s=g.mutate(s,{type:'settings',settings:{playerMusic:false}},host,6000);
 assert.throws(()=>g.mutate(s,{type:'choose-music',music:'bluegrass',arrangement:0},a[0],7000),/reserved music selections/);
 s=g.mutate(s,{type:'choose-music',music:'cinematic',arrangement:1},host,7000);
 assert.equal(s.settings.music,'cinematic');
 s=g.mutate(s,{type:'choose-music',music:'jazz',arrangement:0},host,7001);
 assert.equal(s.settings.music,'jazz');
 assert.throws(()=>g.mutate(s,{type:'choose-music',music:'nonexistent',arrangement:0},host,7002),/Invalid music track/);
 s=g.mutate(s,{type:'settings',settings:{playerMusic:true}},host,7100);
 s=g.mutate(s,{type:'choose-music',music:'game',arrangement:0},a[0],13000);
 assert.equal(s.settings.music,'game');
});

test('Total No-Show requires all players to submit incorrect responses and adds 3.5 seconds',()=>{
 let {s,a}=setup(3);s=draft(s,a);s=open(s,a[0],keys(s)[0]);
 for(let i=0;i<a.length;i++)s=g.mutate(s,{type:'submit-answer',answer:'incorrect guess'},a[i],23000+i*20);
 assert.equal(s.phase,'results');assert.equal(s.resolution.noShow,true);
 assert.equal(s.resolution.endsAt-s.resolution.finishedAt,12000);
 assert.equal(g.makeView(s,a[0],1,23100).results.noShow,true);
 s=g.tick(s,s.resolution.endsAt-1);assert.equal(s.phase,'results');
});

test('Total No-Show is suppressed when any player answers correctly',()=>{
 let {s,a}=setup(2);s=draft(s,a);s=open(s,a[0],keys(s)[0]);
 const q=bank.getQuestion(s.active.questionId);
 s=g.mutate(s,{type:'submit-answer',answer:'incorrect guess'},a[0],23000);
 s=g.mutate(s,{type:'submit-answer',answer:q.answer},a[1],23010);
 assert.equal(s.phase,'results');assert.equal(s.resolution.noShow,false);
 assert.equal(s.resolution.endsAt-s.resolution.finishedAt,8500);
});

test('Total No-Show is suppressed for unanswered timeouts and skipped questions',()=>{
 let {s,a}=setup(2);s=draft(s,a);s=open(s,a[0],keys(s)[0]);
 s=g.mutate(s,{type:'submit-answer',answer:'incorrect guess'},a[0],23000);
 s=g.tick(s,s.active.deadlineAt+100);
 assert.equal(s.phase,'results');assert.equal(s.resolution.noShow,false);
 let second=setup(2);second.s=draft(second.s,second.a);
 second.s=open(second.s,second.a[0],keys(second.s)[0]);
 second.s=g.mutate(second.s,{type:'skip-question'},host,23000);
 assert.equal(second.s.resolution.skipped,true);
 assert.equal(second.s.resolution.noShow,false);
});

test('host correcting a disputed answer removes Total No-Show status',()=>{
 let {s,a}=setup(2);s=draft(s,a);s=open(s,a[0],keys(s)[0]);
 s=g.mutate(s,{type:'submit-answer',answer:'incorrect guess'},a[0],23000);
 s=g.mutate(s,{type:'submit-answer',answer:'incorrect guess'},a[1],23010);
 assert.equal(s.resolution.noShow,true);
 s=g.mutate(s,{type:'dispute'},a[0],23100);
 s=g.mutate(s,{type:'resolve-dispute',playerId:a[0].id,correct:true},host,23200);
 assert.equal(s.resolution.noShow,false);
 assert.equal(s.resolution.answers[a[0].id].correct,true);
});

test('Final Word shows a Total No-Show for all wrong written attempts, but not a missing answer',()=>{
 let {s,a}=setup(2);s.phase='final-wager';s.final={id:bank.FINALS[0].id,wagers:{},answers:{},disputeIds:[]};
 for(let i=0;i<a.length;i++)s=g.mutate(s,{type:'wager',amount:0},a[i],5000+i*10);
 assert.equal(s.phase,'final-question');
 s=g.mutate(s,{type:'final-answer',answer:'totally incorrect guess'},a[0],5500);
 s=g.mutate(s,{type:'final-answer',answer:'also incorrect'},a[1],5600);
 assert.equal(s.phase,'final-results');assert.equal(s.final.noShow,true);
 assert.equal(s.final.endsAt-5600,17500);
 assert.equal(g.makeView(s,a[0],1,5700).final.noShow,true);
 let missed=setup(2);missed.s.phase='final-wager';missed.s.final={id:bank.FINALS[0].id,wagers:{},answers:{},disputeIds:[]};
 for(let i=0;i<missed.a.length;i++)missed.s=g.mutate(missed.s,{type:'wager',amount:0},missed.a[i],5000+i*10);
 missed.s=g.mutate(missed.s,{type:'final-answer',answer:'incorrect guess'},missed.a[0],5500);
 missed.s=g.tick(missed.s,missed.s.final.deadlineAt+10);
 assert.equal(missed.s.phase,'final-results');assert.equal(missed.s.final.noShow,false);
});

test('only a nonempty incorrect submission can be sent for host review',()=>{
 let {s,a}=setup(3);s=draft(s,a);s=open(s,a[0],keys(s)[0]);
 const q=bank.getQuestion(s.active.questionId);
 s=g.mutate(s,{type:'submit-answer',answer:q.answer},a[0],23000);
 s=g.mutate(s,{type:'submit-answer',answer:'incorrect guess'},a[1],23100);
 s=g.tick(s,s.active.deadlineAt+100);
 assert.equal(s.phase,'results');
 assert.throws(()=>g.mutate(s,{type:'dispute'},a[0],s.resolution.finishedAt+10),/Only submitted answers marked incorrect/);
 assert.throws(()=>g.mutate(s,{type:'dispute'},a[2],s.resolution.finishedAt+10),/Only submitted answers marked incorrect/);
 const remaining=s.resolution.endsAt;
 s=g.mutate(s,{type:'dispute'},a[1],s.resolution.finishedAt+10);
 assert.equal(s.resolution.disputeIds[0],a[1].id);
 assert.equal(s.resolution.endsAt,remaining);
 s=g.mutate(s,{type:'resolve-dispute',playerId:a[1].id,correct:true},host,s.resolution.finishedAt+20);
 assert.equal(s.resolution.answers[a[1].id].correct,true);
 assert.deepEqual(s.resolution.disputeIds,[]);
});
test('final review rejects unanswered and already correct entries',()=>{
 let {s,a}=setup(2);s.phase='final-wager';s.final={id:bank.FINALS[0].id,wagers:{},answers:{},disputeIds:[]};
 for(const p of a)s=g.mutate(s,{type:'wager',amount:0},p,5000);
 const answer=bank.FINALS[0].answer;
 s=g.mutate(s,{type:'final-answer',answer},a[0],5500);
 s=g.tick(s,s.final.deadlineAt+10);
 assert.equal(s.phase,'final-results');
 assert.throws(()=>g.mutate(s,{type:'dispute'},a[0],s.final.endsAt-1000),/Only submitted answers marked incorrect/);
 assert.throws(()=>g.mutate(s,{type:'dispute'},a[1],s.final.endsAt-1000),/Only submitted answers marked incorrect/);
});


test('v1.8.1: eight offers in both rounds for every player count and game mode',()=>{
 const now=Date.parse('2026-11-24T16:00:00Z');
 for(const mode of ['individual','teams'])for(let count=2;count<=8;count++){
  let {s,a}=setup(count,mode);s=g.mutate(s,{type:'start-draft'},host,now);
  for(let round=0;round<2;round++){
   assert.equal(s.draftPool.length,8,`${mode}: ${count}, round ${round+1}`);
   assert.equal(new Set(s.draftPool).size,8);
   assert.ok(s.draftPool.some(id=>bank.CATEGORY_LOOKUP.get(id).activeMonths));
   if(round)assert.ok(s.draftPool.every(id=>!s.selected[0].includes(id)));
   for(let i=0;i<4;i++){
    assert.equal(s.draftPool.filter(id=>!s.selected[round].includes(id)).length,8-i);
    s=g.mutate(s,{type:'draft-category',categoryId:s.draftPool[i]},a[(i+round*4)%count],now+i+1);
   }
   assert.equal(s.phase,'board');assert.equal(keys(s).length,12);
   if(!round){s.round=1;s.phase='lobby';s=g.mutate(s,{type:'start-draft'},host,now+100);}
  }
 }
});

test('v1.8.1: additional seasonal categories compete and four can be selected',t=>{
 const now=Date.parse('2026-11-24T16:00:00Z');
 let {s,a}=setup(4);
 // Fresh categories have identical weights. Force the weighted draws to select
 // seasonal categories from the actual eligible pool, without changing production RNG.
 const allowed=bank.availableCategories(new Date(now));
 const seasonal=allowed.filter(c=>c.activeMonths);
 const targets=seasonal.slice(0,4).map(c=>c.id);
 const remaining=allowed.filter(c=>c.id!==targets[0]);
 const fractions=[0.5/seasonal.length];
 for(const target of targets.slice(1)){
  const index=remaining.findIndex(c=>c.id===target);assert.ok(index>=0);
  fractions.push((index+0.5)/remaining.length);remaining.splice(index,1);
 }
 const crypto=require('node:crypto');const original=crypto.randomInt;
 const mock=t.mock.method(crypto,'randomInt',max=>max===1_000_000_000&&fractions.length?Math.floor(fractions.shift()*max):original(max));
 s=g.mutate(s,{type:'start-draft'},host,now);mock.mock.restore();
 assert.deepEqual(s.draftPool.slice(0,4),targets);
 for(let i=0;i<4;i++)s=g.mutate(s,{type:'draft-category',categoryId:targets[i]},a[i],now+i+1);
 assert.equal(s.phase,'board');assert.deepEqual(s.selected[0],targets);assert.equal(keys(s).length,12);
 s=finishRound(s,a,now+10000);
 assert.equal(s.round,1);assert.equal(s.phase,'draft');assert.equal(s.draftPool.length,8);
 assert.ok(s.draftPool.every(id=>!targets.includes(id)));
 assert.ok(s.draftPool.some(id=>bank.CATEGORY_LOOKUP.get(id).activeMonths));
});

test('v1.8.1: when Round 1 uses every in-season category, Round 2 offers eight year-round categories',()=>{
 const now=Date.parse('2026-09-24T16:00:00Z');
 let {s}=setup(2);const eligible=bank.availableCategories(new Date(now));
 const seasonal=eligible.filter(c=>c.activeMonths);assert.equal(seasonal.length,2);
 s.selected[0]=[...seasonal,...eligible.filter(c=>!c.activeMonths).slice(0,2)].map(c=>c.id);
 s.round=1;s=g.mutate(s,{type:'start-draft'},host,now);
 assert.equal(s.draftPool.length,8);assert.ok(s.draftPool.every(id=>!bank.CATEGORY_LOOKUP.get(id).activeMonths&&!s.selected[0].includes(id)));
});

 test('host-started Final Word reveals paid hints at question opening and defaults missing wagers to zero',()=>{
 let {s,a}=setup(3);s.players.forEach(p=>p.score=1500);
 s.phase='final-wager';s.final={id:'f15',wagers:{},answers:{},disputeIds:[]};
 s=g.mutate(s,{type:'buy-final-hint'},a[0],3000);
 s=g.mutate(s,{type:'buy-final-hint'},a[1],3001);
 s=g.mutate(s,{type:'buy-final-hint'},a[1],3002);
 s=g.mutate(s,{type:'wager',amount:500},a[0],3003);
 // Older persisted snapshots may already contain revealed counts; still hide text during wagering.
 s.final.revealedHints={[a[0].id]:1};s.final.purchasedHintsUsed={[a[0].id]:1};
 for(const actor of [...a,host,{kind:'display'}]){
   const v=g.makeView(s,actor,1,3004);assert.deepEqual(v.final.myRevealedHints,[]);assert.equal(v.final.prompt,undefined);assert.equal(v.final.answer,undefined);
 }
 s=g.mutate(s,{type:'start-final'},host,4000);
 assert.equal(s.phase,'final-question');assert.equal(s.final.wagers[a[0].id],500);assert.equal(s.final.wagers[a[1].id],0);assert.equal(s.final.wagers[a[2].id],0);
 const q=bank.FINALS.find(q=>q.id==='f15');
 for(const [i,actor] of a.entries()){
   const v=g.makeView(s,actor,1,4000);assert.equal(v.final.prompt,q.prompt);assert.deepEqual(v.final.myRevealedHints,q.hints.slice(0,[1,2,0][i]));assert.equal(v.final.myAvailableHints,0);assert.equal(v.final.myPurchasableHints,0);
 }
 assert.deepEqual(g.makeView(s,host,1,4000).final.myRevealedHints,[]);
 assert.equal(s.final.deadlineAt,4000+s.settings.finalSeconds*1000);
 });

// v1.9.0: validate the editorial audit against the real scoring engine.
test('v1.9.0 level swaps preserve balanced pools and match their stored level',()=>{
 for(const c of bank.CATEGORIES)for(const [level,qs] of Object.entries(c.questionsByLevel)){
  assert.equal(qs.length,c.activeMonths?6:4,c.id);
  for(const q of qs)assert.equal(q.level,Number(level),q.id);
 }
 for(const [id,level] of [['v170-sci-fi-2-1',3],['v170-sci-fi-3-3',2],['season-christmas-movies-2-5',3],['season-christmas-movies-3-2',2],['v180-christmas-lore-2-2',3],['v180-christmas-lore-3-5',2],['animals-l2-2',1],['animals-l3-1',2],['misleading-l3-1',3],['legacy-misleading-4',2],['v170-wars-2-1',2],['world_history-l4-1',3]]) assert.equal(bank.getQuestion(id).level,level,id);
});
test('v1.9.0 accepts intended short answers without blanket partial credit',()=>{
 for(const [id,yes,no] of [['world_history-l3-2',['Byzantine','Eastern Roman Empire','Byzantne'],['Empire','Ottoman Empire','Roman Empire']],['history-l4-2',['Ottoman'],['Empire','Mughal Empire']],['v1-qa2-wait-what-medium-1',['Second place','Second','2nd'],['First place','Third place','Grandmother']],['v170-before-after-3-2',["One Flew Over the Cuckoo's Nest Egg"],['Nest Egg','Nest Box',"One Flew Over the Cuckoo's Nest"]],['v170-sci-fi-3-1',['Electric Sheep','Do Androids Dream of Electric Sheep?'],['Electric','Ubik']],['tech-l1-2',['Universal Serial Bus'],['USB','Universal System Bus']]]){
  const q=bank.getQuestion(id);for(const a of yes)assert.equal(g.isCorrectForQuestion(a,q),true,`${id}: ${a}`);for(const a of no)assert.equal(g.isCorrectForQuestion(a,q),false,`${id}: ${a}`);
 }
});
test('v1.9.0 all registered answers and aliases score correctly and all published distractors score incorrectly',()=>{
 for(const q of [...bank.QUESTION_LOOKUP.values(),...bank.CATEGORY_FINALS]){
  for(const a of [q.answer,...(q.aliases??[])])assert.equal(g.isCorrectForQuestion(a,q),true,`${q.id}: ${a}`);
  for(const d of q.distractors??[])assert.equal(g.isCorrectForQuestion(d,q),false,`${q.id}: ${d}`);
 }
});
test('v1.9.0 retains two Final Word hints for all categories and requires the full blended-title response',()=>{
 assert.equal(bank.CATEGORY_FINALS.length,76);for(const f of bank.CATEGORY_FINALS)assert.equal(f.hints.length,2,f.id);
 const f=bank.CATEGORY_FINALS.find(q=>q.id==='category-final-before-after');assert.equal(g.isCorrectForQuestion('A Clockwork Orange Is the New Black',f),true);assert.equal(g.isCorrectForQuestion('Clockwork Orange',f),false);assert.equal(g.isCorrectForQuestion('Orange',f),false);
});

test('v1.9.2 lyric categories have short completions, seasonal eligibility, source URLs and balanced levels',()=>{
 const specs=[['finish-that-lyric',4,undefined],['christmas-sing-along',6,[11,12]]];
 for(const [id,count,months] of specs){
  const cat=bank.CATEGORY_LOOKUP.get(id);assert.ok(cat);assert.deepEqual(cat.activeMonths,months);
  const seen=new Set();
  for(const level of ['1','2','3']){assert.equal(cat.questionsByLevel[level].length,count);for(const q of cat.questionsByLevel[level]){
   assert.equal((q.prompt.match(/___/g)||[]).length,1,q.id);assert.ok(q.answer.split(/\s+/).length<=3,q.id);
   assert.ok(q.sourceUrl.startsWith('https://'),q.id);assert.equal(q.distractors.length,3,q.id);
   assert.ok(!q.hint.toLowerCase().includes(q.answer.toLowerCase()),q.id);
   assert.ok(!seen.has(q.prompt),q.id);seen.add(q.prompt);
   for(const option of q.distractors)assert.equal(g.isCorrectForQuestion(option,q),false,q.id);
  }}
  for(let m=1;m<=12;m++){const active=bank.availableCategories(new Date(Date.UTC(2026,m-1,15,16))).some(c=>c.id===id);assert.equal(active,!months||months.includes(m),`${id}: ${m}`);}
  const final=bank.CATEGORY_FINALS.find(q=>q.categoryId===id);assert.ok(final);assert.equal(final.hints.length,2);assert.ok(final.answer.split(/\s+/).length<=3);
 }
 const q=bank.getQuestion('v192-christmas-sing-along-2-1');assert.ok(g.isCorrectForQuestion('good St Nick',q));assert.ok(!g.isCorrectForQuestion('Santa Claus',q));
});

test('live support preserves active written drafts and the actual answer format for scoring and statistics',()=>{
 let {s,a}=setup(2);s=draft(s,a);s=open(s,a[0],keys(s)[0]);const q=bank.getQuestion(s.active.questionId);
 s=g.mutate(s,{type:'save-draft',scope:'question',answer:q.answer},a[0],23000);
 s=g.mutate(s,{type:'player-bonuses',playerId:a[0].id,choiceAccess:'all'},host,23100);
 assert.equal(g.makeView(s,a[0],1,23200).active.myChoices,undefined);
 assert.equal(g.makeView(s,a[0],1,23200).active.myDraft,q.answer);
 s=g.tick(s,s.active.deadlineAt+1);
 assert.equal(s.resolution.answers[a[0].id].answerFormat,'written');assert.equal(s.resolution.answers[a[0].id].correct,true);
 assert.throws(()=>g.mutate(s,{type:'player-bonuses',playerId:a[1].id,choiceAccess:'all'},a[0],s.resolution.finishedAt+1),/Only the host/);
});

test('last-answer review is private to an eligible player, pauses the board, updates stats once, and closes at next question',()=>{
 const {exposureJournal}=require('../.engine-build/exposure.js');let {s,a}=setup(2);s=draft(s,a);s=open(s,a[0],keys(s)[0]);const q=bank.getQuestion(s.active.questionId);
 s=g.mutate(s,{type:'submit-answer',answer:'wrong answer'},a[0],23000);s=g.mutate(s,{type:'submit-answer',answer:q.answer},a[1],23100);
 const deadline=s.resolution.endsAt;s=g.tick(s,deadline+1);assert.equal(s.phase,'board');assert.equal(g.makeView(s,a[0],1,deadline+1).lastReview.questionId,q.id);assert.equal(g.makeView(s,a[1],1,deadline+1).lastReview,undefined);assert.equal(g.makeView(s,host,1,deadline+1).results,undefined);
 let before=s;s=g.mutate(s,{type:'dispute',questionId:q.id},a[0],deadline+2);assert.equal(s.phase,'results');assert.equal(exposureJournal(before,s).exposures.length,0);assert.equal(g.tick(s,90000).phase,'results');assert.throws(()=>g.mutate(s,{type:'open-question',key:keys(s)[1]},a[1],90000),/not ready/);
 before=s;s=g.mutate(s,{type:'resolve-dispute',playerId:a[0].id,correct:true,questionId:q.id},host,90001);assert.equal(s.players[0].score,100);assert.equal(exposureJournal(before,s).exposures.length,1);s=g.tick(s,s.resolution.endsAt+1);assert.equal(s.phase,'board');assert.equal(g.makeView(s,a[0],1,100000).lastReview,undefined);
 s=open(s,a[1],keys(s)[1],100000);assert.throws(()=>g.mutate(s,{type:'dispute',questionId:q.id},a[0],103000),/before the next question/);
});

test('late review across the Round 1 boundary preserves the Round 2 draft and original point value',()=>{
 const {exposureJournal}=require('../.engine-build/exposure.js');let {s,a}=setup(2);s=draft(s,a);const k=keys(s);s.usedKeys=k.slice(0,11);s=open(s,a[0],k[11]);const q=bank.getQuestion(s.active.questionId);
 s=g.mutate(s,{type:'submit-answer',answer:'wrong'},a[0],23000);s=g.mutate(s,{type:'submit-answer',answer:q.answer},a[1],23100);const deadline=s.resolution.endsAt;s=g.tick(s,deadline+1);assert.equal(s.phase,'draft');assert.equal(s.round,1);const pool=[...s.draftPool];s=g.mutate(s,{type:'draft-category',categoryId:pool[0]},host,deadline+2);s=g.mutate(s,{type:'dispute',questionId:q.id},a[0],deadline+3);assert.equal(s.phase,'results');const before=s;s=g.mutate(s,{type:'resolve-dispute',playerId:a[0].id,correct:true},host,deadline+4);assert.equal(s.players[0].score,500);assert.equal(exposureJournal(before,s).exposures[0].round,1);const reviewed=s;s=g.tick(s,s.resolution.endsAt+1);assert.equal(s.phase,'draft');assert.deepEqual(s.draftPool,pool);assert.deepEqual(s.selected[1],[pool[0]]);assert.deepEqual(exposureJournal(reviewed,s).offers,{});
});

test('a denied review cannot be repeatedly reopened; stale requests cannot target a new result',()=>{
 let {s,a}=setup(2);s=draft(s,a);s=open(s,a[0],keys(s)[0]);s=g.mutate(s,{type:'submit-answer',answer:'wrong'},a[0],23000);s=g.mutate(s,{type:'submit-answer',answer:'wrong'},a[1],23100);const id=s.resolution.questionId;
 s=g.mutate(s,{type:'dispute',questionId:id},a[0],23200);s=g.mutate(s,{type:'resolve-dispute',playerId:a[0].id,correct:false,questionId:id},host,23300);assert.throws(()=>g.mutate(s,{type:'dispute',questionId:id},a[0],23400),/already reviewed/);assert.throws(()=>g.mutate(s,{type:'dispute',questionId:'stale'},a[1],23400),/window has closed/);
});

test('question feedback grants one shared five-second result break, never extends repeatedly, and cannot be started by spectators',()=>{
 let {s,a}=setup(2);s=draft(s,a);s=open(s,a[0],keys(s)[0]);s=g.mutate(s,{type:'submit-answer',answer:'wrong'},a[0],23000);s=g.mutate(s,{type:'submit-answer',answer:'wrong'},a[1],23100);const original=s.resolution.endsAt,id=s.resolution.questionId;
 assert.throws(()=>g.mutate(s,{type:'feedback-pause',questionId:id},{kind:'spectator'},23200),/Join the show/);s=g.mutate(s,{type:'feedback-pause',questionId:id},a[0],original-500);assert.equal(s.resolution.endsAt,original+5000);assert.equal(s.resolution.feedbackPauseUntil,original+4500);assert.equal(g.makeView(s,a[1],1,original).feedbackPauseUntil,original+4500);
 s=g.mutate(s,{type:'feedback-pause',questionId:id},a[1],original+1);assert.equal(s.resolution.endsAt,original+5000);assert.equal(g.tick(s,original+4999).phase,'results');s=g.tick(s,original+5000);assert.equal(s.phase,'board');s=g.mutate(s,{type:'feedback-pause',questionId:id},a[0],original+5001);assert.equal(s.phase,'board');assert.equal(g.makeView(s,a[0],1,original+5001).feedbackPauseUntil,undefined);
});

test('feedback break also delays Final Word finish but never overrides an unresolved dispute',()=>{
 let {s,a}=setup(2);s.phase='final-wager';s.final={id:bank.FINALS[0].id,wagers:{},answers:{},disputeIds:[]};for(const p of a)s=g.mutate(s,{type:'wager',amount:0},p,5000);for(const p of a)s=g.mutate(s,{type:'final-answer',answer:'wrong answer'},p,5500);const end=s.final.endsAt;
 s=g.mutate(s,{type:'feedback-pause',questionId:s.final.id},a[0],end-1000);assert.equal(s.final.endsAt,end+5000);assert.throws(()=>g.mutate(s,{type:'finish'},host,end),/feedback break/);s=g.mutate(s,{type:'dispute',questionId:s.final.id},a[1],end+1);assert.equal(g.tick(s,end+100000).phase,'final-results');s=g.mutate(s,{type:'dismiss-dispute',playerId:a[1].id},host,end+100001);assert.equal(g.tick(s,s.final.endsAt+1).phase,'finished');
});

test('review after Round 2 preserves existing Final Word wagers and ends when Final Word begins',()=>{
 let {s,a}=setup(2);s=draft(s,a);s.round=1;s.selected[1]=s.selected[0];s.selected[0]=[];const k=keys(s);s.usedKeys=k.slice(0,11);s=open(s,a[0],k[11]);const q=bank.getQuestion(s.active.questionId);s=g.mutate(s,{type:'submit-answer',answer:'wrong'},a[0],23000);s=g.mutate(s,{type:'submit-answer',answer:q.answer},a[1],23100);const end=s.resolution.endsAt;s=g.tick(s,end+1);assert.equal(s.phase,'final-wager');const finalId=s.final.id;s=g.mutate(s,{type:'wager',amount:0},a[1],end+2);s=g.mutate(s,{type:'dispute',questionId:q.id},a[0],end+3);assert.equal(s.phase,'results');assert.throws(()=>g.mutate(s,{type:'wager',amount:0},a[0],end+4),/closed/);s=g.mutate(s,{type:'resolve-dispute',playerId:a[0].id,correct:true},host,end+5);assert.equal(s.players[0].score,1000);s=g.tick(s,s.resolution.endsAt+1);assert.equal(s.phase,'final-wager');assert.equal(s.final.id,finalId);assert.equal(s.final.wagers[a[1].id],0);s=g.mutate(s,{type:'wager',amount:0},a[0],s.resolution.endsAt+2);assert.equal(s.phase,'final-question');assert.equal(s.resolution,undefined);
});
