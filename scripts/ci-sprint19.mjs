/* Sprint JSON 6 — isolamento de progresso entre duas contas.
 * Substitui a antiga dependência de /caderno e 3 aulas: o produto atual tem
 * 4 aulas e os registros pessoais vêm do Firestore, simulado neste teste.
 */
import {chromium} from "playwright";
import assert from "node:assert/strict";

const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await page.route("https://www.gstatic.com/firebasejs/**",r=>r.abort());
 await page.goto("http://127.0.0.1:4173/#/progresso",{waitUntil:"domcontentloaded"});
 await page.locator("[data-profile-login]").waitFor();
 const login=async(uid,data)=>{
  await page.evaluate(({uid,data})=>{
   window.AtelieCloud={
    user:{uid,displayName:"Aluno "+uid,email:uid+"@example.com",photoURL:null},
    ready:true,save:async()=>true,loadLessonProgress:async()=>null,
    saveLessonProgress:async()=>true,logout:async()=>true
   };
   dispatchEvent(new CustomEvent("atelie-cloud-auth",{detail:{uid}}));
   dispatchEvent(new CustomEvent("atelie-cloud-loaded",{detail:{uid,exists:!!data,state:data}}));
   dispatchEvent(new CustomEvent("atelie-cloud-ready",{detail:{uid}}));
  },{uid,data});
 };
 const aState={
  saved:["formacao-freudiana"],
  completed:["escuta-que-mudou-a-clinica"],
  notes:{"escuta-que-mudou-a-clinica":"Reflexão pessoal da conta A"},
  answers:{},updatedAt:101
 };
 await login("A",aState);
 await page.waitForFunction(()=>document.querySelector(".progress-head strong")?.textContent?.includes("1 de 4"));
 assert.equal(await page.locator("#savedCount").innerText(),"1","Curso salvo pertence à conta A");
 assert.match(await page.locator("#main").innerText(),/1 de 4/);
 await login("B",null);
 await page.waitForFunction(()=>document.querySelector(".progress-head strong")?.textContent?.includes("0 de 4"));
 assert.equal(await page.locator("#savedCount").innerText(),"0","Conta B não herda os salvos da conta A");
 assert.equal(await page.locator("#main").getByText("Reflexão pessoal da conta A",{exact:false}).count(),0);
 await login("A",aState);
 await page.waitForFunction(()=>document.querySelector(".progress-head strong")?.textContent?.includes("1 de 4"));
 assert.equal(await page.locator("#savedCount").innerText(),"1");
 assert.equal(await page.evaluate(()=>localStorage.getItem("ateliepsi-beta-state-v1:account:A")),null);
 assert.equal(await page.evaluate(()=>localStorage.getItem("ateliepsi-beta-state-v1:account:B")),null);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true);
 console.log("OK — quatro aulas, progresso A/B isolado, salvos independentes e sem cache pessoal em localStorage.");
}finally{await browser.close()}
