import { randomInt, randomUUID } from 'node:crypto';
import { CATEGORIES, CATEGORY_LOOKUP, FINALS, cellKey, cellQuestion } from './questions';

export const MAX_SEATS = 8;
export const ROUND_NAMES = ['The Opening Act', 'The Main Event'] as const;
export const ROUND_VALUES = [[200, 400, 600, 800, 1000], [400, 800, 1200, 1600, 2000]] as const;
export type Phase = 'lobby'|'draft'|'board'|'clue'|'final-wager'|'final-answer'|'final-review'|'finished';
export type Mode = 'individual'|'teams';
export type MusicStyle = 'off'|'synth'|'keys'|'downtempo';
export type Settings = {
  mode: Mode; buzzSeconds: number; answerSeconds: number; finalSeconds: number;
  normalHints: number; music: MusicStyle;
};
export type Player = { id: string; name: string; age: number; score: number; hintsRemaining: number; joinedAt: number; bonusHints: number; buzzBonusSeconds: number; };
export type Attempt = { playerId: string; answer: string; verdict: 'correct'|'wrong'|'timed-out'; at: number };
export type ActiveClue = {
  key: string; startedAt: number; buzzOpenedAt: number; status: 'buzzing'|'answering'|'ruling';
  buzzedBy?: string; responseDeadlineAt?: number; submittedAnswer?: string;
  attempts: Attempt[]; hintUsers: string[]; revealed: boolean;
};
export type Resolution = { key: string; prompt: string; answer: string; explainer: string; points: number; wasDoubleTake: boolean; winner?: string; outcome: 'correct'|'passed' };
export type FinalState = { id: string; wagers: Record<string,number>; answers: Record<string,string>; judgments: Record<string,boolean>; startedAt?: number; };
export type GameState = {
  id: string; createdAt: number; phase: Phase; settings: Settings;
  players: Player[]; round: 0|1; selected: [string[],string[]]; draftIndex: number;
  usedKeys: string[]; doubleTakeKeys: [string,string]; chooserId?: string;
  clue?: ActiveClue; lastResolution?: Resolution; final?: FinalState;
  announcement?: string; eventLog: string[];
};
export type Actor = {kind:'host'|'player'|'spectator';id?:string};
export type Action =
  | {type:'settings';settings:Partial<Settings>}
  | {type:'player-bonuses';playerId:string;bonusHints?:number;buzzBonusSeconds?:number}
  | {type:'start-draft'}
  | {type:'draft-category';categoryId:string}
  | {type:'open-clue';key:string}
  | {type:'buzz'}
  | {type:'hint'}
  | {type:'submit-answer';answer:string}
  | {type:'rule';verdict:'correct'|'wrong'|'timed-out'}
  | {type:'reveal-answer'}
  | {type:'close-clue'}
  | {type:'advance-round'}
  | {type:'start-final'}
  | {type:'wager';amount:number}
  | {type:'open-final'}
  | {type:'final-answer';answer:string}
  | {type:'review-final'}
  | {type:'judge-final';playerId:string;correct:boolean}
  | {type:'finish'}
  | {type:'new-game'};

