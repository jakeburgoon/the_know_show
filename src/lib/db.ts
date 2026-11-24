import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'node:crypto';
import {exposureJournal} from './exposure';
import type {GameState} from './game';

export type RoomRow = {
  code: string;
  host_token_hash: string;
  snapshot: unknown;
  revision: number;
};

export function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newRoomCode(): string {
  return Array.from(randomBytes(6), b => alphabet[b % alphabet.length]).join('');
}
export async function getRoom(code: string): Promise<RoomRow | null> {
  const {data,error} = await db().from('know_show_rooms')
    .select('code,host_token_hash,snapshot,revision').eq('code',code).maybeSingle();
  if (error) throw error;
  return data as RoomRow | null;
}
export async function updateRoom(row: RoomRow, snapshot: unknown, historyBase?:GameState): Promise<boolean> {
  const journal=exposureJournal(historyBase??row.snapshot as GameState,snapshot as GameState);
  const {data,error}=await db().rpc('ks_commit_room_exposure',{p_code:row.code,p_revision:row.revision,p_snapshot:snapshot,p_journal:journal});
  if(error)throw error;
  return data===true;
}
export function headerToken(request: Request): string {
  const auth = request.headers.get('authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : '';
}
export async function getRole(row: RoomRow, request: Request): Promise<{kind:'host'|'player'|'spectator'; id?:string}> {
  const token = headerToken(request);
  if (!token) return {kind:'spectator'};
  const hash = tokenHash(token);
  if (hash === row.host_token_hash) return {kind:'host'};
  const {data,error} = await db().from('know_show_members').select('id')
    .eq('room_code',row.code).eq('token_hash',hash).maybeSingle();
  if (error) throw error;
  if (data) return {kind:'player',id:data.id};
  return {kind:'spectator'};
}
