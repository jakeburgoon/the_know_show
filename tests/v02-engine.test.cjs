const {test}=require('node:test');const assert=require('node:assert/strict');
const g=require('../.engine-build/game.js');
const qs=require('../.engine-build/questions.js');
function setup(mode='individual',count=4){let s=g.makeGame();s=g.mutate(s,{type:'settings',settings:{mode}}, {kind:'host'},1000);
 const actors=[];for(let i=0;i<count;i++){let j=g.joinGame(s,`Player ${i+1}`,10+i,1100+i);s=j.state;actors.push({kind:'player',id:j.player.id});}
 return {s,actors};}
function draft(s,actors,now=10000){s=g.mutate(s,{type:'start-draft'},{kind:'host'},now);assert.equal(s.draftPool.length,actors.length<=3?8:actors.length<=5?10:12);
 for(let i=0;i<5;i++)s=g.mutate(s,{type:'draft-category',categoryId:s.draftPool[i]},actors[(i+s.round*5)%actors.length],now+i);
 assert.equal(s.phase,'board');assert.equal(s.selected[s.round].length,5);return s;}
function open(s,key,actor,now){s=g.mutate(s,{type:'open-question',key},actor,now);assert.equal(s.phase,'intro');assert.equal(s.active.introUntilAt,now+2500);
 s=g.tick(s,now+2600);assert.equal(s.phase,'question');return s;}
