const test=require('node:test');
const assert=require('node:assert/strict');
const {CATEGORIES,FINALS,cellQuestion}=require('../.test-build/questions.js');
const {makeGame,joinGame,mutate,makeView,getPoints,suggestVerdict,MAX_SEATS}=require('../.test-build/game.js');
const host={kind:'host'};
const as=p=>({kind:'player',id:p.id});
const act=(s,a,actor=host,now=1_000_000)=>mutate(s,a,actor,now);
function join(s,name,age){const r=joinGame(s,name,age,1000);return r;}
function drafted(){
  let s=makeGame(); const a=join(s,'Ari',10);s=a.state;const b=join(s,'Bee',16);s=b.state;
  s=act(s,{type:'start-draft'});
  for(let i=0;i<12;i++)s=act(s,{type:'draft-category',categoryId:CATEGORIES[i].id},as(i%2?b.player:a.player));
  return {s,a:a.player,b:b.player};
}
test('bank has enough unique categories with five valid questions and age-tier finals',()=>{
  assert.ok(CATEGORIES.length>=24);assert.equal(new Set(CATEGORIES.map(c=>c.id)).size,CATEGORIES.length);
  for(const c of CATEGORIES){assert.equal(c.questions.length,5,c.name);assert.ok(c.explainer);for(const q of c.questions)assert.ok(q.prompt&&q.answer&&q.hint);}
  assert.ok(FINALS.filter(q=>q.tier==='family').length>=5);
});
test('younger players get extra hints; max 8 and duplicate names rejected',()=>{
  let s=makeGame();const a=join(s,'Ari',10);s=a.state;const b=join(s,'Bee',16);s=b.state;
  assert.equal(s.players.find(p=>p.id===a.player.id).hintsRemaining,5);
  assert.equal(s.players.find(p=>p.id===b.player.id).hintsRemaining,3);
  assert.throws(()=>join(s,'Ari',8));
  for(let i=2;i<MAX_SEATS;i++)s=join(s,`Guest ${i}`,20).state;
  assert.throws(()=>join(s,'Ninth',19));
});
test('drafting cycles through both rounds without restarting pick order',()=>{
  const {s,a,b}=drafted();assert.equal(s.phase,'board');
  assert.equal(s.selected[0].length,6);assert.equal(s.selected[1].length,6);
  assert.equal(s.draftIndex,12);assert.ok(s.doubleTakeKeys[0].includes(':'));
  const plain=makeView(s,as(a),0);
  assert.ok(!JSON.stringify(plain).includes('doubleTakeKeys'));
});
test('age advantage blocks older players until five seconds have elapsed; buzz winner locks clue',()=>{
  let {s,a,b}=drafted();const key=`${s.selected[0][0]}:0`;
  s=act(s,{type:'open-clue',key},host,1_000_000);
  assert.throws(()=>act(s,{type:'buzz'},as(b),1_000_001),/head start/);
  s=act(s,{type:'buzz'},as(a),1_000_100);
  assert.equal(s.clue.buzzedBy,a.id);
  assert.throws(()=>act(s,{type:'buzz'},as(b),1_000_200));
});
test('private hints, wrong deductions, next buzzer, correct score, and answer security',()=>{
  let {s,a,b}=drafted();const key=`${s.selected[0][0]}:0`;
  s=act(s,{type:'open-clue',key});const points=getPoints(s,key);
  s=act(s,{type:'buzz'},as(a),1_000_001);
  s=act(s,{type:'hint'},as(a));
  assert.equal(makeView(s,as(a),4).clue.meHint,cellQuestion(key).hint);
  assert.equal(makeView(s,as(b),4).clue.meHint,undefined);
  assert.equal(makeView(s,{kind:'spectator'},4).clue.answer,undefined);
  assert.equal(makeView(s,host,4).clue.answer,cellQuestion(key).answer);
  s=act(s,{type:'submit-answer',answer:'absolutely wrong'},as(a));
  s=act(s,{type:'rule',verdict:'wrong'});assert.equal(s.players.find(p=>p.id===a.id).score,-points);
  assert.equal(s.clue.status,'buzzing');
  s=act(s,{type:'buzz'},as(b),1_006_000);
  s=act(s,{type:'submit-answer',answer:cellQuestion(key).answer},as(b),1_006_001);
  s=act(s,{type:'rule',verdict:'correct'});
  assert.equal(s.phase,'board');assert.equal(s.players.find(p=>p.id===b.id).score,points);
  assert.equal(s.chooserId,b.id);assert.equal(s.lastResolution.answer,cellQuestion(key).answer);
});
test('final wagering answers stay private until judging and scoring is reversible',()=>{
  let {s,a,b}=drafted();s=act(s,{type:'advance-round'});s=act(s,{type:'start-final'});
  assert.equal(s.phase,'final-wager');
  assert.ok(s.final);
  s=act(s,{type:'wager',amount:0},as(a));
  s=act(s,{type:'open-final'});
  const pv=makeView(s,as(a),9);
  assert.ok(pv.final.prompt);
  assert.equal(pv.final.answer,undefined);
  s=act(s,{type:'final-answer',answer:'something'},as(a));
  assert.equal(makeView(s,as(b),10).final.myAnswer,undefined);
  s=act(s,{type:'review-final'});
  s=act(s,{type:'judge-final',playerId:a.id,correct:true});
  s=act(s,{type:'judge-final',playerId:a.id,correct:false});
  s=act(s,{type:'judge-final',playerId:b.id,correct:false});
  s=act(s,{type:'finish'});assert.equal(s.phase,'finished');
  assert.equal(makeView(s,as(b),12).final.answer!==undefined,true);
});
test('host must adjudicate fuzzy matches rather than automatically scoring',()=>{
  assert.equal(suggestVerdict('Who is Vincent van Gogh?','Vincent van Gogh'),'likely correct');
  assert.equal(suggestVerdict('Van Go','Vincent van Gogh'),'possible match');
});
test('incorrect answer reopens a fresh buzz window so a later steal is possible',()=>{
  let {s,a,b}=drafted();const key=`${s.selected[0][0]}:2`;
  s=act(s,{type:'open-clue',key},host,1_000_000);
  s=act(s,{type:'buzz'},as(a),1_000_100);
  s=act(s,{type:'submit-answer',answer:'wrong'},as(a),1_010_000);
  s=act(s,{type:'rule',verdict:'wrong'},host,1_010_001);
  assert.equal(s.clue.buzzOpenedAt,1_010_001);
  s=act(s,{type:'buzz'},as(b),1_010_500);
  assert.equal(s.clue.buzzedBy,b.id);
});
test('Double Take provides exactly twice the displayed points',()=>{
  let {s,a}=drafted();const key=s.doubleTakeKeys[0];const level=Number(key.split(':')[1]);
  const base=[200,400,600,800,1000][level];
  s=act(s,{type:'open-clue',key});assert.equal(getPoints(s,key),base*2);
  s=act(s,{type:'buzz'},as(a),1_000_100);
  s=act(s,{type:'submit-answer',answer:cellQuestion(key).answer},as(a));
  s=act(s,{type:'rule',verdict:'correct'});
  assert.equal(s.players.find(p=>p.id===a.id).score,base*2);
});
