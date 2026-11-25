// Shared, testable UI calculations; the server independently validates purchases and wagers.
export function nextFinalHintCount(count:number,index:number):number {
 return index===0?(count>0?0:1):(count===2?1:2);
}
export function clampFinalWager(wager:number,balance:number):number {
 return Math.min(Math.max(0,balance),Math.max(0,Math.trunc(wager)));
}