const keys=s=>s.selected[s.round].flatMap(id=>[0,1,2,3].map(l=>`${id}:${l}`));
test('45 categories, at least two questions per level, and jazz soundtrack default',()=>{
 assert.equal(qs.CATEGORIES.length,45);assert.equal(qs.CATEGORIES.reduce((n,c)=>n+Object.values(c.questionsByLevel).flat().length,0),453);
 for(const c of qs.CATEGORIES)for(let tier=1;tier<=4;tier++)assert.ok(c.questionsByLevel[tier].length>=2,c.name+' '+tier);
 assert.equal(g.defaultSettings().music,'jazz');
});
test('lenient spelling, cautious short word checking',()=>{assert.ok(g.isCorrect('cilumbus','Columbus'));assert.ok(g.isCorrect('The Milky Way','Milky Way'));assert.ok(!g.isCorrect('Marz','Mars'));assert.ok(!g.isCorrect('Venice','Venus'));assert.ok(!g.isCorrect('room','Elephant'));});
test('individual mode auto judges everyone, score changes on reveal, double take and speed',()=>{
 let {s,actors}=setup();s=draft(s,actors);const key=keys(s)[0];s=open(s,key,actors[0],20000);
 const q=qs.getQuestion(s.active.questionId),before=s.players[0].score;
 s=g.mutate(s,{type:'submit-answer',answer:q.answer,doubleTake:true},actors[0],23000);
 assert.equal(s.players[0].score,before);assert.equal(s.players[0].doubleTakesRemaining,1);
 for(let i=1;i<4;i++)s=g.mutate(s,{type:'submit-answer',answer:i%2===0?q.answer:'not a correct answer'},actors[i],23000+i*100);
 assert.equal(s.phase,'results');assert.ok(s.players[0].score>200);assert.equal(s.players[1].score,0);
 assert.ok(s.resolution.answers[s.players[0].id].correct);
 s=g.tick(s,s.resolution.endsAt+1);assert.equal(s.phase,'board');assert.equal(s.chooserIndex,1);
});
test('individual per-player extra seconds accepted, then close after last deadline',()=>{
 let {s,actors}=setup();s=g.mutate(s,{type:'player-bonuses',playerId:s.players[0].id,bonusTimeSeconds:15,firstLetter:true,answerLength:true,bonusHints:2},{kind:'host'},5000);
 s=draft(s,actors);s=open(s,keys(s)[0],actors[0],20000);
 const deadline=s.active.deadlineAt;assert.ok(deadline);
 s=g.tick(s,deadline+2000);assert.equal(s.phase,'question');
 s=g.mutate(s,{type:'hint',kind:'first-letter'},actors[0],deadline+3000);
 const view=g.makeView(s,actors[0],6,deadline+3000);assert.equal(view.active.myFirstLetter,qs.getQuestion(s.active.questionId).answer[0].toUpperCase());
 assert.equal(g.makeView(s,actors[1],6,deadline+3000).active.myFirstLetter,undefined);
 s=g.mutate(s,{type:'submit-answer',answer:qs.getQuestion(s.active.questionId).answer},actors[0],deadline+4000);
 s=g.tick(s,deadline+15001);assert.equal(s.phase,'results');
});
test('team turn based wrong answer opens one steal, half points, then rotates',()=>{
 let {s,actors}=setup('teams',3);s=draft(s,actors);const key=keys(s)[0];s=open(s,key,actors[0],20000);
 s=g.mutate(s,{type:'submit-answer',answer:'definitely wrong'},actors[0],23000);assert.equal(s.phase,'question');assert.ok(s.active.stealTurn);assert.equal(s.active.stealId,actors[1].id);
 const q=qs.getQuestion(s.active.questionId);
 s=g.mutate(s,{type:'submit-answer',answer:q.answer},actors[1],23500);
 assert.equal(s.phase,'results');assert.equal(s.players[1].score,s.resolution.points/2);assert.equal(s.players[0].score,0);
 s=g.tick(s,s.resolution.endsAt+1);assert.equal(s.phase,'board');assert.equal(s.chooserIndex,1);
});
test('result dispute pauses auto transition and host may override',()=>{
 let {s,actors}=setup();s=draft(s,actors);s=open(s,keys(s)[0],actors[0],20000);
 for(let i=0;i<4;i++)s=g.mutate(s,{type:'submit-answer',answer:'oops'},actors[i],23000+i*10);
 s=g.mutate(s,{type:'dispute'},actors[0],24000);assert.equal(s.resolution.disputeIds.length,1);
 s=g.tick(s,50000);assert.equal(s.phase,'results');s=g.mutate(s,{type:'resolve-dispute',playerId:s.players[0].id,correct:true},{kind:'host'},51000);
 assert.equal(s.resolution.disputeIds.length,0);assert.equal(s.players[0].score,s.resolution.points);
 s=g.tick(s,60000);assert.equal(s.phase,'board');
});
test('two full 5x4 rounds and final reveal',()=>{
 let {s,actors}=setup('individual',2);s=draft(s,actors);
 for(let r=0;r<2;r++){
  if(r===1){assert.equal(s.phase,'draft');s=draftFromRound(s,actors);}
  for(let i=0;i<20;i++){const k=keys(s).find(k=>!s.usedKeys.includes(k));s=open(s,k,actors[s.chooserIndex%2],50000+r*500000+i*12000);
   const t=50000+r*500000+i*12000+2700;
   s=g.mutate(s,{type:'submit-answer',answer:'incorrect'},actors[0],t);
   s=g.mutate(s,{type:'submit-answer',answer:'incorrect'},actors[1],t+100);
   s=g.tick(s,s.resolution.endsAt+1);
  }
 }
 assert.equal(s.phase,'final-wager');assert.equal(s.selected[0].length,5);assert.equal(s.selected[1].length,5);
 assert.equal(new Set([...s.selected[0],...s.selected[1]]).size,10);
 s=g.mutate(s,{type:'wager',amount:0},actors[0],999999);
 s=g.mutate(s,{type:'start-final'},{kind:'host'},999999);
 s=g.tick(s,999999+s.settings.finalSeconds*1000+1);assert.equal(s.phase,'final-results');s=g.tick(s,s.final.endsAt+1);assert.equal(s.phase,'finished');
 function draftFromRound(state,players){for(let i=0;i<5;i++)state=g.mutate(state,{type:'draft-category',categoryId:state.draftPool[i]},players[(i+state.round*5)%players.length],10000+i);return state;}
});
test('intro only exposes the category/value, never the question or answer',()=>{
 let {s,actors}=setup();s=draft(s,actors);s=g.mutate(s,{type:'open-question',key:keys(s)[0]},actors[0],20000);
 const publicView=g.makeView(s,{kind:'spectator'},3,20001);
 assert.equal(publicView.phase,'intro');assert.equal(publicView.active,undefined);assert.ok(publicView.intro?.category);
 const questionView=g.makeView(g.tick(s,23000),{kind:'spectator'},4,23000);
 assert.ok(questionView.active?.prompt);assert.equal(questionView.active.hostAnswer,undefined);
});
test('host may switch Suno soundtrack during an active show, while mode stays fixed',()=>{
 let {s,actors}=setup();s=draft(s,actors);
 s=g.mutate(s,{type:'settings',settings:{music:'retro',arrangement:1}},{kind:'host'},20000);
 assert.equal(s.settings.music,'retro');assert.equal(s.settings.arrangement,1);
 assert.throws(()=>g.mutate(s,{type:'settings',settings:{mode:'teams'}},{kind:'host'},20001),/Only music can change/);
});
test('first-letter assistance is private and opt-in',()=>{
 let {s,actors}=setup();const id=s.players[0].id;
 s=g.mutate(s,{type:'player-bonuses',playerId:id,firstLetter:true},{kind:'host'},5000);
 s=draft(s,actors);s=open(s,keys(s)[0],actors[0],20000);
 assert.equal(g.makeView(s,actors[0],1,23000).active.myFirstLetter,undefined);
 s=g.mutate(s,{type:'hint',kind:'first-letter'},actors[0],23100);
 assert.equal(g.makeView(s,actors[1],2,23100).active.myFirstLetter,undefined);
 assert.ok(g.makeView(s,actors[0],2,23100).active.myFirstLetter);
});
test('a wrong Double Take is consumed without a point penalty',()=>{
 let {s,actors}=setup();s=draft(s,actors);s=open(s,keys(s)[0],actors[0],20000);
 s=g.mutate(s,{type:'submit-answer',answer:'definitely invalid',doubleTake:true},actors[0],23000);
 assert.equal(s.players[0].doubleTakesRemaining,1);
 assert.equal(s.players[0].score,0);
 for(let i=1;i<4;i++)s=g.mutate(s,{type:'submit-answer',answer:'nope'},actors[i],23100+i);
 assert.equal(s.players[0].score,0);
});
test('host can dismiss a dispute on a question with no submitted answer',()=>{
 let {s,actors}=setup();s=draft(s,actors);s=open(s,keys(s)[0],actors[0],20000);
 s=g.tick(s,s.active.deadlineAt+1000);assert.equal(s.phase,'results');
 s=g.mutate(s,{type:'dispute'},actors[0],s.resolution.finishedAt+400);
 assert.equal(s.resolution.disputeIds.length,1);
 s=g.mutate(s,{type:'dismiss-dispute',playerId:actors[0].id},{kind:'host'},51000);
 assert.equal(s.resolution.disputeIds.length,0);
});
test('pause stops timer and resume shifts deadline',()=>{
 let {s,actors}=setup();s=draft(s,actors);s=open(s,keys(s)[0],actors[0],20000);
 const end=s.active.deadlineAt;
 s=g.mutate(s,{type:'pause'},{kind:'host'},26000);assert.ok(s.pausedAt);
 s=g.tick(s,80000);assert.equal(s.phase,'question');
 s=g.mutate(s,{type:'pause'},{kind:'host'},81000);
 assert.equal(s.active.deadlineAt,end+55000);
});

