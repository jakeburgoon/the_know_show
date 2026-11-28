import {NextResponse,type NextRequest} from 'next/server';
import {randomUUID} from 'node:crypto';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {SUPER_CATEGORIES,tagsForCategory,tagsForQuestion} from '@/lib/category-taxonomy';
import {SESSION_COOKIE,validDeveloperSession} from '@/lib/feedback-server';
import {jsonError,noStore} from '@/lib/http';
import {db} from '@/lib/db';
import {readLiveLibrary,readLibraryExport} from '@/lib/library-server';
import {applyRevisions,assertCoverage,findRecord,validateRecord,type Kind,type LibraryData,type LibraryRecord} from '@/lib/library-model';
export const runtime='nodejs';
export const dynamic='force-dynamic';
function entries(data:LibraryData){
 return [...data.categories.flatMap(category=>Object.entries(category.questionsByLevel).flatMap(([level,questions])=>questions.map(q=>({
  ...q, tags:tagsForQuestion(category.id,q.id,q.extraTags),key:`q:${q.id}`,kind:'regular' as const,categoryName:category.name,level:Number(level),difficulty:Number(level)===1?'easy':Number(level)===2?'medium':'hard',hintText:[q.hint],aliases:q.aliases??[],distractors:q.distractors??[],enabled:q.enabled!==false,libraryRevision:q.libraryRevision??0
 })))),...data.finals.map(q=>({
  ...q,topicPreview:q.topicPreview,finalEligible:q.finalEligible,tags:tagsForQuestion(q.categoryId??'',q.id,q.extraTags),key:`f:${q.id}`,kind:'final' as const,categoryName:q.category,level:null,finalDifficulty:q.difficulty??'medium-hard',difficulty:'final',hintText:q.hints??[q.hint],aliases:q.aliases??[],distractors:q.distractors??[],enabled:q.enabled!==false,libraryRevision:q.libraryRevision??0
 }))];
}
async function rawDisabled(){const {data,error}=await db().from('know_show_category_availability').select('category_id').eq('enabled',false);if(error)throw error;return (data??[]).map(r=>String(r.category_id)).sort();}
const authorized=(r:NextRequest)=>validDeveloperSession(r.cookies.get(SESSION_COOKIE)?.value??'');
export async function GET(request:NextRequest){
 if(!validDeveloperSession(request.cookies.get(SESSION_COOKIE)?.value??''))return jsonError('Sign in to view questions.',401);
 try{
  const query=request.nextUrl.searchParams;
  if(query.get('export')==='1')return NextResponse.json(await readLibraryExport(),{headers:noStore});
  const live=await readLiveLibrary();
  if(query.get('id')){
   const id=query.get('id')!;const {data,error}=await db().from('know_show_question_drafts').select('*').eq('question_id',id).maybeSingle();if(error)throw error;
   return NextResponse.json({draft:data??null,history:live.exported.revisions.filter(r=>r.question_id===id).reverse()},{headers:noStore});
  }
  const {data:drafts,error}=await db().from('know_show_question_drafts').select('question_id,kind,payload,base_revision,reason,updated_at').order('updated_at',{ascending:false});if(error)throw error;
  return NextResponse.json({categories:live.data.categories.map(c=>({id:c.id,name:c.name,tags:tagsForCategory(c.id)})).sort((a,b)=>a.name.localeCompare(b.name)),superCategories:SUPER_CATEGORIES,entries:entries(live.data),drafts:drafts??[],watermark:live.exported.watermark},{headers:noStore});
 }catch(e){console.error('Library read:',e);return jsonError('Could not load the question library. Verify the v1.15 migration.',503);}
}
export async function POST(request:NextRequest){
 if(!authorized(request)||request.headers.get('sec-fetch-site')==='cross-site')return jsonError('Not authorized.',401);
 const b=await request.json().catch(()=>null);if(!b||!['regular','final'].includes(b.kind)||!['draft','publish','discard'].includes(b.action))return jsonError('Invalid question request.');
 if(!b.payload||typeof b.payload!=='object'||!Number.isSafeInteger(b.baseRevision)||b.baseRevision<0)return jsonError('Invalid question data.');
 const kind=b.kind as Kind;
 try{
  const live=await readLiveLibrary(),id=b.payload.id||`dev-${randomUUID()}`;
  if(typeof id!=='string'||!/^[a-zA-Z0-9_.-]{1,160}$/.test(id))return jsonError('Invalid question ID.');
  const found=findRecord(live.data,id);
  if(!found&&!/^dev-[0-9a-f-]{36}$/.test(id))return jsonError('New questions must use a generated ID.');
  if(found&&found.kind!==kind)return jsonError('Question type cannot change.');
  if((found?.record.libraryRevision??0)!==b.baseRevision)return jsonError('This question has changed. Reload the current version before editing.',409);
  if(b.action==='discard'){
   const {error}=await db().from('know_show_question_drafts').delete().eq('question_id',id);if(error)throw error;return NextResponse.json({id,ok:true},{headers:noStore});
  }
  let payload:LibraryRecord;const reason=typeof b.reason==='string'?b.reason.trim().slice(0,1000):'';
  try{
   payload=validateRecord(live.data,kind,{...b.payload,id},found?.record);
   if(payload.image&&payload.image.src!==found?.record.image?.src&&(!/^\/trivia-images\/[a-zA-Z0-9_.-]+\.(png|jpe?g|webp)$/i.test(payload.image.src)||!existsSync(join(process.cwd(),'public',payload.image.src))))throw Error('Image is not in the bundled game assets.');
  }catch(e){return jsonError(e instanceof Error?e.message:'Invalid question.');}
  if(b.action==='draft'){
   const {error}=await db().from('know_show_question_drafts').upsert({question_id:id,kind,payload,base_revision:b.baseRevision,reason,updated_at:new Date().toISOString()});if(error)throw error;
   return NextResponse.json({id,ok:true},{headers:noStore});
  }
  if(!reason)return jsonError('Enter a reason for publication.');
  const disabled=await rawDisabled();
  let coverage;
  try{const proposed=applyRevisions(live.data,[{revision:live.exported.watermark+1,question_id:id,kind,payload}]);coverage=assertCoverage(proposed,disabled);}catch(e){return jsonError(e instanceof Error?e.message:'Invalid library coverage.',409);}
  const {data:revision,error}=await db().rpc('ks_publish_question',{p_watermark:live.exported.watermark,p_disabled:disabled,p_id:id,p_kind:kind,p_payload:payload,p_previous:found?.record??null,p_reason:reason,p_resolve:b.resolve===true});
  if(error){if(error.code==='40001')return jsonError('Library changed. Refresh and retry.',409);throw error;}
  return NextResponse.json({id,revision,coverage,ok:true},{headers:noStore});
 }catch(e){console.error('Library write:',e);return jsonError('Could not save. Verify the database migration and try again.',503);}
}
