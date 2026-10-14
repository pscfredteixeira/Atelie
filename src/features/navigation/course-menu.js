/* Seletor de cursos do menu. Descobre cursos públicos, locais e rascunhos.
 * Falhas do armazenamento não devem impedir a inicialização do Atelier. */
import {learnerContentRepository} from "../../repositories/learner-content-repository.js";
import {contentRepository} from "../../repositories/content-repository.js";
import {listCourseDrafts} from "../../repositories/course-draft-repository.js";
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
export function coursePicker(area,path,courses=[],placement="sidebar"){
  const teacher=area==="teacher",id="course-picker-"+area+"-"+placement;
  const current=currentCourseChoice(path,area);
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
