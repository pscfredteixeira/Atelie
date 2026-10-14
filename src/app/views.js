import {contentRepository} from "../repositories/content-repository.js";
import {getDraft,listDrafts} from "../repositories/draft-repository.js";
import {renderLessonBlocks,getLessonOutline,listRegisteredBlocks} from "../lesson-engine/engine.js";
import {getCourseJourney,getLessonContext,summarizeCourse} from "../features/learning/journey.js";
import {escapeHTML as e,badge,action,demoAction,note,pageHead,sectionHead,card,emptyState,notFound} from "../ui/components.js";
const routeCourse=id=>"#/cursos/"+encodeURIComponent(id);
const routeLesson=(cid,lid)=>routeCourse(cid)+"/aulas/"+encodeURIComponent(lid);
const routeManage=id=>"#/professor/cursos/"+encodeURIComponent(id);
const routeEdit=(cid,lid)=>routeManage(cid)+"/aulas/"+encodeURIComponent(lid)+"/editar";
const routePreview=(cid,lid)=>routeManage(cid)+"/aulas/"+encodeURIComponent(lid)+"/previa";
const info=()=>note("<strong>Protótipo sem banco de dados:</strong> cursos e aulas publicados vêm de arquivos JSON do GitHub. Rascunhos ficam somente neste navegador. Perfis são demonstrativos, sem login e sem controle de acesso real.");
function metrics(items){return '<div class="metrics">'+items.map(([count,title])=>'<div class="metric"><strong>'+e(count)+'</strong><span>'+e(title)+'</span></div>').join('')+'</div>';}
function courseCard(item){
  return card("Percurso disponível",item.title,
    item.summary||"Abra a apresentação, conheça os objetivos e percorra as aulas na ordem proposta.",
    action("Explorar o curso →",routeCourse(item.id),"small"));
}
function courseHeader(course){
 return pageHead("Curso / Formação",e(course.title),course.subtitle||course.description||"Percurso de estudo e pesquisa.");
}
function modules(course,teacher=false,currentLessonId=null){
 const sequence=getCourseJourney(course),order=new Map(sequence.map(x=>[x.id,x]));
 const ms=[...course.modules].sort((a,b)=>a.position-b.position);
 if(!ms.length)return emptyState("Curso em preparação","Este curso ainda não possui módulos.");
 return ms.map((m,i)=>{
  const rows=[...m.lessons].sort((a,b)=>a.position-b.position).filter(l=>l.status===undefined||l.status==="published");
  const active=!!currentLessonId&&rows.some(l=>l.id===currentLessonId);
  return '<details class="module" '+(active||i===0?'open':'')+'><summary>'+
  '<div><div class="overline">Módulo '+String(i+1).padStart(2,"0")+' · '+rows.length+' aula(s)</div>'+
  '<h3>'+e(m.title)+'</h3>'+(m.description?'<p class="module-description">'+e(m.description)+'</p>':'')+
  '</div><span class="chevron" aria-hidden="true">+</span></summary>'+
  (rows.length?rows.map(l=>{
     const indexed=order.get(l.id),isCurrent=currentLessonId===l.id;
     const title=indexed?.title||l.title||l.id,minutes=indexed?.estimatedMinutes;
     return '<div class="lesson-item journey-row'+(isCurrent?' current':'')+'"><div class="journey-entry">'+
      '<span class="journey-number" aria-hidden="true">'+String(indexed?.number||1).padStart(2,"0")+'</span>'+
      '<div><strong>'+e(title)+'</strong>'+
      (l.summary?'<p>'+e(l.summary)+'</p>':'')+
      '<span class="journey-meta">'+(minutes!==null&&minutes!==undefined?e(minutes)+' min · ':'')+
      (isCurrent?'Aula atual':'Leitura disponível')+'</span></div></div>'+
      action(teacher?"Editar →":isCurrent?"Retomar leitura →":"Abrir aula →",
       teacher?routeEdit(course.id,l.id):routeLesson(course.id,l.id),"small")+'</div>';
   }).join(''):'<div class="lesson-item">Nenhuma aula disponível neste módulo.</div>')+'</details>';
 }).join("");
}
async function studentHome(){
 const list=await contentRepository.listPublishedCourses();
 return pageHead("Atelier · Aprender","Um laboratório de <em>ideias.</em>",
 "Cada percurso une leitura, investigação e reflexão. Estamos construindo uma plataforma para aprender psicanálise com profundidade.")+
 (list.length?'<section class="illustrated"><div><div class="overline">Comece pelo primeiro curso</div><h2>'+e(list[0].title)+'</h2>'+
   '<p>Conheça o percurso inicial, com conteúdo publicado em JSON independente da interface.</p>'+
   action("Conhecer o curso →",routeCourse(list[0].id),"action")+
   '</div><div class="illustrated-symbol" aria-hidden="true">ψ</div></section>':
   emptyState("Ainda não há cursos publicados","O catálogo receberá cursos conforme forem revisados e publicados."))+
 sectionHead("Biblioteca de cursos",badge(list.length+" publicado(s)","purple"))+
 (list.length?'<div class="grid">'+list.map(courseCard).join('')+'</div>':'')+info();
}
async function catalog(){
 const list=await contentRepository.listPublishedCourses();
 return pageHead("Aprender / Cursos","O que você deseja <em>investigar?</em>",
 "Os cursos desta biblioteca são carregados diretamente dos arquivos JSON publicados.")+
 (list.length?'<div class="grid">'+list.map(courseCard).join('')+'</div>':
 emptyState("Nenhum curso disponível","A biblioteca ainda está sendo preparada.",
 action("Voltar ao início →","#/aluno","action")))+info();
}
async function coursePage(id){
 const {course}=await contentRepository.getPublishedCourse(id);
 const sequence=getCourseJourney(course),stats=summarizeCourse(course);
 return courseHeader(course)+
 '<div class="course-eyebrow">Um percurso de aprendizagem · do primeiro conceito ao último</div>'+
 metrics([[stats.moduleCount,stats.moduleCount===1?"Módulo":"Módulos"],
   [stats.lessonCount,stats.lessonCount===1?"Aula":"Aulas"],
   [stats.durationMinutes===null?"—":stats.durationMinutes+" min","Tempo estimado"]])+
 (sequence.length?'<section class="course-start"><div><span class="overline">Seu ponto de partida</span>'+
 '<h2>Comece pela primeira aula</h2><p>'+e(sequence[0].title)+'</p></div>'+
 action("Começar a estudar →",routeLesson(course.id,sequence[0].id),"action")+'</section>':'')+
 (course.objectives?.length?'<section class="card course-goals"><div class="card-label">O que você poderá compreender</div><ul>'+
 course.objectives.map(o=>'<li>'+e(o)+'</li>').join('')+'</ul></section>':'')+
 sectionHead("Programa de estudos",badge("Sequência sugerida","purple"))+
 (sequence.length?modules(course):emptyState("Nenhuma aula publicada","Os módulos deste curso ainda estão sendo preparados."))+
 note("<strong>Sobre este percurso:</strong> as aulas seguem uma ordem didática, mas você pode revisitá-las livremente. O sistema ainda não registra aulas concluídas; acompanhamento individual virá no Sprint 10.")+info();
}
function reader(lesson,{isPreview=false,hasDraft=false,sourceURL}={}){
 const html=renderLessonBlocks(lesson,{sourceURL});
 const outline=getLessonOutline(lesson);
 const description=lesson.summary||"Uma aula com textos e experiências pedagógicas estruturadas em JSON.";
 const inner='<article class="reader"><div class="reader-inner"><span class="overline">Aula · '+(isPreview?'Prévia do professor':'Conteúdo publicado')+'</span>'+
  '<h2>'+e(lesson.title)+'</h2><p>'+e(description)+'</p>'+
  (lesson.objectives?.length?'<div class="reader-objectives"><strong>Ao final desta aula</strong><ul>'+
   lesson.objectives.map(o=>'<li>'+e(o)+'</li>').join('')+'</ul></div>':'')+
  (html||'<p>Esta aula ainda não possui blocos.</p>')+'</div></article>';
 const links=outline.map((x,i)=>'<li><button type="button" class="lesson-jump" data-scroll-block="'+e(x.id)+'">'+
   '<span class="lesson-jump-no">'+String(i+1).padStart(2,"0")+'</span><span>'+e(x.label)+'</span></button></li>').join("");
 const sidebar='<aside class="sidepanel lesson-sidebar"><span class="overline">Índice da aula</span><h3>'+e(lesson.blocks.length)+' momentos de estudo</h3>'+
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
 const {course,lesson,contentURL}=await contentRepository.getPublishedLesson(cid,lid);
 const context=getLessonContext(course,lid);
 const breadcrumb='<nav class="journey-breadcrumb" aria-label="Localização no curso">'+
 action("Todos os cursos","#/cursos","quiet small")+'<span aria-hidden="true">/</span>'+
 action(e(course.title),routeCourse(cid),"quiet small")+
 '<span aria-hidden="true">/</span><span aria-current="page">Aula '+(context.index+1)+'</span></nav>';
 return breadcrumb+
 '<div class="lesson-header-info"><div><span class="overline">'+e(context.current?.moduleTitle||"Módulo")+
 ' · Aula '+(context.index+1)+' de '+context.sequence.length+'</span>'+
 pageHead("Jornada do aluno",e(lesson.title),lesson.summary)+'</div>'+
 (lesson.estimatedMinutes?badge(lesson.estimatedMinutes+" minutos · estimativa","purple"):'')+'</div>'+
 reader(lesson,{sourceURL:contentURL})+
 lessonPager(course,context)+
 '<details class="journey-course-drawer"><summary>Consultar programa do curso</summary>'+modules(course,false,lid)+'</details>'+
 note("<strong>Navegação, não avaliação:</strong> anterior e próxima permitem percorrer as aulas, mas não registram presença, conclusão ou progresso. Os exercícios avaliativos completos entram no Sprint 9.");
}
function caderno(){
 return pageHead("Aprender / Meu caderno","Seu espaço de <em>anotações.</em>",
 "O caderno pessoal e o acompanhamento de estudos serão implementados no Sprint 10.")+
 emptyState("Ainda não há anotações","As futuras anotações ficarão neste navegador e poderão ser exportadas. Não insira dados clínicos ou pessoais reais aqui.",
 action("Explorar cursos →","#/cursos","action"))+info();
}
function progresso(){
 return pageHead("Aprender / Meu progresso","Aprender exige <em>tempo.</em>",
 "O progresso individual ainda não está ativo. Esta tela deixará de ser um modelo quando adicionarmos acompanhamento local no Sprint 10.")+
 emptyState("Nenhuma atividade registrada","Nesta etapa não registramos a conclusão de aulas nem notas.",
 action("Conhecer os cursos →","#/cursos","action"))+info();
}
async function teacherHome(){
 const list=await contentRepository.listPublishedCourses();
 let drafts=[],storageWarning="";
 try{drafts=await listDrafts();}
 catch(err){storageWarning='<div class="notice" role="alert">'+e(err.message)+'</div>';}
 return pageHead("Atelier · Criar","Uma aula começa com <em>uma pergunta.</em>",
 "Esta área permite examinar os cursos publicados e preparar rascunhos locais em JSON. O editor visual chegará no Sprint 6.")+
 (storageWarning||"")+metrics([[list.length,"Cursos no catálogo"],[drafts.length,"Rascunhos locais"],["0","Usuários reais"]])+
 sectionHead("Cursos para organizar",badge("Demonstração","purple"))+
 (list.length?'<div class="course-list">'+list.map(c=>'<section class="card course-line"><span aria-hidden="true">ψ</span><div><h3>'+e(c.title)+'</h3>'+
 '<p>Conteúdo-base publicado no catálogo do GitHub.</p></div>'+action("Organizar →",routeManage(c.id),"small")+'</section>').join('')+'</div>':
 emptyState("Nenhum curso publicado","Adicione um pacote JSON válido ao catálogo para começar."))+
 (drafts.length?sectionHead("Rascunhos neste navegador","")+
 '<div class="course-list">'+drafts.map(d=>'<section class="card"><div class="card-label">Salvo localmente '+e(new Date(d.savedAt).toLocaleString("pt-BR"))+
 '</div><h3>'+e(d.lesson.title)+'</h3>'+action("Editar rascunho →",routeEdit(d.courseId,d.lessonId),"small")+'</section>').join('')+'</div>':'')+info();
}
async function courseStructure(cid){
 const {course}=await contentRepository.getPublishedCourse(cid);
 return pageHead("Professor / Estrutura do curso",e(course.title),
 "A sequência publicada vem do manifesto JSON. Para editar uma aula nesta fase, abra o editor técnico de rascunho.")+
 '<div class="editor-shell"><section>'+modules(course,true)+'</section><aside class="sidepanel">'+
 '<div class="overline">Publicação</div><h3>Conteúdo e interface separados</h3>'+
 '<p class="hint">Editar um rascunho não altera os arquivos do GitHub. Para publicar, será necessário exportar e atualizar o repositório.</p>'+
 '<div class="rule"></div><p class="hint">Adicionar cursos, módulos e aulas pelo editor visual: Sprints 5 e 6.</p></aside></div>'+info();
}
async function editor(cid,lid){
 const {lesson,course}=await contentRepository.getPublishedLesson(cid,lid);
 let record=null,storageError="";
 try{record=await getDraft(cid,lid);}catch(err){storageError=e(err.message)}
 const draft=record?.lesson||{...lesson,status:"draft",revision:lesson.revision+1};
 const raw=JSON.stringify(draft,null,2);
 return pageHead("Professor / Editor técnico de JSON",e(lesson.title),
 "Primeira etapa de autoria: editar o JSON, validar e salvar um rascunho local. O editor visual de blocos será desenvolvido no Sprint 6.")+
 '<div class="topline">'+badge(record?"Rascunho local · "+new Date(record.savedAt).toLocaleString("pt-BR"):"Ainda não salvo neste navegador","purple")+
 action("Prévia como aluno →",routePreview(cid,lid),"small")+'</div>'+
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
 const {lesson,contentURL}=await contentRepository.getPublishedLesson(cid,lid);
 let record=null,storageError="";
 try{record=await getDraft(cid,lid);}catch(err){storageError=e(err.message)}
 const target=record?.lesson||lesson;
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
 '<div class="grid two">'+card("Design System","Biblioteca visual","Conheça as peças de interface, estados e cores reutilizáveis.",
  action("Abrir biblioteca →","#/admin/identidade","small"))+
 card("Biblioteca pedagógica","Blocos reutilizáveis","Veja todos os tipos de conteúdo disponíveis para compor uma aula.",
 action("Ver os blocos →","#/admin/blocos","small"))+
 card("Verificações","Diagnóstico do JSON","Teste o carregamento do catálogo, a validação de aulas e a gravação local de um registro temporário.",
  '<a class="button small" href="./tests/smoke.html">Executar diagnóstico →</a>')+
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
  note('<strong>Distinção importante:</strong> um componente registrado não significa que todas as suas atividades estejam completas. O quiz ainda não corrige respostas e o laboratório interativo será desenvolvido no Sprint 8.');
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
 if(path==="/aluno/caderno")return {title:"Meu caderno",area:"Aluno",html:caderno()};
 if(path==="/aluno/progresso")return {title:"Meu progresso",area:"Aluno",html:progresso()};
 if(path==="/professor")return {title:"Painel do professor",area:"Professor",html:await teacherHome()};
 if(path==="/admin")return {title:"Administração",area:"Administrador",html:await admin()};
 if(path==="/admin/identidade")return {title:"Biblioteca visual",area:"Administrador",html:visualLibrary()};
 if(path==="/admin/blocos")return {title:"Blocos pedagógicos",area:"Administrador",html:await pedagogicalBlocks()};
 let m=path.match(/^\/cursos\/([\w-]+)$/);
 if(m)return {title:"Curso",area:"Aluno",html:await coursePage(m[1])};
 m=path.match(/^\/cursos\/([\w-]+)\/aulas\/([\w-]+)$/);
 if(m)return {title:"Sala de aula",area:"Aluno",html:await lessonPage(m[1],m[2])};
 m=path.match(/^\/professor\/cursos\/([\w-]+)$/);
 if(m)return {title:"Estrutura do curso",area:"Professor",html:await courseStructure(m[1])};
 m=path.match(/^\/professor\/cursos\/([\w-]+)\/aulas\/([\w-]+)\/editar$/);
 if(m)return {title:"Estúdio de JSON",area:"Professor",html:await editor(m[1],m[2])};
 m=path.match(/^\/professor\/cursos\/([\w-]+)\/aulas\/([\w-]+)\/previa$/);
 if(m)return {title:"Prévia",area:"Professor",html:await preview(m[1],m[2])};
 return {title:"Página não encontrada",area:"Atelier",html:notFound()};
}
