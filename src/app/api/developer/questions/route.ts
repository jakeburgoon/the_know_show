import {NextResponse,type NextRequest} from 'next/server';
import {CATEGORIES,CATEGORY_FINALS,type QuestionImage} from '@/lib/questions';
import {SESSION_COOKIE,validDeveloperSession} from '@/lib/feedback-server';
import {jsonError,noStore} from '@/lib/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
type LabDifficulty='all'|'easy'|'medium'|'hard'|'final';
type LabSurface='phone'|'tv';
type LabAnswerMode='written'|'choices';
type LabEntry={key:string;kind:'regular'|'final';id:string;categoryId:string;categoryName:string;level:number|null;difficulty:LabDifficulty;prompt:string;answer:string;aliases:string[];hintText:string[];distractors:string[];image?:QuestionImage;sourceUrl?:string;tier?:string;topicPreview?:string;finalEligible?:boolean;finalExclusionReason?:string};

const ALL_CATEGORY_OPTIONS=CATEGORIES.map(c=>({id:c.id,name:c.name})).sort((a,b)=>a.name.localeCompare(b.name));
const REGULAR_LAB_ENTRIES:LabEntry[]=CATEGORIES.flatMap(category=>Object.entries(category.questionsByLevel).flatMap(([level,questions])=>questions.map(q=>({
 key:`q:${q.id}`,
 kind:'regular' as const,
 id:q.id,
 categoryId:category.id,
 categoryName:category.name,
 level:Number(level),
 difficulty:(Number(level)===1?'easy':Number(level)===2?'medium':'hard') as LabDifficulty,
 prompt:q.prompt,
 answer:q.answer,
 aliases:q.aliases??[],
 hintText:[q.hint],
 distractors:q.distractors??[],
 image:q.image,
 sourceUrl:q.sourceUrl
}))));
const FINAL_LAB_ENTRIES:LabEntry[]=CATEGORY_FINALS.map(q=>({
 key:`f:${q.id}`,
 kind:'final' as const,
 id:q.id,
 categoryId:q.categoryId??q.category.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),
 categoryName:q.category,
 level:null,
 difficulty:'final',
 prompt:q.prompt,
 answer:q.answer,
 aliases:q.aliases??[],
 hintText:q.hints?.length?q.hints:[q.hint],
 distractors:q.distractors??[],
 image:q.image,
 sourceUrl:q.sourceUrl,
 tier:q.tier,topicPreview:q.topicPreview,finalEligible:q.finalEligible,finalExclusionReason:q.finalExclusionReason
}));
const LAB_ENTRIES:LabEntry[]=[...REGULAR_LAB_ENTRIES,...FINAL_LAB_ENTRIES];

export function GET(request:NextRequest){
 if(!validDeveloperSession(request.cookies.get(SESSION_COOKIE)?.value??''))return jsonError('Sign in to view questions.',401);
 return NextResponse.json({categories:ALL_CATEGORY_OPTIONS,entries:LAB_ENTRIES},{headers:noStore});
}
