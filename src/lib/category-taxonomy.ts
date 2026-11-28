import taxonomy from './category-taxonomy.json';
export const SUPER_CATEGORIES=taxonomy.superCategories;
const categoryTags:Record<string,string[]>=taxonomy.categoryTags;
const questionExtraTags:Record<string,string[]>=taxonomy.questionExtraTags;
export function tagsForCategory(id:string):string[]{return [...(categoryTags[id]??[])];}
export function tagsForQuestion(categoryId:string,id:string,extra:string[]=[]):string[]{return [...new Set([...tagsForCategory(categoryId),...(questionExtraTags[id]??[]),...extra])];}
export function tagNames(tags:readonly string[]):string[]{return tags.map(id=>SUPER_CATEGORIES.find(t=>t.id===id)?.name??id);}
