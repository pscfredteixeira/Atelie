/* Sprint 5 — Operações puras para organizar cursos e módulos.
   Não mistura estado de interface, IndexedDB nem publicação. */
import {validateCourse} from "../../repositories/validators.js";
const clean=s=>String(s??"").trim();
const copy=value=>JSON.parse(JSON.stringify(value));
const id=(prefix)=>{
 const uuid=globalThis.crypto?.randomUUID?.()||
   (Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,10));
 return prefix+"-"+uuid;
};
function slugify(text){
 return clean(text).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
   .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80)||"novo-curso";
}
function requireText(x,name,max=160){
 const v=clean(x);
 if(!v)throw Error(name+" não pode ficar vazio.");
 if(v.length>max)throw Error(name+" excede "+max+" caracteres.");
 return v;
}
function integerPositions(array){array.forEach((x,i)=>{x.position=i+1;});}
function getModule(course,moduleId){
 const module=course.modules.find(m=>m.id===moduleId);
 if(!module)throw Error("Módulo não encontrado no rascunho.");
 return module;
}
function shift(items,index,direction){
 const next=index+direction;
 if(index<0||next<0||next>=items.length)throw Error("Não é possível mover além dos limites.");
 [items[index],items[next]]=[items[next],items[index]];
 integerPositions(items);
}
export function createCourse(title="Novo curso",symbol="ψ"){
 const name=requireText(title,"Título do curso");
 const nowId=id("curso");
 const draft={
  schemaVersion:1,kind:"course",id:nowId,slug:slugify(name)+"-"+nowId.slice(-8),
  revision:1,status:"draft",title:name,icon:Array.from(clean(symbol)||"ψ").slice(0,3).join(""),subtitle:"",description:"",objectives:[],
  authorIds:["professor-demo"],modules:[]
 };
 validateCourse(draft);
 return draft;
}
export function startCourseDraft(published){
 validateCourse(published);
 const result=copy(published);
 result.status="draft";
 result.revision=published.revision+1;
 validateCourse(result);
 return result;
}
export function applyCourseChange(course,action,params={}){
 const draft=copy(course);
 if(draft.status!=="draft")throw Error("Edite apenas uma cópia de rascunho.");
 switch(action){
 case "info":{
  draft.title=requireText(params.title,"Título do curso");
  draft.icon=Array.from(clean(params.icon)||"ψ").slice(0,3).join("");
  draft.subtitle=clean(params.subtitle).slice(0,260);
  draft.description=clean(params.description).slice(0,3500);
  draft.objectives=clean(params.objectives).split("\n").map(s=>s.trim()).filter(Boolean).slice(0,20);
  break;
 }
 case "add-module":{
  if(draft.modules.length>=80)throw Error("Limite de 80 módulos nesta demonstração.");
  const title=requireText(params.title,"Título do módulo");
  draft.modules.push({id:id("modulo"),title,description:clean(params.description).slice(0,1200),position:draft.modules.length+1,lessons:[]});
  break;
 }
 case "edit-module":{
  const mod=getModule(draft,params.moduleId);
  mod.title=requireText(params.title,"Título do módulo");
  mod.description=clean(params.description).slice(0,1200);
  break;
 }
 case "move-module":{
  const ordered=[...draft.modules].sort((a,b)=>a.position-b.position);
  shift(ordered,ordered.findIndex(m=>m.id===params.moduleId),Number(params.direction));
  draft.modules=ordered;
  break;
 }
 case "remove-module":{
  const mod=getModule(draft,params.moduleId);
  if(mod.lessons.length)throw Error("Este módulo contém aulas. Mantenha-o para não romper os vínculos de conteúdo.");
  draft.modules=draft.modules.filter(m=>m.id!==params.moduleId);
  integerPositions(draft.modules.sort((a,b)=>a.position-b.position));
  break;
 }
 case "move-lesson":{
  const mod=getModule(draft,params.moduleId);
  const ordered=[...mod.lessons].sort((a,b)=>a.position-b.position);
  shift(ordered,ordered.findIndex(l=>l.id===params.lessonId),Number(params.direction));
  mod.lessons=ordered;
  break;
 }
 default:throw Error("Comando de edição não reconhecido.");
 }
 validateCourse(draft);
 return draft;
}
/* Atualiza SOMENTE aulas faltantes da versão GitHub.
 * Não substitui aulas, títulos, textos ou ordem já personalizados no navegador. */
export function mergePublishedLessons(localDraft,onlineCourse){
 validateCourse(localDraft);
 validateCourse(onlineCourse);
 if(localDraft.id!==onlineCourse.id)throw Error("Os cursos possuem IDs diferentes.");
 if(localDraft.status!=="draft"||onlineCourse.status!=="published")
   throw Error("É necessária uma revisão local e um manifesto público válidos.");
 const result=copy(localDraft);
 const existing=new Set(result.modules.flatMap(m=>m.lessons.map(l=>l.id)));
 let added=0;
 for(const source of [...onlineCourse.modules].sort((a,b)=>a.position-b.position)){
   let target=result.modules.find(m=>m.id===source.id);
   if(!target){
     target={id:source.id,title:source.title,description:source.description||"",
       position:result.modules.length+1,lessons:[]};
     result.modules.push(target);
   }
   for(const lesson of [...source.lessons].sort((a,b)=>a.position-b.position)){
     if(existing.has(lesson.id))continue;
     target.lessons.push({...copy(lesson),position:target.lessons.length+1});
     existing.add(lesson.id);
     added++;
   }
 }
 validateCourse(result);
 return {course:result,added};
}
export function createCatalogEntry(course){
 validateCourse(course);
 return {id:course.id,title:course.title,icon:course.icon||"ψ",slug:course.slug,
   summary:course.description||course.subtitle||"",manifest:"./courses/"+course.slug+"/curso.json",status:"draft"};
}
export function exportManifest(course){
 validateCourse(course);
 return copy(course);
}
