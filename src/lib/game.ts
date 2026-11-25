import { randomInt, randomUUID, createHash } from 'node:crypto';
import { CATEGORIES, CATEGORY_LOOKUP, CATEGORY_FINALS, ELIGIBLE_CATEGORY_FINALS, FINALS, availableCategories, getQuestion } from './questions';
import {auditSelection,seenCount,type SelectionAudit} from './exposure';
import {normalize,isCorrect,isCorrectForQuestion} from './answer-matching';
import {AGE_SUPPORT,isAgeBand,isAdultAgeBand,type AgeBand} from './age-support';
export {isCorrect,isCorrectForQuestion} from './answer-matching';

export const MAX_SEATS=8;
export const DRAFT_POOL_SIZE=8;
export const FINAL_HINT_PRICE=500;
export const MAX_FINAL_HINTS=2;
export type RegularHintKind='options'|'fifty-fifty';
export type RegularHintPurchases={options?:true;fiftyFifty?:true};
export const regularHintPrice=(points:number)=>points/4;
export const ROUND_NAMES=['Round 1','Round 2'] as const;
export const ROUND_VALUES=[[100,300,500],[200,600,1000]] as const;
export type Phase='lobby'|'draft'|'board'|'intro'|'question'|'results'|'final-wager'|'final-question'|'final-results'|'finished'|'closed';
export type Mode='individual'|'teams';
export type MusicStyle='jazz'|'indie'|'retro'|'game'|'bluegrass'|'cinematic'|'off';
export type DisplayMode='tv'|'phones';
export type ChoiceAccess='off'|'all'|'medium-hard'|'hard';
export type AnswerStyle='written'|'choices'|'mixed'|'individual';
export function isChoiceAccess(v:unknown):v is ChoiceAccess{return typeof v==='string'&&['off','all','medium-hard','hard'].includes(v);}
export function defaultChoiceAccess(s:Settings):ChoiceAccess{return s.answerStyle==='choices'?'all':s.answerStyle==='mixed'?(s.mixedAccess??'hard'):'off';}
export type Settings={mode:Mode;answerSeconds:number;finalSeconds:number;normalHints:number;music:MusicStyle;arrangement:0|1;effects:boolean;displayMode?:DisplayMode;answerStyle?:AnswerStyle;mixedAccess?:'hard'|'medium-hard';answerFormatConfigured?:boolean;playerMusic?:boolean};
export type Player={id:string;name:string;age?:number;ageBand?:AgeBand;score:number;hintsRemaining:number;bonusHints:number;bonusTimeSeconds:number;choiceAccess?:ChoiceAccess;requestedChoiceAccess?:ChoiceAccess;pendingChoiceAccess?:ChoiceAccess;joinedAt:number;doubleTakesRemaining:number};
export type Submission={answer:string;at:number;correct:boolean;points:number;doubleTake:boolean;hintUsed:boolean;answerFormat?:'written'|'choices';assistance?:'written'|'provided-options'|'purchased-options'|'fifty-fifty';optionsPurchased?:boolean;fiftyFiftyPurchased?:boolean;responseMs?:number;initialCorrect?:boolean;overturned?:boolean;optionIndex?:number};
export type ActiveQuestion={hintPurchases?:Record<string,RegularHintPurchases>;choiceSnapshot?:Record<string,ChoiceAccess>;drafts?:Record<string,{answer:string;doubleTake:boolean}>;key:string;questionId:string;introUntilAt:number;startedAt?:number;deadlineAt?:number;answers:Record<string,Submission>;hintUsers:string[];turnId?:string;stealId?:string;stealTurn?:boolean};
export type Resolution={hintPurchases?:Record<string,RegularHintPurchases>;reviewedIds?:string[];resumePhase?:'board'|'draft'|'final-wager';feedbackPauseUntil?:number;round?:0|1;key:string;questionId:string;answer:string;category:string;points:number;answers:Record<string,Submission>;finishedAt:number;endsAt:number;disputeIds:string[];skipped?:boolean;noShow?:boolean;hintUsers?:string[];eligibleSeats?:number;revealedAt?:number};
export type FinalState={reviewedIds?:string[];feedbackPauseUntil?:number;drafts?:Record<string,string>;purchasedHints?:Record<string,number>;purchasedHintsUsed?:Record<string,number>;revealedHints?:Record<string,number>;id:string;wagers:Record<string,number>;answers:Record<string,Submission>;startedAt?:number;deadlineAt?:number;endsAt?:number;disputeIds:string[];noShow?:boolean};
export type GameState={schemaVersion:3;id:string;feedbackShowId?:string;createdAt:number;phase:Phase;settings:Settings;players:Player[];round:0|1;selected:[string[],string[]];draftPool:string[];draftIndex:number;usedKeys:string[];questionMap:Record<string,string>;chooserIndex:number;active?:ActiveQuestion;resolution?:Resolution;final?:FinalState;pausedAt?:number;announcement?:string;eventLog:string[];recentQuestionIds:string[];recentCategoryIds?:string[];recentCategoryOffers?:string[];hostHistoryId?:string;musicChangedAt?:number;disabledCategoryIds?:string[];selectionAudit?:Record<string,SelectionAudit>;guestHistoryKeys?:Record<string,string>;questionSeenCounts?:Record<string,number>;historyScopeCount?:number;seedHistory?:{recentQuestionIds:string[];recentCategoryIds:string[];recentCategoryOffers:string[]};categoryAudit?:Record<string,{id:string;unseenByLevel:number[];seasonalGuaranteed:boolean;weight:number}[]>};
export type Actor={kind:'host'|'player'|'spectator';id?:string};
export type Action=
 |{type:'settings';settings:Partial<Settings>}
 |{type:'choose-music';music:MusicStyle;arrangement:0|1}
 |{type:'player-bonuses';playerId:string;bonusHints?:number;bonusTimeSeconds?:number;choiceAccess?:ChoiceAccess}
 |{type:'request-answer-format';choiceAccess:ChoiceAccess}|{type:'resolve-answer-format';playerId:string;approve:boolean}
 |{type:'player-age-band';playerId:string;ageBand:AgeBand|null}
 |{type:'start-draft'}|{type:'draft-category';categoryId:string}
 |{type:'open-question';key:string}|{type:'submit-answer';answer:string;doubleTake?:boolean}
 |{type:'save-draft';answer:string;scope:'question'|'final';doubleTake?:boolean}
 |{type:'hint';kind:RegularHintKind;key:string}|{type:'pass'}
 |{type:'dispute';questionId?:string}|{type:'feedback-pause';questionId:string}|{type:'resolve-dispute';playerId:string;correct:boolean;questionId?:string}|{type:'dismiss-dispute';playerId:string;questionId?:string}|{type:'skip-question'}
 |{type:'pause'}|{type:'adjust-score';playerId:string;delta:number}
 |{type:'start-final'}|{type:'buy-final-hint'}|{type:'set-final-hints';count:number}|{type:'final-hint'}|{type:'wager';amount:number}|{type:'final-answer';answer:string}|{type:'finish'}|{type:'new-game'}|{type:'close-show'};
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
function activeChoices(a:ActiveQuestion,p:Player){return !!a.hintPurchases?.[p.id]?.options||choicesEnabled(a.choiceSnapshot?.[p.id]??p.choiceAccess,Number(a.key.split(':')[1]));}
function answerOptions(answer:string,distractors:string[]|undefined,questionId:string,playerId:string):string[]{
 // All choices are server-authorized and ordered deterministically per player,
 // so polling or switching tabs cannot reshuffle an active question.
 const options=[answer,...(distractors??[])];
 assert(options.length===4&&new Set(options.map(x=>normalize(x))).size===4,'This question needs four distinct answer choices.');
 return options.sort((a,b)=>createHash('sha256').update(`${questionId}:${playerId}:${a}`).digest('hex').localeCompare(createHash('sha256').update(`${questionId}:${playerId}:${b}`).digest('hex')));
}
function visibleOptions(a:ActiveQuestion,p:Player,q:NonNullable<ReturnType<typeof getQuestion>>){
 const options=answerOptions(q.answer,q.distractors,q.id,p.id);
 if(!a.hintPurchases?.[p.id]?.fiftyFifty)return options;
 const keep=(q.distractors??[])[createHash('sha256').update(`fifty-fifty:${q.id}:${p.id}`).digest().readUInt32BE(0)%3];
 return options.filter(x=>x===q.answer||x===keep);
}
export function defaultSettings():Settings{return {mode:'individual',answerSeconds:20,finalSeconds:45,normalHints:3,music:'jazz',arrangement:0,effects:false,displayMode:'phones',answerStyle:'choices',playerMusic:true};}
// Most-recent-last histories; reselecting a category moves it to the back of the queue.
function rememberRecent(history:readonly string[], values:readonly string[], limit:number):string[]{
 const known=new Set(values);return [...history.filter(id=>!known.has(id)),...values].slice(-limit);
}
export const QUESTION_HISTORY_LIMIT=CATEGORIES.reduce((total,c)=>total+Object.values(c.questionsByLevel).reduce((n,level)=>n+level.length,0),0)+CATEGORY_FINALS.length;
export function makeGame(recentQuestionIds:string[]=[],recentCategoryIds:string[]=[],recentCategoryOffers:string[]=[],hostHistoryId?:string):GameState{
 const valid=new Set(CATEGORIES.map(c=>c.id));
 return {schemaVersion:3,id:randomUUID(),feedbackShowId:randomUUID(),createdAt:Date.now(),phase:'lobby',settings:defaultSettings(),players:[],round:0,selected:[[],[]],draftPool:[],draftIndex:0,usedKeys:[],questionMap:{},chooserIndex:0,eventLog:[],
  recentQuestionIds:recentQuestionIds.filter(x=>typeof x==='string'&&(!!getQuestion(x)||FINALS.some(f=>f.id===x))).slice(-QUESTION_HISTORY_LIMIT),
  recentCategoryIds:recentCategoryIds.filter(id=>typeof id==='string'&&valid.has(id)).slice(-CATEGORIES.length),
  recentCategoryOffers:recentCategoryOffers.filter(id=>typeof id==='string'&&valid.has(id)).slice(-CATEGORIES.length),
  hostHistoryId:hostHistoryId&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(hostHistoryId)?hostHistoryId:undefined};
}
export function joinGame(original:GameState,name:string,age?:number,now=Date.now(),preference?:unknown) {
 assert(original.phase==='lobby','The show has already started.');assert(original.players.length<MAX_SEATS,'The room is full.');
 const n=String(name||'').trim().replace(/\s+/g,' ').slice(0,28);assert(n.length>=2,'Enter a name of at least two characters.');
 assert(!original.players.some(p=>p.name.toLowerCase()===n.toLowerCase()),'That name is already in use.');
 const s=structuredClone(original);const p:Player={id:randomUUID(),name:n,score:0,hintsRemaining:s.settings.normalHints,bonusHints:0,bonusTimeSeconds:0,choiceAccess:s.settings.answerStyle==='individual'&&isChoiceAccess(preference)?preference:defaultChoiceAccess(s.settings),requestedChoiceAccess:s.settings.answerStyle==='individual'&&isChoiceAccess(preference)?preference:undefined,joinedAt:now,doubleTakesRemaining:1};s.players.push(p);log(s,`${n} joined the show.`);return {state:s,player:p};
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
 const allowed=availableCategories(new Date(now)).filter(c=>!s.disabledCategoryIds?.includes(c.id)&&!alreadySelected.has(c.id)&&[1,2,3].every(n=>(c.questionsByLevel[String(n)]??[]).length>=4));
 const total=Math.min(allowed.length,DRAFT_POOL_SIZE);
 const seasonal=allowed.filter(c=>c.activeMonths?.length);
 const weight=(c:(typeof CATEGORIES)[number])=>categoryDraftWeight(s,c);
 // Reserve one weighted seasonal offer if available. All other eligible
 // categories, including the remaining seasonal ones, compete for the rest.
 // Sampling without replacement prevents duplicate offers; no seasonal cap.
 const seen=new Set(s.recentQuestionIds);
 const fullFresh=(c:(typeof CATEGORIES)[number])=>[1,2,3].every(level=>c.questionsByLevel[String(level)].some(q=>!seen.has(q.id)));
 const freshSeasonal=seasonal.filter(fullFresh);
 const seasonalPick=seasonal.length?weightedSample(freshSeasonal.length?freshSeasonal:seasonal,1,weight):[];
 const remaining=allowed.filter(c=>c.id!==seasonalPick[0]?.id);
 const fresh=remaining.filter(fullFresh),fallback=remaining.filter(c=>!fullFresh(c));
 const first=weightedSample(fresh,total-seasonalPick.length,weight);
 const otherPicks=[...first];
 const freshLevels=(c:(typeof CATEGORIES)[number])=>[1,2,3].filter(level=>c.questionsByLevel[String(level)].some(q=>!seen.has(q.id))).length;
 for(const n of [2,1,0])otherPicks.push(...weightedSample(fallback.filter(c=>freshLevels(c)===n),total-seasonalPick.length-otherPicks.length,weight));
 const offered=[...seasonalPick,...otherPicks];
 (s.categoryAudit??={})[String(s.round+1)]=offered.map(c=>({id:c.id,unseenByLevel:[1,2,3].map(n=>c.questionsByLevel[String(n)].filter(q=>!seen.has(q.id)).length),seasonalGuaranteed:c.id===seasonalPick[0]?.id,weight:weight(c)}));
 return offered.map(c=>c.id);
}
function goDraft(s:GameState,now:number){
 s.players.forEach(p=>p.doubleTakesRemaining=1);s.phase='draft';s.draftIndex=0;s.draftPool=pickPool(s,now);
 s.recentCategoryOffers=rememberRecent(s.recentCategoryOffers??[],s.draftPool,CATEGORIES.length);
 s.active=undefined;log(s,`Select four categories for ${ROUND_NAMES[s.round]}.`);
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
     ??eligible.filter(q=>!taken.has(q.id)).sort((a,b)=>seenCount(s,a.id)-seenCount(s,b.id)||s.recentQuestionIds.indexOf(a.id)-s.recentQuestionIds.indexOf(b.id))[0];
   assert(chosen,`No available question for ${c.name} level ${level+1}.`);
   s.questionMap[key]=chosen.id;taken.add(chosen.id);(s.selectionAudit??={})[chosen.id]=auditSelection(s,chosen.id,eligible);
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
   points:roundPoints(s,a.key),round:s.round,answers:a.answers,finishedAt:now,endsAt:now+(noShow?12000:8500),disputeIds:[],skipped,noShow,revealedAt:a.startedAt??now,hintUsers:[...a.hintUsers],hintPurchases:a.hintPurchases,eligibleSeats:s.settings.mode==='teams'?Math.max(1,new Set([a.turnId,a.stealId].filter(Boolean)).size):s.players.length};
 for(const [id,submission] of Object.entries(a.answers)){const p=s.players.find(x=>x.id===id);if(p)p.score+=submission.points;}
 s.usedKeys.push(a.key);s.recentQuestionIds=[...s.recentQuestionIds.filter(id=>id!==q.id),q.id].slice(-QUESTION_HISTORY_LIMIT);s.resolution=resolution;s.active=undefined;s.phase='results';s.chooserIndex++;
 log(s,skipped?'Question skipped.':`The answer is ${q.answer}.`);
}
function correctPoints(s:GameState,a:ActiveQuestion,p:Player,at:number,doubleTake=false){
 const base=roundPoints(s,a.key);
 if(s.settings.mode==='teams')return a.stealTurn?Math.floor(base/2):base;
 const duration=s.settings.answerSeconds*1000;
 const elapsed=Math.max(0,at-(a.startedAt??at));
 const hasChoices=activeChoices(a,p);
 const maxSpeedBonus=hasChoices?0.10:0.25;
 const bonus=duration?Math.round(base*maxSpeedBonus*Math.max(0,1-elapsed/duration)/5)*5:0;
 return base*(doubleTake?2:1)+bonus;
}
function storeSubmission(s:GameState,p:Player,answer:string,now:number,useDoubleTake=false){
 const a=s.active!,q=getQuestion(a.questionId)!;
 assert(answer.length>0&&answer.length<=200,'Enter an answer (up to 200 characters).');
 assert(!a.answers[p.id],'You already submitted an answer.');
 const usesChoices=activeChoices(a,p);
 if(usesChoices)assert(visibleOptions(a,p,q).some(choice=>choice===answer),'Choose one of the displayed answers.');
 const purchases=a.hintPurchases?.[p.id];
 const correct=isCorrectForQuestion(answer,q);
 if(useDoubleTake){assert(s.settings.mode==='individual'&&p.doubleTakesRemaining>0,'No Double Takes remaining.');p.doubleTakesRemaining--;}
 const points=correct?correctPoints(s,a,p,now,useDoubleTake):0;
 a.answers[p.id]={answer,at:now,correct,points,doubleTake:useDoubleTake,hintUsed:a.hintUsers.includes(p.id),answerFormat:usesChoices?'choices':'written',assistance:purchases?.fiftyFifty?'fifty-fifty':purchases?.options?'purchased-options':usesChoices?'provided-options':'written',optionsPurchased:!!purchases?.options,fiftyFiftyPurchased:!!purchases?.fiftyFifty,responseMs:Math.max(0,now-(a.startedAt??now)),initialCorrect:correct,optionIndex:usesChoices?[q.answer,...(q.distractors??[])].indexOf(answer):undefined};
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
export function finalCandidates(s:GameState,now:number){
 const activeIds=new Set(availableCategories(new Date(now)).filter(c=>!s.disabledCategoryIds?.includes(c.id)).map(c=>c.id));
 const currentBoard=new Set([...s.selected[0],...s.selected[1]]);
 return ELIGIBLE_CATEGORY_FINALS.filter(q=>q.categoryId&&activeIds.has(q.categoryId)&&!currentBoard.has(q.categoryId));
}
// A category with more than one equally eligible final does not gain extra lottery tickets.
function chooseFinalCategoryBalanced(questions:typeof ELIGIBLE_CATEGORY_FINALS){
 const category=shuffle([...new Set(questions.map(q=>q.categoryId))])[0];
 return shuffle(questions.filter(q=>q.categoryId===category))[0];
}
export function chooseFinalQuestion(s:GameState,now:number){
 const eligible=finalCandidates(s,now);
 assert(eligible.length>0,'No eligible Final Word categories remain outside the current board.');
 const unseen=eligible.filter(q=>!s.recentQuestionIds.includes(q.id));
 if(unseen.length)return chooseFinalCategoryBalanced(unseen);
 const historyOrder=new Map(s.recentQuestionIds.map((id,i)=>[id,i]));
 const age=(id:string)=>historyOrder.get(id)??-1;
 const fewest=Math.min(...eligible.map(q=>seenCount(s,q.id)));
 const leastSeen=eligible.filter(q=>seenCount(s,q.id)===fewest);
 const oldest=Math.min(...leastSeen.map(q=>age(q.id)));
 // Multiple equally old questions can remain. Break the tie at random.
 return chooseFinalCategoryBalanced(leastSeen.filter(q=>age(q.id)===oldest));
}

// Reveal every paid hint at the same instant the Final Word question opens.
function openFinalQuestion(s:GameState,now:number){
 const f=s.final!;s.resolution=undefined;
 for(const p of s.players){
   const bought=f.purchasedHints?.[p.id]??0;
   (f.purchasedHintsUsed??={})[p.id]=bought;
   (f.revealedHints??={})[p.id]=bought;
 }
 s.recentQuestionIds=rememberRecent(s.recentQuestionIds,[f.id],QUESTION_HISTORY_LIMIT);
 f.startedAt=now;f.deadlineAt=now+s.settings.finalSeconds*1000;s.phase='final-question';log(s,'The Final Word begins!');
}
function finishFinal(s:GameState,now:number){
 const f=s.final!;for(const p of s.players){const r=f.answers[p.id];if(r)p.score+=r.points;else {const loss=f.wagers[p.id]||0;p.score-=loss;f.answers[p.id]={answer:'(no answer)',at:now,correct:false,points:-loss,doubleTake:false,hintUsed:Boolean(f.revealedHints?.[p.id])};}}
 s.recentQuestionIds=[...s.recentQuestionIds.filter(id=>id!==f.id),f.id].slice(-QUESTION_HISTORY_LIMIT);s.phase='final-results';f.noShow=everyoneMissed(s,f.answers);f.endsAt=now+(f.noShow?17500:14000);log(s,'Final answers are in.');
}
function shiftTimers(s:GameState,delta:number){if(s.active){s.active.introUntilAt+=delta;if(s.active.startedAt)s.active.startedAt+=delta;if(s.active.deadlineAt)s.active.deadlineAt+=delta;}if(s.resolution)s.resolution.endsAt+=delta;if(s.final){if(s.final.startedAt)s.final.startedAt+=delta;if(s.final.deadlineAt)s.final.deadlineAt+=delta;if(s.final.endsAt)s.final.endsAt+=delta;}}
export function tick(original:GameState,now=Date.now()):GameState {
 if(original.schemaVersion!==3)throw new GameError('This room uses older game rules. Please create a new v1.0 room.');
 if(original.pausedAt)return original;
 const s:GameState=structuredClone(original);
 if(s.phase==='intro'&&s.active&&now>=s.active.introUntilAt){s.phase='question';s.recentQuestionIds=rememberRecent(s.recentQuestionIds,[s.active.questionId],QUESTION_HISTORY_LIMIT);s.active.startedAt=s.active.introUntilAt;s.active.choiceSnapshot=Object.fromEntries(s.players.map(p=>[p.id,p.choiceAccess??'off']));const p=s.players.find(p=>p.id===s.active?.turnId);s.active.deadlineAt=s.active.introUntilAt+(s.settings.answerSeconds+(s.settings.mode==='teams'?(p?.bonusTimeSeconds||0):0))*1000;}
 if(s.phase==='question'&&s.active){const a=s.active;
   if(s.settings.mode==='individual'){
     // The server, not the player's network latency, decides what was in the box at zero.
     // Auto-submissions receive no speed bonus and respect each player's extra time.
     for(const p of s.players){
       if(s.phase!=='question')break;
       const due=(a.deadlineAt??now)+p.bonusTimeSeconds*1000;
       const draft=a.drafts?.[p.id];
       if(!a.answers[p.id]&&now>=due&&draft?.answer.trim()&&!activeChoices(a,p))
         storeSubmission(s,p,draft.answer.trim(),due,draft.doubleTake);
     }
     if(s.phase==='question'){
       const all=s.players.every(p=>a.answers[p.id]);const maxBonus=Math.max(0,...s.players.map(p=>p.bonusTimeSeconds));
       if(all||now>=(a.deadlineAt??now)+maxBonus*1000)closeQuestion(s,now);
     }
   }else if(now>=(a.deadlineAt??now)){
     const p=s.players.find(p=>p.id===(a.stealTurn?a.stealId:a.turnId));
     const draft=p&&a.drafts?.[p.id];
     if(p&&draft?.answer.trim()&&!a.answers[p.id]&&!activeChoices(a,p))
       storeSubmission(s,p,draft.answer.trim(),a.deadlineAt??now);
     else if(a.stealTurn||s.players.length<2)closeQuestion(s,now);
     else nextSteal(s,now);
   }
 }
 if(s.phase==='results'&&s.resolution&&!s.resolution.disputeIds.length&&now>=s.resolution.endsAt&&now>=(s.resolution.feedbackPauseUntil??0)){
   if(s.resolution.resumePhase){s.phase=s.resolution.resumePhase;delete s.resolution.resumePhase;}
   else if(s.usedKeys.filter(k=>s.selected[s.round].includes(k.split(':')[0])).length===12){
     if(s.round===0){s.round=1;goDraft(s,now);}else{s.phase='final-wager';const final=chooseFinalQuestion(s,now);const candidates=finalCandidates(s,now);(s.selectionAudit??={})[final.id]=auditSelection(s,final.id,candidates);s.final={id:final.id,wagers:{},answers:{},disputeIds:[]};log(s,'The Final Word: Place your wagers.');}
   }else{s.phase='board';}
 }
 if(s.phase==='final-question'&&s.final){
   if(now>=(s.final.deadlineAt??now)){
     const q=FINALS.find(q=>q.id===s.final!.id)!;
     for(const p of s.players){
       const draft=s.final.drafts?.[p.id]?.trim();
       if(!s.final.answers[p.id]&&draft){
         const correct=isCorrectForQuestion(draft,q),wager=s.final.wagers[p.id]??0;
         s.final.answers[p.id]={answer:draft,at:s.final.deadlineAt??now,correct,points:correct?wager:-wager,doubleTake:false,hintUsed:Boolean(s.final.revealedHints?.[p.id]),answerFormat:'written',responseMs:Math.max(0,(s.final.deadlineAt??now)-(s.final.startedAt??now)),initialCorrect:correct};
       }
     }
   }
   if(s.players.every(p=>s.final!.answers[p.id])||now>=(s.final.deadlineAt??now))finishFinal(s,now);
 }
 if(s.phase==='final-results'&&s.final&&!s.final.disputeIds.length&&now>=(s.final.endsAt??now)&&now>=(s.final.feedbackPauseUntil??0)){s.phase='finished';log(s,'That’s a wrap!');}
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
   if(opts.mode!==undefined){assert(['individual','teams'].includes(opts.mode),'Invalid mode.');s.settings.mode=opts.mode;if(opts.mode==='teams')for(const p of s.players)delete p.ageBand;}
   for(const k of ['answerSeconds','finalSeconds'] as const){const v=opts[k];if(v!==undefined){assert(Number.isInteger(v)&&v>=0&&v<=120,`Invalid ${k}.`);s.settings[k]=v;}}
   if(opts.mixedAccess!==undefined){assert(['hard','medium-hard'].includes(opts.mixedAccess),'Invalid mixture.');s.settings.mixedAccess=opts.mixedAccess;}
   if(opts.answerStyle!==undefined){assert(['written','choices','mixed','individual'].includes(opts.answerStyle),'Invalid answer style.');const changed=!s.settings.answerFormatConfigured||s.settings.answerStyle!==opts.answerStyle||opts.mixedAccess!==undefined&&opts.mixedAccess!==original.settings.mixedAccess;s.settings.answerStyle=opts.answerStyle;s.settings.answerFormatConfigured=true;if(changed)for(const p of s.players){p.choiceAccess=opts.answerStyle==='individual'&&p.requestedChoiceAccess!==undefined?p.requestedChoiceAccess:defaultChoiceAccess(s.settings);delete p.pendingChoiceAccess;}}
   if(opts.displayMode!==undefined){assert(['tv','phones'].includes(opts.displayMode),'Invalid display mode.');s.settings.displayMode=opts.displayMode;}
   if(opts.music!==undefined){assert(['jazz','indie','retro','game','bluegrass','cinematic','off'].includes(opts.music),'Invalid music.');s.settings.music=opts.music;}
   if(opts.arrangement!==undefined){assert(opts.arrangement===0||opts.arrangement===1,'Invalid arrangement.');s.settings.arrangement=opts.arrangement;}
   if(opts.effects!==undefined){assert(typeof opts.effects==='boolean','Invalid effects choice.');s.settings.effects=opts.effects;}
   if(opts.playerMusic!==undefined){assert(typeof opts.playerMusic==='boolean','Invalid music permission.');s.settings.playerMusic=opts.playerMusic;}
   
   break;
 }
 case 'player-bonuses':{
   host(actor);assert(!['finished','closed'].includes(s.phase),'The show has ended.');assert(s.phase==='lobby'||!!s.pausedAt||(action.bonusHints===undefined&&action.bonusTimeSeconds===undefined),'Pause the game before changing extra time.');const p=s.players.find(p=>p.id===action.playerId);assert(p,'Player not found.');
   assert(action.bonusHints===undefined,'Regular hints are purchased with points.');
   if(action.bonusTimeSeconds!==undefined){assert(Number.isInteger(action.bonusTimeSeconds)&&action.bonusTimeSeconds>=0&&action.bonusTimeSeconds<=30,'Invalid time bonus.');p.bonusTimeSeconds=action.bonusTimeSeconds;}
   if(action.choiceAccess!==undefined){assert(['off','all','medium-hard','hard'].includes(action.choiceAccess),'Invalid choice availability.');if(s.active&&s.phase==='question'&&!s.active.choiceSnapshot)s.active.choiceSnapshot=Object.fromEntries(s.players.map(x=>[x.id,x.choiceAccess??'off']));p.choiceAccess=action.choiceAccess;delete p.pendingChoiceAccess;}break;
 }
 case 'request-answer-format':{
   const p=player(s,actor);assert(!['finished','closed'].includes(s.phase),'The show has ended.');assert(isChoiceAccess(action.choiceAccess),'Invalid answer format.');p.pendingChoiceAccess=action.choiceAccess===(p.choiceAccess??'off')?undefined:action.choiceAccess;break;
 }
 case 'resolve-answer-format':{
   host(actor);assert(!['finished','closed'].includes(s.phase),'The show has ended.');assert(typeof action.approve==='boolean','Invalid decision.');const p=s.players.find(p=>p.id===action.playerId);assert(p&&p.pendingChoiceAccess!==undefined,'No pending request.');if(action.approve){if(s.active&&s.phase==='question'&&!s.active.choiceSnapshot)s.active.choiceSnapshot=Object.fromEntries(s.players.map(x=>[x.id,x.choiceAccess??'off']));p.choiceAccess=p.pendingChoiceAccess;p.requestedChoiceAccess=p.pendingChoiceAccess;}delete p.pendingChoiceAccess;break;
 }
 case 'player-age-band':{
   host(actor);assert(s.phase==='lobby'&&s.settings.mode==='individual','Age recommendations are available in the individual Green Room.');
   const p=s.players.find(p=>p.id===action.playerId);assert(p,'Player not found.');
   assert(action.ageBand===null||isAgeBand(action.ageBand),'Invalid age range.');
   if(action.ageBand===null){delete p.ageBand;}else{if(!s.settings.answerFormatConfigured&&p.requestedChoiceAccess===undefined)p.choiceAccess=AGE_SUPPORT[action.ageBand];if(isAdultAgeBand(action.ageBand))p.ageBand=action.ageBand;else delete p.ageBand;}break;
 }
 case 'start-draft':{
   host(actor);assert(s.phase==='lobby'&&s.players.length>=2,'At least two players or teams are required.');assert(CATEGORIES.filter(c=>!c.activeMonths&&!s.disabledCategoryIds?.includes(c.id)).length>=12,'At least 12 year-round categories must be enabled. Ask the developer to update category availability.');assert(new Set(ELIGIBLE_CATEGORY_FINALS.filter(q=>q.categoryId&&!CATEGORY_LOOKUP.get(q.categoryId)?.activeMonths&&!s.disabledCategoryIds?.includes(q.categoryId)).map(q=>q.categoryId)).size>=9,'At least 9 year-round Final Word eligible categories must be enabled. Ask the developer to update category availability.');for(const p of s.players)if(!isAdultAgeBand(p.ageBand))delete p.ageBand;goDraft(s,now);break;
 }
 case 'draft-category':{
   assert(s.phase==='draft','The category draft is closed.');const id=action.categoryId;
   assert(s.draftPool.includes(id),'Choose a category from the available draft.');assert(!s.selected[s.round].includes(id),'Already selected.');
   const chooser=s.players[(s.draftIndex+s.round*4)%s.players.length];assert(actor.kind==='host'||actor.id===chooser.id,`It is ${chooser.name}’s turn.`);
   s.selected[s.round].push(id);s.recentCategoryIds=rememberRecent(s.recentCategoryIds??[],[id],CATEGORIES.length);s.draftIndex++;log(s,`${chooser.name} selected ${CATEGORY_LOOKUP.get(id)!.name}.`);
   if(s.selected[s.round].length===4){nextQuestionChoices(s);s.phase='board';s.chooserIndex=s.round===0?0:4;log(s,`${ROUND_NAMES[s.round]} begins!`);}break;
 }
 case 'open-question':{
   assert(s.phase==='board','The board is not ready.');assert(actor.kind==='host'||actor.id===currentPlayer(s).id,'Another player is choosing.');
   const key=action.key;const [id,tier]=key.split(':');assert(s.selected[s.round].includes(id)&&/^[0-2]$/.test(tier)&&s.questionMap[key],'Not a question on this board.');assert(!s.usedKeys.includes(key),'That question was already played.');
   s.resolution=undefined;s.active={key,questionId:s.questionMap[key],introUntilAt:now+2500,answers:{},hintUsers:[],turnId:currentPlayer(s).id};s.phase='intro';log(s,`${CATEGORY_LOOKUP.get(id)!.name} for ${roundPoints(s,key)}!`);break;
 }
 case 'hint':{
   const p=player(s,actor);assert(!s.pausedAt,'Game is paused.');assert(s.phase==='question'&&!!s.active,'No question is open.');const a=s.active;
   assert(s.settings.mode==='individual'||(a.stealTurn?a.stealId===p.id:a.turnId===p.id),'It is not your team’s turn.');
   assert(!a.answers[p.id],'You have already answered.');
   assert(action.key===a.key,'That question is no longer open.');
   const due=(a.deadlineAt??0)+(s.settings.mode==='individual'?p.bonusTimeSeconds*1000:0);
   assert(!due||now<due,'Your answer time has expired.');
   const purchases=(a.hintPurchases??={})[p.id]??{};
   if(action.kind==='options')assert(!activeChoices(a,p),'Answer options are already available.');
   else if(action.kind==='fifty-fifty'){assert(activeChoices(a,p),'Reveal answer options first.');assert(!purchases.fiftyFifty,'Already purchased 50/50.');}
   else throw new GameError('Unknown hint.');
   const q=getQuestion(a.questionId)!;answerOptions(q.answer,q.distractors,q.id,p.id);
   const price=regularHintPrice(roundPoints(s,a.key));assert(p.score>=price,`You need at least ${price} points to purchase this hint.`);
   p.score-=price;
   if(action.kind==='options'){purchases.options=true;if(a.drafts)delete a.drafts[p.id];}
   else purchases.fiftyFifty=true;
   a.hintPurchases[p.id]=purchases;if(!a.hintUsers.includes(p.id))a.hintUsers.push(p.id);break;
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
     assert(!activeChoices(a,p),'This player uses choices.');
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
 case 'feedback-pause':{
   assert(actor.kind==='host'||actor.kind==='player','Join the show to give feedback.');if(actor.kind==='player')player(s,actor);
   const result=s.phase==='results'&&s.resolution?.questionId===action.questionId?s.resolution:s.phase==='final-results'&&s.final?.id===action.questionId?s.final:undefined;
   // At most one five-second pause per question, shared by all feedback authors.
   if(result&&!result.feedbackPauseUntil&&!s.pausedAt&&!result.disputeIds.length){result.feedbackPauseUntil=now+5000;result.endsAt=(result.endsAt??now)+5000;}break;
 }
 case 'dispute':{
   const p=player(s,actor);
   if(s.resolution&&(['board','draft','final-wager'] as string[]).includes(s.phase)){s.resolution.resumePhase=s.phase as 'board'|'draft'|'final-wager';s.phase='results';}
   assert(['results','final-results'].includes(s.phase),'A result can only be disputed before the next question begins.');
   const result=s.phase==='results'?s.resolution:s.final;assert(!action.questionId||action.questionId===(s.phase==='results'?s.resolution?.questionId:s.final?.id),'That review window has closed.');assert(!result?.reviewedIds?.includes(p.id),'The host has already reviewed this answer.');
   const ids=s.phase==='results'?s.resolution?.disputeIds:s.final?.disputeIds;assert(ids,'No results.');assert(!ids.includes(p.id),'You already requested review.');
   const submitted=s.phase==='results'?s.resolution?.answers[p.id]:s.final?.answers[p.id];
   assert(submitted&&!submitted.correct&&submitted.answer.trim()&&submitted.answer!=='(no answer)','Only submitted answers marked incorrect can be reviewed.');
   if(s.phase==='results'){s.resolution!.disputeIds.push(p.id);}else{s.final!.disputeIds.push(p.id);}log(s,`${p.name} requested a ruling review.`);break;
 }
 case 'resolve-dispute':{
   host(actor);assert(s.phase==='results'||s.phase==='final-results','No results to review.');assert(!action.questionId||action.questionId===(s.phase==='results'?s.resolution?.questionId:s.final?.id),'That review window has closed.');const p=s.players.find(p=>p.id===action.playerId);assert(p,'Player not found.');
   const r=s.phase==='results'?s.resolution?.answers[p.id]:s.final?.answers[p.id];
   assert(r,'No submitted answer for this player.');
   if(r.correct!==action.correct){r.initialCorrect??=r.correct;r.overturned=true;p.score-=r.points;r.correct=action.correct;
     if(s.phase==='results'){const a=s.resolution!;const base=a.points;r.points=action.correct?(s.settings.mode==='individual'?base*(r.doubleTake?2:1):base):0;
       // Overrides award only the base: do not award a speculative speed bonus.
     }else{r.points=action.correct?(s.final?.wagers[p.id]??0):-(s.final?.wagers[p.id]??0);}
     p.score+=r.points;
   }
   if(s.phase==='results'){if(s.resolution!.disputeIds.includes(p.id))(s.resolution!.reviewedIds??=[]).push(p.id);s.resolution!.disputeIds=s.resolution!.disputeIds.filter(id=>id!==p.id);s.resolution!.noShow=!s.resolution!.skipped&&everyoneMissed(s,s.resolution!.answers);s.resolution!.endsAt=Math.max(now,s.resolution!.feedbackPauseUntil??0)+7000;}
   else{if(s.final!.disputeIds.includes(p.id))(s.final!.reviewedIds??=[]).push(p.id);s.final!.disputeIds=s.final!.disputeIds.filter(id=>id!==p.id);s.final!.noShow=everyoneMissed(s,s.final!.answers);s.final!.endsAt=Math.max(now,s.final!.feedbackPauseUntil??0)+10000;}
   log(s,`Host reviewed ${p.name}’s answer.`);break;
 }
 case 'dismiss-dispute':{
   host(actor);assert(s.phase==='results'||s.phase==='final-results','No result dispute to dismiss.');assert(!action.questionId||action.questionId===(s.phase==='results'?s.resolution?.questionId:s.final?.id),'That review window has closed.');
   if(s.phase==='results'&&s.resolution){if(s.resolution.disputeIds.includes(action.playerId))(s.resolution.reviewedIds??=[]).push(action.playerId);s.resolution.disputeIds=s.resolution.disputeIds.filter(id=>id!==action.playerId);s.resolution.endsAt=Math.max(now,s.resolution.feedbackPauseUntil??0)+7000;}
   if(s.phase==='final-results'&&s.final){if(s.final.disputeIds.includes(action.playerId))(s.final.reviewedIds??=[]).push(action.playerId);s.final.disputeIds=s.final.disputeIds.filter(id=>id!==action.playerId);s.final.endsAt=Math.max(now,s.final.feedbackPauseUntil??0)+10000;}
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
   // Purchases reserve hints; their contents stay hidden until the question opens.
   break;
 }
 case 'set-final-hints':{
   const p=player(s,actor);assert(!s.pausedAt,'Game is paused.');assert(s.phase==='final-wager'&&!!s.final,'Final hint purchases are closed.');
   assert(s.final.wagers[p.id]===undefined,'Select hints before locking your wager.');
   assert(Number.isInteger(action.count)&&action.count>=0&&action.count<=MAX_FINAL_HINTS,'Select zero, one or two hints.');
   const bought=s.final.purchasedHints?.[p.id]??0;
   const cost=(action.count-bought)*FINAL_HINT_PRICE;
   assert(cost<=0||p.score>=cost,'Not enough points to purchase these hints.');
   p.score-=cost;(s.final.purchasedHints??={})[p.id]=action.count;
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
   s.players.forEach(p=>{if(s.final!.wagers[p.id]===undefined)s.final!.wagers[p.id]=0;});openFinalQuestion(s,now);break;
 }
 case 'wager':{
   const p=player(s,actor);assert(s.phase==='final-wager'&&!!s.final,'Final wagering has closed.');assert(s.final.wagers[p.id]===undefined,'Your wager is already locked.');
   assert(Number.isInteger(action.amount)&&action.amount>=0&&action.amount<=Math.max(0,p.score),'Wager must be between zero and your score.');s.final.wagers[p.id]=action.amount;
   if(s.players.every(pl=>s.final!.wagers[pl.id]!==undefined)){openFinalQuestion(s,now);}
   break;
 }
 case 'final-answer':{
   const p=player(s,actor);assert(s.phase==='final-question'&&!!s.final,'Final answers are closed.');assert(now<=(s.final.deadlineAt??0),'The final timer has ended.');assert(!s.final.answers[p.id],'You already answered.');
   const q=FINALS.find(q=>q.id===s.final!.id)!;const ans=String(action.answer||'').trim();assert(ans.length>0&&ans.length<=200,'Enter an answer.');
   // Final Word is always independently typed, regardless of any regular-round accommodation.
   const correct=isCorrectForQuestion(ans,q);const points=(s.final.wagers[p.id]??0)*(correct?1:-1);
   s.final.answers[p.id]={answer:ans,at:now,correct,points,doubleTake:false,hintUsed:Boolean(s.final.revealedHints?.[p.id]),answerFormat:'written',responseMs:Math.max(0,now-(s.final.startedAt??now)),initialCorrect:correct};
   if(s.players.every(p=>s.final!.answers[p.id]))finishFinal(s,now);break;
 }
 case 'finish':{host(actor);assert(s.phase==='final-results'&&!s.final?.disputeIds.length&&now>=(s.final?.feedbackPauseUntil??0),'Resolve all disputes and let the feedback break finish before finishing.');s.phase='finished';break;}
 case 'new-game':{
   host(actor);assert(s.phase==='finished','Finish this show first.');// A rematch carries every played question and selected/offered category.
   // Include the selected categories for older rooms created before category histories existed.
   const categories=rememberRecent(s.recentCategoryIds??[],[...s.selected[0],...s.selected[1]],CATEGORIES.length);
   const n=makeGame(s.recentQuestionIds,categories,s.recentCategoryOffers??[],s.hostHistoryId);n.id=s.id;n.createdAt=s.createdAt;n.settings={...s.settings};n.guestHistoryKeys=s.guestHistoryKeys;n.players=s.players.map(p=>({...p,pendingChoiceAccess:undefined,score:0,hintsRemaining:n.settings.normalHints+p.bonusHints,doubleTakesRemaining:1}));log(n,'Rematch! Same players and settings. Get ready for a new show.');return n;
 }
 case 'close-show':{
   host(actor);assert(s.phase==='finished','Finish this show first.');s.phase='closed';for(const p of s.players)delete p.ageBand;log(s,'The host started a new show. Returning everyone to the home page.');break;
 }
 default:throw new GameError('Unknown action type.');
 }
 return s;
}
export function makeView(original:GameState,actor:Actor,revision:number,now=Date.now(),committedOnly=false){
 const s=committedOnly?original:tick(original,now),me=actor.kind==='player'?s.players.find(p=>p.id===actor.id):undefined;
 const q=s.active?getQuestion(s.active.questionId):undefined;
 const intro=s.active&&q?{key:s.active.key,category:CATEGORY_LOOKUP.get(q.categoryId)?.name,points:roundPoints(s,s.active.key),until:s.active.introUntilAt}:undefined;
 const current=s.phase==='question'&&s.active&&q?{
   // An active view always has a question key; do not spread the optional intro view.
   key:s.active.key,category:CATEGORY_LOOKUP.get(q.categoryId)?.name,points:roundPoints(s,s.active.key),until:s.active.introUntilAt,
   prompt:q.prompt,image:q.image,startedAt:s.active.startedAt,deadlineAt:s.active.deadlineAt,stealTurn:!!s.active.stealTurn,
   answeringId:s.active.stealTurn?s.active.stealId:s.active.turnId,
   submissionCount:Object.keys(s.active.answers).length,
   mySubmission:me?s.active.answers[me.id]?.answer:undefined,
   myDraft:me?s.active.drafts?.[me.id]?.answer:undefined,
   myDeadlineAt:me?(s.active.deadlineAt??0)+me.bonusTimeSeconds*1000:undefined,
   myHintPrice:regularHintPrice(roundPoints(s,s.active.key)),
   myHintPurchases:me?s.active.hintPurchases?.[me.id]:undefined,
   myChoices:(me&&activeChoices(s.active,me)&&(s.settings.mode==='individual'||(s.active.stealTurn?s.active.stealId:s.active.turnId)===me.id))?visibleOptions(s.active,me,q):undefined,
   // Never send the answer before reveal—even to the host, who may also be playing.
   hostAnswer:undefined,
 }:undefined;
 const res=s.phase==='results'&&s.resolution?{...s.resolution,image:getQuestion(s.resolution.questionId)?.image,answers:Object.fromEntries(Object.entries(s.resolution.answers).map(([id,a])=>[id,{...a}]))}:undefined;
 const finalQ=s.final?FINALS.find(f=>f.id===s.final?.id):undefined;
 const f=s.final&&finalQ?{
   category:finalQ.category,topicPreview:finalQ.topicPreview,prompt:['final-question','final-results','finished'].includes(s.phase)?finalQ.prompt:undefined,
   image:['final-question','final-results','finished'].includes(s.phase)?finalQ.image:undefined,
   answer:['final-results','finished'].includes(s.phase)?finalQ.answer:undefined,
   deadlineAt:s.final.deadlineAt,endsAt:s.final.endsAt,noShow:s.final.noShow,wagerCount:Object.keys(s.final.wagers).length,answerCount:Object.keys(s.final.answers).length,
   myWager:me?s.final.wagers[me.id]:undefined,myAnswer:me?s.final.answers[me.id]?.answer:undefined,
   myDraft:me?s.final.drafts?.[me.id]:undefined,
   hintPrice:FINAL_HINT_PRICE, maxHints:MAX_FINAL_HINTS,
   myPurchasedHints:me?(s.final.purchasedHints?.[me.id]??0):undefined,
   myPurchasableHints:me&&s.phase==='final-wager'&&s.final.wagers[me.id]===undefined?Math.max(0,MAX_FINAL_HINTS-(s.final.purchasedHints?.[me.id]??0)):0,
   myRevealedHints:me&&['final-question','final-results','finished'].includes(s.phase)?finalQ.hints.slice(0,s.final.revealedHints?.[me.id]??0):[],
   myAvailableHints:me&&s.phase==='final-question'?Math.max(0,Math.min(MAX_FINAL_HINTS-(s.final.revealedHints?.[me.id]??0),(s.final.purchasedHints?.[me.id]??0)-(s.final.purchasedHintsUsed?.[me.id]??0))):0,
   results:['final-results','finished'].includes(s.phase)?s.players.map(p=>({id:p.id,name:p.name,answer:s.final!.answers[p.id]?.answer||'(no answer)',correct:s.final!.answers[p.id]?.correct||false,points:s.final!.answers[p.id]?.points||0,wager:s.final!.wagers[p.id]??0})):undefined,
   disputeIds:s.final.disputeIds,reviewedIds:s.final.reviewedIds,questionId:s.phase==='final-results'?s.final.id:undefined,
 }:undefined;
 return {revision,serverNow:now,phase:s.phase,roomId:s.id,role:actor,settings:{...s.settings,displayMode:s.settings.displayMode??'tv'},players:s.players.map((p):Player=>{if(actor.kind==='host'&&s.phase==='lobby')return p;const {ageBand,age,pendingChoiceAccess,requestedChoiceAccess,...publicPlayer}=p;return actor.kind==='host'||me?.id===p.id?{...publicPlayer,pendingChoiceAccess,requestedChoiceAccess}:publicPlayer;}),round:s.round,
 roundNames:ROUND_NAMES,roundValues:ROUND_VALUES,selected:s.selected,usedKeys:s.usedKeys,chooserId:currentPlayer(s)?.id,
 categories:CATEGORIES.filter(c=>!c.activeMonths||availableCategories(new Date(now)).some(x=>x.id===c.id)||s.draftPool.includes(c.id)||s.selected[0].includes(c.id)||s.selected[1].includes(c.id)).map(c=>({id:c.id,name:c.name,description:c.description,type:c.type})),draftPool:s.draftPool,draftIndex:s.draftIndex,
 draftTurnId:s.players.length?s.players[(s.draftIndex+s.round*4)%s.players.length]?.id:undefined,
 active:current,intro,results:res,final:f,feedbackPauseUntil:s.phase==='results'?s.resolution?.feedbackPauseUntil:s.phase==='final-results'?s.final?.feedbackPauseUntil:undefined,
 lastReview:me&&s.resolution&&['board','draft','final-wager'].includes(s.phase)&&s.resolution.answers[me.id]&&!s.resolution.answers[me.id].correct&&s.resolution.answers[me.id].answer.trim()&&s.resolution.answers[me.id].answer!=='(no answer)'&&!s.resolution.reviewedIds?.includes(me.id)?{questionId:s.resolution.questionId}:undefined,myHints:me?.hintsRemaining,paused:!!s.pausedAt,pausedAt:s.pausedAt,announcement:s.announcement,eventLog:s.eventLog.slice(0,10),
 answerFormatRequestCount:s.players.filter(p=>p.pendingChoiceAccess!==undefined).length,yourPlayer:me?.id,playedQuestionIds:s.recentQuestionIds,playedCategoryIds:s.recentCategoryIds??[],offeredCategoryIds:s.recentCategoryOffers??[],
 };
}
export type GameView=ReturnType<typeof makeView>;