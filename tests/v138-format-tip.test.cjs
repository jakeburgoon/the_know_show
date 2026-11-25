const {test}=require('node:test'),assert=require('node:assert/strict');
const g=require('../.engine-build/game.js'),{nextFormatTip}=require('../.engine-build/answer-format-tip.js');
const host={kind:'host'},now=Date.UTC(2026,10,25,12);
test('new shows default to choices; both new joiners and explicitly configured written players get the correct format',()=>{
 let s=g.makeGame();assert.equal(s.settings.answerStyle,'choices');s=g.joinGame(s,'One').state;s=g.joinGame(s,'Two').state;assert.deepEqual(s.players.map(p=>p.choiceAccess),['all','all']);
 s=g.mutate(s,{type:'settings',settings:{answerStyle:'written'}},host,now);assert.deepEqual(s.players.map(p=>p.choiceAccess),['off','off']);
});
test('rematches preserve format until the host chooses a different one, including individual overrides',()=>{
 let s=g.makeGame();s=g.joinGame(s,'One').state;s=g.joinGame(s,'Two').state;s=g.mutate(s,{type:'settings',settings:{answerStyle:'choices'}},host,now);s=g.mutate(s,{type:'player-bonuses',playerId:s.players[0].id,choiceAccess:'off'},host,now);s.phase='finished';s=g.mutate(s,{type:'new-game'},host,now);assert.equal(s.settings.answerStyle,'choices');assert.deepEqual(s.players.map(p=>p.choiceAccess),['off','all']);s=g.mutate(s,{type:'settings',settings:{answerStyle:'mixed',mixedAccess:'medium-hard'}},host,now);assert.deepEqual(s.players.map(p=>p.choiceAccess),['medium-hard','medium-hard']);
});
test('Curtain Call suggestions match every common format and do not change settings',()=>{
 for(const [style,mix,expected] of [['choices','hard',/Easy questions.*Medium and Hard/],['mixed','medium-hard',/Easy and Medium.*Hard questions only/],['mixed','hard',/writing all your answers/],['written','hard',/more relaxed/],['individual','hard',/same mixture/]]){
 const settings={answerStyle:style,mixedAccess:mix},copy={...settings};assert.match(nextFormatTip(settings).text,expected);assert.deepEqual(settings,copy);
 }
});
