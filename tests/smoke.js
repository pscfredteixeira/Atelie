import {contentRepository} from "../src/repositories/content-repository.js";
import {validateLesson,validateLessonLink} from "../src/repositories/validators.js";
import {getDraft,saveDraft,deleteDraft} from "../src/repositories/draft-repository.js";
import {renderLessonBlocks,getLessonOutline,listRegisteredBlocks} from "../src/lesson-engine/engine.js";
import {getCourseJourney,getLessonContext,summarizeCourse} from "../src/features/learning/journey.js";
import {createCourse,startCourseDraft,applyCourseChange,createCatalogEntry} from "../src/features/authoring/course-editor.js";
import {getCourseDraft,saveCourseDraft,deleteCourseDraft} from "../src/repositories/course-draft-repository.js";
import {createLesson,blockTemplate,updateLesson,syncLessonManifest,BLOCK_TYPES} from "../src/features/authoring/lesson-editor.js";
import {renderBlockFields,readBlockFields} from "../src/features/authoring/block-fields.js";
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
   form.querySelector('[name="options"]').value="Primeira alternativa\\nSegunda alternativa\\nTerceira alternativa";
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
