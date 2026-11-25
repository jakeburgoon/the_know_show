import { NextResponse } from 'next/server';
import { db,getRoom,newToken,tokenHash,updateRoom } from '@/lib/db';
import { GameError,joinGame,makeView, type GameState } from '@/lib/game';
import {deviceHistoryKey} from '@/lib/exposure';
import { jsonError,noStore } from '@/lib/http';
export const runtime='nodejs';

export async function POST(request:Request,{params}:{params:Promise<{code:string}>}) {
  const {code:raw}=await params;const code=raw.toUpperCase();
  if(!/^[A-HJ-NP-Z2-9]{6}$/.test(code))return jsonError('Invalid room code.');
  let body:{name?:unknown;rememberDeviceId?:unknown;choiceAccess?:unknown};
  try {body=await request.json();}catch{return jsonError('Invalid join request.');}
  for(let attempt=0;attempt<10;attempt++) {
    try {
      const row=await getRoom(code);if(!row)return jsonError('Room not found.',404);
      const {state,player}=joinGame(row.snapshot as GameState,String(body.name??''),undefined,Date.now(),body.choiceAccess);
      if(typeof body.rememberDeviceId==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.rememberDeviceId)){(state.guestHistoryKeys??={})[player.id]=deviceHistoryKey(body.rememberDeviceId);}
      const token=newToken();
      const {error:memberError}=await db().from('know_show_members').insert({id:player.id,room_code:code,token_hash:tokenHash(token)});
      if(memberError)throw memberError;
      let success=false;
      try {success=await updateRoom(row,state);}finally {
        if(!success)await db().from('know_show_members').delete().eq('id',player.id);
      }
      if(success) return NextResponse.json({token,view:makeView(state,{kind:'player',id:player.id},row.revision+1)}, {headers:noStore});
    } catch(e) {
      if(e instanceof GameError)return jsonError(e.message,409);
      console.error('Join room:',e);return jsonError('Could not join game.',500);
    }
  }
  return jsonError('Room is busy. Please try joining again.',409);
}
