import {NextResponse,type NextRequest} from 'next/server';
import {db} from '@/lib/db';
import {jsonError,noStore} from '@/lib/http';
import {SESSION_COOKIE,validDeveloperSession} from '@/lib/feedback-server';
import {FEEDBACK_STATUSES,type FeedbackStatus} from '@/lib/feedback-types';
export const runtime='nodejs';
const authorized=(request:NextRequest)=>validDeveloperSession(request.cookies.get(SESSION_COOKIE)?.value??'');
const columns='id,created_at,app_version,show_id,kind,question_id,question,reasons,comment,rating,experience,category_ideas,status';
export async function GET(request:NextRequest){
 if(!authorized(request))return jsonError('Sign in to view feedback.',401);
 try{
  const p=request.nextUrl.searchParams,kind=p.get('kind'),status=p.get('status'),question=p.get('question');
  const offset=Math.max(0,Math.min(1000000,Math.trunc(Number(p.get('offset'))||0)));
  let query=db().from('know_show_feedback').select(columns,{count:'exact'});
  if(kind==='question'||kind==='show')query=query.eq('kind',kind);
  if(p.get('ideas')==='1')query=query.neq('category_ideas','');
  if(status==='unresolved')query=query.in('status',['new','under-review']);else if(FEEDBACK_STATUSES.includes(status as FeedbackStatus))query=query.eq('status',status);
  if(question)query=query.eq('question_id',question.slice(0,200));
  const {data,error,count}=await query.order('created_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+99);if(error)throw error;
  return NextResponse.json({rows:data??[],count:count??0},{headers:noStore});
 }catch(e){console.error('Feedback read:',e instanceof Error?e.message:'Database error');return jsonError('Could not load feedback. Check the database setup.',500);}
}
export async function PATCH(request:NextRequest){
 if(!authorized(request)||request.headers.get('sec-fetch-site')==='cross-site')return jsonError('Not authorized.',401);
 const body=await request.json().catch(()=>null);
 if(!body||typeof body.id!=='string'||!/^[0-9a-f-]{36}$/i.test(body.id)||!FEEDBACK_STATUSES.includes(body.status))return jsonError('Invalid status update.');
 try{const {data,error}=await db().from('know_show_feedback').update({status:body.status}).eq('id',body.id).select('id').maybeSingle();if(error)throw error;if(!data)return jsonError('Feedback not found.',404);return NextResponse.json({ok:true},{headers:noStore});}catch{return jsonError('Could not update feedback.',500);}
}
