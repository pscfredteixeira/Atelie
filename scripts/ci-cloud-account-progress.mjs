/* Regressão: progresso verdadeiro por UID, sem persistência em localStorage.
 * O Firestore é simulado para testar a interface; produção exige regras publicadas.
 */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const rules=await readFile('firestore.rules','utf8');
assert.ok(rules.includes('match /users/{userId}/lessonProgress/{lessonId}'));
assert.ok(rules.includes('request.auth.uid == userId'));

const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await page.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
 await page.route(/youtube|ytimg|googlevideo|wikimedia/,r=>r.abort());
 await page.goto('http://127.0.0.1:4173/#/aula/escuta-que-mudou-a-clinica',{waitUntil:'domcontentloaded'});
 await page.locator('[data-profile-login]').waitFor();
 assert.equal(await page.locator('#freudLessonFrame').count(),0,'Aula exige login antes do iframe');
 await page.evaluate(()=>{
  window.__lessonProgress={A:{},B:{}};
  window.__accountProgress={A:null,B:null};
  const current=()=>window.AtelieCloud.user.uid;
  window.AtelieCloud={
   user:{uid:'A',displayName:'Aluno A',email:'a@example.com',photoURL:null},
   ready:true,
   loadLessonProgress:async lesson=>window.__lessonProgress[current()]?.[lesson]||null,
   saveLessonProgress:async(lesson,progress)=>{
    window.__lessonProgress[current()][lesson]=JSON.parse(JSON.stringify(progress));
    return true;
   },
   save:async data=>{
    window.__accountProgress[current()]=JSON.parse(JSON.stringify(data));return true;
   },
   logout:async()=>true
  };
  dispatchEvent(new CustomEvent('atelie-cloud-auth',{detail:{uid:'A'}}));
  dispatchEvent(new CustomEvent('atelie-cloud-loaded',{detail:{uid:'A',exists:false,state:null}}));
  dispatchEvent(new CustomEvent('atelie-cloud-ready',{detail:{uid:'A'}}));
 });
 const frame=page.locator('#freudLessonFrame');
 await frame.waitFor();
 await frame.contentFrame().locator('.account-progress-ready').waitFor({state:'attached'});
 assert.equal(await frame.contentFrame().locator('#stage-2').isVisible(),false,'Sem progresso da conta A: segunda etapa bloqueada');
 const payload={
  unlocked:6,done:[1,2,3,4,5,6],spots:[0,1,2],files:[0,1,2],times:[0,1,2,3],
  concepts:[0,1,2,3],choices:{'3':1,'5':0,'6':1},passed:[3,5,6],reflection:'Registro da conta A',
  videoWatched:true,resumeUnlock:6,roomCompletedEarly:false
 };
 await frame.contentFrame().locator('body').evaluate((_,data)=>{
  parent.postMessage({type:'atelie-progress-save',lessonId:'escuta-que-mudou-a-clinica',state:data,requestId:8},location.origin);
 },payload);
 await page.waitForFunction(()=>window.__lessonProgress.A['escuta-que-mudou-a-clinica']?.done.includes(6));
 await page.waitForFunction(()=>window.__accountProgress.A?.completed?.includes('escuta-que-mudou-a-clinica'));
 assert.equal(await page.evaluate(()=>localStorage.getItem('atelie-escuta-seis-momentos-v1')),null,'A versão nova não grava localStorage');
 await page.evaluate(()=>{
  window.AtelieCloud.user={uid:'B',displayName:'Aluno B',email:'b@example.com',photoURL:null};
  dispatchEvent(new CustomEvent('atelie-cloud-auth',{detail:{uid:'B'}}));
  dispatchEvent(new CustomEvent('atelie-cloud-loaded',{detail:{uid:'B',exists:false,state:null}}));
  dispatchEvent(new CustomEvent('atelie-cloud-ready',{detail:{uid:'B'}}));
 });
 await page.locator('#freudLessonFrame').waitFor();
 await page.locator('#freudLessonFrame').contentFrame().locator('.account-progress-ready').waitFor({state:'attached'});
 assert.equal(await page.locator('#freudLiveCount').innerText(),'0 de 6 etapas','B não herda o progresso de A');
 assert.equal(await page.evaluate(()=>window.__lessonProgress.B['escuta-que-mudou-a-clinica']===undefined),true);
 await page.evaluate(()=>{
  window.AtelieCloud.user={uid:'A',displayName:'Aluno A',email:'a@example.com',photoURL:null};
  dispatchEvent(new CustomEvent('atelie-cloud-auth',{detail:{uid:'A'}}));
  dispatchEvent(new CustomEvent('atelie-cloud-loaded',{detail:{uid:'A',exists:true,state:window.__accountProgress.A}}));
  dispatchEvent(new CustomEvent('atelie-cloud-ready',{detail:{uid:'A'}}));
 });
 await page.waitForFunction(()=>document.querySelector('#freudLiveCount')?.textContent==='6 de 6 etapas');
 assert.equal(await page.locator('#freudLessonFrame').contentFrame().locator('#stage-6').isVisible(),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),true);
 console.log('OK — duas contas isoladas e progresso completo restaurado do servidor simulado.');

 await page.goto('http://127.0.0.1:4173/#/aula/primeira-topica-freud',{waitUntil:'domcontentloaded'});
 await page.locator('[data-profile-login]').waitFor();
 await page.evaluate(()=>{
  window.__restored={
   passed:['q1','q2a','q2b','q3a','q3b'],visited:['ics','pcs','cs'],
   videoFinished:true,thirdAudioDone:true,wordsCompleted:[1,2,3,4]
  };
  window.AtelieCloud={
   user:{uid:'A',displayName:'Aluno A',email:'a@example.com',photoURL:null},
   ready:true,
   loadLessonProgress:async lesson=>lesson==='primeira-topica-freud'?window.__restored:null,
   saveLessonProgress:async()=>true,save:async()=>true,logout:async()=>true
  };
  dispatchEvent(new CustomEvent('atelie-cloud-auth',{detail:{uid:'A'}}));
  dispatchEvent(new CustomEvent('atelie-cloud-loaded',{detail:{uid:'A',exists:true,state:{saved:[],completed:[],notes:{},answers:{},updatedAt:1}}}));
  dispatchEvent(new CustomEvent('atelie-cloud-ready',{detail:{uid:'A'}}));
 });
 const second=page.locator('#freudLessonFrame').contentFrame();
 await second.locator('.account-progress-ready').waitFor({state:'attached'});
 await second.locator('#progress-label').getByText('14 de 14 marcos').waitFor();
 assert.equal(await second.locator('#lesson-achievement').isVisible(),true);
 console.log('OK — os 14 marcos e a insígnia da Primeira Tópica retornam do progresso da conta.');
} finally {await browser.close();}
