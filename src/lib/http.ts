import { NextResponse } from 'next/server';
export function jsonError(message:string,status=400) {
  return NextResponse.json({error:message},{status,headers:{'Cache-Control':'no-store'}});
}
export const noStore = {'Cache-Control':'private, no-store, max-age=0'};
