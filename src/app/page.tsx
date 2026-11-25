'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Clapperboard, Copy, HelpCircle, PenLine, Sparkles, Ticket, Users, UsersRound } from 'lucide-react';
import QRJoinScanner from '@/components/QRJoinScanner';

export default function Home() {
  const router=useRouter();
  const [code,setCode]=useState('');
  const [passcode,setPasscode]=useState('');
  const [needsPasscode,setNeedsPasscode]=useState(false);
  const [hostError,setHostError]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function createRoom(){
    if(busy)return;
    setBusy(true);setHostError('');
    try{
      // Store one anonymous host profile for all shows started in this browser.
      // The server can restore its game history even if a local question list is stale.
      let hostHistoryId=localStorage.getItem('knowshow:hostHistoryId')||'';
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(hostHistoryId)){
        hostHistoryId=crypto.randomUUID();localStorage.setItem('knowshow:hostHistoryId',hostHistoryId);
      }
      const response=await fetch('/api/rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({passcode,hostHistoryId,recentQuestionIds:JSON.parse(localStorage.getItem('knowshow:recentQuestionIds')||'[]'),recentCategoryIds:JSON.parse(localStorage.getItem('knowshow:recentCategoryIds')||'[]'),recentCategoryOffers:JSON.parse(localStorage.getItem('knowshow:recentCategoryOffers')||'[]')})});
      const data=await response.json();
      if(response.status===403){
        setNeedsPasscode(true);setHostError(needsPasscode?'Incorrect hosting passcode. Please try again.':'This installation requires a hosting passcode.');setBusy(false);return;
      }
      if(!response.ok)throw new Error(data.error||'Could not create room.');
      localStorage.setItem(`knowshow:${data.code}:host`,data.token);
      router.push(`/room/${data.code}`);
    }catch(e){setHostError(e instanceof Error?e.message:'Could not create room.');setBusy(false);}
  }
  function goToRoom(){
    const normalized=code.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g,'').slice(0,6);
    if(normalized.length!==6){setError('Enter the six-character room code.');return;}
    router.push(`/room/${normalized}`);
  }
  return <main className="v11landing">
    <header className="v11landingbar">
      <Link href="/guide" className="v11howlink"><HelpCircle size={17} aria-hidden="true"/> How to play</Link>
    </header>
    <section className="v11showcase" aria-labelledby="v11heroheading">
      <div className="v11beam v11beamleft" aria-hidden="true"/><div className="v11beam v11beamright" aria-hidden="true"/>
      <p className="v11overline"><span className="v11glowdot"/> YOUR LIVING ROOM. YOUR GAME SHOW.</p>
      <img className="v11hero-logo" src="/know-show-logo.png" alt="The Know Show"/>
      <h1 id="v11heroheading">It’s time to <em className="v11headline-show">SHOW</em> what you <strong className="v11headline-know">KNOW</strong>.</h1>
      <p className="v11herodeck">Over 70 categories. More than 1,000 questions. A different show every time.</p>
    </section>
    <section className="v11entryzone" aria-labelledby="v11startheading">
      <div className="v11entryheading"><h2 id="v11startheading">Ready to play?</h2></div>
      <div className="v11entrygrid">
        <section className="v11entrycard v11createcard" aria-labelledby="v11createheading"><div className="v11cardtop"><div className="v11cardicon"><Clapperboard size={21}/></div><h3 id="v11createheading">Host a show</h3></div>
          <p>Make three quick choices, invite players, and start the show.</p>
          <form className="ks-host-entry" onSubmit={e=>{e.preventDefault();void createRoom();}}>
            {needsPasscode&&<div className="ks-host-passcode"><label htmlFor="passcode" className="v11fieldlabel">Hosting passcode</label>
              <input id="passcode" className="v11field" type="password" value={passcode} onChange={e=>setPasscode(e.target.value)} autoComplete="off" required autoFocus/></div>}
            {hostError&&<div role="alert" className="v11entryerror">{hostError}</div>}
            <button type="submit" className="v11action v11actiongold" disabled={busy}>{busy?'Creating your room…':'Host a show'}<ArrowRight size={19}/></button>
          </form>
        </section>
        <section className="v11entrycard v11joincard" aria-labelledby="v11joinheading"><div className="v11cardtop"><div className="v11cardicon"><Ticket size={21}/></div><h3 id="v11joinheading">Join a show</h3></div><p>Scan the host’s QR code or enter your room code.</p>
          <QRJoinScanner onJoin={joinCode=>router.push(`/room/${joinCode}`)}/><div className="ks-manual-join"><label htmlFor="room-code" className="v11fieldlabel">Or enter a six-character room code</label>
          <input id="room-code" className="v11field v11codefield" autoCapitalize="characters" value={code} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g,'').slice(0,6))} onKeyDown={e=>{if(e.key==='Enter')goToRoom();}} placeholder="ABC234" maxLength={6}/>
          {error&&<div role="alert" className="v11entryerror">{error}</div>}
          <button type="button" className="v11action v11actionnavy" onClick={goToRoom}>Join with code <ArrowRight size={19}/></button></div>
        </section>
      </div>
    </section>
    <div className="v11featureline ks-entry-features" aria-label="How the game works"><span><Users size={17}/> 2–8 players</span><span><PenLine size={17}/> Answer your way</span><span><UsersRound size={17}/> Individuals or teams</span></div>
    <section className="v11showstrip" aria-label="Game highlights"><div><Sparkles size={20}/><strong>Choose from over 70 categories</strong><span>Over 1,000 regular and seasonal questions.</span></div><div><Check size={20}/><strong>Take on 25 questions</strong><span>Two rounds of 12, plus one final question.</span></div><div><Copy size={20}/><strong>Make it yours</strong><span>Use hints and try to double your points.</span></div></section>
    <footer className="v11landingfooter"><span>ROUND 1 · ROUND 2 · THE FINAL WORD</span><span>The Know Show v1.13.7</span></footer>
  </main>;
}
