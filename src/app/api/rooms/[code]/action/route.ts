import { NextResponse } from 'next/server';
import { getRole,getRoom,updateRoom } from '@/lib/db';
import { GameError,mutate, type Action,type GameState } from '@/lib/game';
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
      const row=await getRoom(code);if(!row)return jsonError('Room not found.',404);
      const actor=await getRole(row,request);
      let state=row.snapshot as GameState;
      if(action.type==='start-draft'&&actor.kind==='host'&&state.phase==='lobby'){
        try{state={...state,disabledCategoryIds:await readDisabledCategories()};}
        catch(e){console.error('Category availability:',e);return jsonError('Could not load category availability. Check the v1.12.1 Supabase migration and try again.',503);}
      }
      const next=mutate(state,action,actor);
      const success=await updateRoom(row,next);
      if(success) return NextResponse.json(makeFeedbackView(next,actor,row.revision+1),{headers:noStore});
      // An incoming buzzer or other action won this round-trip. Reload and re-check rules.
    }
    return jsonError('The room is busy. Try again.',409);
  } catch(e) {
    if(e instanceof GameError)return jsonError(e.message,409);
    console.error('Game action:',e);return jsonError('Game update failed.',500);
  }
}
