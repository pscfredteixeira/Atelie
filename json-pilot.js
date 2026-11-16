/* Ateliê · Sprint JSON 2 — ponte de teste para o motor v1 no site principal.
 * Conteúdo isolado do catálogo de produção. Nenhum progresso de aluno é salvo.
 */
import {validateCatalog,validateCourse,validateLessonLink} from "./src/repositories/validators.js";
import {renderLessonBlocks,getLessonOutline} from "./src/lesson-engine/engine.js";
import {checkQuiz,exploreLab} from "./src/features/learning/activities.js";
import {confirmQuizStep,advanceQuiz,retryQuizStep,restartQuiz} from "./src/features/learning/quiz-flow.js";

const CATALOG = new URL("./content/piloto-json-sprint-02/catalogo.json",import.meta.url);
const ROOT = new URL("./content/piloto-json-sprint-02/",import.meta.url);
const escapeHTML=s=>String(s??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
function resolveJSON(relative,base){
 if(typeof relative!=="string"||!/^\.\/[a-zA-Z0-9_/-]+\.json$/.test(relative))
   throw new Error("Caminho JSON não permitido.");
 const url=new URL(relative,base);
 if(url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname)||url.search||url.hash)
   throw new Error("Arquivo fora do laboratório.");
 return url;
}
async function fetchJSON(url){
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),10000);
 try{
  const response=await fetch(url,{cache:"no-cache",signal:controller.signal});
  if(!response.ok)throw new Error("Arquivo indisponível (HTTP "+response.status+").");
  return await response.json();
 }finally{clearTimeout(timeout);}
}
export async function readPilotLesson(){
 const catalog=validateCatalog(await fetchJSON(CATALOG));
 const entry=catalog.courses.find(c=>c.id==="curso-piloto-json-02"&&c.status==="published");
 if(!entry)throw new Error("O catálogo do laboratório não contém o curso.");
 const courseURL=resolveJSON(entry.manifest,CATALOG);
 const course=validateCourse(await fetchJSON(courseURL));
 if(course.id!==entry.id||course.status!=="published")throw new Error("Manifesto incompatível.");
 const module=course.modules.find(m=>m.id==="modulo-piloto-json-02");
 const listed=module?.lessons.find(l=>l.id==="aula-escuta-e-hipoteses-piloto");
 if(!listed)throw new Error("A aula não consta do manifesto.");
 const lessonURL=resolveJSON(listed.path,courseURL);
 const lesson=validateLessonLink(await fetchJSON(lessonURL),course,module.id);
 if(lesson.id!==listed.id||lesson.status!=="published")throw new Error("Aula indisponível.");
 return {catalog,course,module,lesson,lessonURL};
}

function attachInteractions(root){
 root.addEventListener("submit",event=>{
  const form=event.target.closest('form[data-activity="quiz"]');
  if(!form||!root.contains(form))return;
  event.preventDefault();
  if(form.closest(".quiz-carousel-slide")?.dataset.answered==="true")return;
  const result=checkQuiz(form);
  if(result.answered)confirmQuizStep(form,result);
 });
 root.addEventListener("click",event=>{
  const jump=event.target.closest("[data-pilot-jump]");
  if(jump&&root.contains(jump)){
   const sectionId=jump.dataset.pilotJump;
   const target=[...root.querySelectorAll("[id]")].find(node=>node.id===sectionId);
   if(target){target.scrollIntoView({behavior:"smooth",block:"start"});target.focus({preventScroll:true})}
   return;
  }
  const lab=event.target.closest("[data-branch]");
  if(lab&&root.contains(lab)){exploreLab(lab);return;}
  const retry=event.target.closest("[data-quiz-retry]");
  if(retry&&root.contains(retry)){retryQuizStep(retry);return;}
  const next=event.target.closest("[data-quiz-next]");
  if(next&&root.contains(next)){advanceQuiz(next);return;}
  const restart=event.target.closest("[data-quiz-restart]");
  if(restart&&root.contains(restart))restartQuiz(restart);
 });
}
export async function mountJSONPilot(root){
 if(!root||!root.isConnected)return;
 root.innerHTML='<p class="json-pilot-loading" role="status">Carregando o catálogo, o manifesto e os blocos JSON…</p>';
 try{
  const {lesson,lessonURL}=await readPilotLesson();
  if(!root.isConnected)return;
  const outline=getLessonOutline(lesson);
  root.innerHTML=
   '<a class="back-link" href="#/estudio">← Voltar ao Estúdio</a>'+
   '<header class="json-pilot-hero"><span class="eyebrow">ATELIÊ · SPRINT JSON 2</span>'+
   '<h1>'+escapeHTML(lesson.title)+'</h1>'+
   '<p>'+escapeHTML(lesson.summary)+'</p>'+
   '<div class="json-pilot-tags"><span>Piloto técnico</span><span>'+escapeHTML(lesson.estimatedMinutes)+' minutos estimados</span><span>'+lesson.blocks.length+' blocos JSON</span></div></header>'+
   '<div class="json-pilot-notice" role="note">Esta aula demonstra o motor JSON no Ateliê atual. As escolhas e respostas funcionam apenas nesta visita. <strong>Não há salvamento de progresso, matrícula, certificado ou publicação no catálogo principal.</strong> Nenhuma aula já publicada foi alterada.</div>'+
   '<div class="json-pilot-grid"><article class="json-pilot-reading">'+
   '<section class="json-pilot-goals"><h2>Objetivos de aprendizagem</h2><ul>'+
   (lesson.objectives||[]).map(item=>'<li>'+escapeHTML(item)+'</li>').join("")+
   '</ul></section>'+
   renderLessonBlocks(lesson,{sourceURL:lessonURL.href})+
   '<p class="json-pilot-last-note">Fim da demonstração. Respostas não são enviadas ao Firebase.</p></article>'+
   '<aside class="json-pilot-sidebar" aria-label="Índice da aula"><h2>Nesta aula</h2>'+
   '<ol>'+outline.map((item,i)=>'<li><button type="button" data-pilot-jump="'+escapeHTML(item.id)+'"><span>'+String(i+1).padStart(2,"0")+'</span>'+escapeHTML(item.label)+'</button></li>').join("")+
   '</ol></aside></div>';
  attachInteractions(root);
 }catch(error){
  if(!root.isConnected)return;
  root.innerHTML='<div class="json-pilot-error" role="alert"><h2>Não foi possível carregar o piloto.</h2>'+
    '<p>'+escapeHTML(error?.message||"Erro ao ler o conteúdo JSON.")+'</p>'+
    '<button class="btn btn-outline" type="button" data-pilot-retry>Tentar novamente</button></div>';
  root.querySelector("[data-pilot-retry]")?.addEventListener("click",()=>mountJSONPilot(root),{once:true});
 }
}
