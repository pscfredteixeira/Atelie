/* Sprint 10 — Interface dos perfis fictícios, notas e progresso local. */
import {getDemoProfile,DEMO_PROFILES,getLearningState,listLearningStates} from "../../repositories/learning-repository.js";
import {escapeHTML as e,action,emptyState,pageHead,note} from "../../ui/components.js";
import {summarizeLearningProgress} from "./course-entries.js?build=sprint15-20261015";
const url=(cid,lid)=>"#/cursos/"+encodeURIComponent(cid)+"/aulas/"+encodeURIComponent(lid);
export function profilePicker(){
 const selected=getDemoProfile();
 return '<label class="learning-profile-label" for="demo-profile">Perfil fictício (sem senha):</label>'+
  '<select class="field learning-profile-select" id="demo-profile" aria-label="Perfil de aluno para teste">'+
  DEMO_PROFILES.map(x=>'<option value="'+e(x.id)+'"'+(x.id===selected?" selected":"")+">"+e(x.label)+"</option>").join("")+'</select>';
}
export async function lessonNotebook(courseId,lessonId){
 let record,error="";
 try{record=await getLearningState(courseId,lessonId);}
 catch(err){error=err.message;}
 if(error)return '<section class="notice" role="alert">Seu navegador não permitiu salvar dados locais: '+e(error)+'. O conteúdo da aula continua disponível.</section>';
 return '<section class="learning-notebook" aria-labelledby="notebook-title" data-course-id="'+e(courseId)+'" data-lesson-id="'+e(lessonId)+'">'+
  '<div class="topline"><div><span class="overline">Seu espaço de estudo</span><h2 class="section-title" id="notebook-title">Meu caderno</h2></div>'+profilePicker()+'</div>'+
  '<p class="muted">Estas anotações ficam apenas neste dispositivo e neste perfil fictício. Não registre dados pessoais ou clínicos reais.</p>'+
  '<form data-learning-form="note"><label class="field-label" for="lesson-note">Minha anotação sobre esta aula</label>'+
  '<textarea class="field" id="lesson-note" name="note" rows="5" maxlength="20000">'+e(record.note||"")+'</textarea>'+
  '<div class="button-row"><button type="submit" class="button">Salvar anotação local</button>'+
  '<button type="button" class="button '+(record.completed?"":"action")+'" data-learning-action="complete">'+
  (record.completed?"Marcar como não concluída":"Marcar aula como concluída")+'</button></div></form>'+
  '<p class="learning-record-state">'+(record.completed?"Aula marcada como concluída neste navegador.":"Esta aula ainda não está marcada como concluída.")+'</p>'+
  '<div role="status" aria-live="polite" class="tiny" data-learning-status></div></section>';
}
export async function notebookPage(repository){
 const records=await listLearningStates();
 const notes=records.filter(x=>x.note?.trim()).sort((a,b)=>(b.updatedAt||"").localeCompare(a.updatedAt||""));
 const courses=new Map();
 for(const courseId of new Set(notes.map(r=>r.courseId))){
  try{courses.set(courseId,(await repository.getPublishedCourse(courseId)).course);}
  catch{courses.set(courseId,null)}
 }
 const entries=notes.map(r=>{
  const course=courses.get(r.courseId),entry=course?.modules.flatMap(m=>m.lessons).find(l=>l.id===r.lessonId);
  return '<article class="card"><div class="card-label">'+e(course?.title||"Curso local")+'</div>'+
   '<h3>'+e(entry?.title||"Aula "+r.lessonId)+'</h3>'+
   '<p class="learning-note-text">'+e(r.note)+'</p>'+
   (entry?action("Abrir aula →",url(r.courseId,r.lessonId),"small"):'')+'</article>';
 }).join("");
 return pageHead("Aprender / Meu caderno","As ideias que <em>ficaram.</em>",
  "Notas de estudo salvas no navegador para o perfil fictício selecionado.")+
  '<div class="learning-profile-row">'+profilePicker()+'</div>'+
  (notes.length?'<div class="course-list">'+entries+'</div>':
   emptyState("Nenhuma anotação salva","Abra uma aula e escreva no caderno ao final da leitura.",
     action("Conhecer os cursos →","#/cursos","action")))+
  note("<strong>Privacidade:</strong> este é um perfil de demonstração, não uma conta. Qualquer pessoa que usar este navegador pode escolher o mesmo perfil e ler suas anotações. Não insira informações confidenciais.");
}
export async function progressPage(repository){
 const records=await listLearningStates();
 const completed=records.filter(r=>r.completed);
 const published=await repository.listPublishedCourses();
 const cards=[];
 for(const c of published){
  try{
   const manifest=(await repository.getPublishedCourse(c.id)).course;
   const courseCompleted=completed.filter(r=>r.courseId===c.id).map(r=>r.lessonId);
   const stats=summarizeLearningProgress(manifest,courseCompleted);
   const availableLabel=stats.available===1?"aula disponível":"aulas disponíveis";
   const completedLabel=stats.available?
      stats.completed+" de "+stats.available+" "+availableLabel+" concluída"+(stats.available===1?"":"s"):
      "Nenhuma aula disponível para concluir";
   const plannedLabel=stats.planned?
      stats.planned+" aula"+(stats.planned===1?"":"s")+" em preparação.":"Programa integral disponível.";
   cards.push('<article class="card"><div class="card-label">Progresso nas aulas disponíveis</div><h3>'+e(manifest.title)+'</h3>'+
     '<p>'+e(completedLabel)+'. '+e(plannedLabel)+'</p>'+
     '<div class="progress-label"><span>Conclusão do conteúdo disponível</span><span>'+stats.percent+'%</span></div>'+
     '<div class="progress" role="img" aria-label="'+e(completedLabel)+'; '+stats.percent+'% do conteúdo disponível"><span style="width:'+stats.percent+'%"></span></div>'+
     '<p class="tiny">'+stats.total+' aula'+(stats.total===1?"":"s")+' no programa completo.</p>'+
     action("Ver curso →","#/cursos/"+e(c.id),"small")+'</article>');
  }catch{/* skip unavailable course */}
 }
 return pageHead("Aprender / Meu progresso","O caminho que você <em>percorreu.</em>",
  "A porcentagem se refere somente às aulas já disponíveis. As aulas em preparação não entram no cálculo.")+
  '<div class="learning-profile-row">'+profilePicker()+'</div>'+
  '<div class="metrics"><div class="metric"><strong>'+completed.length+'</strong><span>Marcações de conclusão neste perfil</span></div>'+
  '<div class="metric"><strong>'+records.length+'</strong><span>Aulas com atividade registrada</span></div>'+
  '<div class="metric"><strong>'+records.reduce((n,r)=>n+Object.keys(r.answers||{}).length,0)+'</strong><span>Respostas registradas</span></div></div>'+
  (cards.length?'<div class="grid two" style="margin-top:22px">'+cards.join("")+'</div>':
  emptyState("Nenhum curso disponível","Volte ao catálogo para começar."))+
  note("O acompanhamento mostrado é individual apenas dentro deste navegador. Não existe avaliação global de alunos nem sincronização.");
}
