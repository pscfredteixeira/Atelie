/* Sprint 15 — executa o diagnóstico no Chromium, sem publicar ou editar dados reais. */
import {chromium} from "playwright";
const base="http://127.0.0.1:4173";
const browser=await chromium.launch({headless:true});
let failed=false;
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const exceptions=[];
 page.on("pageerror",error=>exceptions.push(error.message));
 await page.goto(base+"/tests/smoke.html",{waitUntil:"domcontentloaded",timeout:30000});
 await page.waitForFunction(
  ()=>/de \d+ verificações concluídas com sucesso/.test(document.querySelector("#summary")?.textContent||""),
  null,{timeout:120000});
 const items=await page.locator("#results li").allTextContents();
 for(const item of items)console.log(item);
 const faults=items.filter(item=>item.startsWith("FALHA"));
 if(faults.length||exceptions.length)throw Error(faults.length+" falha(s) funcionais; "+exceptions.length+" erros JavaScript: "+exceptions.join(" | "));
 await page.goto(base+"/",{waitUntil:"domcontentloaded"});
 await page.locator('[data-demo-enter="aluno"]').waitFor({timeout:30000});
 await page.locator('[data-demo-enter="aluno"]').click();
 await page.goto(base+"/#/cursos/curso-introducao-psicanalise/aulas/aula-o-que-e-psicanalise");
 await page.locator("[data-quiz-carousel]").waitFor({timeout:30000});
 const lessonPosition=await page.locator(".lesson-header-info .overline").allTextContents();
 if(!lessonPosition.some(x=>x.includes("Aula 1 de 8 no programa")))
  throw Error("Cabeçalho da aula não reconheceu o programa completo: "+lessonPosition.join("|"));
 if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2))
  throw Error("Página de leitura apresenta rolagem horizontal em 390px.");
 console.log("OK — Navegação, numeração do programa e largura mobile.");
 if(exceptions.length)throw Error("Erros JavaScript: "+exceptions.join(" | "));
} catch(error){failed=true;console.error(error)}
finally{await browser.close()}
if(failed)process.exitCode=1;
