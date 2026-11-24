/** Pure journal generation; server persists this with the same CAS as room state. */
import {createHash} from 'node:crypto';
import type {GameState,Submission} from './game';
import {getQuestion,FINALS} from './questions';
import {ADULT_AGE_BANDS,isAdultAgeBand} from './age-support';
export type SelectionAudit={seenBefore:boolean;unseenAvailable:number;candidates:number;seenBy:number;historyScopes:number;minimumSeenBy:number};
export const deviceHistoryKey=(id:string)=>createHash('sha256').update('know-show-host:'+id).digest('hex');
export const historyKey=(s:GameState)=>deviceHistoryKey(s.hostHistoryId??s.id);
export const historyKeys=(s:GameState)=>[...new Set([historyKey(s),...Object.values(s.guestHistoryKeys??{})])];
export const seenCount=(s:GameState,id:string)=>s.recentQuestionIds.includes(id)?Math.max(1,s.questionSeenCounts?.[id]??1):0;
export function auditSelection(s:GameState,id:string,candidates:readonly {id:string}[]):SelectionAudit{
 return {seenBefore:seenCount(s,id)>0,unseenAvailable:candidates.filter(q=>!seenCount(s,q.id)).length,candidates:candidates.length,seenBy:seenCount(s,id),historyScopes:s.historyScopeCount??1,minimumSeenBy:Math.min(...candidates.map(q=>seenCount(s,q.id)))};
}
function counts(answers:Record<string,Submission>,seats:number,skipped=false,hintUsers=0,hintCount=hintUsers){
 const a=Object.values(answers).filter(x=>x.answer.trim()&&x.answer!=='(no answer)');
 const written=a.filter(x=>x.answerFormat!=='choices'),choices=a.filter(x=>x.answerFormat==='choices');
 const timed=a.filter(x=>typeof x.responseMs==='number'&&Number.isFinite(x.responseMs));
 return {attempted:skipped?0:a.length,correct:skipped?0:a.filter(x=>x.correct).length,written:skipped?0:written.length,writtenCorrect:skipped?0:written.filter(x=>x.correct).length,choices:skipped?0:choices.length,choicesCorrect:skipped?0:choices.filter(x=>x.correct).length,hints:skipped?0:a.filter(x=>x.hintUsed).length,hintUsers,hintCount,notAnswered:skipped?0:Math.max(0,seats-a.length),eligibleSeats:seats,overturned:skipped?0:a.filter(x=>x.overturned).length,timed:skipped?0:timed.length,responseMs:skipped?0:timed.reduce((n,x)=>n+(x.responseMs??0),0),skipped,
  // No display names, device IDs, room player IDs, or raw typed answers. Canonical
  // choice index 0=correct, 1–3=distractors as stored at the time of play.
  responses:skipped?[]:a.map(x=>({format:x.answerFormat??'written',correct:x.correct,initialCorrect:x.initialCorrect??x.correct,hintUsed:x.hintUsed,responseMs:x.responseMs??null,overturned:!!x.overturned,optionIndex:x.optionIndex??null}))};
}
/** Adult-only aggregate counts, never age-tagged individual responses. Teams are not individuals. */
function ageSummary(state:GameState,answers:Record<string,Submission>,skipped=false){
 if(state.settings.mode!=='individual'||skipped)return {};
 return Object.fromEntries(ADULT_AGE_BANDS.flatMap(band=>{
  const players=state.players.filter(p=>isAdultAgeBand(p.ageBand)&&p.ageBand===band);
  if(!players.length)return [];
  const entries=players.map(p=>answers[p.id]).filter((a):a is Submission=>!!a&&!!a.answer.trim()&&a.answer!=='(no answer)');
  const written=entries.filter(a=>a.answerFormat!=='choices'),choices=entries.filter(a=>a.answerFormat==='choices');
  const timed=entries.filter(a=>typeof a.responseMs==='number'&&Number.isFinite(a.responseMs));
  return [[band,{eligible:players.length,attempts:entries.length,correct:entries.filter(a=>a.correct).length,written:written.length,writtenCorrect:written.filter(a=>a.correct).length,choices:choices.length,choicesCorrect:choices.filter(a=>a.correct).length,hints:entries.filter(a=>a.hintUsed).length,noAnswer:players.length-entries.length,timed:timed.length,responseMs:timed.reduce((sum,a)=>sum+(a.responseMs??0),0),overturned:entries.filter(a=>a.overturned).length}]];
 }));
}
export function exposureJournal(before:GameState,after:GameState,now=Date.now()){
 const showId=after.feedbackShowId??after.id;
 const started=before.phase==='lobby'&&after.phase==='draft';
 const draft=after.phase==='draft'&&(started||before.round!==after.round||before.phase!=='draft');
 const selected=after.selected.flat().filter(id=>!before.selected.flat().includes(id));
 const complete=after.phase==='finished'&&before.phase!=='finished';
 const exposures:{id:string;category:string;level:number;round:number;at:string;diagnostic:SelectionAudit|null;stats:(ReturnType<typeof counts>&{ageSummary?:ReturnType<typeof ageSummary>})|null}[]=[];
 const add=(id:string,final:boolean,at:number,stats:(ReturnType<typeof counts>&{ageSummary?:ReturnType<typeof ageSummary>})|null)=>{
  const q=final?FINALS.find(x=>x.id===id):getQuestion(id);if(!q)return;
  const category=q.categoryId??'legacy';const level=final?4:(q as {level:number}).level;
  exposures.push({id,category,level,round:final?3:after.round+1,at:new Date(at).toISOString(),diagnostic:after.selectionAudit?.[id]??null,stats});
 };
 if(after.phase==='question'&&after.active?.startedAt!==undefined&&(before.phase!=='question'||before.active?.questionId!==after.active.questionId))add(after.active.questionId,false,after.active.startedAt,null);
 if(after.phase==='results'&&after.resolution&&(before.phase!=='results'||JSON.stringify(before.resolution?.answers)!==JSON.stringify(after.resolution.answers))){
  const r=after.resolution;add(r.questionId,false,r.revealedAt??before.active?.startedAt??r.finishedAt,{...counts(r.answers,r.eligibleSeats??after.players.length,!!r.skipped,r.hintUsers?.length??0),ageSummary:ageSummary(after,r.answers,!!r.skipped)});
 }
 if(after.phase==='final-question'&&after.final?.startedAt!==undefined&&before.phase!=='final-question')add(after.final.id,true,after.final.startedAt,null);
 if((after.phase==='final-results'||after.phase==='finished')&&after.final?.startedAt!==undefined&&(before.phase==='final-question'||before.phase==='final-wager'||(before.phase==='final-results'&&JSON.stringify(before.final?.answers)!==JSON.stringify(after.final.answers)))){
  const hints=Object.values(after.final.revealedHints??{});add(after.final.id,true,after.final.startedAt,{...counts(after.final.answers,after.players.length,false,hints.filter(n=>n>0).length,hints.reduce((a,b)=>a+b,0)),ageSummary:ageSummary(after,after.final.answers)});
 }
 const seed=before.seedHistory??before;
 return {showId,hostKey:historyKey(after),historyKeys:historyKeys(after),started,complete,at:new Date(now).toISOString(),seats:after.players.length,mode:after.settings.mode,selected:after.selected,offers:draft?{[String(after.round+1)]:after.draftPool}:{},newSelected:selected,offerDiagnostics:draft?{[String(after.round+1)]:after.categoryAudit?.[String(after.round+1)]??[]}: {},historyScopes:after.historyScopeCount??historyKeys(after).length,exposures,seed:started?{questions:seed.recentQuestionIds,categories:seed.recentCategoryIds??[],offers:seed.recentCategoryOffers??[]}:null};
}
