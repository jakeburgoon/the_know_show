import { randomInt, randomUUID, createHash } from 'node:crypto';
import { CATEGORIES, CATEGORY_LOOKUP, CATEGORY_FINALS, FINALS, availableCategories, getQuestion } from './questions';

export const MAX_SEATS=8;
export const FINAL_HINT_PRICE=500;
export const MAX_FINAL_HINTS=2;
export const ROUND_NAMES=['Round 1','Round 2'] as const;
export const ROUND_VALUES=[[100,300,500],[200,600,1000]] as const;
export type Phase='lobby'|'draft'|'board'|'intro'|'question'|'results'|'final-wager'|'final-question'|'final-results'|'finished'|'closed';
export type Mode='individual'|'teams';
export type MusicStyle='jazz'|'indie'|'retro'|'game'|'bluegrass'|'cinematic'|'off';
export type DisplayMode='tv'|'phones';
export type ChoiceAccess='off'|'all'|'medium-hard'|'hard';
export type AnswerStyle='written'|'choices'|'mixed';
export type Settings={mode:Mode;answerSeconds:number;finalSeconds:number;normalHints:number;music:MusicStyle;arrangement:0|1;effects:boolean;displayMode?:DisplayMode;answerStyle?:AnswerStyle;playerMusic?:boolean};
export type Player={id:string;name:string;age?:number;score:number;hintsRemaining:number;bonusHints:number;bonusTimeSeconds:number;choiceAccess?:ChoiceAccess;joinedAt:number;doubleTakesRemaining:number};
export type Submission={answer:string;at:number;correct:boolean;points:number;doubleTake:boolean;hintUsed:boolean;answerFormat?:'written'|'choices'};
export type ActiveQuestion={drafts?:Record<string,{answer:string;doubleTake:boolean}>;key:string;questionId:string;introUntilAt:number;startedAt?:number;deadlineAt?:number;answers:Record<string,Submission>;hintUsers:string[];turnId?:string;stealId?:string;stealTurn?:boolean};
export type Resolution={key:string;questionId:string;answer:string;category:string;points:number;answers:Record<string,Submission>;finishedAt:number;endsAt:number;disputeIds:string[];skipped?:boolean;noShow?:boolean};
export type FinalState={drafts?:Record<string,string>;purchasedHints?:Record<string,number>;purchasedHintsUsed?:Record<string,number>;revealedHints?:Record<string,number>;id:string;wagers:Record<string,number>;answers:Record<string,Submission>;startedAt?:number;deadlineAt?:number;endsAt?:number;disputeIds:string[];noShow?:boolean};
export type GameState={schemaVersion:3;id:string;createdAt:number;phase:Phase;settings:Settings;players:Player[];round:0|1;selected:[string[],string[]];draftPool:string[];draftIndex:number;usedKeys:string[];questionMap:Record<string,string>;chooserIndex:number;active?:ActiveQuestion;resolution?:Resolution;final?:FinalState;pausedAt?:number;announcement?:string;eventLog:string[];recentQuestionIds:string[];recentCategoryIds?:string[];recentCategoryOffers?:string[];hostHistoryId?:string;musicChangedAt?:number};
export type Actor={kind:'host'|'player'|'spectator';id?:string};
export type Action=
 |{type:'settings';settings:Partial<Settings>}
 |{type:'choose-music';music:MusicStyle;arrangement:0|1}
 |{type:'player-bonuses';playerId:string;bonusHints?:number;bonusTimeSeconds?:number;choiceAccess?:ChoiceAccess}
 |{type:'start-draft'}|{type:'draft-category';categoryId:string}
 |{type:'open-question';key:string}|{type:'submit-answer';answer:string;doubleTake?:boolean}
 |{type:'save-draft';answer:string;scope:'question'|'final';doubleTake?:boolean}
 |{type:'hint';kind:'written'}|{type:'pass'}
 |{type:'dispute'}|{type:'resolve-dispute';playerId:string;correct:boolean}|{type:'dismiss-dispute';playerId:string}|{type:'skip-question'}
 |{type:'pause'}|{type:'adjust-score';playerId:string;delta:number}
 |{type:'start-final'}|{type:'buy-final-hint'}|{type:'final-hint'}|{type:'wager';amount:number}|{type:'final-answer';answer:string}|{type:'finish'}|{type:'new-game'}|{type:'close-show'};
