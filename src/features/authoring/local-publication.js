/* "Disponibilizar neste dispositivo" oferece a experiência de criação do Atelier antigo.
 * O conteúdo é acessível no ambiente Aluno DESSE navegador, sem commit.
 * Uma publicação para outras pessoas ainda exige servidor ou atualização do GitHub. */
import {getCourseDraft} from "../../repositories/course-draft-repository.js";
import {getDraft} from "../../repositories/draft-repository.js";
import {contentRepository} from "../../repositories/content-repository.js";
import {publishLocalSnapshot} from "../../repositories/local-catalog-repository.js";
import {validateLessonLink} from "../../repositories/validators.js";
export async function makeCourseAvailableOnDevice(courseId){
 const record=await getCourseDraft(courseId);
 if(!record?.course)throw Error("Salve primeiro as informações do curso neste dispositivo.");
 const course=record.course;
 if(course.status!=="draft")throw Error("Abra o curso em modo de rascunho antes de disponibilizar.");
 const lessons=[];
 for(const module of course.modules){
  for(const entry of module.lessons){
   const saved=await getDraft(courseId,entry.id);
   if(saved?.lesson){
     validateLessonLink(saved.lesson,course,module.id);
     lessons.push(saved.lesson);
     continue;
   }
   try{
     const published=await contentRepository.getPublishedLesson(courseId,entry.id);
     validateLessonLink(published.lesson,course,module.id);
     lessons.push(published.lesson);
   }catch(err){
     if(err.code!=="not_found")throw err;
     throw Error("A aula “"+(entry.title||entry.id)+"” não possui uma versão salva. Abra o Estúdio e salve essa aula antes de disponibilizar o curso.");
   }
  }
 }
 return publishLocalSnapshot(course,lessons);
}
