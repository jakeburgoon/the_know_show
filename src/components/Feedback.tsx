'use client';
import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {Flag,MessageSquare,X} from 'lucide-react';
import {FEEDBACK_REASONS,type FeedbackOffer} from '@/lib/feedback-types';
const FeedbackContext=createContext<{open:(offer:FeedbackOffer)=>void;sent:Set<string>}|null>(null);
export function FeedbackProvider({children}:{children:ReactNode}){
 const [offer,setOffer]=useState<FeedbackOffer|null>(null),[sent,setSent]=useState<Set<string>>(new Set());
 return <FeedbackContext.Provider value={{open:setOffer,sent}}>{children}{offer&&<FeedbackDialog key={offer.key} offer={offer} close={()=>setOffer(null)} onSaved={()=>setSent(old=>new Set([...old,offer.key]))}/>}</FeedbackContext.Provider>;
}
export function FeedbackLink({offer}:{offer?:FeedbackOffer}){
 const context=useContext(FeedbackContext);if(!offer||!context)return null;
 const sent=context.sent.has(offer.key);
 return <button type="button" className={'ks-feedback-link '+(offer.kind==='show'?'ks-feedback-show-link':'')} disabled={sent} onClick={()=>context.open(offer)}>{offer.kind==='question'?<Flag size={15} aria-hidden="true"/>:<MessageSquare size={16} aria-hidden="true"/>}{sent?'Feedback sent':offer.kind==='question'?'Question feedback':'Help us improve The Know Show! Share your feedback.'}</button>;
}
function FeedbackDialog({offer,close,onSaved}:{offer:FeedbackOffer;close:()=>void;onSaved:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 const [reasons,setReasons]=useState<string[]>([]),[rating,setRating]=useState(0),[experience,setExperience]=useState(''),[categoryIdeas,setCategoryIdeas]=useState(''),[comment,setComment]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false);
 useEffect(()=>{const d=dialog.current;if(d&&!d.open)d.showModal();return()=>{if(d?.open)d.close();};},[]);
 const question=offer.question;
 const valid=offer.kind==='question'?reasons.length>0:Boolean(rating||experience.trim()||categoryIdeas.trim()||comment.trim());
 async function submit(){setBusy(true);setError('');try{const res=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ticket:offer.ticket,reasons,rating,experience,categoryIdeas,comment})});const data=await res.json();if(!res.ok)throw new Error(data.error||'Unable to save feedback.');setSaved(true);onSaved();}catch(e){setError(e instanceof Error?e.message:'Unable to save feedback.');}finally{setBusy(false);}}
 return <dialog ref={dialog} className="ks-feedback-dialog" aria-labelledby="ks-feedback-title" onCancel={e=>{e.preventDefault();if(!busy)close();}}><div className="ks-feedback-heading"><h2 id="ks-feedback-title">{saved?'Thank you!':question?'Question feedback':'Help us improve the show!'}</h2><button type="button" className="ks-feedback-close" aria-label="Close feedback" disabled={busy} onClick={close}><X size={22}/></button></div>
 {saved?<><p role="status">Your feedback has been saved. Thanks for helping us improve The Know Show!</p><button className="ks-feedback-submit" onClick={close}>Done</button></>:<form onSubmit={e=>{e.preventDefault();if(valid&&!busy)void submit();}}>
 {question?<><div className="ks-feedback-question"><small>{question.category} · {question.difficulty}</small><p>{question.prompt}</p><p><strong>Correct answer:</strong> {question.answer}</p>{question.submittedAnswer!==null&&<p><strong>Your answer:</strong> {question.submittedAnswer}</p>}</div><fieldset><legend>What could be improved? Select all that apply.</legend>{FEEDBACK_REASONS.map(([key,label])=><label className="ks-feedback-check" key={key}><input type="checkbox" checked={reasons.includes(key)} onChange={e=>setReasons(old=>e.target.checked?[...old,key]:old.filter(r=>r!==key))}/><span>{label}</span></label>)}</fieldset></>:<><fieldset><legend>How much did you enjoy the show?</legend><div className="ks-feedback-ratings">{[1,2,3,4,5].map(n=><label key={n}><input type="radio" name="enjoyment" value={n} checked={rating===n} onChange={()=>setRating(n)}/><span>{n}</span></label>)}</div><div className="ks-feedback-scale"><small>Not much</small><small>Loved it!</small></div></fieldset><label className="ks-feedback-field">Did anything not work as expected, or could anything be improved?<textarea rows={3} maxLength={2000} value={experience} onChange={e=>setExperience(e.target.value)} placeholder="Tell us about your experience…"/></label><label className="ks-feedback-field">What new categories would you love to see?<textarea rows={2} maxLength={1000} value={categoryIdeas} onChange={e=>setCategoryIdeas(e.target.value)} placeholder="Suggest a category…"/></label></>}
 <label className="ks-feedback-field">{question?'Additional comments (optional)':'Anything else you’d like us to know?'}<textarea rows={2} maxLength={2000} value={comment} onChange={e=>setComment(e.target.value)}/></label>
 <p className="ks-feedback-privacy">Optional and private. No player name or email is attached. Please avoid personal information. {question?'Your question and submitted answer are included. Feedback does not pause the show or change your score.':'All responses are optional.'}</p>
 {error&&<p role="alert" className="ks-feedback-error">{error}</p>}<button className="ks-feedback-submit" disabled={!valid||busy}>{busy?'Sending…':'Submit feedback'}</button>
 </form>}
 </dialog>;
}
