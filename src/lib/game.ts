import { randomInt, randomUUID } from 'node:crypto';
import { CATEGORIES, CATEGORY_LOOKUP, FINALS, getQuestion, questionsForAudience } from './questions';

export const MAX_SEATS=8;
export const ROUND_NAMES=['The Opening Act','The Main Event'] as const;
export const ROUND_VALUES=[[100,200,300,400],[200,400,600,800]] as const;
export type Phase='lobby'|'draft'|'board'|'intro'|'question'|'results'|'final-wager'|'final-question'|'final-results'|'finished';
export type Mode='individual'|'teams';
export type QuestionSet='family'|'general'|'challenging';
export type MusicStyle='jazz'|'indie'|'retro'|'game'|'bluegrass'|'cinematic'|'off';
export type DisplayMode='tv'|'phones';
export type Settings={mode:Mode;questionSet:QuestionSet;answerSeconds:number;finalSeconds:number;normalHints:number;music:MusicStyle;arrangement:0|1;effects:boolean;displayMode?:DisplayMode};
export type Player={id:string;name:string;age?:number;score:number;hintsRemaining:number;bonusHints:number;bonusTimeSeconds:number;firstLetter:boolean;answerLength:boolean;joinedAt:number;doubleTakesRemaining:number};
export type Submission={answer:string;at:number;correct:boolean;points:number;doubleTake:boolean;hintUsed:boolean};
export type ActiveQuestion={key:string;questionId:string;introUntilAt:number;startedAt?:number;deadlineAt?:number;answers:Record<string,Submission>;hintUsers:string[];letterUsers:string[];lengthUsers:string[];turnId?:string;stealId?:string;stealTurn?:boolean};
export type Resolution={key:string;questionId:string;answer:string;category:string;points:number;answers:Record<string,Submission>;finishedAt:number;endsAt:number;disputeIds:string[];skipped?:boolean};
export type FinalState={id:string;wagers:Record<string,number>;answers:Record<string,Submission>;startedAt?:number;deadlineAt?:number;endsAt?:number;disputeIds:string[]};
export type GameState={schemaVersion:2;id:string;createdAt:number;phase:Phase;settings:Settings;players:Player[];round:0|1;selected:[string[],string[]];draftPool:string[];draftIndex:number;usedKeys:string[];questionMap:Record<string,string>;chooserIndex:number;active?:ActiveQuestion;resolution?:Resolution;final?:FinalState;pausedAt?:number;announcement?:string;eventLog:string[]};
export type Actor={kind:'host'|'player'|'spectator';id?:string};
export type Action=
 |{type:'settings';settings:Partial<Settings>}
 |{type:'player-bonuses';playerId:string;bonusHints?:number;bonusTimeSeconds?:number;firstLetter?:boolean;answerLength?:boolean}
 |{type:'start-draft'}|{type:'draft-category';categoryId:string}
 |{type:'open-question';key:string}|{type:'submit-answer';answer:string;doubleTake?:boolean}
 |{type:'hint';kind:'first-letter'|'answer-length'|'written'}|{type:'pass'}
 |{type:'dispute'}|{type:'resolve-dispute';playerId:string;correct:boolean}|{type:'dismiss-dispute';playerId:string}|{type:'skip-question'}
 |{type:'pause'}|{type:'adjust-score';playerId:string;delta:number}
 |{type:'start-final'}|{type:'wager';amount:number}|{type:'final-answer';answer:string}|{type:'finish'}|{type:'new-game'};
