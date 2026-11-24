import {NextResponse,type NextRequest} from 'next/server';
import {db} from '@/lib/db';
import {SESSION_COOKIE,validDeveloperSession} from '@/lib/feedback-server';
import {CATEGORIES,CATEGORY_FINALS,getQuestion} from '@/lib/questions';
import {jsonError,noStore} from '@/lib/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
 if(!validDeveloperSession(request.cookies.get(SESSION_COOKIE)?.value??''))return jsonError('Sign in to view show statistics.',401);
 try{
  const client=db();const {data,error}=await client.rpc('ks_exposure_report');if(error)throw error;
  const ages=await client.rpc('ks_age_question_report');if(ages.error)throw ages.error;
  const report=data as {questions:{question_id:string}[];recentShows:{questions:{question_id:string;stats?:Record<string,unknown>|null}[]}[]};
  const finals=new Map(CATEGORY_FINALS.map(q=>[q.id,q]));
  const describe=(row:{question_id:string})=>{const q=getQuestion(row.question_id)??finals.get(row.question_id);return {...row,prompt:q?.prompt??'(Retired question)',answer:q?.answer??''};};
  const withoutAge=(row:{question_id:string;stats?:Record<string,unknown>|null})=>{const stats=row.stats;if(!stats)return describe(row);const {ageSummary,...safeStats}=stats;return {...describe(row),stats:safeStats};};
  return NextResponse.json({...report,ageQuestions:ages.data??[],categories:CATEGORIES.map(c=>({id:c.id,name:c.name})),questions:report.questions.map(describe),recentShows:report.recentShows.map(s=>({...s,questions:s.questions.map(withoutAge)}))},{headers:noStore});
 }catch(e){console.error('Exposure report:',e);return jsonError('Could not load statistics. Check the v1.13.0 and v1.13.2 database migrations.',503);}
}
