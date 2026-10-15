/* Percurso linear do Atelier: curso > aulas.
 * Conserva os manifests legados com modules[] para não alterar IDs e rascunhos.
 * Módulos sem aulas representam aulas previstas, não capítulos com subaulas.
 */
const ordered=items=>[...(items||[])].sort((a,b)=>a.position-b.position);
export function getCourseEntries(course,{includeDrafts=false}={}){
 if(!course||!Array.isArray(course.modules))return [];
 const entries=[];
 for(const module of ordered(course.modules)){
  const actual=ordered(module.lessons).filter(lesson=>includeDrafts||!lesson.status||lesson.status==="published");
  if(!actual.length){
   if(!module.lessons?.length){
    entries.push({id:module.id,moduleId:module.id,module,lesson:null,
     title:module.title,summary:module.description||"",planned:true,estimatedMinutes:null});
   }
   continue;
  }
  for(const lesson of actual)entries.push({
   id:lesson.id,moduleId:module.id,module,lesson,
   title:lesson.title||module.title,summary:lesson.summary||module.description||"",
   planned:false,estimatedMinutes:Number.isInteger(lesson.estimatedMinutes)?lesson.estimatedMinutes:null
  });
 }
 return entries.map((entry,i)=>({...entry,number:i+1,total:entries.length}));
}


/* Sprint 15: cálculo separado do programa completo e da parte estudável. */
export function isValidCourseSectionId(value){
 return typeof value==="string" && /^[A-Za-z0-9_-]+$/.test(value);
}
export function summarizeLearningProgress(course,completedLessonIds=[]){
 const entries=getCourseEntries(course);
 const available=entries.filter(item=>!item.planned);
 const completedSet=new Set(completedLessonIds);
 const done=available.filter(item=>completedSet.has(item.id)).length;
 return {
  total:entries.length,
  available:available.length,
  planned:entries.length-available.length,
  completed:done,
  percent:available.length?Math.round(100*done/available.length):0
 };
}
