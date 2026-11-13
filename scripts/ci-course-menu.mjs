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
 assert.equal(await mobile.locator('#sidebarCourseSelect option').count(),1,'Há somente o curso Formação Freudiana no seletor');
 assert.equal(await mobile.locator('#sidebarCourseSelect').inputValue(),'formacao-freudiana');
 assert.equal(await mobile.locator('.study-area-accordion').count(),2,'Existem dois percursos recolhíveis');
 assert.equal((await mobile.locator('.study-area-copy strong').allInnerTexts()).join(' | '),'Início da Psicanálise | Formação Freudiana');
 assert.equal(await mobile.locator('.study-area-accordion[open]').count(),0,'As sanfonas devem começar fechadas');
 assert.equal(await mobile.locator('.course-drawer-module').count(),0,'Sem submenu repetindo título de cada aula');
 assert.equal(await mobile.locator('.study-area-accordion').first().locator('a').isVisible(),false,'Aulas ficam escondidas até abrir');
 await mobile.locator('.study-area-accordion').first().locator('summary').click();
 assert.equal(await mobile.locator('.study-area-accordion').first().evaluate(e=>e.open),true);
 assert.equal(await mobile.locator('.study-area-accordion').first().locator('.course-drawer-lesson').count(),3);
 const expected=['#/aula/escuta-que-mudou-a-clinica','#/aula/freud-antes-de-ser-freud','#/aula/freud-obra-e-fundador'];
 for(let i=0;i<3;i++)assert.equal(await mobile.locator('.study-area-accordion').first().locator('.course-drawer-lesson').nth(i).getAttribute('href'),expected[i]);
 await mobile.locator('.study-area-accordion').first().locator('summary').click();
 assert.equal(await mobile.locator('.study-area-accordion').first().evaluate(e=>e.open),false,'Clique recolhe a primeira sanfona');
 await mobile.locator('.study-area-accordion').nth(1).locator('summary').click();
 assert.equal(await mobile.locator('.study-area-accordion').nth(1).locator('.course-drawer-lesson').count(),1);
 assert.equal(await mobile.locator('.study-area-accordion').nth(1).locator('.course-drawer-lesson').first().getAttribute('href'),'#/aula/primeira-topica-freud');
 assert.equal(await mobile.locator('#sidebarClose').isVisible(),true);
 assert.equal(await mobile.locator('#sidebar').evaluate(e=>Number(getComputedStyle(e).zIndex)>Number(getComputedStyle(document.querySelector('#overlay')).zIndex)),true);
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true,'Sem rolagem horizontal');
 await mobile.locator('#sidebarClose').click();
 assert.equal(await mobile.locator('#menuToggle').getAttribute('aria-expanded'),'false');
 await mobile.locator('#menuToggle').click();
 assert.equal(await mobile.locator('.study-area-accordion[open]').count(),0,'Ao reabrir o menu, sanfonas começam fechadas');
 await mobile.locator('#sidebar').evaluate(e=>{e.scrollTop=600});
 await mobile.locator('#sidebarClose').evaluate(button=>button.click());
 await mobile.locator('#menuToggle').click();
 await mobile.waitForTimeout(250);
 assert.equal(await mobile.locator('#sidebar').evaluate(e=>e.scrollTop),0,'Reabrir menu restaura o topo');
 await mobile.locator('#sidebarClose').click();
 await mobile.goto(base+'#/curso/formacao-freudiana',{waitUntil:'domcontentloaded'});
 assert.equal(await mobile.locator('.course-program-module').count(),2,'Programa exibe duas seções');
 assert.equal(await mobile.locator('.course-program-module[open]').count(),0,'Seções do programa começam recolhidas');
 await mobile.locator('.course-program-module').first().locator('summary').click();
 assert.equal(await mobile.locator('.course-program-module').first().locator('.course-program-lesson').count(),3);
 assert.equal(await mobile.locator('#searchForm').isVisible(),true,'Busca visível fora da aula');
 await mobile.locator('.course-program-module a[href="#/aula/escuta-que-mudou-a-clinica"]').click();
 await mobile.locator('[data-profile-login]').waitFor();
 assert.equal(await mobile.locator('#searchForm').isVisible(),false,'Busca não aparece dentro da aula');
 const desktop=await browser.newPage({viewport:{width:1440,height:900}});
 await desktop.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
 await desktop.goto(base+'#/curso/formacao-freudiana',{waitUntil:'domcontentloaded'});
 assert.equal(await desktop.locator('.course-program-module').count(),2);
 assert.equal(await desktop.locator('.course-program-module[open]').count(),0);
 assert.equal(await desktop.locator('#sidebarCourseSelect').inputValue(),'formacao-freudiana');
 assert.equal(await desktop.locator('.study-area-accordion').count(),2);
 await desktop.locator('.course-program-module').first().locator('summary').click();
 await desktop.locator('.course-program-module a[href="#/aula/freud-antes-de-ser-freud"]').click();
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

 // Altura do iframe deve acompanhar o fim real do rodapé, não o viewport.
 // Quando havia uma área vazia abaixo do botão Reiniciar progresso, a diferença
 // era de centenas de pixels e o iframe não diminuía.
 const fitted=()=>{const f=document.querySelector('#freudLessonFrame'),d=f?.contentDocument,footer=d?.querySelector('footer.shell');if(!footer)return false;const end=footer.getBoundingClientRect().bottom+f.contentWindow.scrollY+4;return Math.abs(f.getBoundingClientRect().height-end)<=24;};
 await desktop.waitForFunction(fitted,null,{timeout:15000});
 const mobileLesson=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await mobileLesson.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
 await mobileLesson.route('https://www.youtube-nocookie.com/**',r=>r.fulfill({status:200,body:'',contentType:'text/html'}));
 await mobileLesson.route('https://www.youtube.com/iframe_api',r=>r.fulfill({status:200,body:'',contentType:'application/javascript'}));
 await mobileLesson.goto(base+'#/aula/freud-antes-de-ser-freud',{waitUntil:'domcontentloaded'});
 await mobileLesson.locator('[data-profile-login]').waitFor();
 await mobileLesson.evaluate(()=>{
  const uid='teste-mobile-altura';
  window.AtelieCloud={user:{uid,displayName:'Teste Mobile'},ready:true,save:async()=>true,loadLessonProgress:async()=>null,saveLessonProgress:async()=>true,logout:async()=>true};
  dispatchEvent(new CustomEvent('atelie-cloud-auth',{detail:{uid}}));
  dispatchEvent(new CustomEvent('atelie-cloud-loaded',{detail:{uid,exists:false,state:null}}));
  dispatchEvent(new CustomEvent('atelie-cloud-ready',{detail:{uid}}));
 });
 await mobileLesson.locator('#freudLessonFrame').waitFor({state:'visible'});
 await mobileLesson.locator('#freudLessonFrame').contentFrame().locator('#step-1').waitFor({state:'visible'});
 await mobileLesson.waitForFunction(fitted,null,{timeout:15000});
 console.log('OK — Iframe ajusta altura ao rodapé também no tamanho de iPhone, sem sobra vazia.');


 // Quarta aula: regressão contra querySelector(...).forEach e erro ao abrir sanfonas.
 const fourth=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const fourthErrors=[];
 fourth.on('pageerror',err=>fourthErrors.push(err.message));
 await fourth.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
 await fourth.route('https://www.youtube-nocookie.com/**',r=>r.fulfill({status:200,body:'',contentType:'text/html'}));
 await fourth.route('https://www.youtube.com/iframe_api',r=>r.fulfill({status:200,body:'',contentType:'application/javascript'}));
 await fourth.goto(base+'#/aula/freud-obra-e-fundador',{waitUntil:'domcontentloaded'});
 await fourth.locator('[data-profile-login]').waitFor();
 await fourth.evaluate(()=>{
  const uid='teste-quarta-aula';
  window.AtelieCloud={user:{uid,displayName:'Aluno Quarta Aula'},ready:true,
    save:async()=>true,loadLessonProgress:async()=>({done:[1],explored:[],answers:{},version:1}),
    saveLessonProgress:async()=>true,logout:async()=>true};
  dispatchEvent(new CustomEvent('atelie-cloud-auth',{detail:{uid}}));
  dispatchEvent(new CustomEvent('atelie-cloud-loaded',{detail:{uid,exists:false,state:null}}));
  dispatchEvent(new CustomEvent('atelie-cloud-ready',{detail:{uid}}));
 });
 const fourthLesson=fourth.frameLocator('#freudLessonFrame');
 await fourthLesson.locator('#step-1').waitFor({state:'visible'});
 await fourthLesson.locator('#step-2').waitFor({state:'visible'});
 assert.equal(await fourthLesson.locator('.progress-segments span').count(),7);
 await fourthLesson.locator('.accordion').first().locator('summary').click();
 await fourth.waitForFunction(()=>{
   const frame=document.querySelector('#freudLessonFrame');
   return frame?.contentDocument?.querySelector('#explore-status')?.textContent?.includes('1 de 3');
 });
 assert.deepEqual(fourthErrors,[],'A quarta aula não deve lançar erros JS');
 console.log('OK — Quarta aula inicia e abre sanfona sem TypeError.');

 console.log('OK — Terceira aula abre dentro do Ateliê, com vídeo e desbloqueio progressivo.');
 console.log('OK — Navegação em duas áreas, sem duplicação de submenus.');
}finally{await browser.close()}
