/** Final ranks use competition ranking: equal scores share the same place (1, 1, 3). */
export function finalStandings<T extends {id:string;name:string;score:number}>(players:readonly T[]){
 const sorted=[...players].sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
 const winningScore=sorted[0]?.score;
 const winners=sorted.filter(p=>p.score===winningScore);
 const standings=sorted.map(p=>({player:p,place:1+sorted.filter(other=>other.score>p.score).length,isWinner:p.score===winningScore}));
 return {winners,standings,tied:winners.length>1};
}
