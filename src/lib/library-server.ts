import {createHash} from 'node:crypto';
import {db} from './db';
import {CATEGORIES,CATEGORY_FINALS,LEGACY_FINALS,currentCatalog} from './questions';
import {applyRevisions,type LibraryData,type RevisionExport} from './library-model';
import {buildCatalog,withCatalog,type Catalog} from './library-context';
import sync from './library-sync.json';
const BASE={categories:CATEGORIES,finals:CATEGORY_FINALS};
export async function readLibraryExport():Promise<RevisionExport>{
 const {data,error}=await db().rpc('ks_library_export');if(error)throw error;
 const result=data as RevisionExport;if(!result||result.schemaVersion!==1||!Number.isSafeInteger(result.watermark)||!Array.isArray(result.revisions)||result.watermark<sync.appliedThrough)throw Error('Library export is invalid or older than the checked-in bank.');return result;
}
export async function readLiveLibrary(){const exported=await readLibraryExport();return {exported,data:applyRevisions(BASE,exported.revisions.filter(r=>r.revision>sync.appliedThrough))};}
const cache=new Map<string,Catalog>();
function remember(id:string,catalog:Catalog){cache.set(id,catalog);while(cache.size>12)cache.delete(cache.keys().next().value!);return catalog;}
export async function pinLiveLibrary(data:LibraryData){
 const id=createHash('sha256').update(JSON.stringify(data)).digest('hex');
 if(!cache.has(id)){
  // Do not mutate an existing snapshot. Duplicate insert is harmless.
  const {error}=await db().from('know_show_library_snapshots').insert({id,payload:data});if(error&&error.code!=='23505')throw error;
  remember(id,buildCatalog(data,LEGACY_FINALS));
 }
 return {id,catalog:cache.get(id)!};
}
export async function roomCatalog(id?:string):Promise<Catalog>{
 if(!id)return currentCatalog();
 if(!/^[0-9a-f]{64}$/.test(id))throw Error('Invalid catalog ID.');
 const saved=cache.get(id);if(saved)return saved;
 const {data,error}=await db().from('know_show_library_snapshots').select('payload').eq('id',id).single();if(error)throw error;
 const payload=data?.payload as LibraryData;if(!payload||!Array.isArray(payload.categories)||!Array.isArray(payload.finals))throw Error('Pinned question library is unavailable.');
 return remember(id,buildCatalog(payload,LEGACY_FINALS));
}
export async function withRoomCatalog<T>(id:string|undefined,fn:()=>T):Promise<Awaited<T>>{return await withCatalog(await roomCatalog(id),fn);}
