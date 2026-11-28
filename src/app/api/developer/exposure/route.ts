import {NextResponse,type NextRequest} from 'next/server';
import {db} from '@/lib/db';
import {SESSION_COOKIE,validDeveloperSession} from '@/lib/feedback-server';
import {readLiveLibrary} from '@/lib/library-server';
import {findRecord} from '@/lib/library-model';
import {jsonError,noStore} from '@/lib/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
 if(!validDeveloperSession(request.cookies.get(SESSION_COOKIE)?.value??''))return jsonError('Sign in to view show statistics.',401);
 try{
  const client=db();const {data,error}=await client.rpc('ks_exposure_report');if(error)throw error;
  const ages=await client.rpc('ks_age_question_report');if(ages.error)throw ages.error;
  const report=data as {questions:{question_id:string}[];recentShows:{questions:{question_id:string;stats?:Record<string,unknown>|null}[]}[]};
  const live=await readLiveLibrary();
  const describe=(row:{question_id:string})=>{const q=findRecord(live.data,row.question_id)?.record;return {...row,prompt:q?.prompt??'(Retired question)',answer:q?.answer??''};};
  const withoutAge=(row:{question_id:string;stats?:Record<string,unknown>|null;diagnostic?:{prompt?:string;answer?:string;libraryRevision?:number}|null})=>{const historical=describe(row);const stats=row.stats;const {ageSummary,...safeStats}=stats??{};return {...historical,prompt:row.diagnostic?.prompt??historical.prompt,answer:row.diagnostic?.answer??historical.answer,stats:stats?safeStats:stats};};
  return NextResponse.json({...report,ageQuestions:ages.data??[],categories:live.data.categories.map(c=>({id:c.id,name:c.name})),questions:report.questions.map(describe),recentShows:report.recentShows.map(s=>({...s,questions:s.questions.map(withoutAge)}))},{headers:noStore});
 }catch(e){console.error('Exposure report:',e);return jsonError('Could not load statistics. Check the v1.13.0 and v1.13.2 database migrations.',503);}
}
