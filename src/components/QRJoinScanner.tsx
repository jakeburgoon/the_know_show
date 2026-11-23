'use client';
import {useEffect,useRef,useState} from 'react';
import {Camera,CameraOff,X} from 'lucide-react';
import jsQR from 'jsqr';

/** Decode only Know Show room codes /room/XXXXXX; never navigate to an arbitrary QR URL. */
export function roomCodeFromQR(text:string):string|null{
 const raw=text.trim();
 if(/^[A-HJ-NP-Z2-9]{6}$/i.test(raw))return raw.toUpperCase();
 try{
   const url=new URL(raw);
   if(!['https:','http:'].includes(url.protocol))return null;
   const match=url.pathname.match(/^\/room\/([A-HJ-NP-Z2-9]{6})\/?$/i);
   return match?match[1].toUpperCase():null;
 }catch{return null;}
}
export default function QRJoinScanner({onJoin}:{onJoin:(code:string)=>void}){
 const [open,setOpen]=useState(false),[message,setMessage]=useState('');
 const video=useRef<HTMLVideoElement|null>(null);
 const onJoinRef=useRef(onJoin);onJoinRef.current=onJoin;
 useEffect(()=>{
  if(!open)return;
  let cancelled=false,raf=0;let stream:MediaStream|null=null;
  const canvas=document.createElement('canvas');const context=canvas.getContext('2d',{willReadFrequently:true});
  async function start(){
   try{
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera access is unavailable in this browser. You can still enter the room code.');
    stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:960},height:{ideal:720}}});
    if(cancelled){stream.getTracks().forEach(t=>t.stop());return;}
    const camera=video.current;if(!camera)return;
    camera.srcObject=stream;
    await camera.play();
    if(cancelled)return;
    setMessage('Point your camera at The Know Show QR code.');
    let lastScan=0;
    const scan=(stamp:number)=>{
     if(cancelled)return;
     const v=video.current;
     if(v&&context&&v.readyState>=2&&stamp-lastScan>=110){
      lastScan=stamp;const width=Math.min(960,v.videoWidth),height=Math.round(v.videoHeight*(width/v.videoWidth));
      if(width>0&&height>0){
       canvas.width=width;canvas.height=height;
       context.drawImage(v,0,0,width,height);
       const pixels=context.getImageData(0,0,width,height);
       const found=jsQR(pixels.data,width,height,{inversionAttempts:'attemptBoth'});
       if(found){const code=roomCodeFromQR(found.data);if(code){cancelled=true;stream?.getTracks().forEach(t=>t.stop());onJoinRef.current(code);return;}
        setMessage('That is not a Know Show room QR code. Try the one on the host’s screen.');
       }
      }
     }
     raf=requestAnimationFrame(scan);
    };
    raf=requestAnimationFrame(scan);
   }catch(error){if(!cancelled)setMessage(error instanceof Error?error.message:'Unable to access the camera. Use the room code instead.');}
  }
  void start();
  return()=>{cancelled=true;cancelAnimationFrame(raf);stream?.getTracks().forEach(t=>t.stop());if(video.current)video.current.srcObject=null;};
 },[open]);
 return <>
  <button type="button" className="ks-scan-action" onClick={()=>{setMessage('Requesting camera access…');setOpen(true);}}><Camera size={21}/> Scan a QR code</button>
  {open&&<div className="ks-scan-backdrop" role="presentation" onClick={()=>setOpen(false)}>
   <section role="dialog" aria-modal="true" aria-labelledby="ks-scan-heading" className="ks-scan-modal" onClick={e=>e.stopPropagation()}>
    <div className="ks-scan-title"><h2 id="ks-scan-heading"><Camera size={22}/> Scan to join</h2><button type="button" aria-label="Close QR scanner" onClick={()=>setOpen(false)}><X size={23}/></button></div>
    <div className="ks-camera-window"><video ref={video} autoPlay playsInline muted aria-label="Live camera view for scanning a room QR code"/><span className="ks-camera-frame" aria-hidden="true"/></div>
    <p role="status" className="ks-scan-status">{message}</p>
    <button type="button" className="ks-scan-cancel" onClick={()=>setOpen(false)}><CameraOff size={17}/> Enter code instead</button>
   </section>
  </div>}
 </>;
}
