'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {useParams,useRouter} from 'next/navigation';
import Link from 'next/link';
import {QRCodeSVG} from 'qrcode.react';
import {Trophy,Volume2,VolumeX,Play,CheckCircle,Users, RotateCcw, Home, Check, X} from 'lucide-react';
import HostWizard from './HostWizard';
import {SUNO_SOUNDTRACKS,sunoEmbedUrl} from '@/lib/suno-catalog';
import type {Action,GameView,MusicStyle,Player,Settings} from '@/lib/game';
import {actorToken,type DeviceTab} from '@/lib/device-session';
import {finalStandings} from '@/lib/standings';

const fmt=(n:number)=>n.toLocaleString('en-US');
const remain=(until:number|undefined,now:number)=>until===undefined? '—' : `${Math.max(0,Math.ceil((until-now)/1000))}s`;
function Scoreboard({players,chooserId}:{players:Player[];chooserId?:string}){
 return <div className="v2scores">{[...players].sort((a,b)=>b.score-a.score).map((p,i)=><div className={'v2score '+(chooserId===p.id?'selecting':'')} key={p.id}><span className="v2rank">{i+1}</span><strong>{p.name}</strong><b>{fmt(p.score)}</b></div>)}</div>;
}
/** One shared curtain call for the TV, phones and host. Ties share first place. */
function CurtainCall({players,mode='tv'}:{players:Player[];mode?:'tv'|'phone'}){
 const {winners,standings,tied}=finalStandings(players);
 return <section className={'v13curtain v13curtain--'+mode} aria-label="Final results" aria-live="polite">
   <div className="v13confetti" aria-hidden="true">{Array.from({length:36},(_,i)=><span key={i} style={{left:`${(i*37+11)%100}%`,animationDelay:`${((i*17)%8)/10}s`,animationDuration:`${2.35+((i*7)%13)/10}s`,backgroundColor:i%3===0?'#f8d375':i%3===1?'#fff6d9':'#7eb9c1'}}/>)}</div>
   <div className="v13curtain-inner">
     <p className="v13curtain-eyebrow">✦ THE KNOW SHOW ✦</p>
     <h1>That’s a wrap!</h1>
     <div className="v13trophy"><Trophy size={mode==='tv'?86:64} strokeWidth={1.55} aria-hidden="true"/></div>
     <p className="v13winner-label">{tied?'CO-WINNERS':'TONIGHT’S CHAMPION'}</p>
     <div className={'v13winners'+(tied?' v13winners--tie':'')}>
       {winners.map(p=><div className="v13winner" key={p.id}><strong>{p.name}</strong><span>{fmt(p.score)} <small>POINTS</small></span></div>)}
     </div>
     <p className="v13victory-line">{tied?'A shared victory. What a finish!':'A standing ovation for our winner!'}</p>
     <div className="v13standings">
       <h2>Final standings</h2>
       <ol>{standings.map(({player:p,place,isWinner})=><li key={p.id} className={isWinner?'v13first':''}><span className="v13standing-rank">{place}</span><span className="v13standing-name">{p.name}{isWinner&&<Trophy size={15} strokeWidth={2} aria-label="Winner"/>}</span><strong>{fmt(p.score)} <small>pts</small></strong></li>)}</ol>
     </div>
   </div>
 </section>;
}
/** Two-beat reveal: first the answer and each player's result, then the updated standings. */
function AnswerReveal({view,now,final=false}:{view:GameView;now:number;final?:boolean}){
 const results=view.results;
 const finalResults=view.final?.results;
 const disputes=final?(view.final?.disputeIds??[]):(results?.disputeIds??[]);
 const timeLeft=final?(view.final?.endsAt??now)-now:(results?.endsAt??now)-now;
 const standingsBeat=disputes.length===0&&timeLeft<=(final?4700:3000);
 const answer=final?view.final?.answer:results?.answer;
 return <section className="ks-reveal" aria-live="polite" aria-label="Question results">
   {standingsBeat?<div className="ks-reveal-standings" key="standings"><p className="ks-reveal-kicker">✦ THE SCORES ARE IN</p><h2>Updated leaderboard</h2><Scoreboard players={view.players}/><p className="ks-reveal-next">{final?'The Curtain Call is next!':'Next up: back to the board'}</p></div>
   :<div className="ks-reveal-answer" key="answer"><p className="ks-reveal-kicker">✦ THE CORRECT ANSWER</p><h2>{answer}</h2><div className="ks-reveal-rule"/>
    <div className="ks-reveal-players">{view.players.map(p=>{
      const r=final?finalResults?.find(x=>x.id===p.id):results?.answers[p.id];
      const correct=Boolean(r?.correct),points=r?.points??0;
      return <div key={p.id} className={'ks-reveal-player '+(correct?'correct':'incorrect')}>
       <span className="ks-reveal-mark" aria-label={correct?'Correct':'Incorrect'}>{correct?<Check size={22} strokeWidth={3}/>:<X size={22} strokeWidth={3}/>}</span>
       <span className="ks-reveal-playername">{p.name}<small>{correct?'Correct':r?'Not quite':'No answer'}</small></span>
       <strong>{points>0?'+':''}{fmt(points)} <small>pts</small></strong>
      </div>;
    })}</div>{disputes.length>0&&<p className="ks-review-message">Host reviewing a result…</p>}</div>}
 </section>;
}
function Board({view,onChoose}:{view:GameView;onChoose?:(key:string)=>void}){
 return <div className="v2board">{view.selected[view.round].map(id=>{
  const cat=view.categories.find(c=>c.id===id);return <div className="v2boardcol" key={id}><div className="v2boardcat">{cat?.name||id}</div>
    {view.roundValues[view.round].map((value,i)=>{const key=`${id}:${i}`,used=view.usedKeys.includes(key);return <button type="button" key={key} disabled={!onChoose||used} className={'v2tile '+(used?'used':'')} onClick={()=>onChoose?.(key)}>{used?'':fmt(value)}</button>;})}</div>;
 })}</div>;
}
function DraftStage({view,chooserName,canPick,disabled=false,onChoose}:{view:GameView;chooserName:string;canPick:boolean;disabled?:boolean;onChoose?:(id:string)=>void}){
 const chosen=view.selected[view.round];
 const available=view.draftPool.filter(id=>!chosen.includes(id));
 return <section className="v2draftscene" aria-label="Category draft">
   <header className="v2drafthero">
     <div className="v2draftkicker">✳ CATEGORY DRAFT <span>· {view.roundNames[view.round].toUpperCase()}</span></div>
     <h1><span className="ks-draft-spark" aria-hidden="true">✦</span> Build the Board</h1>
     <p className="v2draftlead">Pick four categories for this round. Here's what each one covers.</p>
     <div className="v2draftprogress" role="progressbar" aria-label="Categories chosen" aria-valuemin={0} aria-valuemax={4} aria-valuenow={chosen.length}>
       {Array.from({length:4},(_,i)=><span key={i} className={i<chosen.length?'filled':''} aria-hidden="true">{i<chosen.length?'✓':i+1}</span>)}
       <strong>{chosen.length} / 4 selected</strong>
     </div>
     <div className={'v2draftturn '+(canPick?'yourturn':'')}>
       <span>{canPick?'✦ YOUR PICK':'✦ UP NEXT'}</span>
       <strong>{canPick?'Your turn to choose!':`${chooserName}’s turn to choose`}</strong>
       <small>{canPick?'Select a category to add it to the board.':'Explore the available categories while you wait.'}</small>
     </div>
   </header>
   {chosen.length>0&&<div className="v2draftlineup"><div className="v2draftsectionhead"><span>THE LINEUP SO FAR</span><small>{chosen.length} of 4</small></div>
     <ol>{chosen.map((id,i)=><li key={id}><span>{i+1}</span>{view.categories.find(c=>c.id===id)?.name||id}</li>)}</ol>
   </div>}
   <div className="v2draftavailable"><div className="v2draftsectionhead"><span>AVAILABLE CATEGORIES</span><small>{available.length} choices</small></div>
     <div className="v2draftoptions">{available.map(id=>{
       const cat=view.categories.find(c=>c.id===id);
       if(!cat)return null;
       const content=<><span className="v2draftkind">{cat.type==='creative'?'Creative category':'Classic category'}</span><strong>{cat.name}</strong><span className="v2draftdescription">{cat.description}</span>{canPick&&<span className="v2draftchoose">Choose this category <span aria-hidden="true">→</span></span>}</>;
       return canPick?<button type="button" key={id} className="v2draftoption" disabled={disabled} onClick={()=>onChoose?.(id)} aria-label={`Choose ${cat.name}: ${cat.description}`}>{content}</button>:<div key={id} className="v2draftoption v2draftoptionread" aria-label={`${cat.name}: ${cat.description}`}>{content}</div>;
     })}</div>
   </div>
 </section>;
}
function TV({view,code,origin,now,preview=false,returnToHost=false}:{view:GameView;code:string;origin:string;now:number;preview?:boolean;returnToHost?:boolean}){
 const soundtrack=SUNO_SOUNDTRACKS.find(t=>t.id===view.settings.music);
 const track=soundtrack?.arrangements[view.settings.arrangement];
 return <main className={"v2tv"+(view.phase==='finished'?" v13tvfinished":"")}>
   <header className="v2tvhead"><Link href="/"><img className="v1brandlogo" src="/know-show-logo.png" alt="The Know Show"/></Link><span>{view.phase==='lobby'?'THE GREEN ROOM':view.phase.startsWith('final')?'THE FINAL WORD':view.phase==='finished'?'THE CURTAIN CALL':view.roundNames[view.round]}</span><div className="ks-tv-head-actions"><span>{view.phase==='finished'?'':code}</span>{returnToHost&&<Link className="ks-tv-back" href={`/room/${code}?view=host`}>← Back to {view.phase==='lobby'?'Green Room':'Host View'}</Link>}</div></header>
   <div className="v2tvcolumns"><section className="v2tvmain">
     {view.phase==='lobby'&&<div className="v2tvwelcome"><p className="v2eyebrow">WELCOME TO</p><img className="v1welcomelogo" src="/know-show-logo.png" alt="The Know Show"/><h2>Scan to join the fun</h2>{origin&&<div className="v2qrcard"><QRCodeSVG value={`${origin}/room/${code}`} size={245} level="M" marginSize={2}/></div>}<p className="v2roomcode">Room code: <strong>{code}</strong></p><p>{view.players.length} of 8 players joined</p></div>}
     {view.phase==='draft'&&<section className="v2tvdraft" aria-label="Category draft on TV">
       <div className="v2tvdraftheader"><span className="v2eyebrow">✳ THE CATEGORY DRAFT · {view.roundNames[view.round]}</span><h2>Build the Board</h2><p><strong>{view.players.find(p=>p.id===view.draftTurnId)?.name||'A player'}’s turn to choose!</strong> · {view.selected[view.round].length} of 4 chosen</p></div>
       <div className="v2tvdraftprogress" aria-label={`${view.selected[view.round].length} of four categories selected`}>{Array.from({length:4},(_,i)=><span key={i} className={i<view.selected[view.round].length?'filled':''}/>)}</div>
       {view.selected[view.round].length>0&&<div className="v2tvdraftchosen">{view.selected[view.round].map(id=><span key={id}>✓ {view.categories.find(c=>c.id===id)?.name||id}</span>)}</div>}
       <div className="v2tvdraftoptions">{view.draftPool.filter(id=>!view.selected[view.round].includes(id)).map(id=>{const cat=view.categories.find(c=>c.id===id);return <div className="v2tvdraftitem" key={id}><strong>{cat?.name||id}</strong><small>{cat?.description||''}</small></div>;})}</div>
     </section>}
     {view.phase==='board'&&<><div className="v2tvsection"><span>ROUND {view.round+1}</span><h2>{view.roundNames[view.round]}</h2><p>{view.players.find(p=>p.id===view.chooserId)?.name} chooses the next question</p></div><Board view={view}/></>}
     {view.phase==='intro'&&<div className="v2tvstage"><span className="v2eyebrow">UP NEXT</span><h2>{view.intro?.category}</h2><div className="v2bigpoints">{fmt(view.intro?.points||0)}</div><span className="v2eyebrow">GET READY</span></div>}
     {view.phase==='question'&&<div className="v2tvstage"><span className="v2eyebrow">{view.active?.category} · {fmt(view.active?.points||0)} POINTS</span><h2 className="v2question">{view.active?.prompt}</h2><div className="v2timer">{view.paused?'PAUSED':remain((view.active?.deadlineAt||0)+Math.max(...view.players.map(p=>p.bonusTimeSeconds||0))*1000,now)}</div><p>{view.settings.mode==='individual'?`${view.active?.submissionCount||0}/${view.players.length} answers received`:`${view.players.find(p=>p.id===view.active?.answeringId)?.name} ${view.active?.stealTurn?'can steal':'is answering'}`}</p></div>}
     {view.phase==='results'&&view.results&&<AnswerReveal view={view} now={now}/>}
     {view.phase==='final-wager'&&<div className="v2tvstage"><span className="v2eyebrow">ONE LAST QUESTION</span><h2>The Final Word</h2><p>Place your private wager on your phone.</p><p>{view.final?.wagerCount||0} / {view.players.length} wagers locked</p><h3>Category: {view.final?.category}</h3></div>}
     {view.phase==='final-question'&&<div className="v2tvstage"><span className="v2eyebrow">THE FINAL WORD · {view.final?.category}</span><h2 className="v2question">{view.final?.prompt}</h2><div className="v2timer">{view.paused?'PAUSED':remain(view.final?.deadlineAt,now)}</div><p>{view.final?.answerCount||0}/{view.players.length} answers</p></div>}
     {view.phase==='final-results'&&<AnswerReveal view={view} now={now} final/>}
     {view.phase==='finished'&&<CurtainCall players={view.players}/>}
     {view.paused&&<div className="v2paused">THE SHOW IS PAUSED</div>}
   </section>{!['finished','results','final-results'].includes(view.phase)&&<aside className="v2tvside"><h3>Leaderboard</h3><Scoreboard players={view.players} chooserId={view.phase==='board'?view.chooserId:undefined}/>
   {!preview&&(view.settings.displayMode??'tv')==='tv'&&<div className="v2musicdock"><div className="v2musiclabel">♫ {soundtrack?.label||'Music off'} {soundtrack?`· Arrangement ${view.settings.arrangement+1}`:''}</div>
     {track?<iframe key={track.id} title={`${soundtrack!.label} arrangement ${view.settings.arrangement+1}`} src={sunoEmbedUrl(track.id)} allow="autoplay; encrypted-media; fullscreen" loading="eager" referrerPolicy="strict-origin-when-cross-origin"/>:<p>Soundtrack disabled by host</p>}
     {track&&<small>Press Play here to start the music. Suno controls volume and playback.</small>}</div>}
   </aside>}</div>
 </main>;
}

