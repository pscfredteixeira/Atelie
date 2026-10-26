import {contentRepository} from "../repositories/content-repository.js";
import {learnerContentRepository} from "../repositories/learner-content-repository.js?build=aula-online-v2-20261015";
import {getLocalAvailableCourse,listLocalAvailableCourses} from "../repositories/local-catalog-repository.js";
import {getDraft,listDrafts} from "../repositories/draft-repository.js";
import {renderLessonBlocks,getLessonOutline,listRegisteredBlocks} from "../lesson-engine/engine.js?build=secoes-pedagogicas-20261026-v1";
import {getCourseJourney,getLessonContext,summarizeCourse} from "../features/learning/journey.js";
import {getCourseEntries} from "../features/learning/course-entries.js";
import {getCourseDraft,listCourseDrafts} from "../repositories/course-draft-repository.js";
import {LESSON_TEMPLATES} from "../features/authoring/lesson-templates.js";
import {lessonNotebook,notebookPage,progressPage} from "../features/learning/learning-ui.js?build=sprint15-20261015";
import {renderBeta} from "../features/administration/beta-ui.js";
import {escapeHTML as e,badge,action,demoAction,note,pageHead,sectionHead,card,emptyState,notFound} from "../ui/components.js";
const routeCourse=id=>"#/cursos/"+encodeURIComponent(id);
const routeLesson=(cid,lid)=>routeCourse(cid)+"/aulas/"+encodeURIComponent(lid);
const routeManage=id=>"#/professor/cursos/"+encodeURIComponent(id);
const routeEdit=(cid,lid)=>routeManage(cid)+"/aulas/"+encodeURIComponent(lid)+"/editar";
const routePreview=(cid,lid)=>routeManage(cid)+"/aulas/"+encodeURIComponent(lid)+"/previa";
const info=()=>note("<strong>Como os cursos funcionam:</strong> os cursos do GitHub são públicos; os cursos criados e disponibilizados nesta plataforma aparecem somente neste navegador. Não há contas reais nem sincronização entre dispositivos.");
function metrics(items){return '<div class="metrics">'+items.map(([count,title])=>'<div class="metric"><strong>'+e(count)+'</strong><span>'+e(title)+'</span></div>').join('')+'</div>';}
function courseCard(item,index=0){
  const number=String(index+1).padStart(2,"0");
  const href=routeCourse(item.id);
  return '<article class="course-tile course-tile--'+(index%3+1)+'">'+
    '<a class="course-tile-link" href="'+e(href)+'" aria-label="Conhecer o curso '+e(item.title)+'">'+
    '<div class="course-tile-art" aria-hidden="true"><span class="course-art-ring"></span>'+
    '<span class="course-art-glyph">'+e(item.icon||"ψ")+'</span></div>'+
    '<div class="course-tile-body"><span class="course-tile-count">'+number+' <span>· CURSO</span></span>'+
    '<h3>'+e(item.title)+'</h3>'+
    '<p>'+e(item.summary||"Explore um percurso de leituras e atividades em psicanálise.")+'</p>'+
    '<span class="course-tile-cta">Conhecer o curso <span aria-hidden="true">↗</span></span></div></a></article>';
}
function courseHeader(course){
 return pageHead("Curso / Formação",e(course.title),course.subtitle||course.description||"Percurso de estudo e pesquisa.");
}
function modules(course,teacher=false,currentLessonId=null){
 const entries=getCourseEntries(course,{includeDrafts:teacher});
 if(!entries.length)return emptyState("Curso em preparação","Este curso ainda não possui aulas.");
 return '<div class="course-lesson-list" aria-label="Sequência de aulas">'+entries.map(item=>{
   const current=currentLessonId===item.id;
   const href=teacher?
     (item.planned?routeManage(course.id)+"?aula="+encodeURIComponent(item.moduleId):routeEdit(course.id,item.id)):
     routeLesson(course.id,item.id);
   const label=item.planned?"Em preparação":teacher?"Abrir no Estúdio":"Abrir aula";
   return '<a class="course-lesson-link'+(current?" is-current":"")+'" href="'+e(href)+'"'+
     (current?' aria-current="page"':'')+'>'+
     '<span class="course-lesson-index">'+String(item.number).padStart(2,"0")+'</span>'+
     '<span class="course-lesson-body"><strong>'+e(item.title)+'</strong>'+
       (item.summary?'<small>'+e(item.summary)+'</small>':"")+'</span>'+
     '<span class="course-lesson-action">'+e(label)+' <span aria-hidden="true">→</span></span></a>';
 }).join("")+'</div>';
}
async function studentHome(){
 const list=await learnerContentRepository.listPublishedCourses();
 const first=list[0];
 const hero='<section class="home-hero" aria-labelledby="atelier-home-title">'+
   '<div class="home-hero-copy">'+
   '<span class="home-kicker">CONHECIMENTO, ESCUTA E EXPERIÊNCIA</span>'+
   '<h1 id="atelier-home-title">Um laboratório de ideias <em>para aprender psicanálise.</em></h1>'+
   '<p>Estude no seu ritmo. Leia, questione e construa seu próprio percurso de investigação e reflexão.</p>'+
   '<div class="home-hero-actions">'+
   action("Explorar os cursos →","#/cursos","action")+
   action("Abrir meu caderno","#/aluno/caderno","quiet")+
   '</div></div>'+
   '<div class="home-hero-art" aria-hidden="true"></div></section>';
 const featured=first?
   '<section class="featured-course" aria-label="Curso em destaque">'+
   '<div class="featured-course-art" aria-hidden="true"><span>ψ</span></div>'+
   '<div class="featured-course-copy"><span class="overline">CURSO EM DESTAQUE</span>'+
   '<h2>'+e(first.title)+'</h2>'+
   '<p>'+e(first.summary||"Um percurso de estudo para investigar a psicanálise.")+'</p>'+
   '<span class="featured-course-meta">Aulas · Leitura · Atividades</span></div>'+
   '<div class="featured-course-action">'+action("Conhecer o percurso →",routeCourse(first.id),"action")+'</div></section>':
   emptyState("Ainda não há cursos publicados","O catálogo receberá cursos conforme forem revisados e publicados.");
 return '<div class="learning-home">'+hero+featured+
   sectionHead("Nossos cursos",action("Ver todos os cursos →","#/cursos","quiet small"))+
   (list.length?'<div class="course-gallery">'+list.map((course,i)=>courseCard(course,i)).join('')+'</div>':'')+
   '<div class="home-tools"><div><span class="overline">SEU ESPAÇO DE ESTUDOS</span>'+
   '<h2>Suas ideias também fazem parte do percurso.</h2>'+
   '<p>Retome suas anotações ou consulte o andamento das aulas estudadas neste dispositivo.</p></div>'+
   '<div class="button-row">'+action("Meu caderno →","#/aluno/caderno","small")+
   action("Meu progresso →","#/aluno/progresso","small")+'</div></div>'+
   info()+'</div>';
}
async function catalog(){
 const list=await learnerContentRepository.listPublishedCourses();
 return pageHead("Aprender / Cursos","O que você deseja <em>investigar?</em>",
 "Explore tanto os cursos públicos quanto os cursos que você criou e disponibilizou neste dispositivo.")+
 (list.length?'<div class="course-gallery">'+list.map((course,i)=>courseCard(course,i)).join('')+'</div>':
 emptyState("Nenhum curso disponível","A biblioteca ainda está sendo preparada.",
 action("Voltar ao início →","#/aluno","action")))+info();
}
async function coursePage(id){
 const {course,local}=await learnerContentRepository.getPublishedCourse(id);
 const sequence=getCourseJourney(course),stats=summarizeCourse(course);
 const entries=getCourseEntries(course);
 return courseHeader(course)+
 (local?'<p class="notice" role="note"><strong>Curso deste dispositivo.</strong> Este percurso foi disponibilizado somente neste navegador. Outros usuários ainda não o veem pela internet.</p>':'')+
 '<div class="course-eyebrow">Um percurso de aprendizagem · do primeiro conceito ao último</div>'+
 metrics([[entries.length,entries.length===1?"Aula no curso":"Aulas no curso"],
   [entries.filter(x=>x.planned).length,"Em preparação"],
   [stats.durationMinutes===null?"—":stats.durationMinutes+" min","Tempo disponível"]])+
 (sequence.length?'<section class="course-start"><div><span class="overline">Seu ponto de partida</span>'+
 '<h2>Comece pela primeira aula</h2><p>'+e(sequence[0].title)+'</p></div>'+
 action("Começar a estudar →",routeLesson(course.id,sequence[0].id),"action")+'</section>':'')+
 (course.objectives?.length?'<section class="card course-goals"><div class="card-label">O que você poderá compreender</div><ul>'+
 course.objectives.map(o=>'<li>'+e(o)+'</li>').join('')+'</ul></section>':'')+
 sectionHead("Programa de estudos",badge("Sequência sugerida","purple"))+
 modules(course)+
 note("<strong>Seu percurso:</strong> você pode revisitar qualquer aula e marcá-la como concluída no caderno ao final da leitura. O acompanhamento fica somente neste navegador, no perfil fictício selecionado.")+info();
}
function reader(lesson,{isPreview=false,hasDraft=false,sourceURL,showHeading=true}={}){
 const html=renderLessonBlocks(lesson,{sourceURL});
 const outline=getLessonOutline(lesson);
 const description=lesson.summary||"Uma aula com textos e experiências pedagógicas estruturadas em JSON.";
 const heading=showHeading?
    '<span class="overline">Aula · '+(isPreview?'Prévia do professor':'Conteúdo publicado')+'</span>'+
    '<h2>'+e(lesson.title)+'</h2><p>'+e(description)+'</p>':
    '<span class="overline reader-reading-label">Leitura e atividades</span>';
 const inner='<article class="reader"><div class="reader-inner">'+heading+
  (lesson.objectives?.length?'<div class="reader-objectives"><strong>Ao final desta aula</strong><ul>'+
   lesson.objectives.map(o=>'<li>'+e(o)+'</li>').join('')+'</ul></div>':'')+
  (html||'<p>Esta aula ainda não possui blocos.</p>')+'</div></article>';
 const links=outline.map((x,i)=>'<li><button type="button" class="lesson-jump" data-scroll-block="'+e(x.id)+'">'+
   '<span class="lesson-jump-no">'+String(i+1).padStart(2,"0")+'</span><span>'+e(x.label)+'</span></button></li>').join("");
 const sidebar='<aside class="sidepanel lesson-sidebar"><span class="overline">Índice da aula</span><h3>'+e(outline.length)+' momentos de estudo</h3>'+
  (outline.length?'<nav aria-label="Etapas desta aula"><ol class="lesson-outline">'+links+'</ol></nav>':
   '<p class="hint">Aula sem blocos de estudo.</p>')+
  '<div class="rule"></div><p class="hint">O índice leva à seção correspondente. Ele não representa conclusão ou avaliação.</p>'+
  '<div class="rule"></div><div>'+badge(hasDraft?"Rascunho salvo localmente":isPreview?"Prévia do publicado":"JSON publicado","purple")+'</div>'+
  '<div class="rule"></div>'+action(isPreview?"Voltar ao editor →":"Voltar ao curso →",
     isPreview?routeEdit(lesson.courseId,lesson.id):routeCourse(lesson.courseId),"small")+'</aside>';
 return '<div class="reading-layout">'+inner+sidebar+'</div>';
}
function lessonPager(course,ctx){
 const cardLink=(entry,label)=>{
   return '<a class="journey-pager-link" href="'+e(routeLesson(course.id,entry.id))+'">'+
   '<span class="overline">'+e(label)+'</span><strong>'+e(entry.title)+'</strong>'+
   '<span class="journey-pager-arrow" aria-hidden="true">'+(label==="Aula anterior"?"←":"→")+'</span></a>';
 };
 return '<nav class="journey-pager" aria-label="Navegação entre aulas">'+
 (ctx.previous?cardLink(ctx.previous,"Aula anterior"):
  '<div class="journey-pager-end"><span class="overline">Início do percurso</span><p>Esta é a primeira aula.</p></div>')+
 (ctx.next?cardLink(ctx.next,"Próxima aula"):
  '<div class="journey-pager-end"><span class="overline">Fim do percurso</span><p>Você chegou à última aula disponível. Isso não registra conclusão automaticamente.</p></div>')+
 '</nav>';
}
async function lessonPage(cid,lid){
 let record;
 try{record=await learnerContentRepository.getPublishedLesson(cid,lid);}
 catch(error){
   if(error.code!=="not_found")throw error;
   const {course}=await learnerContentRepository.getPublishedCourse(cid);
   const planned=getCourseEntries(course).find(item=>item.planned&&item.id===lid);
   if(!planned)throw error;
   return pageHead("Aluno / Aula "+planned.number,e(planned.title),planned.summary)+
     '<section class="card planned-lesson-state"><span class="overline">Aula '+String(planned.number).padStart(2,"0")+
     ' de '+planned.total+'</span><h2>Conteúdo em preparação</h2>'+
     '<p>Esta aula já faz parte do programa, mas o conteúdo didático ainda não foi produzido e disponibilizado.</p>'+
     action("Ver todas as aulas →",routeCourse(cid),"action")+'</section>'+
     '<div class="course-program-return">'+sectionHead("Programa do curso")+
     modules(course,false,lid)+'</div>';
 }
 const {course,lesson,contentURL,local}=record;
 const context=getLessonContext(course,lid);
 const program=getCourseEntries(course);
 const programIndex=program.findIndex(item=>item.id===lid);
 const displayIndex=programIndex===-1?context.index:programIndex;
 const displayTotal=program.length||context.sequence.length;
 const breadcrumb='<nav class="journey-breadcrumb" aria-label="Localização no curso">'+
 action("Todos os cursos","#/cursos","quiet small")+'<span aria-hidden="true">/</span>'+
 action(e(course.title),routeCourse(cid),"quiet small")+
 '<span aria-hidden="true">/</span><span aria-current="page">Aula '+(displayIndex+1)+'</span></nav>';
 return breadcrumb+
 (local?'<p class="notice" role="note">Aula disponibilizada somente neste dispositivo.</p>':'')+
 '<div class="lesson-header-info"><div><span class="overline">Aula '+(displayIndex+1)+' de '+displayTotal+' no programa</span>'+
 pageHead("Jornada do aluno",e(lesson.title),lesson.summary)+'</div>'+
 (lesson.estimatedMinutes?badge(lesson.estimatedMinutes+" minutos · estimativa","purple"):'')+'</div>'+
 reader(lesson,{sourceURL:contentURL,showHeading:false})+
 await lessonNotebook(cid,lid)+
 lessonPager(course,context)+
 '<details class="journey-course-drawer"><summary>Consultar programa do curso</summary>'+modules(course,false,lid)+'</details>'+
 note("<strong>Estudo local:</strong> marcar uma aula como concluída e responder a questões registra apenas seu histórico neste navegador, no perfil de teste selecionado. A marcação é voluntária, não certifica aprendizagem.");
}
async function caderno(){return notebookPage(learnerContentRepository);}
async function progresso(){return progressPage(learnerContentRepository);}
async function teacherHome(){
 let publicCourses=[],technicalCourses=[],courseDrafts=[],lessonDrafts=[],localAvailable=[],warnings=[];
 try{
   const all=await contentRepository.listPublishedCourses();
   publicCourses=all.filter(c=>!c.demo);
   technicalCourses=all.filter(c=>c.demo);
 }
 catch(err){warnings.push("Catálogo remoto indisponível: "+err.message);}
 try{courseDrafts=await listCourseDrafts();}
 catch(err){warnings.push(err.message);}
 try{localAvailable=await listLocalAvailableCourses();}
 catch(err){warnings.push("Catálogo deste dispositivo: "+err.message);}
 try{lessonDrafts=await listDrafts();}
 catch(err){warnings.push("Rascunhos de aula: "+err.message);}
 const modifiedIds=new Set(courseDrafts.map(x=>x.id));
 const create='<section class="card authoring-creation"><div class="card-label">Novo curso</div>'+
  '<h2 class="section-title">Comece com um título.</h2><p>O Atelier criará um curso para reunir suas aulas. Você não precisa escrever JSON.</p>'+
  '<form data-authoring-form="new-course" class="authoring-quick-form">'+
  '<label class="field-label" for="create-course-title">Nome do curso</label>'+
  '<div class="authoring-inline"><input class="field" name="icon" maxlength="8" value="ψ" aria-label="Símbolo do curso" title="Símbolo do curso" style="max-width:70px;flex:0 0 70px" placeholder="📚"><input class="field" id="create-course-title" name="title" required maxlength="160" placeholder="Ex.: Introdução à clínica psicanalítica">'+
  '<button class="button action" type="submit">Criar curso local →</button></div>'+
  '</form></section>';
 return pageHead("Atelier / Criar","Organize seu <em>ensino.</em>",
 "Crie cursos e suas aulas diretamente pela interface. Depois, disponibilize o curso na área do aluno deste mesmo navegador, sem precisar editar JSON.")+
 (warnings.length?'<div class="notice" role="alert">'+warnings.map(e).join(" · ")+'</div>':'')+
 metrics([[publicCourses.length,"Cursos públicos"],[localAvailable.length,"Cursos disponíveis neste dispositivo"],[courseDrafts.length,"Cursos em edição"]])+
 create+sectionHead("Meus rascunhos de cursos",badge("Somente neste navegador","purple"))+
 (courseDrafts.length?'<div class="course-list">'+courseDrafts.map(d=>
   '<article class="card course-line"><span aria-hidden="true">✧</span><div><h3>'+e(d.course.title)+'</h3>'+
   '<p>'+getCourseEntries(d.course,{includeDrafts:true}).length+' aula(s) · Salvo localmente em '+e(new Date(d.savedAt).toLocaleString("pt-BR"))+'</p></div>'+
   action("Continuar organizando →",routeManage(d.id),"small")+'</article>').join("")+'</div>':
  emptyState("Nenhum curso em rascunho","Crie um novo curso acima ou abra um curso publicado para começar uma revisão."))+
 sectionHead("Cursos publicados",badge("Conteúdo do GitHub"))+
 (publicCourses.length?'<div class="course-list">'+publicCourses.map(c=>
   '<article class="card course-line"><span aria-hidden="true">ψ</span><div><h3>'+e(c.title)+'</h3>'+
   '<p>'+ (modifiedIds.has(c.id)?"Você também tem uma revisão local deste curso.":"Disponível no catálogo público; pode criar uma revisão local.")+'</p></div>'+
   action(modifiedIds.has(c.id)?"Abrir revisão →":"Preparar edição →",routeManage(c.id),"small")+'</article>').join("")+'</div>':
  emptyState("Nenhum curso publicado","Novos cursos poderão ser incluídos no catálogo após exportação e commit."))+
 (technicalCourses.length?'<details class="module"><summary><span class="overline">Ferramentas internas</span><strong>Material de demonstração</strong></summary>'+
 '<div class="lesson-item">'+technicalCourses.map(c=>'<div><strong>'+e(c.title)+'</strong> · '+action("Editar demonstração →",routeManage(c.id),"small")+'</div>').join("")+'</div></details>':'')+
 (localAvailable.length?sectionHead("Disponíveis neste dispositivo",badge("Catálogo local","purple"))+
 '<div class="course-list">'+localAvailable.map(c=>
 '<article class="card course-line"><span aria-hidden="true">◈</span><div><h3>'+e(c.title)+'</h3>'+
 '<p>Este curso aparece no ambiente Aluno deste navegador. Não está publicado para outras pessoas.</p></div>'+
 action("Gerenciar curso →",routeManage(c.id),"small")+'</article>').join("")+'</div>':'')+
 (lessonDrafts.length?sectionHead("Rascunhos técnicos de aulas","")+
 '<div class="course-list">'+lessonDrafts.map(d=>'<article class="card"><div class="card-label">Rascunho local de aula</div>'+
 '<h3>'+e(d.lesson.title)+'</h3>'+action("Editar JSON →",routeEdit(d.courseId,d.lessonId),"small")+'</article>').join("")+'</div>':'')+info();
}
function courseLessonEditor(course,item,index,total){
 const mod=item.module, lesson=item.lesson, planned=item.planned;
 const courseAttr=' data-course-id="'+e(course.id)+'"',modAttr=' data-module-id="'+e(mod.id)+'"';
 const alone=(mod.lessons||[]).length<=1;
 const mods=[...course.modules].sort((a,b)=>a.position-b.position);
 const modIndex=mods.findIndex(m=>m.id===mod.id);
 const legacyGroup=(mod.lessons||[]).length>1;
 const actions='<div class="authoring-controls">'+
   (alone?'<button type="button" class="button small" data-course-op="move-module"'+courseAttr+modAttr+
     ' data-direction="-1"'+(modIndex===0?' disabled':'')+'>↑ Subir aula</button>'+
     '<button type="button" class="button small" data-course-op="move-module"'+courseAttr+modAttr+
     ' data-direction="1"'+(modIndex===mods.length-1?' disabled':'')+'>↓ Descer aula</button>':'')+
   (planned?'<button type="button" class="button small quiet" data-course-op="remove-module"'+courseAttr+modAttr+
     '>Excluir aula prevista</button>':
     '<a class="button small action" href="'+e(routeEdit(course.id,item.id))+'">Editar conteúdo da aula →</a>')+
   '</div>';
 return '<section class="card course-lesson-editor" id="course-lesson-'+e(item.id)+'" tabindex="-1">'+
    '<div class="topline"><span class="overline">Aula '+String(index+1).padStart(2,"0")+' de '+total+'</span>'+
    badge(planned?"Conteúdo por preparar":"Aula com conteúdo","purple")+'</div>'+
    (planned?
      '<form data-authoring-form="module-info"'+courseAttr+modAttr+' class="authoring-fields">'+
        '<label class="field-label" for="lesson-title-'+e(mod.id)+'">Título da aula</label>'+
        '<input class="field" id="lesson-title-'+e(mod.id)+'" name="title" maxlength="160" required value="'+e(mod.title)+'">'+
        '<label class="field-label" for="lesson-desc-'+e(mod.id)+'">Apresentação (opcional)</label>'+
        '<textarea class="field" id="lesson-desc-'+e(mod.id)+'" name="description" maxlength="1200" rows="2">'+e(mod.description||"")+'</textarea>'+
        '<div class="button-row"><button class="button small" type="submit">Salvar título</button>'+
        '<button type="button" class="button action small" data-course-op="prepare-lesson"'+courseAttr+modAttr+
        '>Preparar conteúdo da aula →</button></div></form>':
      '<h3 class="course-lesson-editor-title">'+e(item.title)+'</h3>'+
      (item.summary?'<p class="muted">'+e(item.summary)+'</p>':'')+
      (legacyGroup?'<p class="tiny">Esta aula pertence a um agrupamento antigo preservado para não alterar arquivos já salvos.</p>':''))+
    actions+'</section>';
}
async function courseStructure(cid){
 let local=null,publicCourse=null,available=null,warning="";
 try{local=await getCourseDraft(cid);}
 catch(err){warning="Armazenamento local não disponível: "+err.message;}
 // Primeiro consulta o que está neste navegador. Um curso em rascunho
 // não deve ficar bloqueado por uma busca remota no GitHub Pages.
 try{available=await getLocalAvailableCourse(cid);}
 catch(err){warning=warning||"Catálogo deste dispositivo indisponível: "+err.message;}
 // Consulte também a publicação quando existir rascunho antigo. Caso o
 // GitHub tenha aulas novas, ofereça incorporá-las SEM sobrescrever o rascunho.
 try{publicCourse=(await contentRepository.getPublishedCourse(cid)).course;}
 catch(err){
   if(!local&&!available&&err.code!=="not_found")throw err;
   if(err.code!=="not_found")console.warn("Curso GitHub temporariamente indisponível:",err);
 }
 if(!local&&!publicCourse&&!available)throw new Error(warning||"Este curso não existe neste navegador nem no catálogo público.");
 const course=local?.course||publicCourse||available.course;
 const entries=getCourseEntries(course,{includeDrafts:true});
 const localIds=new Set(course.modules.flatMap(m=>m.lessons.map(l=>l.id)));
 const newOnline=local&&publicCourse?
   publicCourse.modules.flatMap(m=>m.lessons).filter(l=>!localIds.has(l.id)):[];
 const onlineAlert=newOnline.length?
   '<div class="notice" role="status"><strong>Há '+newOnline.length+' aula(s) publicada(s) no GitHub que ainda não aparecem neste rascunho.</strong>'+
   '<p>Seu rascunho local foi preservado. Você pode incorporar essas aulas sem substituir suas alterações já salvas.</p>'+
   '<button type="button" class="button action" data-course-op="sync-online" data-course-id="'+e(course.id)+
   '">Incorporar aulas publicadas →</button></div>':"";
 const courseAttr=' data-course-id="'+e(course.id)+'"';
 const status=available?"Disponível na área do aluno deste dispositivo":local?"Rascunho salvo neste navegador":"Curso público — ainda sem revisão local";
 const form='<form data-authoring-form="course-info"'+courseAttr+' class="card authoring-fields">'+
 '<div class="card-label">Informações do curso</div>'+
 '<label class="field-label" for="authoring-course-title">Título</label>'+
 '<input class="field" id="authoring-course-title" name="title" required maxlength="160" value="'+e(course.title)+'">'+
 '<label class="field-label" for="authoring-course-icon">Símbolo do curso (opcional)</label>'+
 '<input class="field" id="authoring-course-icon" name="icon" maxlength="8" value="'+e(course.icon||"ψ")+'" placeholder="📚">'+
 '<label class="field-label" for="authoring-course-subtitle">Subtítulo</label>'+
 '<input class="field" id="authoring-course-subtitle" name="subtitle" maxlength="260" value="'+e(course.subtitle||"")+'">'+
 '<label class="field-label" for="authoring-course-description">Apresentação</label>'+
 '<textarea class="field" id="authoring-course-description" name="description" maxlength="3500" rows="4">'+e(course.description||"")+'</textarea>'+
 '<label class="field-label" for="authoring-course-objectives">Objetivos de aprendizagem (um por linha)</label>'+
 '<textarea class="field" id="authoring-course-objectives" name="objectives" rows="4">'+e((course.objectives||[]).join("\n"))+'</textarea>'+
 '<div class="button-row"><button class="button action" type="submit">Salvar alterações do curso</button></div></form>';
 const add='<form class="card authoring-fields" data-authoring-form="new-course-lesson"'+courseAttr+'>'+
 '<div class="card-label">Nova aula</div><h2 class="section-title">Adicionar uma aula ao curso</h2>'+
 '<label class="field-label" for="new-course-lesson-title">Título da nova aula</label>'+
 '<input class="field" id="new-course-lesson-title" name="title" required maxlength="160" placeholder="Ex.: Primeiras questões sobre o inconsciente">'+
 '<label class="field-label" for="new-course-lesson-template">Modelo pedagógico</label>'+
 '<select class="field" name="templateId" id="new-course-lesson-template">'+LESSON_TEMPLATES.map(t=>
 '<option value="'+e(t.id)+'">'+e(t.title)+' — '+e(t.description)+'</option>').join("")+'</select>'+
 '<div class="button-row"><button class="button action" type="submit">+ Criar aula</button></div></form>';
 return '<div class="topline"><span class="overline">Estúdio / Estrutura de curso</span>'+badge(status,"purple")+'</div>'+
 pageHead("Professor / Gestão",e(course.title),
 "O curso reúne diretamente as aulas, na ordem em que serão estudadas. Organize e prepare o conteúdo de cada aula no Estúdio Visual.")+
 (warning?'<div class="notice" role="alert">'+e(warning)+'</div>':'')+
 onlineAlert+
 '<div id="course-authoring-status" tabindex="-1" role="status" aria-live="polite" class="tiny">Nenhuma alteração desta tela foi salva automaticamente.</div>'+
 '<div class="authoring-layout"><div class="authoring-primary">'+form+
 sectionHead("Aulas do curso",badge(entries.length+" aula(s)"))+
 (entries.length?entries.map((item,i)=>courseLessonEditor(course,item,i,entries.length)).join(""):
 emptyState("Comece pela primeira aula","Crie uma aula abaixo e construa o conteúdo no Estúdio Visual."))+
 add+'</div><aside class="sidepanel authoring-side"><div class="overline">Publicação e backup</div><h3>O rascunho fica com você.</h3>'+
 '<p class="hint">Salve primeiro cada aula e as informações do curso. Depois, use “Disponibilizar” para vê-lo na área do aluno deste navegador.</p>'+
 '<div class="authoring-downloads">'+
 '<button type="button" class="button action" data-course-op="make-available"'+courseAttr+'>'+
 (available?"Atualizar curso na área do aluno":"Disponibilizar na área do aluno")+'</button>'+
 (available?'<button type="button" class="button quiet" data-course-op="make-unavailable"'+courseAttr+'>Retirar da área do aluno</button>':'')+
 (available?action("Ver como aluno →",routeCourse(cid),"small"):'')+
 '<button type="button" class="button" data-course-op="export-manifest"'+courseAttr+'>Baixar manifesto JSON</button>'+
 (!publicCourse&&local?'<button type="button" class="button" data-course-op="export-catalog"'+courseAttr+'>Baixar entrada do catálogo</button>':'')+
 '<button type="button" class="button quiet" data-course-op="discard-course"'+courseAttr+'>'+
 (publicCourse?"Descartar revisão local":"Excluir curso local")+'</button></div>'+
 '<div class="rule"></div><div class="notice">Salvar, exportar e publicar são etapas diferentes. O arquivo exportado é um rascunho: revise-o antes de publicá-lo manualmente no GitHub.</div>'+
 '<p class="hint">As aulas já preparadas mantêm seus identificadores ao mudar de posição. Somente aulas previstas e ainda vazias podem ser excluídas, para proteger os vínculos de conteúdo.</p>'+
 '<div class="rule"></div>'+action("Voltar aos meus cursos →","#/professor","small")+'</aside></div>'+
 info();
}
async function visualEditor(cid,lid){
 return '<div class="studio-shell" data-visual-studio data-course-id="'+e(cid)+'" data-lesson-id="'+e(lid)+'">'+
  '<div class="card"><h2>Preparando o Estúdio de Aula…</h2><p>Carregando rascunho local e componentes de edição.</p></div></div>';
}
async function editor(cid,lid){
 const {lesson,course}=await contentRepository.getPublishedLesson(cid,lid);
 let record=null,storageError="";
 try{record=await getDraft(cid,lid);}catch(err){storageError=e(err.message)}
 const draft=record?.lesson||{...lesson,status:"draft",revision:lesson.revision+1};
 const raw=JSON.stringify(draft,null,2);
 return pageHead("Professor / Editor técnico de JSON",e(lesson.title),
 "Modo técnico opcional: editar o JSON manualmente. Para montar blocos sem programação, utilize o Estúdio Visual.")+
 '<div class="topline">'+badge(record?"Rascunho local · "+new Date(record.savedAt).toLocaleString("pt-BR"):"Ainda não salvo neste navegador","purple")+
 action("Voltar ao Estúdio Visual →",routeEdit(cid,lid),"small")+'</div>'+
 (storageError?'<div class="notice" role="alert">'+storageError+'</div>':'')+
 '<section class="card" style="margin-top:18px"><label class="field-label" for="lesson-json">Conteúdo da aula em JSON</label>'+
 '<textarea class="field code-field" id="lesson-json" spellcheck="false" autocapitalize="off" autocomplete="off" rows="20">'+e(raw)+'</textarea>'+
 '<div class="button-row" style="margin-top:14px">'+
 '<button type="button" class="button action" data-action="save-draft" data-course="'+e(cid)+'" data-lesson="'+e(lid)+'">Salvar rascunho local</button>'+
 '<button type="button" class="button" data-action="export-json" data-course="'+e(cid)+'" data-lesson="'+e(lid)+'">Exportar JSON</button>'+
 '<button type="button" class="button" data-action="import-json">Importar arquivo JSON</button>'+
 '<button type="button" class="button quiet" data-action="delete-draft" data-course="'+e(cid)+'" data-lesson="'+e(lid)+'">Descartar rascunho</button></div>'+
 '<input id="draft-import-file" type="file" accept=".json,application/json" hidden>'+
 '<div id="draft-status" role="status" aria-live="polite" class="tiny" style="margin-top:12px">Os dados digitados não estão salvos automaticamente.</div></section>'+
 note('<strong>Importante:</strong> “Salvar” grava exclusivamente no IndexedDB deste navegador. “Exportar” baixa um arquivo JSON. Nenhuma dessas ações publica no site ou sincroniza com outro aparelho. Evite dados pessoais e casos clínicos reais.');
}
async function preview(cid,lid){
 let published=null,record=null,storageError="";
 try{published=await contentRepository.getPublishedLesson(cid,lid);}
 catch(err){if(err.code!=="not_found")throw err;}
 let lesson=published?.lesson||null,contentURL=published?.contentURL||null;
 try{record=await getDraft(cid,lid);}catch(err){storageError=e(err.message)}
 const target=record?.lesson||lesson;
 if(!target)throw Error("Nenhuma versão salva desta aula foi encontrada para a prévia.");
 return pageHead("Professor / Prévia",e(target.title),
 "A prévia usa o mesmo renderizador do aluno, mas recebe explicitamente o rascunho local, quando existe.")+
 (storageError?'<div class="notice" role="alert">'+storageError+'</div>':'')+
 (!record?'<div class="notice"><strong>Nenhum rascunho salvo.</strong> Mostrando a versão publicada. Para pré-visualizar alterações, primeiro salve o JSON no editor.</div>':'')+
 reader(target,{isPreview:true,hasDraft:!!record,sourceURL:contentURL})+
 note("<strong>Prévia privada apenas por convenção:</strong> sem login real, a plataforma não possui controle de acesso. Rascunhos estão somente neste navegador.");
}
async function admin(){
 const courses=await contentRepository.listPublishedCourses();
 return pageHead("Atelier / Administrar","Organizar para <em>crescer.</em>",
 "Esta área oferece uma visão editorial demonstrativa e acesso às especificações e componentes.")+
 metrics([[courses.length,"Cursos públicos"],["JSON","Fonte dos conteúdos"],["0","Contas reais cadastradas"]])+
 sectionHead("Ferramentas de apresentação","")+
 '<div class="grid two">'+card("Criação de cursos","Criar um novo curso","Monte cursos e aulas pela plataforma e disponibilize-os no catálogo do aluno deste dispositivo.",
 action("Criar ou organizar cursos →","#/professor","action small"))+
 card("Design System","Biblioteca visual","Conheça as peças de interface, estados e cores reutilizáveis.",
  action("Abrir biblioteca →","#/admin/identidade","small"))+
 card("Biblioteca pedagógica","Blocos reutilizáveis","Veja todos os tipos de conteúdo disponíveis para compor uma aula.",
 action("Ver os blocos →","#/admin/blocos","small"))+
 card("Verificações","Diagnóstico do JSON","Teste o carregamento do catálogo, a validação de aulas e a gravação local de um registro temporário.",
  '<a class="button small" href="./tests/smoke.html">Executar diagnóstico →</a>')+
 card("Backups","Exportar ou restaurar seus dados","Guarde uma cópia dos rascunhos de cursos, aulas e histórico local; nenhuma mídia é incluída.",
  '<div class="button-row"><button class="button small" type="button" data-backup="download-backup">Baixar backup</button>'+
  '<button class="button small" type="button" data-backup="import-backup">Restaurar backup</button>'+
  '<input type="file" hidden id="atelier-backup-import" accept=".json,application/json"></div>')+
 card("Beta com convidados","Roteiro de testes da plataforma","Conferir tarefas de aluno, professor, mobile e acessibilidade e exportar feedback sem coleta automática.",
  action("Abrir roteiro do beta →","#/admin/beta","small"))+
 card("Qualidade","Diagnóstico técnico e acessibilidade","Execução de testes do navegador e checklist de experiência móvel.",
  '<a class="button small" href="./tests/quality.html">Abrir verificação técnica →</a>')+
 card("Arquitetura","Documentos do projeto","Consulte as decisões e as etapas de desenvolvimento.",
  '<a class="button small" href="./arquitetura.html">Mapa anterior ↗</a>')+'</div>'+info();
}
async function pedagogicalBlocks(){
 const all=listRegisteredBlocks();
 const {lesson}=await contentRepository.getPublishedLesson("curso-fundamentos","aula-recalque");
 const examples=new Set(lesson.blocks.map(b=>b.type));
 return pageHead("Administrar / Biblioteca pedagógica","Blocos para <em>pensar e experimentar.</em>",
  "Uma biblioteca versionada de componentes reutilizáveis. Não precisamos programar uma nova tela toda vez que criamos uma aula.")+
  '<div class="metrics"><div class="metric"><strong>'+all.length+'</strong><span>Tipos registrados</span></div>'+
  '<div class="metric"><strong>'+examples.size+'</strong><span>Tipos demonstrados na aula</span></div>'+
  '<div class="metric"><strong>v1</strong><span>Versão de componentes</span></div></div>'+
  sectionHead("Componentes disponíveis",badge("Motor compartilhado","purple"))+
  '<div class="grid">'+all.map(x=>{
    const shown=examples.has(x.type);
    const description=shown?"Já aparece na aula sobre o recalque.":"O motor reconhece o componente; aguarda conteúdo de exemplo.";
    return card(x.label,x.type+" · v"+x.version,description,
      shown?action("Ver na aula →","#/cursos/curso-fundamentos/aulas/aula-recalque","small"):
      '<span class="tag purple" style="margin-top:17px">Aguardando exemplo</span>');
  }).join("")+'</div>'+
  note('<strong>Distinção importante:</strong> os quizzes já oferecem feedback formativo e laboratórios de escolhas já podem funcionar. Eles não substituem avaliação humana, supervisão pedagógica ou um sistema de provas certificadoras.');
}
function visualLibrary(){
 return pageHead("Atelier / Identidade","As peças do <em>Atelier.</em>",
 "Componentes visuais reutilizáveis, preparados para a experiência responsiva.")+
 '<div class="grid two">'+
 card("Botões","Hierarquia de ações","Ação primária em laranja e comandos secundários discretos.",
 demoAction("Exemplo de ação","O componente visual está funcional, mas não altera dados.","action"))+
 '<section class="card"><span class="card-label">Formulários</span><h3>Campos acessíveis</h3>'+
 '<label class="field-label" for="example-title">Título da aula</label><input class="field" id="example-title" value="O recalque em Freud">'+
 '<p style="margin-top:10px">Este campo é apenas demonstrativo.</p></section>'+
 card("Etiquetas","Estados comunicados por texto","Um estado nunca deve depender apenas da cor.",
 badge("Rascunho local","purple")+" "+badge("Publicado")+" "+badge("Concluído","green"))+
 '<section class="card"><span class="card-label">Erros e estados</span><h3>Falha recuperável</h3><p>Uma mensagem compreensível e uma saída clara.</p>'+
 action("Ir ao catálogo →","#/cursos","small")+'</section></div>'+info();
}
export async function routeView(path){
 if(path==="/"||path==="/aluno")return {title:"Início do aluno",area:"Aluno",html:await studentHome()};
 if(path==="/cursos")return {title:"Catálogo",area:"Aluno",html:await catalog()};
 if(path==="/aluno/caderno")return {title:"Meu caderno",area:"Aluno",html:await caderno()};
 if(path==="/aluno/progresso")return {title:"Meu progresso",area:"Aluno",html:await progresso()};
 if(path==="/professor")return {title:"Painel do professor",area:"Professor",html:await teacherHome()};
 if(path==="/admin")return {title:"Administração",area:"Administrador",html:await admin()};
 if(path==="/admin/identidade")return {title:"Biblioteca visual",area:"Administrador",html:visualLibrary()};
 if(path==="/admin/beta")return {title:"Beta com convidados",area:"Administrador",html:renderBeta()};
 if(path==="/admin/blocos")return {title:"Blocos pedagógicos",area:"Administrador",html:await pedagogicalBlocks()};
 let m=path.match(/^\/cursos\/([\w-]+)$/);
 if(m)return {title:"Curso",area:"Aluno",html:await coursePage(m[1])};
 m=path.match(/^\/cursos\/([\w-]+)\/aulas\/([\w-]+)$/);
 if(m)return {title:"Sala de aula",area:"Aluno",html:await lessonPage(m[1],m[2])};
 m=path.match(/^\/professor\/cursos\/([\w-]+)$/);
 if(m)return {title:"Estrutura do curso",area:"Professor",html:await courseStructure(m[1])};
 m=path.match(/^\/professor\/cursos\/([\w-]+)\/aulas\/([\w-]+)\/editar$/);
 if(m)return {title:"Estúdio Visual de Aula",area:"Professor",html:await visualEditor(m[1],m[2])};
 m=path.match(/^\/professor\/cursos\/([\w-]+)\/aulas\/([\w-]+)\/json$/);
 if(m)return {title:"Editor JSON avançado",area:"Professor",html:await editor(m[1],m[2])};
 m=path.match(/^\/professor\/cursos\/([\w-]+)\/aulas\/([\w-]+)\/previa$/);
 if(m)return {title:"Prévia",area:"Professor",html:await preview(m[1],m[2])};
 return {title:"Página não encontrada",area:"Atelier",html:notFound()};
}
