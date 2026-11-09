import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const rules=await readFile('firestore.rules','utf8');
assert.match(rules,/match \/users\/\{userId\}\/enrollments\/\{courseId\}/);
assert.match(rules,/allow get, list: if isEnrollmentOwner\(\)/);
assert.match(rules,/allow create, update, delete: if false/);
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
try {
 await page.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
 await page.goto('http://127.0.0.1:4173/#/matriculas',{waitUntil:'domcontentloaded'});
 await page.locator('[data-profile-login]').waitFor();
 assert.equal(await page.locator('.enroll-card').count(),0,'Visitante não vê matrículas');
 await page.evaluate(()=>{
  window.AtelieCloud={
   user:{uid:'aluno-A',displayName:'Aluno A',email:'a@example.test'},ready:true,
   loadEnrollments:async function(){
    return this.user.uid==='aluno-A'?
     [{courseId:'formacao-freudiana',courseTitle:'Formação Freudiana',activatedOn:'2026-11-09',
      originalExpiresOn:'2030-11-09',expiresOn:'2031-11-09',renewalCount:1,state:'active'}]:[];
   },
   save:async()=>true
  };
  dispatchEvent(new CustomEvent('atelie-cloud-auth',{detail:{uid:'aluno-A'}}));
  dispatchEvent(new CustomEvent('atelie-cloud-loaded',{detail:{uid:'aluno-A',exists:false,state:null}}));
 });
 await page.locator('.enroll-card').waitFor();
 assert.match(await page.locator('.enroll-card').innerText(),/Formação Freudiana/);
 assert.match(await page.locator('.enroll-card').innerText(),/Adiada/);
 assert.match(await page.locator('.enroll-card').innerText(),/09\/11\/2031/);
 assert.equal(await page.locator('.enroll-card input').count(),0,'Estudante não pode editar matrícula');
 await page.evaluate(()=>{
  window.AtelieCloud.user={uid:'aluno-B',displayName:'Aluno B',email:'b@example.test'};
  dispatchEvent(new CustomEvent('atelie-cloud-auth',{detail:{uid:'aluno-B'}}));
  dispatchEvent(new CustomEvent('atelie-cloud-loaded',{detail:{uid:'aluno-B',exists:false,state:null}}));
 });
 await page.getByText('Nenhuma matrícula registrada').waitFor();
 assert.equal(await page.locator('.enroll-card').count(),0,'Matrículas de A não aparecem para B');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true,'Sem rolagem lateral no celular');
 console.log('OK — matrículas individuais, conta isolada, prorrogação e interface mobile.');
 console.log('Observação: teste com dados simulados; não valida regras publicadas no Firebase real.');
}finally{await browser.close()}
