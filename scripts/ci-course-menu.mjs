/* Navegação do Ateliê por curso e módulo — desktop e iPhone. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
const base='http://127.0.0.1:4173/';
try{
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await mobile.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
 await mobile.goto(base+'#/curso/formacao-freudiana',{waitUntil:'domcontentloaded'});
 await mobile.locator('#menuToggle').click();
 await mobile.locator('#sidebarCourseSelect').waitFor({state:'visible'});
 await mobile.waitForTimeout(450);
 assert.equal(await mobile.locator('#sidebar').evaluate(e=>e.scrollTop),0,'O menu deve iniciar no seletor de cursos');
 const selectGeometry=await mobile.locator('#sidebarCourseSelect').evaluate(el=>{const r=el.getBoundingClientRect();return{top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:innerWidth,height:innerHeight,scroll:document.querySelector('#sidebar').scrollTop}});
 console.log('Seletor mobile:',JSON.stringify(selectGeometry));
 assert.equal(selectGeometry.top>=0&&selectGeometry.bottom<=selectGeometry.height&&selectGeometry.left>=0&&selectGeometry.right<=selectGeometry.width,true,'O seletor deve estar visível sem rolar');
 assert.equal(await mobile.locator('#sidebar').isVisible(),true,'Menu aberto na frente da página');
 assert.equal(await mobile.locator('#sidebar').evaluate(e=>Number(getComputedStyle(e).zIndex)>Number(getComputedStyle(document.querySelector('#overlay')).zIndex)),true,'Menu deve ficar acima do fundo escurecido');
 assert.equal(await mobile.locator('#sidebarCourseSelect option').count(),1,'Somente Formação Freudiana é publicada');
 assert.equal(await mobile.locator('#sidebarCourseSelect').inputValue(),'formacao-freudiana');
 assert.equal(await mobile.locator('.course-drawer-module').count(),3,'Três aulas reais no menu');
 assert.equal(await mobile.locator('.course-drawer-module-label').first().innerText(),'AULA 01','Menu deve chamar aula, não módulo');
 assert.equal(await mobile.locator('.course-drawer-module').first().getAttribute('open'),'','Primeiro módulo expandido');
 assert.equal(await mobile.locator('.course-drawer-module').first().locator('a[href="#/aula/escuta-que-mudou-a-clinica"]').count(),1);
 assert.equal(await mobile.locator('#sidebarClose').isVisible(),true);
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true,'Sem rolagem horizontal');
 await mobile.locator('.course-drawer-module').nth(1).locator('summary').click();
 assert.equal(await mobile.locator('.course-drawer-module').nth(1).evaluate(e=>e.open),true,'Segundo módulo abre');
 assert.equal(await mobile.locator('.course-drawer-module').nth(1).locator('a[href="#/aula/primeira-topica-freud"]').count(),1);
 assert.equal(await mobile.locator('.course-drawer-module').nth(2).locator('a[href="#/aula/freud-antes-de-ser-freud"]').count(),1,'Terceira aula aparece no menu lateral');
 assert.equal(await mobile.locator('#searchForm').isVisible(),true,'Busca disponível na visão geral do curso');
 // O progresso da aula só é mostrado após o login; esta etapa ainda está na visão geral do curso.
 await mobile.locator('#sidebarClose').click();
 assert.equal(await mobile.locator('#menuToggle').getAttribute('aria-expanded'),'false');
 await mobile.locator('#menuToggle').click();
 await mobile.locator('#sidebar').evaluate(e=>{e.scrollTop=600});
 await mobile.locator('#sidebarClose').evaluate(button=>button.click()); // fechar mesmo após rolar o menu
 await mobile.locator('#menuToggle').click();
 await mobile.waitForTimeout(450); // aguardar transição completa do drawer
 assert.equal(await mobile.locator('#sidebar').evaluate(e=>e.scrollTop),0,'Reabrir o menu deve restaurar o topo');
 assert.equal(await mobile.locator('#sidebarCourseSelect').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth;}),true,'Seletor presente após reabrir');
 await mobile.locator('#sidebarClose').click();
 await mobile.goto(base+'#/curso/formacao-freudiana',{waitUntil:'domcontentloaded'});
 await mobile.locator('.course-program-module').first().waitFor({state:'visible'});
 assert.equal(await mobile.locator('.course-program-module').count(),3);
 assert.equal(await mobile.locator('#searchForm').isVisible(),true,'Busca continua disponível fora da aula');
 await mobile.locator('.course-program-module a[href="#/aula/escuta-que-mudou-a-clinica"]').click();
 await mobile.locator('[data-profile-login]').waitFor();
 assert.equal(await mobile.locator('#searchForm').isVisible(),false,'Busca não aparece dentro da aula');
 assert.match(mobile.url(),/#\/aula\/escuta-que-mudou-a-clinica/);
 console.log('OK — Seletor, acordeões e links de aula no celular.');
 const desktop=await browser.newPage({viewport:{width:1440,height:900}});
 await desktop.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
 await desktop.goto(base+'#/curso/formacao-freudiana',{waitUntil:'domcontentloaded'});
 assert.equal(await desktop.locator('.course-program-module').count(),3);
 assert.equal(await desktop.locator('.course-program-module-copy small').last().innerText(),'AULA 03','Programa apresenta Aula 03');
 assert.equal(await desktop.locator('#courseContextNav').isVisible(),true);
 await desktop.locator('.course-program-module').nth(1).locator('summary').click();
 await desktop.locator('.course-program-module a[href="#/aula/primeira-topica-freud"]').click();
 await desktop.locator('[data-profile-login]').waitFor();
 assert.equal(await desktop.locator('#sidebarCourseSelect').inputValue(),'formacao-freudiana');
 await desktop.goto(base+'#/curso/formacao-freudiana',{waitUntil:'domcontentloaded'});
 await desktop.locator('.course-program-module').nth(2).locator('summary').click();
 await desktop.locator('.course-program-module a[href="#/aula/freud-antes-de-ser-freud"]').click();
 await desktop.locator('[data-profile-login]').waitFor();
 assert.equal(desktop.url().includes('#/aula/freud-antes-de-ser-freud'),true,'Rota da terceira aula funciona na plataforma');
 // A terceira aula deve aparecer dentro da mesma sala do Ateliê e destravar o próximo quadradinho.
 await desktop.route('https://www.youtube-nocookie.com/**',route=>route.fulfill({status:200,body:'',contentType:'text/html'}));
 await desktop.route('https://www.youtube.com/iframe_api',route=>route.fulfill({status:200,body:'',contentType:'application/javascript'}));
 await desktop.evaluate(()=>{
  const uid='teste-terceira-aula';
  window.AtelieCloud={user:{uid,displayName:'Aluno Teste',email:'aluno@example.com',photoURL:null},ready:true,save:async()=>true,loadLessonProgress:async()=>null,saveLessonProgress:async()=>true,logout:async()=>true};
  dispatchEvent(new CustomEvent('atelie-cloud-auth',{detail:{uid}}));
  dispatchEvent(new CustomEvent('atelie-cloud-loaded',{detail:{uid,exists:false,state:null}}));
  dispatchEvent(new CustomEvent('atelie-cloud-ready',{detail:{uid}}));
 });
 await desktop.locator('#freudLessonFrame').waitFor({state:'visible'});
 const lesson=desktop.frameLocator('#freudLessonFrame');
 await lesson.locator('#step-1').waitFor({state:'visible'});
 assert.equal(await lesson.locator('#step-2').isVisible(),false,'Próxima etapa oculta antes de concluir a abertura');
 assert.equal(await lesson.locator('#video-fallback').count(),0,'Sem botão desnecessário de liberar vídeo');
 assert.equal(await lesson.locator('#video-gate').count(),0,'Sem aviso redundante de assistir');
 await lesson.locator('#q1').waitFor({state:'visible'});
 await lesson.locator('#q1 .answer[data-index="2"]').click();
 await lesson.locator('#q1 .verify').click();
 await lesson.locator('#step-2').waitFor({state:'visible'});
 assert.equal(await lesson.locator('#progress-label').innerText(),'1 de 6 momentos concluídos');
 for(const [stage,answer] of [[2,1],[3,2],[4,3],[5,0]]){
   await lesson.locator('#q'+stage+' .answer[data-index="'+answer+'"]').click();
   await lesson.locator('#q'+stage+' .verify').click();
   await lesson.locator('#step-'+(stage+1)).waitFor({state:'visible'});
 }
 await lesson.locator('#complete-reading').click();
 await lesson.locator('#lesson-achievement').waitFor({state:'visible'});
 assert.equal(await lesson.locator('#lesson-achievement .achievement-medal img').getAttribute('src'),'../../../../assets/insignia-freud-antes-de-ser-freud.svg');
 assert.match(await lesson.locator('#lesson-achievement').innerText(),/Insígnia conquistada/);
 console.log('OK — Terceira aula abre dentro do Ateliê, com vídeo e desbloqueio progressivo.');
 console.log('OK — Programa organizado em módulos e navegação desktop preservada.');
}finally{await browser.close()}
