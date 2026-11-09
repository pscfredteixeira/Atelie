/* Mensagens claras quando o Firebase ou o login Google falham. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.route('https://www.gstatic.com/firebasejs/**',route=>route.abort());
 await page.goto('http://127.0.0.1:4173/#/perfil',{waitUntil:'domcontentloaded'});
 await page.locator('[data-profile-login]').click();
 await page.locator('#profileLoginStatus').getByText('A integração do Firebase não carregou',{exact:false}).waitFor();
 const checks=[
  ['auth/unauthorized-domain','não está autorizado no Firebase'],
  ['auth/operation-not-allowed','O provedor Google está desativado'],
  ['auth/configuration-not-found','O Firebase Authentication ainda não está configurado'],
  ['auth/popup-blocked','O navegador bloqueou a janela'],
  ['auth/network-request-failed','Não conseguimos acessar o Firebase']
 ];
 for(const [code,expected] of checks){
  await page.evaluate(code=>{window.AtelieCloud={user:null,ready:false,login:()=>Promise.reject({code})};},code);
  await page.locator('[data-profile-login]').click();
  await page.getByText(expected,{exact:false}).waitFor();
  assert.equal(await page.locator('[data-profile-login]').isEnabled(),true);
 }
 console.log('OK — Feedback de login Google diretamente na página Meu perfil.');
}finally{await browser.close()}
