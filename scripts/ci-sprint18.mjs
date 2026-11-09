/* Regressão do Ateliê atual: aulas ilustrativas + Formação Freudiana. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 await page.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
 await page.goto(base+'/',{waitUntil:'domcontentloaded'});
 await page.locator('.course-card').first().waitFor();
 assert.equal(await page.locator('.course-card').count(),3);
 assert.match(await page.locator('#main h1').first().innerText(),/Estudo e formação/);
 console.log('OK — acesso à Home e aos três cursos.');

 for(const id of ['escuta','conflito-exemplo']){
  await page.goto(base+'/#/aula/'+id,{waitUntil:'domcontentloaded'});
  await page.locator('.quiz-option').first().waitFor();
  assert.equal(await page.locator('.quiz-option').count(),3);
  await page.locator('.quiz-option').first().click();
  await page.locator('.quiz-feedback').waitFor();
  assert.ok((await page.locator('.quiz-feedback').innerText()).length>15);
 }
 console.log('OK — quizzes das duas aulas ilustrativas.');

 await page.goto(base+'/#/aula/escuta',{waitUntil:'domcontentloaded'});
 await page.locator('#lessonNote').fill('Anotação de teste preservada');
 await page.locator('[data-complete="escuta"]').click();
 await page.goto(base+'/#/progresso',{waitUntil:'domcontentloaded'});
 assert.match(await page.locator('.progress-head').innerText(),/1 de 4/);
 await page.goto(base+'/#/caderno',{waitUntil:'domcontentloaded'});
 await page.getByText('Anotação de teste preservada',{exact:false}).waitFor();
 await page.reload({waitUntil:'domcontentloaded'});
 await page.getByText('Anotação de teste preservada',{exact:false}).waitFor();
 console.log('OK — progresso, anotações e armazenamento local.');

 await page.goto(base+'/#/estudio/escuta',{waitUntil:'domcontentloaded'});
 await page.locator('#editTitle').fill('Título demonstrativo editado');
 await page.locator('#editorForm button[type=submit]').click();
 assert.match(await page.locator('#editorStatus').innerText(),/Rascunho salvo/);
 await page.goto(base+'/#/aula/escuta',{waitUntil:'domcontentloaded'});
 assert.match(await page.locator('#main h1').innerText(),/Título demonstrativo editado/);
 console.log('OK — Estúdio demonstrativo.');

 for(const id of ['escuta-que-mudou-a-clinica','primeira-topica-freud']){
  await page.goto(base+'/#/aula/'+id,{waitUntil:'domcontentloaded'});
  const frame=page.locator('#freudLessonFrame');
  await frame.waitFor();
  assert.match(await frame.getAttribute('src'),/formacao-freudiana/);
  await frame.contentFrame().locator('body').waitFor();
  assert.ok(await page.locator('#main h1').first().isVisible());
 }
 console.log('OK — duas aulas freudianas integradas com vídeo e atividades.');

 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await mobile.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
 await mobile.goto(base+'/',{waitUntil:'domcontentloaded'});
 await mobile.locator('.course-card').first().waitFor();
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true,'Sem rolagem lateral');
 await mobile.locator('#menuToggle').click();
 await mobile.locator('#sidebar a[href="#/caderno"]').click();
 await mobile.locator('#main h1').getByText('Meu caderno').waitFor();
 console.log('OK — navegação e largura mobile.');
}finally{await browser.close()}
