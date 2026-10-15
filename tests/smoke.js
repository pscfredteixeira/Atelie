import {contentRepository} from "../src/repositories/content-repository.js";
import {validateLesson,validateLessonLink} from "../src/repositories/validators.js";
import {getDraft,saveDraft,deleteDraft} from "../src/repositories/draft-repository.js";
import {renderLessonBlocks,getLessonOutline,listRegisteredBlocks} from "../src/lesson-engine/engine.js?build=quiz-integrado-20261015-v1";
import {getCourseJourney,getLessonContext,summarizeCourse} from "../src/features/learning/journey.js";
import {getCourseEntries} from "../src/features/learning/course-entries.js";
import {createCourse,startCourseDraft,applyCourseChange,createCatalogEntry,mergePublishedLessons} from "../src/features/authoring/course-editor.js?build=fix-importacao-20261015-v3";
import {getCourseDraft,saveCourseDraft,deleteCourseDraft} from "../src/repositories/course-draft-repository.js";
import {makeCourseAvailableOnDevice} from "../src/features/authoring/local-publication.js";
import {getLocalAvailableCourse,removeLocalAvailableCourse,validateLocalSnapshot} from "../src/repositories/local-catalog-repository.js";
import {learnerContentRepository,preferOnlineUpdate} from "../src/repositories/learner-content-repository.js";
import {loadCourseMenu,currentCourseChoice,coursePicker,courseOutline,loadCourseOutline,selectedModuleId,selectedCourseId} from "../src/features/navigation/course-menu.js";
import {createLesson,blockTemplate,updateLesson,syncLessonManifest,BLOCK_TYPES} from "../src/features/authoring/lesson-editor.js";
import {renderBlockFields,readBlockFields} from "../src/features/authoring/block-fields.js";
import {LESSON_TEMPLATES,useLessonTemplate} from "../src/features/authoring/lesson-templates.js";
import {checkQuiz,exploreLab} from "../src/features/learning/activities.js";
import {confirmQuizStep,advanceQuiz,retryQuizStep,restartQuiz,restoreQuizAnswers} from "../src/features/learning/quiz-flow.js";
import {getLearningState,updateLearningState,deleteLearningState,DEMO_PROFILES} from "../src/repositories/learning-repository.js";
import {buildLocalBackup,validateLocalBackup} from "../src/features/administration/backup.js";
import {BETA_TASKS,betaReport} from "../src/features/administration/beta.js";
import {loadDemoProfiles,getDemoRole,canVisit,homeForRole,roleForPath,renderAccessScreen} from "../src/features/access/demo-access.js";
import {applyTheme,getTheme,themeToggleHTML} from "../src/features/theme/theme.js";
const summary=document.getElementById("summary"),list=document.getElementById("results"),again=document.getElementById("again");
let running=false;
async function run(){
 if(running)return;
 running=true;again.disabled=true;list.replaceChildren();summary.textContent="Verificando…";
 const result=[];
 async function check(label,fn){
   try{await fn();result.push({label,ok:true})}
   catch(err){result.push({label,ok:false,message:err?.message||String(err)})}
 }
 let manifest,lesson,module;
 await check("Catálogo publicado por arquivo JSON",async()=>{
   const items=await contentRepository.listPublishedCourses();
   if(!items.some(x=>x.id==="curso-fundamentos"))throw new Error("Curso de exemplo ausente.");
 });
 await check("Seletor do menu oferece os dois cursos e acompanha a rota",async()=>{
   const menu=await loadCourseMenu();
   for(const id of ["curso-introducao-psicanalise","curso-formacao-freudiana"]){
     if(!menu.student.some(c=>c.id===id)||!menu.teacher.some(c=>c.id===id))
       throw new Error("Curso indisponível no seletor: "+id);
   }
   if(menu.student.some(c=>c.id==="curso-fundamentos"))throw new Error("Demonstração técnica apareceu no menu.");
   const html=coursePicker("student","/cursos/curso-formacao-freudiana",menu.student,"sidebar");
   if(!html.includes('value="#/cursos/curso-formacao-freudiana" selected')||
     currentCourseChoice("/professor/cursos/curso-introducao-psicanalise","teacher")!=="curso-introducao-psicanalise")
     throw new Error("A seleção não acompanha a navegação.");
 });
 await check("Curso apresenta aulas diretamente no menu lateral",async()=>{
   const introId="curso-introducao-psicanalise",freudId="curso-formacao-freudiana";
   const intro=await loadCourseOutline("student",introId);
   const freud=await loadCourseOutline("teacher",freudId);
   if(getCourseEntries(intro).length!==8||getCourseEntries(freud).length!==10)
     throw new Error("As aulas previstas não correspondem aos cursos.");
   if(!getCourseEntries(intro).every(item=>item.planned))
     throw new Error("Uma aula em preparação foi identificada como publicada.");
   const current=intro.modules[1].id;
   const introHtml=courseOutline("student",intro,"#/cursos/"+introId+"/aulas/"+current);
   const freudHtml=courseOutline("teacher",freud,"#/professor/cursos/"+freudId);
   if((introHtml.match(/class="course-tree-module"/g)||[]).length!==8||
      (freudHtml.match(/class="course-tree-module"/g)||[]).length!==10)
     throw new Error("Nem todas as aulas aparecem no menu.");
   if(!introHtml.includes('href="#/cursos/'+introId+'/aulas/'+current+'" aria-current="page"'))
     throw new Error("A aula escolhida não abre diretamente sua própria página.");
   if(!freudHtml.includes('href="#/professor/cursos/'+freudId+'?aula='+freud.modules[0].id+'"'))
     throw new Error("A aula prevista não aponta para o painel do professor.");
   if(introHtml.includes("<details")||freudHtml.includes("<details"))
     throw new Error("O menu ainda está separando aulas em agrupamentos.");
   const available=await loadCourseMenu();
   if(selectedCourseId("student","/cursos/"+introId,available.student)!==introId)
     throw new Error("A seleção do curso não foi preservada.");
 });
 await check("Aulas existentes continuam acessíveis sem agrupamentos visuais",async()=>{
   const {course}=await contentRepository.getPublishedCourse("curso-fundamentos");
   const rows=getCourseEntries(course);
   if(rows.length!==3||rows.some(item=>item.planned))throw new Error("As três aulas reais não foram preservadas.");
   const html=courseOutline("student",course,"#/cursos/curso-fundamentos/aulas/"+rows[1].id);
   if(!html.includes('href="#/cursos/curso-fundamentos/aulas/'+rows[1].id+'" aria-current="page"'))
     throw new Error("A navegação direta para aula existente falhou.");
 });
 await check("Quiz de uma aula reúne perguntas em um único carrossel",async()=>{
   const {lesson}=await contentRepository.getPublishedLesson("curso-introducao-psicanalise","aula-o-que-e-psicanalise");
   const markup=renderLessonBlocks(lesson);
   const root=document.createElement("div");root.innerHTML=markup;
   const carousel=root.querySelector("[data-quiz-carousel]");
   const slides=root.querySelectorAll(".quiz-carousel-slide[data-block-id]");
   if(!carousel||slides.length!==2)throw new Error("As questões não foram agrupadas.");
   if(root.querySelectorAll(".lesson-quiz-composite").length!==1)
     throw new Error("Há mais de um bloco de quiz.");
   if(root.querySelectorAll('.lesson-block[data-block-type="multiple_choice"]').length)
     throw new Error("Questões ficaram separadas no conteúdo.");
   const outline=getLessonOutline(lesson);
   if(outline.filter(x=>x.type==="quiz_group").length!==1||
      !markup.includes('id="bloco-quiz-integrado"')||
      outline.length!==lesson.blocks.length-1)
     throw new Error("O índice não acompanha o quiz unificado.");
   if(!slides[1].inert||slides[0].inert)throw new Error("Questões ocultas não estão inacessíveis ao teclado.");
 });
 await check("Quiz desliza ao confirmar e mostra o resultado sem mudar de página",async()=>{
   const {lesson}=await contentRepository.getPublishedLesson("curso-introducao-psicanalise","aula-o-que-e-psicanalise");
   const root=document.createElement("div");root.innerHTML=renderLessonBlocks(lesson);
   const carousel=root.querySelector("[data-quiz-carousel]");
   const slides=[...carousel.querySelectorAll(".quiz-carousel-slide[data-block-id]")];
   for(const slide of slides){
      const form=slide.querySelector('form[data-activity="quiz"]');
      form.querySelector('input[value="'+form.dataset.correct+'"]').checked=true;
      const result=checkQuiz(form);
      if(!confirmQuizStep(form,result)||!result.correct)
       throw new Error("A resposta não foi confirmada.");
      if(!slide.querySelector("[data-quiz-next]")||
         slide.querySelector("[data-quiz-next]").hidden||
         !form.querySelector('button[type="submit"]').hidden)
       throw new Error("O botão Continuar não surgiu.");
      if(!advanceQuiz(slide.querySelector("[data-quiz-next]")))
       throw new Error("A passagem de tela interna falhou.");
   }
   if(carousel.dataset.current!=="2"||
     carousel.querySelector("[data-quiz-summary]").textContent!=="Você acertou 2 de 2 questões."||
     carousel.querySelector(".quiz-carousel-progress").getAttribute("aria-valuenow")!=="2")
     throw new Error("O resumo do quiz não apresentou as duas respostas.");
   const ids=restartQuiz(carousel.querySelector("[data-quiz-restart]"));
   if(ids.length!==2||carousel.dataset.current!=="0"||
     carousel.querySelector('input:checked')||
     carousel.querySelector("[data-quiz-next]").hidden===false)
     throw new Error("O botão Refazer não reiniciou o quiz.");
 });
 await check("Quiz permite nova tentativa depois de resposta incorreta",async()=>{
   const {lesson}=await contentRepository.getPublishedLesson("curso-introducao-psicanalise","aula-o-que-e-psicanalise");
   const root=document.createElement("div");root.innerHTML=renderLessonBlocks(lesson);
   const slide=root.querySelector(".quiz-carousel-slide[data-block-id]");
   const form=slide.querySelector('form[data-activity="quiz"]');
   const wrong=[...form.querySelectorAll('input[type="radio"]')].find(input=>input.value!==form.dataset.correct);
   if(!wrong)throw new Error("Questão sem alternativa incorreta.");
   wrong.checked=true;
   const result=checkQuiz(form);
   if(result.correct||!confirmQuizStep(form,result)||slide.querySelector("[data-quiz-retry]").hidden)
     throw new Error("Feedback incorreto não liberou nova tentativa.");
   const id=retryQuizStep(slide.querySelector("[data-quiz-retry]"));
   if(id!==slide.dataset.blockId||slide.dataset.answered||
      form.querySelector('input[type="radio"]:checked')||
      form.querySelector('button[type="submit"]').hidden)
     throw new Error("Nova tentativa não liberou a questão.");
 });
 await check("Respostas anteriores podem ser retomadas no quiz unificado",async()=>{
   const {lesson}=await contentRepository.getPublishedLesson("curso-introducao-psicanalise","aula-o-que-e-psicanalise");
   const div=document.createElement("div");div.innerHTML=renderLessonBlocks(lesson);
   const carousel=div.querySelector("[data-quiz-carousel]");
   const slide=carousel.querySelector('.quiz-carousel-slide[data-block-id]');
   const form=slide.querySelector('form[data-activity="quiz"]');
   restoreQuizAnswers(carousel,{[slide.dataset.blockId]:{selection:form.dataset.correct,correct:true}});
   if(carousel.dataset.current!=="1"||slide.dataset.answered!=="true")
     throw new Error("O quiz não retomou da primeira questão pendente.");
 });
 await check("Aula O que é psicanálise: conteúdo publicado e atividades",async()=>{
   const id="curso-introducao-psicanalise";
   const info=await contentRepository.getPublishedLesson(id,"aula-o-que-e-psicanalise");
   const {course,lesson,module}=info;
   validateLessonLink(lesson,course,module.id);
   if(lesson.title!=="O que é psicanálise?"||lesson.blocks.length<20)
     throw new Error("Aula introdutória está incompleta.");
   if(getCourseEntries(course).length!==8||getCourseJourney(course).length!==1)
     throw new Error("O curso não apresenta a aula e suas sete aulas previstas.");
   const html=renderLessonBlocks(lesson,{sourceURL:info.contentURL});
   if((html.match(/data-activity="quiz"/g)||[]).length!==2||
     (html.match(/data-activity="lab"/g)||[]).length!==1)
     throw new Error("As atividades da primeira aula não apareceram.");
   if((html.match(/Consultar fonte ↗/g)||[]).length!==8)
     throw new Error("Os links bibliográficos da aula estão indisponíveis.");
   if(lesson.blocks.some(b=>b.type==="multiple_choice"&&!b.data.options.some(o=>o.id===b.data.correctOptionId)))
     throw new Error("Existe questão sem resposta correta.");
 });
 await check("Nova versão pública não fica escondida por cópia antiga",async()=>{
   const {course}=await contentRepository.getPublishedCourse("curso-introducao-psicanalise");
   const old=structuredClone(course);
   old.revision=1;old.modules[0].lessons=[];
   if(!preferOnlineUpdate(old,course))throw Error("Nova aula publicada não foi detectada.");
   if(preferOnlineUpdate(course,old))throw Error("A publicação antiga deveria ser ignorada.");
 });
 await check("Professor incorpora aula publicada sem perder o rascunho",async()=>{
   const {course}=await contentRepository.getPublishedCourse("curso-introducao-psicanalise");
   const old=structuredClone(course);
   old.status="draft";
   old.modules[0].lessons=[];
   old.modules[1].title="Título pessoal preservado";
   const original=JSON.stringify(old);
   const updated=mergePublishedLessons(old,course);
   if(updated.added!==1||updated.course.modules[0].lessons[0].id!=="aula-o-que-e-psicanalise"||
     updated.course.modules[1].title!=="Título pessoal preservado"||
     JSON.stringify(old)!==original)throw Error("Sincronização alterou o rascunho ou perdeu a aula.");
   if(mergePublishedLessons(updated.course,course).added!==0)
     throw Error("A sincronização repetida criou cópias duplicadas.");
 });
 await check("Dois cursos iniciais visíveis no catálogo do aluno",async()=>{
   const list=await learnerContentRepository.listPublishedCourses();
   const ids=["curso-introducao-psicanalise","curso-formacao-freudiana"];
   if(!ids.every(id=>list.some(c=>c.id===id)))
     throw new Error("Os dois cursos iniciais não aparecem na biblioteca.");
   const manifests=await Promise.all(ids.map(id=>learnerContentRepository.getPublishedCourse(id)));
   if(manifests[0].course.modules.length!==8||manifests[1].course.modules.length!==10)
     throw new Error("Módulos dos cursos iniciais não correspondem ao esperado.");
   const first=manifests[0].course.modules.flatMap(m=>m.lessons);
   const second=manifests[1].course.modules.flatMap(m=>m.lessons);
   if(first.length!==1||first[0].id!=="aula-o-que-e-psicanalise"||second.length!==0)
     throw new Error("A primeira aula deve estar publicada, e as dez aulas freudianas previstas.");
   if(list.some(c=>c.id==="curso-fundamentos"&&!c.local))
     throw new Error("O curso técnico aparece indevidamente no catálogo principal.");
 });
 await check("Manifesto de curso e módulos",async()=>{
   const r=await contentRepository.getPublishedCourse("curso-fundamentos");manifest=r.course;
   if(!manifest.modules?.length)throw new Error("Curso sem módulos.");
 });
 await check("Leitura de aula e relação com o curso",async()=>{
   const r=await contentRepository.getPublishedLesson("curso-fundamentos","aula-recalque");
   lesson=r.lesson;module=r.module;validateLessonLink(lesson,manifest,module.id);
 });
 await check("Montagem da aula a partir dos blocos",async()=>{
   if(!lesson)throw new Error("Aula não foi carregada.");
   const text=renderLessonBlocks(lesson);
   if(!text.includes("lesson-block")||text.includes("undefined"))throw new Error("Blocos não renderizaram corretamente.");
 });
 await check("Rejeição de IDs duplicados",async()=>{
   if(!lesson)throw new Error("Aula não foi carregada.");
   const invalid=structuredClone(lesson);
   invalid.blocks.push({...invalid.blocks[0]});
   try{validateLesson(invalid);}
   catch{return;}
   throw new Error("O validador aceitou IDs duplicados.");
 });
 await check("Rejeição de quiz com alternativa inválida",async()=>{
   if(!lesson)throw new Error("Aula não foi carregada.");
   const invalid=structuredClone(lesson);
   const quiz=invalid.blocks.find(b=>b.type==="multiple_choice");
   if(!quiz)throw new Error("Aula sem quiz de exemplo.");
   quiz.data.correctOptionId="inexistente";
   try{validateLesson(invalid);}
   catch{return;}
   throw new Error("O validador aceitou gabarito inexistente.");
 });
 await check("Biblioteca de componentes pedagógicos v1",async()=>{
   const types=listRegisteredBlocks();
   if(types.length<14)throw new Error("Biblioteca incompleta: "+types.length+" tipos.");
   for(const required of ["question","rich_text","concept","comparison","timeline","multiple_choice","interactive_lab"]){
     if(!types.some(x=>x.type===required&&x.version===1))throw new Error("Tipo indisponível: "+required);
   }
 });
 await check("Índice de blocos com destinos acessíveis",async()=>{
   if(!lesson)throw new Error("Aula não foi carregada.");
   const outline=getLessonOutline(lesson);
   const html=renderLessonBlocks(lesson);
   if(outline.length!==lesson.blocks.length)throw new Error("O índice não corresponde à ordem de blocos.");
   if(!outline.every(x=>html.includes('id="'+x.id+'"')))throw new Error("Um destino do índice não existe na aula.");
   if(!html.includes('tabindex="-1"'))throw new Error("As seções não recebem foco pelo teclado.");
 });
 await check("Erro em um bloco não interrompe os demais",async()=>{
   if(!lesson)throw new Error("Aula não foi carregada.");
   const broken=structuredClone(lesson);
   broken.blocks.splice(1,0,{id:"falha-smoke",type:"rich_text",version:1,data:null,settings:{}});
   const html=renderLessonBlocks(broken);
   if(!html.includes("Componente indisponível")||!html.includes('id="bloco-referencias-001"'))
     throw new Error("Falha na renderização isolada.");
 });
 await check("Texto HTML externo não é interpretado como conteúdo executável",async()=>{
   if(!lesson)throw new Error("Aula não foi carregada.");
   const malicious=structuredClone(lesson);
   malicious.blocks=[{id:"texto-teste",type:"rich_text",version:1,
      data:{title:"<script>alert(1)</script>",paragraphs:["<img src=x onerror=alert(1)>"]},
      settings:{}}];
   const html=renderLessonBlocks(malicious);
   if(html.includes("<script>")||html.includes("<img src=x")||!html.includes("&lt;script&gt;"))
      throw new Error("O conteúdo não foi codificado como texto seguro.");
 });
 await check("Sequência de aulas por posição e identificação estável",async()=>{
   if(!manifest)throw new Error("Manifesto não carregado.");
   const items=getCourseJourney(manifest);
   if(items.length!==3||items.map(x=>x.id).join(",")!=="aula-conflito,aula-recalque,aula-retorno")
     throw new Error("O percurso JSON não está na sequência prevista.");
   const totals=summarizeCourse(manifest);
   if(totals.durationMinutes!==52)throw new Error("Soma de durações divergente.");
 });
 await check("Aula anterior, próxima e limites do percurso",async()=>{
   if(!manifest)throw new Error("Manifesto não carregado.");
   const first=getLessonContext(manifest,"aula-conflito");
   const middle=getLessonContext(manifest,"aula-recalque");
   const last=getLessonContext(manifest,"aula-retorno");
   if(first.previous||first.next?.id!=="aula-recalque"||
      middle.previous?.id!=="aula-conflito"||middle.next?.id!=="aula-retorno"||
      last.next||last.previous?.id!=="aula-recalque")
     throw new Error("Os controles de anterior/próxima estão inconsistentes.");
 });
 await check("Leitura das três aulas publicadas por JSON",async()=>{
   for(const id of ["aula-conflito","aula-recalque","aula-retorno"]){
     const r=await contentRepository.getPublishedLesson("curso-fundamentos",id);
     if(!r.lesson?.blocks?.length||r.lesson.id!==id)throw new Error("Aula não carregada: "+id);
     const html=renderLessonBlocks(r.lesson,{sourceURL:r.contentURL});
     if(!html.includes("lesson-block"))throw new Error("Motor indisponível na aula "+id);
   }
 });
 await check("Criação de curso e validação de módulos por formulário",async()=>{
   const initial=createCourse("Curso de teste local");
   const one=applyCourseChange(initial,"add-module",{title:"Primeiro módulo",description:"Pergunta inicial"});
   const two=applyCourseChange(one,"add-module",{title:"Segundo módulo",description:"Outra etapa"});
   const moved=applyCourseChange(two,"move-module",{moduleId:two.modules[1].id,direction:-1});
   if(initial.modules.length||two.modules.length!==2||moved.modules[0].id!==two.modules[1].id)
     throw new Error("A organização não respeitou a sequência.");
   const changed=applyCourseChange(moved,"edit-module",{moduleId:moved.modules[0].id,title:"Revisado"});
   if(changed.modules[0].title!=="Revisado")throw new Error("O título editado não foi aplicado.");
 });
 await check("Revisão local não modifica curso publicado",async()=>{
   if(!manifest)throw new Error("Manifesto não carregado.");
   const base=JSON.stringify(manifest);
   const draft=startCourseDraft(manifest);
   const moved=applyCourseChange(draft,"move-lesson",{
     moduleId:draft.modules[0].id,lessonId:"aula-conflito",direction:1
   });
   if(manifest.status!=="published"||draft.status!=="draft"||
      JSON.stringify(manifest)!==base||moved.modules[0].lessons[1].id!=="aula-conflito")
     throw new Error("A versão publicada ou os IDs foram alterados incorretamente.");
   try{applyCourseChange(draft,"remove-module",{moduleId:draft.modules[0].id});}
   catch{return;}
   throw new Error("O aplicativo deixou excluir um módulo que contém aulas.");
 });
 await check("Entrada de catálogo exportável de um curso novo",async()=>{
   const draft=createCourse("Percurso local fictício");
   const entry=createCatalogEntry(draft);
   if(entry.status!=="draft"||entry.id!==draft.id||
      entry.manifest!=="./courses/"+draft.slug+"/curso.json")
     throw new Error("A entrada não corresponde ao manifesto.");
 });
 await check("Criação de aula visual vinculada ao módulo correto",async()=>{
   const draft=createCourse("Curso do editor visual");
   const mod=applyCourseChange(draft,"add-module",{title:"Primeiro módulo"});
   const created=createLesson(mod,mod.modules[0].id,"Introdução ao conceito");
   if(created.course.modules[0].lessons.length!==1||created.lesson.courseId!==mod.id||
      created.lesson.moduleId!==mod.modules[0].id||created.lesson.status!=="draft")
      throw new Error("A aula não foi vinculada ao módulo.");
   validateLessonLink(created.lesson,created.course,created.lesson.moduleId);
 });
 await check("Biblioteca de quatorze modelos válidos de blocos",async()=>{
   const draft=createCourse("Biblioteca fictícia");
   const mod=applyCourseChange(draft,"add-module",{title:"Modelos"});
   let created=createLesson(mod,mod.modules[0].id,"Aula de componentes");
   for(const [type] of BLOCK_TYPES){
     const block=blockTemplate(type);
     if(block.type!==type||block.version!==1)throw new Error("Modelo incorreto: "+type);
     created.lesson=updateLesson(created.lesson,"add-block",{type});
   }
   validateLesson(created.lesson);
   if(created.lesson.blocks.length!==BLOCK_TYPES.length+1)
     throw new Error("Nem todos os tipos foram adicionados.");
 });
 await check("Mover, duplicar, editar e remover preserva IDs",async()=>{
   const base=createCourse("Curso");
   const mod=applyCourseChange(base,"add-module",{title:"Módulo"});
   const {lesson}=createLesson(mod,mod.modules[0].id,"Aula");
   const plus=updateLesson(lesson,"add-block",{type:"question"});
   const kept=plus.blocks.map(b=>b.id);
   const moved=updateLesson(plus,"move-block",{blockId:kept[1],direction:-1});
   if(moved.blocks[0].id!==kept[1])throw new Error("A ordem não foi alterada.");
   const copied=updateLesson(moved,"duplicate-block",{blockId:kept[1]});
   if(new Set(copied.blocks.map(b=>b.id)).size!==copied.blocks.length)
     throw new Error("A duplicação reutilizou ID.");
   const edited=updateLesson(copied,"edit-block",{blockId:kept[1],data:{prompt:"Pergunta alterada?"}});
   if(edited.blocks[0].data.prompt!=="Pergunta alterada?")throw new Error("Edição de bloco falhou.");
   const removed=updateLesson(edited,"remove-block",{blockId:kept[1]});
   if(removed.blocks.length!==2)throw new Error("Remoção de bloco falhou.");
 });
 await check("Formulário visual converte alternativas sem perder o gabarito",async()=>{
   const quiz=blockTemplate("multiple_choice");
   const form=document.createElement("form");
   form.innerHTML=renderBlockFields(quiz,{references:[]});
   form.querySelector('[name="options"]').value="Primeira alternativa\nSegunda alternativa\nTerceira alternativa";
   form.querySelector('[name="correctIndex"]').value="3";
   const result=readBlockFields(quiz,form);
   if(result.options.length!==3||result.correctOptionId!==result.options[2].id)
     throw new Error("Formulário de quiz não converteu as respostas.");
 });
 await check("IndexedDB de aula nova e curso correspondente",async()=>{
   const base=createCourse("Teste local do Estúdio");
   const mod=applyCourseChange(base,"add-module",{title:"Módulo de teste"});
   const created=createLesson(mod,mod.modules[0].id,"Aula teste");
   let lessonStored=false,courseStored=false;
   try{
     await saveDraft(created.course.id,created.lesson);
     lessonStored=true;
     await saveCourseDraft(created.course);
     courseStored=true;
     const lessonRecord=await getDraft(created.course.id,created.lesson.id);
     const courseRecord=await getCourseDraft(created.course.id);
     if(!lessonRecord||!courseRecord||
       !courseRecord.course.modules[0].lessons.some(l=>l.id===lessonRecord.lesson.id))
       throw new Error("A aula não corresponde ao manifesto salvo.");
   }finally{
     if(lessonStored)await deleteDraft(created.course.id,created.lesson.id);
     if(courseStored)await deleteCourseDraft(created.course.id);
   }
 });
 await check("Seis modelos pedagógicos criam blocos editáveis",async()=>{
   if(LESSON_TEMPLATES.length!==6)throw new Error("Modelos didáticos incompletos.");
   const original=createCourse("Curso fictício");
   const module=applyCourseChange(original,"add-module",{title:"Módulo"});
   const created=createLesson(module,module.modules[0].id,"Aula de teste");
   const templated=useLessonTemplate(created.lesson,"deep-reading");
   validateLesson(templated);
   if(templated.blocks.length!==5||templated.id!==created.lesson.id)
     throw new Error("Template não gerou os cinco blocos esperados.");
 });
 await check("Laboratório interativo tem múltiplos caminhos com devolutivas",async()=>{
   const {lesson}=await contentRepository.getPublishedLesson("curso-fundamentos","aula-retorno");
   const block=lesson.blocks.find(b=>b.type==="interactive_lab");
   if(!block?.data.choices||block.data.choices.length<2)throw new Error("Laboratório de exemplo incompleto.");
   const html=renderLessonBlocks(lesson);
   if(!html.includes('data-activity="lab"')||!html.includes('data-branch="investigar"'))
      throw new Error("Componente interativo não foi renderizado.");
   const div=document.createElement("div");
   div.innerHTML=html;
   const button=div.querySelector('[data-branch="investigar"]');
   if(!exploreLab(button)||div.querySelector(".learning-feedback").hidden)
     throw new Error("Laboratório não mostrou devolutiva.");
 });
 await check("Quiz recebe resposta e mostra feedback adequado",async()=>{
   const {lesson}=await contentRepository.getPublishedLesson("curso-fundamentos","aula-recalque");
   const html=renderLessonBlocks(lesson);
   const div=document.createElement("div");div.innerHTML=html;
   const quiz=div.querySelector('form[data-activity="quiz"]');
   if(!quiz)throw new Error("Quiz não encontrado na aula.");
   const correct=quiz.querySelector('input[value="'+quiz.dataset.correct+'"]');
   if(!correct)throw new Error("Gabarito não corresponde às alternativas.");
   correct.checked=true;
   const result=checkQuiz(quiz);
   if(!result.correct||quiz.querySelector(".learning-feedback").hidden)throw new Error("Feedback do quiz não apareceu.");
 });
 await check("Salvamentos simultâneos preservam anotação, resposta e conclusão",async()=>{
   const id="qa14-"+Date.now().toString(36),lid="aula-qa14",profile=DEMO_PROFILES[0].id;
   try{
     await Promise.all([
       updateLearningState(id,lid,{note:"Anotação fictícia de QA"},profile),
       updateLearningState(id,lid,{completed:true},profile),
       updateLearningState(id,lid,{answer:{blockId:"bloco-qa",selection:"opcao-1",correct:true}},profile)
     ]);
     const stored=await getLearningState(id,lid,profile);
     if(stored.note!=="Anotação fictícia de QA"||!stored.completed||
        stored.answers?.["bloco-qa"]?.selection!=="opcao-1")
       throw new Error("Uma gravação substituiu outra no mesmo perfil e aula.");
   }finally{await deleteLearningState(id,lid,profile);}
 });
 await check("Curso sem aulas não é disponibilizado no catálogo local",async()=>{
   const course=createCourse("Curso vazio temporário");
   let stored=false;
   try{
     await saveCourseDraft(course);stored=true;
     let rejected=false;
     try{await makeCourseAvailableOnDevice(course.id);}
     catch(err){
       rejected=err.message.includes("ao menos uma aula");
       if(!rejected)throw err;
     }
     if(!rejected)throw new Error("Um curso vazio foi disponibilizado indevidamente.");
     if(await getLocalAvailableCourse(course.id))
       throw new Error("Curso vazio foi gravado no catálogo local.");
   }finally{if(stored)await deleteCourseDraft(course.id);}
 });
 await check("Progresso, nota e conclusão são isolados por perfil",async()=>{
   const id="smoke-"+Date.now();
   let written=false;
   try{
     await updateLearningState(id,"aula-teste",{note:"Nota fictícia",completed:true,answer:{
       blockId:"quiz-teste",selection:"opcao-a",correct:true}},DEMO_PROFILES[0].id);
     written=true;
     const a=await getLearningState(id,"aula-teste",DEMO_PROFILES[0].id);
     const b=await getLearningState(id,"aula-teste",DEMO_PROFILES[1].id);
     if(!a.completed||a.note!=="Nota fictícia"||b.completed||b.note)
       throw new Error("Dados não estão isolados por perfil.");
   }finally{if(written)await deleteLearningState(id,"aula-teste",DEMO_PROFILES[0].id);}
 });
 await check("Backup local tem formato validado sem publicação",async()=>{
   const backup=await buildLocalBackup(),result=validateLocalBackup(backup);
   if(backup.format!=="atelier-local-backup"||result.courses!==backup.courseDrafts.length)
     throw new Error("Backup local inválido.");
 });
 await check("Backup malformado é rejeitado antes da restauração",async()=>{
   const backup=await buildLocalBackup();
   backup.learning.states.push({
     profileId:"teste-a",courseId:"curso-testes",lessonId:"aula-testes",
     note:"Anotação fictícia",completed:false,
     answers:{"quiz-teste":{selection:"opcao-a",correct:"não é booleano"}}
   });
   try{validateLocalBackup(backup);}catch{return;}
   throw new Error("O backup com resposta inválida foi aceito.");
 });
 await check("Alternância de temas mantém controle acessível e não muda os dados",async()=>{
   const initial=getTheme();
   try{
     applyTheme("light",{persist:false});
     if(getTheme()!=="light")throw new Error("Tema claro não foi ativado.");
     const light=themeToggleHTML();
     if(!light.includes('aria-pressed="true"')||!light.includes('aria-label="Modo claro"'))
       throw new Error("O botão não reflete o tema claro.");
     applyTheme("dark",{persist:false});
     if(getTheme()!=="dark")throw new Error("Tema escuro não foi ativado.");
     const dark=themeToggleHTML();
     if(!dark.includes('aria-pressed="false"'))throw new Error("O botão não reflete o tema escuro.");
   }finally{applyTheme(initial,{persist:false});}
 });
 await check("A leitura está integrada à página sem bloco bege",async()=>{
   const reader=document.createElement("article");reader.className="reader";
   reader.style.position="absolute";reader.style.left="-99999px";
   document.body.append(reader);
   const initial=getTheme();
   try{
     for(const theme of ["dark","light"]){
       applyTheme(theme,{persist:false});
       const background=getComputedStyle(reader).backgroundColor;
       if(!["transparent","rgba(0, 0, 0, 0)"].includes(background))
         throw new Error("O leitor mantém fundo de cartão no tema "+theme+": "+background);
     }
   }finally{applyTheme(initial,{persist:false});reader.remove();}
 });
 await check("Entrada JSON: exatamente três perfis sem senhas públicas",async()=>{
   const profiles=await loadDemoProfiles();
   const ids=profiles.map(x=>x.id).sort().join(",");
   if(ids!=="administrador,aluno,professor")throw new Error("Os três perfis estão incompletos.");
   const forbidden=profiles.some(x=>"password" in x||"senha" in x||"token" in x);
   if(forbidden)throw new Error("Nunca inclua credenciais no JSON público.");
 });
 await check("Navegação demonstrativa respeita a área escolhida",async()=>{
   if(homeForRole("aluno")!=="/aluno"||homeForRole("professor")!=="/professor"||
      homeForRole("administrador")!=="/admin")throw new Error("Inícios de perfil incorretos.");
   const checks=[
    ["aluno","/cursos/curso-fundamentos",true],["aluno","/professor",false],
    ["professor","/professor/cursos/curso-fundamentos",true],["professor","/admin",false],
    ["administrador","/admin/beta",true],["administrador","/cursos",false]
   ];
   for(const [role,path,allowed] of checks){
     if(canVisit(role,path)!==allowed)throw new Error("Rota demonstrativa incoerente: "+role+" "+path);
     if(allowed&&roleForPath(path)!==role)throw new Error("Mapeamento de rota incorreto.");
   }
 });
 await check("Tela de entrada apresenta três cartões acessíveis",async()=>{
   const page=renderAccessScreen(await loadDemoProfiles(),{requestedPath:"/professor"});
   const matches=page.match(/data-demo-enter="/g)||[];
   if(matches.length!==3||!page.includes('id="access-title"')||!page.includes("Acesso")&&!page.includes("ACESSO"))
     throw new Error("Tela de escolha de perfis incompleta.");
 });
 await check("Roteiro do beta prepara feedback voluntário",async()=>{
   if(BETA_TASKS.length<8)throw new Error("Checklist do beta incompleto.");
   const data=betaReport({device:"teste",browser:"teste",role:"Aluno"});
   if(data.checks.length!==BETA_TASKS.length||!data.warning)
     throw new Error("Relatório do beta não pode ser exportado.");
 });
 await check("Curso criado no Estúdio aparece na biblioteca do aluno deste navegador",async()=>{
   const base=createCourse("Curso temporário do teste do catálogo","📚");
   const mod=applyCourseChange(base,"add-module",{title:"Módulo fictício"});
   const created=createLesson(mod,mod.modules[0].id,"Aula de teste");
   let storedLesson=false,storedCourse=false,available=false;
   try{
     await saveDraft(created.course.id,created.lesson);storedLesson=true;
     await saveCourseDraft(created.course);storedCourse=true;
     const visible=await makeCourseAvailableOnDevice(created.course.id);available=true;
     if(visible.lessonCount!==1)throw new Error("A aula não entrou na publicação local.");
     const list=await learnerContentRepository.listPublishedCourses();
     if(!list.some(c=>c.id===created.course.id&&c.local))throw new Error("Curso não entrou no catálogo do aluno.");
     const student=await learnerContentRepository.getPublishedLesson(created.course.id,created.lesson.id);
     if(student.lesson.title!=="Aula de teste"||!student.local||student.lesson.status!=="published")
       throw new Error("Aula não está acessível no ambiente do aluno.");
     const snapshot=await getLocalAvailableCourse(created.course.id);
     validateLocalSnapshot(snapshot);
     const backup=await buildLocalBackup();
     if(!backup.localAvailable.some(x=>x.id===created.course.id))
       throw new Error("O backup não contém o curso disponível no dispositivo.");
   }finally{
     if(available)await removeLocalAvailableCourse(created.course.id);
     if(storedLesson)await deleteDraft(created.course.id,created.lesson.id);
     if(storedCourse)await deleteCourseDraft(created.course.id);
   }
 });
 await check("Uma publicação local rejeita aulas que ainda não foram salvas",async()=>{
   const base=createCourse("Curso incompleto");
   const mod=applyCourseChange(base,"add-module",{title:"Módulo"});
   const created=createLesson(mod,mod.modules[0].id,"Aula ainda não salva");
   let rejected=false;
   try{
     validateLocalSnapshot({id:created.course.id,formatVersion:1,
       course:{...created.course,status:"published"},lessons:{}});
   }catch{rejected=true;}
   if(!rejected)throw new Error("Foi aceito um curso publicado sem o conteúdo da aula.");
 });
 await check("IndexedDB de cursos salva, recupera e exclui registro temporário",async()=>{
   const draft=createCourse("Smoke test local");
   let wrote=false;
   try{
     const saved=await saveCourseDraft(draft);
     wrote=true;
     const fetched=await getCourseDraft(draft.id);
     if(!fetched||fetched.id!==draft.id||fetched.course.title!=="Smoke test local")
       throw new Error("O rascunho de curso não foi recuperado.");
   }finally{
     if(wrote)await deleteCourseDraft(draft.id);
   }
 });
 await check("Gravação, recuperação e exclusão no IndexedDB",async()=>{
   if(!lesson)throw new Error("Aula não foi carregada.");
   const stamp="smoke_"+Date.now();
   const copy=structuredClone(lesson);
   copy.id=stamp;
   copy.courseId="curso-smoke";
   copy.moduleId="modulo-smoke";
   copy.status="draft";
   let saved=false;
   try{
     await saveDraft(copy.courseId,copy);saved=true;
     const record=await getDraft(copy.courseId,copy.id);
     if(!record||record.lesson.id!==copy.id)throw new Error("Rascunho não foi recuperado.");
   }finally{
     if(saved)await deleteDraft(copy.courseId,copy.id);
   }
 });
 result.forEach(r=>{
   const li=document.createElement("li");
   li.textContent=(r.ok?"OK — ":"FALHA — ")+r.label+(r.message?" ("+r.message+")":"");
   li.style.color=r.ok?"var(--good)":"var(--danger)";
   list.appendChild(li);
 });
 const passed=result.filter(x=>x.ok).length;
 summary.textContent=passed+" de "+result.length+" verificações concluídas com sucesso.";
 summary.style.color=passed===result.length?"var(--good)":"var(--danger)";
 running=false;again.disabled=false;
}
again.addEventListener("click",run);
run();
