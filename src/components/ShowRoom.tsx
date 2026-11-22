'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {useParams} from 'next/navigation';
import Link from 'next/link';
import {QRCodeSVG} from 'qrcode.react';
import {SUNO_SOUNDTRACKS,sunoEmbedUrl} from '@/lib/suno-catalog';
import type {Action,GameView,MusicStyle,Player,Settings} from '@/lib/game';
import {actorToken,type DeviceTab} from '@/lib/device-session';

const fmt=(n:number)=>n.toLocaleString('en-US');
const remain=(until:number|undefined,now:number)=>until===undefined? '—' : `${Math.max(0,Math.ceil((until-now)/1000))}s`;
function Scoreboard({players,chooserId}:{players:Player[];chooserId?:string}){
 return <div className="v2scores">{[...players].sort((a,b)=>b.score-a.score).map((p,i)=><div className={'v2score '+(chooserId===p.id?'selecting':'')} key={p.id}><span className="v2rank">{i+1}</span><strong>{p.name}</strong><b>{fmt(p.score)}</b></div>)}</div>;
}
function Board({view,onChoose}:{view:GameView;onChoose?:(key:string)=>void}){
 return <div className="v2board">{view.selected[view.round].map(id=>{
  const cat=view.categories.find(c=>c.id===id);return <div className="v2boardcol" key={id}><div className="v2boardcat">{cat?.name||id}</div>
    {view.roundValues[view.round].map((value,i)=>{const key=`${id}:${i}`,used=view.usedKeys.includes(key);return <button type="button" key={key} disabled={!onChoose||used} className={'v2tile '+(used?'used':'')} onClick={()=>onChoose?.(key)}>{used?'':fmt(value)}</button>;})}</div>;
 })}</div>;
}
function TV({view,code,origin,now,preview=false}:{view:GameView;code:string;origin:string;now:number;preview?:boolean}){
 const soundtrack=SUNO_SOUNDTRACKS.find(t=>t.id===view.settings.music);
 const track=soundtrack?.arrangements[view.settings.arrangement];
 const lead=[...view.players].sort((a,b)=>b.score-a.score)[0];
 return <main className="v2tv">
   <header className="v2tvhead"><Link href="/">✳ THE KNOW SHOW</Link><span>{view.phase==='lobby'?'THE GREEN ROOM':view.phase.startsWith('final')?'THE FINAL WORD':view.phase==='finished'?'THE CURTAIN CALL':view.roundNames[view.round]}</span><span>{code}</span></header>
   <div className="v2tvcolumns"><section className="v2tvmain">
     {view.phase==='lobby'&&<div className="v2tvwelcome"><p className="v2eyebrow">WELCOME TO</p><h1>THE KNOW SHOW</h1><h2>Scan to join the fun</h2>{origin&&<div className="v2qrcard"><QRCodeSVG value={`${origin}/room/${code}`} size={245} level="M" marginSize={2}/></div>}<p className="v2roomcode">Room code: <strong>{code}</strong></p><p>{view.players.length} of 8 players joined</p></div>}
     {view.phase==='draft'&&<div className="v2tvstage"><span className="v2eyebrow">CATEGORY DRAFT · {view.selected[view.round].length}/5 SELECTED</span><h2>Choosing the lineup</h2><p>{view.players.find(p=>p.id===view.draftTurnId)?.name} is choosing a category.</p><div className="v2drafted">{view.selected[view.round].map(id=><span key={id}>{view.categories.find(c=>c.id===id)?.name}</span>)}</div></div>}
     {view.phase==='board'&&<><div className="v2tvsection"><span>ROUND {view.round+1}</span><h2>{view.roundNames[view.round]}</h2><p>{view.players.find(p=>p.id===view.chooserId)?.name} chooses the next question</p></div><Board view={view}/></>}
     {view.phase==='intro'&&<div className="v2tvstage"><span className="v2eyebrow">UP NEXT</span><h2>{view.intro?.category}</h2><div className="v2bigpoints">{fmt(view.intro?.points||0)}</div><span className="v2eyebrow">GET READY</span></div>}
     {view.phase==='question'&&<div className="v2tvstage"><span className="v2eyebrow">{view.active?.category} · {fmt(view.active?.points||0)} POINTS</span><h2 className="v2question">{view.active?.prompt}</h2><div className="v2timer">{view.paused?'PAUSED':remain((view.active?.deadlineAt||0)+Math.max(...view.players.map(p=>p.bonusTimeSeconds||0))*1000,now)}</div><p>{view.settings.mode==='individual'?`${view.active?.submissionCount||0}/${view.players.length} answers received`:`${view.players.find(p=>p.id===view.active?.answeringId)?.name} ${view.active?.stealTurn?'can steal':'is answering'}`}</p></div>}
     {view.phase==='results'&&view.results&&<div className="v2tvstage"><span className="v2eyebrow">THE ANSWER</span><h2 className="v2answer">{view.results.answer}</h2><p>{view.results.category} · {fmt(view.results.points)} points</p>
        <div className="v2resultgrid">{view.players.map(p=>{const r=view.results!.answers[p.id];return <div key={p.id} className={'v2result '+(r?.correct?'right':'wrong')}><b>{p.name}</b><span>{r?.correct?'✓ Correct':r?'✕ Incorrect':'No answer'}</span><strong>{r?.points?`+${fmt(r.points)}`:'0'}</strong>{r?.doubleTake&&<small>DOUBLE TAKE!</small>}</div>;})}</div>
        {view.results.disputeIds.length>0&&<div className="v2alert">Result under host review</div>}</div>}
     {view.phase==='final-wager'&&<div className="v2tvstage"><span className="v2eyebrow">ONE LAST QUESTION</span><h2>The Final Word</h2><p>Place your private wager on your phone.</p><p>{view.final?.wagerCount||0} / {view.players.length} wagers locked</p><h3>Category: {view.final?.category}</h3></div>}
     {view.phase==='final-question'&&<div className="v2tvstage"><span className="v2eyebrow">THE FINAL WORD · {view.final?.category}</span><h2 className="v2question">{view.final?.prompt}</h2><div className="v2timer">{view.paused?'PAUSED':remain(view.final?.deadlineAt,now)}</div><p>{view.final?.answerCount||0}/{view.players.length} answers</p></div>}
     {view.phase==='final-results'&&<div className="v2tvstage"><span className="v2eyebrow">THE FINAL WORD</span><h2 className="v2answer">{view.final?.answer}</h2><div className="v2resultgrid">{view.final?.results?.map(p=><div className={'v2result '+(p.correct?'right':'wrong')} key={p.id}><b>{p.name}</b><span>{p.correct?'✓ Correct':'✕ Incorrect'}</span><strong>{p.points>=0?'+':''}{fmt(p.points)}</strong></div>)}</div>{Boolean(view.final?.disputeIds.length)&&<p>Dispute under review</p>}</div>}
     {view.phase==='finished'&&<div className="v2tvstage"><span className="v2eyebrow">THAT'S A WRAP!</span><h2>The Curtain Call</h2><div className="v2bigpoints">★</div><h2>{lead?.name}</h2><p>{fmt(lead?.score||0)} points</p></div>}
     {view.paused&&<div className="v2paused">THE SHOW IS PAUSED</div>}
   </section><aside className="v2tvside"><h3>Leaderboard</h3><Scoreboard players={view.players} chooserId={view.phase==='board'?view.chooserId:undefined}/>
   {!preview&&<div className="v2musicdock"><div className="v2musiclabel">♫ {soundtrack?.label||'Music off'} {soundtrack?`· Arrangement ${view.settings.arrangement+1}`:''}</div>
     {track?<iframe key={track.id} title={`${soundtrack!.label} arrangement ${view.settings.arrangement+1}`} src={sunoEmbedUrl(track.id)} allow="autoplay; encrypted-media; fullscreen" loading="eager" referrerPolicy="strict-origin-when-cross-origin"/>:<p>Soundtrack disabled by host</p>}
     {track&&<small>Press Play here to start the music. Suno controls volume and playback.</small>}</div>}
   </aside></div>
 </main>;
}
function AnswerForm({value,onChange,onSubmit,disabled,label='Your answer'}:{value:string;onChange:(value:string)=>void;onSubmit:(value:string)=>void;disabled:boolean;label?:string;key?:string}){
 return <form className="v2answerform" onSubmit={e=>{e.preventDefault();if(value.trim()){e.currentTarget.querySelector('input')?.blur();onSubmit(value.trim());}}}><label>{label}<input maxLength={200} placeholder="Type your answer" value={value} onChange={e=>onChange(e.target.value)} disabled={disabled}/></label><button type="submit" disabled={disabled||!value.trim()}>Lock answer</button></form>;
}
export default function ShowRoom({displayOnly=false}:{displayOnly?:boolean}){
 const params=useParams<{code:string}>();const code=String(params.code||'').toUpperCase();
 const [ready,setReady]=useState(false),[hostToken,setHostToken]=useState(''),[playerToken,setPlayerToken]=useState(''),[tab,setTab]=useState<DeviceTab>('player'),[origin,setOrigin]=useState('');
 const [view,setView]=useState<GameView|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[now,setNow]=useState(Date.now());
 const [name,setName]=useState(''),[age,setAge]=useState(''),[answerDraft,setAnswerDraft]=useState(''),[finalDraft,setFinalDraft]=useState(''),[doubleTake,setDoubleTake]=useState(false),[wager,setWager]=useState('0');
 const [pairOpen,setPairOpen]=useState(false),[joinOpen,setJoinOpen]=useState(true),[scoreEdits,setScoreEdits]=useState<Record<string,string>>({});
 const lastRev=useRef(-1);const lastKey=useRef('');
 const authToken=displayOnly?'':actorToken(tab,{hostToken,playerToken});
 const authMarker=`${tab}:${authToken}`;
 const authRef=useRef(authMarker);
 authRef.current=authMarker;
 useEffect(()=>{
   let cancelled=false;
   setOrigin(window.location.origin);
   if(displayOnly){setReady(true);return;}
   async function initialize(){
     const query=new URLSearchParams(window.location.search);const paired=query.get('hostToken');
     if(paired){query.delete('hostToken');window.history.replaceState(null,'',window.location.pathname+(query.size?'?'+query.toString():''));}
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
     setHostToken(h);setPlayerToken(p);setTab(p?'player':h?'host':'player');setReady(true);
   }
   void initialize();return()=>{cancelled=true;};
 },[code,displayOnly]);
 const switchTab=(next:DeviceTab)=>{
   if(next===tab)return;
   lastRev.current=-1;setView(null);setError('');setTab(next);
 };
 const refresh=useCallback(async()=>{
   if(!ready)return;
   const marker=authMarker;
   try{
     const res=await fetch(`/api/rooms/${code}`,{headers:authToken?{Authorization:`Bearer ${authToken}`}:{},cache:'no-store'});
     const d=await res.json();if(marker!==authRef.current)return;
     if(!res.ok)throw new Error(d.error||'Could not load room.');
     if(d.revision>=lastRev.current){lastRev.current=d.revision;setView(d);setError('');}
   }catch(e){if(marker===authRef.current)setError(e instanceof Error?e.message:'Could not refresh room.');}
 },[code,ready,authToken,authMarker]);
 useEffect(()=>{if(!ready)return;void refresh();const t=setInterval(()=>void refresh(),1250);return()=>clearInterval(t);},[ready,refresh]);
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),300);return()=>clearInterval(t);},[]);
 const act=useCallback(async(action:Action)=>{if(busy)return;
   const marker=authMarker;setBusy(true);setError('');
   try{
     const res=await fetch(`/api/rooms/${code}/action`,{method:'POST',headers:{'Content-Type':'application/json',...(authToken?{Authorization:`Bearer ${authToken}`}:{})},body:JSON.stringify(action)});
     const d=await res.json();if(marker!==authRef.current)return;
     if(!res.ok)throw new Error(d.error||'Action failed.');
     if(d.revision>=lastRev.current){lastRev.current=d.revision;setView(d);}
   }catch(e){if(marker===authRef.current){setError(e instanceof Error?e.message:'Could not update game.');void refresh();}}finally{setBusy(false);}
 },[busy,code,authToken,authMarker,refresh]);
 const join=async()=>{setBusy(true);setError('');try{const res=await fetch(`/api/rooms/${code}/join`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,age:Number(age)})});const d=await res.json();if(!res.ok)throw new Error(d.error||'Could not join.');localStorage.setItem(`knowshow:${code}:player`,d.token);lastRev.current=-1;setPlayerToken(d.token);setTab('player');setView(d.view);lastRev.current=d.view.revision;}catch(e){setError(e instanceof Error?e.message:'Could not join.');}finally{setBusy(false);}};
 const role=view?.role.kind||'spectator',isHost=!displayOnly&&tab==='host'&&role==='host',isPlayer=!displayOnly&&tab==='player'&&role==='player';
 const me=view?.players.find(p=>p.id===view.role.id),canChoose=Boolean(me&&view?.chooserId===me.id);
 const draftTurn=view?.players.find(p=>p.id===view.draftTurnId);
 const lastDisplayedPhase=useRef('');
 useEffect(()=>{
   const stamp=`${tab}:${view?.phase||''}:${view?.active?.key||''}`;
   if(stamp!==lastDisplayedPhase.current){
     lastDisplayedPhase.current=stamp;
     if(!displayOnly&&tab==='player'&&view&&['board','intro','question'].includes(view.phase))window.scrollTo(0,0);
   }
 },[tab,view?.phase,view?.active?.key,displayOnly]);
 const activeKey=view?.active?.key??view?.intro?.key??'';
 useEffect(()=>{if(activeKey&&activeKey!==lastKey.current){lastKey.current=activeKey;setAnswerDraft('');setDoubleTake(false);}},[activeKey]);
 const sorted=useMemo(()=>[...(view?.players||[])].sort((a,b)=>b.score-a.score),[view?.players]);
 const genre=SUNO_SOUNDTRACKS.find(t=>t.id===view?.settings.music);
 if(!ready||(!view&&!error))return <main className="v2loading">✳ Preparing The Know Show…</main>;
 if(!view)return <main className="v2loading"><h2>Can't open this room</h2><p>{error}</p><Link href="/">Create a new show</Link></main>;
 if(displayOnly)return <TV view={view} code={code} origin={origin} now={now}/>;
 const stage=view.phase==='lobby'?'Green Room':view.phase==='draft'?'Category Draft':view.phase.startsWith('final')?'The Final Word':view.phase==='finished'?'The Curtain Call':view.roundNames[view.round];
 const roomUrl=`${origin}/room/${code}`,hostUrl=`${roomUrl}?hostToken=${encodeURIComponent(hostToken)}`;
 const wrongs=view.results?.answers||{};
 const activeForPlayer=view.phase==='question'&&view.active&&(view.settings.mode==='individual'||view.active.answeringId===me?.id);
 const myDeadline=view.active?.myDeadlineAt??view.active?.deadlineAt;
 const myHasAnswered=Boolean(me&&view.active?.mySubmission!==undefined);
 return <main className="v2phone"><header className="v2phonehead"><Link href="/">✳ THE KNOW SHOW</Link><span>{isHost?'HOST':isPlayer?(view.settings.mode==='teams'?'TEAM':'PLAYER'):'GUEST'} · {code}</span></header>
   {hostToken&&<nav className="v2viewtabs" aria-label="Room views">
     <button type="button" className={tab==='player'?'active':''} aria-current={tab==='player'?'page':undefined} onClick={()=>switchTab('player')}>My Player View</button>
     {hostToken&&<button type="button" className={tab==='host'?'active':''} aria-current={tab==='host'?'page':undefined} onClick={()=>switchTab('host')}>Host Controls</button>}
     {hostToken&&<button type="button" className={tab==='tv'?'active':''} aria-current={tab==='tv'?'page':undefined} onClick={()=>switchTab('tv')}>TV Preview</button>}
   </nav>}
   {tab==='tv'&&hostToken?<div className="v2tvpreview"><div className="v2tvpreviewnote"><strong>TV Preview</strong> · For the actual shared TV, open the full-screen TV display from Host Controls. <button type="button" onClick={()=>switchTab(playerToken?'player':hostToken?'host':'player')}>← Back to {playerToken?'Player':'Host'} View</button></div><TV view={view} code={code} origin={origin} now={now} preview/></div>:<>
   {view.phase!=='board'&&<div className="v2phonestage"><span>{stage}</span><h1>{view.phase==='intro'?'Up next!':view.phase==='results'?'The answer is in':view.phase==='question'?view.active?.category:stage}</h1></div>}
   {error&&<div className="v2error" role="alert">{error}<button onClick={()=>setError('')}>Dismiss</button></div>}
   {view.paused&&<div className="v2alert">Game paused by the host</div>}
   {tab==='player'&&role==='spectator'&&view.phase==='lobby'&&<section className="v2card"><h2>Join the show</h2><p>Enter your name and age. If playing as a team, enter the team name and the youngest teammate's age.</p><form onSubmit={e=>{e.preventDefault();void join();}} className="v2form"><label>{view.settings.mode==='teams'?'Team name':'Player name'}<input required minLength={2} maxLength={28} value={name} onChange={e=>setName(e.target.value)}/></label><label>Age<input required type="number" min={3} max={110} value={age} onChange={e=>setAge(e.target.value)}/></label><button disabled={busy}>Join this room</button></form></section>}
   {tab==='player'&&role==='spectator'&&view.phase!=='lobby'&&<div className="v2card"><p>This show is already in progress. Ask the host for a new room when it ends.</p><Link href={`/display/${code}`}>Watch the TV display</Link></div>}
   {tab==='host'&&!isHost&&<section className="v2card"><h2>Host access unavailable</h2><p>Scan the private host QR code from a device that already has host access. Your player view is unaffected.</p><button className="v2small" onClick={()=>switchTab('player')}>Back to Player View</button></section>}
   {isHost&&!playerToken&&view.phase==='lobby'&&<section className="v2card v2hostjoin"><h2>Play and host at the same time</h2><p>Join this show as a player. You'll keep your private host access and can switch between both views throughout the game.</p><button className="v2primary" onClick={()=>switchTab('player')}>Join as a player</button></section>}
   {isHost&&<>
     <section className="v2card"><div className="v2between"><h2>Host controls</h2><button className="v2small" disabled={busy} onClick={()=>void act({type:'pause'})}>{view.paused?'Resume':'Pause'} game</button></div>
       <p>Manage this room from your phone. Open the public TV display separately on the laptop.</p>
       <div className="v2buttonrow"><a className="v2button" href={`/display/${code}`} target="_blank" rel="noopener noreferrer">Open TV display ↗</a><button className="v2button muted" onClick={()=>setPairOpen(!pairOpen)}>Private host QR {pairOpen?'−':'+'}</button></div>
       {pairOpen&&<div className="v2private"><p><strong>Private host pairing</strong> — Only use this to add host controls to another device (such as your phone if you created the show on a laptop). If you already have the Host Controls tab, you do not need to scan again. Keep this code off the shared TV.</p><div className="v2qrcard"><QRCodeSVG value={hostUrl} size={190} marginSize={2}/></div><p><button className="v2small" onClick={()=>void navigator.clipboard.writeText(hostUrl)}>Copy host link</button></p></div>}
     </section>
     <section className="v2card"><h2>Soundtrack</h2><p>Plays through the TV's Suno player. Jazz is the default; changing a track may require pressing Play on the TV again.</p><div className="v2form"><label>Music style<select value={view.settings.music} onChange={e=>void act({type:'settings',settings:{music:e.target.value as MusicStyle}})} disabled={busy}><option value="off">No music</option>{SUNO_SOUNDTRACKS.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
       {genre&&<label>Arrangement<select value={view.settings.arrangement} onChange={e=>void act({type:'settings',settings:{arrangement:Number(e.target.value) as 0|1}})} disabled={busy}><option value="0">Arrangement 1</option><option value="1">Arrangement 2</option></select></label>}
       <small>Volume, play/pause, and looping remain inside Suno's embedded player—not remotely controllable.</small></div></section>
     {view.phase==='lobby'&&<>
       <section className="v2card"><h2>Game settings</h2><div className="v2form"><label>Mode<select value={view.settings.mode} disabled={busy} onChange={e=>void act({type:'settings',settings:{mode:e.target.value as Settings['mode']}})}><option value="individual">Individual — Everyone Answers</option><option value="teams">Team — Turn Based</option></select></label>
        <label>Answer time (seconds)<select value={view.settings.answerSeconds} disabled={busy} onChange={e=>void act({type:'settings',settings:{answerSeconds:Number(e.target.value)}})}>{[15,20,25,30,45,60].map(v=><option key={v} value={v}>{v}</option>)}</select></label>
        <label>Standard written hints<select value={view.settings.normalHints} disabled={busy} onChange={e=>void act({type:'settings',settings:{normalHints:Number(e.target.value)}})}>{[0,1,2,3,4,5].map(v=><option key={v} value={v}>{v}</option>)}</select></label>
       </div></section>
       <section className="v2card"><div className="v2between"><h2>Players ({view.players.length}/8)</h2><button className="v2small" onClick={()=>setJoinOpen(!joinOpen)}>Join QR {joinOpen?'−':'+'}</button></div>
         {joinOpen&&<div className="v2qrcard"><QRCodeSVG value={roomUrl} size={200} marginSize={2}/><p>Scan to join · {code}</p></div>}
         {view.players.length===0&&<p>Waiting for players…</p>}

         <button className="v2primary" disabled={busy||view.players.length<2} onClick={()=>void act({type:'start-draft'})}>Begin category draft</button></section>
     </>}
     {view.players.length>0&&(view.phase==='lobby'||view.paused)&&<section className="v2card v2accommodationspanel"><h2>Player accommodations</h2><p>{view.phase==='lobby'?'Customize assistance before starting the game.':'The game is paused. Changes will take effect when play resumes.'}</p>{view.players.map(p=><div key={p.id} className="v2accommodation"><h3>{p.name} <small>age {p.age}</small></h3><div className="v2twocol"><label>Extra written hints<select value={p.bonusHints} disabled={busy} onChange={e=>void act({type:'player-bonuses',playerId:p.id,bonusHints:Number(e.target.value)})}>{[0,1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}</select></label><label>Extra answer time<select value={p.bonusTimeSeconds} disabled={busy} onChange={e=>void act({type:'player-bonuses',playerId:p.id,bonusTimeSeconds:Number(e.target.value)})}>{[0,5,10,15,20,30].map(n=><option key={n} value={n}>{n}s</option>)}</select></label></div><div className="v2checkrow"><label><input type="checkbox" checked={p.firstLetter} disabled={busy} onChange={e=>void act({type:'player-bonuses',playerId:p.id,firstLetter:e.target.checked})}/> First letter</label><label><input type="checkbox" checked={p.answerLength} disabled={busy} onChange={e=>void act({type:'player-bonuses',playerId:p.id,answerLength:e.target.checked})}/> Answer length</label></div></div>)}</section>}
     {view.phase==='draft'&&<div className="v2card"><h2>Category draft</h2><p>{draftTurn?.name} is choosing. ({view.selected[view.round].length} of 5 selected.)</p><div className="v2categorylist">{view.draftPool.filter(id=>!view.selected[view.round].includes(id)).map(id=><button key={id} disabled={busy} onClick={()=>void act({type:'draft-category',categoryId:id})}>{view.categories.find(c=>c.id===id)?.name}</button>)}</div></div>}
     {view.phase==='board'&&<section className="v2card"><h2>Question selection</h2><p>{view.players.find(p=>p.id===view.chooserId)?.name} chooses next. As host, you can also select.</p><Board view={view} onChoose={key=>void act({type:'open-question',key})}/></section>}
     {(view.phase==='intro'||view.phase==='question')&&<section className="v2card"><h2>{view.intro?.category} · {fmt(view.intro?.points||0)}</h2>{view.phase==='question'?<><p className="v2prompt">{view.active?.prompt}</p><p className="v2hostanswer">Answer is hidden during play so the host can compete fairly.</p><p>{view.active?.submissionCount} / {view.players.length} submitted</p></>:<p>Question appears shortly…</p>}<button className="v2small danger" disabled={busy} onClick={()=>void act({type:'skip-question'})}>Skip faulty question</button></section>}
     {view.phase==='results'&&view.results&&<section className="v2card"><h2>Results</h2><p>Correct answer: <strong>{view.results.answer}</strong></p><p>Returns to board automatically unless disputed.</p>
       {view.players.map(p=>{const r=wrongs[p.id],disputed=view.results!.disputeIds.includes(p.id);return <div key={p.id} className="v2hostresult"><div><b>{p.name}</b><p>{r?.answer||'(no answer)'} · {r?.correct?'Correct':'Incorrect'}</p>{disputed&&<small>DISPUTE — REVIEW REQUIRED</small>}</div>{r?<div className="v2buttonrow"><button className="v2small" disabled={busy} onClick={()=>void act({type:'resolve-dispute',playerId:p.id,correct:true})}>Mark correct</button><button className="v2small" disabled={busy} onClick={()=>void act({type:'resolve-dispute',playerId:p.id,correct:false})}>Mark wrong</button></div>:disputed&&<button className="v2small" disabled={busy} onClick={()=>void act({type:'dismiss-dispute',playerId:p.id})}>Dismiss dispute</button>}</div>;})}
     </section>}
     {view.phase==='final-wager'&&<section className="v2card"><h2>The Final Word</h2><p>Category: {view.final?.category}</p><p>{view.final?.wagerCount}/{view.players.length} wagers received.</p><button className="v2primary" disabled={busy} onClick={()=>void act({type:'start-final'})}>Reveal final question</button></section>}
     {view.phase==='final-question'&&<section className="v2card"><h2>The Final Word</h2><p>{view.final?.prompt}</p><p>Answer remains hidden until all final answers are revealed.</p><p>{view.final?.answerCount}/{view.players.length} submitted · {remain(view.final?.deadlineAt,now)}</p></section>}
     {view.phase==='final-results'&&<section className="v2card"><h2>Final results</h2><p>Answer: <strong>{view.final?.answer}</strong></p>{view.final?.results?.map(p=><div key={p.id} className="v2hostresult"><b>{p.name}: {p.answer}</b><div className="v2buttonrow"><button className="v2small" disabled={busy} onClick={()=>void act({type:'resolve-dispute',playerId:p.id,correct:true})}>Correct</button><button className="v2small" disabled={busy} onClick={()=>void act({type:'resolve-dispute',playerId:p.id,correct:false})}>Incorrect</button></div></div>)}<button className="v2primary" disabled={busy} onClick={()=>void act({type:'finish'})}>Show final standings</button></section>}
     {view.phase==='finished'&&<section className="v2card"><h2>Show complete!</h2><button className="v2primary" disabled={busy} onClick={()=>void act({type:'new-game'})}>Play another game</button></section>}
     {view.phase!=='lobby'&&<section className="v2card"><h2>Score adjustments</h2>{view.players.map(p=><div className="v2scoreedit" key={p.id}><span>{p.name} · {fmt(p.score)}</span><input inputMode="numeric" aria-label={`Score adjustment for ${p.name}`} placeholder="+100 or -100" value={scoreEdits[p.id]||''} onChange={e=>setScoreEdits(v=>({...v,[p.id]:e.target.value}))}/><button className="v2small" disabled={busy||!Number.isInteger(Number(scoreEdits[p.id]))||!scoreEdits[p.id]} onClick={()=>{void act({type:'adjust-score',playerId:p.id,delta:Number(scoreEdits[p.id])});setScoreEdits(v=>({...v,[p.id]:''}));}}>Apply</button></div>)}</section>}
   </>}
   {isPlayer&&<>
     {view.phase!=='board'&&<div className="v2card v2self"><h2>{me?.name}</h2><strong>{fmt(me?.score||0)} pts</strong><small>{view.settings.mode==='individual'?`${me?.doubleTakesRemaining} Double Takes this round · `:''}{view.myHints} written hints remaining</small></div>}
     {view.phase==='lobby'&&<section className="v2card"><h2>You're in!</h2><p>Waiting for the host to begin. Everyone plays the same question, with optional private assistance.</p></section>}
     {view.phase==='draft'&&<section className="v2card"><h2>Draft categories</h2><p>{draftTurn?.name} chooses next · {view.selected[view.round].length}/5 selected</p><div className="v2drafted">{view.selected[view.round].map(id=><span key={id}>{view.categories.find(c=>c.id===id)?.name}</span>)}</div>
       {view.draftTurnId===me?.id&&<div className="v2categorylist">{view.draftPool.filter(id=>!view.selected[view.round].includes(id)).map(id=><button disabled={busy} key={id} onClick={()=>void act({type:'draft-category',categoryId:id})}>{view.categories.find(c=>c.id===id)?.name}</button>)}</div>}
     </section>}
     {view.phase==='board'&&<section className="v2card v2boardcard"><div className="v2boardheading"><h2>{canChoose?'Your turn — pick a question':`Waiting for ${view.players.find(p=>p.id===view.chooserId)?.name}`}</h2><span>{fmt(me?.score||0)} pts</span></div>{canChoose?<Board view={view} onChoose={key=>void act({type:'open-question',key})}/>:<div className="v2boardmini"><Board view={view}/></div>}</section>}
     {view.phase==='intro'&&<section className="v2card v2intro"><p>UP NEXT</p><h2>{view.intro?.category}</h2><h1>{fmt(view.intro?.points||0)} points</h1><p>Question coming up…</p></section>}
     {view.phase==='question'&&view.active&&<section className="v2card v2questioncard"><div className="v2questiondisplay"><p className="v2eyebrow">{view.active.category} <span className="v2questionpoints">{view.active.points} POINTS</span></p><h2 className="v2prompt">{view.active.prompt}</h2><div className="v2countdown" aria-label="Time remaining">{view.paused?'Paused':remain(myDeadline,now)}</div></div>
       {activeForPlayer&&!myHasAnswered?<>
         <div className="v2hintrow"><button className="v2small" disabled={busy||!view.myHints||!!view.active.myWrittenHint} onClick={()=>void act({type:'hint',kind:'written'})}>Hint ({view.myHints})</button>
           {me?.firstLetter&&<button className="v2small" disabled={busy||!!view.active.myFirstLetter} onClick={()=>void act({type:'hint',kind:'first-letter'})}>Reveal first letter</button>}
           {me?.answerLength&&<button className="v2small" disabled={busy||view.active.myAnswerLength!==undefined} onClick={()=>void act({type:'hint',kind:'answer-length'})}>Answer length</button>}</div>
         {view.active.myWrittenHint&&<div className="v2hint">Hint: {view.active.myWrittenHint}</div>}
         {view.active.myFirstLetter&&<div className="v2hint">First letter: {view.active.myFirstLetter}</div>}
         {view.active.myAnswerLength!==undefined&&<div className="v2hint">Letters: {view.active.myAnswerLength}</div>}
         {view.settings.mode==='individual'&&<label className="v2double"><input type="checkbox" checked={doubleTake} disabled={busy||!me?.doubleTakesRemaining} onChange={e=>setDoubleTake(e.target.checked)}/> ✳ Double Take — double base points if correct ({me?.doubleTakesRemaining} left)</label>}
         <AnswerForm key={view.active.key+(view.active.stealTurn?'-steal':'-first')} value={answerDraft} onChange={setAnswerDraft} disabled={busy||view.paused||Boolean(myDeadline&&now>myDeadline)} onSubmit={val=>void act({type:'submit-answer',answer:val,doubleTake})}/>
         {view.settings.mode==='teams'&&<button className="v2small" disabled={busy} onClick={()=>void act({type:'pass'})}>Pass</button>}
       </>:myHasAnswered?<div className="v2hint">Answer locked: {view.active.mySubmission}. Waiting for other players…</div>:<p className="v2hint">{view.settings.mode==='teams'?`${view.players.find(p=>p.id===view.active?.answeringId)?.name} is ${view.active.stealTurn?'attempting a steal':'answering'}.`:'Time to see how everyone does.'}</p>}
     </section>}
     {view.phase==='results'&&view.results&&<section className="v2card"><p className="v2eyebrow">THE ANSWER</p><h2>{view.results.answer}</h2><div className="v2resultgrid">{view.players.map(p=>{const r=view.results!.answers[p.id];return <div className={'v2result '+(r?.correct?'right':'wrong')} key={p.id}><b>{p.name}</b><span>{r?.correct?'Correct':r?'Incorrect':'No answer'}</span><strong>{r?.points?`+${fmt(r.points)}`:'0'}</strong></div>;})}</div>
       <button className="v2small" disabled={busy||view.results.disputeIds.includes(me!.id)} onClick={()=>void act({type:'dispute'})}>{view.results.disputeIds.includes(me!.id)?'Host reviewing your dispute':'Dispute my result'}</button></section>}
     {view.phase==='final-wager'&&<section className="v2card"><h2>The Final Word</h2><p>Category: <strong>{view.final?.category}</strong></p><p>Choose a wager from zero to your current nonnegative score.</p>{view.final?.myWager===undefined?<form className="v2form" onSubmit={e=>{e.preventDefault();void act({type:'wager',amount:Number(wager)});}}><label>Your wager<input type="number" min={0} max={Math.max(0,me?.score||0)} value={wager} onChange={e=>setWager(e.target.value)}/></label><button disabled={busy||Number(wager)>Math.max(0,me?.score||0)}>Lock wager</button></form>:<p>Wager locked: {fmt(view.final.myWager)}</p>}</section>}
     {view.phase==='final-question'&&<section className="v2card v2questioncard"><div className="v2questiondisplay"><p className="v2eyebrow">THE FINAL WORD · {view.final?.category}</p><h2 className="v2prompt">{view.final?.prompt}</h2><div className="v2countdown" aria-label="Time remaining">{remain(view.final?.deadlineAt,now)}</div></div>{view.final?.myAnswer!==undefined?<p>Final answer locked: {view.final.myAnswer}</p>:<AnswerForm key="final-word" value={finalDraft} onChange={setFinalDraft} disabled={busy||view.paused||Boolean(view.final?.deadlineAt&&now>view.final.deadlineAt)} onSubmit={a=>void act({type:'final-answer',answer:a})}/>}</section>}
     {view.phase==='final-results'&&<section className="v2card"><h2>Correct answer: {view.final?.answer}</h2><div className="v2resultgrid">{view.final?.results?.map(r=><div key={r.id} className={'v2result '+(r.correct?'right':'wrong')}><b>{r.name}</b><span>{r.correct?'Correct':'Incorrect'}</span><strong>{r.points>=0?'+':''}{fmt(r.points)}</strong></div>)}</div><button className="v2small" disabled={busy||view.final?.disputeIds.includes(me!.id)} onClick={()=>void act({type:'dispute'})}>Dispute my result</button></section>}
     {view.phase==='finished'&&<section className="v2card"><h2>Final standings</h2>{sorted.map((p,i)=><p key={p.id}>{i+1}. {p.name} — {fmt(p.score)} points</p>)}</section>}
   </>}
   <section className="v2card"><h3>Live scores</h3><Scoreboard players={view.players} chooserId={view.phase==='board'?view.chooserId:undefined}/></section>
   <footer className="v2phonefooter">{hostToken&&<button type="button" className="v2small" onClick={()=>switchTab('tv')}>Preview TV screen</button>}<span>The Know Show · v0.2.2</span></footer>
   </>}
 </main>;
}
