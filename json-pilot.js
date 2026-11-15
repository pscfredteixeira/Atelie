/* Ateliê · Sprint JSON 3 — leitor genérico de catálogo/curso/aula JSON v1.
 * Mantém os dados de laboratório separados do catálogo público e do Firestore.
 * O motor de blocos é o mesmo usado pelo sistema legado em src/lesson-engine/.
 */
import {validateCatalog,validateCourse,validateLessonLink} from "./src/repositories/validators.js";
import {renderLessonBlocks,getLessonOutline} from "./src/lesson-engine/engine.js";
import {checkQuiz,exploreLab} from "./src/features/learning/activities.js";
import {confirmQuizStep,advanceQuiz,retryQuizStep,restartQuiz} from "./src/features/learning/quiz-flow.js";

const CATALOG=new URL("./content/piloto-json-sprint-02/catalogo.json",import.meta.url);
const ROOT=new URL("./content/piloto-json-sprint-02/",import.meta.url);
const ID_PATTERN=/^[a-zA-Z0-9_-]+$/;
const escapeHTML=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const sortByPosition=items=>[...(items||[])].sort((a,b)=>a.position-b.position);
const laboratoryURL=(courseId,lessonId)=>"#/laboratorio/json?curso="+encodeURIComponent(courseId)+"&aula="+encodeURIComponent(lessonId);
const validId=id=>typeof id==="string"&&ID_PATTERN.test(id);

