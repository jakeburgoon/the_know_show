import {createHmac,timingSafeEqual} from 'node:crypto';
import {type Actor,type GameState,type GameView,makeView} from './game';
import {CATEGORY_LOOKUP,FINALS,getQuestion} from './questions';
import {FEEDBACK_REASONS,FEEDBACK_VERSION,type FeedbackOffer,type QuestionContext} from './feedback-types';
export const SESSION_COOKIE='ks_developer';
export function developerPassword(){const p=process.env.DEVELOPER_PASSWORD;return p&&p.length>=24?p:undefined;}
function sign(value:string,scope:string){const p=developerPassword();if(!p)throw new Error('Feedback not configured');return createHmac('sha256',p).update(scope+'\0'+value).digest('base64url');}
export function safeEqual(a:string,b:string){const aa=Buffer.from(a),bb=Buffer.from(b);return aa.length===bb.length&&timingSafeEqual(aa,bb);}
function seal(value:unknown,scope:string){const body=Buffer.from(JSON.stringify(value)).toString('base64url');return `${body}.${sign(body,scope)}`;}
function unseal(token:string,scope:string):unknown {try{if(!developerPassword()||token.length>24000)return null;const [body,mac,extra]=token.split('.');if(!body||!mac||extra!==undefined||!safeEqual(mac,sign(body,scope)))return null;return JSON.parse(Buffer.from(body,'base64url').toString('utf8'));}catch{return null;}}
export function newDeveloperSession(now=Date.now()){return seal({expires:now+8*60*60*1000},'developer-session');}
export function validDeveloperSession(token:string,now=Date.now()){const s=unseal(token,'developer-session') as {expires?:number}|null;return !!s&&typeof s.expires==='number'&&s.expires>now;}
type Ticket={expires:number;version:string;showId:string;reporter:string;kind:'question'|'show';question?:QuestionContext};
export function readFeedbackTicket(token:string,now=Date.now()):Ticket|null{const t=unseal(token,'feedback-ticket') as Ticket|null;return t&&t.expires>now&&(t.kind==='question'||t.kind==='show')?t:null;}
export function feedbackOffer(view:GameView,s:GameState,actor:Actor,now=Date.now()):FeedbackOffer|undefined{
 if(!developerPassword()||actor.kind==='spectator'||(actor.kind==='player'&&!s.players.some(p=>p.id===actor.id)))return;
 const showId=s.feedbackShowId??s.id;
 const reporter=sign(`${showId}:${actor.kind}:${actor.id??'host'}`,'feedback-reporter');
 let question:QuestionContext|undefined;
 if(view.phase==='results'&&view.results){const r=view.results,q=getQuestion(r.questionId);if(!q)return;const a=actor.id?r.answers[actor.id]:undefined;
 question={id:q.id,category:CATEGORY_LOOKUP.get(q.categoryId)?.name??r.category,difficulty:['Easy','Medium','Hard'][q.level-1]??String(q.level),prompt:q.prompt,image:q.image,answer:q.answer,submittedAnswer:a?.answer??null,correct:a?.correct??null,answerFormat:a?.answerFormat??null,hintUsed:a?.hintUsed??null,hintText:[q.hint],choices:[q.answer,...(q.distractors??[])],points:r.points};
 }else if(view.phase==='final-results'&&s.final){const f=s.final,q=FINALS.find(x=>x.id===f.id);if(!q)return;const a=actor.id?f.answers[actor.id]:undefined;
 question={id:q.id,category:q.category,difficulty:'Final Word',prompt:q.prompt,image:q.image,answer:q.answer,submittedAnswer:a?.answer??null,correct:a?.correct??null,answerFormat:a?'written':null,hintUsed:actor.id?Boolean(f.revealedHints?.[actor.id]):null,hintText:q.hints,choices:[],points:null};
 }else if(view.phase!=='finished')return;
 const kind=question?'question':'show';
 const ticket:Ticket={expires:now+2*60*60*1000,version:FEEDBACK_VERSION,showId,reporter,kind,question};
 return {kind,ticket:seal(ticket,'feedback-ticket'),question,key:`${showId}:${reporter}:${question?.id??'show'}`};
}
export function makeFeedbackView(state:GameState,actor:Actor,revision:number,now=Date.now(),committedOnly=false){
 const view=makeView(state,actor,revision,now,committedOnly);return {...view,feedback:feedbackOffer(view,state,actor,now)};
}
export function feedbackInsert(ticket:Ticket,body:Record<string,unknown>){
 const clean=(v:unknown,max:number)=>typeof v==='string'?v.trim().slice(0,max):'';
 const reasons=Array.isArray(body.reasons)?[...new Set(body.reasons.filter((r):r is string=>typeof r==='string'&&FEEDBACK_REASONS.some(([key])=>key===r)&&(r!=='image'||!!ticket.question?.image)))]:[];
 const comment=clean(body.comment,2000),experience=clean(body.experience,2000),categoryIdeas=clean(body.categoryIdeas,1000);
 const rating=typeof body.rating==='number'&&Number.isInteger(body.rating)&&body.rating>=1&&body.rating<=5?body.rating:null;
 if(ticket.kind==='question'&&!reasons.length)return null;
 if(ticket.kind==='show'&&!rating&&!experience&&!categoryIdeas&&!comment)return null;
 return {dedupe_key:sign(`${ticket.showId}:${ticket.reporter}:${ticket.question?.id??'show'}`,'feedback-dedupe'),show_id:ticket.showId,app_version:ticket.version,kind:ticket.kind,question_id:ticket.question?.id??null,question:ticket.question??null,reasons:ticket.kind==='question'?reasons:[],comment,rating:ticket.kind==='show'?rating:null,experience:ticket.kind==='show'?experience:'',category_ideas:ticket.kind==='show'?categoryIdeas:''};
}