const device=require('../.engine-build/device-session.js');
test('a single device can keep host and player credentials independently',()=>{
 const credentials={hostToken:'private-host-token',playerToken:'personal-player-token'};
 assert.equal(device.actorToken('host',credentials),'private-host-token');
 assert.equal(device.actorToken('player',credentials),'personal-player-token');
 assert.equal(device.actorToken('tv',credentials),'');
 assert.equal(device.actorToken('player',{hostToken:'private-host-token',playerToken:''}),'');
});
test('host can join as a contestant and perform each action under the appropriate role',()=>{
 let s=g.makeGame();
 const host={kind:'host'};
 const joined=g.joinGame(s,'Host Playing',34,1100);s=joined.state;
 const contestant={kind:'player',id:joined.player.id};
 const other=g.joinGame(s,'Other Player',13,1200);s=other.state;
 s=g.mutate(s,{type:'player-bonuses',playerId:contestant.id,bonusHints:2},host,1300);
 assert.equal(s.players.find(p=>p.id===contestant.id).bonusHints,2);
 s=draft(s,[contestant,{kind:'player',id:other.player.id}]);
 s=open(s,keys(s)[0],contestant,21000);
 assert.equal(g.makeView(s,host,1,24000).role.kind,'host');
 assert.equal(g.makeView(s,contestant,1,24000).yourPlayer,contestant.id);
 assert.equal(g.makeView(s,host,1,24000).active.hostAnswer,undefined,'Host must not receive question answer during play');
 assert.equal(g.makeView(s,host,1,24000).active.myWrittenHint,undefined,'Host must not receive hidden question hint');
 const answer=qs.getQuestion(s.active.questionId).answer;
 s=g.mutate(s,{type:'submit-answer',answer},contestant,24100);
 s=g.mutate(s,{type:'submit-answer',answer:'not correct'}, {kind:'player',id:other.player.id},24200);
 assert.equal(s.phase,'results');
 assert.ok(s.players.find(p=>p.id===contestant.id).score>0);
});
test('host-playing participant cannot see Final Word answer in advance',()=>{
 let {s,actors}=setup('individual',2);
 s=draft(s,actors);
 s.phase='final-wager';s.final={id:qs.FINALS[0].id,wagers:{},answers:{},disputeIds:[]};
 assert.equal(g.makeView(s,{kind:'host'},1,2000).final.answer,undefined);
 s=g.mutate(s,{type:'start-final'},{kind:'host'},3000);
 assert.equal(g.makeView(s,{kind:'host'},2,3100).final.answer,undefined);
});

