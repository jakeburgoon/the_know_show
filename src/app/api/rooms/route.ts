import { NextResponse } from 'next/server';
import { db, newRoomCode, newToken, tokenHash } from '@/lib/db';
import {mergeHostHistories,type SeenHistory} from '@/lib/host-history';
import { makeGame, makeView } from '@/lib/game';
import { jsonError, noStore } from '@/lib/http';
export const runtime='nodejs';

export async function POST(request:Request) {
  try {
    const body=await request.json().catch(()=>({}));
    const required=process.env.ROOM_CREATION_PASSCODE;
    if(required && body?.passcode!==required) return jsonError('Room creation passcode is incorrect.',403);
    const hostHistoryId=typeof body?.hostHistoryId==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.hostHistoryId)?body.hostHistoryId:undefined;
    // Persist repeat history across independently created rooms, not just rematches.
    // A query by random anonymous host ID reads previous snapshots without migrations.
    let previous:Partial<SeenHistory>[]=[];
    if(hostHistoryId){
      const {data,error}=await db().from('know_show_rooms').select('snapshot')
        .eq('snapshot->>hostHistoryId',hostHistoryId).order('created_at',{ascending:false}).limit(80);
      if(error)console.warn('Host history unavailable; using device backup:',error.message);
      else previous=(data??[]).reverse().map(row=>row.snapshot as Partial<SeenHistory>);
    }
    const histories=mergeHostHistories(previous,{
      recentQuestionIds:Array.isArray(body?.recentQuestionIds)?body.recentQuestionIds:[],
      recentCategoryIds:Array.isArray(body?.recentCategoryIds)?body.recentCategoryIds:[],
      recentCategoryOffers:Array.isArray(body?.recentCategoryOffers)?body.recentCategoryOffers:[],
    });
    for(let attempt=0;attempt<8;attempt++) {
      const code=newRoomCode();const hostToken=newToken();const state=makeGame(histories.recentQuestionIds,histories.recentCategoryIds,histories.recentCategoryOffers,hostHistoryId);
      const {error}=await db().from('know_show_rooms').insert({code,host_token_hash:tokenHash(hostToken),snapshot:state});
      if(!error) return NextResponse.json({code,token:hostToken,view:makeView(state,{kind:'host'},0)}, {headers:noStore});
      if(error.code!=='23505')throw error;
    }
    return jsonError('Could not create a unique room. Please retry.',503);
  } catch(e) {console.error('Create room:',e);return jsonError('Room creation failed. Check the server’s Supabase configuration.',500);}
}
