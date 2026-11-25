// Compile with strictNullChecks (the production tsconfig uses strict: true).
// This reproduces the exact hint-action contract that failed on Vercel.
import type { Action, GameView } from '../src/lib/game';
export function hintAction(active: NonNullable<GameView['active']>): Extract<Action,{type:'hint'}> {
  return {type:'hint',kind:active.myChoices?'fifty-fifty':'options',key:active.key};
}
