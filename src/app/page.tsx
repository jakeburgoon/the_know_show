'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, CircleHelp, Clapperboard, Copy, Grid2X2, PenLine, Sparkles, Ticket, Users, UsersRound } from 'lucide-react';
import QRJoinScanner from '@/components/QRJoinScanner';

export default function Home() {
  const router=useRouter();
  const [code,setCode]=useState('');
  const [passcode,setPasscode]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function createRoom(){
    setBusy(true);setError('');
    try{
      const response=await fetch('/api/rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({passcode,recentQuestionIds:JSON.parse(localStorage.getItem('knowshow:recentQuestionIds')||'[]'),recentCategoryIds:JSON.parse(localStorage.getItem('knowshow:recentCategoryIds')||'[]'),recentCategoryOffers:JSON.parse(localStorage.getItem('knowshow:recentCategoryOffers')||'[]')})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not create room.');
      localStorage.setItem(`knowshow:${data.code}:host`,data.token);
      router.push(`/room/${data.code}`);
    }catch(e){setError(e instanceof Error?e.message:'Could not create room.');setBusy(false);}
  }
  function goToRoom(){
    const normalized=code.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g,'').slice(0,6);
    if(normalized.length!==6){setError('Enter the six-character room code.');return;}
    router.push(`/room/${normalized}`);
  }
  return <main className="v11landing">
    <header className="v11landingbar">
      <Link href="/" aria-label="The Know Show home" className="v11landingbrand"><img src="/know-show-logo.png" alt="The Know Show"/></Link>
      <Link href="/guide" className="v11howlink"><CircleHelp size={17}/> How to play</Link>
    </header>
    <section className="v11showcase" aria-labelledby="v11heroheading">
      <div className="v11beam v11beamleft" aria-hidden="true"/><div className="v11beam v11beamright" aria-hidden="true"/>
      <p className="v11overline"><span className="v11glowdot"/> YOUR LIVING ROOM. YOUR GAME SHOW.</p>
      <img className="v11hero-logo" src="/know-show-logo.png" alt="The Know Show"/>
      <h1 id="v11heroheading">It’s time to <em className="v11headline-show">SHOW</em> what you <strong className="v11headline-know">KNOW</strong>.</h1>
      <p className="v11herodeck">Choose your categories, answer your way, and find out who knows the most.</p>
      <div className="v11featureline" aria-label="How the game works"><span><Users size={17}/> 2–8 players</span><span><Grid2X2 size={17}/> 50+ categories</span><span><PenLine size={17}/> Answer your way</span><span><UsersRound size={17}/> Individuals or teams</span></div>
    </section>
    <section className="v11entryzone" aria-labelledby="v11startheading">
      <div className="v11entryheading"><p className="v11sectionkicker">GAME NIGHT STARTS HERE</p><h2 id="v11startheading">Ready to play?</h2><p>Host a new game or join one that’s already getting started.</p></div>
      <div className="v11entrygrid">
        <section className="v11entrycard v11createcard" aria-labelledby="v11createheading"><div className="v11cardtop"><div className="v11cardicon"><Clapperboard size={24}/></div><span className="v11steplabel">01 / HOST</span></div>
          <h3 id="v11createheading">Host a show</h3><p>Answer four quick setup questions, invite your players, and start the show.</p>
          <label htmlFor="passcode" className="v11fieldlabel">Room passcode <span>Optional, if configured</span></label>
          <input id="passcode" className="v11field" type="password" value={passcode} onChange={e=>setPasscode(e.target.value)} autoComplete="off" placeholder="Leave blank if not needed"/>
          <button type="button" className="v11action v11actiongold" disabled={busy} onClick={createRoom}>{busy?'Creating your room…':'Host a show'}<ArrowRight size={19}/></button>
        </section>
        <section className="v11entrycard v11joincard" aria-labelledby="v11joinheading"><div className="v11cardtop"><div className="v11cardicon"><Ticket size={24}/></div><span className="v11steplabel">02 / PLAYER</span></div>
          <h3 id="v11joinheading">Join a show</h3><p>Usually you’ll scan the host’s QR code. Have a code? Join here.</p>
          <QRJoinScanner onJoin={joinCode=>router.push(`/room/${joinCode}`)}/><div className="ks-manual-join"><label htmlFor="room-code" className="v11fieldlabel">Or enter a six-character room code</label>
          <input id="room-code" className="v11field v11codefield" autoCapitalize="characters" value={code} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g,'').slice(0,6))} onKeyDown={e=>{if(e.key==='Enter')goToRoom();}} placeholder="ABC234" maxLength={6}/>
          <button type="button" className="v11action v11actionnavy" onClick={goToRoom}>Join with code <ArrowRight size={19}/></button></div>
        </section>
      </div>
      {error&&<div role="alert" className="v11entryerror">{error}</div>}
    </section>
    <section className="v11showstrip" aria-label="Game highlights"><div><Sparkles size={20}/><strong>Four categories</strong><span>Three questions each</span></div><div><Check size={20}/><strong>Everyone plays</strong><span>One answer at a time</span></div><div><Copy size={20}/><strong>Make it yours</strong><span>Hints & Double Takes</span></div></section>
    <footer className="v11landingfooter"><span>THE OPENING ACT · THE MAIN EVENT · THE FINAL WORD</span><span>The Know Show v1.5.3</span></footer>
  </main>;
}
