const {test}=require('node:test');
const assert=require('node:assert/strict');
const bank=require('../src/lib/question-bank.json');
const finals=require('../src/lib/final-category-bank.json');
const fs=require('node:fs');
const byid=new Map(bank.categories.map(c=>[c.id,c]));
const specs=[['no-show',null,4],['christmas-lore',[11,12],6],['creepy-creatures',[10,11],6]];
const allQuestions=bank.categories.flatMap(c=>Object.values(c.questionsByLevel).flat());
const norm=x=>x.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g,'');
test('current library reaches the accurate 1,076 question count',()=>{
 assert.equal(bank.categories.length,76);assert.equal(allQuestions.length,999);assert.equal(finals.length,77);
 assert.equal(allQuestions.length+finals.length,1076);
});
test('new categories have correct seasonal windows and balanced difficulty',()=>{
 for(const [id,months,count] of specs){const c=byid.get(id);assert.ok(c,id);assert.deepEqual(c.activeMonths||null,months);for(const level of ['1','2','3'])assert.equal(c.questionsByLevel[level].length,count,id+level);}
});
test('new options are distinct, hints informative and links present',()=>{
 for(const [id] of specs){let c=byid.get(id);for(const q of Object.values(c.questionsByLevel).flat()){
  assert.equal(q.distractors.length,3,q.id);assert.equal(new Set([q.answer,...q.distractors].map(norm)).size,4,q.id);
  assert.ok(q.hint.length>=25,q.id);assert.ok(q.sourceUrl.startsWith('https://'),q.id);
 }}
});
test('one reserved final per category with two hints and no regular-answer overlap',()=>{
 let regularAnswers=new Set(allQuestions.map(q=>norm(q.answer)));
 for(const [id] of specs){let f=finals.filter(q=>q.categoryId===id);assert.equal(f.length,1,id);
  assert.equal(f[0].hints.length,2);assert.ok(f[0].hints.every(h=>h.length>=25));
  assert.ok(!regularAnswers.has(norm(f[0].answer)),f[0].answer);
 }
});
test('homepage and guide include both milestone claims',()=>{
 const page=fs.readFileSync('src/app/page.tsx','utf8');const guide=fs.readFileSync('src/app/guide/page.tsx','utf8');
 assert.match(page,/over 70 categories/);assert.match(page,/Over 1,000 questions/);
 assert.match(guide,/over 70 categories/);assert.match(guide,/over 1,000 questions/);
});
