'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Award, Check, ChevronRight, Clipboard, Clock3, Eye, EyeOff, HelpCircle, Lightbulb, LockKeyhole, Mic, Music2, Play, RotateCcw, Send, Settings2, SkipForward, Sparkles, Users, Volume2, VolumeX, X } from 'lucide-react';
import type { Action,GameView,Settings } from '@/lib/game';

type RequestError=Error;
function getToken(code:string) {try{return localStorage.getItem(`knowshow:${code}`)||'';}catch{return '';}}
function formatScore(n:number){return `${n<0?'−':''}${Math.abs(n).toLocaleString()}`;}
function Countdown({end,now}:{end?:number;now:number}){ if(!end)return <span className="subtle">Untimed</span>;const remaining=Math.max(0,Math.ceil((end-now)/1000));return <span className={remaining<=5?'urgent-time':''}>{remaining}s</span>;}
function speakerSupported() { return typeof window!=='undefined' && !!((window as unknown as {SpeechRecognition?:unknown;webkitSpeechRecognition?:unknown}).SpeechRecognition||(window as unknown as {webkitSpeechRecognition?:unknown}).webkitSpeechRecognition); }
function AnswerBox({onSubmit,disabled=false,placeholder='Type your answer'}:{onSubmit:(s:string)=>void;disabled?:boolean;placeholder?:string}) {
  const [value,setValue]=useState('');const [listening,setListening]=useState(false);
  function dictate(){
    type Rec = {lang:string;interimResults:boolean;onresult:((event:{results:ArrayLike<ArrayLike<{transcript:string}>>})=>void)|null;onend:(()=>void)|null;onerror:(()=>void)|null;start:()=>void};
    const w=window as unknown as {SpeechRecognition?:new()=>Rec;webkitSpeechRecognition?:new()=>Rec};
    const Constructor=w.SpeechRecognition||w.webkitSpeechRecognition;
    if(!Constructor)return;
    try{const rec=new Constructor();rec.lang='en-US';rec.interimResults=false;
      rec.onresult=e=>setValue(e.results[0][0].transcript);rec.onend=()=>setListening(false);rec.onerror=()=>setListening(false);
      setListening(true);rec.start();}catch{setListening(false);}
  }
  return <form className="answer-form" onSubmit={e=>{e.preventDefault();if(value.trim())onSubmit(value.trim());}}>
    <input className="input answer-input" value={value} onChange={e=>setValue(e.target.value)} placeholder={placeholder} disabled={disabled} autoComplete="off" maxLength={200}/>
    {speakerSupported()&&<button type="button" className="button icon-button" title="Dictate answer" disabled={disabled} onClick={dictate}><Mic size={20} className={listening?'recording':''}/></button>}
    <button className="button button-accent" type="submit" disabled={disabled||!value.trim()}><Send size={17}/> Submit</button>
  </form>;
}
function Soundscape({style}:{style:Settings['music']}) {
  const [enabled,setEnabled]=useState(false);const [volume,setVolume]=useState(15);
  useEffect(()=>{
    if(!enabled||style==='off')return;
    let ctx:AudioContext;let tick=0;
    try{ctx=new window.AudioContext();}catch{return;}
    const progressions={synth:[196,247,294,220,196,262,330,247],keys:[261.6,329.6,392,329.6,293.7,349.2,440,349.2],downtempo:[164.8,196,246.9,196,146.8,185,220,185]};
    const notes=progressions[style];
    const play=()=>{if(ctx.state==='suspended')void ctx.resume();const start=ctx.currentTime;
      const o=ctx.createOscillator();const gain=ctx.createGain();
      o.type=style==='synth'?'sawtooth':style==='keys'?'sine':'triangle';
      o.frequency.setValueAtTime(notes[tick%notes.length],start);
      gain.gain.setValueAtTime(0.00001,start);gain.gain.exponentialRampToValueAtTime(Math.max(0.00001,volume/100*0.11),start+0.03);
      gain.gain.exponentialRampToValueAtTime(0.00001,start+(style==='synth'?1.2:0.55));
      o.connect(gain);gain.connect(ctx.destination);o.start(start);o.stop(start+(style==='synth'?1.25:0.6));tick++;
    };
    play();const timer=setInterval(play,style==='synth'?840:style==='keys'?470:630);
    return ()=>{clearInterval(timer);void ctx.close();};
  },[enabled,style,volume]);
  if(style==='off')return null;
  return <div className="sound-control"><button className="button tiny-button muted-button" onClick={()=>setEnabled(!enabled)} title="Play or mute original soundscape">
    {enabled?<Volume2 size={16}/>:<VolumeX size={16}/>} {enabled?'Music on':'Music off'}</button>
    {enabled&&<input aria-label="Music volume" type="range" min={0} max={50} value={volume} onChange={e=>setVolume(Number(e.target.value))}/>}</div>;
}