export class GameError extends Error {constructor(message:string){super(message);this.name='GameError';}}
function assert(x:unknown,message:string):asserts x {if(!x)throw new GameError(message);}
const log=(s:GameState,m:string)=>{s.announcement=m;s.eventLog=[m,...s.eventLog].slice(0,30);};
const shuffle=<T,>(a:readonly T[])=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=randomInt(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;};
function player(s:GameState,a:Actor):Player {assert(a.kind==='player'&&a.id,'Join the show to play.');const p=s.players.find(x=>x.id===a.id);assert(p,'Player is not in this room.');return p;}
const host=(a:Actor)=>assert(a.kind==='host','Only the host may do that.');
const currentPlayer=(s:GameState)=>s.players[s.chooserIndex % s.players.length];
const roundPoints=(s:GameState,key:string)=>ROUND_VALUES[s.round][Number(key.split(':')[1])]||0;
export function choicesEnabled(access:ChoiceAccess|undefined,level:number):boolean {
 return access==='all'||(access==='medium-hard'&&level>=1)||(access==='hard'&&level>=2);
}
function answerOptions(answer:string,distractors:string[]|undefined,questionId:string,playerId:string):string[]{
 // All choices are server-authorized and ordered deterministically per player,
 // so polling or switching tabs cannot reshuffle an active question.
 const options=[answer,...(distractors??[])];
 assert(options.length===4&&new Set(options.map(x=>normalize(x))).size===4,'This question needs four distinct answer choices.');
 return options.sort((a,b)=>createHash('sha256').update(`${questionId}:${playerId}:${a}`).digest('hex').localeCompare(createHash('sha256').update(`${questionId}:${playerId}:${b}`).digest('hex')));
}
export function defaultSettings():Settings{return {mode:'individual',answerSeconds:20,finalSeconds:45,normalHints:3,music:'jazz',arrangement:0,effects:false,displayMode:'tv',answerStyle:'written',playerMusic:true};}
// Most-recent-last histories; reselecting a category moves it to the back of the queue.
function rememberRecent(history:readonly string[], values:readonly string[], limit:number):string[]{
 const known=new Set(values);return [...history.filter(id=>!known.has(id)),...values].slice(-limit);
}
export const QUESTION_HISTORY_LIMIT=CATEGORIES.reduce((total,c)=>total+Object.values(c.questionsByLevel).reduce((n,level)=>n+level.length,0),0)+CATEGORY_FINALS.length;
export function makeGame(recentQuestionIds:string[]=[],recentCategoryIds:string[]=[],recentCategoryOffers:string[]=[],hostHistoryId?:string):GameState{
 const valid=new Set(CATEGORIES.map(c=>c.id));
 return {schemaVersion:3,id:randomUUID(),createdAt:Date.now(),phase:'lobby',settings:defaultSettings(),players:[],round:0,selected:[[],[]],draftPool:[],draftIndex:0,usedKeys:[],questionMap:{},chooserIndex:0,eventLog:[],
  recentQuestionIds:recentQuestionIds.filter(x=>typeof x==='string'&&(!!getQuestion(x)||FINALS.some(f=>f.id===x))).slice(-QUESTION_HISTORY_LIMIT),
  recentCategoryIds:recentCategoryIds.filter(id=>typeof id==='string'&&valid.has(id)).slice(-56),
  recentCategoryOffers:recentCategoryOffers.filter(id=>typeof id==='string'&&valid.has(id)).slice(-56),
  hostHistoryId:hostHistoryId&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(hostHistoryId)?hostHistoryId:undefined};
}
export function joinGame(original:GameState,name:string,age?:number,now=Date.now()) {
 assert(original.phase==='lobby','The show has already started.');assert(original.players.length<MAX_SEATS,'The room is full.');
 const n=String(name||'').trim().replace(/\s+/g,' ').slice(0,28);assert(n.length>=2,'Enter a name of at least two characters.');
 assert(!original.players.some(p=>p.name.toLowerCase()===n.toLowerCase()),'That name is already in use.');
 const s=structuredClone(original);const p:Player={id:randomUUID(),name:n,score:0,hintsRemaining:s.settings.normalHints,bonusHints:0,bonusTimeSeconds:0,choiceAccess:s.settings.answerStyle==='choices'?'all':'off',joinedAt:now,doubleTakesRemaining:1};s.players.push(p);log(s,`${n} joined the show.`);return {state:s,player:p};
}
const normalize=(str:string)=>str.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/^[\s]*(?:(?:what|who|which|where)\s+(?:is|are|was|were)\s+|(?:it is|the answer is)\s+)/,'').replace(/[’']/g,'').replace(/\b(?:a|an|the)\b/g,' ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
function distance(a:string,b:string){const prev=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let left=prev[0];prev[0]=i;for(let j=1;j<=b.length;j++){const old=prev[j];prev[j]=Math.min(prev[j]+1,prev[j-1]+1,left+(a[i-1]===b[j-1]?0:1));left=old;}}return prev[b.length];}
// Protect digits, ordinal numbers, and small words from permissive typos.
// Recognized equivalent wording belongs in each question's explicit alias list.
const numberWords:Record<string,string>={zero:'0',one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9',ten:'10',eleven:'11',twelve:'12',thirteen:'13',fourteen:'14',fifteen:'15',sixteen:'16',seventeen:'17',eighteen:'18',nineteen:'19',twenty:'20',first:'1st',second:'2nd',third:'3rd',fourth:'4th',fifth:'5th',sixth:'6th',seventh:'7th',eighth:'8th',ninth:'9th',tenth:'10th',eleventh:'11th',twelfth:'12th',thirteenth:'13th',fourteenth:'14th',fifteenth:'15th',sixteenth:'16th',seventeenth:'17th',eighteenth:'18th',nineteenth:'19th',twentieth:'20th'};
const romanNumerals=new Set(['i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','xii','xiii','xiv','xv']);
const protectedTerms=(s:string)=>normalize(s).split(' ').map(x=>numberWords[x]??x).filter(x=>/\d/.test(x)||romanNumerals.has(x));
export function isCorrect(given:string,answer:string,aliases:string[]=[]):boolean {
 const g=normalize(given);if(!g)return false;
 // These are distinct technical concepts even though their spellings are close.
 // The user must not earn credit for naming the opposite concept.
 const confusables=[['ectotherm','endotherm'],['ethology','ethnology'],['refraction','reflection']];
 if(confusables.some(([a,b])=>(g===a&&normalize(answer)===b)||(g===b&&normalize(answer)===a)))return false;
 return [answer,...aliases].some(candidate=>{
   const a=normalize(candidate);if(!a)return false;
   if(g===a)return true;
   if(a.length<6||g.length<5||Math.abs(a.length-g.length)>2)return false;
   const gn=protectedTerms(g),an=protectedTerms(a);
   if(gn.join('|')!==an.join('|'))return false;
   const allowance=a.length>=9?2:1;
   return distance(a,g)<=allowance;
 });
}
/** Treat every published distractor as incorrect, even when fuzzy typo matching
 * would otherwise confuse close but different words (e.g. Ming/Qing). */
export function isCorrectForQuestion(given:string,q:{answer:string;aliases?:string[];distractors?:string[]}):boolean {
 const input=normalize(given);
 if((q.distractors??[]).some(d=>normalize(d)===input))return false;
 return isCorrect(given,q.answer,q.aliases??[]);
}
/** A previously played or offered category remains possible: these weights
 * merely make more familiar/recently seen categories less likely to be offered.
 * We also protect the available question variety at each difficulty level. */
function categoryDraftWeight(s:GameState,c:(typeof CATEGORIES)[number]):number {
 const played=s.recentCategoryIds??[],offered=s.recentCategoryOffers??[];
 const playedAt=played.indexOf(c.id),offeredAt=offered.indexOf(c.id);
 let weight=1;
 if(playedAt!==-1){
  const stepsSince=played.length-1-playedAt;
  // Newly played: 25% weight; gradually recovers to 75% after ten other plays.
  weight*=0.25+0.50*Math.min(1,stepsSince/10);
 }
 if(offeredAt!==-1){
  const stepsSince=offered.length-1-offeredAt;
  // Merely appearing as a choice also cools a category down, but less strongly.
  weight*=0.70+0.28*Math.min(1,stepsSince/10);
 }
 const seen=new Set(s.recentQuestionIds);
 const questionLevels=[1,2,3].map(level=>c.questionsByLevel[String(level)]??[]);
 const remaining=questionLevels.reduce((count,questions)=>count+questions.filter(q=>!seen.has(q.id)).length,0);
 const total=questionLevels.reduce((count,questions)=>count+questions.length,0);
 // Categories with exhausted questions can return eventually, but have low odds.
 weight*=0.20+0.80*Math.pow(total?remaining/total:0,1.2);
 return Math.max(0.01,weight);
}
/** Sample without replacement, using cryptographic random draws for each offer. */
function weightedSample<T>(items:readonly T[],count:number,weight:(item:T)=>number):T[]{
 const available=[...items],result:T[]=[];
 while(available.length&&result.length<count){
  const weights=available.map(item=>Math.max(0.0001,weight(item)));
  const sum=weights.reduce((a,b)=>a+b,0);
  let target=(randomInt(1_000_000_000)/1_000_000_000)*sum;
  let index=weights.length-1;
  for(let i=0;i<weights.length;i++){target-=weights[i];if(target<0){index=i;break;}}
  result.push(available.splice(index,1)[0]);
 }
 return result;
}
function pickPool(s:GameState,now:number){
 const alreadySelected=new Set([...s.selected[0],...s.selected[1]]);
 const allowed=availableCategories(new Date(now)).filter(c=>!alreadySelected.has(c.id)&&[1,2,3].every(n=>(c.questionsByLevel[String(n)]??[]).length>=4));
 const total=Math.min(allowed.length,s.players.length<=3?7:s.players.length<=5?9:11);
 const seasonal=allowed.filter(c=>c.activeMonths?.length);
 const yearRound=allowed.filter(c=>!c.activeMonths?.length);
 const weight=(c:(typeof CATEGORIES)[number])=>categoryDraftWeight(s,c);
 // Always offer one in-season category when one is eligible, but let its
 // selection remain weighted, just like the year-round categories. Players
 // may choose regular categories exclusively; seasonality is never forced.
 const seasonalPick=seasonal.length?weightedSample(seasonal,1,weight):[];
 const standardPicks=weightedSample(yearRound,total-seasonalPick.length,weight);
 return [...seasonalPick,...standardPicks].map(c=>c.id);
}
function goDraft(s:GameState,now:number){
 s.players.forEach(p=>p.doubleTakesRemaining=1);s.phase='draft';s.draftIndex=0;s.draftPool=pickPool(s,now);
 s.recentCategoryOffers=rememberRecent(s.recentCategoryOffers??[],s.draftPool,56);
 s.resolution=undefined;s.active=undefined;log(s,`Select four categories for ${ROUND_NAMES[s.round]}.`);
}
function nextQuestionChoices(s:GameState){
 const taken=new Set<string>(Object.values(s.questionMap));
 const previous=new Set(s.recentQuestionIds);
 const recentAnswers=new Set(s.recentQuestionIds.slice(-120).map(id=>getQuestion(id)?.answer.toLowerCase().trim()).filter(Boolean));
 for(const id of s.selected[s.round])for(let level=0;level<3;level++){
   const key=`${id}:${level}`,c=CATEGORY_LOOKUP.get(id)!;
   const eligible=shuffle(c.questionsByLevel[String(level+1)]);
   // Prefer unseen questions; if exhausted, choose the oldest previously played question.
   const fresh=eligible.filter(q=>!previous.has(q.id)&&!taken.has(q.id));
   // Prefer an unseen question whose answer has not just appeared under another category.
   const chosen=fresh.find(q=>!recentAnswers.has(q.answer.toLowerCase().trim()))??fresh[0]
     ??eligible.filter(q=>!taken.has(q.id)).sort((a,b)=>s.recentQuestionIds.indexOf(a.id)-s.recentQuestionIds.indexOf(b.id))[0];
   assert(chosen,`No available question for ${c.name} level ${level+1}.`);
   s.questionMap[key]=chosen.id;taken.add(chosen.id);
 }
}
/** A no-show is only earned by a complete set of *incorrect attempts*.
 * Blank answers, timeouts, and host-skipped questions are not a no-show.
 * This also works for two-team questions where both teams actually answered.
 */
function everyoneMissed(s:GameState,answers:Record<string,Submission>):boolean {
 return s.players.length>=2&&s.players.every(p=>{
  const submission=answers[p.id];
  return Boolean(submission&&!submission.correct&&submission.answer.trim()&&submission.answer!=='(no answer)');
 });
}
function closeQuestion(s:GameState,now:number,skipped=false){
 const a=s.active!;const q=getQuestion(a.questionId)!;
 const noShow=!skipped&&everyoneMissed(s,a.answers);
 const resolution:Resolution={key:a.key,questionId:a.questionId,answer:q.answer,category:CATEGORY_LOOKUP.get(q.categoryId)!.name,
   points:roundPoints(s,a.key),answers:a.answers,finishedAt:now,endsAt:now+(noShow?11000:7500),disputeIds:[],skipped,noShow};
 for(const [id,submission] of Object.entries(a.answers)){const p=s.players.find(x=>x.id===id);if(p)p.score+=submission.points;}
 s.usedKeys.push(a.key);s.recentQuestionIds=[...s.recentQuestionIds.filter(id=>id!==q.id),q.id].slice(-QUESTION_HISTORY_LIMIT);s.resolution=resolution;s.active=undefined;s.phase='results';s.chooserIndex++;
 log(s,skipped?'Question skipped.':`The answer is ${q.answer}.`);
}
function correctPoints(s:GameState,a:ActiveQuestion,p:Player,at:number,doubleTake=false){
 const base=roundPoints(s,a.key);
 if(s.settings.mode==='teams')return a.stealTurn?Math.floor(base/2):base;
 const duration=s.settings.answerSeconds*1000;
 const elapsed=Math.max(0,at-(a.startedAt??at));
 const hasChoices=choicesEnabled(p.choiceAccess,Number(a.key.split(':')[1]));
 const maxSpeedBonus=hasChoices?0.10:0.25;
 const bonus=duration?Math.round(base*maxSpeedBonus*Math.max(0,1-elapsed/duration)/5)*5:0;
 return base*(doubleTake?2:1)+bonus;
}
function storeSubmission(s:GameState,p:Player,answer:string,now:number,useDoubleTake=false){
 const a=s.active!,q=getQuestion(a.questionId)!;
 assert(answer.length>0&&answer.length<=200,'Enter an answer (up to 200 characters).');
 assert(!a.answers[p.id],'You already submitted an answer.');
 const usesChoices=choicesEnabled(p.choiceAccess,Number(a.key.split(':')[1]));
 if(usesChoices)assert(answerOptions(q.answer,q.distractors,q.id,p.id).some(choice=>choice===answer),'Choose one of the displayed answers.');
 const correct=isCorrectForQuestion(answer,q);
 if(useDoubleTake){assert(s.settings.mode==='individual'&&p.doubleTakesRemaining>0,'No Double Takes remaining.');p.doubleTakesRemaining--;}
 const points=correct?correctPoints(s,a,p,now,useDoubleTake):0;
 a.answers[p.id]={answer,at:now,correct,points,doubleTake:useDoubleTake,hintUsed:a.hintUsers.includes(p.id),answerFormat:usesChoices?'choices':'written'};
 if(s.settings.mode==='teams') {
   if(correct||a.stealTurn||s.players.length<2)closeQuestion(s,now);
   else nextSteal(s,now);
 }else if(s.players.every(pl=>a.answers[pl.id]))closeQuestion(s,now);
}
function nextSteal(s:GameState,now:number){const a=s.active!;a.stealTurn=true;a.stealId=s.players[(s.chooserIndex+1)%s.players.length].id;a.startedAt=now;a.deadlineAt=now+Math.max(10,s.settings.answerSeconds+(s.players.find(p=>p.id===a.stealId)?.bonusTimeSeconds||0))*1000;log(s,`${s.players.find(p=>p.id===a.stealId)!.name} has one chance to steal.`);}
/**
 * Draw from the distinct Final Word bank. A Final Word category must NOT
 * appear anywhere on the board in this show. Prefer unused finales, and when
 * those are exhausted rotate back to the least recently used eligible ones.
 * Seasonal categories are eligible only when in season.
 */
export function chooseFinalQuestion(s:GameState,now:number){
 const activeIds=new Set(availableCategories(new Date(now)).map(c=>c.id));
 const currentBoard=new Set([...s.selected[0],...s.selected[1]]);
 const eligible=CATEGORY_FINALS.filter(q=>q.categoryId&&activeIds.has(q.categoryId)&&!currentBoard.has(q.categoryId));
 assert(eligible.length>0,'No eligible Final Word categories remain outside the current board.');
 const unseen=eligible.filter(q=>!s.recentQuestionIds.includes(q.id));
 if(unseen.length)return shuffle(unseen)[0];
 const historyOrder=new Map(s.recentQuestionIds.map((id,i)=>[id,i]));
 const age=(id:string)=>historyOrder.get(id)??-1;
 const oldest=Math.min(...eligible.map(q=>age(q.id)));
 // Multiple equally old questions can remain. Break the tie at random.
 return shuffle(eligible.filter(q=>age(q.id)===oldest))[0];
}

function finishFinal(s:GameState,now:number){
 const f=s.final!;for(const p of s.players){const r=f.answers[p.id];if(r)p.score+=r.points;else {const loss=f.wagers[p.id]||0;p.score-=loss;f.answers[p.id]={answer:'(no answer)',at:now,correct:false,points:-loss,doubleTake:false,hintUsed:Boolean(f.revealedHints?.[p.id])};}}
 s.recentQuestionIds=[...s.recentQuestionIds.filter(id=>id!==f.id),f.id].slice(-QUESTION_HISTORY_LIMIT);s.phase='final-results';f.noShow=everyoneMissed(s,f.answers);f.endsAt=now+(f.noShow?16500:13000);log(s,'Final answers are in.');
}
function shiftTimers(s:GameState,delta:number){if(s.active){s.active.introUntilAt+=delta;if(s.active.startedAt)s.active.startedAt+=delta;if(s.active.deadlineAt)s.active.deadlineAt+=delta;}if(s.resolution)s.resolution.endsAt+=delta;if(s.final){if(s.final.startedAt)s.final.startedAt+=delta;if(s.final.deadlineAt)s.final.deadlineAt+=delta;if(s.final.endsAt)s.final.endsAt+=delta;}}
export function tick(original:GameState,now=Date.now()):GameState {
 if(original.schemaVersion!==3)throw new GameError('This room uses older game rules. Please create a new v1.0 room.');
 if(original.pausedAt)return original;
 const s:GameState=structuredClone(original);
 if(s.phase==='intro'&&s.active&&now>=s.active.introUntilAt){s.phase='question';s.active.startedAt=s.active.introUntilAt;const p=s.players.find(p=>p.id===s.active?.turnId);s.active.deadlineAt=s.active.introUntilAt+(s.settings.answerSeconds+(s.settings.mode==='teams'?(p?.bonusTimeSeconds||0):0))*1000;}
 if(s.phase==='question'&&s.active){const a=s.active;
   if(s.settings.mode==='individual'){
     // The server, not the player's network latency, decides what was in the box at zero.
     // Auto-submissions receive no speed bonus and respect each player's extra time.
     for(const p of s.players){
       if(s.phase!=='question')break;
       const due=(a.deadlineAt??now)+p.bonusTimeSeconds*1000;
       const draft=a.drafts?.[p.id];
       if(!a.answers[p.id]&&now>=due&&draft?.answer.trim()&&!choicesEnabled(p.choiceAccess,Number(a.key.split(':')[1])))
         storeSubmission(s,p,draft.answer.trim(),due,draft.doubleTake);
     }
     if(s.phase==='question'){
       const all=s.players.every(p=>a.answers[p.id]);const maxBonus=Math.max(0,...s.players.map(p=>p.bonusTimeSeconds));
       if(all||now>=(a.deadlineAt??now)+maxBonus*1000)closeQuestion(s,now);
     }
   }else if(now>=(a.deadlineAt??now)){
     const p=s.players.find(p=>p.id===(a.stealTurn?a.stealId:a.turnId));
     const draft=p&&a.drafts?.[p.id];
     if(p&&draft?.answer.trim()&&!a.answers[p.id]&&!choicesEnabled(p.choiceAccess,Number(a.key.split(':')[1])))
       storeSubmission(s,p,draft.answer.trim(),a.deadlineAt??now);
     else if(a.stealTurn||s.players.length<2)closeQuestion(s,now);
     else nextSteal(s,now);
   }
 }
 if(s.phase==='results'&&s.resolution&&!s.resolution.disputeIds.length&&now>=s.resolution.endsAt){
   if(s.usedKeys.filter(k=>s.selected[s.round].includes(k.split(':')[0])).length===12){
     if(s.round===0){s.round=1;goDraft(s,now);}else{s.phase='final-wager';s.final={id:chooseFinalQuestion(s,now).id,wagers:{},answers:{},disputeIds:[]};log(s,'The Final Word: Place your wagers.');}
   }else{s.phase='board';s.resolution=undefined;}
 }
 if(s.phase==='final-question'&&s.final){
   if(now>=(s.final.deadlineAt??now)){
     const q=FINALS.find(q=>q.id===s.final!.id)!;
     for(const p of s.players){
       const draft=s.final.drafts?.[p.id]?.trim();
       if(!s.final.answers[p.id]&&draft){
         const correct=isCorrectForQuestion(draft,q),wager=s.final.wagers[p.id]??0;
         s.final.answers[p.id]={answer:draft,at:s.final.deadlineAt??now,correct,points:correct?wager:-wager,doubleTake:false,hintUsed:Boolean(s.final.revealedHints?.[p.id]),answerFormat:'written'};
       }
     }
   }
   if(s.players.every(p=>s.final!.answers[p.id])||now>=(s.final.deadlineAt??now))finishFinal(s,now);
 }
 if(s.phase==='final-results'&&s.final&&!s.final.disputeIds.length&&now>=(s.final.endsAt??now)){s.phase='finished';log(s,'That’s a wrap!');}
 return s;
}
export function mutate(original:GameState,action:Action,actor:Actor,now=Date.now()):GameState {
 assert(action&&typeof action.type==='string','Invalid action.');let s:GameState=structuredClone(tick(original,now));
 switch(action.type){
 case 'choose-music':{
   // A joined player may choose the shared room soundtrack when permitted by the host.
   // Music always plays from a single host/TV embed, not from every player phone.
   if(actor.kind!=='host'){
     player(s,actor);
     assert(s.settings.playerMusic!==false,'The host has reserved music selections.');
     assert(!s.musicChangedAt||now-s.musicChangedAt>=5000,'Music was just changed. Please try again in a few seconds.');
   }
   assert(['jazz','indie','retro','game','bluegrass','cinematic','off'].includes(action.music),'Invalid music track.');
   assert(action.arrangement===0||action.arrangement===1,'Invalid arrangement.');
   if(s.settings.music!==action.music||s.settings.arrangement!==action.arrangement){
     s.settings.music=action.music;s.settings.arrangement=action.arrangement;s.musicChangedAt=now;
   }
   break;
 }
 case 'settings':{
   host(actor);const opts=action.settings;
   assert(s.phase==='lobby'||Object.keys(opts).every(k=>['music','arrangement','effects','displayMode','playerMusic'].includes(k)), 'Only display and sound settings can change during the show.');
   if(opts.mode!==undefined){assert(['individual','teams'].includes(opts.mode),'Invalid mode.');s.settings.mode=opts.mode;}
   for(const k of ['answerSeconds','finalSeconds','normalHints'] as const){const v=opts[k];if(v!==undefined){assert(Number.isInteger(v)&&v>=0&&v<=(k==='normalHints'?10:120),`Invalid ${k}.`);s.settings[k]=v;}}
   if(opts.answerStyle!==undefined){assert(['written','choices','mixed'].includes(opts.answerStyle),'Invalid answer style.');s.settings.answerStyle=opts.answerStyle;for(const p of s.players)p.choiceAccess=opts.answerStyle==='choices'?'all':'off';}
   if(opts.displayMode!==undefined){assert(['tv','phones'].includes(opts.displayMode),'Invalid display mode.');s.settings.displayMode=opts.displayMode;}
   if(opts.music!==undefined){assert(['jazz','indie','retro','game','bluegrass','cinematic','off'].includes(opts.music),'Invalid music.');s.settings.music=opts.music;}
   if(opts.arrangement!==undefined){assert(opts.arrangement===0||opts.arrangement===1,'Invalid arrangement.');s.settings.arrangement=opts.arrangement;}
   if(opts.effects!==undefined){assert(typeof opts.effects==='boolean','Invalid effects choice.');s.settings.effects=opts.effects;}
   if(opts.playerMusic!==undefined){assert(typeof opts.playerMusic==='boolean','Invalid music permission.');s.settings.playerMusic=opts.playerMusic;}
   if(opts.normalHints!==undefined)for(const p of s.players)p.hintsRemaining=s.settings.normalHints+p.bonusHints;
   break;
 }
 case 'player-bonuses':{
   host(actor);assert(s.phase==='lobby'||!!s.pausedAt,'Pause the game before changing player accommodations.');const p=s.players.find(p=>p.id===action.playerId);assert(p,'Player not found.');
   if(action.bonusHints!==undefined){assert(Number.isInteger(action.bonusHints)&&action.bonusHints>=0&&action.bonusHints<=10,'Invalid bonus hints.');const difference=action.bonusHints-p.bonusHints;p.bonusHints=action.bonusHints;p.hintsRemaining=Math.max(0,p.hintsRemaining+difference);}
   if(action.bonusTimeSeconds!==undefined){assert(Number.isInteger(action.bonusTimeSeconds)&&action.bonusTimeSeconds>=0&&action.bonusTimeSeconds<=30,'Invalid time bonus.');p.bonusTimeSeconds=action.bonusTimeSeconds;}
   if(action.choiceAccess!==undefined){assert(['off','all','medium-hard','hard'].includes(action.choiceAccess),'Invalid choice availability.');p.choiceAccess=action.choiceAccess;}break;
 }
 case 'start-draft':{
   host(actor);assert(s.phase==='lobby'&&s.players.length>=2,'At least two players or teams are required.');goDraft(s,now);break;
 }
 case 'draft-category':{
   assert(s.phase==='draft','The category draft is closed.');const id=action.categoryId;
   assert(s.draftPool.includes(id),'Choose a category from the available draft.');assert(!s.selected[s.round].includes(id),'Already selected.');
   const chooser=s.players[(s.draftIndex+s.round*4)%s.players.length];assert(actor.kind==='host'||actor.id===chooser.id,`It is ${chooser.name}’s turn.`);
   s.selected[s.round].push(id);s.recentCategoryIds=rememberRecent(s.recentCategoryIds??[],[id],56);s.draftIndex++;log(s,`${chooser.name} selected ${CATEGORY_LOOKUP.get(id)!.name}.`);
   if(s.selected[s.round].length===4){nextQuestionChoices(s);s.phase='board';s.chooserIndex=s.round===0?0:4;log(s,`${ROUND_NAMES[s.round]} begins!`);}break;
 }
 case 'open-question':{
   assert(s.phase==='board','The board is not ready.');assert(actor.kind==='host'||actor.id===currentPlayer(s).id,'Another player is choosing.');
   const key=action.key;const [id,tier]=key.split(':');assert(s.selected[s.round].includes(id)&&/^[0-2]$/.test(tier)&&s.questionMap[key],'Not a question on this board.');assert(!s.usedKeys.includes(key),'That question was already played.');
   s.active={key,questionId:s.questionMap[key],introUntilAt:now+2500,answers:{},hintUsers:[],turnId:currentPlayer(s).id};s.phase='intro';log(s,`${CATEGORY_LOOKUP.get(id)!.name} for ${roundPoints(s,key)}!`);break;
 }
 case 'hint':{
   const p=player(s,actor);assert(!s.pausedAt,'Game is paused.');assert(s.phase==='question'&&!!s.active,'No question is open.');const a=s.active;
   assert(s.settings.mode==='individual'||(a.stealTurn?a.stealId===p.id:a.turnId===p.id),'It is not your team’s turn.');
   assert(!a.answers[p.id],'You have already answered.');
   if(action.kind==='written'){assert(p.hintsRemaining>0,'No hints remaining.');assert(!a.hintUsers.includes(p.id),'Already used a hint on this question.');p.hintsRemaining--;a.hintUsers.push(p.id);}else throw new GameError('Unknown hint.');break;
 }
 case 'save-draft':{
   const p=player(s,actor);
   assert(!s.pausedAt,'Game is paused.');
   const answer=String(action.answer??'').slice(0,200);
   assert(answer.length<=200,'Draft is too long.');
   if(action.scope==='question'){
     assert(s.phase==='question'&&!!s.active,'No question is open.');
     const a=s.active;
     assert(s.settings.mode==='individual'||(a.stealTurn?a.stealId:a.turnId)===p.id,'Not your turn.');
     assert(!choicesEnabled(p.choiceAccess,Number(a.key.split(':')[1])),'This player uses choices.');
     assert(!a.answers[p.id],'Already answered.');
     const due=(a.deadlineAt??0)+(s.settings.mode==='individual'?p.bonusTimeSeconds*1000:0);
     assert(!due||now<=due,'Answer time has expired.');
     (a.drafts??={})[p.id]={answer,doubleTake:!!action.doubleTake&&s.settings.mode==='individual'&&p.doubleTakesRemaining>0};
   }else if(action.scope==='final'){
     assert(s.phase==='final-question'&&!!s.final,'Final Word is not open.');
     assert(!s.final.answers[p.id],'Already answered.');
     assert(now<=(s.final.deadlineAt??0),'Final time has expired.');
     (s.final.drafts??={})[p.id]=answer;
   }else throw new GameError('Unknown draft type.');
   break;
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
   const submitted=s.phase==='results'?s.resolution?.answers[p.id]:s.final?.answers[p.id];
   assert(submitted&&!submitted.correct&&submitted.answer.trim()&&submitted.answer!=='(no answer)','Only submitted answers marked incorrect can be reviewed.');
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
   if(s.phase==='results'){s.resolution!.disputeIds=s.resolution!.disputeIds.filter(id=>id!==p.id);s.resolution!.noShow=!s.resolution!.skipped&&everyoneMissed(s,s.resolution!.answers);s.resolution!.endsAt=now+6000;}
   else{s.final!.disputeIds=s.final!.disputeIds.filter(id=>id!==p.id);s.final!.noShow=everyoneMissed(s,s.final!.answers);s.final!.endsAt=now+9000;}
   log(s,`Host reviewed ${p.name}’s answer.`);break;
 }
 case 'dismiss-dispute':{
   host(actor);assert(s.phase==='results'||s.phase==='final-results','No result dispute to dismiss.');
   if(s.phase==='results'&&s.resolution){s.resolution.disputeIds=s.resolution.disputeIds.filter(id=>id!==action.playerId);s.resolution.endsAt=now+6000;}
   if(s.phase==='final-results'&&s.final){s.final.disputeIds=s.final.disputeIds.filter(id=>id!==action.playerId);s.final.endsAt=now+9000;}
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
 case 'buy-final-hint':{
   const p=player(s,actor);assert(!s.pausedAt,'Game is paused.');assert(s.phase==='final-wager'&&!!s.final,'Final hint purchases are closed.');
   assert(s.final.wagers[p.id]===undefined,'Purchase hints before locking your wager.');
   const bought=s.final.purchasedHints?.[p.id]??0;
   // Final Word is a separate hint economy: regular-round hints never carry over.
   assert(bought<MAX_FINAL_HINTS,'You already purchased both Final Word hints.');
   assert(p.score>=FINAL_HINT_PRICE,'You need at least 500 points to buy a hint.');
   p.score-=FINAL_HINT_PRICE;(s.final.purchasedHints??={})[p.id]=bought+1;
   // Purchased hints are shown right away, while the question remains concealed.
   (s.final.purchasedHintsUsed??={})[p.id]=bought+1;
   (s.final.revealedHints??={})[p.id]=bought+1;
   break;
 }
 case 'final-hint':{
   const p=player(s,actor);assert(!s.pausedAt,'Game is paused.');assert(s.phase==='final-question'&&!!s.final,'Final Word hints are not available yet.');
   assert(!s.final.answers[p.id],'Your final answer is already locked.');
   assert(now<=(s.final.deadlineAt??0),'Final Word time has expired.');
   const shown=s.final.revealedHints?.[p.id]??0;
   assert(shown<MAX_FINAL_HINTS,'Both hints are already revealed.');
   const used=s.final.purchasedHintsUsed?.[p.id]??0;
   assert(used<(s.final.purchasedHints?.[p.id]??0),'No purchased Final Word hints remaining.');
   (s.final.purchasedHintsUsed??={})[p.id]=used+1;
   (s.final.revealedHints??={})[p.id]=shown+1;
   break;
 }
 case 'start-final':{
   host(actor);assert(s.phase==='final-wager'&&!!s.final,'Final wagers are not open.');
   s.players.forEach(p=>{if(s.final!.wagers[p.id]===undefined)s.final!.wagers[p.id]=0;});s.final.startedAt=now;s.final.deadlineAt=now+s.settings.finalSeconds*1000;s.phase='final-question';log(s,'The Final Word begins!');break;
 }
 case 'wager':{
   const p=player(s,actor);assert(s.phase==='final-wager'&&!!s.final,'Final wagering has closed.');
   assert(Number.isInteger(action.amount)&&action.amount>=0&&action.amount<=Math.max(0,p.score),'Wager must be between zero and your score.');s.final.wagers[p.id]=action.amount;
   if(s.players.every(pl=>s.final!.wagers[pl.id]!==undefined)){s.final.startedAt=now;s.final.deadlineAt=now+s.settings.finalSeconds*1000;s.phase='final-question';log(s,'The Final Word begins!');}
   break;
 }
 case 'final-answer':{
   const p=player(s,actor);assert(s.phase==='final-question'&&!!s.final,'Final answers are closed.');assert(now<=(s.final.deadlineAt??0),'The final timer has ended.');assert(!s.final.answers[p.id],'You already answered.');
   const q=FINALS.find(q=>q.id===s.final!.id)!;const ans=String(action.answer||'').trim();assert(ans.length>0&&ans.length<=200,'Enter an answer.');
   // Final Word is always independently typed, regardless of any regular-round accommodation.
   const correct=isCorrectForQuestion(ans,q);const points=(s.final.wagers[p.id]??0)*(correct?1:-1);
   s.final.answers[p.id]={answer:ans,at:now,correct,points,doubleTake:false,hintUsed:Boolean(s.final.revealedHints?.[p.id]),answerFormat:'written'};
   if(s.players.every(p=>s.final!.answers[p.id]))finishFinal(s,now);break;
 }
 case 'finish':{host(actor);assert(s.phase==='final-results'&&!s.final?.disputeIds.length,'Resolve all disputes before finishing.');s.phase='finished';break;}
 case 'new-game':{
   host(actor);assert(s.phase==='finished','Finish this show first.');// A rematch carries every played question and selected/offered category.
   // Include the selected categories for older rooms created before category histories existed.
   const categories=rememberRecent(s.recentCategoryIds??[],[...s.selected[0],...s.selected[1]],56);
   const n=makeGame(s.recentQuestionIds,categories,s.recentCategoryOffers??[],s.hostHistoryId);n.id=s.id;n.createdAt=s.createdAt;n.settings={...s.settings};n.players=s.players.map(p=>({...p,score:0,hintsRemaining:n.settings.normalHints+p.bonusHints,doubleTakesRemaining:1}));log(n,'Rematch! Same players and settings. Get ready for a new show.');return n;
 }
 case 'close-show':{
   host(actor);assert(s.phase==='finished','Finish this show first.');s.phase='closed';log(s,'The host started a new show. Returning everyone to the home page.');break;
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
   myDraft:me?s.active.drafts?.[me.id]?.answer:undefined,
   myDeadlineAt:me?(s.active.deadlineAt??0)+me.bonusTimeSeconds*1000:undefined,
   myWrittenHint:(me&&s.active.hintUsers.includes(me.id))?q.hint:undefined,
   myChoices:(me&&choicesEnabled(me.choiceAccess,Number(s.active.key.split(':')[1])))?answerOptions(q.answer,q.distractors,q.id,me.id):undefined,
   // Never send the answer before reveal—even to the host, who may also be playing.
   hostAnswer:undefined,
 }:undefined;
 const res=s.resolution?{...s.resolution,answers:Object.fromEntries(Object.entries(s.resolution.answers).map(([id,a])=>[id,{...a}]))}:undefined;
 const finalQ=s.final?FINALS.find(f=>f.id===s.final?.id):undefined;
 const f=s.final&&finalQ?{
   category:finalQ.category,prompt:['final-question','final-results','finished'].includes(s.phase)?finalQ.prompt:undefined,
   answer:['final-results','finished'].includes(s.phase)?finalQ.answer:undefined,
   deadlineAt:s.final.deadlineAt,endsAt:s.final.endsAt,noShow:s.final.noShow,wagerCount:Object.keys(s.final.wagers).length,answerCount:Object.keys(s.final.answers).length,
   myWager:me?s.final.wagers[me.id]:undefined,myAnswer:me?s.final.answers[me.id]?.answer:undefined,
   myDraft:me?s.final.drafts?.[me.id]:undefined,
   hintPrice:FINAL_HINT_PRICE, maxHints:MAX_FINAL_HINTS,
   myPurchasedHints:me?(s.final.purchasedHints?.[me.id]??0):undefined,
   myPurchasableHints:me&&s.final.wagers[me.id]===undefined?Math.max(0,MAX_FINAL_HINTS-(s.final.purchasedHints?.[me.id]??0)):0,
   myRevealedHints:me?finalQ.hints.slice(0,s.final.revealedHints?.[me.id]??0):[],
   myAvailableHints:me?Math.max(0,Math.min(MAX_FINAL_HINTS-(s.final.revealedHints?.[me.id]??0),(s.final.purchasedHints?.[me.id]??0)-(s.final.purchasedHintsUsed?.[me.id]??0))):0,
   results:['final-results','finished'].includes(s.phase)?s.players.map(p=>({id:p.id,name:p.name,answer:s.final!.answers[p.id]?.answer||'(no answer)',correct:s.final!.answers[p.id]?.correct||false,points:s.final!.answers[p.id]?.points||0,wager:s.final!.wagers[p.id]??0})):undefined,
   disputeIds:s.final.disputeIds,
 }:undefined;
 return {revision,serverNow:now,phase:s.phase,roomId:s.id,role:actor,settings:{...s.settings,displayMode:s.settings.displayMode??'tv'},players:s.players,round:s.round,
 roundNames:ROUND_NAMES,roundValues:ROUND_VALUES,selected:s.selected,usedKeys:s.usedKeys,chooserId:currentPlayer(s)?.id,
 categories:CATEGORIES.filter(c=>!c.activeMonths||availableCategories(new Date(now)).some(x=>x.id===c.id)||s.draftPool.includes(c.id)||s.selected[0].includes(c.id)||s.selected[1].includes(c.id)).map(c=>({id:c.id,name:c.name,description:c.description,type:c.type})),draftPool:s.draftPool,draftIndex:s.draftIndex,
 draftTurnId:s.players.length?s.players[(s.draftIndex+s.round*4)%s.players.length]?.id:undefined,
 active:current,intro,results:res,final:f,myHints:me?.hintsRemaining,paused:!!s.pausedAt,pausedAt:s.pausedAt,announcement:s.announcement,eventLog:s.eventLog.slice(0,10),
 yourPlayer:me?.id,playedQuestionIds:s.recentQuestionIds,playedCategoryIds:s.recentCategoryIds??[],offeredCategoryIds:s.recentCategoryOffers??[],
 };
}
export type GameView=ReturnType<typeof makeView>;
