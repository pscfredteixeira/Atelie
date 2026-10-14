/* Sprint 11 — Backup portátil JSON, sem transmissão a servidor.
   Pacote completo de *rascunhos locais + aprendizagem*.
   Não copia mídia binária nem JSON público de cursos não editados. */
import {listCourseDrafts,saveCourseDraft} from "../../repositories/course-draft-repository.js";
import {listDrafts,saveDraft,downloadJSON} from "../../repositories/draft-repository.js";
import {exportLearningStates,importLearningStates} from "../../repositories/learning-repository.js";
import {validateCourse,validateLesson,validateLessonLink} from "../../repositories/validators.js";
export async function buildLocalBackup(){
 const [courses,lessons,learning]=await Promise.all([listCourseDrafts(),listDrafts(),exportLearningStates()]);
 return {format:"atelier-local-backup",schemaVersion:1,createdAt:new Date().toISOString(),
  courseDrafts:courses.map(r=>r.course),lessonDrafts:lessons.map(r=>r.lesson),learning,
  notice:"Backup local. Não inclui mídias nem versões públicas sem rascunho."};
}
export async function downloadLocalBackup(){
 const backup=await buildLocalBackup();
 downloadJSON(backup,"atelier-backup-"+new Date().toISOString().slice(0,10)+".json");
 return {courses:backup.courseDrafts.length,lessons:backup.lessonDrafts.length,progress:backup.learning.states.length};
}
export function validateLocalBackup(data){
 if(data?.format!=="atelier-local-backup"||data.schemaVersion!==1||
   !Array.isArray(data.courseDrafts)||!Array.isArray(data.lessonDrafts)||
   data.courseDrafts.length>1000||data.lessonDrafts.length>20000||
   data.learning?.format!=="atelier-learning-backup"||data.learning?.schemaVersion!==1||
   !Array.isArray(data.learning.states))throw Error("Arquivo não é um backup compatível do Atelier.");
 const courseIds=new Set(),lessonIds=new Set();
 for(const course of data.courseDrafts){
  validateCourse(course);
  if(course.status!=="draft")throw Error("Backup de curso com status incompatível.");
  if(courseIds.has(course.id))throw Error("Curso duplicado no backup.");
  courseIds.add(course.id);
 }
 for(const lesson of data.lessonDrafts){
  validateLesson(lesson);
  if(lesson.status!=="draft")throw Error("Backup de aula com status incompatível.");
  const k=lesson.courseId+"::"+lesson.id;
  if(lessonIds.has(k))throw Error("Aula duplicada no backup.");
  lessonIds.add(k);
  const related=data.courseDrafts.find(c=>c.id===lesson.courseId);
  if(related)validateLessonLink(lesson,related,lesson.moduleId);
 }
 return {courses:data.courseDrafts.length,lessons:data.lessonDrafts.length,states:data.learning.states.length};
}
export async function importLocalBackup(data){
 const counts=validateLocalBackup(data);
 // Importação é create/update; não apaga outros rascunhos.
 // O IndexedDB dos três repositórios é separado: se um passo falhar,
 // comunicar que parte do backup pode ter sido restaurada.
 for(const c of data.courseDrafts)await saveCourseDraft(c);
 for(const l of data.lessonDrafts)await saveDraft(l.courseId,l);
 await importLearningStates(data.learning);
 return counts;
}
