import {NextResponse, type NextRequest} from 'next/server';
import {developerPassword,newDeveloperSession,safeEqual,validDeveloperSession,SESSION_COOKIE} from '@/lib/feedback-server';
import {jsonError,noStore} from '@/lib/http';
export const runtime='nodejs';
export function GET(request:NextRequest){return NextResponse.json({configured:!!developerPassword(),authenticated:validDeveloperSession(request.cookies.get(SESSION_COOKIE)?.value??'')},{headers:noStore});}
export async function POST(request:NextRequest){
 if(request.headers.get('sec-fetch-site')==='cross-site')return jsonError('Not allowed.',403);
 const password=developerPassword();if(!password)return jsonError('Developer feedback is not configured.',503);
 const body=await request.json().catch(()=>null);
 if(typeof body?.password!=='string'||body.password.length>512||!safeEqual(body.password,password)){await new Promise(r=>setTimeout(r,500));return jsonError('Incorrect password.',401);}
 const response=NextResponse.json({ok:true},{headers:noStore});response.cookies.set(SESSION_COOKIE,newDeveloperSession(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/api/developer',maxAge:8*60*60});return response;
}
export function DELETE(request:NextRequest){if(request.headers.get('sec-fetch-site')==='cross-site')return jsonError('Not allowed.',403);const response=NextResponse.json({ok:true},{headers:noStore});response.cookies.set(SESSION_COOKIE,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/api/developer',maxAge:0});return response;}
