import { NextResponse } from 'next/server';
import { getRole,getRoom } from '@/lib/db';
import { makeView } from '@/lib/game';
import { jsonError,noStore } from '@/lib/http';
export const runtime='nodejs';
export async function GET(request:Request,{params}:{params:Promise<{code:string}>}) {
  try {
    const {code:raw}=await params;const code=raw.toUpperCase();
    if(!/^[A-HJ-NP-Z2-9]{6}$/.test(code))return jsonError('Invalid room code.');
    const row=await getRoom(code);
    if(!row)return jsonError('No game found with that room code.',404);
    const actor=await getRole(row,request);
    return NextResponse.json(makeView(row.snapshot as Parameters<typeof makeView>[0],actor,row.revision),{headers:noStore});
  } catch(e) {console.error('Get room:',e);return jsonError('Could not load the game.',500);}
}
