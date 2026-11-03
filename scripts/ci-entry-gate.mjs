/* Ateliê — tela de entrada. Testes de acesso à interface, não são testes de autorização do Firebase. */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({headless:true});
try {
 const page = await browser.newPage({viewport:{width:1280,height:800}});
 await page.route('https://www.gstatic.com/firebasejs/**', route=>route.abort());
 await page.goto('http://127.0.0.1:4173/#/aula/escuta', {waitUntil:'domcontentloaded'});
 await page.locator('#entryGate').waitFor({state:'visible'});
 assert.equal(await page.locator('#shell').isVisible(), false, 'A plataforma inicia oculta');
 assert.equal(await page.locator('#gateGoogleButton').isVisible(), true);
 assert.equal(await page.locator('#gateDemoButton').isVisible(), true);
 await page.locator('#gateDemoButton').click();
 await page.locator('#entryGate').waitFor({state:'hidden'});
 await page.locator('#lessonNote').waitFor({state:'visible'});
 assert.equal(await page.locator('#shell').isVisible(), true);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('#lessonNote').waitFor({state:'visible'});
 // Guest can leave explicitly and must see gate again.
 await page.locator('#loginButton').click();
 await page.locator('#entryGate').waitFor({state:'visible'});
 assert.equal(await page.locator('#shell').isVisible(), false);
 // Fake Firebase login/logout in a test environment.
 await page.evaluate(()=>{
   window.AtelieCloud={user:{uid:'test-user'},ready:false,save:async()=>{},logout:async()=>{}};
   window.dispatchEvent(new CustomEvent('atelie-cloud-auth',{detail:{uid:'test-user'}}));
 });
 await page.locator('#entryGate').waitFor({state:'hidden'});
 await page.evaluate(()=>{
   window.AtelieCloud.user=null;
   window.dispatchEvent(new CustomEvent('atelie-cloud-auth',{detail:{uid:null}}));
 });
 await page.locator('#entryGate').waitFor({state:'visible'});
 console.log('OK — gate de login, demonstração, reload, entrada e saída.');
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await mobile.route('https://www.gstatic.com/firebasejs/**', route=>route.abort());
 await mobile.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
 await mobile.locator('#entryGate').waitFor({state:'visible'});
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth <= innerWidth + 2),true,'Entrada mobile sem overflow horizontal');
 await mobile.locator('#gateDemoButton').click();
 await mobile.locator('.course-card').first().waitFor({state:'visible'});
 console.log('OK — entrada mobile 390 px.');
} finally {
 await browser.close();
}