function resolveJSON(relative,base){
 if(typeof relative!=="string"||!/^\.\/[a-zA-Z0-9_/-]+\.json$/.test(relative))
   throw new Error("Caminho JSON não permitido.");
 const url=new URL(relative,base);
 if(url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname)||url.search||url.hash)
   throw new Error("Arquivo fora do catálogo de laboratório.");
 return url;
}
async function fetchJSON(url){
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),10000);
 try{
  const response=await fetch(url.href,{cache:"no-cache",signal:controller.signal});
  if(!response.ok)throw new Error("Arquivo indisponível (HTTP "+response.status+").");
  return await response.json();
 }catch(error){
  if(error?.name==="AbortError")throw new Error("O carregamento demorou demais. Tente novamente.");
  throw error;
 }finally{clearTimeout(timeout)}
}
export async function readPilotCatalog(){
 const catalog=validateCatalog(await fetchJSON(CATALOG));
 return catalog.courses.filter(entry=>entry.status==="published");
}
export async function readPilotCourse(courseId){
 if(!validId(courseId))throw new Error("Identificador de curso inválido.");
 const entries=await readPilotCatalog();
 const entry=entries.find(item=>item.id===courseId);
 if(!entry)throw new Error("Curso não encontrado no catálogo de laboratório.");
 const courseURL=resolveJSON(entry.manifest,CATALOG);
 const course=validateCourse(await fetchJSON(courseURL));
 if(course.id!==entry.id||course.status!=="published")throw new Error("Manifesto do curso incompatível.");
 const lessons=sortByPosition(course.modules).flatMap(module=>
  sortByPosition(module.lessons).filter(item=>!item.status||item.status==="published").map(item=>({
   id:item.id,title:item.title||module.title,summary:item.summary||"",
   estimatedMinutes:item.estimatedMinutes,moduleId:module.id,courseId:course.id
  }))
 );
 return {entry,course,courseURL,lessons};
}
export async function readPilotLesson(courseId,lessonId){
 if(!validId(lessonId))throw new Error("Identificador de aula inválido.");
 const {course,courseURL,entry,lessons}=await readPilotCourse(courseId);
 const module=sortByPosition(course.modules).find(m=>m.lessons.some(item=>item.id===lessonId&&(!item.status||item.status==="published")));
 const listed=module?.lessons.find(item=>item.id===lessonId);
 if(!listed)throw new Error("Aula não encontrada no manifesto do curso.");
 const lessonURL=resolveJSON(listed.path,courseURL);
 const lesson=validateLessonLink(await fetchJSON(lessonURL),course,module.id);
 if(lesson.id!==listed.id||lesson.status!=="published")throw new Error("Aula não publicada ou com ID incompatível.");
 if(lesson.metadata?.interactivePage||!lesson.blocks.length)
   throw new Error("O laboratório genérico aceita somente aulas com blocos JSON.");
 return {entry,course,module,lesson,lessonURL,lessons};
}
export function parsePilotSelection(hash){
 const raw=String(hash||"");
 const parts=raw.split("?");
 if(parts[0]!=="#/laboratorio/json")return {error:"Rota de laboratório inválida."};
 if(parts.length>2)return {error:"Parâmetros de laboratório inválidos."};
 const params=new URLSearchParams(parts[1]||"");
 const keys=[...params.keys()];
 if(keys.some(k=>k!=="curso"&&k!=="aula")||params.getAll("curso").length>1||params.getAll("aula").length>1)
   return {error:"Parâmetros desconhecidos ou duplicados."};
 const courseId=params.get("curso"),lessonId=params.get("aula");
 if(!keys.length)return {mode:"catalog"};
 if(!courseId||!lessonId)return {error:"Informe curso e aula para abrir um conteúdo."};
 if(!validId(courseId)||!validId(lessonId))return {error:"Selecione um curso e uma aula válidos."};
 return {mode:"lesson",courseId,lessonId};
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
   const target=root.querySelectorAll("[id]");
   const element=[...target].find(node=>node.id===jump.dataset.pilotJump);
   if(element){element.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});element.focus({preventScroll:true})}
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
function renderCatalogHeader(title,summary){
 return '<a class="back-link" href="#/estudio">← Voltar ao Estúdio</a>'+
  '<header class="json-pilot-hero"><span class="eyebrow">ATELIÊ · LABORATÓRIO JSON</span>'+
  '<h1>'+escapeHTML(title)+'</h1><p>'+escapeHTML(summary)+'</p></header>';
}
function renderLessonLinks(lessons,activeId,back="#/laboratorio/json"){
 const items=lessons.map((item,index)=>
  '<li><a class="json-pilot-lesson-link'+(item.id===activeId?' is-current':'')+
  '" href="'+escapeHTML(laboratoryURL(item.courseId,item.id))+'"'+
  (item.id===activeId?' aria-current="page"':'')+'><span>'+String(index+1).padStart(2,"0")+
  '</span><strong>'+escapeHTML(item.title)+'</strong></a></li>').join("");
 return '<nav class="json-pilot-lesson-nav" aria-label="Aulas do curso"><a class="json-pilot-all-link" href="'+back+'">Ver todos os cursos</a>'+
  '<ol>'+items+'</ol></nav>';
}
async function renderCatalog(root){
 const entries=await readPilotCatalog();
 const loaded=await Promise.all(entries.map(async entry=>{
  try{return {entry,...await readPilotCourse(entry.id)}}
  catch(error){return {entry,error:error?.message||"Manifesto indisponível."}}
 }));
 if(!root.isConnected)return;
 root.innerHTML=renderCatalogHeader("Explore aulas criadas com JSON","O mesmo motor monta diferentes cursos e aulas a partir do catálogo e dos manifests. Este espaço é exclusivamente um laboratório técnico.")+
  '<div class="json-pilot-notice" role="note">Estes exemplos não fazem parte da formação publicada. Não há matrícula, gravação de respostas ou certificação no laboratório.</div>'+
  (loaded.length?'<div class="json-pilot-course-grid">'+loaded.map(row=>
   '<section class="json-pilot-course-card"><span class="eyebrow">CURSO DE TESTE</span><h2>'+escapeHTML(row.entry.title)+'</h2>'+
   '<p>'+escapeHTML(row.entry.summary||"Uma seleção de aulas de demonstração.")+'</p>'+
   (row.error?'<p role="alert" class="json-pilot-error-inline">'+escapeHTML(row.error)+'</p>':
    '<ol>'+row.lessons.map((item,i)=>'<li><a href="'+escapeHTML(laboratoryURL(row.course.id,item.id))+'"><span>'+String(i+1).padStart(2,"0")+'</span><strong>'+escapeHTML(item.title)+'</strong><small>'+escapeHTML(item.estimatedMinutes||"")+" min</small></a></li>').join("")+'</ol>')+
   '</section>').join("")+'</div>':'<p>Nenhum curso de demonstração disponível.</p>');
}
async function renderSelectedLesson(root,courseId,lessonId){
 const {course,lesson,lessonURL,lessons}=await readPilotLesson(courseId,lessonId);
 if(!root.isConnected)return;
 const outline=getLessonOutline(lesson);
 const position=lessons.findIndex(item=>item.id===lesson.id);
 const previous=lessons[position-1],next=lessons[position+1];
 const pager='<nav class="json-pilot-pager" aria-label="Navegação entre aulas">'+
  (previous?'<a class="btn btn-outline" href="'+escapeHTML(laboratoryURL(course.id,previous.id))+'">← '+escapeHTML(previous.title)+'</a>':'')+
  (next?'<a class="btn btn-primary" href="'+escapeHTML(laboratoryURL(course.id,next.id))+'">'+escapeHTML(next.title)+' →</a>':'')+
  '</nav>';
 root.innerHTML=
  '<a class="back-link" href="#/laboratorio/json">← Todas as aulas JSON</a>'+
  '<header class="json-pilot-hero"><span class="eyebrow">ATELIÊ · '+escapeHTML(course.title)+'</span>'+
  '<h1>'+escapeHTML(lesson.title)+'</h1><p>'+escapeHTML(lesson.summary)+'</p>'+
  '<div class="json-pilot-tags"><span>JSON v1</span><span>'+escapeHTML(lesson.estimatedMinutes)+' minutos estimados</span><span>'+lesson.blocks.length+' blocos</span></div></header>'+
  '<div class="json-pilot-notice" role="note">Esta aula demonstra o motor JSON. As respostas não são armazenadas e nenhum progresso é enviado ao Firebase. <strong>Aulas oficiais permanecem intactas.</strong></div>'+
  '<div class="json-pilot-grid"><article class="json-pilot-reading">'+
  '<section class="json-pilot-goals"><h2>Objetivos de aprendizagem</h2><ul>'+
  (lesson.objectives||[]).map(item=>'<li>'+escapeHTML(item)+'</li>').join("")+'</ul></section>'+
  renderLessonBlocks(lesson,{sourceURL:lessonURL.href})+
  '<p class="json-pilot-last-note">Fim da demonstração: o resultado não equivale a conclusão de aula certificada.</p>'+
  pager+'</article><aside class="json-pilot-sidebar" aria-label="Índice da aula"><h2>Nesta aula</h2>'+
  '<ol>'+outline.map((item,i)=>'<li><button type="button" data-pilot-jump="'+escapeHTML(item.id)+'"><span>'+String(i+1).padStart(2,"0")+'</span>'+escapeHTML(item.label)+'</button></li>').join("")+
  '</ol><h2 class="json-pilot-sibling-title">Outras aulas do curso</h2>'+renderLessonLinks(lessons,lesson.id)+'</aside></div>';
 attachInteractions(root);
}
export async function mountJSONPilot(root,hash=location.hash){
 if(!root?.isConnected)return;
 const selection=parsePilotSelection(hash);
 root.innerHTML='<p class="json-pilot-loading" role="status">Carregando conteúdos JSON…</p>';
 try{
  if(selection.error)throw new Error(selection.error);
  if(selection.mode==="catalog")await renderCatalog(root);
  else await renderSelectedLesson(root,selection.courseId,selection.lessonId);
 }catch(error){
  if(!root.isConnected)return;
  root.innerHTML='<div class="json-pilot-error" role="alert"><h2>Não foi possível abrir este conteúdo.</h2>'+
   '<p>'+escapeHTML(error?.message||"Erro ao ler o JSON.")+'</p>'+
   '<a class="btn btn-outline" href="#/laboratorio/json">Voltar ao catálogo do laboratório</a>'+
   '<button class="btn btn-outline" type="button" data-pilot-retry>Tentar novamente</button></div>';
  root.querySelector("[data-pilot-retry]")?.addEventListener("click",()=>mountJSONPilot(root,hash),{once:true});
 }
}
