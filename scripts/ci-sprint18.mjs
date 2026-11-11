/* Regressão: vitrine pública e aulas pessoais no Firestore. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 await page.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
 await page.route(/youtube|ytimg|googlevideo|wikimedia/,r=>r.abort());
 const base='http://127.0.0.1:4173/';
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.locator('.course-card').first().waitFor();
 assert.equal(await page.locator('.course-card').count(),1,'O catálogo apresenta um curso Formação Freudiana');
 await page.goto(base+'#/curso/formacao-freudiana',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('.course-program-module').count(),2,'O curso oferece dois percursos');
 assert.equal(await page.locator('.course-program-module[open]').count(),0,'Percursos iniciam fechados');
 await page.goto(base+'#/aula/escuta-que-mudou-a-clinica',{waitUntil:'domcontentloaded'});
 await page.locator('[data-profile-login]').waitFor();
 assert.equal(await page.locator('#freudLessonFrame').count(),0);
 await page.evaluate(()=>{
  window.__writes=[];
  window.AtelieCloud={
   user:{uid:'A',displayName:'Aluno A',email:'a@example.com',photoURL:null},ready:true,
   loadLessonProgress:async()=>null,
   saveLessonProgress:async()=>true,
   save:async payload=>{window.__writes.push(JSON.parse(JSON.stringify(payload)));return true;},
   logout:async()=>true
  };
  dispatchEvent(new CustomEvent('atelie-cloud-auth',{detail:{uid:'A'}}));
  dispatchEvent(new CustomEvent('atelie-cloud-loaded',{detail:{uid:'A',state:null,exists:false}}));
  dispatchEvent(new CustomEvent('atelie-cloud-ready',{detail:{uid:'A'}}));
 });
 await page.locator('#freudLessonFrame').waitFor();
 await page.locator('#freudLessonFrame').contentFrame().locator('.account-progress-ready').waitFor({state:'attached'});
 assert.equal(await page.locator('#searchForm').isVisible(),false);
 assert.equal(await page.locator('#freudLiveProgress').evaluate(e=>getComputedStyle(e).position),'static');
 await page.goto(base+'#/aula/primeira-topica-freud',{waitUntil:'domcontentloaded'});
 await page.locator('#freudLessonFrame').waitFor();
 await page.locator('#freudLessonFrame').contentFrame().locator('.account-progress-ready').waitFor({state:'attached'});
 assert.equal(await page.locator('#searchForm').isVisible(),false);
 await page.locator('#lessonNote').fill('Anotação ligada à conta A');
 await page.waitForFunction(()=>window.__writes.some(x=>x.notes?.['primeira-topica-freud']==='Anotação ligada à conta A'));
 await page.goto(base+'#/caderno',{waitUntil:'domcontentloaded'});
 await page.getByText('Anotação ligada à conta A',{exact:false}).waitFor();
 console.log('OK — dois percursos no mesmo curso, autenticação exigida e notas da conta gravadas via Firestore simulado.');
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await mobile.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
 await mobile.goto(base+'#/cursos',{waitUntil:'domcontentloaded'});
 assert.equal(await mobile.locator('.course-card').count(),1);
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true);
 await mobile.locator('#menuToggle').click();
 await mobile.locator('#sidebar a[href="#/perfil"]').click();
 await mobile.locator('[data-profile-login]').waitFor();
 console.log('OK — catálogo e menu mobile preservados.');
}finally{await browser.close()}
