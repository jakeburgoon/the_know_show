import {tagsForCategory} from './category-taxonomy';
import {db} from './db';
import {CATEGORIES,CATEGORY_LOOKUP} from './questions';
// Only server routes import this module. A database failure must not silently enable hidden content.
export async function readDisabledCategories():Promise<string[]> {
 const {data,error}=await db().from('know_show_category_availability').select('category_id').eq('enabled',false);
 if(error)throw error;
 return (data??[]).map(row=>String(row.category_id)).filter(id=>CATEGORY_LOOKUP.has(id));
}
export function categoryAvailability(disabled:string[]){
 return CATEGORIES.map(c=>({id:c.id,name:c.name,enabled:!disabled.includes(c.id),months:c.activeMonths??null,tags:tagsForCategory(c.id)})).sort((a,b)=>a.name.localeCompare(b.name));
}
