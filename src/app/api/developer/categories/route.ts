import {NextResponse,type NextRequest} from 'next/server';
import {db} from '@/lib/db';
import {CATEGORY_LOOKUP} from '@/lib/questions';
import {readLiveLibrary} from '@/lib/library-server';
import {assertCoverage,playable} from '@/lib/library-model';
import {tagsForCategory} from '@/lib/category-taxonomy';
import {SESSION_COOKIE,validDeveloperSession} from '@/lib/feedback-server';
import {jsonError,noStore} from '@/lib/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const authorized=(request:NextRequest)=>validDeveloperSession(request.cookies.get(SESSION_COOKIE)?.value??'');
async function disabledIds(){const {data,error}=await db().from('know_show_category_availability').select('category_id').eq('enabled',false);if(error)throw error;return (data??[]).map(r=>String(r.category_id)).sort();}
const describe=(data:Awaited<ReturnType<typeof readLiveLibrary>>['data'],disabled:string[])=>data.categories.map(c=>({id:c.id,name:c.name,enabled:!disabled.includes(c.id),playable:playable(c),months:c.activeMonths??null,tags:tagsForCategory(c.id),counts:[1,2,3].map(n=>(c.questionsByLevel[String(n)]??[]).filter(q=>q.enabled!==false).length)})).sort((a,b)=>a.name.localeCompare(b.name));
export async function GET(request:NextRequest){
 if(!authorized(request))return jsonError('Sign in to manage categories.',401);
 try{const live=await readLiveLibrary();return NextResponse.json({categories:describe(live.data,await disabledIds())},{headers:noStore});}
 catch(e){console.error('Category availability:',e);return jsonError('Could not load category availability. Verify the v1.15 migration.',503);}
}
export async function PATCH(request:NextRequest){
 if(!authorized(request)||request.headers.get('sec-fetch-site')==='cross-site')return jsonError('Not authorized.',401);
 const body=await request.json().catch(()=>null);
 if(!body||typeof body.id!=='string'||!CATEGORY_LOOKUP.has(body.id)||typeof body.enabled!=='boolean')return jsonError('Invalid category update.');
 try{
  const live=await readLiveLibrary(),before=await disabledIds(),disabled=new Set(before);
  if(body.enabled)disabled.delete(body.id);else disabled.add(body.id);
  try{assertCoverage(live.data,[...disabled]);}catch(e){return jsonError(e instanceof Error?e.message:'Insufficient categories.',409);}
  const {error}=await db().rpc('ks_set_library_category',{p_watermark:live.exported.watermark,p_disabled:before,p_id:body.id,p_enabled:body.enabled});
  if(error){if(error.code==='40001')return jsonError('Library changed. Refresh and retry.',409);throw error;}
  return NextResponse.json({categories:describe(live.data,await disabledIds())},{headers:noStore});
 }catch(e){console.error('Category update:',e);return jsonError('Could not save category availability. Check the database setup.',503);}
}
