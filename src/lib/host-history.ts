/** Anonymous host history allows consecutive shows to avoid repeats across room codes.
 * Each browser keeps a random ID; the server looks up previous room snapshots
 * for that ID. No login, no player information, and no database migration.
 */
import {historyLimit} from './game';
import {CATEGORIES} from './questions';
export type SeenHistory={recentQuestionIds:string[];recentCategoryIds:string[];recentCategoryOffers:string[]};
export function mergeHistory<T extends string>(histories:readonly (readonly T[])[],limit:number):T[]{
 let recent:T[]=[];
 for(const group of histories){const seen=new Set(group);recent=[...recent.filter(x=>!seen.has(x)),...group].slice(-limit);}
 return recent;
}
export function mergeHostHistories(stored:readonly Partial<SeenHistory>[],incoming:Partial<SeenHistory>):SeenHistory{
 const all=[...stored,incoming];
 return {
  recentQuestionIds:mergeHistory(all.map(x=>Array.isArray(x.recentQuestionIds)?x.recentQuestionIds:[]),historyLimit()),
  recentCategoryIds:mergeHistory(all.map(x=>Array.isArray(x.recentCategoryIds)?x.recentCategoryIds:[]),CATEGORIES.length),
  recentCategoryOffers:mergeHistory(all.map(x=>Array.isArray(x.recentCategoryOffers)?x.recentCategoryOffers:[]),CATEGORIES.length),
 };
}
