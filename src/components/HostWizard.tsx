'use client';
import {useState} from 'react';
import {ArrowLeft,ArrowRight,Check,Clapperboard,MonitorPlay,Music2,Smartphone,Users} from 'lucide-react';
import {SUNO_SOUNDTRACKS} from '@/lib/suno-catalog';
import type {AnswerStyle,DisplayMode,Mode,MusicStyle,Settings} from '@/lib/game';

const stages=['Who is playing?','Where will the show happen?','What is the soundtrack?','How will players answer?'];
type Props={step:number;settings:Settings;busy:boolean;error?:string;onBack:()=>void;onNext:(update:Partial<Settings>)=>Promise<void>};
export default function HostWizard({step,settings,busy,error,onBack,onNext}:Props){
 const options: {value:string;title:string;details:string;icon?:React.ReactNode}[] =
   step===0?[
    {value:'individual',title:'Individual players',details:'Everyone answers every question and earns their own points.',icon:<Users/>},
    {value:'teams',title:'Teams',details:'Each team joins under one team name. Teams take turns answering and can steal.',icon:<Users/>}]:
   step===1?[
    {value:'tv',title:'TV + phones',details:'Show the big game board on a TV. Players answer on their phones.',icon:<MonitorPlay/>},
    {value:'phones',title:'Just phones',details:'Each player sees the questions and scores on their own device.',icon:<Smartphone/>}]:
   step===2?[
    {value:'off',title:'No music',details:'Keep things quiet; optional countdown sounds are controlled separately.',icon:<Music2/>},
    ...SUNO_SOUNDTRACKS.map(t=>({value:t.id,title:t.label,details:'Play the selected soundtrack on the host phone or TV.',icon:<Music2/>}))]:
   [
    {value:'written',title:'Everyone writes',details:'Everyone types their answers. No answer options are given.'},
    {value:'choices',title:'Everyone chooses',details:'Choose from four possible answers for each regular question. The final question is written.'},
    {value:'mixed',title:'A mix of both',details:'Give each player written answers or four choices. This can help level the playing field across ages or abilities. The final question is written.'}
   ];
 // Keep a choice visible for review. Only Next saves it and advances setup.
 const initialChoice=step===0?settings.mode:step===1?(settings.displayMode??'tv'):step===2?settings.music:(settings.answerStyle??'written');
 const [selected,setSelected]=useState<string>(initialChoice);
 const next=async()=>{
   if(step===0)await onNext({mode:selected as Mode});
   else if(step===1)await onNext({displayMode:selected as DisplayMode});
   else if(step===2)await onNext({music:selected as MusicStyle,arrangement:0});
   else await onNext({answerStyle:selected as AnswerStyle});
 };
 return <main className="ks-wizard">
   <header className="ks-wizard-brand"><img src="/know-show-logo.png" alt="The Know Show"/><span>HOST SETUP</span></header>
   <section className="ks-wizard-card">
    <div className="ks-wizard-progress"><span>QUESTION {step+1} OF 4</span><span>{Math.round((step/4)*100)}% complete</span></div>
    <div className="ks-step-dots" aria-label={`Setup step ${step+1} of 4`}>{stages.map((_,i)=><span key={i} className={i<=step?'done':''}/>)}</div>
    <div className="ks-wizard-kicker"><Clapperboard size={18}/> MAKE YOUR SHOW YOUR OWN</div>
    <h1>{stages[step]}</h1>
    <p>{step===3?'Choose a starting format. You can customize each player after everyone joins.':'Pick what works for your group. You can change these settings before the game begins.'}</p>
    <div className={'ks-wizard-options'+(step===2?' music':'')}>
      {options.map(opt=><button key={opt.value} type="button" disabled={busy} className={'ks-wizard-option'+(selected===opt.value?' selected':'')} onClick={()=>setSelected(opt.value)} aria-pressed={selected===opt.value}>
       {opt.icon&&<span className="ks-wizard-icon">{opt.icon}</span>}
       <span className="ks-wizard-option-text"><strong>{opt.title}</strong><small>{opt.details}</small></span>
       <span className="ks-wizard-check">{selected===opt.value?<Check size={20}/>:<ArrowRight size={19}/>}</span>
      </button>)}
    </div>
    {error&&<p className="ks-wizard-error" role="alert">{error}</p>}
    <nav className="ks-wizard-nav" aria-label="Setup navigation">
      {step>0?<button className="ks-back" type="button" disabled={busy} onClick={onBack}><ArrowLeft size={18}/> Previous</button>:<span aria-hidden="true"/>}
      <button className="ks-next" type="button" disabled={busy||!selected} onClick={()=>void next()}>
        {busy?'Saving…':step===3?'Continue to Green Room':'Next'} <ArrowRight size={18}/>
      </button>
    </nav>
   </section>
 </main>;
}
