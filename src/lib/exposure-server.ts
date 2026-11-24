import {db} from './db';
import {historyKey,historyKeys} from './exposure';
import type {GameState} from './game';
import {mergeHostHistories,type SeenHistory} from './host-history';
/** Load authoritative history on each show start, including rematches. Import surviving old host histories only once. */
export async function hydrateExposure(state:GameState):Promise<GameState>{
 const client=db();const key=historyKey(state),keys=historyKeys(state);
 const {data,error}=await client.rpc('ks_read_exposure_history',{p_host_key:key});
 if(error)throw error;
 const stored=data as (SeenHistory&{initialized:boolean})|null;
 if(!stored)throw new Error('Exposure history did not return a result.');
 const groupResult=await client.rpc('ks_read_group_exposure_history',{p_keys:keys});
 if(groupResult.error)throw groupResult.error;
 const group=groupResult.data as (SeenHistory&{questionSeenCounts:Record<string,number>})|null;
 if(!group)throw new Error('Group history did not return a result.');
 let seed:SeenHistory|undefined;
 if(!stored.initialized){
  let previous:Partial<SeenHistory>[]=[];
  if(state.hostHistoryId){
   const {data:rows,error:legacyError}=await client.from('know_show_rooms').select('snapshot').eq('snapshot->>hostHistoryId',state.hostHistoryId).neq('snapshot->>id',state.id).order('updated_at',{ascending:false}).limit(80);
   if(legacyError)throw legacyError;
   previous=(rows??[]).reverse().map(row=>row.snapshot as Partial<SeenHistory>);
  }
  seed=mergeHostHistories(previous,state);
  const already=new Set(stored.recentQuestionIds);
  for(const id of seed.recentQuestionIds)if(!already.has(id))group.questionSeenCounts[id]=(group.questionSeenCounts[id]??0)+1;
 }
 const merged=mergeHostHistories(seed?[seed]:[],group);
 return {...state,...merged,questionSeenCounts:group.questionSeenCounts,historyScopeCount:keys.length,seedHistory:seed};
}