export class GameError extends Error { constructor(message: string) { super(message); this.name='GameError'; } }
function requireRule(ok: unknown, message: string): asserts ok { if (!ok) throw new GameError(message); }
const randomFrom = <T,>(items: T[]): T => items[randomInt(items.length)];
const lowestAge = (players: Player[]) => Math.min(...players.map(p=>p.age));
// Every player can be given individual accommodations by the host, independent of age.
const totalHints = (p:Player,settings:Settings) => settings.normalHints + (p.bonusHints ?? 0);
function largestBuzzBonus(s:GameState,clue:ActiveClue):number {
  return Math.max(0,...s.players.filter(x=>!clue.attempts.some(a=>a.playerId===x.id)).map(x=>x.buzzBonusSeconds??0));
}
function buzzWindowEndsAt(s:GameState,clue:ActiveClue):number|undefined {
  // Give everyone the whole standard buzz window AFTER the last buzzer unlocks.
  return s.settings.buzzSeconds>0?clue.buzzOpenedAt+(largestBuzzBonus(s,clue)+s.settings.buzzSeconds)*1000:undefined;
}
function buzzEligibleAt(s:GameState,clue:ActiveClue,p:Player): number {
  // A new buzz window (including after a wrong answer) begins at the same moment
  // for all remaining players, but their assigned bonus offsets their waiting time.
  const largest=largestBuzzBonus(s,clue);
  return clue.buzzOpenedAt+Math.max(0,largest-(p.buzzBonusSeconds??0))*1000;
}
const shortName = (name:string) => name.trim().replace(/\s+/g,' ').slice(0,28);

