import { NextResponse } from 'next/server';
import { db, newRoomCode, newToken, tokenHash } from '@/lib/db';
import { makeGame, makeView } from '@/lib/game';
import { jsonError, noStore } from '@/lib/http';
export const runtime='nodejs';

export async function POST(request:Request) {
  try {
    const body=await request.json().catch(()=>({}));
    const required=process.env.ROOM_CREATION_PASSCODE;
    if(required && body?.passcode!==required) return jsonError('Room creation passcode is incorrect.',403);
    for(let attempt=0;attempt<8;attempt++) {
      const code=newRoomCode();const hostToken=newToken();const state=makeGame(Array.isArray(body?.recentQuestionIds)?body.recentQuestionIds:[]);
      const {error}=await db().from('know_show_rooms').insert({code,host_token_hash:tokenHash(hostToken),snapshot:state});
      if(!error) return NextResponse.json({code,token:hostToken,view:makeView(state,{kind:'host'},0)}, {headers:noStore});
      if(error.code!=='23505')throw error;
    }
    return jsonError('Could not create a unique room. Please retry.',503);
  } catch(e) {console.error('Create room:',e);return jsonError('Room creation failed. Check the server’s Supabase configuration.',500);}
}
