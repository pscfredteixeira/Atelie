/* Navegação do Ateliê por curso e módulo — desktop e iPhone. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
const base='http://127.0.0.1:4173/';
try{
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await mobile.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
 await mobile.goto(base+'#/aula/escuta-que-mudou-a-clinica',{waitUntil:'domcontentloaded'});
 await mobile.locator('#menuToggle').click();
 await mobile.locator('#sidebarCourseSelect').waitFor({state:'visible'});
 assert.equal(await mobile.locator('#sidebarCourseSelect option').count(),3,'Três cursos no seletor');
 assert.equal(await mobile.locator('#sidebarCourseSelect').inputValue(),'formacao-freudiana');
 assert.equal(await mobile.locator('.course-drawer-module').count(),11,'Onze módulos da Formação Freudiana');
 assert.equal(await mobile.locator('.course-drawer-module').first().getAttribute('open'),'','Primeiro módulo expandido');
 assert.equal(await mobile.locator('.course-drawer-module').first().locator('a[href="#/aula/escuta-que-mudou-a-clinica"]').count(),1);
 assert.equal(await mobile.locator('#sidebarClose').isVisible(),true);
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true,'Sem rolagem horizontal ao abrir');
 // A troca de curso atualiza apenas o menu, sem fechar a navegação.
 await mobile.locator('#sidebarCourseSelect').selectOption('introducao-a-psicanalise');
 assert.equal(await mobile.locator('#sidebarCourseSelect').inputValue(),'introducao-a-psicanalise');
 assert.equal(await mobile.locator('.course-drawer-module').count(),8,'Oito módulos da Introdução');
 assert.equal(await mobile.locator('.course-drawer-module').first().locator('a[href="#/aula/escuta"]').count(),1);
 await mobile.locator('.course-drawer-module').nth(1).locator('summary').click();
 assert.equal(await mobile.locator('.course-drawer-module').nth(1).evaluate(e=>e.open),true,'Acordeão de módulo abre');
 await mobile.locator('#sidebarClose').click();
 assert.equal(await mobile.locator('#menuToggle').getAttribute('aria-expanded'),'false');
 await mobile.goto(base+'#/curso/fundamentos-da-psicanalise',{waitUntil:'domcontentloaded'});
 await mobile.locator('.course-program-module').first().waitFor({state:'visible'});
 assert.equal(await mobile.locator('.course-program-module').count(),1);
 await mobile.locator('.course-program-module a[href="#/aula/conflito-exemplo"]').click();
 await mobile.locator('.quiz-option').first().waitFor();
 assert.match(mobile.url(),/#\/aula\/conflito-exemplo/);
 console.log('OK — Seletor, acordeões e links de aula no celular.');
 const desktop=await browser.newPage({viewport:{width:1440,height:900}});
 await desktop.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
 await desktop.goto(base+'#/curso/formacao-freudiana',{waitUntil:'domcontentloaded'});
 assert.equal(await desktop.locator('.course-program-module').count(),11);
 assert.equal(await desktop.locator('#courseContextNav').isVisible(),true);
 await desktop.locator('.course-program-module').nth(1).locator('summary').click();
 await desktop.locator('.course-program-module a[href="#/aula/primeira-topica-freud"]').click();
 await desktop.locator('#freudLessonFrame').waitFor();
 assert.equal(await desktop.locator('#sidebarCourseSelect').inputValue(),'formacao-freudiana');
 console.log('OK — Programa organizado em módulos e navegação desktop preservada.');
}finally{await browser.close()}
