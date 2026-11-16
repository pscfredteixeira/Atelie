/* Sprint JSON 6 — regressão do fluxo atual da Formação Freudiana.
 * O antigo caderno/#lessonNote não existe mais em main. Testamos as quatro aulas,
 * autenticação simulada, iframes e navegação mobile sem dados reais de alunos.
 */
import {chromium} from "playwright";
import assert from "node:assert/strict";

const BASE="http://127.0.0.1:4173/";
const lessons=[
 ["escuta-que-mudou-a-clinica","escuta-que-mudou-a-clinica.html"],
 ["freud-antes-de-ser-freud","freud-antes-de-ser-freud.html"],
 ["freud-obra-e-fundador","freud-obra-e-fundador.html"],
 ["primeira-topica-freud","primeira-topica.html"]
];
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 await page.route("https://www.gstatic.com/firebasejs/**",r=>r.abort());
 await page.route(/youtube|ytimg|googlevideo|wikimedia/,r=>r.abort());
 await page.goto(BASE,{waitUntil:"domcontentloaded"});
 await page.locator(".course-card").first().waitFor();
 assert.equal(await page.locator(".course-card").count(),1,"A vitrine apresenta a Formação Freudiana");
 await page.goto(BASE+"#/curso/formacao-freudiana",{waitUntil:"domcontentloaded"});
 assert.equal(await page.locator(".course-program-module").count(),2);
 assert.equal(await page.locator(".course-program-module[open]").count(),0);
 assert.equal(await page.locator(".course-program-lesson").count(),4,"Quatro aulas nos dois percursos");
 await page.goto(BASE+"#/aula/escuta-que-mudou-a-clinica",{waitUntil:"domcontentloaded"});
 await page.locator("[data-profile-login]").waitFor();
 assert.equal(await page.locator("#freudLessonFrame").count(),0,"Sem iframe antes do login");
 await page.evaluate(()=>{
  window.__writes=[];
  window.AtelieCloud={
   user:{uid:"teste-A",displayName:"Aluno A",email:"aluno-a@example.com",photoURL:null},
   ready:true,loadLessonProgress:async()=>null,saveLessonProgress:async()=>true,
   save:async payload=>{window.__writes.push(JSON.parse(JSON.stringify(payload)));return true},
   logout:async()=>true
  };
  dispatchEvent(new CustomEvent("atelie-cloud-auth",{detail:{uid:"teste-A"}}));
  dispatchEvent(new CustomEvent("atelie-cloud-loaded",{detail:{uid:"teste-A",state:null,exists:false}}));
  dispatchEvent(new CustomEvent("atelie-cloud-ready",{detail:{uid:"teste-A"}}));
 });
 const frame=page.locator("#freudLessonFrame");
 await frame.waitFor();
 await frame.contentFrame().locator(".account-progress-ready").waitFor({state:"attached"});
 assert.equal(await page.locator("#searchForm").isVisible(),false,"Busca não aparece dentro da aula");
 assert.equal(await page.locator("#freudLiveProgress").evaluate(el=>getComputedStyle(el).position),"static");
 assert.equal(await page.locator("#lessonNote").count(),0,"Não reintroduzir o caderno legado");

 for(const [id,filename] of lessons){
  await page.evaluate(id=>{location.hash="#/aula/"+id},id);
  await page.waitForFunction(filename=>{
   const f=document.querySelector("#freudLessonFrame");
   return f?.getAttribute("src")?.includes(filename)&&f.contentDocument?.readyState==="complete";
  },filename,{timeout:20000});
  assert.equal(await page.locator("#freudLessonFrame").count(),1,"Exatamente um iframe na aula "+id);
  const title=await page.locator(".freud-lesson-heading h1").innerText();
  assert.ok(title.length>8,"Título ausente na aula "+id);
 }
 console.log("OK — quatro aulas atuais carregam dentro do Ateliê após login simulado.");

 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await mobile.route("https://www.gstatic.com/firebasejs/**",r=>r.abort());
 await mobile.goto(BASE+"#/cursos",{waitUntil:"domcontentloaded"});
 await mobile.locator(".course-card").waitFor();
 assert.equal(await mobile.locator(".course-card").count(),1);
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true);
 await mobile.locator("#menuToggle").click();
 await mobile.locator("#sidebar a[href='#/perfil']").click();
 await mobile.locator("[data-profile-login]").waitFor();
 console.log("OK — catálogo, login e menu mobile preservados.");
}finally{await browser.close()}
