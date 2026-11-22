'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Clapperboard, Crown, Mic2, Users } from 'lucide-react';

export default function Home() {
  const router=useRouter();
  const [code,setCode]=useState('');const [passcode,setPasscode]=useState('');
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  async function createRoom(){
    setBusy(true);setError('');
    try{
      const response=await fetch('/api/rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({passcode})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not create room.');
      localStorage.setItem(`knowshow:${data.code}:host`,data.token);
      router.push(`/room/${data.code}`);
    }catch(e){setError(e instanceof Error?e.message:'Could not create room.');setBusy(false);}
  }
  function goToRoom(){const normalized=code.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g,'').slice(0,6);if(normalized.length!==6){setError('Enter the six-character room code.');return;}router.push(`/room/${normalized}`);}
  return <main className="landing">
    <header className="site-header"><div className="brand-mini"><span className="logo-mark">K<span>✳</span></span> THE KNOW SHOW</div><span className="edition">THE AT-HOME TRIVIA SHOW</span></header>
    <section className="hero"><div className="eyebrow"><span className="dot"/> THE STAGE IS YOURS</div>
      <h1>Brains on.<br/><em>Game on.</em></h1>
      <p>A lively, original trivia show for friends and family. Play together in the room, answer from your phone, and see who knows their stuff.</p>
      <div className="hero-highlights"><span><Users size={17}/> 2–8 players or teams</span><span><Mic2 size={17}/> Everyone answers</span><span><Crown size={17}/> Team mode, too</span></div>
    </section>
    <section className="entry-grid" aria-label="Start or join a show">
      <div className="entry-panel host-panel"><div className="panel-icon"><Clapperboard size={25}/></div><h2>Run the show</h2><p>Create a room, choose your settings, and put the game board on the big screen.</p>
        <label className="input-label" htmlFor="passcode">Room-creation passcode <span className="subtle">(only if configured)</span></label>
        <input id="passcode" className="input" type="password" value={passcode} onChange={e=>setPasscode(e.target.value)} autoComplete="off" placeholder="Optional"/>
        <button className="button button-accent full" disabled={busy} onClick={createRoom}>{busy?'Creating…':'Create a show'} <ArrowRight size={18}/></button></div>
      <div className="entry-panel join-panel"><div className="panel-icon"><Users size={25}/></div><h2>Join the fun</h2><p>Get the room code from the host. Pick your player name, enter your age, and get ready.</p>
        <label className="input-label" htmlFor="room-code">Six-character room code</label>
        <input id="room-code" className="input room-code" autoCapitalize="characters" value={code} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g,'').slice(0,6))} onKeyDown={e=>{if(e.key==='Enter')goToRoom();}} placeholder="ABC234" maxLength={6}/>
        <button className="button button-outline full" onClick={goToRoom}>Enter the room <ArrowRight size={18}/></button></div>
    </section>
    {error&&<div role="alert" className="error-message">{error}</div>}
    <footer className="landing-footer">THE OPENING ACT · THE MAIN EVENT · THE FINAL WORD <span>•</span> Double Takes are in your hands <span>•</span> Made for shared screens and phones</footer>
    <div className="bottom-note"><Link href="/guide">How to play</Link></div>
  </main>;
}