export function defaultSettings(): Settings {
  return {mode:'individual',buzzSeconds:20,answerSeconds:30,finalSeconds:60,normalHints:3,music:'off'};
}
export function makeGame(): GameState {
  return {id:randomUUID(),createdAt:Date.now(),phase:'lobby',settings:defaultSettings(),players:[],round:0,
    selected:[[],[]],draftIndex:0,usedKeys:[],doubleTakeKeys:['',''],eventLog:[]};
}
export function joinGame(current:GameState,name:string,age:number,now=Date.now()):{state:GameState;player:Player} {
  requireRule(current.phase==='lobby','Joining is closed once the category draft begins.');
  requireRule(current.players.length < MAX_SEATS,`This version supports up to ${MAX_SEATS} players or teams.`);
  requireRule(Number.isInteger(age)&&age>=3&&age<=110,'Enter an age between 3 and 110. For teams, enter the youngest teammate’s age.');
  const clean = shortName(name);
  requireRule(clean.length>=2,'Enter a name with at least two characters.');
  requireRule(!current.players.some(p=>p.name.toLowerCase()===clean.toLowerCase()),'That name is already taken.');
  const state:GameState = structuredClone(current);
  const player:Player = {id:randomUUID(),name:clean,age,score:0,hintsRemaining:state.settings.normalHints,joinedAt:now,bonusHints:0,buzzBonusSeconds:0};
  state.players.push(player);
  state.announcement=`${clean} joined the show!`;
  return {state,player};
}
const pushLog = (s:GameState,line:string) => {s.eventLog=[line,...s.eventLog].slice(0,30);s.announcement=line;};
const hostOnly=(actor:Actor) => requireRule(actor.kind==='host','Only the host can do that.');
const activePlayer=(s:GameState,actor:Actor):Player => {
  requireRule(actor.kind==='player'&&!!actor.id,'Join as a player or team to do that.');
  const p=s.players.find(p=>p.id===actor.id);
  requireRule(p,'Player not found in this game.');
  return p;
};
export function getPoints(s:GameState,key:string):number {
  const n=Number(key.split(':')[1]);
  const base=ROUND_VALUES[s.round][n];
  return Number(base||0)*(s.doubleTakeKeys[s.round]===key?2:1);
}
export function normalizeAnswer(input:string):string {
  return input.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
    .replace(/^[\s]*(?:(?:what|who|where|which)\s+(?:is|are|was|were)\s+|(?:its|it is|the answer is)\s+)/,'')
    .replace(/[’']/g,'').replace(/\b(?:a|an|the)\b/g,' ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
}
function editDistance(a:string,b:string) {
  const prev=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++) { let last=prev[0];prev[0]=i;
    for(let j=1;j<=b.length;j++) {const tmp=prev[j];prev[j]=Math.min(prev[j]+1,prev[j-1]+1,last+(a[i-1]===b[j-1]?0:1));last=tmp;}
  } return prev[b.length];
}
export function suggestVerdict(given:string,answer:string,aliases:string[]=[]):'likely correct'|'possible match'|'likely incorrect' {
  const v=normalizeAnswer(given); if(!v)return 'likely incorrect';
  const expected=[answer,...aliases].map(normalizeAnswer);
  if(expected.some(e=>e===v))return 'likely correct';
  if(expected.some(e=>e.length>=5 && (e.includes(v)||v.includes(e))))return 'possible match';
  if(expected.some(e=>e.length>=6 && editDistance(e,v)<=2))return 'possible match';
  return 'likely incorrect';
}
function closeClue(s:GameState,winner?:string) {
  const clue=s.clue!;const q=cellQuestion(clue.key)!;
  s.usedKeys.push(clue.key);
  s.lastResolution={key:clue.key,prompt:q.prompt,answer:q.answer,explainer:CATEGORY_LOOKUP.get(clue.key.split(':')[0])!.explainer,
    points:getPoints(s,clue.key),wasDoubleTake:s.doubleTakeKeys[s.round]===clue.key,winner,outcome:winner?'correct':'passed'};
  s.phase='board';s.clue=undefined;
}
function judgeWrong(s:GameState,verdict:'wrong'|'timed-out',now:number) {
  const clue=s.clue!;const player=s.players.find(p=>p.id===clue.buzzedBy)!;
  const points=getPoints(s,clue.key);
  player.score-=points;
  clue.attempts.push({playerId:player.id,answer:clue.submittedAnswer||'(no answer)',verdict,at:now});
  pushLog(s,`${player.name} ${verdict==='timed-out'?'ran out of time':'missed'} (−${points}). Others can buzz.`);
  clue.status='buzzing';clue.buzzOpenedAt=now;clue.buzzedBy=undefined;clue.responseDeadlineAt=undefined;clue.submittedAnswer=undefined;
  if(s.players.every(p=>clue.attempts.some(a=>a.playerId===p.id))) { closeClue(s); pushLog(s,'All players have tried. The answer is revealed.'); }
}
export function mutate(original:GameState,action:Action,actor:Actor,now=Date.now()):GameState {
  requireRule(action && typeof action==='object' && typeof action.type==='string','Invalid game action.');
  const s:GameState=structuredClone(original);
  switch(action.type) {
    case 'settings': {
      hostOnly(actor); requireRule(s.phase==='lobby','Change settings before the game starts.');
      const a=action.settings;
      requireRule(a&&typeof a==='object'&&!Array.isArray(a),'Invalid settings.');
      if(a.mode!==undefined){requireRule(a.mode==='individual'||a.mode==='teams','Invalid play mode.');s.settings.mode=a.mode;}
      const numbers:[keyof Pick<Settings,'buzzSeconds'|'answerSeconds'|'finalSeconds'|'normalHints'>,number,number][]=[
        ['buzzSeconds',0,120],['answerSeconds',0,180],['finalSeconds',0,300],['normalHints',0,10]];
      numbers.forEach(([k,min,max])=>{ const v=a[k];if(v!==undefined){requireRule(Number.isInteger(v)&&v>=min&&v<=max,`Invalid ${k}.`);s.settings[k]=v;}});
      if(a.music!==undefined){requireRule(['off','synth','keys','downtempo'].includes(a.music),'Invalid music choice.');s.settings.music=a.music;}
      s.players.forEach(p=>p.hintsRemaining=totalHints(p,s.settings));
      break;
    }
    case 'player-bonuses': {
      hostOnly(actor);requireRule(s.phase==='lobby','Assign bonuses before the category draft begins.');
      const p=s.players.find(x=>x.id===action.playerId);
      requireRule(p,'Player not found.');
      requireRule(action.bonusHints!==undefined||action.buzzBonusSeconds!==undefined,'Choose a bonus to change.');
      if(action.bonusHints!==undefined){
        requireRule(Number.isInteger(action.bonusHints)&&action.bonusHints>=0&&action.bonusHints<=20,'Bonus hints must be between 0 and 20.');
        p.bonusHints=action.bonusHints;
      }
      if(action.buzzBonusSeconds!==undefined){
        requireRule(Number.isInteger(action.buzzBonusSeconds)&&action.buzzBonusSeconds>=0&&action.buzzBonusSeconds<=30,'Buzz head start must be between 0 and 30 seconds.');
        p.buzzBonusSeconds=action.buzzBonusSeconds;
      }
      p.hintsRemaining=totalHints(p,s.settings);
      break;
    }
    case 'start-draft': {
      hostOnly(actor);requireRule(s.phase==='lobby','The show has already started.');requireRule(s.players.length>=2,'At least two players or teams are needed.');
      s.players.forEach(p=>{p.bonusHints??=0;p.buzzBonusSeconds??=0;p.hintsRemaining=totalHints(p,s.settings);});
      s.phase='draft';s.chooserId=s.players[0].id;pushLog(s,'Category draft is open. Players choose one category per turn across both rounds.');break;
    }
    case 'draft-category': {
      requireRule(s.phase==='draft','It is not time to choose categories.');
      const id=String(action.categoryId||'');requireRule(CATEGORY_LOOKUP.has(id),'Unknown category.');
      requireRule(![...s.selected[0],...s.selected[1]].includes(id),'That category has already been picked.');
      const who=s.players[s.draftIndex%s.players.length];
      requireRule(actor.kind==='host'||(actor.kind==='player'&&actor.id===who.id),`It’s ${who.name}’s turn to pick.`);
      const round=s.selected[0].length<6?0:1;
      s.selected[round].push(id);s.draftIndex++;
      pushLog(s,`${who.name} selected ${CATEGORY_LOOKUP.get(id)!.name} for ${ROUND_NAMES[round]}.`);
      if(s.selected[1].length===6){
        s.doubleTakeKeys=[0,1].map(r=>cellKey(randomFrom(s.selected[r as 0|1]),randomInt(5))) as [string,string];
        s.phase='board';s.round=0;s.chooserId=s.players[0].id;
        pushLog(s,`${ROUND_NAMES[0]} begins!`);
      }break;
    }
    case 'open-clue': {
      requireRule(s.phase==='board','Finish the current clue before opening another.');
      requireRule(actor.kind==='host'||(actor.kind==='player'&&actor.id===s.chooserId),'It is not your turn to choose a question.');
      const key=String(action.key||'');const [id,levelStr]=key.split(':');const level=Number(levelStr);
      requireRule(s.selected[s.round].includes(id)&&Number.isInteger(level)&&level>=0&&level<5,'Choose a clue from this board.');
      requireRule(!s.usedKeys.includes(key),'This clue was already played.');
      s.clue={key,startedAt:now,buzzOpenedAt:now,status:'buzzing',attempts:[],hintUsers:[],revealed:false};s.phase='clue';
      pushLog(s,`${CATEGORY_LOOKUP.get(id)!.name} for ${getPoints(s,key)}${s.doubleTakeKeys[s.round]===key?' — DOUBLE TAKE!':''}`);
      break;
    }
    case 'buzz': {
      const p=activePlayer(s,actor);requireRule(s.phase==='clue'&&!!s.clue&&s.clue.status==='buzzing','Buzzing is not open right now.');
      const c=s.clue;
      requireRule(!c.attempts.some(a=>a.playerId===p.id),'You already attempted this clue.');
      const buzzEnd=buzzWindowEndsAt(s,c);
      if(buzzEnd) requireRule(now<=buzzEnd,'The buzz window has closed.');
      requireRule(now>=buzzEligibleAt(s,c,p),'Your buzzer is not open yet. The host assigned a head start to another player.');
      c.buzzedBy=p.id;c.status='answering';
      c.responseDeadlineAt=s.settings.answerSeconds?now+s.settings.answerSeconds*1000:undefined;
      pushLog(s,`${p.name} buzzed first!`);break;
    }
    case 'hint': {
      const p=activePlayer(s,actor);
      requireRule(s.phase==='clue'&&s.clue?.status==='answering'&&s.clue.buzzedBy===p.id,'Hints are available only while answering your clue.');
      requireRule(p.hintsRemaining>0,'You have no hints remaining.');
      requireRule(!s.clue.hintUsers.includes(p.id),'You already used a hint on this clue.');
      p.hintsRemaining--;s.clue.hintUsers.push(p.id);pushLog(s,`${p.name} used a hint.`);break;
    }
    case 'submit-answer': {
      const p=activePlayer(s,actor);
      requireRule(s.phase==='clue'&&s.clue?.status==='answering'&&s.clue.buzzedBy===p.id,'You do not have the active clue.');
      if(s.clue.responseDeadlineAt)requireRule(now<=s.clue.responseDeadlineAt,'Your answer time has expired. Ask the host to rule.');
      const answer=String(action.answer||'').trim().slice(0,200);
      requireRule(answer.length>0,'Type an answer first.');s.clue.submittedAnswer=answer;s.clue.status='ruling';
      pushLog(s,`${p.name} submitted an answer. Host ruling needed.`);break;
    }
    case 'rule': {
      hostOnly(actor);requireRule(s.phase==='clue'&&!!s.clue,'No active clue.');
      const c=s.clue;requireRule(!!c.buzzedBy,'No current contestant.');
      requireRule(c.status==='ruling'||(action.verdict==='timed-out'&&c.status==='answering'),'Wait for an answer or rule a timeout.');
      requireRule(['correct','wrong','timed-out'].includes(action.verdict),'Invalid ruling.');
      const p=s.players.find(p=>p.id===c.buzzedBy)!;
      if(action.verdict==='correct') {
        const points=getPoints(s,c.key);p.score+=points;
        c.attempts.push({playerId:p.id,answer:c.submittedAnswer||'',verdict:'correct',at:now});
        closeClue(s,p.id);s.chooserId=p.id;pushLog(s,`${p.name} is correct! +${points}.`);
      } else judgeWrong(s,action.verdict,now);
      break;
    }
    case 'reveal-answer': {
      hostOnly(actor);requireRule(s.phase==='clue'&&!!s.clue,'No active clue.');s.clue.revealed=true;pushLog(s,'The answer has been revealed.');break;
    }
    case 'close-clue': {
      hostOnly(actor);requireRule(s.phase==='clue'&&!!s.clue,'No active clue.');closeClue(s);pushLog(s,'Clue closed. Answer revealed.');break;
    }
    case 'advance-round': {
      hostOnly(actor);requireRule(s.phase==='board'&&s.round===0,'Finish the current clue in the first round.');
      s.round=1;s.lastResolution=undefined;s.chooserId=s.players[0].id;pushLog(s,`${ROUND_NAMES[1]} begins!`);break;
    }
    case 'start-final': {
      hostOnly(actor);requireRule(s.phase==='board'&&s.round===1,'Finish the current clue in the second round.');
      const youngest=lowestAge(s.players);const tier=youngest<=12?'family':youngest<=16?'teen':'adult';
      const pool=FINALS.filter(f=>f.tier===tier);const question=randomFrom(pool);
      s.final={id:question.id,wagers:{},answers:{},judgments:{}};s.phase='final-wager';s.lastResolution=undefined;
      pushLog(s,'The Final Word! Submit your private wagers.');break;
    }
    case 'wager': {
      const p=activePlayer(s,actor);requireRule(s.phase==='final-wager'&&!!s.final,'Wagering is not open.');
      const amount=action.amount;requireRule(Number.isInteger(amount)&&amount>=0&&amount<=Math.max(0,p.score),`Your wager must be between 0 and ${Math.max(0,p.score)}.`);
      s.final.wagers[p.id]=amount;break;
    }
    case 'open-final': {
      hostOnly(actor);requireRule(s.phase==='final-wager'&&!!s.final,'Final wagering is not active.');
      s.players.forEach(p=>{if(s.final!.wagers[p.id]===undefined)s.final!.wagers[p.id]=0;});
      s.final.startedAt=now;s.phase='final-answer';pushLog(s,'Final question is live!');break;
    }
    case 'final-answer': {
      const p=activePlayer(s,actor);requireRule(s.phase==='final-answer'&&!!s.final,'The final question is not open.');
      if(s.settings.finalSeconds>0) requireRule(now<=s.final.startedAt!+s.settings.finalSeconds*1000,'Final answer time has expired.');
      requireRule(s.final.answers[p.id]===undefined,'You already locked an answer.');
      const answer=String(action.answer||'').trim().slice(0,200);requireRule(answer.length>0,'Enter an answer first.');
      s.final.answers[p.id]=answer;break;
    }
    case 'review-final': {
      hostOnly(actor);requireRule(s.phase==='final-answer'&&!!s.final,'The final question has not been presented.');
      s.phase='final-review';pushLog(s,'The final answers are ready for judging.');break;
    }
    case 'judge-final': {
      hostOnly(actor);requireRule(s.phase==='final-review'&&!!s.final,'Final judging is not open.');
      const id=String(action.playerId||'');const p=s.players.find(p=>p.id===id);requireRule(p,'Player not found.');
      requireRule(typeof action.correct==='boolean','Choose correct or incorrect.');
      const wager=s.final.wagers[id]??0;
      if(s.final.judgments[id]!==undefined)p.score-=s.final.judgments[id]?wager:-wager;
      s.final.judgments[id]=action.correct;p.score+=action.correct?wager:-wager;
      pushLog(s,`${p.name} was ruled ${action.correct?'correct':'incorrect'} (${action.correct?'+':'−'}${wager}).`);break;
    }
    case 'finish': {
      hostOnly(actor);requireRule(s.phase==='final-review'&&!!s.final,'Finish judging the final first.');
      requireRule(s.players.every(p=>s.final!.judgments[p.id]!==undefined),'Judge every player before finishing.');
      s.phase='finished';const leaders=[...s.players].sort((a,b)=>b.score-a.score);
      pushLog(s,`The Know Show is over! ${leaders.filter(p=>p.score===leaders[0].score).map(p=>p.name).join(' & ')} ${leaders.filter(p=>p.score===leaders[0].score).length===1?'wins':'tie for first'}!`);break;
    }
    case 'new-game': {
      hostOnly(actor);requireRule(s.phase==='finished','Finish the current show before starting another.');
      const reset=makeGame();reset.id=s.id;reset.createdAt=s.createdAt;reset.settings=s.settings;
      reset.players=s.players.map(p=>({...p,score:0,bonusHints:p.bonusHints??0,buzzBonusSeconds:p.buzzBonusSeconds??0,hintsRemaining:totalHints(p,reset.settings)}));
      pushLog(reset,'New show! Adjust settings and start the category draft.');return reset;
    }
    default: throw new GameError('Unknown action type.');
  }
  return s;
}

export function makeView(s:GameState,actor:Actor,revision:number,now=Date.now()) {
  const isHost=actor.kind==='host';
  const self=actor.kind==='player'?s.players.find(p=>p.id===actor.id):undefined;
  // Age guides the category draft as a recommendation only: players retain the final choice.
  // Low-tier questions are easier throughout the board; Final Word has age-specific pools.
  const familyIds=new Set(['animals','movies','colors','games','sports','food','counting','literally','classroom','music','myths','oceans','nature','space','books','rhyme']);
  const teenIds=new Set(['space','world','words','history','science','movies','music','math','sports','books','nature','tech','myths','inventions','usa','earth','counting']);
  const adultIds=new Set(['world','words','history','science','music','math','tech','landmarks','misleading','inventions','usa','earth','body','space','sports']);
  const youngestAge=s.players.length?lowestAge(s.players):18;
  const recommended=youngestAge<=12?familyIds:youngestAge<=16?teenIds:adultIds;
  const catBasics=CATEGORIES.map(c=>({id:c.id,name:c.name,explainer:c.explainer,
    suggested:recommended.has(c.id)}));
  const question=s.clue?cellQuestion(s.clue.key):null;
  const active=s.clue;
  const meEligibleAt=active&&self?buzzEligibleAt(s,active,self):undefined;
  const clue=active&&question?{
    key:active.key,prompt:question.prompt,points:getPoints(s,active.key),wasDoubleTake:s.doubleTakeKeys[s.round]===active.key,
    category:CATEGORY_LOOKUP.get(active.key.split(':')[0])!.name,
    explainer:CATEGORY_LOOKUP.get(active.key.split(':')[0])!.explainer,
    startedAt:active.startedAt,buzzOpenedAt:active.buzzOpenedAt,status:active.status,buzzedBy:active.buzzedBy,
    responseDeadlineAt:active.responseDeadlineAt,buzzDeadlineAt:buzzWindowEndsAt(s,active),
    attempts:active.attempts.map(a=>({playerId:a.playerId,verdict:a.verdict})),
    meEligibleAt,meHint: (isHost || (self&&active.hintUsers.includes(self.id))) ? question.hint : undefined,
    submittedAnswer: isHost||(self?.id===active.buzzedBy)?active.submittedAnswer:undefined,
    suggested: isHost&&active.submittedAnswer ? suggestVerdict(active.submittedAnswer,question.answer,question.aliases) : undefined,
    answer: isHost||active.revealed?question.answer:undefined,
  }:null;
  const finalQ=s.final?FINALS.find(f=>f.id===s.final?.id):undefined;
  const finals=s.final&&finalQ?{
    category:finalQ.category,
    prompt:['final-answer','final-review','finished'].includes(s.phase)?finalQ.prompt:undefined,
    startedAt:s.final.startedAt,
    answer:isHost||s.phase==='finished'?finalQ.answer:undefined,
    wagerCount:Object.keys(s.final.wagers).length,
    answerCount:Object.keys(s.final.answers).length,
    myWager:self?s.final.wagers[self.id]:undefined,
    myAnswer:self?s.final.answers[self.id]:undefined,
    review:s.phase==='final-review'||s.phase==='finished' ? s.players.map(p=>({id:p.id,name:p.name,
      wager:isHost||s.phase==='finished'?s.final!.wagers[p.id]||0:undefined,
      answer:isHost||s.phase==='finished'?s.final!.answers[p.id]??'(no answer)':undefined,
      suggested:isHost ? suggestVerdict(s.final!.answers[p.id]||'',finalQ.answer,finalQ.aliases):undefined,
      judged:isHost||s.phase==='finished'?s.final!.judgments[p.id]:undefined,
    })) : undefined,
  }:undefined;
  const draftTurn=s.phase==='draft'&&s.players.length?s.players[s.draftIndex%s.players.length]:undefined;
  return {
    revision,serverNow:now,roomId:s.id,phase:s.phase,role:actor,settings:s.settings,
    players:s.players,round:s.round,roundNames:ROUND_NAMES,roundValues:ROUND_VALUES,
    selected:s.selected,usedKeys:s.usedKeys,chooserId:s.chooserId,announcement:s.announcement,
    eventLog:s.eventLog.slice(0,10),categories:catBasics,draftTurnId:draftTurn?.id,draftTurnName:draftTurn?.name,
    draftIndex:s.draftIndex,clue,lastResolution:s.lastResolution,final:finals,
    myHints:self?.hintsRemaining,
  };
}
export type GameView = ReturnType<typeof makeView>;
