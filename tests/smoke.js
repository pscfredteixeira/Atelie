import {contentRepository} from "../src/repositories/content-repository.js";
import {validateLesson,validateLessonLink} from "../src/repositories/validators.js";
import {getDraft,saveDraft,deleteDraft} from "../src/repositories/draft-repository.js";
import {renderLessonBlocks} from "../src/lesson-engine/basic-renderer.js";
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
