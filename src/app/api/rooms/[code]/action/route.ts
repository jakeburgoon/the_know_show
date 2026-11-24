import { NextResponse } from 'next/server';
import { getRole,getRoom,updateRoom } from '@/lib/db';
import { GameError,mutate,tick, type Action,type GameState } from '@/lib/game';
import {hydrateExposure} from '@/lib/exposure-server';
import {readDisabledCategories} from '@/lib/category-availability';
import {makeFeedbackView} from '@/lib/feedback-server';
import { jsonError,noStore } from '@/lib/http';
export const runtime='nodejs';

export async function POST(request:Request,{params}:{params:Promise<{code:string}>}) {
  const {code:raw}=await params;const code=raw.toUpperCase();
  if(!/^[A-HJ-NP-Z2-9]{6}$/.test(code))return jsonError('Invalid room code.');
  let action:Action;
  try {action=await request.json();} catch {return jsonError('Invalid game action.');}
  try {
    for(let attempt=0;attempt<12;attempt++) {
      let row=await getRoom(code);if(!row)return jsonError('Room not found.',404);
      const actor=await getRole(row,request);
      let state=row.snapshot as GameState;
      // Commit timer-driven transitions before applying the requested action so
      // a rematch or late submission cannot swallow a reveal/completion event.
      const now=Date.now();const advanced=tick(state,now);
      if(JSON.stringify(advanced)!==JSON.stringify(state)){
        if(!await updateRoom(row,advanced))continue;
        row={...row,snapshot:advanced,revision:row.revision+1};state=advanced;
      }
      if(action.type==='start-draft'&&actor.kind==='host'&&state.phase==='lobby'){
        try{state={...state,disabledCategoryIds:await readDisabledCategories()};state=await hydrateExposure(state);}
        catch(e){console.error('Show setup history or category availability:',e);return jsonError('Could not load saved question history or category availability. Check the v1.13.0 Supabase migration and retry. The show has not started.',503);}
      }
      const next=mutate(state,action,actor,now);
      const success=await updateRoom(row,next,state);
      if(success) return NextResponse.json(makeFeedbackView(next,actor,row.revision+1,Date.now(),true),{headers:noStore});
      // An incoming buzzer or other action won this round-trip. Reload and re-check rules.
    }
    return jsonError('The room is busy. Try again.',409);
  } catch(e) {
    if(e instanceof GameError)return jsonError(e.message,409);
    console.error('Game action:',e);return jsonError('Game update failed.',500);
  }
}
