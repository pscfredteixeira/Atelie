/* Seletor de cursos do menu. Descobre cursos públicos, locais e rascunhos.
 * Falhas do armazenamento não devem impedir a inicialização do Atelier. */
import {learnerContentRepository} from "../../repositories/learner-content-repository.js";
import {contentRepository} from "../../repositories/content-repository.js";
import {listCourseDrafts,getCourseDraft} from "../../repositories/course-draft-repository.js";
import {getLocalAvailableCourse} from "../../repositories/local-catalog-repository.js";
import {escapeHTML as e} from "../../ui/components.js";

const BASE_COURSES=[
  {id:"curso-introducao-psicanalise",title:"Introdução à Psicanálise"},
  {id:"curso-formacao-freudiana",title:"Formação Freudiana"}
];

function mergeCourses(...lists){
  const choices=new Map();
  for(const list of lists){
    for(const item of list){
      if(!item||typeof item.id!=="string"||!/^[a-zA-Z0-9_-]+$/.test(item.id))continue;
      if(typeof item.title!=="string"||!item.title.trim())continue;
      if(item.demo===true)continue;
      choices.set(item.id,{id:item.id,title:item.title});
    }
  }
  return [...choices.values()];
}
export async function loadCourseMenu(){
  const [student,published,drafts]=await Promise.allSettled([
    learnerContentRepository.listPublishedCourses(),
    contentRepository.listPublishedCourses(),
    listCourseDrafts()
  ]);
  const learners=student.status==="fulfilled"?student.value:[];
  const catalog=published.status==="fulfilled"?published.value.filter(x=>!x.demo):[];
  const localDrafts=drafts.status==="fulfilled"?drafts.value.map(x=>x.course):[];
  return {
    student:mergeCourses(BASE_COURSES,learners),
    teacher:mergeCourses(BASE_COURSES,catalog,learners,localDrafts)
  };
}
export function currentCourseChoice(path,area){
  const match=area==="teacher"?
    path.match(/^\/professor\/cursos\/([a-zA-Z0-9_-]+)(?:\/|$)/):
    path.match(/^\/cursos\/([a-zA-Z0-9_-]+)(?:\/|$)/);
  return match?match[1]:"";
}

const STORAGE_PREFIX="atelier:selected-course:";
let inMemory={student:"",teacher:""};
export function rememberCourseChoice(area,courseId){
  if(area!=="student"&&area!=="teacher")return;
  if(!/^[a-zA-Z0-9_-]+$/.test(courseId))return;
  inMemory[area]=courseId;
  try{window.sessionStorage.setItem(STORAGE_PREFIX+area,courseId)}catch{/* In private mode, remember in memory */}
}
export function selectedCourseId(area,path,courses=[]){
  const current=currentCourseChoice(path,area);
  if(current){rememberCourseChoice(area,current);return current;}
  let stored=inMemory[area]||"";
  if(!stored){try{stored=window.sessionStorage.getItem(STORAGE_PREFIX+area)||""}catch{}}
  return courses.some(c=>c.id===stored)?stored:"";
}
export async function loadCourseOutline(area,courseId){
  if(!courseId||!/^[a-zA-Z0-9_-]+$/.test(courseId))return null;
  if(area==="teacher"){
    try{
      const draft=await getCourseDraft(courseId);
      if(draft?.course)return draft.course;
    }catch(err){console.warn("Rascunho indisponível para o menu:",err);}
    try{
      const {course}=await contentRepository.getPublishedCourse(courseId);
      return course;
    }catch(err){console.warn("Curso público indisponível para o menu:",err);}
    try{return (await getLocalAvailableCourse(courseId))?.course||null}
    catch(err){console.warn("Curso local indisponível para o menu:",err);return null}
  }
  try{return (await learnerContentRepository.getPublishedCourse(courseId)).course;}
  catch(err){console.warn("Sumário do curso indisponível para o menu:",err);return null}
}
function ordered(items=[]){return [...items].sort((a,b)=>a.position-b.position);}
export function selectedModuleId(hash){
  const query=String(hash||"").split("?")[1]||"";
  const item=query.split("&").find(part=>part.startsWith("modulo="));
  if(!item)return "";
  try{return decodeURIComponent(item.slice("modulo=".length).split("+").join("%20"));}
  catch{return "";}
}
export function courseOutline(area,course,hash=""){
  if(!course||!Array.isArray(course.modules))return "";
  const isTeacher=area==="teacher";
  const base=(isTeacher?"#/professor/cursos/":"#/cursos/")+encodeURIComponent(course.id);
  const chosen=selectedModuleId(hash);
  const modules=ordered(course.modules);
  const rows=modules.map((mod,i)=>{
    const href=base+"?modulo="+encodeURIComponent(mod.id);
    const lessons=ordered(mod.lessons||[]).filter(l=>isTeacher||!l.status||l.status==="published");
    const open=chosen===mod.id||(!chosen&&i===0);
    return '<li class="course-tree-module">'+
      '<a class="course-tree-link'+(chosen===mod.id?" is-current":"")+'" href="'+e(href)+'"'+
      (chosen===mod.id?' aria-current="location"':"")+'>'+
      '<span class="course-tree-number" aria-hidden="true">'+String(i+1).padStart(2,"0")+'</span>'+
      '<span>'+e(mod.title)+'</span></a>'+
      (lessons.length?'<details class="course-tree-lessons"'+(open?" open":"")+'>'+
        '<summary>'+lessons.length+' aula(s)</summary>'+
        '<ol>'+lessons.map(l=>{
          const lessonHref=base+"/aulas/"+encodeURIComponent(l.id)+(isTeacher?"/editar":"");
          return '<li><a href="'+e(lessonHref)+'">'+e(l.title||l.id)+'</a></li>';
        }).join("")+'</ol></details>':"")+
      '</li>';
  }).join("");
  return '<section class="course-tree" aria-label="Menu do curso selecionado">'+
    '<div class="course-tree-heading">'+e(isTeacher?"Estrutura do curso":"Conteúdo do curso")+'</div>'+
    '<a class="course-tree-overview" href="'+e(base)+'">'+e(isTeacher?"Visão geral e edição":"Visão geral do curso")+' →</a>'+
    (modules.length?'<ol class="course-tree-list">'+rows+'</ol>':
      '<p class="course-tree-empty">Este curso ainda não tem módulos.</p>')+
    '</section>';
}
export function coursePicker(area,path,courses=[],placement="sidebar",chosenCourse=""){
  const teacher=area==="teacher",id="course-picker-"+area+"-"+placement;
  const current=chosenCourse||selectedCourseId(area,path,courses);
  const label=teacher?"Selecionar curso para editar":"Selecionar curso para estudar";
  const target=teacher?"#/professor/cursos/":"#/cursos/";
  const known=courses.some(c=>c.id===current);
  return '<div class="course-picker course-picker-'+e(placement)+'">'+
    '<label for="'+id+'" class="course-picker-label">'+e(label)+'</label>'+
    '<select id="'+id+'" class="course-picker-select" data-course-picker="'+area+'" aria-label="'+e(label)+'">'+
    '<option value="">Escolha um curso…</option>'+
    (current&&!known?'<option value="'+e(target+current)+'" selected>Curso atual</option>':'')+
    courses.map(c=>'<option value="'+e(target+c.id)+'"'+(c.id===current?' selected':'')+'>'+e(c.title)+'</option>').join('')+
    '</select></div>';
}
