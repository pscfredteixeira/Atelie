/* Sprint 11 — Backup portátil JSON, sem transmissão a servidor.
   Pacote completo de *rascunhos locais + aprendizagem*.
   Não copia mídia binária nem JSON público de cursos não editados. */
import {listCourseDrafts,saveCourseDraft,deleteCourseDraft} from "../../repositories/course-draft-repository.js";
import {listDrafts,saveDraft,deleteDraft,downloadJSON} from "../../repositories/draft-repository.js";
import {listLocalAvailableSnapshots,validateLocalSnapshot,publishLocalSnapshot,restoreLocalSnapshot,removeLocalAvailableCourse} from "../../repositories/local-catalog-repository.js";
import {exportLearningStates,importLearningStates,validateLearningBackup,deleteLearningState} from "../../repositories/learning-repository.js";
import {validateCourse,validateLesson,validateLessonLink} from "../../repositories/validators.js";
export async function buildLocalBackup(){
 const [courses,lessons,learning,available]=await Promise.all([listCourseDrafts(),listDrafts(),exportLearningStates(),listLocalAvailableSnapshots()]);
 return {format:"atelier-local-backup",schemaVersion:1,createdAt:new Date().toISOString(),
  courseDrafts:courses.map(r=>r.course),lessonDrafts:lessons.map(r=>r.lesson),localAvailable:available,learning,
  notice:"Backup local de rascunhos, cursos disponibilizados neste dispositivo e histórico. Não inclui mídias externas nem todo o GitHub."};
}
export async function downloadLocalBackup(){
 const backup=await buildLocalBackup();
 downloadJSON(backup,"atelier-backup-"+new Date().toISOString().slice(0,10)+".json");
 return {courses:backup.courseDrafts.length,lessons:backup.lessonDrafts.length,available:backup.localAvailable.length,progress:backup.learning.states.length};
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
 const locallyAvailable=data.localAvailable===undefined?[]:data.localAvailable;
 if(!Array.isArray(locallyAvailable)||locallyAvailable.length>1000)
   throw Error("Catálogo local do backup inválido.");
 const availableIds=new Set();
 for(const snapshot of locallyAvailable){
   validateLocalSnapshot(snapshot);
   if(availableIds.has(snapshot.id))throw Error("Curso disponível duplicado no backup.");
   availableIds.add(snapshot.id);
 }
 // Valide também cada resposta antes de alterar qualquer IndexedDB.
 // Caso contrário, um backup inválido poderia restaurar cursos e falhar no histórico.
 validateLearningBackup(data.learning);
 return {courses:data.courseDrafts.length,lessons:data.lessonDrafts.length,available:locallyAvailable.length,states:data.learning.states.length};
}

/* As quatro bases IndexedDB não aceitam uma transação global.
   Guardamos um checkpoint completo ANTES de gravar e, se houver falha,
   revertemos cada chave alterada. Um erro de armazenamento persistente
   ainda pode impedir rollback; nesse caso, comunicamos explicitamente. */
async function undoPartialImport(checkpoint,changed){
 const oldCourses=new Map(checkpoint.courseDrafts.map(x=>[x.id,x]));
 const oldLessons=new Map(checkpoint.lessonDrafts.map(x=>[x.courseId+"::"+x.id,x]));
 const oldAvailable=new Map(checkpoint.localAvailable.map(x=>[x.id,x]));
 const oldLearning=new Map(checkpoint.learning.states.map(x=>[x.profileId+"::"+x.courseId+"::"+x.lessonId,x]));
 const failures=[];
 async function safe(action){
  try{await action()}catch(err){failures.push(err?.message||String(err))}
 }
 for(const id of [...changed.available].reverse()){
  const previous=oldAvailable.get(id);
  await safe(()=>previous?restoreLocalSnapshot(previous):removeLocalAvailableCourse(id));
 }
 for(const x of [...changed.learning].reverse()){
  const original=oldLearning.get(x.profileId+"::"+x.courseId+"::"+x.lessonId);
  if(original){
   await safe(()=>importLearningStates({...checkpoint.learning,states:[original]}));
  }else{
   await safe(()=>deleteLearningState(x.courseId,x.lessonId,x.profileId));
  }
 }
 for(const x of [...changed.lessons].reverse()){
  const original=oldLessons.get(x.courseId+"::"+x.id);
  await safe(()=>original?saveDraft(x.courseId,original):deleteDraft(x.courseId,x.id));
 }
 for(const id of [...changed.courses].reverse()){
  const original=oldCourses.get(id);
  await safe(()=>original?saveCourseDraft(original):deleteCourseDraft(id));
 }
 return failures;
}
export async function importLocalBackup(data){
 const counts=validateLocalBackup(data);
 // Falha ao ler o estado anterior? Então não escreva nada.
 const checkpoint=await buildLocalBackup();
 const changed={courses:[],lessons:[],learning:[],available:[]};
 try{
  for(const c of data.courseDrafts){
   await saveCourseDraft(c);
   changed.courses.push(c.id);
  }
  for(const l of data.lessonDrafts){
   await saveDraft(l.courseId,l);
   changed.lessons.push({courseId:l.courseId,id:l.id});
  }
  await importLearningStates(data.learning);
  changed.learning.push(...data.learning.states);
  for(const snapshot of data.localAvailable||[]){
   await publishLocalSnapshot(snapshot.course,Object.values(snapshot.lessons));
   changed.available.push(snapshot.id);
  }
  return counts;
 }catch(err){
  const failures=await undoPartialImport(checkpoint,changed);
  if(failures.length){
   throw Error("A restauração falhou e a recuperação local ficou incompleta ("+
     failures.length+" falha(s)). Evite novas edições e utilize seu arquivo de backup original. Causa: "+
     (err?.message||String(err)));
  }
  throw Error("A restauração falhou e as alterações aplicadas foram revertidas. Seus dados anteriores permanecem disponíveis. Causa: "+
    (err?.message||String(err)));
 }
}
