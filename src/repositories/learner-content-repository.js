/* Visão do aluno: agrega o conteúdo GitHub com os cursos publicados localmente.
 * Para IDs repetidos, a versão local é exibida neste navegador; GitHub não é alterado. */
import {contentRepository} from "./content-repository.js";
import {getLocalAvailableCourse,listLocalAvailableCourses} from "./local-catalog-repository.js";
import {ContentError} from "./validators.js";
export async function listPublishedCourses(){
 let local=[];
 try{local=await listLocalAvailableCourses();}
 catch(err){console.warn("Catálogo local indisponível:",err);}
 let remote=[];
 try{remote=await contentRepository.listPublishedCourses();}
 catch(err){if(!local.length)throw err;console.warn("Catálogo público indisponível:",err);}
 const all=new Map(remote.map(item=>[item.id,item]));
 for(const item of local)all.set(item.id,item);
 return [...all.values()];
}
export async function getPublishedCourse(id){
 let local=null;
 try{local=await getLocalAvailableCourse(id);}
 catch(err){console.warn("Leitura de curso local indisponível:",err);}
 if(local)return {course:local.course,local:true,entry:{
   id:local.id,title:local.course.title,status:"published",local:true
 }};
 return contentRepository.getPublishedCourse(id);
}
export async function getPublishedLesson(courseId,lessonId){
 let local=null;
 try{local=await getLocalAvailableCourse(courseId);}
 catch(err){console.warn("Leitura local indisponível:",err);}
 if(local){
   const module=local.course.modules.find(m=>m.lessons.some(l=>l.id===lessonId));
   if(!module)throw new ContentError("Aula não encontrada neste curso do dispositivo.","not_found",lessonId);
   const lesson=local.lessons[lessonId];
   if(!lesson)throw new ContentError("A aula ainda não está disponível no catálogo local.","not_found",lessonId);
   return {course:local.course,module,lesson,contentURL:null,local:true};
 }
 return contentRepository.getPublishedLesson(courseId,lessonId);
}
export const learnerContentRepository={listPublishedCourses,getPublishedCourse,getPublishedLesson};
