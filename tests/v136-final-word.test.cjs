const {test}=require('node:test');const assert=require('node:assert/strict');
const g=require('../.engine-build/game.js'),b=require('../.engine-build/questions.js');
const archived=['math','counting','three','rhyme','misleading','before-after','finish-that-lyric','christmas-sing-along'];
const now=Date.parse('2026-11-25T16:00:00Z'),host={kind:'host'};
function ready(){let s=g.makeGame();s=g.joinGame(s,'One').state;s=g.joinGame(s,'Two').state;return s;}
test('all 77 category finals have topic previews and ordered distinct clues; eight archived categories retain their regular questions',()=>{
 assert.equal(b.CATEGORY_FINALS.length,77);assert.equal(b.ELIGIBLE_CATEGORY_FINALS.length,69);
 assert.deepEqual(b.CATEGORY_FINALS.filter(q=>q.finalEligible===false).map(q=>q.categoryId).sort(),archived.sort());
 for(const q of b.CATEGORY_FINALS){assert.ok(q.topicPreview.length>=15,q.id);assert.equal(q.hint,q.hints[0]);assert.equal(q.hints.length,2);assert.notEqual(q.hints[0],q.hints[1]);for(const clue of [q.topicPreview,...q.hints])assert.ok(!clue.toLowerCase().includes(q.answer.toLowerCase()),q.id);assert.equal(typeof q.finalEligible,'boolean');if(!q.finalEligible)assert.ok(q.finalExclusionReason);}
 for(const id of archived)assert.ok(b.CATEGORY_LOOKUP.get(id).questionsByLevel['1'].length>=4);
 assert.ok(b.ELIGIBLE_CATEGORY_FINALS.some(q=>q.categoryId==='flags-world'));
});
test('all twelve months exclude archived categories, disabled categories and both boards, including exhausted history',()=>{
 for(let month=0;month<12;month++){const at=Date.UTC(2026,month,15,16),s=ready();s.selected=[['space','animals','world','words'],['history','science','music','movies']];s.disabledCategoryIds=['flags-world','famous-landmarks'];const candidates=g.finalCandidates(s,at);assert.ok(candidates.length>0);const allowed=new Set(candidates.map(q=>q.id));for(const q of candidates){assert.ok(q.finalEligible);assert.ok(!s.selected.flat().includes(q.categoryId));assert.ok(!s.disabledCategoryIds.includes(q.categoryId));assert.ok(b.availableCategories(new Date(at)).some(c=>c.id===q.categoryId));}for(let i=0;i<candidates.length;i++){const q=g.chooseFinalQuestion(s,at);assert.ok(allowed.delete(q.id));s.recentQuestionIds.push(q.id);}assert.equal(allowed.size,0);assert.ok(candidates.some(q=>q.id===g.chooseFinalQuestion(s,at).id));}
});
test('minimum enabled eligible year-round categories protects finale availability after eight board selections',()=>{
 const s=ready(),year=b.CATEGORIES.filter(c=>!c.activeMonths),eligible=year.filter(c=>b.ELIGIBLE_CATEGORY_FINALS.some(q=>q.categoryId===c.id));const keep=[...eligible.slice(0,8),...year.filter(c=>archived.includes(c.id)).slice(0,4)].map(c=>c.id);s.disabledCategoryIds=b.CATEGORIES.filter(c=>!keep.includes(c.id)).map(c=>c.id);assert.throws(()=>g.mutate(s,{type:'start-draft'},host,now),/At least 9 year-round Final Word eligible/);
});
test('topic previews are public at wagering while the image, question, answer and purchased hints remain private until their appropriate phase',()=>{
 let s=ready(),q=b.CATEGORY_FINALS.find(q=>q.categoryId==='flags-world'),a={kind:'player',id:s.players[0].id},z={kind:'player',id:s.players[1].id};s.players[0].score=1500;s.final={id:q.id,wagers:{},answers:{},disputeIds:[]};s.phase='final-wager';s=g.mutate(s,{type:'buy-final-hint'},a,now);
 for(const actor of [a,z,host,{kind:'spectator'}]){const f=g.makeView(s,actor,1,now).final;assert.equal(f.topicPreview,q.topicPreview);assert.equal(f.prompt,undefined);assert.equal(f.image,undefined);assert.equal(f.answer,undefined);assert.deepEqual(f.myRevealedHints,[]);}
 s=g.mutate(s,{type:'start-final'},host,now+1);assert.deepEqual(g.makeView(s,a,1,now+1).final.myRevealedHints,[q.hints[0]]);assert.deepEqual(g.makeView(s,z,1,now+1).final.myRevealedHints,[]);assert.equal(g.makeView(s,a,1,now+1).final.prompt,q.prompt);
});
