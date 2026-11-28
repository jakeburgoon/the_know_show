/** Per-request immutable catalog. Never mutate a shared global bank. */
import {AsyncLocalStorage} from 'node:async_hooks';
import type {LibraryData} from './library-model';
import type {Category,FinalQuestion,Question} from './questions';
export function buildCatalog(data:LibraryData,legacy:FinalQuestion[]=[]){
 const categories=data.categories.map(c=>({...c,questionsByLevel:Object.fromEntries(Object.entries(c.questionsByLevel).map(([n,qs])=>[n,qs.filter(q=>q.enabled!==false)]))}));
 return {data,categories,categoryLookup:new Map(categories.map(c=>[c.id,c])),questionLookup:new Map(data.categories.flatMap(c=>Object.values(c.questionsByLevel).flat()).map(q=>[q.id,q])),finals:[...legacy,...data.finals],eligibleFinals:data.finals.filter(q=>q.enabled!==false&&q.finalEligible!==false)};
}
export type Catalog=ReturnType<typeof buildCatalog>;
const scope=new AsyncLocalStorage<Catalog>();
export const scopedCatalog=()=>scope.getStore();
export function withCatalog<T>(catalog:Catalog,run:()=>T):T{return scope.run(catalog,run);}
