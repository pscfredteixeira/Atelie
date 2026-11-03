/* Verifica que falhas de autenticação sejam mostradas claramente ao visitante. */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.route('https://www.gstatic.com/firebasejs/**', route=>route.abort());
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
 await page.locator('#gateGoogleButton').click();
 await page.getByText('O Firebase não carregou.',{exact:false}).waitFor();
 const checks=[
  ['auth/unauthorized-domain','não está autorizado no Firebase'],
  ['auth/operation-not-allowed','O provedor Google está desativado'],
  ['auth/configuration-not-found','O Firebase Authentication ainda não está configurado'],
  ['auth/popup-blocked','O navegador bloqueou a janela'],
  ['auth/network-request-failed','Não conseguimos acessar o Firebase']
 ];
 for(const [code,text] of checks){
  await page.evaluate(code=>{
   window.AtelieCloud={user:null,ready:false,login:()=>Promise.reject({code})};
  },code);
  await page.locator('#gateGoogleButton').click();
  await page.getByText(text,{exact:false}).waitFor();
  assert.equal(await page.locator('#gateGoogleButton').isEnabled(),true);
 }
 console.log('OK — Feedback Firebase ausente e quatro tipos de erro Google Auth.');
} finally { await browser.close(); }
