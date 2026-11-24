import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {jsonError,noStore} from '@/lib/http';
import {readFeedbackTicket,feedbackInsert} from '@/lib/feedback-server';
export const runtime='nodejs';
export async function POST(request:Request){
 try{
  const raw=await request.text();if(raw.length>40000)return jsonError('Feedback is too long.',413);
  let body;try{body=JSON.parse(raw);}catch{return jsonError('Invalid feedback request.');}if(!body||typeof body.ticket!=='string')return jsonError('Feedback is unavailable.',403);
  const ticket=readFeedbackTicket(body.ticket);if(!ticket)return jsonError('This feedback invitation has expired.',403);
  const row=feedbackInsert(ticket,body);if(!row)return jsonError('Please select a reason or enter some feedback.');
  const {error}=await db().from('know_show_feedback').upsert(row,{onConflict:'dedupe_key',ignoreDuplicates:true});if(error)throw error;
  return NextResponse.json({ok:true},{headers:noStore});
 }catch(e){console.error('Feedback submission failed:',e instanceof Error?e.message:'Database or request error');return jsonError('Could not save feedback. Please try again.',500);}
}