test('host can adjust accommodations only in lobby or while paused, preserving used hints',()=>{
 let {s,actors}=setup();const id=s.players[0].id;
 s=draft(s,actors);s=open(s,keys(s)[0],actors[0],20000);
 s=g.mutate(s,{type:'hint',kind:'written'},actors[0],23100);
 assert.equal(s.players[0].hintsRemaining,2);
 assert.throws(()=>g.mutate(s,{type:'player-bonuses',playerId:id,bonusHints:2},{kind:'host'},23200),/Pause the game/);
 const before=s.active.deadlineAt;
 s=g.mutate(s,{type:'pause'},{kind:'host'},23300);
 s=g.mutate(s,{type:'player-bonuses',playerId:id,bonusHints:2,firstLetter:true,bonusTimeSeconds:15,answerLength:true},{kind:'host'},23500);
 assert.equal(s.players[0].hintsRemaining,4);
 assert.equal(s.players[0].firstLetter,true);
 assert.equal(s.players[0].answerLength,true);
 assert.equal(s.players[0].bonusTimeSeconds,15);
 s=g.mutate(s,{type:'player-bonuses',playerId:id,bonusHints:1},{kind:'host'},24000);
 assert.equal(s.players[0].hintsRemaining,3);
 assert.equal(s.players[0].bonusHints,1);
 s=g.mutate(s,{type:'pause'},{kind:'host'},24500);
 assert.equal(s.active.deadlineAt,before+1200);
 const view=g.makeView(s,actors[0],9,24600);
 assert.equal(view.active.myDeadlineAt,s.active.deadlineAt+15000);
});