export default function RoomPage() {
  const params=useParams<{code:string}>();const router=useRouter();const code=String(params.code||'').toUpperCase();
  const [token,setToken]=useState('');const [ready,setReady]=useState(false);
  const [view,setView]=useState<GameView|null>(null);const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');const [joinName,setJoinName]=useState('');const [joinAge,setJoinAge]=useState('');
  const [settingsOpen,setSettingsOpen]=useState(false);const [showLog,setShowLog]=useState(false);
  const [wager,setWager]=useState('0');const [now,setNow]=useState(Date.now());const latestRevision=useRef(-1);
  useEffect(()=>{setToken(getToken(code));setReady(true);},[code]);
  const refresh=useCallback(async()=>{
    if(!ready)return;
    try{const res=await fetch(`/api/rooms/${code}`,{headers:token?{Authorization:`Bearer ${token}`}:{},cache:'no-store'});
      const data=await res.json();if(!res.ok)throw new Error(data.error||'Could not load game.');
      if(data.revision>=latestRevision.current){latestRevision.current=data.revision;setView(data);}
      setError(prev=>prev.startsWith('Could not load')?'':prev);
    }catch(e){setError(e instanceof Error?e.message:'Could not load game.');}
  },[code,ready,token]);
  useEffect(()=>{if(!ready)return;void refresh();const timer=setInterval(()=>void refresh(),1600);return()=>clearInterval(timer);},[refresh,ready]);
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(timer);},[]);
  const action=useCallback(async(a:Action)=>{
    setBusy(true);setError('');
    try{const res=await fetch(`/api/rooms/${code}/action`,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(a)});
      const data=await res.json();if(!res.ok)throw new Error(data.error||'Could not update game.');
      latestRevision.current=Math.max(latestRevision.current,data.revision);setView(data);
    }catch(e){setError(e instanceof Error?e.message:'Could not update game.');void refresh();}
    finally{setBusy(false);}
  },[code,token,refresh]);
  async function join(){setBusy(true);setError('');
    try{const res=await fetch(`/api/rooms/${code}/join`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:joinName,age:Number(joinAge)})});
      const data=await res.json();if(!res.ok)throw new Error(data.error||'Could not join room.');
      localStorage.setItem(`knowshow:${code}`,data.token);setToken(data.token);latestRevision.current=data.view.revision;setView(data.view);
    }catch(e){setError(e instanceof Error?e.message:'Could not join room.');}
    finally{setBusy(false);}
  }
  const role=view?.role.kind||'spectator', isHost=role==='host',isPlayer=role==='player';
  const myId=view?.role.id;
  const players=view?.players||[];
  const myPlayer=players.find(p=>p.id===myId);
  const sorted=useMemo(()=>[...players].sort((a,b)=>b.score-a.score),[players]);
  const isChooser=isHost||(isPlayer&&view?.chooserId===myId);
  const canPickDraft=isHost||(isPlayer&&view?.draftTurnId===myId);
  const canBuzz=Boolean(view?.phase==='clue'&&view.clue?.status==='buzzing'&&myPlayer&&!view.clue.attempts.some(a=>a.playerId===myId)
    &&(!view.clue.meEligibleAt||now>=view.clue.meEligibleAt)
    &&(!view.settings.buzzSeconds||now<=view.clue.buzzOpenedAt+view.settings.buzzSeconds*1000));
  const finalMax=Math.max(0,myPlayer?.score||0);
  const stageLabel=view?.phase==='finished'?'The Curtain Call':view?.phase?.startsWith('final')?'The Final Word':view?.phase==='draft'?'Category Draft':view?.phase==='lobby'?'Green Room':view?.roundNames[view.round];
  if(!ready||(!view&&!error))return <main className="room-shell loading-screen"><div className="spinning-star">✳</div><p>Getting the stage ready…</p></main>;
  if(!view)return <main className="room-shell loading-screen"><h1>Could not open the room</h1><p>{error}</p><Link href="/" className="button button-accent">Back to home</Link></main>;
  return <main className="room-shell">
    <header className="room-header"><Link className="brand-mini" href="/"><span className="logo-mark">K<span>✳</span></span> THE KNOW SHOW</Link>
      <div className="room-head-right"><div className="room-code-label">ROOM <b>{code}</b> <button aria-label="Copy room link" className="copy-button" onClick={()=>void navigator.clipboard?.writeText(window.location.href)}><Clipboard size={16}/></button></div><div className="role-pill">{isHost?'HOST':isPlayer?(view.settings.mode==='teams'?'TEAM':'PLAYER'):'VIEWER'}</div></div>
    </header>
    <div className="stage-ribbon"><div><span className="eyebrow">YOU’RE WATCHING</span><h1>{stageLabel}</h1></div><Soundscape style={view.settings.music}/></div>
    {error&&<div role="alert" className="error-message with-x">{error}<button aria-label="Dismiss error" onClick={()=>setError('')}><X size={17}/></button></div>}
    {role==='spectator'&&view.phase==='lobby'&&<section className="join-card card">
      <div className="eyebrow">STEP INTO THE SPOTLIGHT</div><h2>Join the show</h2>
      <p>The host can put the game on a TV. Each contestant joins on a phone or tablet.</p>
      <form className="join-form" onSubmit={e=>{e.preventDefault();void join();}}><label>Your {view.settings.mode==='teams'?'team name':'player name'}<input required className="input" minLength={2} maxLength={28} placeholder={view.settings.mode==='teams'?'The Brainiacs':'Your name'} value={joinName} onChange={e=>setJoinName(e.target.value)}/></label>
        <label>{view.settings.mode==='teams'?'Youngest teammate’s age':'Your age'}<input className="input" type="number" required min={3} max={110} placeholder="e.g. 12" value={joinAge} onChange={e=>setJoinAge(e.target.value)}/></label>
        <button type="submit" className="button button-accent" disabled={busy}>{busy?'Joining…':'Join the show'} <ArrowRight size={18}/></button>
      </form><p className="small-note">We ask only for age, not date of birth, to set optional family-friendly advantages.</p>
    </section>}
    {role==='spectator'&&view.phase!=='lobby'&&<div className="notice-bar"><Eye size={17}/> You’re watching in spectator mode. Joining closes when the game begins.</div>}
    <Scoreboard players={sorted} myId={myId} mode={view.settings.mode} />
    {view.announcement&&<div className="announcement"><Sparkles size={17}/>{view.announcement}</div>}
    {view.phase==='lobby'&&<section className="lobby-layout">
      <div className="card main-card"><span className="eyebrow">BEFORE THE LIGHTS GO UP</span><h2>The green room</h2>
        <p>Invite everyone to join using room code <strong>{code}</strong>. Then the category draft begins. Each player picks a category in turn until both boards are ready.</p>
        <div className="stat-strip"><div><strong>{players.length}/{8}</strong><span>SEATS FILLED</span></div><div><strong>{view.settings.normalHints}+{view.settings.youngestBonusHints}</strong><span>HINTS + YOUNGEST BONUS</span></div><div><strong>{view.settings.ageHeadStart?`${view.settings.headStartSeconds}s`:'Off'}</strong><span>YOUNGEST HEAD START</span></div></div>
        {isHost?<><button className="button button-outline" onClick={()=>setSettingsOpen(!settingsOpen)}><Settings2 size={17}/>{settingsOpen?'Hide':'Change'} settings</button>
          {settingsOpen&&<SettingsPanel settings={view.settings} update={patch=>void action({type:'settings',settings:patch})} disabled={busy}/>}
          <button className="button button-accent big-action" disabled={busy||players.length<2} onClick={()=>void action({type:'start-draft'})}><Play size={19}/> Start the category draft <ChevronRight size={18}/></button>
          {players.length<2&&<p className="small-note">At least two players or teams are needed.</p>}</>
          :isPlayer?<p className="ready-message"><Check size={20}/> You’re in! The host starts when everyone is ready.</p>:null}
      </div><aside className="card side-card"><h3>Tonight’s format</h3><div className="format-item"><span>01</span><div><b>The Opening Act</b><p>Six categories, five clues each.</p></div></div><div className="format-item"><span>02</span><div><b>The Main Event</b><p>Higher point values. More pressure.</p></div></div><div className="format-item"><span>03</span><div><b>The Final Word</b><p>A private wager and one last answer.</p></div></div><div className="format-item"><span>✳</span><div><b>Double Take</b><p>One secret clue per board pays double.</p></div></div></aside>
    </section>}
    {view.phase==='draft'&&<section className="draft-page">
      <div className="section-heading"><div><span className="eyebrow">12 CATEGORIES · TWO BOARDS</span><h2>{view.draftTurnName}’s pick</h2><p>{canPickDraft?'Choose a category below. Each one includes a quick explanation.':'Waiting for the current picker.'}</p></div><span className="draft-progress">{view.draftIndex} / 12 selected</span></div>
      <div className="draft-boards"><DraftSummary title="The Opening Act" ids={view.selected[0]} categories={view.categories}/><DraftSummary title="The Main Event" ids={view.selected[1]} categories={view.categories}/></div>
      <div className="draft-options">{view.categories.filter(c=>![...view.selected[0],...view.selected[1]].includes(c.id)).map(c=><button key={c.id} className="category-choice" disabled={!canPickDraft||busy} onClick={()=>void action({type:'draft-category',categoryId:c.id})}><strong>{c.name}</strong><small>{c.explainer}</small>{canPickDraft&&<span className="pick-symbol">+</span>}</button>)}</div>
    </section>}
    {view.phase==='board'&&<section className="board-page">
      <div className="board-top"><div><span className="eyebrow">ROUND {view.round+1} OF 2</span><h2>{view.roundNames[view.round]}</h2><p>{players.find(p=>p.id===view.chooserId)?.name||'The host'} chooses the next clue. Hidden somewhere: <b>Double Take</b>.</p></div>
        {isHost&&<button className="button button-accent" disabled={busy} onClick={()=>void action(view.round===0?{type:'advance-round'}:{type:'start-final'})}><SkipForward size={18}/>{view.round===0?'Move to The Main Event':'Go to The Final Word'}</button>}</div>
      {view.lastResolution&&<div className="last-answer"><span className="small-cap">LAST CLUE</span><strong>{view.lastResolution.answer}</strong><span>{view.lastResolution.outcome==='correct'?'Correct answer awarded':'Clue passed'} · {view.lastResolution.wasDoubleTake?'Double Take · ':''}{view.lastResolution.points.toLocaleString()} points</span></div>}
      <div className="board-grid">{view.selected[view.round].map(id=>{const cat=view.categories.find(c=>c.id===id)!;return <div className="board-col" key={id}><div className="board-category" title={cat.explainer}><strong>{cat.name}</strong><small>{cat.explainer}</small></div>{view.roundValues[view.round].map((value,index)=>{
        const key=`${id}:${index}`,used=view.usedKeys.includes(key);
        return <button key={key} className={`tile ${used?'tile-used':''}`} disabled={used||!isChooser||busy} onClick={()=>void action({type:'open-clue',key})}>{used?'—':value.toLocaleString()}</button>;
      })}</div>;})}</div>
      <p className="board-footnote">{isChooser?'Select any available point value to reveal a question.':'Only the current chooser and host can open a clue.'}</p>
    </section>}
    {view.phase==='clue'&&view.clue&&<section className="clue-page"><div className="clue-category-row"><div><span className="eyebrow">{view.clue.category}</span><p>{view.clue.explainer}</p></div><span className="clue-points">{view.clue.points.toLocaleString()} PTS</span></div>
      {view.clue.wasDoubleTake&&<div className="double-banner"><Sparkles size={18}/> DOUBLE TAKE! THIS CLUE IS WORTH TWICE ITS NORMAL VALUE.</div>}
      <div className="clue-stage"><div className="clue-question">{view.clue.prompt}</div></div>
      <div className="clue-bottom"><div className="clue-status">
        {view.clue.status==='buzzing'?<><b><Clock3 size={18}/> Buzzers open</b><span>Time: <Countdown end={view.settings.buzzSeconds?view.clue.buzzOpenedAt+view.settings.buzzSeconds*1000:undefined} now={now}/></span></>:
          <><b><Mic size={19}/> {players.find(p=>p.id===view.clue!.buzzedBy)?.name} has the mic</b><span>Answer time: <Countdown end={view.clue.responseDeadlineAt} now={now}/></span></>}
      </div>
      {view.clue.status==='buzzing'&&isPlayer&&<div className="contestant-controls"><button className="buzzer" disabled={!canBuzz||busy} onClick={()=>void action({type:'buzz'})}><span>BUZZ!</span></button>
        {view.clue.attempts.some(a=>a.playerId===myId)?<p>You have already tried this clue.</p>:view.clue.meEligibleAt&&now<view.clue.meEligibleAt?<p>Youngest-player head start: <Countdown end={view.clue.meEligibleAt} now={now}/></p>:!canBuzz?<p>The buzzing window has closed.</p>:<p>Tap as soon as you know it!</p>}
      </div>}
      {view.clue.status==='answering'&&isPlayer&&view.clue.buzzedBy===myId&&<div className="answer-area"><h3>Your answer</h3><AnswerBox key={view.clue.key} onSubmit={answer=>void action({type:'submit-answer',answer})} disabled={busy}/>
        <button className="button button-outline" disabled={busy||!view.myHints||!!view.clue.meHint} onClick={()=>void action({type:'hint'})}><Lightbulb size={17}/> Use a hint ({view.myHints} left)</button>
        {view.clue.meHint&&<p className="private-hint"><Lightbulb size={18}/>{view.clue.meHint}</p>}
      </div>}
      {view.clue.status==='ruling'&&isPlayer&&view.clue.buzzedBy===myId&&<div className="notice-bar"><LockKeyhole size={18}/> Your answer: <strong>{view.clue.submittedAnswer}</strong> · Awaiting the host’s decision</div>}
      {!isHost&&(!isPlayer||view.clue.buzzedBy!==myId)&&view.clue.status!=='buzzing'&&<p className="waiting-message">The contestant is answering. Get ready in case you can steal!</p>}
      {isHost&&<div className="host-clue-controls"><div className="host-controls-heading"><b>Host controls</b><span>{view.clue.status==='ruling'?'Review the contestant’s response.':'Run the clue from this screen.'}</span></div>
        {view.clue.status==='ruling'&&<div className="ruling-card"><div><small>SUBMITTED ANSWER</small><h3>{view.clue.submittedAnswer}</h3><p>Automatic comparison: <strong>{view.clue.suggested}</strong> (suggestion only)</p></div><div className="ruling-actions"><button className="button button-success" disabled={busy} onClick={()=>void action({type:'rule',verdict:'correct'})}><Check size={19}/> Correct</button><button className="button button-danger" disabled={busy} onClick={()=>void action({type:'rule',verdict:'wrong'})}><X size={19}/> Incorrect</button></div></div>}
        {view.clue.status==='answering'&&<button className="button button-outline" disabled={busy} onClick={()=>void action({type:'rule',verdict:'timed-out'})}><Clock3 size={17}/> Time expired / no answer</button>}
        <div className="sub-actions"><button className="button tiny-button muted-button" disabled={busy} onClick={()=>void action({type:'reveal-answer'})}><Eye size={17}/> Reveal answer</button><button className="button tiny-button muted-button" disabled={busy} onClick={()=>void action({type:'close-clue'})}><SkipForward size={17}/> Pass / close clue</button></div>
        <div className="host-solution"><small>CORRECT ANSWER — HOST ONLY UNTIL REVEALED</small><strong>{view.clue.answer}</strong>{view.clue.meHint&&<span>Hint: {view.clue.meHint}</span>}</div></div>}
      {!isHost&&view.clue.answer&&<div className="revealed-answer"><b>Correct answer:</b> {view.clue.answer}</div>}
      {view.clue.attempts.length>0&&<p className="attempts-note">Already tried: {view.clue.attempts.map(a=>players.find(p=>p.id===a.playerId)?.name).join(', ')}</p>}
      </div>
    </section>}
    {view.phase==='final-wager'&&view.final&&<section className="final-page"><span className="eyebrow">ONE QUESTION · ONE BIG DECISION</span><h2>The Final Word</h2><div className="final-category">Category: <strong>{view.final.category}</strong></div>
      {isPlayer&&<div className="card wager-card"><h3>Place your wager</h3><p>You can wager any whole number of points from 0 to <strong>{formatScore(finalMax)}</strong>. Your wager stays private until the finale.</p><form onSubmit={e=>{e.preventDefault();void action({type:'wager',amount:Number(wager)});}}>
        <input className="input" type="number" min={0} max={finalMax} step={1} value={view.final.myWager!==undefined?view.final.myWager:wager} onChange={e=>setWager(e.target.value)} disabled={view.final.myWager!==undefined}/>
        {view.final.myWager===undefined?<button className="button button-accent" disabled={busy||!Number.isInteger(Number(wager))||Number(wager)<0||Number(wager)>finalMax}>Lock wager</button>:<p className="ready-message"><Check size={18}/> Wager locked: {formatScore(view.final.myWager)}</p>}
      </form></div>}
      {isHost&&<div className="card center-card"><p><strong>{view.final.wagerCount}</strong> of <strong>{players.length}</strong> wagers submitted.</p><p>Players who have not wagered will default to 0 when you reveal the clue.</p><button className="button button-accent" disabled={busy} onClick={()=>void action({type:'open-final'})}>Reveal the final question <ArrowRight size={18}/></button></div>}
      {!isHost&&!isPlayer&&<p className="waiting-message">Waiting for private wagers…</p>}
    </section>}
    {view.phase==='final-answer'&&view.final&&<section className="final-page"><span className="eyebrow">THE FINAL WORD · {view.final.category}</span><div className="clue-stage final-stage"><div className="clue-question">{view.final.prompt}</div></div>
      <div className="final-timer"><Clock3 size={18}/> Time remaining: <Countdown end={view.settings.finalSeconds&&view.final.startedAt?view.final.startedAt+view.settings.finalSeconds*1000:undefined} now={now}/></div>
      {isPlayer&&<div className="answer-area"><h3>Lock your final answer</h3>{view.final.myAnswer!==undefined?<p className="ready-message"><Check size={18}/> Your final answer is locked: {view.final.myAnswer}</p>:<AnswerBox key="final" onSubmit={answer=>void action({type:'final-answer',answer})} disabled={busy}/>}</div>}
      {isHost&&<div className="card center-card"><p><strong>{view.final.answerCount}</strong> of <strong>{players.length}</strong> answers received.</p><button className="button button-accent" disabled={busy} onClick={()=>void action({type:'review-final'})}>Review final answers <ArrowRight size={18}/></button></div>}
    </section>}
    {view.phase==='final-review'&&view.final&&<section className="final-page"><span className="eyebrow">THE FINAL WORD</span><h2>Time to reveal the answers</h2>
      {isHost?<><div className="final-answer-key card"><small>ANSWER KEY</small><h3>{view.final.answer}</h3></div><div className="judgment-grid">{view.final.review?.map(p=><div key={p.id} className="judgment-card"><div className="judgment-head"><h3>{p.name}</h3><span>Wager: {formatScore(p.wager||0)}</span></div><p className="judgment-answer">{p.answer}</p><small>Automatic comparison: {p.suggested}</small><div className="ruling-actions"><button className={`button ${p.judged===true?'button-success':'button-outline'}`} disabled={busy} onClick={()=>void action({type:'judge-final',playerId:p.id,correct:true})}><Check size={17}/> Correct</button><button className={`button ${p.judged===false?'button-danger':'button-outline'}`} disabled={busy} onClick={()=>void action({type:'judge-final',playerId:p.id,correct:false})}><X size={17}/> Incorrect</button></div></div>)}</div>
        <button className="button button-accent big-action" disabled={busy||view.final.review?.some(p=>p.judged===undefined)} onClick={()=>void action({type:'finish'})}><Award size={20}/> Show final results</button></>:<div className="card center-card"><p>The host is reviewing answers. The results will be up shortly!</p></div>}
    </section>}
    {view.phase==='finished'&&<section className="results-page"><div className="confetti">✳ ✦ ✳</div><span className="eyebrow">THAT’S A WRAP!</span><h2>The curtain call</h2>
      <div className="winner-plate"><Award size={39}/><div><small>{sorted.length>1&&sorted[0].score===sorted[1].score?'IT’S A TIE':'TONIGHT’S CHAMPION'}</small><h3>{sorted.filter(p=>p.score===sorted[0]?.score).map(p=>p.name).join(' & ')}</h3><p>{formatScore(sorted[0]?.score||0)} points</p></div></div>
      <div className="results-list">{sorted.map((p,i)=><div key={p.id} className="result-item"><span>#{i+1}</span><strong>{p.name}</strong><b>{formatScore(p.score)}</b></div>)}</div>
      {view.final?.answer&&<p className="final-reveal">The Final Word: <strong>{view.final.answer}</strong></p>}
      {isHost&&<button className="button button-accent big-action" disabled={busy} onClick={()=>void action({type:'new-game'})}><RotateCcw size={18}/> Play another show</button>}
    </section>}
    <footer className="room-footer"><button className="text-button" onClick={()=>setShowLog(!showLog)}><HelpCircle size={16}/> {showLog?'Hide':'Show'} activity log</button><Link href="/guide">How to play</Link><span>The Know Show · Your trivia night, your rules.</span></footer>
    {showLog&&<div className="log-panel">{view.eventLog.map((msg,i)=><p key={`${msg}-${i}`}>{msg}</p>)}</div>}
  </main>;
}

function Scoreboard({players,myId,mode}:{players:GameView['players'];myId?:string;mode:Settings['mode']}) {
  if(players.length===0)return <div className="no-players"><Users size={19}/> No {mode==='teams'?'teams':'players'} have joined yet.</div>;
  return <div className="scoreboard">{players.map((p,i)=><div className={`player-chip ${p.id===myId?'my-chip':''}`} key={p.id}>
    <span className="player-rank">{i+1}</span><div className="player-details"><strong>{p.name}</strong><small>Age {p.age} · {p.hintsRemaining} hints</small></div><b className="player-score">{formatScore(p.score)}</b>
  </div>)}</div>;
}
function DraftSummary({title,ids,categories}:{title:string;ids:string[];categories:GameView['categories']}) {
  return <div className="draft-summary card"><span className="small-cap">{title}</span><h3>{ids.length}/6 picked</h3><div className="draft-chips">{ids.map(id=><span key={id}>{categories.find(c=>c.id===id)?.name}</span>)}{ids.length===0&&<small>No categories picked yet</small>}</div></div>;
}
function SettingsPanel({settings,update,disabled}:{settings:Settings;update:(patch:Partial<Settings>)=>void;disabled:boolean}) {
  return <section className="settings-panel" aria-label="Game settings"><h3>Show settings</h3>
    <div className="settings-grid">
      <label>Play mode<select disabled={disabled} className="input" value={settings.mode} onChange={e=>update({mode:e.target.value as Settings['mode']})}><option value="individual">Individual players</option><option value="teams">Teams (one device per team)</option></select></label>
      <label>Age-based head start<select disabled={disabled} className="input" value={settings.ageHeadStart?'yes':'no'} onChange={e=>update({ageHeadStart:e.target.value==='yes'})}><option value="yes">On</option><option value="no">Off</option></select></label>
      <NumberSetting label="Head start (seconds)" value={settings.headStartSeconds} min={0} max={15} disabled={disabled} onChange={v=>update({headStartSeconds:v})}/>
      <NumberSetting label="Buzz window (0 = untimed)" value={settings.buzzSeconds} min={0} max={120} disabled={disabled} onChange={v=>update({buzzSeconds:v})}/>
      <NumberSetting label="Answer time (0 = untimed)" value={settings.answerSeconds} min={0} max={180} disabled={disabled} onChange={v=>update({answerSeconds:v})}/>
      <NumberSetting label="Final Word time (0 = untimed)" value={settings.finalSeconds} min={0} max={300} disabled={disabled} onChange={v=>update({finalSeconds:v})}/>
      <NumberSetting label="Hints per player" value={settings.normalHints} min={0} max={10} disabled={disabled} onChange={v=>update({normalHints:v})}/>
      <NumberSetting label="Extra hints for youngest" value={settings.youngestBonusHints} min={0} max={10} disabled={disabled} onChange={v=>update({youngestBonusHints:v})}/>
      <label>Soundtrack (off by default)<select className="input" disabled={disabled} value={settings.music} onChange={e=>update({music:e.target.value as Settings['music']})}><option value="off">Off</option><option value="synth">Original retro synth</option><option value="keys">Original classical-style keys</option><option value="downtempo">Original indie downtempo</option></select></label>
    </div><p className="small-note">Hints are private, one per answered clue. The youngest player (or the youngest teammate on each team) gets the extra hints and optional head start. Settings lock when the draft starts.</p>
  </section>;
}
function NumberSetting({label,value,min,max,disabled,onChange}:{label:string;value:number;min:number;max:number;disabled:boolean;onChange:(v:number)=>void}) {
  // Number settings are committed on blur to avoid server updates on partial numbers.
  const [draft,setDraft]=useState(String(value));
  useEffect(()=>setDraft(String(value)),[value]);
  return <label>{label}<input className="input" type="number" value={draft} min={min} max={max} disabled={disabled} onChange={e=>setDraft(e.target.value)} onBlur={()=>{
    const next=Number(draft);if(draft.trim()!==''&&Number.isInteger(next)&&next>=min&&next<=max&&next!==value)onChange(next);else setDraft(String(value));
  }}/></label>;
}
