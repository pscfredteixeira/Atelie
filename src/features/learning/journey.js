/**
 * Atelier · Sprint 4 — Jornada de aprendizagem.
 * Somente lê o manifesto publicado. Não cria progresso fictício nem salva estado.
 * Usada por aluno e professor sem amarrar o percurso a IDs de aula específicos.
 */
function byPosition(a,b){return a.position-b.position;}
export function getCourseJourney(course){
  if(!course||!Array.isArray(course.modules))return [];
  const result=[];
  for(const [moduleIndex,module] of [...course.modules].sort(byPosition).entries()){
    for(const [lessonIndex,entry] of [...module.lessons].sort(byPosition).entries()){
      if(entry.status&&entry.status!=="published")continue;
      result.push({
        id:entry.id, title:entry.title||entry.id, summary:entry.summary||"",
        estimatedMinutes:Number.isInteger(entry.estimatedMinutes)?entry.estimatedMinutes:null,
        moduleId:module.id,moduleTitle:module.title,moduleIndex,lessonIndex,
        path:entry.path,position:entry.position
      });
    }
  }
  return result.map((item,index)=>({...item,number:index+1,total:result.length}));
}
export function getLessonContext(course,lessonId){
  const sequence=getCourseJourney(course);
  const index=sequence.findIndex(item=>item.id===lessonId);
  if(index===-1)return {sequence,index:-1,current:null,previous:null,next:null,first:sequence[0]||null,last:sequence.at(-1)||null};
  return {sequence,index,current:sequence[index],previous:sequence[index-1]||null,
    next:sequence[index+1]||null,first:sequence[0]||null,last:sequence.at(-1)||null};
}
export function summarizeCourse(course){
  const lessons=getCourseJourney(course);
  const known=lessons.filter(x=>x.estimatedMinutes!==null);
  return {moduleCount:course.modules.length,lessonCount:lessons.length,
    durationMinutes:known.length===lessons.length&&lessons.length?known.reduce((n,x)=>n+x.estimatedMinutes,0):null};
}
