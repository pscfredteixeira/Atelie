/* Isolamento de dados pessoais entre contas Google (Firestore simulado). */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await page.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
 await page.goto('http://127.0.0.1:4173/#/progresso',{waitUntil:'domcontentloaded'});
 await page.locator('[data-profile-login]').waitFor();
 const login=async(uid,data)=>{
  await page.evaluate(({uid,data})=>{
   window.AtelieCloud={
    user:{uid,displayName:'Aluno '+uid,email:uid+'@example.com',photoURL:null},
    ready:true,save:async()=>true,loadLessonProgress:async()=>null,saveLessonProgress:async()=>true,logout:async()=>true
   };
   dispatchEvent(new CustomEvent('atelie-cloud-auth',{detail:{uid}}));
   dispatchEvent(new CustomEvent('atelie-cloud-loaded',{detail:{uid,exists:!!data,state:data}}));
   dispatchEvent(new CustomEvent('atelie-cloud-ready',{detail:{uid}}));
  },{uid,data});
 };
 await login('A',{
  saved:['formacao-freudiana'],completed:['escuta-que-mudou-a-clinica'],
  notes:{'escuta-que-mudou-a-clinica':'Reflexão privada da conta A'},answers:{},updatedAt:101
 });
 await page.locator('.progress-head').getByText('1 de 3').waitFor();
 await page.goto('http://127.0.0.1:4173/#/caderno',{waitUntil:'domcontentloaded'});
 await page.getByText('Reflexão privada da conta A',{exact:false}).waitFor();
 await login('B',null);
 assert.equal(await page.locator('.note-preview').first().innerText()!=='Reflexão privada da conta A',true);
 assert.equal(await page.locator('#main').getByText('Reflexão privada da conta A',{exact:false}).count(),0);
 await page.goto('http://127.0.0.1:4173/#/progresso',{waitUntil:'domcontentloaded'});
 await page.locator('.progress-head').getByText('0 de 3').waitFor();
 await login('A',{
  saved:['formacao-freudiana'],completed:['escuta-que-mudou-a-clinica'],
  notes:{'escuta-que-mudou-a-clinica':'Reflexão privada da conta A'},answers:{},updatedAt:101
 });
 await page.locator('.progress-head').getByText('1 de 2').waitFor();
 assert.equal(await page.evaluate(()=>localStorage.getItem('ateliepsi-beta-state-v1:account:A')),null);
 assert.equal(await page.evaluate(()=>localStorage.getItem('ateliepsi-beta-state-v1:account:B')),null);
 console.log('OK — estado A e B isolado, recuperado do servidor, sem armazenamento local por conta.');
}finally{await browser.close()}
