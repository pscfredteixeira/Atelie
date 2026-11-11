/* Navegação do Ateliê por curso e módulo — desktop e iPhone. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
const base='http://127.0.0.1:4173/';
try{
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await mobile.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
 await mobile.goto(base+'#/curso/introducao-a-psicanalise',{waitUntil:'domcontentloaded'});
 await mobile.locator('#menuToggle').click();
 await mobile.locator('.study-area').first().waitFor({state:'visible'});
 assert.equal(await mobile.locator('.study-area').count(),2,'Menu deve conter duas áreas');
 assert.equal((await mobile.locator('.study-area-link strong').allInnerTexts()).join(' | '),'Início da Psicanálise | Formação Freudiana','Ordem e nomes das áreas');
 assert.equal(await mobile.locator('.study-area').first().locator('.course-drawer-lesson').count(),3,'Três aulas na área introdutória');
 assert.equal(await mobile.locator('.study-area').nth(1).locator('.course-drawer-lesson').count(),1,'Uma aula na Formação Freudiana');
 assert.equal(await mobile.locator('.course-drawer-module').count(),0,'Nenhum módulo repetindo o título da aula');
 assert.equal(await mobile.locator('#sidebarCourseSelect').count(),0,'Sem seletor extra de cursos');
 for(const [index,href] of [[0,'#/aula/escuta-que-mudou-a-clinica'],[1,'#/aula/freud-antes-de-ser-freud'],[2,'#/aula/freud-obra-e-fundador']]){
  assert.equal(await mobile.locator('.study-area').first().locator('.course-drawer-lesson').nth(index).getAttribute('href'),href);
 }
 assert.equal(await mobile.locator('.study-area').nth(1).locator('.course-drawer-lesson').first().getAttribute('href'),'#/aula/primeira-topica-freud');
 assert.equal(await mobile.locator('#sidebarClose').isVisible(),true);
 assert.equal(await mobile.locator('#sidebar').evaluate(e=>Number(getComputedStyle(e).zIndex)>Number(getComputedStyle(document.querySelector('#overlay')).zIndex)),true);
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true,'Sem rolagem horizontal');
 await mobile.locator('#sidebarClose').click();
 assert.equal(await mobile.locator('#menuToggle').getAttribute('aria-expanded'),'false');
 await mobile.locator('#menuToggle').click();
 await mobile.locator('#sidebar').evaluate(e=>{e.scrollTop=600});
 await mobile.locator('#sidebarClose').evaluate(button=>button.click());
 await mobile.locator('#menuToggle').click();
 await mobile.waitForTimeout(200);
 assert.equal(await mobile.locator('#sidebar').evaluate(e=>e.scrollTop),0,'Menu reabre no topo');
 await mobile.locator('#sidebarClose').click();
 await mobile.goto(base+'#/curso/introducao-a-psicanalise',{waitUntil:'domcontentloaded'});
 await mobile.locator('.course-program-flat-lesson').first().waitFor({state:'visible'});
 assert.equal(await mobile.locator('.course-program-flat-lesson').count(),3,'Programa inicial contém três aulas sem subníveis');
 assert.equal(await mobile.locator('#searchForm').isVisible(),true);
 await mobile.locator('.course-program-flat-lesson a[href="#/aula/escuta-que-mudou-a-clinica"]').click();
 await mobile.locator('[data-profile-login]').waitFor();
 assert.equal(await mobile.locator('#searchForm').isVisible(),false,'Busca permanece escondida dentro da aula');
 await mobile.goto(base+'#/curso/formacao-freudiana',{waitUntil:'domcontentloaded'});
 assert.equal(await mobile.locator('.course-program-flat-lesson').count(),1,'Formação Freudiana contém primeira tópica');
 assert.equal(await mobile.locator('.course-program-flat-lesson a[href="#/aula/primeira-topica-freud"]').count(),1);
 const desktop=await browser.newPage({viewport:{width:1440,height:900}});
 await desktop.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
 await desktop.goto(base+'#/curso/introducao-a-psicanalise',{waitUntil:'domcontentloaded'});
 assert.equal(await desktop.locator('.study-area').count(),2);
 assert.equal(await desktop.locator('.course-program-flat-lesson').count(),3);
 assert.equal(await desktop.locator('#courseContextNav').isVisible(),true);
 await desktop.locator('.course-program-flat-lesson a[href="#/aula/freud-antes-de-ser-freud"]').click();
 await desktop.locator('[data-profile-login]').waitFor();
 assert.match(desktop.url(),/#\/aula\/freud-antes-de-ser-freud/);
 // Progresso da terceira aula deve continuar dentro do Ateliê.
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
 assert.equal(await lesson.locator('#lesson-achievement .achievement-medal img').getAttribute('src'),'../../../../assets/insignia-freud-antes-de-ser-freud.svg?v=fundo-transparente-1');
 assert.match(await lesson.locator('#lesson-achievement').innerText(),/Insígnia conquistada/);
 console.log('OK — Terceira aula abre dentro do Ateliê, com vídeo e desbloqueio progressivo.');
 console.log('OK — Navegação em duas áreas, sem duplicação de submenus.');
}finally{await browser.close()}
