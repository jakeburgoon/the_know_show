const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const page=fs.readFileSync('src/app/page.tsx','utf8');
const css=fs.readFileSync('src/app/globals.css','utf8');
const api=fs.readFileSync('src/app/api/rooms/route.ts','utf8');
test('landing has one logo, slim header without duplicate logo, guide link and approved tagline',()=>{
 assert.equal((page.match(/src="\/know-show-logo\.png"/g)||[]).length,1);
 assert.doesNotMatch(page,/v11landingbrand/);
 assert.match(page,/<header className="v11landingbar">/);
 assert.match(page,/Over 70 categories\. More than 1,000 questions\. A different show every time\./);
 assert.match(page,/className="v11howlink"><HelpCircle[^>]*\/> How to play<\/Link>/);
 assert.match(css,/\.v11landing \.v11showcase\{padding:20px 18px 18px/);
 assert.match(css,/\.v11landing \.v11entrygrid\{gap:12px;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:700px\)\{\s*\.v11landing \.v11showcase\{padding:17px/);
 assert.ok(page.indexOf('className="v11action v11actiongold"')<page.indexOf('ks-entry-features'));
});
test('hosting gate remains protected and passcode is requested only after rejection',()=>{
 assert.match(page,/\[needsPasscode,setNeedsPasscode\]=useState\(false\)/);
 assert.match(page,/if\(response\.status===403\)\{\s*setNeedsPasscode\(true\)/);
 assert.match(page,/\{needsPasscode&&<div className="ks-host-passcode">[\s\S]*?type="password"/);
 assert.match(page,/JSON\.stringify\(\{passcode,hostHistoryId/);
 assert.match(api,/if\(required && body\?\.passcode!==required\) return jsonError\('Room creation passcode is incorrect\.',403\)/);
 assert.match(page,/onSubmit=\{e=>\{e\.preventDefault\(\);void createRoom\(\);\}\}/);
});
test('QR join, manual player join code and host-history persistence are preserved',()=>{
 assert.match(page,/<QRJoinScanner onJoin=/);
 assert.match(page,/id="room-code"/);
 assert.match(page,/Join with code/);
 assert.match(page,/knowshow:hostHistoryId/);
 assert.match(page,/The Know Show v1\.13\.18/);
 assert.equal(JSON.parse(fs.readFileSync('package.json','utf8')).version,'1.13.18');
});
