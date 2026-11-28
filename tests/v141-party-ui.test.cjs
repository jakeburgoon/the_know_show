const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const room=fs.readFileSync('src/components/ShowRoom.tsx','utf8');
test('both host lobby variants have a category picker, both draft views have a featured label and all capacity labels are dynamic',()=>{
 assert.equal((room.match(/<HostFeaturedPicker view=/g)||[]).length,2);assert.equal((room.match(/<FeaturedLabel\/>/g)||[]).length,3);assert.match(room,/★ Host featured/);assert.match(room,/set-featured-categories/);assert.doesNotMatch(room,/of 8 players joined|players\.length\}\/8/);assert.match(room,/ks-large-reveal/);assert.match(room,/ks-large-scores/);
});
test('host selection and start recheck database availability; optimistic update retry budgets account for 16 players',()=>{
 const action=fs.readFileSync('src/app/api/rooms/[code]/action/route.ts','utf8');const join=fs.readFileSync('src/app/api/rooms/[code]/join/route.ts','utf8');assert.match(action,/set-featured-categories[\s\S]*?readDisabledCategories\(\)/);assert.match(action,/start-draft[\s\S]*?readDisabledCategories\(\)/);assert.match(action,/attempt<32/);assert.match(join,/attempt<24/);
});
