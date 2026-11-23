const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
let socket, id=0;
const pending=new Map();
const send=(method,params={})=>new Promise((resolve,reject)=>{const requestId=++id;pending.set(requestId,{resolve,reject});socket.send(JSON.stringify({id:requestId,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
async function ready(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,50));}throw new Error('Page readiness timed out');}
async function screenshot(name){const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(path.join(__dirname,name+'.png'),Buffer.from(r.data,'base64'));}
function luminance(hex){const v=hex.match(/\w\w/g).map(c=>parseInt(c,16)/255).map(c=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4);return v[0]*0.2126+v[1]*0.7152+v[2]*0.0722;}
function contrast(a,b){const l=[luminance(a),luminance(b)].sort((a,b)=>b-a);return (l[0]+0.05)/(l[1]+0.05);}
(async()=>{
 const target=await fetch('http://127.0.0.1:9327/json/new?about:blank',{method:'PUT'}).then(r=>r.json());
 socket=new WebSocket(target.webSocketDebuggerUrl);socket.onmessage=({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);}};
 await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 await send('Page.enable');await send('DOM.enable');await send('CSS.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:375,height:667,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://127.0.0.1:5173/login'});await ready(`document.readyState==='complete' && !!document.querySelector('h1')`);
 const doc=await send('DOM.getDocument');const node=await send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'h1'});
 const platformFonts=await send('CSS.getPlatformFontsForNode',{nodeId:node.nodeId});
 await evaluate(`document.querySelector('#email').value='audit@example.test'; document.querySelector('form').requestSubmit()`);
 const passwordRequired=await evaluate(`({missing:document.querySelector('#password').validity.valueMissing,active:document.activeElement.id})`);
 const backBox=await evaluate(`(()=>{const b=document.querySelector('.turno-back').getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2}})()`);
 await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...backBox});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...backBox});
 await ready(`location.pathname==='/' && !!document.querySelector('.turno-schedule')`);
 const backWorks=await evaluate(`location.pathname==='/'`);
 const sheets=[
  {name:'mobile-comparison',width:1210,height:540,images:['welcome-320x568','login-320x568','welcome-375x667','login-375x667','welcome-430x932','login-430x932'],scale:0.5,columns:6},
  {name:'tablet-comparison',width:804,height:565,images:['welcome-768x1024','login-768x1024'],scale:0.5,columns:2},
  {name:'desktop-comparison',width:1476,height:500,images:['welcome-1440x900','login-1440x900'],scale:0.5,columns:2},
  {name:'login-state-comparison',width:1173,height:720,images:['login-375x667','login-invalid-email','login-submission-feedback'],scale:1,columns:3},
 ];
 for(const sheet of sheets){
   const entries=[];
   for(const name of sheet.images){const bytes=await fs.readFile(path.join(__dirname,name+'.png'));const pngWidth=bytes.readUInt32BE(16);entries.push(`<figure><figcaption>${name}</figcaption><img width="${pngWidth*sheet.scale}" src="data:image/png;base64,${bytes.toString('base64')}"></figure>`);}
   const html=`<!doctype html><html lang="en"><meta charset="utf-8"><title>Turno audit comparison</title><style>*{box-sizing:border-box}body{margin:0;padding:12px;background:#e2e8f0;font:12px system-ui;color:#14213d}main{display:grid;grid-template-columns:repeat(${sheet.columns},max-content);gap:12px}figure{margin:0}figcaption{padding:0 0 8px}img{display:block}</style><main>${entries.join('')}</main></html>`;
   await fs.writeFile(path.join(__dirname,sheet.name+'.html'),html);
   await send('Emulation.setDeviceMetricsOverride',{width:sheet.width,height:sheet.height,deviceScaleFactor:1,mobile:false});
   await send('Page.navigate',{url:'file:///'+path.join(__dirname,sheet.name+'.html').replaceAll('\\','/')});
   await ready(`document.readyState==='complete' && document.images.length>0 && [...document.images].every(i=>i.complete && i.naturalWidth>0)`);
   await screenshot(sheet.name);
 }
 const evidence=JSON.parse(await fs.readFile(path.join(__dirname,'evidence.json'),'utf8'));
 const checks=[];function check(name,test){test();checks.push({name,result:'PASS'});}
 for(const m of evidence.matrix){check(`No horizontal overflow ${m.route} ${m.width}x${m.height}`,()=>assert.ok(m.scrollWidth<=m.width));}
 for(const m of evidence.matrix.filter(m=>m.route==='/'&&m.height>=568)){check(`Welcome action 24px above bottom ${m.width}x${m.height}`,()=>assert.equal(m.height-m.action.bottom,24));}
 check('Welcome Enter navigates to login',()=>assert.equal(evidence.states.afterNavigation.path,'/login'));
 check('Back link returns to welcome',()=>assert.equal(backWorks,true));
 check('Login keyboard order',()=>assert.deepEqual(evidence.states.tabSequence.map(s=>s.id||s.text),['Início','email','password','Mostrar','Entrar']));
 check('Empty email prevented',()=>assert.equal(evidence.states.required.emailMissing,true));
 check('Invalid email prevented',()=>assert.equal(evidence.states.invalidEmail.typeMismatch,true));
 check('Empty password prevented',()=>assert.equal(passwordRequired.missing,true));
 check('Show and hide preserve password',()=>{assert.equal(evidence.states.shown.type,'text');assert.equal(evidence.states.hidden.type,'password');assert.equal(evidence.states.shown.valueLength,evidence.states.hidden.valueLength);});
 check('Valid form displays explicit authentication stub',()=>assert.match(evidence.states.afterSubmit.status,/autenticação ainda não/));
 check('No browser runtime errors captured',()=>assert.equal(evidence.events.length,0));
 const contrasts={};for(const [name,a,b] of [['button text','ffffff','2455db'],['muted on canvas','475569','f5f7fb'],['input border','8d9bb0','ffffff'],['morning','214e91','e4efff'],['afternoon','145b4b','dff3ee'],['night','49388d','ebe8ff'],['off','475569','eef1f5']])contrasts[name]=Number(contrast(a,b).toFixed(2));
 const results={platformFonts,passwordRequired,backWorks,contrasts,checks};await fs.writeFile(path.join(__dirname,'checks.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
 await send('Page.close');socket.close();
})().catch(e=>{console.error(e);socket?.close();process.exitCode=1;});
