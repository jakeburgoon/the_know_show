'use client';
import {useState} from 'react';
import {ArrowLeft,ArrowRight,Check,Clapperboard,MonitorPlay,Smartphone,Users} from 'lucide-react';
import type {DisplayMode,Mode,Settings} from '@/lib/game';

const stages=['Who is playing?','How will everyone see the show?','How will players answer questions?'];
type Props={step:number;settings:Settings;busy:boolean;error?:string;onBack:()=>void;onNext:(update:Partial<Settings>)=>Promise<void>};
export default function HostWizard({step,settings,busy,error,onBack,onNext}:Props){
 const options: {value:string;title:string;details:string;recommendation?:string;icon?:React.ReactNode}[] =
   step===0?[
    {value:'individual',title:'Individual players',details:'Everyone answers every question and earns their own points.',icon:<Users/>},
    {value:'teams',title:'Teams',details:'Each team joins under one team name. Teams take turns answering and can steal.',icon:<Users/>}]:
   step===1?[
    {value:'tv',title:'TV + phones',details:'Show the shared game board on a TV using a laptop or compatible TV browser. Players answer on their phones.',icon:<MonitorPlay/>},
    {value:'phones',title:'Just phones',details:'Everyone sees the board, questions, and scores on their own phone. No TV or laptop needed.',icon:<Smartphone/>}]:[
    {value:'choices',title:'Everyone chooses',details:'Four answer options are given. Players select the answer they think is correct.',recommendation:'Recommended for your first show'},
    {value:'written',title:'Everyone writes',details:'No answer options are given. Players must recall and write their own answers.'},
    {value:'mixed',title:'Everyone uses the same mixture',details:'For example, players choose from options for Hard questions but recall and write their answers for Easy and Medium questions.'},
    {value:'individual',title:'Individual answer preferences',details:'Let players choose how they answer. Great for relaxed games or groups with different ages and experience levels. Players may have different advantages when earning points.'}];
 // Keep a choice visible for review. Only Next saves it and advances setup.
 const initialChoice=step===0?settings.mode:step===1?(settings.displayMode??'phones'):(settings.answerStyle??'choices');
 const [selected,setSelected]=useState<string>(initialChoice);
 const [mixed,setMixed]=useState<'hard'|'medium-hard'>(settings.mixedAccess??'hard');
 const next=async()=>{
   if(step===0)await onNext({mode:selected as Mode});
   else if(step===1)await onNext({displayMode:selected as DisplayMode});
   else await onNext({answerStyle:selected as Settings['answerStyle'],mixedAccess:mixed});
 };
 return <main className="ks-wizard">
   <header className="ks-wizard-brand"><img src="/know-show-logo.png" alt="The Know Show"/><span>HOST SETUP</span></header>
   <section className="ks-wizard-card">
    <div className="ks-wizard-progress"><span>QUESTION {step+1} OF 3</span><span>{Math.round((step/3)*100)}% complete</span></div>
    <div className="ks-step-dots" aria-label={`Setup step ${step+1} of 3`}>{stages.map((_,i)=><span key={i} className={i<=step?'done':''}/>)}</div>
    <div className="ks-wizard-kicker"><Clapperboard size={18}/> MAKE YOUR SHOW YOUR OWN</div>
    <h1>{stages[step]}</h1>
    <p>Choose what works for your group. You can review your choice before moving on.</p>
    <div className="ks-wizard-options">
      {options.map(opt=><button key={opt.value} type="button" disabled={busy} className={'ks-wizard-option'+(selected===opt.value?' selected':'')} onClick={()=>setSelected(opt.value)} aria-pressed={selected===opt.value}>
       {opt.icon&&<span className="ks-wizard-icon">{opt.icon}</span>}
       <span className="ks-wizard-option-text"><strong>{opt.title}</strong>{opt.recommendation&&<span className="ks-format-recommendation">{opt.recommendation}</span>}<small>{opt.details}</small></span>
       <span className="ks-wizard-check">{selected===opt.value?<Check size={20}/>:<ArrowRight size={19}/>}</span>
      </button>)}
    </div>
    {step===1&&selected==='tv'&&<aside className="ks-wizard-tv-help" aria-label="How TV mode works">
      <strong>Setting up the shared TV display</strong>
      <p>In the Green Room, open <b>TV display</b> on a laptop and connect it to your TV by HDMI or screen casting. A compatible smart-TV browser may open that display directly. The host can join as a player from a second phone.</p>
      <small>Mirroring someone’s Player View shows their personal screen, not the shared game board.</small>
    </aside>}
    {step===2&&selected==='mixed'&&<aside className="ks-wizard-tv-help"><strong>When should answer options be available?</strong><label><input type="radio" name="mix" checked={mixed==='hard'} onChange={()=>setMixed('hard')}/> Hard questions only</label><label><input type="radio" name="mix" checked={mixed==='medium-hard'} onChange={()=>setMixed('medium-hard')}/> Medium and Hard questions</label></aside>}
    {step===2&&<p><strong>The final question requires a written answer from everyone.</strong></p>}
    {error&&<p className="ks-wizard-error" role="alert">{error}</p>}
    <nav className="ks-wizard-nav" aria-label="Setup navigation">
      {step>0?<button className="ks-back" type="button" disabled={busy} onClick={onBack}><ArrowLeft size={18}/> Previous</button>:<span aria-hidden="true"/>}
      <button className="ks-next" type="button" disabled={busy||!selected} onClick={()=>void next()}>
        {busy?'Saving…':step===2?'Continue to Green Room':'Next'} <ArrowRight size={18}/>
      </button>
    </nav>
   </section>
 </main>;
}
