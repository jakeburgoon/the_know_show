/** Pure library merge/validation shared by server and release tooling. */
import type {Category,Question,FinalQuestion} from './questions';
import {normalize} from './answer-matching';
import {SUPER_CATEGORIES} from './category-taxonomy';
export type Kind='regular'|'final';
export type LibraryRecord=(Question|FinalQuestion)&{enabled?:boolean;extraTags?:string[];libraryRevision?:number};
export type LibraryData={categories:Category[];finals:FinalQuestion[]};
export type Revision={revision:number;question_id:string;kind:Kind;payload:LibraryRecord;previous_payload?:LibraryRecord|null;reason?:string;created_at?:string};
export type RevisionExport={schemaVersion:1;watermark:number;revisions:Revision[]};
export const playable=(c:Category)=>[1,2,3].every(n=>(c.questionsByLevel[String(n)]??[]).filter(q=>q.enabled!==false).length>=4);
export function findRecord(data:LibraryData,id:string):{kind:Kind;record:LibraryRecord}|undefined{
 for(const c of data.categories)for(const qs of Object.values(c.questionsByLevel)){const q=qs.find(x=>x.id===id);if(q)return {kind:'regular',record:q};}
 const final=data.finals.find(q=>q.id===id);return final?{kind:'final',record:final}:undefined;
}
const str=(v:unknown,name:string,max:number,required=true)=>{if(typeof v!=='string'||v.length>max||(required&&!v.trim()))throw Error(`${name} must be ${required?'nonempty and ':''}at most ${max} characters.`);return v.trim();};
const list=(v:unknown,name:string,max:number)=>{if(!Array.isArray(v)||v.length>max)throw Error(`${name} must contain at most ${max} entries.`);return v.map(x=>str(x,name,200));};
const rec=(v:unknown):Record<string,unknown>=>{if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Invalid question record.');return v as Record<string,unknown>;};
export function validateRecord(data:LibraryData,kind:Kind,input:unknown,existing?:LibraryRecord):LibraryRecord{
 const v=rec(input),id=str(v.id,'ID',160),categoryId=str(v.categoryId,'Category ID',100);
 if(!/^[a-zA-Z0-9_.-]+$/.test(id))throw Error('Invalid question ID.');
 const category=data.categories.find(c=>c.id===categoryId);if(!category)throw Error('Choose an existing category.');
 if(existing&&existing.id!==id)throw Error('Question IDs cannot change.');
 const prompt=str(v.prompt,'Question',1500),answer=str(v.answer,'Answer',200);if(!normalize(answer))throw Error('Answer must contain a recognizable word or number.');
 const aliases=list(v.aliases??[],'Acceptable answers',30),distractors=kind==='regular'?list(v.distractors,'Distractors',3):[];
 const normalized=[answer,...aliases,...distractors].map(normalize);
 if(normalized.some(x=>!x))throw Error('Answer choices must contain recognizable words or numbers.');
 const wrong=distractors.map(normalize),right=[answer,...aliases].map(normalize);
 if(kind==='regular'&&(wrong.length!==3||new Set(wrong).size!==3||wrong.some(x=>right.includes(x))))throw Error('Provide three distinct wrong choices, none matching a correct or acceptable answer.');
 if(typeof v.enabled!=='boolean')throw Error('Choose enabled or disabled.');
 const extraTags=list(v.extraTags??[],'Extra tags',14);if(extraTags.some(t=>!SUPER_CATEGORIES.some(x=>x.id===t)))throw Error('Unknown super-category tag.');
 const common={...existing,id,categoryId,prompt,answer,aliases,distractors,enabled:v.enabled,extraTags:[...new Set(extraTags)]};
 const sourceUrl=str(v.sourceUrl??'','Source URL',1500,false);if(sourceUrl&&sourceUrl!==existing?.sourceUrl&&!/^https?:\/\//i.test(sourceUrl))throw Error('Source URL must start with http:// or https://.');
 // Images remain linked to bundled, reviewed assets. This release does not upload files.
 const image=v.image===null?undefined:v.image===undefined?existing?.image:rec(v.image);
 let cleanImage:Question['image'];if(image){const src=str(image.src,'Image path',500),alt=str(image.alt,'Image description',300);if(!/^\/[a-zA-Z0-9_./%-]+$/.test(src)||src.split('/').includes('..')||src.startsWith('//'))throw Error('Image must reference a bundled local asset.');if(!Number.isInteger(image.width)||!Number.isInteger(image.height)||Number(image.width)<1||Number(image.height)<1||Number(image.width)>10000||Number(image.height)>10000)throw Error('Invalid image dimensions.');cleanImage={src,alt,width:Number(image.width),height:Number(image.height)};}
 if(category.id==='flags-world'||category.id==='famous-landmarks'||category.id==='classic-movie-posters'||category.id==='picture-this-animals'||category.id==='christmas-movie-scenes'){if(kind==='regular'&&!cleanImage)throw Error('This visual category requires an image.');}
 if(kind==='regular'){
  if(![1,2,3].includes(Number(v.level)))throw Error('Choose Easy, Medium or Hard.');
  return {...common,sourceStatus:existing&&existing.prompt===prompt&&existing.answer===answer&&existing.sourceUrl===sourceUrl?('sourceStatus' in existing?existing.sourceStatus:undefined):'Developer revision — source requires review',level:Number(v.level),hint:str(v.hint??'','Hint',500,false),sourceUrl:sourceUrl||undefined,image:cleanImage} as Question;
 }
 if(!['family','teen','adult'].includes(String(v.tier)))throw Error('Choose Final Word audience tier.');
 if(!['medium-hard','hard'].includes(String(v.difficulty)))throw Error('Choose Final Word difficulty.');
 if(typeof v.finalEligible!=='boolean')throw Error('Choose Final Word eligibility.');
 const hints=list(v.hints,'Final Word hints',2);if(hints.length!==2||normalize(hints[0])===normalize(hints[1]))throw Error('Provide two distinct hints.');
 if(hints.some(h=>normalize(h)===normalize(answer)))throw Error('A hint cannot be the answer.');
 return {...common,category:category.name,difficulty:v.difficulty,tier:v.tier,topicPreview:str(v.topicPreview??'','Topic preview',250,false)||undefined,hint:hints[0],hints:[hints[0],hints[1]],finalEligible:v.finalEligible,finalExclusionReason:v.finalEligible?undefined:str(v.finalExclusionReason??'','Exclusion reason',500),sourceUrl:sourceUrl||undefined,image:cleanImage} as FinalQuestion;
}
/** Merge by stable ID. Disabled records remain present for history and future restoration. */
export function applyRevisions(base:LibraryData,rows:Revision[]):LibraryData{
 const result=structuredClone(base);
 for(const row of [...rows].sort((a,b)=>a.revision-b.revision)){
  if(row.payload.id!==row.question_id||!Number.isSafeInteger(row.revision)||row.revision<1)throw Error('Invalid revision export.');
  const found=findRecord(result,row.question_id);if(found&&found.kind!==row.kind)throw Error('Question kind cannot change.');
  // Do not overwrite a newer canonical version with an old database row.
  if((found?.record.libraryRevision??0)>=row.revision)continue;
  const payload={...validateRecord(result,row.kind,{...row.payload,image:row.payload.image??null},found?.record),libraryRevision:row.revision};
  if(row.kind==='regular'){
   const q=payload as Question;
   // Preserve the original position for simple edits. Moving category/level removes old membership.
   if(found&&found.kind==='regular'&&found.record.categoryId===q.categoryId&&(found.record as Question).level===q.level){const qs=result.categories.find(c=>c.id===q.categoryId)!.questionsByLevel[String(q.level)];qs[qs.findIndex(x=>x.id===q.id)]=q;}
   else {for(const c of result.categories)for(const lv of Object.keys(c.questionsByLevel))c.questionsByLevel[lv]=c.questionsByLevel[lv].filter(x=>x.id!==q.id);result.categories.find(c=>c.id===q.categoryId)!.questionsByLevel[String(q.level)].push(q);}
  }else{const q=payload as FinalQuestion,idx=result.finals.findIndex(x=>x.id===q.id);if(idx<0)result.finals.push(q);else result.finals[idx]=q;}
 }
 return result;
}
export function coverage(data:LibraryData,disabled:string[]){
 const enabled=data.categories.filter(c=>!disabled.includes(c.id)&&!c.activeMonths);
 const yearRoundPlayable=enabled.filter(playable).length;
 const ids=new Set(enabled.map(c=>c.id));
 const yearRoundFinals=new Set(data.finals.filter(q=>q.enabled!==false&&q.finalEligible!==false&&q.categoryId&&ids.has(q.categoryId)).map(q=>q.categoryId)).size;
 return {yearRoundPlayable,yearRoundFinals,blockedCategories:data.categories.filter(c=>!playable(c)).map(c=>c.id)};
}
export function assertCoverage(data:LibraryData,disabled:string[]){const c=coverage(data,disabled);if(c.yearRoundPlayable<12)throw Error('Keep at least 12 year-round playable categories (four enabled questions at each difficulty).');if(c.yearRoundFinals<9)throw Error('Keep at least 9 year-round Final Word eligible categories.');return c;}
