export const normalize=(str:string)=>str.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/^[\s]*(?:(?:what|who|which|where)\s+(?:is|are|was|were)\s+|(?:it is|the answer is)\s+)/,'').replace(/[’']/g,'').replace(/\b(?:a|an|the)\b/g,' ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
function distance(a:string,b:string){const prev=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let left=prev[0];prev[0]=i;for(let j=1;j<=b.length;j++){const old=prev[j];prev[j]=Math.min(prev[j]+1,prev[j-1]+1,left+(a[i-1]===b[j-1]?0:1));left=old;}}return prev[b.length];}
const numberWords:Record<string,string>={zero:'0',one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9',ten:'10',eleven:'11',twelve:'12',thirteen:'13',fourteen:'14',fifteen:'15',sixteen:'16',seventeen:'17',eighteen:'18',nineteen:'19',twenty:'20',first:'1st',second:'2nd',third:'3rd',fourth:'4th',fifth:'5th',sixth:'6th',seventh:'7th',eighth:'8th',ninth:'9th',tenth:'10th',eleventh:'11th',twelfth:'12th',thirteenth:'13th',fourteenth:'14th',fifteenth:'15th',sixteenth:'16th',seventeenth:'17th',eighteenth:'18th',nineteenth:'19th',twentieth:'20th'};
const romanNumerals=new Set(['i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','xii','xiii','xiv','xv']);
const protectedTerms=(s:string)=>normalize(s).split(' ').map(x=>numberWords[x]??x).filter(x=>/\d/.test(x)||romanNumerals.has(x));
export function isCorrect(given:string,answer:string,aliases:string[]=[]):boolean {
 const g=normalize(given);if(!g)return false;
 const confusables:[string,string][]=[['ectotherm','endotherm'],['ethology','ethnology'],['refraction','reflection']];
 if(confusables.some(([a,b])=>(g===a&&normalize(answer)===b)||(g===b&&normalize(answer)===a)))return false;
 return [answer,...aliases].some(candidate=>{
   const a=normalize(candidate);if(!a)return false;
   if(g===a)return true;
   if(a.length<6||g.length<5||Math.abs(a.length-g.length)>2)return false;
   const gn=protectedTerms(g),an=protectedTerms(a);
   if(gn.join('|')!==an.join('|'))return false;
   const allowance=a.length>=9?2:1;
   return distance(a,g)<=allowance;
 });
}
export function isCorrectForQuestion(given:string,q:{answer:string;aliases?:string[];distractors?:string[]}):boolean {
 const input=normalize(given);
 if((q.distractors??[]).some(d=>normalize(d)===input))return false;
 return isCorrect(given,q.answer,q.aliases??[]);
}