// Host phone is the one soundtrack source in Phones Only mode.
// This stays mounted while the host switches between Player and Host tabs.
function PhoneSoundtrack({music,arrangement}:{music:MusicStyle;arrangement:0|1}){
 const soundtrack=SUNO_SOUNDTRACKS.find(t=>t.id===music);
 const track=soundtrack?.arrangements[arrangement];
 if(!track)return <div className="v25phoneaudiooff">Music is off. Only the host can enable it.</div>;
 return <details className="v25phoneaudio">
   <summary>♫ {soundtrack?.label} · Track {arrangement+1} <span>Open music player</span></summary>
   <iframe key={track.id} title={`Host phone music: ${soundtrack?.label} track ${arrangement+1}`} src={sunoEmbedUrl(track.id)} allow="autoplay; encrypted-media; fullscreen" referrerPolicy="strict-origin-when-cross-origin" loading="eager"/>
   <small>Tap Play once on this phone. The player stays loaded when you switch between Host and Player. Suno controls volume and playback.</small>
 </details>;
}
function BrandedRoomLoading(){
 return <main className="ks-stage-loading" role="status" aria-live="polite" aria-label="Preparing The Know Show">
   <div className="ks-stage-loading-card">
     <img src="/know-show-logo.png" alt="The Know Show" />
     <p>SETTING THE STAGE</p>
     <h1>Getting your show ready…</h1>
     <div className="ks-stage-loading-meter" aria-hidden="true"><span/></div>
   </div>
 </main>;
}
function PocketScores({players,meId}:{players:Player[];meId?:string}){
 return <section className="v25pocketscores" aria-label="Current leaderboard">
   <div className="v25pocketlabel">LIVE SCORES</div>
   <div className="v25scoretrack">{[...players].sort((a,b)=>b.score-a.score).map((p,i)=><div className={'v25scorechip '+(meId===p.id?'mine':'')} key={p.id}>
     <span>{i+1}. {p.name}{meId===p.id?' (you)':''}</span><strong>{fmt(p.score)}</strong>
   </div>)}</div>
 </section>;
}
function ChoiceForm({choices,onSubmit,disabled}:{choices:string[];onSubmit:(answer:string)=>void;disabled:boolean}){
 return <div className="v12choices" role="group" aria-label="Choose one answer"><p>Choose your answer — one tap locks it in.</p><div className="v12choicegrid">{choices.map((choice,i)=><button type="button" key={choice} disabled={disabled} className="v12choice" onClick={()=>onSubmit(choice)}><span aria-hidden="true">{String.fromCharCode(65+i)}</span><strong>{choice}</strong></button>)}</div></div>;
}
function AnswerForm({value,onChange,onSubmit,disabled,label='Your answer'}:{value:string;onChange:(value:string)=>void;onSubmit:(value:string)=>void;disabled:boolean;label?:string;key?:string}){
 return <form className="v2answerform" onSubmit={e=>{e.preventDefault();if(value.trim()){e.currentTarget.querySelector('input')?.blur();onSubmit(value.trim());}}}><label>{label}<input maxLength={200} placeholder="Type your answer" value={value} onChange={e=>onChange(e.target.value)} disabled={disabled}/></label><button type="submit" disabled={disabled||!value.trim()}>Lock answer</button></form>;
}
function activeForDraft(view:GameView,id?:string){return Boolean(view.active&&(view.settings.mode==='individual'||view.active.answeringId===id));}
export default function ShowRoom({displayOnly=false}:{displayOnly?:boolean}){
 const params=useParams<{code:string}>(),router=useRouter();const code=String(params.code||'').toUpperCase();
 const [ready,setReady]=useState(false),[hostToken,setHostToken]=useState(''),[playerToken,setPlayerToken]=useState(''),[tab,setTab]=useState<DeviceTab>('player'),[origin,setOrigin]=useState('');
 const [view,setView]=useState<GameView|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[now,setNow]=useState(Date.now());
 const [name,setName]=useState(''),[answerDraft,setAnswerDraft]=useState(''),[finalDraft,setFinalDraft]=useState(''),[doubleTake,setDoubleTake]=useState(false),[wager,setWager]=useState(0);
 const [pairOpen,setPairOpen]=useState(false),[joinOpen,setJoinOpen]=useState(true),[scoreEdits,setScoreEdits]=useState<Record<string,string>>({});
 const [setupStep,setSetupStep]=useState(0),[hostPlaying,setHostPlaying]=useState(false),[hostName,setHostName]=useState('');
 const [timerSounds,setTimerSounds]=useState(false),[draftSaved,setDraftSaved]=useState(false),[returnToHost,setReturnToHost]=useState(false);
 const [serverOffset,setServerOffset]=useState(0);
 const serverOffsetRef=useRef(0),serverClockReady=useRef(false);
 const lastSoundSecond=useRef<number|null>(null),lastSoundQuestion=useRef(''),soundContext=useRef<AudioContext|null>(null),autoReturnFromDispute=useRef(false);
 const draftRef=useRef(''),finalDraftRef=useRef('');
 draftRef.current=answerDraft;finalDraftRef.current=finalDraft;
 const saveId=useRef(0);
 const lastRev=useRef(-1);const lastKey=useRef('');const [shareMessage,setShareMessage]=useState('');
 const authToken=displayOnly?'':actorToken(tab,{hostToken,playerToken});
 const authMarker=`${tab}:${authToken}`;
 const authRef=useRef(authMarker);
 authRef.current=authMarker;
 useEffect(()=>{
   let cancelled=false;
   setOrigin(window.location.origin);
   try {setSetupStep(Math.min(4,Math.max(0,Number(localStorage.getItem(`knowshow:${code}:setupStep`)||0))));setTimerSounds(localStorage.getItem('knowshow:timerSounds')==='on');}catch{/* Private browsing is fine. */}
   if(displayOnly){
     try{setReturnToHost(Boolean(localStorage.getItem(`knowshow:${code}:host`)));}catch{/* Some TV browsers disable storage. */}
     setReady(true);return;
   }
   async function initialize(){
     const query=new URLSearchParams(window.location.search);const paired=query.get('hostToken');const returningToHost=query.get('view')==='host';
     if(paired||returningToHost){query.delete('hostToken');query.delete('view');window.history.replaceState(null,'',window.location.pathname+(query.size?'?'+query.toString():''));}
     let h=paired||localStorage.getItem(`knowshow:${code}:host`)||'';
     let p=localStorage.getItem(`knowshow:${code}:player`)||'';
     // v0.2 kept one credential. Identify its role once and retain BOTH credentials.
     const legacy=localStorage.getItem(`knowshow:${code}`)||'';
     if(legacy&&legacy!==h&&legacy!==p){
       try{
         const res=await fetch(`/api/rooms/${code}`,{headers:{Authorization:`Bearer ${legacy}`},cache:'no-store'});
         if(res.ok){const d=await res.json();if(d.role?.kind==='host'&&!h)h=legacy;else if(d.role?.kind==='player'&&!p)p=legacy;}
       }catch{/* The room may be temporarily unavailable; saved credentials remain untouched. */}
     }
     if(cancelled)return;
     if(h)localStorage.setItem(`knowshow:${code}:host`,h);
     if(p)localStorage.setItem(`knowshow:${code}:player`,p);
     setHostToken(h);setPlayerToken(p);setTab(returningToHost&&h?'host':p?'player':h?'host':'player');setReady(true);
   }
   void initialize();return()=>{cancelled=true;};
 },[code,displayOnly]);
 const switchTab=(next:DeviceTab)=>{
   if(next===tab)return;
   // Keep the public shell mounted so the host's Suno player does not stop when tabs change.
   // Role-gated panels remain hidden until the new role-specific view arrives.
   lastRev.current=-1;setError('');setTab(next);
 };
 const refresh=useCallback(async()=>{
   if(!ready)return;
   const marker=authMarker,requestStarted=Date.now();
   try{
     const res=await fetch(`/api/rooms/${code}`,{headers:authToken?{Authorization:`Bearer ${authToken}`}:{},cache:'no-store'});
     const d=await res.json();if(marker!==authRef.current)return false;
     if(!res.ok)throw new Error(d.error||'Could not load room.');
     if(typeof d.serverNow==='number'){
       // Anchor timers to server time. Ignore small polling-latency fluctuations so seconds don't jump.
       const offset=d.serverNow-Math.round((requestStarted+Date.now())/2);
       if(!serverClockReady.current||Math.abs(offset-serverOffsetRef.current)>2000){
         serverClockReady.current=true;serverOffsetRef.current=offset;setServerOffset(offset);
       }
     }
     if(d.revision>=lastRev.current){lastRev.current=d.revision;setView(d);setError('');}
   }catch(e){if(marker===authRef.current)setError(e instanceof Error?e.message:'Could not refresh room.');}
 },[code,ready,authToken,authMarker]);
 useEffect(()=>{if(!ready)return;void refresh();const t=setInterval(()=>void refresh(),1250);return()=>clearInterval(t);},[ready,refresh]);
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),300);return()=>clearInterval(t);},[]);
 const act=useCallback(async(action:Action,actingToken=authToken):Promise<boolean>=>{if(busy)return false;
   const marker=authMarker;setBusy(true);setError('');
   try{
     const res=await fetch(`/api/rooms/${code}/action`,{method:'POST',headers:{'Content-Type':'application/json',...(actingToken?{Authorization:`Bearer ${actingToken}`}:{})},body:JSON.stringify(action)});
     const d=await res.json();if(marker!==authRef.current)return false;
     if(!res.ok)throw new Error(d.error||'Action failed.');
     if(d.revision>=lastRev.current){lastRev.current=d.revision;setView(d);}
     return true;
   }catch(e){if(marker===authRef.current){setError(e instanceof Error?e.message:'Could not update game.');void refresh();}return false;}finally{setBusy(false);}
 },[busy,code,authToken,authMarker,refresh]);
 const join=async(joinName=name,keepHost=false)=>{setBusy(true);setError('');try{const res=await fetch(`/api/rooms/${code}/join`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:joinName})});const d=await res.json();if(!res.ok)throw new Error(d.error||'Could not join.');localStorage.setItem(`knowshow:${code}:player`,d.token);lastRev.current=-1;setPlayerToken(d.token);if(!keepHost){setTab('player');setView(d.view);lastRev.current=d.view.revision;}else{setHostPlaying(true);void refresh();}}catch(e){setError(e instanceof Error?e.message:'Could not join.');}finally{setBusy(false);}};
 const role=view?.role.kind||'spectator',isHost=!displayOnly&&tab==='host'&&role==='host',isPlayer=!displayOnly&&tab==='player'&&role==='player';
 const advanceSetup=async(update:Partial<Settings>)=>{if(await act({type:'settings',settings:update},hostToken)){
   setSetupStep(step=>{const next=Math.min(4,step+1);localStorage.setItem(`knowshow:${code}:setupStep`,String(next));return next;});
 }};
 const playTone=useCallback((kind:'tick'|'end')=>{
   try{
     const ctx=soundContext.current??new AudioContext();soundContext.current=ctx;
     if(ctx.state==='suspended')void ctx.resume();
     const notes=kind==='tick'?[{freq:570,delay:0,duration:.075}]:[{freq:880,delay:0,duration:.12},{freq:1175,delay:.13,duration:.35}];
     for(const note of notes){const osc=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime+note.delay;
       osc.type=kind==='tick'?'square':'sine';osc.frequency.value=note.freq;
       gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(kind==='tick'?.055:.11,start+.013);gain.gain.exponentialRampToValueAtTime(.0001,start+note.duration);
       osc.connect(gain);gain.connect(ctx.destination);osc.start(start);osc.stop(start+note.duration+.02);
     }
   }catch{/* Audio may be unavailable or disallowed on this device. */}
 },[]);
 const toggleTimerSound=()=>{const next=!timerSounds;setTimerSounds(next);localStorage.setItem('knowshow:timerSounds',next?'on':'off');if(next)playTone('tick');};
 const clockNow=now+serverOffset;
 const timerNow=view?.paused&&view.pausedAt?view.pausedAt:clockNow;
 const questionClockId=view?.phase==='question'?`q:${view.active?.key}:${view.active?.stealTurn?'steal':'first'}`:view?.phase==='final-question'?`final:${view.final?.deadlineAt}`:'none';
 const clockDeadline=view?.phase==='question'?(view.active?.myDeadlineAt??view.active?.deadlineAt):view?.phase==='final-question'?view.final?.deadlineAt:undefined;
 useEffect(()=>{if(!timerSounds||!view||!isFinite(now)||view.paused||!clockDeadline)return;
   if(questionClockId!==lastSoundQuestion.current){lastSoundQuestion.current=questionClockId;lastSoundSecond.current=null;}
   const seconds=Math.max(0,Math.ceil((clockDeadline-clockNow)/1000));
   const participating=view.role.kind==='player'&&(view.phase==='final-question'?view.final?.myAnswer===undefined:view.active?.mySubmission===undefined);
   if(!participating||questionClockId==='none'||lastSoundSecond.current===seconds)return;
   lastSoundSecond.current=seconds;
   if(seconds>=1&&seconds<=5)playTone('tick');
   else if(seconds===0&&clockNow-clockDeadline<1300)playTone('end');
 },[timerSounds,clockNow,view,clockDeadline,questionClockId,playTone]);
 // Persist drafts before the timer reaches zero. The server scores saved drafts at the deadline.
 useEffect(()=>{if(!isPlayer||view?.phase!=='question'||!activeForDraft(view,me?.id)||view.active?.myChoices||view.paused||view.active?.mySubmission!==undefined)return;
   setDraftSaved(false);
   const draft=answerDraft;const id=++saveId.current;
   const timer=setTimeout(async()=>{
     try{const res=await fetch(`/api/rooms/${code}/action`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${playerToken}`},body:JSON.stringify({type:'save-draft',scope:'question',answer:draft,doubleTake})});
       if(res.ok&&id===saveId.current&&draftRef.current===draft)setDraftSaved(true);
     }catch{/* Keep the editable answer; user may still lock it manually. */}
   },240);return()=>clearTimeout(timer);
 },[answerDraft,doubleTake,view?.phase,view?.active?.key,view?.active?.mySubmission,view?.paused,view?.active?.myChoices,code,playerToken]);
 useEffect(()=>{if(!isPlayer||view?.phase!=='final-question'||view.final?.myAnswer!==undefined||view.paused)return;
   const draft=finalDraft;const id=++saveId.current;setDraftSaved(false);
   const timer=setTimeout(async()=>{
     try{const res=await fetch(`/api/rooms/${code}/action`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${playerToken}`},body:JSON.stringify({type:'save-draft',scope:'final',answer:draft})});
       if(res.ok&&id===saveId.current&&finalDraftRef.current===draft)setDraftSaved(true);
     }catch{/* Manual locking remains available. */}
   },240);return()=>clearTimeout(timer);
 },[finalDraft,view?.phase,view?.final?.myAnswer,view?.paused,code,playerToken]);
 useEffect(()=>{if(!view||view.phase!=='closed'||!ready)return;
   try{localStorage.removeItem(`knowshow:${code}:host`);localStorage.removeItem(`knowshow:${code}:player`);localStorage.removeItem(`knowshow:${code}:setupStep`);localStorage.removeItem(`knowshow:${code}`);}catch{/* Private browsing restrictions */}
   router.replace('/');
 },[view?.phase,ready,code,router]);
 const disputes=(view?.phase==='results'?view.results?.disputeIds:view?.phase==='final-results'?view.final?.disputeIds:[])??[];
 useEffect(()=>{if(autoReturnFromDispute.current&&tab==='host'&&view?.role.kind==='host'&&disputes.length===0){autoReturnFromDispute.current=false;switchTab('player');}},[tab,view?.revision,view?.role.kind,disputes.length]);

 const me=view?.players.find(p=>p.id===view.role.id),canChoose=Boolean(me&&view?.chooserId===me.id);
 const draftTurn=view?.players.find(p=>p.id===view.draftTurnId);
 const lastDisplayedPhase=useRef('');
 useEffect(()=>{
   const stamp=`${tab}:${view?.phase||''}:${view?.active?.key||''}`;
   if(stamp!==lastDisplayedPhase.current){
     lastDisplayedPhase.current=stamp;
     if(!displayOnly&&tab==='player'&&view&&['board','intro','question','results','final-results'].includes(view.phase))window.scrollTo(0,0);
   }
 },[tab,view?.phase,view?.active?.key,displayOnly]);
 const activeKey=view?.active?.key??view?.intro?.key??'';
 useEffect(()=>{if(activeKey&&activeKey!==lastKey.current){lastKey.current=activeKey;setAnswerDraft(view?.active?.myDraft??'');setDoubleTake(false);setDraftSaved(false);}},[activeKey]);
 useEffect(()=>{if(view?.phase==='final-wager'){setFinalDraft('');setDraftSaved(false);setWager(0);}else if(view?.phase==='final-question'&&view.final?.myDraft&&finalDraftRef.current==='')setFinalDraft(view.final.myDraft);},[view?.phase]);
 const genre=SUNO_SOUNDTRACKS.find(t=>t.id===view?.settings.music);
 // Keep this host's category and question histories between separate rooms.
 // This works even when the host is playing on the same device and using Player View.
 useEffect(()=>{
   if(!hostToken||!view)return;
   try{
     for(const [key,ids,limit] of [
       ['knowshow:recentQuestionIds',view.playedQuestionIds,672],
       ['knowshow:recentCategoryIds',view.playedCategoryIds,56],
       ['knowshow:recentCategoryOffers',view.offeredCategoryIds,56],
     ] as const){
       if(!ids?.length)continue;
       const old=JSON.parse(localStorage.getItem(key)||'[]') as string[];
       // The room's history is ordered oldest-first; move its latest entries to the end.
       const next=[...old.filter(id=>!ids.includes(id)),...ids].slice(-limit);
       localStorage.setItem(key,JSON.stringify(next));
     }
   }catch{/* Local storage is unavailable; rematches still retain history on the server. */}
 },[hostToken,view?.playedQuestionIds,view?.playedCategoryIds,view?.offeredCategoryIds]);
 if(!ready||(!view&&!error))return <BrandedRoomLoading/>;
 if(!view)return <main className="v2loading"><h2>Can't open this room</h2><p>{error}</p><Link href="/">Create a new show</Link></main>;
 if(view.phase==='closed')return <main className="v2loading"><p>Taking everyone back to the homepage…</p><Link href="/">Return home</Link></main>;
 if(displayOnly)return <TV view={view} code={code} origin={origin} now={timerNow} returnToHost={returnToHost}/>;
 if(isHost&&view.phase==='lobby'&&setupStep<4)return <HostWizard key={setupStep} step={setupStep} settings={view.settings} busy={busy} error={error} onNext={advanceSetup} onBack={()=>{setSetupStep(step=>{const next=Math.max(0,step-1);localStorage.setItem(`knowshow:${code}:setupStep`,String(next));return next;});}}/>;
 if(isHost&&view.phase==='lobby'&&setupStep>=4){const roomUrl=`${origin}/room/${code}`,privateHostUrl=`${roomUrl}?hostToken=${encodeURIComponent(hostToken)}`;
   const answerLabel=(access:Player['choiceAccess'])=>access==='all'?'Four choices · always':access==='medium-hard'?'Four choices · medium and hard':access==='hard'?'Four choices · hard only':'Written answers';
   return <main className="ks-lobby"><header className="ks-lobby-top"><img src="/know-show-logo.png" alt="The Know Show"/><span>ROOM · {code}</span></header>
     <section className="ks-lobby-hero"><p className="ks-tag">GREEN ROOM</p><p>Scan to join. Players and teams appear below as they connect.</p>
       {origin&&<div className="ks-lobby-qr"><QRCodeSVG value={roomUrl} size={235} marginSize={2}/></div>}
       <div className="ks-lobby-code">ROOM CODE <strong>{code}</strong></div>
       <div className="ks-lobby-share"><button type="button" onClick={async()=>{try{if(navigator.share)await navigator.share({title:'Join The Know Show',url:roomUrl});else{await navigator.clipboard.writeText(roomUrl);setShareMessage('Join link copied!');}}catch{/* User may dismiss share. */}}}>Share invite</button>{(view.settings.displayMode??'tv')==='tv'&&<Link href={`/display/${code}`}>Open TV display ↗</Link>}</div>
       {shareMessage&&<p role="status">{shareMessage}</p>}
     </section>
     <section className="ks-lobby-players"><div className="ks-lobby-heading"><h2><Users size={22}/> {view.settings.mode==='teams'?'Teams':'Players'} ({view.players.length}/8)</h2><span>LIVE JOIN LIST</span></div>
      {view.players.length===0?<p className="ks-empty">Waiting for your first {view.settings.mode==='teams'?'team':'player'} to join…</p>:<div className="ks-player-list">{view.players.map(p=><div className="ks-player-item" key={p.id}><div><strong><CheckCircle size={18}/>{p.name}</strong><small>{answerLabel(p.choiceAccess)}</small></div><label>Answer style<select value={p.choiceAccess??'off'} disabled={busy} onChange={e=>void act({type:'player-bonuses',playerId:p.id,choiceAccess:e.target.value as Player['choiceAccess']})}><option value="off">Write answers</option><option value="all">Four choices · always</option><option value="medium-hard">Four choices · medium &amp; hard</option><option value="hard">Four choices · hard only</option></select></label></div>)}</div>}
      <p className="ks-muted">{view.settings.answerStyle==='mixed'?'Mixed format: set the answer style for each player above.':'You can override anyone’s starting format above.'} The Final Word is always written for everyone.</p>
      {!playerToken?<div className="ks-lobby-hostplay"><label className="ks-host-checkbox"><input type="checkbox" checked={hostPlaying} onChange={e=>setHostPlaying(e.target.checked)}/><strong>Will you be participating as a player?</strong></label>
      {hostPlaying&&<form onSubmit={e=>{e.preventDefault();if(hostName.trim())void join(hostName.trim(),true);}}><label>Your name<input value={hostName} maxLength={28} minLength={2} required placeholder="Enter your player name" onChange={e=>setHostName(e.target.value)}/></label><button disabled={busy||hostName.trim().length<2}>Join the players</button></form>}</div>:<div className="ks-lobby-hostplay"><CheckCircle size={19}/> You’re playing too! Your player account is connected to this host device.</div>}
     </section>
     <details className="ks-lobby-extras"><summary>Additional settings &amp; accommodations</summary><label>Question time<select value={view.settings.answerSeconds} disabled={busy} onChange={e=>void act({type:'settings',settings:{answerSeconds:Number(e.target.value)}})}>{[15,20,25,30,45,60].map(n=><option key={n} value={n}>{n} seconds</option>)}</select></label><label>Standard hints<select value={view.settings.normalHints} disabled={busy} onChange={e=>void act({type:'settings',settings:{normalHints:Number(e.target.value)}})}>{[0,1,2,3,4,5].map(n=><option key={n} value={n}>{n} hints</option>)}</select></label>{view.settings.music!=='off'&&<label>Soundtrack arrangement<select value={view.settings.arrangement} disabled={busy} onChange={e=>void act({type:'settings',settings:{arrangement:Number(e.target.value) as 0|1}})}><option value="0">Arrangement 1</option><option value="1">Arrangement 2</option></select></label>}{view.players.map(p=><div key={p.id}><strong>{p.name}</strong><label>Extra time<select value={p.bonusTimeSeconds} disabled={busy} onChange={e=>void act({type:'player-bonuses',playerId:p.id,bonusTimeSeconds:Number(e.target.value)})}>{[0,5,10,15,20,30].map(n=><option key={n} value={n}>{n}s</option>)}</select></label><label>Extra hints<select value={p.bonusHints} disabled={busy} onChange={e=>void act({type:'player-bonuses',playerId:p.id,bonusHints:Number(e.target.value)})}>{[0,1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}</select></label></div>)}<details className="ks-lobby-pair"><summary>Pair a second host device (private)</summary><p>Only share this QR with the person helping you host. Do not put it on the TV or share it with players.</p>{origin&&<div className="ks-lobby-qr"><QRCodeSVG value={privateHostUrl} size={180} marginSize={2}/></div>}</details></details>
     <div className="ks-lobby-actions"><button className="ks-start" type="button" disabled={busy||view.players.length<2} onClick={async()=>{if(await act({type:'start-draft'},hostToken))switchTab('player');}}>START THE SHOW! <Play size={23} fill="currentColor"/></button><small>{view.players.length<2?'At least two players or teams are needed to start.':'The category draft begins immediately. Players take turns choosing categories.'}</small><button className="ks-edit-setup" type="button" onClick={()=>{setSetupStep(0);localStorage.setItem(`knowshow:${code}:setupStep`,'0');}}>Review the four setup questions</button></div>
     {error&&<p role="alert" className="v2error">{error}</p>}
   </main>;
 }
 if(view.phase==='finished')return <main className="v13phonefinish">
   <header className="v13finishhead"><Link href="/"><img src="/know-show-logo.png" alt="The Know Show"/></Link><span>THE CURTAIN CALL</span></header>
   <CurtainCall players={view.players} mode="phone"/>
   <section className="ks-aftershow" aria-label="Play again options"><h2>Ready for another round?</h2>{hostToken?<><p>Rematch keeps everyone in this room with the same settings and resets the scores. A new show brings everyone back to the homepage.</p><div className="ks-aftershow-actions"><button type="button" className="ks-rematch" disabled={busy} onClick={async()=>{if(await act({type:'new-game'},hostToken)){setSetupStep(4);try{localStorage.setItem(`knowshow:${code}:setupStep`,'4');}catch{}switchTab('host');}}}><RotateCcw size={20}/> Rematch · Same players</button><button type="button" className="ks-startfresh" disabled={busy} onClick={async()=>{if(await act({type:'close-show'},hostToken))router.replace('/');}}><Home size={19}/> Start a new show</button></div></>:<><p>The host can start a rematch with the same players. Your phone will follow automatically.</p><Link href="/" className="ks-startfresh"><Home size={19}/> Back to homepage</Link></>}{error&&<p role="alert">{error}</p>}</section>
 </main>;
 const stage=view.phase==='lobby'?'Green Room':view.phase==='draft'?'Category Draft':view.phase.startsWith('final')?'The Final Word':view.roundNames[view.round];
 const phonesOnly=(view.settings.displayMode??'tv')==='phones';
 const roomUrl=`${origin}/room/${code}`,hostUrl=`${roomUrl}?hostToken=${encodeURIComponent(hostToken)}`;
 const wrongs=view.results?.answers||{};
 const activeForPlayer=view.phase==='question'&&view.active&&(view.settings.mode==='individual'||view.active.answeringId===me?.id);
 const myDeadline=view.active?.myDeadlineAt??view.active?.deadlineAt;
 const myHasAnswered=Boolean(me&&view.active?.mySubmission!==undefined);
 const wagerMax=Math.max(0,me?.score??0);
 const wagerPreview=Math.min(wagerMax,Math.max(0,Math.trunc(wager)));
 const finalPreviewWager=view.final?.myWager??wagerPreview;
 const finalHintCount=view.final?.myPurchasedHints??0;
 const finalHintPrice=view.final?.hintPrice??500;
 return <main className={'v2phone'+(view.phase==='draft'?' v2draftphase':'')+(phonesOnly?' v25phonesonly':'')+(view.phase==='lobby'?' v11lobby':'')+(tab==='host'?' v11hostmode':'')}><header className="v2phonehead"><Link href="/"><img className="v1brandlogo" src="/know-show-logo.png" alt="The Know Show"/></Link><span>{isHost?'HOST':isPlayer?(view.settings.mode==='teams'?'TEAM':'PLAYER'):'GUEST'} · {code}</span></header>
   {hostToken&&<nav className={"v2viewtabs ks-two-tabs"+(view.phase!=='lobby'?" ks-during-show":"")} aria-label="Room views">
     <button type="button" className={tab==='player'?'active':''} aria-current={tab==='player'?'page':undefined} onClick={()=>switchTab('player')}>Player View</button>
     {hostToken&&<button type="button" className={tab==='host'?'active':''} aria-current={tab==='host'?'page':undefined} onClick={()=>switchTab('host')}>Host View</button>}
   </nav>}
   {view.phase==='lobby'&&<div className="v2eyebrow ks-compact-roomlabel">GREEN ROOM</div>}
   {isPlayer&&<div className="ks-soundbar"><span className="ks-sound-label">SOUND EFFECTS <small>Last-five-second ticks + time-up bell</small></span><button type="button" onClick={toggleTimerSound} aria-pressed={timerSounds} aria-label={`Countdown sound effects ${timerSounds?'on':'off'}. Tap to toggle.`}>{timerSounds?<Volume2 size={20}/>:<VolumeX size={20}/>} {timerSounds?'On':'Off'}</button></div>}
   {phonesOnly&&isPlayer&&view.phase!=='lobby'&&!['results','final-results','final-wager'].includes(view.phase)&&<PocketScores players={view.players} meId={me?.id}/>}
   {phonesOnly&&hostToken&&<PhoneSoundtrack music={view.settings.music} arrangement={view.settings.arrangement}/>}
   {tab==='tv'&&hostToken?<div className="v2tvpreview"><div className="v2tvpreviewnote"><strong>TV Preview</strong> · For the actual shared TV, open the full-screen TV display from Host Controls. <button type="button" onClick={()=>switchTab(playerToken?'player':hostToken?'host':'player')}>← Back to {playerToken?'Player':'Host'} View</button></div><TV view={view} code={code} origin={origin} now={timerNow} preview/></div>:<>
   {view.phase!=='lobby'&&!['board','draft','results','final-results'].includes(view.phase)&&!(tab==='player'&&['intro','question','final-question','final-wager'].includes(view.phase))&&<div className="v2phonestage"><span>{stage}</span><h1>{view.phase==='intro'?'Up next!':view.phase==='results'?'The answer is in':view.phase==='question'?view.active?.category:stage}</h1></div>}
   {error&&<div className="v2error" role="alert">{error}<button onClick={()=>setError('')}>Dismiss</button></div>}
   {view.paused&&<div className="v2alert">Game paused by the host</div>}
   {tab==='player'&&Boolean(hostToken)&&Boolean((view.phase==='results'?view.results?.disputeIds:view.phase==='final-results'?view.final?.disputeIds:[])?.length)&&<div className="v1hostdispute" role="alert"><strong>⚑ A player has disputed a result.</strong><span>Review the answer in Host Controls to continue the game.</span><button type="button" onClick={()=>{autoReturnFromDispute.current=true;switchTab('host');}}>Open Host Controls</button></div>}
   {tab==='player'&&role==='spectator'&&view.phase==='lobby'&&<section className="v2card"><h2>Join the show</h2><p>Choose a player name to join. If playing as a team, enter the team name.</p><form onSubmit={e=>{e.preventDefault();void join();}} className="v2form"><label>{view.settings.mode==='teams'?'Team name':'Player name'}<input required minLength={2} maxLength={28} value={name} onChange={e=>setName(e.target.value)}/></label><button disabled={busy}>Join this room</button></form></section>}
   {tab==='player'&&role==='spectator'&&view.phase!=='lobby'&&hostToken&&<div className="ks-spectator"><p>You're hosting without playing. Here's the live show. Use the small Host View tab for arbitration.</p><TV view={view} code={code} origin={origin} now={timerNow} preview/></div>}
   {tab==='player'&&role==='spectator'&&view.phase!=='lobby'&&!hostToken&&<div className="v2card"><p>This show is already in progress.</p><Link href={`/display/${code}`}>Watch the TV display</Link></div>}
   {tab==='host'&&!isHost&&<section className="v2card"><h2>Host access unavailable</h2><p>Scan the private host QR code from a device that already has host access. Your player view is unaffected.</p><button className="v2small" onClick={()=>switchTab('player')}>Back to Player View</button></section>}
   {isHost&&<>
     {view.phase==='draft'&&<DraftStage view={view} chooserName={draftTurn?.name||'Another player'} canPick disabled={busy} onChoose={id=>void act({type:'draft-category',categoryId:id})}/>}
     <section className="v2card"><div className="v2between"><h2>Host controls</h2><button className="v2small" disabled={busy} onClick={()=>void act({type:'pause'})}>{view.paused?'Resume':'Pause'} game</button></div>
       <p>{phonesOnly?'Your phone runs the show. Everyone sees the board, questions, and scores on their own device.':'Manage the show here; the main board appears on the TV/laptop.'}</p>
       <div className="v2buttonrow">{!phonesOnly&&<Link className="v2button" href={`/display/${code}`}>Open TV display ↗</Link>}<button className="v2button muted" onClick={()=>setPairOpen(!pairOpen)}>Private host QR {pairOpen?'−':'+'}</button></div>
       {pairOpen&&<div className="v2private"><p><strong>Private host pairing</strong> — Only use this to add host controls to another device (such as your phone if you created the show on a laptop). If you already have the Host Controls tab, you do not need to scan again. Keep this code off the shared TV.</p><div className="v2qrcard"><QRCodeSVG value={hostUrl} size={190} marginSize={2}/></div><p><button className="v2small" onClick={()=>void navigator.clipboard.writeText(hostUrl)}>Copy host link</button></p></div>}
     </section>
     <section className="v2card"><h2>Where everyone plays</h2><p>Switch at any time without restarting the game or losing scores. Players will see the board and questions on their phones in either setting.</p><div className="v2form"><label>Display arrangement<select value={view.settings.displayMode??'tv'} disabled={busy} onChange={e=>void act({type:'settings',settings:{displayMode:e.target.value as NonNullable<Settings['displayMode']>}})}><option value="tv">TV + Phones — shared game screen</option><option value="phones">Phones Only — no TV needed</option></select></label></div></section>
     <section className="v2card"><h2>Soundtrack</h2><p>{phonesOnly?'Music plays only on the host phone. Open the music player above and tap Play. It keeps playing when you switch to Player View.':'Music plays on the TV through Suno. Jazz is the default; track changes may require pressing Play again.'}</p><div className="v2form"><label>Music style<select value={view.settings.music} onChange={e=>void act({type:'settings',settings:{music:e.target.value as MusicStyle}})} disabled={busy}><option value="off">No music</option>{SUNO_SOUNDTRACKS.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
       {genre&&<label>Arrangement<select value={view.settings.arrangement} onChange={e=>void act({type:'settings',settings:{arrangement:Number(e.target.value) as 0|1}})} disabled={busy}><option value="0">Arrangement 1</option><option value="1">Arrangement 2</option></select></label>}
       <small>Volume, play/pause, and looping remain inside Suno's embedded player—not remotely controllable.</small></div></section>
     {view.phase==='lobby'&&<>
       <section className="v2card"><h2>Game settings</h2><div className="v2form"><p><strong>Standard Trivia</strong> — 45 year-round categories plus seasonal categories, with Easy, Medium, and Hard questions in each.</p><small>A separate kid-friendly edition may be added in the future.</small>
        <label>Mode<select value={view.settings.mode} disabled={busy} onChange={e=>void act({type:'settings',settings:{mode:e.target.value as Settings['mode']}})}><option value="individual">Individual — Everyone Answers</option><option value="teams">Team — Turn Based</option></select></label>
        <label>Answer time (seconds)<select value={view.settings.answerSeconds} disabled={busy} onChange={e=>void act({type:'settings',settings:{answerSeconds:Number(e.target.value)}})}>{[15,20,25,30,45,60].map(v=><option key={v} value={v}>{v}</option>)}</select></label>
        <label>Standard written hints<select value={view.settings.normalHints} disabled={busy} onChange={e=>void act({type:'settings',settings:{normalHints:Number(e.target.value)}})}>{[0,1,2,3,4,5].map(v=><option key={v} value={v}>{v}</option>)}</select></label>
       </div></section>
       <section className="v2card"><div className="v2between"><h2>Players ({view.players.length}/8)</h2><button className="v2small" onClick={()=>setJoinOpen(!joinOpen)}>Join QR {joinOpen?'−':'+'}</button></div>
         <p>{phonesOnly?'Show this QR on your phone, or send the invite by text. No TV or laptop required.':'Players can scan the public QR on the TV or your phone.'}</p>
         <div className="v2buttonrow"><button className="v2small" onClick={async()=>{try{if(navigator.share){await navigator.share({title:'Join The Know Show',text:`Join my trivia game! Room ${code}`,url:roomUrl});}else{await navigator.clipboard.writeText(roomUrl);setShareMessage('Join link copied');}}catch{/* Dismissing a native share sheet is normal. */}}}>Share invite</button><button className="v2small" onClick={async()=>{try{await navigator.clipboard.writeText(roomUrl);setShareMessage('Join link copied');}catch{setShareMessage('Copy this link: '+roomUrl);}}}>Copy join link</button></div>
         {shareMessage&&<p role="status" className="v25sharestatus">{shareMessage}</p>}
         {joinOpen&&<div className="v2qrcard"><QRCodeSVG value={roomUrl} size={200} marginSize={2}/><p>Scan to join · {code}</p></div>}
         {view.players.length===0&&<p>Waiting for players…</p>}

         <button className="v2primary" disabled={busy||view.players.length<2} onClick={()=>void act({type:'start-draft'})}>Begin category draft</button></section>
     </>}
     {view.players.length>0&&(view.phase==='lobby'||view.paused)&&<section className="v2card v2accommodationspanel"><h2>Player accommodations</h2><p>{view.phase==='lobby'?'Customize assistance before starting the game.':'The game is paused. Changes will take effect when play resumes.'}</p>{view.players.map(p=><div key={p.id} className="v2accommodation"><h3>{p.name}</h3><div className="v2twocol"><label>Extra written hints<select value={p.bonusHints} disabled={busy} onChange={e=>void act({type:'player-bonuses',playerId:p.id,bonusHints:Number(e.target.value)})}>{[0,1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}</select></label><label>Extra answer time<select value={p.bonusTimeSeconds} disabled={busy} onChange={e=>void act({type:'player-bonuses',playerId:p.id,bonusTimeSeconds:Number(e.target.value)})}>{[0,5,10,15,20,30].map(n=><option key={n} value={n}>{n}s</option>)}</select></label></div><label className="v12choiceselect">Answer format<select value={p.choiceAccess??'off'} disabled={busy} onChange={e=>void act({type:'player-bonuses',playerId:p.id,choiceAccess:e.target.value as Player['choiceAccess']})}><option value="off">Write answers (standard)</option><option value="all">Four choices — every question</option><option value="medium-hard">Four choices — Medium &amp; Hard only</option><option value="hard">Four choices — Hard only</option></select></label></div>)}</section>}

     {view.phase==='board'&&<section className="v2card"><h2>Question selection</h2><p>{view.players.find(p=>p.id===view.chooserId)?.name} chooses next. As host, you can also select.</p><Board view={view} onChoose={key=>void act({type:'open-question',key})}/></section>}
     {(view.phase==='intro'||view.phase==='question')&&<section className="v2card"><h2>{view.intro?.category} · {fmt(view.intro?.points||0)}</h2>{view.phase==='question'?<><p className="v2prompt">{view.active?.prompt}</p><p className="v2hostanswer">Answer is hidden during play so the host can compete fairly.</p><p>{view.active?.submissionCount} / {view.players.length} submitted</p></>:<p>Question appears shortly…</p>}<button className="v2small danger" disabled={busy} onClick={()=>void act({type:'skip-question'})}>Skip faulty question</button></section>}
     {view.phase==='results'&&view.results&&<section className="v2card"><h2>Results</h2><p>Correct answer: <strong>{view.results.answer}</strong></p><p>Returns to board automatically unless disputed.</p>
       {view.players.map(p=>{const r=wrongs[p.id],disputed=view.results!.disputeIds.includes(p.id);return <div key={p.id} className="v2hostresult"><div><b>{p.name}</b><p>{r?.answer||'(no answer)'} · {r?.correct?'Correct':'Incorrect'}</p>{disputed&&<small>DISPUTE — REVIEW REQUIRED</small>}</div>{r?<div className="v2buttonrow"><button className="v2small" disabled={busy} onClick={()=>void act({type:'resolve-dispute',playerId:p.id,correct:true})}>Mark correct</button><button className="v2small" disabled={busy} onClick={()=>void act({type:'resolve-dispute',playerId:p.id,correct:false})}>Mark wrong</button></div>:disputed&&<button className="v2small" disabled={busy} onClick={()=>void act({type:'dismiss-dispute',playerId:p.id})}>Dismiss dispute</button>}</div>;})}
     </section>}
     {view.phase==='final-wager'&&<section className="v2card"><h2>The Final Word</h2><p>Category: {view.final?.category}</p><p>{view.final?.wagerCount}/{view.players.length} wagers received.</p><p className="v1wagerprogress">The question will appear automatically when all wagers are locked.</p></section>}
     {view.phase==='final-question'&&<section className="v2card"><h2>The Final Word</h2><p>{view.final?.prompt}</p><p>Answer remains hidden until all final answers are revealed.</p><p>{view.final?.answerCount}/{view.players.length} submitted · {view.paused?'PAUSED':remain(view.final?.deadlineAt,timerNow)}</p></section>}
     {view.phase==='final-results'&&<section className="v2card"><h2>Final results</h2><p>Answer: <strong>{view.final?.answer}</strong></p>{view.final?.results?.map(p=><div key={p.id} className="v2hostresult"><b>{p.name}: {p.answer}</b><div className="v2buttonrow"><button className="v2small" disabled={busy} onClick={()=>void act({type:'resolve-dispute',playerId:p.id,correct:true})}>Correct</button><button className="v2small" disabled={busy} onClick={()=>void act({type:'resolve-dispute',playerId:p.id,correct:false})}>Incorrect</button></div></div>)}<button className="v2primary" disabled={busy} onClick={()=>void act({type:'finish'})}>Show final standings</button></section>}
     {view.phase!=='lobby'&&<section className="v2card"><h2>Score adjustments</h2>{view.players.map(p=><div className="v2scoreedit" key={p.id}><span>{p.name} · {fmt(p.score)}</span><input inputMode="numeric" aria-label={`Score adjustment for ${p.name}`} placeholder="+100 or -100" value={scoreEdits[p.id]||''} onChange={e=>setScoreEdits(v=>({...v,[p.id]:e.target.value}))}/><button className="v2small" disabled={busy||!Number.isInteger(Number(scoreEdits[p.id]))||!scoreEdits[p.id]} onClick={()=>{void act({type:'adjust-score',playerId:p.id,delta:Number(scoreEdits[p.id])});setScoreEdits(v=>({...v,[p.id]:''}));}}>Apply</button></div>)}</section>}
   </>}
   {isPlayer&&<>
     {!['draft','board','intro','question','final-wager','final-question','results','final-results'].includes(view.phase)&&<div className="v2card v2self"><h2>{me?.name}</h2><strong>{fmt(me?.score||0)} pts</strong><small>{view.settings.mode==='individual'?`${me?.doubleTakesRemaining} Double Takes this round · `:''}{view.phase==='final-wager'?'Final Word hints are purchased separately':`${view.myHints} regular-game hints remaining`}</small></div>}
     {view.phase==='lobby'&&<section className="v2card"><h2>You're in!</h2><p>Waiting for the host to begin. Everyone plays the same question, with optional private assistance.</p></section>}
     {view.phase==='draft'&&<DraftStage view={view} chooserName={draftTurn?.name||'Another player'} canPick={view.draftTurnId===me?.id} disabled={busy} onChoose={id=>void act({type:'draft-category',categoryId:id})}/>}
     {view.phase==='board'&&<section className="v2card v2boardcard"><div className="v2boardheading"><h2>{canChoose?'✦ Your turn to choose!':`${view.players.find(p=>p.id===view.chooserId)?.name}’s turn to choose`}</h2><span>{fmt(me?.score||0)} pts</span></div>{canChoose?<Board view={view} onChoose={key=>void act({type:'open-question',key})}/>:<div className="v2boardmini"><Board view={view}/></div>}</section>}
     {view.phase==='intro'&&<section className="v2card v2intro" aria-live="polite"><div className="v2introkicker">✳ UP NEXT · {view.roundNames[view.round]}</div><h2>{view.intro?.category}</h2><div className="v2introvalue">{fmt(view.intro?.points||0)}<span> POINTS</span></div><div className="v2introwait">GET READY FOR YOUR QUESTION</div></section>}
     {view.phase==='question'&&view.active&&<section className="v2card v2questioncard"><div className="v2questiondisplay">
       <div className="v2questionheader"><span className="v2categorychip">{view.active.category}</span><span className="v2questionpoints">{view.active.points} PTS</span><span className={"v2quicktimer ks-clock "+(myDeadline&&myDeadline-timerNow<=5000?"ks-urgent":"")} aria-label="Time remaining">{view.paused?'PAUSED':remain(myDeadline,timerNow)}<small>LEFT</small></span></div>
       <h2 className="v2prompt">{view.active.prompt}</h2>{myDeadline&&<div className="ks-timebar" role="progressbar" aria-label="Question time remaining" aria-valuenow={Math.max(0,Math.ceil((myDeadline-timerNow)/1000))} aria-valuemin={0} aria-valuemax={view.settings.answerSeconds+(me?.bonusTimeSeconds||0)}><span style={{width:`${Math.max(0,Math.min(100,((myDeadline-timerNow)/((view.settings.answerSeconds+(me?.bonusTimeSeconds||0))*1000))*100))}%`}}/></div>}

       {activeForPlayer&&!myHasAnswered?<>
         {view.settings.mode==='individual'&&<label className="v2double v2doublecompact"><input type="checkbox" checked={doubleTake} disabled={busy||!me?.doubleTakesRemaining} onChange={e=>setDoubleTake(e.target.checked)}/> <span>✳ Double Take <small>({me?.doubleTakesRemaining} left)</small></span></label>}
         {view.active.myChoices?.length===4
           ? <ChoiceForm choices={view.active.myChoices} disabled={busy||view.paused||Boolean(myDeadline&&timerNow>myDeadline)} onSubmit={val=>void act({type:'submit-answer',answer:val,doubleTake})}/>
           : <AnswerForm key={view.active.key+(view.active.stealTurn?'-steal':'-first')} value={answerDraft} onChange={v=>{setAnswerDraft(v);setDraftSaved(false);}} disabled={busy||view.paused||Boolean(myDeadline&&timerNow>myDeadline)} onSubmit={val=>void act({type:'submit-answer',answer:val,doubleTake})}/>}
         {!view.active.myChoices&&answerDraft.trim()&&<p className="ks-autosave">{draftSaved?"✓ Draft saved — will count when time runs out":"Saving draft for automatic submission…"}</p>}
       </>:myHasAnswered?<div className="v2locked">✓ Answer locked: {view.active.mySubmission}</div>:<div className="v2locked">{view.settings.mode==='teams'?`${view.players.find(p=>p.id===view.active?.answeringId)?.name} is ${view.active.stealTurn?'attempting a steal':'answering'}.`:'Time to see how everyone does.'}</div>}
     </div>
     {activeForPlayer&&!myHasAnswered&&<>
       <details className="v2assistance"><summary>Hints & assistance <span>{view.myHints} available</span></summary>
         <div className="v2hintrow"><button className="v2small" disabled={busy||!view.myHints||!!view.active.myWrittenHint} onClick={()=>void act({type:'hint',kind:'written'})}>Use written hint</button>
           
</div>
         {view.active.myWrittenHint&&<div className="v2hint">Hint: {view.active.myWrittenHint}</div>}
         

       </details>
       {view.settings.mode==='teams'&&<button className="v2small" disabled={busy} onClick={()=>void act({type:'pass'})}>Pass to next team</button>}
     </>}
     </section>}
     {view.phase==='results'&&view.results&&<section className="ks-results-panel"><AnswerReveal view={view} now={timerNow}/><button className="ks-dispute-button" disabled={busy||view.results.disputeIds.includes(me!.id)} onClick={()=>void act({type:'dispute'})}>{view.results.disputeIds.includes(me!.id)?'Host reviewing your dispute':'Dispute my result'}</button></section>}
     {view.phase==='final-wager'&&<section className="ks-finaldecision" aria-label="Final Word hints and wager">
       <header className="ks-finaldecision-head"><span className="ks-finaldecision-eyebrow">✦ THE FINAL WORD</span><h2>{view.final?.category}</h2><p>You know the category, but the question stays secret until everyone locks their wager.</p></header>
       <div className="ks-finaldecision-balance"><span>YOUR BALANCE</span><strong>{fmt(me?.score??0)} <small>points</small></strong></div>
       <div className="ks-finaldecision-section">
         <div className="ks-finaldecision-sectionhead"><h3>Purchase hints</h3><span>{finalHintCount} / {view.final?.maxHints??2}</span></div>
         <p>Hints cost <strong>{fmt(finalHintPrice)} points each</strong>. You can buy up to two before locking your wager. Regular-game hints don't carry over.</p>
         <div className="ks-finaldecision-hints" aria-label={`${finalHintCount} of two hints purchased`}>
           {Array.from({length:view.final?.maxHints??2},(_,i)=><span key={i} className={i<finalHintCount?'purchased':''}>{i<finalHintCount?'✓':'✧'} Hint {i+1}</span>)}
         </div>
         {view.final?.myWager===undefined?<button type="button" className="ks-finaldecision-buy" disabled={busy||view.paused||!(view.final?.myPurchasableHints)||wagerMax<finalHintPrice} onClick={()=>void act({type:'buy-final-hint'})}>+ Buy a hint · −{fmt(finalHintPrice)} pts</button>:<span className="ks-finaldecision-locknote">Hint purchases are closed.</span>}
         {view.final?.myWager===undefined&&!(view.final?.myPurchasableHints)&&<small>Both Final Word hints are purchased.</small>}
         {view.final?.myWager===undefined&&Boolean(view.final?.myPurchasableHints)&&wagerMax<finalHintPrice&&<small>You need at least {fmt(finalHintPrice)} points for another hint.</small>}
         <div className="ks-finaldecision-cost"><span>Spent on hints</span><b>−{fmt(finalHintCount*finalHintPrice)} pts</b></div>
         <small>Purchases are final. Reveal your hints after the question appears.</small>
       </div>
       <form className="ks-finaldecision-section ks-finaldecision-wager" onSubmit={e=>{e.preventDefault();if(view.final?.myWager===undefined)void act({type:'wager',amount:wagerPreview});}}>
         <div className="ks-finaldecision-sectionhead"><h3>Your wager</h3><span>Max {fmt(wagerMax)} pts</span></div>
         {view.final?.myWager===undefined?<>
           <input type="range" min={0} max={Math.max(1,wagerMax)} step={1} value={wagerPreview} disabled={busy||view.paused||wagerMax===0} onChange={e=>setWager(Number(e.target.value))} aria-label="Your Final Word wager" className="ks-finaldecision-slider"/>
           <div className="ks-finaldecision-wagerline"><span>0</span><label><input aria-label="Wager amount in points" type="number" inputMode="numeric" min={0} max={wagerMax} step={1} value={wagerPreview} disabled={busy||view.paused} onChange={e=>setWager(Math.max(0,Math.min(wagerMax,Math.trunc(Number(e.target.value)||0))))}/><small>pts</small></label><span>{fmt(wagerMax)}</span></div>
           <div className="ks-finaldecision-shortcuts"><button type="button" disabled={busy||view.paused} onClick={()=>setWager(0)}>No wager</button><button type="button" disabled={busy||view.paused} onClick={()=>setWager(Math.floor(wagerMax/2))}>Half</button><button type="button" disabled={busy||view.paused} onClick={()=>setWager(wagerMax)}>All in</button></div>
         </>:<p className="ks-finaldecision-locked">✓ Locked: {fmt(view.final.myWager)} pts · Waiting for other players</p>}
         <div className="ks-finaldecision-outcomes" aria-live="polite">
           <div className="correct"><span>✓ If correct</span><strong>{fmt((me?.score??0)+finalPreviewWager)}</strong><small>points</small></div>
           <div className="incorrect"><span>✕ If incorrect</span><strong>{fmt((me?.score??0)-finalPreviewWager)}</strong><small>points</small></div>
         </div>
         {view.final?.myWager===undefined&&<button className="ks-finaldecision-submit" type="submit" disabled={busy||view.paused}>Lock hints &amp; wager <span aria-hidden="true">↗</span></button>}
         {view.final?.myWager===undefined&&<p className="ks-finaldecision-disclaimer">Once locked, you cannot purchase more hints or change your wager.</p>}
       </form>
       <details className="ks-finaldecision-standings"><summary>View current standings</summary><Scoreboard players={view.players}/></details>
     </section>}
     {view.phase==='final-question'&&<section className="v2card v2questioncard ks-finalquestion"><div className="v2questiondisplay">
       <div className="v2questionheader"><span className="v2categorychip">THE FINAL WORD · {view.final?.category}</span><span className={"v2quicktimer ks-clock "+(view.final?.deadlineAt&&view.final.deadlineAt-timerNow<=5000?"ks-urgent":"")} role="timer" aria-label="Final Word time remaining">{view.paused?'PAUSED':remain(view.final?.deadlineAt,timerNow)}<small>LEFT</small></span></div>
       <h2 className="v2prompt">{view.final?.prompt}</h2>
       {view.final?.deadlineAt&&<div className="ks-timebar" role="progressbar" aria-label="Final Word time remaining" aria-valuenow={Math.max(0,Math.ceil((view.final.deadlineAt-timerNow)/1000))} aria-valuemin={0} aria-valuemax={view.settings.finalSeconds}><span style={{width:`${Math.max(0,Math.min(100,((view.final.deadlineAt-timerNow)/(Math.max(1,view.settings.finalSeconds)*1000))*100))}%`}}/></div>}
       {view.final?.myAnswer!==undefined?<p className="v2locked">✓ Final answer locked: {view.final.myAnswer}</p>:<AnswerForm key="final-word" value={finalDraft} onChange={v=>{setFinalDraft(v);setDraftSaved(false);}} disabled={busy||view.paused||Boolean(view.final?.deadlineAt&&timerNow>view.final.deadlineAt)} onSubmit={a=>void act({type:'final-answer',answer:a})}/ >}
       {finalDraft.trim()&&view.final?.myAnswer===undefined&&<p className="ks-autosave">{draftSaved?"✓ Final draft saved — will count at zero":"Saving your Final Word draft…"}</p>}
       <div className="ks-finalhintpanel"><div className="ks-finalhinthead"><strong>Final Word hints</strong><span>{view.final?.myAvailableHints||0} available · {view.final?.myRevealedHints?.length||0} of {view.final?.maxHints??2} revealed</span></div>
       {(view.final?.myRevealedHints||[]).map((hint,i)=><p className="ks-finalhintline" key={i}><b>Hint {i+1}</b> {hint}</p>)}
       {view.final?.myAnswer===undefined&&<button type="button" className="ks-finalhintbutton" disabled={busy||view.paused||!(view.final?.myAvailableHints)||Boolean(view.final?.deadlineAt&&timerNow>view.final.deadlineAt)} onClick={()=>void act({type:'final-hint'})}>Reveal next hint ({view.final?.myAvailableHints||0} left)</button>}
       {!(view.final?.myAvailableHints)&&!(view.final?.myRevealedHints?.length)&&<small>No Final Word hints purchased for this question.</small>}
       </div>
     </div></section>}
     {view.phase==='final-results'&&<section className="ks-results-panel"><AnswerReveal view={view} now={timerNow} final/><button className="ks-dispute-button" disabled={busy||view.final?.disputeIds.includes(me!.id)} onClick={()=>void act({type:'dispute'})}>{view.final?.disputeIds.includes(me!.id)?'Host reviewing your dispute':'Dispute my result'}</button></section>}
   </>}
   {!['results','final-results','final-wager'].includes(view.phase)&&<section className={'v2card'+(phonesOnly?' v25detailscores':'')}><h3>{phonesOnly?'Full leaderboard':'Live scores'}</h3><Scoreboard players={view.players} chooserId={view.phase==='board'?view.chooserId:undefined}/></section>}
   <footer className="v2phonefooter">{hostToken&&!phonesOnly&&<Link className="v2small" href={`/display/${code}`}>Open TV display ↗</Link>}<span>The Know Show · v1.5.4</span></footer>
   </>}
 </main>;
}
