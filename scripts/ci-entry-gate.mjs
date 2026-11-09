/* Ateliê: entrada pública e rota pessoal, sem exigir login para estudar. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 await page.route('https://www.gstatic.com/firebasejs/**',route=>route.abort());
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
 await page.locator('#main .hero h1').waitFor({state:'visible'});
 assert.equal(await page.locator('#shell').isVisible(),true);
 assert.equal(await page.locator('#entryGate:visible').count(),0,'Nenhum bloqueio antigo de entrada');
 await page.locator('#accountShortcut').click();
 await page.locator('h1').filter({hasText:'Meu perfil'}).first().waitFor();
 await page.locator('[data-profile-login]').waitFor({state:'visible'});
 assert.equal(await page.locator('#profileForm').count(),0,'Sem formulário pessoal antes do login');
 await page.evaluate(()=>{
  window.AtelieCloud={user:{uid:'student-test-01',displayName:'Pessoa Teste',email:'pessoa@example.com',photoURL:null},ready:false,logout:async()=>{},save:async()=>{}};
  dispatchEvent(new CustomEvent('atelie-cloud-auth',{detail:{uid:'student-test-01'}}));
  dispatchEvent(new CustomEvent('atelie-cloud-profile',{detail:{uid:'student-test-01',status:'ready',profile:{preferredName:'Estudante',phone:''}}}));
 });
 await page.locator('#profilePreferredName').waitFor({state:'visible'});
 assert.equal(await page.locator('#profilePreferredName').inputValue(),'Estudante');
 assert.match(await page.locator('.profile-identity-head').innerText(),/pessoa@example.com/);
 await page.evaluate(()=>{
  window.AtelieCloud.user=null;
  dispatchEvent(new CustomEvent('atelie-cloud-auth',{detail:{uid:null}}));
 });
 await page.locator('[data-profile-login]').waitFor({state:'visible'});
 assert.equal(await page.locator('#profileForm').count(),0);
 console.log('OK — acesso público, perfil protegido por sessão e saída do Google.');
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await mobile.route('https://www.gstatic.com/firebasejs/**',route=>route.abort());
 await mobile.goto('http://127.0.0.1:4173/#/perfil',{waitUntil:'domcontentloaded'});
 await mobile.locator('[data-profile-login]').waitFor();
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true,'Perfil sem rolagem horizontal');
 await mobile.locator('#menuToggle').click();
 await mobile.locator('#sidebar a[href="#/perfil"]').click();
 await mobile.locator('[data-profile-login]').waitFor();
 console.log('OK — Meu perfil responsivo e acessível pelo menu mobile.');
}finally{await browser.close()}
