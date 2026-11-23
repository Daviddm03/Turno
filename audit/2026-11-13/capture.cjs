const fs = require('node:fs/promises');
const path = require('node:path');
const out = __dirname;
let id = 0;
const pending = new Map();
let socket;
const events = [];
async function send(method, params = {}) {
  const requestId = ++id;
  return new Promise((resolve, reject) => {
    pending.set(requestId, { resolve, reject });
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function navigate(route) {
  await send('Page.navigate', { url: `http://127.0.0.1:5173${route}` });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await evaluate(`location.pathname === ${JSON.stringify(route)} && document.readyState === 'complete' && !!document.querySelector(${JSON.stringify(route === '/' ? '.turno-intro' : '.turno-login')})`)) {
      await evaluate(`new Promise(resolve => { scrollTo(0, 0); requestAnimationFrame(() => requestAnimationFrame(resolve)); })`);
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error(`Page did not render ${route}`);
}
async function viewport(width, height) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
}
async function shot(name) {
  await evaluate(`new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))`);
  const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await fs.writeFile(path.join(out, `${name}.png`), Buffer.from(result.data, 'base64'));
}
async function metrics() {
  return evaluate(`(() => {
    const box = selector => { const el = document.querySelector(selector); if (!el) return null; const b = el.getBoundingClientRect(); const s = getComputedStyle(el); return { x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom,fontSize:s.fontSize,lineHeight:s.lineHeight }; };
    return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,font:getComputedStyle(document.body).fontFamily,interAvailable:document.fonts.check('16px Inter'),header:box('.turno-header'),main:box('main'),heading:box('h1'),copy:box('.turno-intro__copy'),preview:box('.turno-schedule'),legend:box('.turno-legend'),action:box('.turno-button'),card:box('.turno-login__card'),email:box('#email'),password:box('#password'),toggle:box('.turno-password button'),back:box('.turno-back'),status:box('.turno-login__status')};
  })()`);
}
async function key(key, code, windowsVirtualKeyCode) {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode });
}
async function click(selector) {
  const position = await evaluate(`(() => { const b=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}; })()`);
  await send('Input.dispatchMouseEvent', {type:'mouseMoved',...position});
  await send('Input.dispatchMouseEvent', {type:'mousePressed',button:'left',clickCount:1,...position});
  await send('Input.dispatchMouseEvent', {type:'mouseReleased',button:'left',clickCount:1,...position});
}
async function fill(selector, value) {
  await click(selector);
  await send('Input.insertText', {text:value});
}
(async () => {
  const target = await fetch('http://127.0.0.1:9327/json/new?about:blank', {method:'PUT'}).then(r=>r.json());
  socket = new WebSocket(target.webSocketDebuggerUrl);
  socket.onmessage = ({data}) => {
    const message = JSON.parse(data);
    if (message.id) { const p = pending.get(message.id); pending.delete(message.id); message.error ? p.reject(new Error(JSON.stringify(message.error))) : p.resolve(message.result); }
    else if (['Runtime.exceptionThrown','Log.entryAdded'].includes(message.method)) events.push(message);
  };
  await new Promise((resolve,reject) => { socket.onopen=resolve; socket.onerror=reject; });
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
  const matrix = [];
  for (const [width,height] of [[320,568],[375,667],[430,932],[768,1024],[1440,900],[375,480],[320,400]]) {
    await viewport(width,height);
    for (const [name,route] of [['welcome','/'],['login','/login']]) {
      await navigate(route);
      await shot(`${name}-${width}x${height}`);
      matrix.push({route,...await metrics()});
    }
  }
  const states = {};
  await viewport(375,667); await navigate('/');
  await key('Tab','Tab',9);
  states.welcomeFocus = await evaluate(`({tag:document.activeElement.tagName,text:document.activeElement.textContent,outline:getComputedStyle(document.activeElement).outline})`);
  await shot('welcome-keyboard-focus');
  await key('Enter','Enter',13);
  states.afterNavigation = await evaluate(`({path:location.pathname,tag:document.activeElement.tagName,text:document.activeElement.tagName==='BODY'?'BODY':document.activeElement.textContent,title:document.title,scrollY})`);
  await navigate('/login');
  states.tabSequence=[];
  for(let i=0;i<5;i++) {await key('Tab','Tab',9); states.tabSequence.push(await evaluate(`({tag:document.activeElement.tagName,id:document.activeElement.id,text:document.activeElement.textContent,outline:getComputedStyle(document.activeElement).outline,width:document.activeElement.getBoundingClientRect().width,height:document.activeElement.getBoundingClientRect().height})`));}
  await click('button[type="submit"]');
  states.required = await evaluate(`({active:document.activeElement.id,emailMissing:document.querySelector('#email').validity.valueMissing,message:document.querySelector('#email').validationMessage,status:document.querySelector('[role=status]').textContent})`);
  await shot('login-required-validation');
  await fill('#email','not-an-email');
  await click('button[type="submit"]');
  states.invalidEmail = await evaluate(`({active:document.activeElement.id,typeMismatch:document.querySelector('#email').validity.typeMismatch,message:document.querySelector('#email').validationMessage})`);
  await shot('login-invalid-email');
  await navigate('/login');
  await fill('#email','audit@example.test');
  await fill('#password','SyntheticAudit123');
  await click('.turno-password button');
  states.shown = await evaluate(`({type:document.querySelector('#password').type,label:document.querySelector('.turno-password button').textContent,valueLength:document.querySelector('#password').value.length})`);
  await shot('login-password-visible');
  await click('.turno-password button');
  states.hidden = await evaluate(`({type:document.querySelector('#password').type,label:document.querySelector('.turno-password button').textContent,valueLength:document.querySelector('#password').value.length})`);
  states.beforeSubmit = await metrics();
  await click('button[type="submit"]');
  states.afterSubmit = {metrics:await metrics(),status:await evaluate(`document.querySelector('[role=status]').textContent`)};
  await shot('login-submission-feedback');
  await viewport(320,400); await navigate('/login');
  await fill('#email','audit@example.test'); await fill('#password','SyntheticAudit123'); await click('button[type="submit"]');
  states.shortFeedback = await metrics();
  await shot('login-short-feedback');
  await evaluate(`document.querySelector('button[type=submit]').focus()`);
  states.shortFocusedSubmit = await metrics();
  await shot('login-short-focused-submit');
  await viewport(1440,900); await navigate('/');
  const hover = await evaluate(`(() => {const b=document.querySelector('.turno-intro__action').getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',...hover});
  states.hover = await evaluate(`({labelOpacity:getComputedStyle(document.querySelector('.turno-button__label')).opacity,arrowOpacity:getComputedStyle(document.querySelector('.turno-button__arrow')).opacity})`);
  await shot('welcome-desktop-hover');
  await send('Page.navigate',{url:'http://127.0.0.1:5173/unknown-audit-route'});
  for(let i=0;i<50;i++){if(await evaluate(`location.pathname==='/unknown-audit-route' && document.readyState==='complete'`))break; await new Promise(resolve=>setTimeout(resolve,50));}
  states.unknownRoute = await evaluate(`({path:location.pathname,rootText:document.querySelector('#root').textContent,mainCount:document.querySelectorAll('main').length})`);
  await shot('unknown-route');
  await fs.writeFile(path.join(out,'evidence.json'),JSON.stringify({matrix,states,events},null,2));
  console.log(`${matrix.length} route/viewport captures and interaction states saved; ${events.length} browser errors captured.`);
  await send('Page.close'); socket.close();
})().catch(error=>{console.error(error);socket?.close();process.exitCode=1;});
