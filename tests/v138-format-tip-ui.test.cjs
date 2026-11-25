const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const wizard=fs.readFileSync('src/components/HostWizard.tsx','utf8'),room=fs.readFileSync('src/components/ShowRoom.tsx','utf8'),css=fs.readFileSync('src/app/globals.css','utf8');
test('setup recommendation is visible only on the Everyone chooses option, which is listed first',()=>{assert.match(wizard,/value:'choices',title:'Everyone chooses'[^\n]*recommendation:'Recommended for your first show'/);assert.ok(wizard.indexOf("value:'choices'")<wizard.indexOf("value:'written'"));assert.match(wizard,/opt\.recommendation&&<span className="ks-format-recommendation">/);assert.match(wizard,/The final question requires a written answer from everyone/);assert.match(css,/\.ks-wizard-option \.ks-format-recommendation/);});
test('Curtain Call suggestion is visible to host and players and rematch revisits the third setup question',()=>{assert.match(room,/if\(view\.phase==='finished'\)\{const formatTip=nextFormatTip\(view.settings\)/);assert.match(room,/ks-next-format-tip[\s\S]*?formatTip.title[\s\S]*?formatTip.text/);assert.match(room,/Ask your host about trying a different answer format next show/);assert.match(room,/type:'new-game'\},hostToken\)\)\{setSetupStep\(2\)/);assert.match(css,/\.ks-aftershow \.ks-next-format-tip/);});

test('Green Room summarizes selected format, hides common-format controls by default and shows overrides',()=>{
 const panel=room.slice(room.indexOf('function PlayerAnswerSupport'),room.indexOf('function RoomMusicMenu'));
 assert.match(room,/Answer format: \{formatSummary.title\}/);
 assert.match(panel,/!summary.individual&&PLAYER_SUPPORT\[level\]!==summary.defaultAccess&&<small>Customized/);
 assert.match(panel,/summary.individual\?<div className="ks-player-format-controls">\{controls\}<\/div>:<details className="ks-player-format-customize"><summary>Customize answer format/);
 assert.match(panel,/summary.individual&&player.requestedChoiceAccess!==undefined/);
 assert.match(panel,/const controls=<[\s\S]*?Age-based suggestion/);
 assert.match(room,/view.settings.answerStyle==='individual'\?<AnswerFormatPicker/);
 assert.match(css,/\.ks-player-format-customize\[open\]>summary svg/);
});
