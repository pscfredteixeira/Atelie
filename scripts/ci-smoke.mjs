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

 // Sprint 16 — a segunda aula precisa estar publicada e acessível pelo fluxo real.
 // Sprint 17.1 — hero novo e nenhuma rolagem horizontal, mesmo em 390px.
 await page.goto(base+"/#/aluno",{waitUntil:"domcontentloaded"});
 await page.locator(".home-hero").waitFor({timeout:30000});
 if(await page.locator(".home-portrait-image").count()!==1)
  throw Error("Redesign: retrato editorial do hero não foi inserido.");
 if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2))
  throw Error("Redesign: a página inicial tem rolagem horizontal em 390px.");
 console.log("OK — Novo hero editorial e home responsiva.");

 await page.goto(base+"/#/cursos/curso-introducao-psicanalise/aulas/aula-o-que-e-psicanalise",{waitUntil:"domcontentloaded"});
 await page.locator("[data-quiz-carousel]").waitFor({timeout:30000});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2))
  throw Error("Redesign: a leitura tem rolagem horizontal em 390px.");
 console.log("OK — Sala de aula responsiva em 390px.");

 const nextLesson=page.locator('a.journey-pager-link[href="#/cursos/curso-introducao-psicanalise/aulas/aula-freud-nascimento-psicanalise"]');
 await nextLesson.waitFor({timeout:15000});
 await nextLesson.click();
 await page.locator('[data-quiz-carousel][data-total="4"]').waitFor({timeout:30000});
 const nextPosition=await page.locator(".lesson-header-info .overline").allTextContents();
 if(!nextPosition.some(x=>x.includes("Aula 2 de 8 no programa")))
  throw Error("Navegação da Aula 1 para a 2 perdeu a numeração: "+nextPosition.join("|"));
 if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2))
  throw Error("Aula 2 tem rolagem horizontal em 390px.");
 const published=await page.locator(".lesson-timeline li").count();
 if(published<5)throw Error("Linha do tempo da Aula 2 não renderizou.");
 console.log("OK — Sprint 16: Aula 1 → Aula 2, quiz, linha do tempo e layout mobile.");

 // A seção histórica não deve aparecer como cartão isolado antes do texto.
 const readingHeading=page.locator('.reader #bloco-origens-parte-1');
 await readingHeading.waitFor({timeout:15000});
 const together=await readingHeading.evaluate(node=>{
   const next=node.nextElementSibling;
   return Boolean(next&&next.classList.contains("lesson-block")&&
      node.querySelector(".block-kicker-section")?.textContent.trim()==="SEÇÃO 1 DE 6"&&
      getComputedStyle(node.querySelector(".block-kicker-section")).display!=="none"&&
      node.querySelector("h3")?.textContent.trim()==="O cenário médico do fim do século XIX"&&
      getComputedStyle(next).borderTopWidth==="0px"&&
      getComputedStyle(next.querySelector(".block-kicker")).display==="none");
 });
 if(!together)throw Error("Seção inicial ainda está solta, sem rótulo claro ou com título duplicado.");
 const allSections=await page.locator('.reader .lesson-block[data-block-type="heading"] .block-kicker-section').allTextContents();
 if(allSections.length!==6||allSections[5].trim()!=="SEÇÃO 6 DE 6")
   throw Error("A contagem das seis seções da Aula 2 está incorreta.");
 console.log("OK — Seções da Aula 2: rótulos SEÇÃO X DE Y e título sem numeração dupla.");


 if(exceptions.length)throw Error("Erros JavaScript: "+exceptions.join(" | "));
} catch(error){failed=true;console.error(error)}
finally{await browser.close()}
if(failed)process.exitCode=1;
