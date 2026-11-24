import {NextResponse,type NextRequest} from 'next/server';
import {db} from '@/lib/db';
import {CATEGORIES,CATEGORY_LOOKUP} from '@/lib/questions';
import {readDisabledCategories,categoryAvailability} from '@/lib/category-availability';
import {SESSION_COOKIE,validDeveloperSession} from '@/lib/feedback-server';
import {jsonError,noStore} from '@/lib/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const authorized=(request:NextRequest)=>validDeveloperSession(request.cookies.get(SESSION_COOKIE)?.value??'');
export async function GET(request:NextRequest){
 if(!authorized(request))return jsonError('Sign in to manage categories.',401);
 try{return NextResponse.json({categories:categoryAvailability(await readDisabledCategories())},{headers:noStore});}
 catch(e){console.error('Category availability:',e);return jsonError('Could not load category availability. Run the v1.12.1 Supabase migration.',503);}
}
export async function PATCH(request:NextRequest){
 if(!authorized(request)||request.headers.get('sec-fetch-site')==='cross-site')return jsonError('Not authorized.',401);
 const body=await request.json().catch(()=>null);
 if(!body||typeof body.id!=='string'||!CATEGORY_LOOKUP.has(body.id)||typeof body.enabled!=='boolean')return jsonError('Invalid category update.');
 try{
  const disabled=new Set(await readDisabledCategories());
  if(body.enabled)disabled.delete(body.id);else disabled.add(body.id);
  if(CATEGORIES.filter(c=>!c.activeMonths&&!disabled.has(c.id)).length<12)return jsonError('Keep at least 12 year-round categories enabled so both boards and Final Word remain playable.',409);
  const {error}=await db().from('know_show_category_availability').upsert({category_id:body.id,enabled:body.enabled,updated_at:new Date().toISOString()},{onConflict:'category_id'});
  if(error)throw error;
  return NextResponse.json({categories:categoryAvailability(await readDisabledCategories())},{headers:noStore});
 }catch(e){console.error('Category update:',e);return jsonError('Could not save category availability. Check the database setup.',503);}
}