export class GameError extends Error {constructor(message:string){super(message);this.name='GameError';}}
function assert(x:unknown,message:string):asserts x {if(!x)throw new GameError(message);}
const log=(s:GameState,m:string)=>{s.announcement=m;s.eventLog=[m,...s.eventLog].slice(0,30);};
const shuffle=<T,>(a:readonly T[])=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=randomInt(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;};
function player(s:GameState,a:Actor):Player {assert(a.kind==='player'&&a.id,'Join the show to play.');const p=s.players.find(x=>x.id===a.id);assert(p,'Player is not in this room.');return p;}
const host=(a:Actor)=>assert(a.kind==='host','Only the host may do that.');
const currentPlayer=(s:GameState)=>s.players[s.chooserIndex % s.players.length];
const roundPoints=(s:GameState,key:string)=>ROUND_VALUES[s.round][Number(key.split(':')[1])]||0;
export function defaultSettings():Settings{return {mode:'individual',questionSet:'general',answerSeconds:20,finalSeconds:45,normalHints:3,music:'jazz',arrangement:0,effects:false,displayMode:'tv'};}
export function makeGame():GameState{return {schemaVersion:2,id:randomUUID(),createdAt:Date.now(),phase:'lobby',settings:defaultSettings(),players:[],round:0,selected:[[],[]],draftPool:[],draftIndex:0,usedKeys:[],questionMap:{},chooserIndex:0,eventLog:[]};}
export function joinGame(original:GameState,name:string,age?:number,now=Date.now()) {
 assert(original.phase==='lobby','The show has already started.');assert(original.players.length<MAX_SEATS,'The room is full.');
 const n=String(name||'').trim().replace(/\s+/g,' ').slice(0,28);assert(n.length>=2,'Enter a name of at least two characters.');
 assert(!original.players.some(p=>p.name.toLowerCase()===n.toLowerCase()),'That name is already in use.');
 const s=structuredClone(original);const p:Player={id:randomUUID(),name:n,score:0,hintsRemaining:s.settings.normalHints,bonusHints:0,bonusTimeSeconds:0,firstLetter:false,answerLength:false,joinedAt:now,doubleTakesRemaining:2};s.players.push(p);log(s,`${n} joined the show.`);return {state:s,player:p};
}
const normalize=(str:string)=>str.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/^[\s]*(?:(?:what|who|which|where)\s+(?:is|are|was|were)\s+|(?:it is|the answer is)\s+)/,'').replace(/[’']/g,'').replace(/\b(?:a|an|the)\b/g,' ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
function distance(a:string,b:string){const prev=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let left=prev[0];prev[0]=i;for(let j=1;j<=b.length;j++){const old=prev[j];prev[j]=Math.min(prev[j]+1,prev[j-1]+1,left+(a[i-1]===b[j-1]?0:1));left=old;}}return prev[b.length];}
export function isCorrect(given:string,answer:string,aliases:string[]=[]):boolean {
 const g=normalize(given);if(!g)return false;
 return [answer,...aliases].some(candidate=>{const a=normalize(candidate);if(g===a)return true;
   // Only accept spelling near-misses on reasonably long answers. No substring matching.
   if(a.length<6||g.length<5||Math.abs(a.length-g.length)>2)return false;
   const allowance=a.length>=9?2:1;
   return distance(a,g)<=allowance;
 });
}
function pickPool(s:GameState){
 const excluded=new Set([...s.selected[0],...s.selected[1]]);
 const audience=s.settings.questionSet ?? 'general';
 const allowed=CATEGORIES.filter(c=>!excluded.has(c.id)&&[1,2,3,4].every(n=>questionsForAudience(c.questionsByLevel[String(n)]??[],audience).length>=2));
 const total=s.players.length<=3?8:s.players.length<=5?10:12;
 const familyFavorites=new Set(['animals','animals_classic','space','games','movies','movies_tv','food','food_classic','colors','counting','classroom','sports_classic','us_geography','biology']);
 const challengeFavorites=new Set(['astronomy','space','chemistry','biology','world_history','us_history','world_geography','physics','words','history','math','literature','inventions','us_geography']);
 function choose(type:'classic'|'creative',count:number){
   const candidates=allowed.filter(c=>c.type===type);
   if(audience==='general')return shuffle(candidates).slice(0,count);
   const theme=audience==='family'?familyFavorites:challengeFavorites;
   const prioritized=shuffle(candidates.filter(c=>theme.has(c.id)));
   const first=prioritized.slice(0,Math.min(prioritized.length,Math.ceil(count*.65)));
   return [...first,...shuffle(candidates.filter(c=>!first.includes(c))).slice(0,count-first.length)];
 }
 const classic=choose('classic',Math.round(total*.6));
 const creative=choose('creative',total-classic.length);
 return shuffle([...classic,...creative]).map(c=>c.id);
}
function goDraft(s:GameState){s.players.forEach(p=>p.doubleTakesRemaining=2);s.phase='draft';s.draftIndex=0;s.draftPool=pickPool(s);s.resolution=undefined;s.active=undefined;log(s,`Select five categories for ${ROUND_NAMES[s.round]}.`);}
function nextQuestionChoices(s:GameState){for(const id of s.selected[s.round])for(let level=0;level<4;level++){
 const key=`${id}:${level}`,c=CATEGORY_LOOKUP.get(id)!;const audience=s.settings.questionSet ?? 'general';const eligible=questionsForAudience(c.questionsByLevel[String(level+1)],audience);
 const tailored=eligible.filter(q=>q.audiences?.length===1&&q.audiences[0]===audience);
 // The specialized pool should usually win, but leave general alternatives
 // available so the same category can be played again with fresh questions.
 const pool=tailored.length&&randomInt(100)<80?[...shuffle(tailored),...shuffle(eligible.filter(q=>!tailored.includes(q)))]:shuffle(eligible);
 const already=new Set(Object.values(s.questionMap).map(id=>getQuestion(id)?.answer.toLowerCase()));s.questionMap[key]=(pool.find(q=>!already.has(q.answer.toLowerCase()))??pool[0]).id;
}}
function closeQuestion(s:GameState,now:number,skipped=false){
 const a=s.active!;const q=getQuestion(a.questionId)!;
 const resolution:Resolution={key:a.key,questionId:a.questionId,answer:q.answer,category:CATEGORY_LOOKUP.get(q.categoryId)!.name,
   points:roundPoints(s,a.key),answers:a.answers,finishedAt:now,endsAt:now+6500,disputeIds:[],skipped};
 for(const [id,submission] of Object.entries(a.answers)){const p=s.players.find(x=>x.id===id);if(p)p.score+=submission.points;}
 s.usedKeys.push(a.key);s.resolution=resolution;s.active=undefined;s.phase='results';s.chooserIndex++;
 log(s,skipped?'Question skipped.':`The answer is ${q.answer}.`);
}
function correctPoints(s:GameState,a:ActiveQuestion,p:Player,at:number,doubleTake=false){
 const base=roundPoints(s,a.key);
 if(s.settings.mode==='teams')return a.stealTurn?Math.floor(base/2):base;
 const duration=s.settings.answerSeconds*1000;
 const elapsed=Math.max(0,at-(a.startedAt??at));
 const bonus=duration?Math.round(base*0.25*Math.max(0,1-elapsed/duration)/5)*5:0;
 return base*(doubleTake?2:1)+bonus;
}
function storeSubmission(s:GameState,p:Player,answer:string,now:number,useDoubleTake=false){
 const a=s.active!,q=getQuestion(a.questionId)!;
 assert(answer.length>0&&answer.length<=200,'Enter an answer (up to 200 characters).');
 assert(!a.answers[p.id],'You already submitted an answer.');
 const correct=isCorrect(answer,q.answer,q.aliases??[]);
 if(useDoubleTake){assert(s.settings.mode==='individual'&&p.doubleTakesRemaining>0,'No Double Takes remaining.');p.doubleTakesRemaining--;}
 const points=correct?correctPoints(s,a,p,now,useDoubleTake):0;
 a.answers[p.id]={answer,at:now,correct,points,doubleTake:useDoubleTake,hintUsed:a.hintUsers.includes(p.id)};
 if(s.settings.mode==='teams') {
   if(correct||a.stealTurn||s.players.length<2)closeQuestion(s,now);
   else nextSteal(s,now);
 }else if(s.players.every(pl=>a.answers[pl.id]))closeQuestion(s,now);
}
function nextSteal(s:GameState,now:number){const a=s.active!;a.stealTurn=true;a.stealId=s.players[(s.chooserIndex+1)%s.players.length].id;a.startedAt=now;a.deadlineAt=now+Math.max(10,s.settings.answerSeconds+(s.players.find(p=>p.id===a.stealId)?.bonusTimeSeconds||0))*1000;log(s,`${s.players.find(p=>p.id===a.stealId)!.name} has one chance to steal.`);}
function finishFinal(s:GameState,now:number){
 const f=s.final!;for(const p of s.players){const r=f.answers[p.id];if(r)p.score+=r.points;else {const loss=f.wagers[p.id]||0;p.score-=loss;f.answers[p.id]={answer:'(no answer)',at:now,correct:false,points:-loss,doubleTake:false,hintUsed:false};}}
 s.phase='final-results';f.endsAt=now+12000;log(s,'Final answers are in.');
}
function shiftTimers(s:GameState,delta:number){if(s.active){s.active.introUntilAt+=delta;if(s.active.startedAt)s.active.startedAt+=delta;if(s.active.deadlineAt)s.active.deadlineAt+=delta;}if(s.resolution)s.resolution.endsAt+=delta;if(s.final){if(s.final.startedAt)s.final.startedAt+=delta;if(s.final.deadlineAt)s.final.deadlineAt+=delta;if(s.final.endsAt)s.final.endsAt+=delta;}}
export function tick(original:GameState,now=Date.now()):GameState {
 if(original.schemaVersion!==2)throw new GameError('This room was created in an older version. Create a new v0.2 room.');
 if(original.pausedAt)return original;
 const s:GameState=structuredClone(original);
 if(s.phase==='intro'&&s.active&&now>=s.active.introUntilAt){s.phase='question';s.active.startedAt=s.active.introUntilAt;const p=s.players.find(p=>p.id===s.active?.turnId);s.active.deadlineAt=s.active.introUntilAt+(s.settings.answerSeconds+(s.settings.mode==='teams'?(p?.bonusTimeSeconds||0):0))*1000;}
 if(s.phase==='question'&&s.active){const a=s.active;
   if(s.settings.mode==='individual'){
     const all=s.players.every(p=>a.answers[p.id]);const maxBonus=Math.max(0,...s.players.map(p=>p.bonusTimeSeconds));
     if(all||now>=(a.deadlineAt??now)+maxBonus*1000)closeQuestion(s,now);
   }else if(now>=(a.deadlineAt??now)){
     if(a.stealTurn||s.players.length<2)closeQuestion(s,now);
     else nextSteal(s,now);
   }
 }
 if(s.phase==='results'&&s.resolution&&!s.resolution.disputeIds.length&&now>=s.resolution.endsAt){
   if(s.usedKeys.filter(k=>s.selected[s.round].includes(k.split(':')[0])).length===20){
     if(s.round===0){s.round=1;goDraft(s);}else{s.phase='final-wager';s.final={id:shuffle(FINALS.filter(f=>f.tier===((s.settings.questionSet??'general')==='family'?'family':(s.settings.questionSet??'general')==='challenging'?'adult':'teen')))[0].id,wagers:{},answers:{},disputeIds:[]};log(s,'The Final Word: Place your wagers.');}
   }else{s.phase='board';s.resolution=undefined;}
 }
 if(s.phase==='final-question'&&s.final){if(s.players.every(p=>s.final!.answers[p.id])||now>=(s.final.deadlineAt??now))finishFinal(s,now);}
 if(s.phase==='final-results'&&s.final&&!s.final.disputeIds.length&&now>=(s.final.endsAt??now)){s.phase='finished';log(s,'That’s a wrap!');}
 return s;
}
export function mutate(original:GameState,action:Action,actor:Actor,now=Date.now()):GameState {
 assert(action&&typeof action.type==='string','Invalid action.');let s:GameState=structuredClone(tick(original,now));
 switch(action.type){
 case 'settings':{
   host(actor);const opts=action.settings;
   assert(s.phase==='lobby'||Object.keys(opts).every(k=>['music','arrangement','effects','displayMode'].includes(k)), 'Only display and sound settings can change during the show.');
   if(opts.mode!==undefined){assert(['individual','teams'].includes(opts.mode),'Invalid mode.');s.settings.mode=opts.mode;}
   if(opts.questionSet!==undefined){assert(['family','general','challenging'].includes(opts.questionSet),'Invalid question set.');s.settings.questionSet=opts.questionSet;}
   for(const k of ['answerSeconds','finalSeconds','normalHints'] as const){const v=opts[k];if(v!==undefined){assert(Number.isInteger(v)&&v>=0&&v<=(k==='normalHints'?10:120),`Invalid ${k}.`);s.settings[k]=v;}}
   if(opts.displayMode!==undefined){assert(['tv','phones'].includes(opts.displayMode),'Invalid display mode.');s.settings.displayMode=opts.displayMode;}
   if(opts.music!==undefined){assert(['jazz','indie','retro','game','bluegrass','cinematic','off'].includes(opts.music),'Invalid music.');s.settings.music=opts.music;}
   if(opts.arrangement!==undefined){assert(opts.arrangement===0||opts.arrangement===1,'Invalid arrangement.');s.settings.arrangement=opts.arrangement;}
   if(opts.effects!==undefined){assert(typeof opts.effects==='boolean','Invalid effects choice.');s.settings.effects=opts.effects;}
   if(opts.normalHints!==undefined)for(const p of s.players)p.hintsRemaining=s.settings.normalHints+p.bonusHints;
   break;
 }
 case 'player-bonuses':{
   host(actor);assert(s.phase==='lobby'||!!s.pausedAt,'Pause the game before changing player accommodations.');const p=s.players.find(p=>p.id===action.playerId);assert(p,'Player not found.');
   if(action.bonusHints!==undefined){assert(Number.isInteger(action.bonusHints)&&action.bonusHints>=0&&action.bonusHints<=10,'Invalid bonus hints.');const difference=action.bonusHints-p.bonusHints;p.bonusHints=action.bonusHints;p.hintsRemaining=Math.max(0,p.hintsRemaining+difference);}
   if(action.bonusTimeSeconds!==undefined){assert(Number.isInteger(action.bonusTimeSeconds)&&action.bonusTimeSeconds>=0&&action.bonusTimeSeconds<=30,'Invalid time bonus.');p.bonusTimeSeconds=action.bonusTimeSeconds;}
   if(action.firstLetter!==undefined){assert(typeof action.firstLetter==='boolean','Invalid first-letter setting.');p.firstLetter=action.firstLetter;}
   if(action.answerLength!==undefined){assert(typeof action.answerLength==='boolean','Invalid answer-length setting.');p.answerLength=action.answerLength;}break;
 }
 case 'start-draft':{
   host(actor);assert(s.phase==='lobby'&&s.players.length>=2,'At least two players or teams are required.');goDraft(s);break;
 }
 case 'draft-category':{
   assert(s.phase==='draft','The category draft is closed.');const id=action.categoryId;
   assert(s.draftPool.includes(id),'Choose a category from the available draft.');assert(!s.selected[s.round].includes(id),'Already selected.');
   const chooser=s.players[(s.draftIndex+s.round*5)%s.players.length];assert(actor.kind==='host'||actor.id===chooser.id,`It is ${chooser.name}’s turn.`);
   s.selected[s.round].push(id);s.draftIndex++;log(s,`${chooser.name} selected ${CATEGORY_LOOKUP.get(id)!.name}.`);
   if(s.selected[s.round].length===5){nextQuestionChoices(s);s.phase='board';s.chooserIndex=s.round===0?0:5;log(s,`${ROUND_NAMES[s.round]} begins!`);}break;
 }
 case 'open-question':{
   assert(s.phase==='board','The board is not ready.');assert(actor.kind==='host'||actor.id===currentPlayer(s).id,'Another player is choosing.');
   const key=action.key;const [id,tier]=key.split(':');assert(s.selected[s.round].includes(id)&&/^[0-3]$/.test(tier)&&s.questionMap[key],'Not a question on this board.');assert(!s.usedKeys.includes(key),'That question was already played.');
   s.active={key,questionId:s.questionMap[key],introUntilAt:now+2500,answers:{},hintUsers:[],letterUsers:[],lengthUsers:[],turnId:currentPlayer(s).id};s.phase='intro';log(s,`${CATEGORY_LOOKUP.get(id)!.name} for ${roundPoints(s,key)}!`);break;
 }
 case 'hint':{
   const p=player(s,actor);assert(!s.pausedAt,'Game is paused.');assert(s.phase==='question'&&!!s.active,'No question is open.');const a=s.active;
   assert(s.settings.mode==='individual'||(a.stealTurn?a.stealId===p.id:a.turnId===p.id),'It is not your team’s turn.');
   assert(!a.answers[p.id],'You have already answered.');
   if(action.kind==='written'){assert(p.hintsRemaining>0,'No hints remaining.');assert(!a.hintUsers.includes(p.id),'Already used a hint on this question.');p.hintsRemaining--;a.hintUsers.push(p.id);}
   else if(action.kind==='first-letter'){assert(p.firstLetter,'First-letter assistance is not enabled.');a.letterUsers.push(p.id);}
   else if(action.kind==='answer-length'){assert(p.answerLength,'Answer-length assistance is not enabled.');a.lengthUsers.push(p.id);}else throw new GameError('Unknown hint.');break;
 }
 case 'submit-answer':{
   const p=player(s,actor);assert(!s.pausedAt,'Game is paused.');assert(s.phase==='question'&&!!s.active,'Question is not accepting answers.');const a=s.active;
   if(s.settings.mode==='teams')assert((a.stealTurn?a.stealId:a.turnId)===p.id,'It is not your team’s turn.');
   const effectiveDeadline=(a.deadlineAt??0)+(s.settings.mode==='individual'?p.bonusTimeSeconds*1000:0);
   assert(!effectiveDeadline||now<=effectiveDeadline,'Your answer time has expired.');
   storeSubmission(s,p,String(action.answer||'').trim(),now,Boolean(action.doubleTake));break;
 }
 case 'pass':{
   const p=player(s,actor);assert(s.phase==='question'&&!!s.active&&s.settings.mode==='teams','Passing is only available for teams.');
   assert((s.active.stealTurn?s.active.stealId:s.active.turnId)===p.id,'Not your team’s turn.');
   if(s.active.stealTurn)closeQuestion(s,now);else nextSteal(s,now);break;
 }
 case 'dispute':{
   const p=player(s,actor);assert(['results','final-results'].includes(s.phase),'A result can only be disputed after answers are revealed.');
   const ids=s.phase==='results'?s.resolution?.disputeIds:s.final?.disputeIds;assert(ids,'No results.');assert(!ids.includes(p.id),'You already requested review.');
   if(s.phase==='results'){s.resolution!.disputeIds.push(p.id);}else{s.final!.disputeIds.push(p.id);}log(s,`${p.name} requested a ruling review.`);break;
 }
 case 'resolve-dispute':{
   host(actor);assert(s.phase==='results'||s.phase==='final-results','No results to review.');const p=s.players.find(p=>p.id===action.playerId);assert(p,'Player not found.');
   const r=s.phase==='results'?s.resolution?.answers[p.id]:s.final?.answers[p.id];
   assert(r,'No submitted answer for this player.');
   if(r.correct!==action.correct){p.score-=r.points;r.correct=action.correct;
     if(s.phase==='results'){const a=s.resolution!;const base=roundPoints(s,a.key);r.points=action.correct?(s.settings.mode==='individual'?base*(r.doubleTake?2:1):base):0;
       // Overrides award only the base: do not award a speculative speed bonus.
     }else{r.points=action.correct?(s.final?.wagers[p.id]??0):-(s.final?.wagers[p.id]??0);}
     p.score+=r.points;
   }
   if(s.phase==='results'){s.resolution!.disputeIds=s.resolution!.disputeIds.filter(id=>id!==p.id);s.resolution!.endsAt=now+5000;}
   else{s.final!.disputeIds=s.final!.disputeIds.filter(id=>id!==p.id);s.final!.endsAt=now+8000;}
   log(s,`Host reviewed ${p.name}’s answer.`);break;
 }
 case 'dismiss-dispute':{
   host(actor);assert(s.phase==='results'||s.phase==='final-results','No result dispute to dismiss.');
   if(s.phase==='results'&&s.resolution){s.resolution.disputeIds=s.resolution.disputeIds.filter(id=>id!==action.playerId);s.resolution.endsAt=now+5000;}
   if(s.phase==='final-results'&&s.final){s.final.disputeIds=s.final.disputeIds.filter(id=>id!==action.playerId);s.final.endsAt=now+8000;}
   log(s,'Host closed a dispute.');break;
 }
 case 'skip-question':{
   host(actor);assert(s.phase==='question'||s.phase==='intro','No active question.');
   // Revert any points already awarded, so skipping doesn't advantage quick submissions.
   for(const [id,a] of Object.entries(s.active!.answers)){const p=s.players.find(x=>x.id===id);if(p&&a.doubleTake)p.doubleTakesRemaining++;}
   s.active!.answers={};closeQuestion(s,now,true);break;
 }
 case 'pause':{
   host(actor);if(s.pausedAt){shiftTimers(s,now-s.pausedAt);s.pausedAt=undefined;log(s,'Game resumed.');}
   else{s.pausedAt=now;log(s,'Game paused.');}break;
 }
 case 'adjust-score':{
   host(actor);assert(Number.isInteger(action.delta)&&Math.abs(action.delta)<=5000,'Enter a whole-number adjustment of at most 5000 points.');
   const p=s.players.find(p=>p.id===action.playerId);assert(p,'Player not found.');p.score+=action.delta;log(s,`${p.name}'s score adjusted by ${action.delta}.`);break;
 }
 case 'start-final':{
   host(actor);assert(s.phase==='final-wager'&&!!s.final,'Final wagers are not open.');
   s.players.forEach(p=>{if(s.final!.wagers[p.id]===undefined)s.final!.wagers[p.id]=0;});s.final.startedAt=now;s.final.deadlineAt=now+s.settings.finalSeconds*1000;s.phase='final-question';log(s,'The Final Word begins!');break;
 }
 case 'wager':{
   const p=player(s,actor);assert(s.phase==='final-wager'&&!!s.final,'Final wagering has closed.');
   assert(Number.isInteger(action.amount)&&action.amount>=0&&action.amount<=Math.max(0,p.score),'Wager must be between zero and your score.');s.final.wagers[p.id]=action.amount;break;
 }
 case 'final-answer':{
   const p=player(s,actor);assert(s.phase==='final-question'&&!!s.final,'Final answers are closed.');assert(now<=(s.final.deadlineAt??0),'The final timer has ended.');assert(!s.final.answers[p.id],'You already answered.');
   const q=FINALS.find(q=>q.id===s.final!.id)!;const ans=String(action.answer||'').trim();assert(ans.length>0&&ans.length<=200,'Enter an answer.');
   const correct=isCorrect(ans,q.answer,q.aliases||[]);const points=(s.final.wagers[p.id]??0)*(correct?1:-1);
   s.final.answers[p.id]={answer:ans,at:now,correct,points,doubleTake:false,hintUsed:false};
   if(s.players.every(p=>s.final!.answers[p.id]))finishFinal(s,now);break;
 }
 case 'finish':{host(actor);assert(s.phase==='final-results'&&!s.final?.disputeIds.length,'Resolve all disputes before finishing.');s.phase='finished';break;}
 case 'new-game':{
   host(actor);assert(s.phase==='finished','Finish this show first.');const n=makeGame();n.id=s.id;n.createdAt=s.createdAt;n.settings=s.settings;n.players=s.players.map(p=>({...p,score:0,hintsRemaining:n.settings.normalHints+p.bonusHints,doubleTakesRemaining:2}));return n;
 }
 default:throw new GameError('Unknown action type.');
 }
 return s;
}
export function makeView(original:GameState,actor:Actor,revision:number,now=Date.now()){
 const s=tick(original,now),me=actor.kind==='player'?s.players.find(p=>p.id===actor.id):undefined;
 const q=s.active?getQuestion(s.active.questionId):undefined;
 const intro=s.active&&q?{key:s.active.key,category:CATEGORY_LOOKUP.get(q.categoryId)?.name,points:roundPoints(s,s.active.key),until:s.active.introUntilAt}:undefined;
 const current=s.phase==='question'&&s.active&&q?{
   ...intro,prompt:q.prompt,startedAt:s.active.startedAt,deadlineAt:s.active.deadlineAt,stealTurn:!!s.active.stealTurn,
   answeringId:s.active.stealTurn?s.active.stealId:s.active.turnId,
   submissionCount:Object.keys(s.active.answers).length,
   mySubmission:me?s.active.answers[me.id]?.answer:undefined,
   myDeadlineAt:me?(s.active.deadlineAt??0)+me.bonusTimeSeconds*1000:undefined,
   myWrittenHint:(me&&s.active.hintUsers.includes(me.id))?q.hint:undefined,
   myFirstLetter:(me&&s.active.letterUsers.includes(me.id))?q.answer.trim().charAt(0).toUpperCase():undefined,
   myAnswerLength:(me&&s.active.lengthUsers.includes(me.id))?q.answer.replace(/[^a-zA-Z]/g,'').length:undefined,
   // Never send the answer before reveal—even to the host, who may also be playing.
   hostAnswer:undefined,
 }:undefined;
 const res=s.resolution?{...s.resolution,answers:Object.fromEntries(Object.entries(s.resolution.answers).map(([id,a])=>[id,{...a}]))}:undefined;
 const finalQ=s.final?FINALS.find(f=>f.id===s.final?.id):undefined;
 const f=s.final&&finalQ?{
   category:finalQ.category,prompt:['final-question','final-results','finished'].includes(s.phase)?finalQ.prompt:undefined,
   answer:['final-results','finished'].includes(s.phase)?finalQ.answer:undefined,
   deadlineAt:s.final.deadlineAt,endsAt:s.final.endsAt,wagerCount:Object.keys(s.final.wagers).length,answerCount:Object.keys(s.final.answers).length,
   myWager:me?s.final.wagers[me.id]:undefined,myAnswer:me?s.final.answers[me.id]?.answer:undefined,
   results:['final-results','finished'].includes(s.phase)?s.players.map(p=>({id:p.id,name:p.name,answer:s.final!.answers[p.id]?.answer||'(no answer)',correct:s.final!.answers[p.id]?.correct||false,points:s.final!.answers[p.id]?.points||0,wager:s.final!.wagers[p.id]??0})):undefined,
   disputeIds:s.final.disputeIds,
 }:undefined;
 return {revision,serverNow:now,phase:s.phase,roomId:s.id,role:actor,settings:{...s.settings,displayMode:s.settings.displayMode??'tv'},players:s.players,round:s.round,
 roundNames:ROUND_NAMES,roundValues:ROUND_VALUES,selected:s.selected,usedKeys:s.usedKeys,chooserId:currentPlayer(s)?.id,
 categories:CATEGORIES.map(c=>({id:c.id,name:c.name,description:c.description,type:c.type})),draftPool:s.draftPool,draftIndex:s.draftIndex,
 draftTurnId:s.players.length?s.players[(s.draftIndex+s.round*5)%s.players.length]?.id:undefined,
 active:current,intro,results:res,final:f,myHints:me?.hintsRemaining,paused:!!s.pausedAt,announcement:s.announcement,eventLog:s.eventLog.slice(0,10),
 yourPlayer:me?.id,
 };
}
export type GameView=ReturnType<typeof makeView>;
