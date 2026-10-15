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
 const all=new Map(remote.filter(item=>!item.demo).map(item=>[item.id,item]));
 for(const item of local)all.set(item.id,item);
 return [...all.values()];
}
/* Evita que uma cópia antiga publicada neste navegador esconda aulas
 * acrescentadas posteriormente no GitHub. Nunca apaga a versão local. */
function lessonIds(course){
 return new Set((course?.modules||[]).flatMap(m=>(m.lessons||[]).map(l=>l.id)));
}
export function preferOnlineUpdate(localCourse,onlineCourse){
 if(!localCourse||!onlineCourse)return false;
 const localIds=lessonIds(localCourse);
 return [...lessonIds(onlineCourse)].some(id=>!localIds.has(id));
}
export async function getPublishedCourse(id){
 let local=null;
 try{local=await getLocalAvailableCourse(id);}
 catch(err){console.warn("Leitura de curso local indisponível:",err);}
 if(!local)return contentRepository.getPublishedCourse(id);
 const offline={course:local.course,local:true,entry:{
   id:local.id,title:local.course.title,status:"published",local:true
 }};
 let online;
 try{online=await contentRepository.getPublishedCourse(id);}
 catch(err){
   if(err.code!=="not_found")console.warn("GitHub temporariamente indisponível; exibindo curso local.",err);
   return offline;
 }
 if(preferOnlineUpdate(local.course,online.course))
   return {...online,newerOnline:true,hasLocalCopy:true};
 return offline;
}
export async function getPublishedLesson(courseId,lessonId){
 const chosen=await getPublishedCourse(courseId);
 if(!chosen.local){
   const contains=lessonIds(chosen.course).has(lessonId);
   if(contains)return contentRepository.getPublishedLesson(courseId,lessonId);
   // Curso de versão online mais recente: preserve o acesso a aulas
   // exclusivas da cópia local, sem trocar nem descartar esses registros.
   if(chosen.hasLocalCopy){
     const local=await getLocalAvailableCourse(courseId);
     const module=local?.course.modules.find(m=>m.lessons.some(l=>l.id===lessonId));
     const lesson=local?.lessons?.[lessonId];
     if(module&&lesson)return {course:local.course,module,lesson,contentURL:null,local:true};
   }
   throw new ContentError("Aula não encontrada neste curso.","not_found",lessonId);
 }
 const local=await getLocalAvailableCourse(courseId);
 const module=local?.course.modules.find(m=>m.lessons.some(l=>l.id===lessonId));
 if(!module)throw new ContentError("Aula não encontrada neste curso do dispositivo.","not_found",lessonId);
 const lesson=local.lessons[lessonId];
 if(!lesson)throw new ContentError("A aula ainda não está disponível no catálogo local.","not_found",lessonId);
 return {course:local.course,module,lesson,contentURL:null,local:true};
}
export const learnerContentRepository={listPublishedCourses,getPublishedCourse,getPublishedLesson};
