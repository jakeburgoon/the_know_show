import { NextResponse } from 'next/server';
import { getRole,getRoom,updateRoom } from '@/lib/db';
import { GameError,tick,type GameState } from '@/lib/game';
import {makeFeedbackView} from '@/lib/feedback-server';
import { jsonError,noStore } from '@/lib/http';
export const runtime='nodejs';
export async function GET(request:Request,{params}:{params:Promise<{code:string}>}) {
  try {
    const {code:raw}=await params;const code=raw.toUpperCase();
    if(!/^[A-HJ-NP-Z2-9]{6}$/.test(code))return jsonError('Invalid room code.');
    let row=await getRoom(code);
    if(!row)return jsonError('No game found with that room code.',404);
    const updated=tick(row.snapshot as GameState);
    if(JSON.stringify(updated)!==JSON.stringify(row.snapshot)){
      if(await updateRoom(row,updated))row={...row,snapshot:updated,revision:row.revision+1};
      else {const fresh=await getRoom(code);if(fresh)row=fresh;}
    }
    const actor=await getRole(row,request);
    return NextResponse.json(makeFeedbackView(row.snapshot as GameState,actor,row.revision,Date.now(),true),{headers:noStore});
  } catch(e) {if(e instanceof GameError)return jsonError(e.message,409);console.error('Get room:',e);return jsonError('Could not load the game.',500);}
}
