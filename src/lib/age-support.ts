/** Age bands, not birthdays. Only adults are included in age-based analytics. */
export const AGE_BANDS=['under-10','10-12','13-15','16-17','18-29','30-49','50-plus'] as const;
export type AgeBand=typeof AGE_BANDS[number];
export const AGE_LABELS:Record<AgeBand,string>={'under-10':'Under 10','10-12':'10–12','13-15':'13–15','16-17':'16–17','18-29':'18–29','30-49':'30–49','50-plus':'50+'};
export const AGE_SUPPORT={'under-10':'all','10-12':'all','13-15':'medium-hard','16-17':'hard','18-29':'off','30-49':'off','50-plus':'off'} as const;
export const ADULT_AGE_BANDS=['18-29','30-49','50-plus'] as const;
export type AdultAgeBand=typeof ADULT_AGE_BANDS[number];
export function isAgeBand(value:unknown):value is AgeBand{return typeof value==='string'&&(AGE_BANDS as readonly string[]).includes(value);}
export function isAdultAgeBand(value:unknown):value is AdultAgeBand{return typeof value==='string'&&(ADULT_AGE_BANDS as readonly string[]).includes(value);}
