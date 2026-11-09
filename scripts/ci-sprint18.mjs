/* Regressão do catálogo publicado: Formação Freudiana e duas aulas. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 await page.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
 await page.goto(base+'/',{waitUntil:'domcontentloaded'});
 await page.locator('.course-card').first().waitFor();
 assert.equal(await page.locator('.course-card').count(),1,'Somente Formação Freudiana na home');
 assert.match(await page.locator('.course-card').innerText(),/Formação Freudiana/);
 await page.goto(base+'/#/cursos',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('.course-card').count(),1,'Somente Formação Freudiana no catálogo');
 assert.equal(await page.locator('#searchForm').isVisible(),true,'Busca disponível no catálogo');
 await page.goto(base+'/#/curso/formacao-freudiana',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('.course-program-module').count(),2,'Só dois módulos com aula existente');
 assert.equal(await page.locator('.course-program-lesson').count(),2,'Duas aulas publicadas');
 const manifest=await page.evaluate(async()=>{
   const r=await fetch('content/courses/formacao-freudiana/curso.json');
   return r.json();
 });
 assert.equal(manifest.modules.length,2);
 assert.equal(manifest.modules.flatMap(m=>m.lessons).length,2);
 const catalog=await page.evaluate(async()=>{const r=await fetch('content/catalogo.json');return r.json()});
 assert.equal(catalog.courses.length,1);
 console.log('OK — só Formação Freudiana, sem módulos de demonstração ou vazios.');
 for(const id of ['escuta-que-mudou-a-clinica','primeira-topica-freud']){
  await page.goto(base+'/#/aula/'+id,{waitUntil:'domcontentloaded'});
  const frame=page.locator('#freudLessonFrame');
  await frame.waitFor();
  await frame.contentFrame().locator('body').waitFor();
  assert.equal(await page.locator('#searchForm').isVisible(),false,'Busca removida das aulas');
  assert.equal(await page.locator('#main h1').first().isVisible(),true,'Título preservado');
 }
 await page.goto(base+'/#/aula/escuta-que-mudou-a-clinica',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('#freudLiveProgress').evaluate(e=>getComputedStyle(e).position),'static','Progresso sem flutuação');
 await page.goto(base+'/#/aula/primeira-topica-freud',{waitUntil:'domcontentloaded'});
 const note=page.locator('#lessonNote');
 await note.fill('Nota da aula Freudiana');
 await page.goto(base+'/#/caderno',{waitUntil:'domcontentloaded'});
 await page.getByText('Nota da aula Freudiana',{exact:false}).waitFor();
 await page.reload({waitUntil:'domcontentloaded'});
 await page.getByText('Nota da aula Freudiana',{exact:false}).waitFor();
 console.log('OK — duas aulas, progresso estático, caderno e armazenamento local.');
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await mobile.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
 await mobile.goto(base+'/#/aula/escuta-que-mudou-a-clinica',{waitUntil:'domcontentloaded'});
 await mobile.locator('#freudLessonFrame').waitFor();
 assert.equal(await mobile.locator('#searchForm').isVisible(),false,'Busca escondida no iPhone');
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true,'Sem rolagem lateral');
 await mobile.locator('#menuToggle').click();
 await mobile.locator('#sidebar a[href="#/caderno"]').click();
 await mobile.locator('#main h1').getByText('Meu caderno').waitFor();
 console.log('OK — navegação no celular.');
}finally{await browser.close()}
