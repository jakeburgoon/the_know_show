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
test('age alone does not grant extra hints; max 8 and duplicate names rejected',()=>{
  let s=makeGame();const a=join(s,'Ari',10);s=a.state;const b=join(s,'Bee',16);s=b.state;
  assert.equal(s.players.find(p=>p.id===a.player.id).hintsRemaining,3);
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
test('host-assigned head start blocks other players regardless of their ages; buzz locks question',()=>{
  let s=makeGame();const a=join(s,'Ari',30);s=a.state;const b=join(s,'Bee',10);s=b.state;
  s=act(s,{type:'player-bonuses',playerId:a.player.id,buzzBonusSeconds:5});
  s=act(s,{type:'start-draft'});
  for(let i=0;i<12;i++)s=act(s,{type:'draft-category',categoryId:CATEGORIES[i].id},host);
  const key=`${s.selected[0][0]}:0`;
  s=act(s,{type:'open-clue',key},host,1_000_000);
  assert.equal(makeView(s,as(b.player),1).clue.meEligibleAt,1_005_000);
  assert.throws(()=>act(s,{type:'buzz'},as(b.player),1_000_001),/head start/);
  s=act(s,{type:'buzz'},as(a.player),1_000_100);
  assert.equal(s.clue.buzzedBy,a.player.id);
  assert.throws(()=>act(s,{type:'buzz'},as(b.player),1_000_200));
});

test('host independently gives bonus hints and buzz time to any number of contestants',()=>{
  let s=makeGame();const all=[];
  for(let i=0;i<6;i++){const j=join(s,`Guest ${i}`,10+i*5);s=j.state;all.push(j.player);}
  s=act(s,{type:'settings',settings:{normalHints:4}});
  for(let i=0;i<all.length;i++)s=act(s,{type:'player-bonuses',playerId:all[i].id,bonusHints:i,buzzBonusSeconds:i*2});
  for(let i=0;i<all.length;i++){
    const p=s.players.find(p=>p.id===all[i].id);
    assert.equal(p.hintsRemaining,4+i);
    assert.equal(p.buzzBonusSeconds,i*2);
  }
  assert.throws(()=>act(s,{type:'player-bonuses',playerId:all[0].id,bonusHints:21}),/between 0 and 20/);
  assert.throws(()=>act(s,{type:'player-bonuses',playerId:all[0].id,buzzBonusSeconds:31}),/between 0 and 30/);
  assert.throws(()=>act(s,{type:'player-bonuses',playerId:all[0].id,bonusHints:2},as(all[0])),/Only the host/);
  s=act(s,{type:'start-draft'});
  assert.throws(()=>act(s,{type:'player-bonuses',playerId:all[0].id,bonusHints:1}),/before the category draft/);
});

test('staggered buzz bonuses remain correct when a previous player missed',()=>{
  let s=makeGame();const aa=join(s,'Ari',25);s=aa.state;const bb=join(s,'Bee',12);s=bb.state;const cc=join(s,'Cee',8);s=cc.state;
  s=act(s,{type:'player-bonuses',playerId:aa.player.id,buzzBonusSeconds:5});
  s=act(s,{type:'player-bonuses',playerId:bb.player.id,buzzBonusSeconds:3});
  s=act(s,{type:'start-draft'});
  for(let i=0;i<12;i++)s=act(s,{type:'draft-category',categoryId:CATEGORIES[i].id},host);
  const key=`${s.selected[0][0]}:0`;
  s=act(s,{type:'open-clue',key},host,1_000_000);
  assert.equal(makeView(s,as(aa.player),1).clue.meEligibleAt,1_000_000);
  assert.equal(makeView(s,as(bb.player),1).clue.meEligibleAt,1_002_000);
  assert.equal(makeView(s,as(cc.player),1).clue.meEligibleAt,1_005_000);
  assert.equal(makeView(s,as(cc.player),1).clue.buzzDeadlineAt,1_025_000);
  assert.throws(()=>act(s,{type:'buzz'},as(cc.player),1_004_999));
  s=act(s,{type:'buzz'},as(aa.player),1_001_000);
  s=act(s,{type:'submit-answer',answer:'oops'},as(aa.player),1_001_001);
  s=act(s,{type:'rule',verdict:'wrong'},host,1_001_002);
  // The 5-second contender already used their attempt. B gets first access, C after 3 seconds.
  assert.equal(makeView(s,as(bb.player),2).clue.meEligibleAt,1_001_002);
  assert.equal(makeView(s,as(cc.player),2).clue.meEligibleAt,1_004_002);
  s=act(s,{type:'buzz'},as(bb.player),1_001_500);
  assert.equal(s.clue.buzzedBy,bb.player.id);
});

test('full buzz window remains open after all player head starts have elapsed',()=>{
  let s=makeGame();const aa=join(s,'Ari',10);s=aa.state;const bb=join(s,'Bee',8);s=bb.state;
  s=act(s,{type:'player-bonuses',playerId:aa.player.id,buzzBonusSeconds:30});
  s=act(s,{type:'start-draft'});
  for(let i=0;i<12;i++)s=act(s,{type:'draft-category',categoryId:CATEGORIES[i].id},host);
  s=act(s,{type:'open-clue',key:`${s.selected[0][0]}:0`},host,1_000_000);
  assert.equal(makeView(s,as(bb.player),1).clue.buzzDeadlineAt,1_050_000);
  assert.throws(()=>act(s,{type:'buzz'},as(bb.player),1_029_999));
  s=act(s,{type:'buzz'},as(bb.player),1_040_000);
  assert.equal(s.clue.buzzedBy,bb.player.id);
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
test('ages recommend different categories but never restrict the category draft',()=>{
  let s=makeGame();s=join(s,'Ada',9).state;s=join(s,'Ben',35).state;
  const family=makeView(s,host,0).categories.filter(c=>c.suggested).map(c=>c.id);
  assert.ok(family.includes('colors'));
  s=act(s,{type:'start-draft'});
  const hard=CATEGORIES.find(c=>!family.includes(c.id));
  s=act(s,{type:'draft-category',categoryId:hard.id},host);
  assert.equal(s.selected[0][0],hard.id);
  let adult=makeGame();adult=join(adult,'Ada',25).state;adult=join(adult,'Ben',35).state;
  const adults=makeView(adult,host,0).categories.filter(c=>c.suggested).map(c=>c.id);
  assert.notDeepEqual(adults,family);
});

test('individual bonuses carry into a second game',()=>{
  let s=makeGame();const a=join(s,'Ari',35);s=a.state;const b=join(s,'Bee',7);s=b.state;
  s=act(s,{type:'player-bonuses',playerId:a.player.id,bonusHints:6,buzzBonusSeconds:10});
  s.phase='finished';s=act(s,{type:'new-game'});
  assert.equal(s.phase,'lobby');
  const p=s.players.find(p=>p.id===a.player.id);
  assert.equal(p.hintsRemaining,9);assert.equal(p.bonusHints,6);assert.equal(p.buzzBonusSeconds,10);
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
