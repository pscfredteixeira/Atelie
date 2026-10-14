import {routeView} from "./views.js";
import {getPublishedLesson,getPublishedCourse} from "../repositories/content-repository.js";
import {getCourseDraft,saveCourseDraft,deleteCourseDraft} from "../repositories/course-draft-repository.js";
import {getLocalAvailableCourse,removeLocalAvailableCourse} from "../repositories/local-catalog-repository.js";
import {makeCourseAvailableOnDevice} from "../features/authoring/local-publication.js";
import {createLesson} from "../features/authoring/lesson-editor.js";
import {useLessonTemplate} from "../features/authoring/lesson-templates.js";
import {mountVisualStudio,unmountStudio,isStudioDirty,confirmStudioLeave} from "../features/authoring/studio-controller.js";
import {createCourse,startCourseDraft,applyCourseChange,createCatalogEntry,exportManifest} from "../features/authoring/course-editor.js";
import {saveDraft,deleteDraft,downloadJSON} from "../repositories/draft-repository.js";
import {validateLessonLink} from "../repositories/validators.js";
import {checkQuiz,exploreLab} from "../features/learning/activities.js";
import {getDemoProfile,setDemoProfile,updateLearningState} from "../repositories/learning-repository.js";
import {downloadLocalBackup,importLocalBackup} from "../features/administration/backup.js";
import {setBetaCheck,betaReport} from "../features/administration/beta.js";
import {escapeHTML as e} from "../ui/components.js";

const app = document.getElementById("app");
const toastHost = document.getElementById("toast-host");
const navGroups = [
 {name:"Aprender",links:[
  {href:"#/aluno",name:"Início",icon:"⌂"},
  {href:"#/cursos",name:"Cursos",icon:"◇"},
  {href:"#/aluno/caderno",name:"Meu caderno",icon:"✎"},
  {href:"#/aluno/progresso",name:"Meu progresso",icon:"◷"}
 ]},
 {name:"Criar",links:[
  {href:"#/professor",name:"Painel do professor",icon:"✧"},
  {href:"#/professor/cursos/curso-fundamentos",name:"Estrutura do curso",icon:"☷"},
  {href:"#/professor/cursos/curso-fundamentos/aulas/aula-recalque/editar",name:"Estúdio de criação",icon:"⊕"}
 ]},
 {name:"Organizar",links:[{href:"#/admin",name:"Administração",icon:"▦"},{href:"#/admin/identidade",name:"Biblioteca visual",icon:"◈"},
  {href:"#/admin/blocos",name:"Blocos pedagógicos",icon:"▧"},
  {href:"#/admin/beta",name:"Roteiro beta",icon:"☑"}]}
];
let isMenuOpen = false;
let currentDialog = null;
let opener = null;
let toastTimer;
let activeRender=0;
const unsavedForms=new Set();
let unsavedNote=false;
let approvedNavigationHash=null;
function route() {
  let path = window.location.hash.slice(1) || "/aluno";
  path = path.split("?")[0].replace(/\/+$/,"") || "/";
  return path.startsWith("/") ? path : "/not-found";
}
function selectedNav(path) {
  if(path==="/")return "#/aluno";
  if(path.startsWith("/cursos/"))return "#/cursos";
  if(path.startsWith("/professor/cursos/") && (path.endsWith("/editar")||path.endsWith("/previa")))return "#/professor/cursos/curso-fundamentos/aulas/aula-recalque/editar";
  if(path.startsWith("/professor/cursos/"))return "#/professor/cursos/curso-fundamentos";
  return "#"+path;
}
function anchor(item, selected) {
  const active = item.href === selected;
  return '<a class="nav-link" href="'+e(item.href)+'"'+(active?' aria-current="page"':'')+'><span class="nav-icon" aria-hidden="true">'+e(item.icon)+'</span><span>'+e(item.name)+'</span></a>';
}
function sidebar(path) {
  const active = selectedNav(path);
  return '<aside class="sidebar'+(isMenuOpen?' is-open':'')+'" id="sidebar" aria-label="Navegação principal">'+
  '<a href="#/aluno" class="brand">Atelier<span class="brand-dot">.</span></a>'+
  '<div class="brand-sub">Laboratório de psicanálise</div><nav aria-label="Ambientes do Atelier">'+
  navGroups.map(g=>'<span class="nav-caption">'+e(g.name)+'</span><div class="nav-group">'+g.links.map(x=>anchor(x,active)).join('')+'</div>').join('')+
  '</nav><div class="sidebar-foot">Atelier · Beta local em JSON.<br>Sem login real ou sincronização entre aparelhos.<br>'+
  '<a href="./wireframes.html">Wireframes anteriores ↗</a></div></aside>';
}
function bottomMenu(path) {
  const active = selectedNav(path);
  const links=[
    {href:"#/aluno",name:"Início",icon:"⌂"},
    {href:"#/cursos",name:"Cursos",icon:"◇"},
    {href:"#/professor",name:"Criar",icon:"✧"},
    {href:"#/admin",name:"Admin",icon:"▦"}
  ];
  const bottomActive = active.startsWith("#/professor")?"#/professor":active;
  return '<nav class="mobile-bar" aria-label="Acesso rápido">'+links.map(x=>'<a href="'+e(x.href)+'"'+(x.href===bottomActive?' aria-current="page"':'')+
    '><span class="mobile-icon" aria-hidden="true">'+e(x.icon)+'</span>'+e(x.name)+'</a>').join('')+'</nav>';
}
async function render(moveFocus) {
  const call=++activeRender;
  const path=route();
  let page;
  try{
    page=await routeView(path);
  }catch(err){
    const missing=err.code==="not_found";
    const title=missing?"Conteúdo não encontrado":"Não foi possível abrir esta página";
    const detail=err?.message||"Ocorreu um erro ao carregar o conteúdo.";
    page={title,area:"Atelier",html:'<div class="overline">ATELIER / '+e(missing?"Não encontrado":"Erro de carregamento")+'</div>'+
      '<h1 class="page-title">'+e(title)+'</h1><div class="info-state" role="alert"><p>'+e(detail)+'</p>'+
      (err.location?'<p class="tiny">Arquivo: '+e(err.location)+'</p>':'')+
      '<div class="button-row"><button type="button" class="button action" data-action="retry">Tentar novamente</button>'+
      '<a class="button" href="#/cursos">Voltar ao catálogo →</a></div></div>'};
  }
  if(call!==activeRender)return;
  unmountStudio();
  unsavedForms.clear();
  unsavedNote=false;
  let chosen = path.startsWith("/professor") ? "#/professor" : path.startsWith("/admin") ? "#/admin" : "#/aluno";
  const topbar = '<header class="topbar"><div class="top-start">'+
    '<button class="menu-button" id="menu-toggle" type="button" aria-label="Abrir navegação" aria-controls="sidebar" aria-expanded="'+String(isMenuOpen)+'">☰</button>'+
    '<div class="breadcrumb">ATELIER / '+e(page.area)+' / <strong>'+e(page.title)+'</strong></div></div>'+
    '<div class="top-actions"><span class="mode-chip">Protótipo</span>'+
    '<label for="switch-role" class="visually-hidden" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0">Trocar ambiente</label>'+
    '<select class="view-toggle" id="switch-role" aria-label="Trocar ambiente demonstrativo">'+
    '<option value="#/aluno"'+(chosen==="#/aluno"?' selected':'')+'>Aluno</option>'+
    '<option value="#/professor"'+(chosen==="#/professor"?' selected':'')+'>Professor</option>'+
    '<option value="#/admin"'+(chosen==="#/admin"?' selected':'')+'>Admin</option></select></div></header>';
  app.innerHTML = '<div class="shell">'+sidebar(path)+
    '<div class="workarea">'+topbar+
    '<main class="main" id="main-content" tabindex="-1"><div class="viewport">'+page.html+'</div>'+
    '<footer class="footer"><span>Atelier. · Beta JSON · Sprints 0–13</span><span>'+
    '<a href="./arquitetura.html">Mapa original</a> · <a href="./wireframes.html">Wireframes</a> · '+
    '<a href="https://github.com/pscfredteixeira/Atelie" target="_blank" rel="noopener noreferrer">Código no GitHub ↗</a></span></footer></main></div>'+
    '</div>'+bottomMenu(path)+(isMenuOpen?'<button class="sidebar-shade" id="sidebar-shade" type="button" aria-label="Fechar navegação"></button>':'');
  document.title = page.title + " · Atelier";
  const studioNode=app.querySelector("[data-visual-studio]");
  if(studioNode){
    try{await mountVisualStudio(studioNode);}
    catch(err){
      studioNode.innerHTML='<section class="info-state" role="alert"><h2>Não foi possível abrir o Estúdio</h2><p>'+e(err?.message||"Falha ao carregar a aula local.")+
      '</p><a class="button" href="#/professor">Voltar aos cursos →</a></section>';
    }
  }
  if(moveFocus){
    window.scrollTo({top:0,behavior:"instant"});
    const main=document.getElementById("main-content");
    main.focus({preventScroll:true});
  }
}
function showToast(message) {
  if(!toastHost)return;
  toastHost.replaceChildren();
  const el=document.createElement("div");
  el.className="toast";el.textContent=message;
  toastHost.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toastHost.replaceChildren(),4200);
}
function closeDialog() {
  if(!currentDialog)return;
  currentDialog.remove();currentDialog=null;
  document.removeEventListener("keydown",trapDialog);
  if(opener&&opener.isConnected)opener.focus();
  opener=null;
}
function trapDialog(ev){
  if(ev.key==="Escape"){closeDialog();return}
  if(ev.key!=="Tab"||!currentDialog)return;
  const nodes=[...currentDialog.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(x=>!x.disabled);
  if(!nodes.length)return;
  if(ev.shiftKey&&document.activeElement===nodes[0]){ev.preventDefault();nodes[nodes.length-1].focus()}
  if(!ev.shiftKey&&document.activeElement===nodes[nodes.length-1]){ev.preventDefault();nodes[0].focus()}
}
function showDemoInfo(message,source) {
  closeDialog();
  opener=source;
  const back=document.createElement("div");
  back.className="dialog-backdrop";
  back.innerHTML='<section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">'+
    '<div class="overline">Etapa de demonstração</div>'+
    '<h2 id="dialog-title">Funcionalidade prevista</h2>'+
    '<p id="dialog-text"></p>'+
    '<p>Esta tela faz parte do Design System. A funcionalidade completa será implementada no sprint correspondente.</p>'+
    '<div class="dialog-actions"><button class="button action" id="dialog-close" type="button">Entendi</button></div></section>';
  back.querySelector("#dialog-text").textContent=message;
  document.body.appendChild(back);
  currentDialog=back;
  document.addEventListener("keydown",trapDialog);
  back.querySelector("#dialog-close").focus();
  back.addEventListener("click",ev=>{if(ev.target===back||ev.target.closest("#dialog-close"))closeDialog()});
}
function setMenu(open){
  isMenuOpen=open;
  const side=document.getElementById("sidebar"),toggle=document.getElementById("menu-toggle");
  if(side)side.classList.toggle("is-open",open);
  if(toggle){toggle.setAttribute("aria-expanded",String(open));toggle.setAttribute("aria-label",open?"Fechar navegação":"Abrir navegação");}
  let shade=document.getElementById("sidebar-shade");
  if(open&&!shade){shade=document.createElement("button");shade.type="button";shade.className="sidebar-shade";shade.id="sidebar-shade";shade.setAttribute("aria-label","Fechar navegação");document.body.appendChild(shade);}
  if(!open&&shade)shade.remove();
  if(open)side?.querySelector(".nav-link")?.focus();
  else toggle?.focus();
}
function statusMessage(message,bad=false){
  const box=document.getElementById("draft-status");
  if(box){box.textContent=message;box.style.color=bad?"var(--danger)":"var(--good)";}
  showToast(message);
}
async function candidateFromEditor(cid,lid){
  const textarea=document.getElementById("lesson-json");
  if(!textarea)throw new Error("O editor JSON não está aberto.");
  let lesson;
  try{lesson=JSON.parse(textarea.value);}
  catch(err){throw new Error("JSON inválido: "+err.message);}
  const {course,module}=await getPublishedLesson(cid,lid);
  if(lesson.id!==lid)throw new Error("O ID da aula não pode ser alterado neste editor.");
  validateLessonLink(lesson,course,module.id);
  return {...lesson,status:"draft"};
}
async function onEditorAction(button){
  const command=button.dataset.action;
  if(command==="retry"){await render(false);return;}
  if(command==="import-json"){document.getElementById("draft-import-file")?.click();return;}
  const cid=button.dataset.course,lid=button.dataset.lesson;
  if(!cid||!lid)return;
  try{
    if(command==="delete-draft"){
      if(!window.confirm("Descartar o rascunho local desta aula? Alterações que não foram exportadas serão perdidas."))return;
      await deleteDraft(cid,lid);
      statusMessage("Rascunho removido deste navegador.");
      await render(false);
      return;
    }
    const lesson=await candidateFromEditor(cid,lid);
    if(command==="save-draft"){
      const record=await saveDraft(cid,lesson);
      const textarea=document.getElementById("lesson-json");
      if(textarea)textarea.value=JSON.stringify(record.lesson,null,2);
      statusMessage("Rascunho salvo neste navegador em "+new Date(record.savedAt).toLocaleString("pt-BR")+".");
    }else if(command==="export-json"){
      downloadJSON(lesson,lid+"-rascunho.json");
      statusMessage("JSON exportado. Este arquivo não foi publicado no GitHub.");
    }
  }catch(err){statusMessage(err.message||"Operação não concluída.",true);}
}


/* Gestão de cursos (Sprint 5): sempre salvar localmente; nunca publicar. */
async function editableCourse(cid){
  const found=await getCourseDraft(cid);
  if(found)return found.course;
  const available=await getLocalAvailableCourse(cid);
  if(available)return startCourseDraft(available.course);
  const published=await getPublishedCourse(cid);
  return startCourseDraft(published.course);
}
function authoringFormKey(form){
  return form.dataset.authoringForm+":"+(form.dataset.courseId||"")+":"+(form.dataset.moduleId||"");
}
function confirmUnsaved(otherThan=null){
  const changed=[...unsavedForms].filter(x=>x!==otherThan);
  return !changed.length||window.confirm("Existem alterações digitadas que ainda não foram salvas. Continuar irá descartá-las. Deseja prosseguir?");
}
document.addEventListener("input",ev=>{
  const form=ev.target.closest('form[data-authoring-form]');
  if(!form)return;
  unsavedForms.add(authoringFormKey(form));
  const region=document.getElementById("course-authoring-status");
  if(region){region.textContent="Você tem alterações não salvas nesta tela.";region.style.color="var(--action)";}
});
window.addEventListener("beforeunload",ev=>{
  if(!unsavedForms.size&&!isStudioDirty()&&!unsavedNote)return;
  ev.preventDefault();ev.returnValue="";
});
function authoringStatus(message,error=false){
  const region=document.getElementById("course-authoring-status");
  if(region){region.textContent=message;region.style.color=error?"var(--danger)":"var(--good)";}
  showToast(message);
}
async function onCourseForm(form){
  const kind=form.dataset.authoringForm;
  if(!confirmUnsaved(authoringFormKey(form)))return;
  const data=Object.fromEntries(new FormData(form));
  const cid=form.dataset.courseId;
  try{

    if(kind==="new-lesson"){
      if(!cid||!form.dataset.moduleId)throw Error("Escolha um módulo para a nova aula.");
      const base=await editableCourse(cid);
      const created=createLesson(base,form.dataset.moduleId,data.title);
      created.lesson=useLessonTemplate(created.lesson,data.templateId||"blank");
      await saveDraft(cid,created.lesson);
      try{await saveCourseDraft(created.course);}
      catch(err){await deleteDraft(cid,created.lesson.id);throw err;}
      unsavedForms.clear();
      showToast("Nova aula criada e salva somente neste navegador.");
      window.location.hash="#/professor/cursos/"+cid+"/aulas/"+created.lesson.id+"/editar";
      return;
    }
    if(kind==="new-course"){
      const course=createCourse(data.title,data.icon||"ψ");
      await saveCourseDraft(course);
      // O formulário de criação não está pendente depois do salvamento.
      unsavedForms.clear();
      showToast("Curso criado e salvo apenas neste navegador.");
      window.location.hash="#/professor/cursos/"+course.id;
      return;
    }
    if(!cid)throw new Error("Identificador do curso ausente.");
    const draft=await editableCourse(cid);
    const op=kind==="course-info"?"info":kind==="module-info"?"edit-module":
      kind==="add-module"?"add-module":null;
    if(!op)throw new Error("Formulário de autoria desconhecido.");
    const changed=applyCourseChange(draft,op,{...data,moduleId:form.dataset.moduleId});
    await saveCourseDraft(changed);
    await render(false);
    authoringStatus(op==="add-module"?"Módulo criado e salvo neste navegador.":
      "Alterações salvas neste navegador.");
    document.getElementById("course-authoring-status")?.focus({preventScroll:true});
  }catch(err){authoringStatus(err?.message||"Não foi possível salvar.",true);}
}
async function onCourseOperation(button){
  const op=button.dataset.courseOp,cid=button.dataset.courseId;
  if(!op||!cid)return;
  if(unsavedForms.size&&!confirmUnsaved())return;
  try{
    const local=await getCourseDraft(cid);
    if(op==="make-available"){
      if(unsavedForms.size)throw Error("Salve as alterações dos formulários antes de disponibilizar o curso.");
      const published=await makeCourseAvailableOnDevice(cid);
      await render(false);
      authoringStatus("Curso “"+published.title+"” disponível na área do aluno deste navegador ("+published.lessonCount+" aulas).");
      return;
    }
    if(op==="make-unavailable"){
      if(!window.confirm("Retirar este curso da área do aluno deste navegador? O rascunho e as anotações permanecem salvos."))return;
      await removeLocalAvailableCourse(cid);
      await render(false);
      authoringStatus("Curso retirado da área do aluno deste dispositivo. Seu rascunho continua salvo.");
      return;
    }
    if(op==="discard-course"){
      if(!local)throw new Error("Nenhum rascunho local para descartar.");
      const publishedLocally=await getLocalAvailableCourse(cid);
      if(publishedLocally)throw new Error("Retire primeiro o curso da área do aluno antes de excluir seu rascunho.");
      if(!window.confirm("Descartar este curso ou revisão local? Esta ação apaga as alterações que não foram exportadas."))return;
      await deleteCourseDraft(cid);
      let published=false;
      try{await getPublishedCourse(cid);published=true;}catch(err){if(err.code!=="not_found")throw err;}
      if(published){await render(false);authoringStatus("Revisão local descartada. O curso publicado continua intacto.");}
      else{window.location.hash="#/professor";showToast("Curso local excluído.");}
      return;
    }
    const draft=local?.course || await editableCourse(cid);
    if(op==="export-manifest"){
      downloadJSON(exportManifest(draft),draft.slug+"-curso-rascunho.json");
      authoringStatus("Manifesto JSON baixado. O curso continua sem publicação automática.");
      return;
    }
    if(op==="export-catalog"){
      if(!local)throw new Error("Salve o curso antes de gerar a entrada do catálogo.");
      downloadJSON(createCatalogEntry(draft),draft.slug+"-entrada-catalogo.json");
      authoringStatus("Entrada do catálogo baixada como rascunho, para revisão antes do commit.");
      return;
    }
    if(op==="remove-module"&&!window.confirm("Excluir este módulo vazio do rascunho local?"))return;
    const changed=applyCourseChange(draft,op,{
      moduleId:button.dataset.moduleId,lessonId:button.dataset.lessonId,
      direction:Number(button.dataset.direction)
    });
    await saveCourseDraft(changed);
    await render(false);
    authoringStatus("Organização do curso atualizada e salva neste navegador.");
    document.getElementById("course-authoring-status")?.focus({preventScroll:true});
  }catch(err){authoringStatus(err?.message||"Operação de curso não concluída.",true);}
}
/* Atividades, anotações e backup funcionam sem servidor. */
function currentLessonRoute(){
 const match=route().match(/^\/cursos\/([\w-]+)\/aulas\/([\w-]+)$/);
 return match?{courseId:match[1],lessonId:match[2]}:null;
}
document.addEventListener("input",ev=>{
 if(ev.target.closest('form[data-learning-form="note"]'))unsavedNote=true;
});
function learningNotice(text,error=false){
 const node=document.querySelector("[data-learning-status]");
 if(node){node.textContent=text;node.style.color=error?"var(--danger)":"var(--good)";}
 showToast(text);
}
async function doBackupCommand(command){
 try{
  if(command==="download-backup"){
   const counts=await downloadLocalBackup();
   showToast("Backup JSON baixado: "+counts.courses+" cursos, "+counts.lessons+" aulas e "+counts.progress+" históricos.");
  }else if(command==="import-backup"){
   document.getElementById("atelier-backup-import")?.click();
  }
 }catch(err){showToast("Backup: "+(err?.message||"Operação não concluída."));}
}
async function saveLearningNote(form){
 const current=currentLessonRoute();
 if(!current)return;
 const text=form.querySelector('[name="note"]')?.value??"";
 try{
  await updateLearningState(current.courseId,current.lessonId,{note:text});
  unsavedNote=false;learningNotice("Anotação salva neste dispositivo.");
 }catch(err){learningNotice("Não foi possível salvar: "+err.message,true);}
}
async function toggleLearningComplete(button){
 if(unsavedNote){
   learningNotice("Salve a anotação antes de alterar a conclusão da aula.",true);
   document.getElementById("lesson-note")?.focus();
   return;
 }
 const data=button.closest("[data-course-id][data-lesson-id]");
 if(!data)return;
 const {getLearningState}=await import("../repositories/learning-repository.js");
 try{
  const prev=await getLearningState(data.dataset.courseId,data.dataset.lessonId);
  await updateLearningState(data.dataset.courseId,data.dataset.lessonId,{completed:!prev.completed});
  unsavedNote=false;
  await render(false);
  showToast(prev.completed?"Conclusão desmarcada neste dispositivo.":"Aula marcada como concluída neste dispositivo.");
 }catch(err){learningNotice(err.message,true);}
}
async function saveQuizAnswer(form,result){
 if(!result.answered)return;
 const target=currentLessonRoute();
 const section=form.closest(".lesson-block");
 if(!target||!section)return; // Prévia e editor não registram notas.
 try{await updateLearningState(target.courseId,target.lessonId,
  {answer:{blockId:section.dataset.blockId,selection:result.selection,correct:result.correct}});}
 catch(err){showToast("Feedback exibido, mas a resposta não foi salva: "+err.message);}
}
document.addEventListener("submit",ev=>{
  const beta=ev.target.closest('form[data-beta-feedback]');
  if(beta){
    ev.preventDefault();
    try{
      downloadJSON(betaReport(Object.fromEntries(new FormData(beta))),
        "atelier-feedback-beta-"+new Date().toISOString().slice(0,10)+".json");
      showToast("Relatório de teste baixado. Nenhum dado foi enviado automaticamente.");
    }catch(err){showToast("Falha ao gerar o relatório: "+err.message);}
    return;
  }
  const quiz=ev.target.closest('form[data-activity="quiz"]');
  if(quiz){ev.preventDefault();saveQuizAnswer(quiz,checkQuiz(quiz));return;}
  const note=ev.target.closest('form[data-learning-form="note"]');
  if(note){ev.preventDefault();saveLearningNote(note);return;}
  const form=ev.target.closest('form[data-authoring-form]');
  if(!form)return;
  ev.preventDefault();
  if(form.dataset.busy==="true")return;
  form.dataset.busy="true";
  onCourseForm(form).finally(()=>{if(form.isConnected)delete form.dataset.busy;});
});
document.addEventListener("click",ev=>{
  const lab=ev.target.closest('[data-branch]');
  if(lab){exploreLab(lab);return;}
  const mark=ev.target.closest('[data-learning-action="complete"]');
  if(mark){toggleLearningComplete(mark);return;}
  const backupButton=ev.target.closest('[data-backup]');
  if(backupButton){doBackupCommand(backupButton.dataset.backup);return;}
  const tab=ev.target.closest('[role="tab"][aria-controls]');
  if(tab){
    const group=tab.closest('[role="tablist"]');
    if(group){
      group.querySelectorAll('[role="tab"]').forEach(b=>{
        const active=b===tab;
        b.setAttribute("aria-selected",String(active));
        b.tabIndex=active?0:-1;
        const panel=document.getElementById(b.getAttribute("aria-controls"));
        if(panel)panel.hidden=!active;
      });
    }
    return;
  }
  const menu=ev.target.closest("#menu-toggle");
  if(menu){setMenu(!isMenuOpen);return}
  if(ev.target.closest("#sidebar-shade")){setMenu(false);return}
  const jump=ev.target.closest("[data-scroll-block]");
  if(jump){
    const id=jump.dataset.scrollBlock;
    const section=document.getElementById(id);
    if(section){
      section.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"start"});
      section.focus({preventScroll:true});
    }
    return;
  }
  const courseOperation=ev.target.closest("[data-course-op]");
  if(courseOperation){onCourseOperation(courseOperation);return}
  const editorAction=ev.target.closest("[data-action]");
  if(editorAction){onEditorAction(editorAction);return}
  const info=ev.target.closest("[data-info]");
  if(info){showDemoInfo(info.dataset.info,info);return}
  const dest=ev.target.closest('a[href^="#/"]');
  if(dest&&unsavedForms.size&&!confirmUnsaved()){ev.preventDefault();return;}
  if(dest&&isStudioDirty()&&!confirmStudioLeave()){ev.preventDefault();return;}
  if(dest&&unsavedNote&&!window.confirm("Sua anotação não foi salva. Descartar a alteração?")){ev.preventDefault();return;}
  if(dest&&(unsavedForms.size||isStudioDirty()||unsavedNote))approvedNavigationHash=dest.getAttribute("href");
  const link=ev.target.closest('a[href^="#/"]');
  if(link&&isMenuOpen){
    setMenu(false);
    if(window.location.hash===link.getAttribute("href"))render(false);
  }
});
document.addEventListener("change",async ev=>{
  if(ev.target.matches("[data-beta-check]")){
    try{setBetaCheck(ev.target.dataset.betaCheck,ev.target.checked);}
    catch(err){showToast(err.message);}
    return;
  }

  if(ev.target.id==="demo-profile"){
    if(unsavedNote&&!window.confirm("Anotação não salva. Trocar de perfil e descartá-la?"))return;
    try{setDemoProfile(ev.target.value);await render(false);}
    catch(err){showToast(err.message);}
    return;
  }
  if(ev.target.id==="atelier-backup-import"){
    const file=ev.target.files?.[0];if(!file)return;
    try{
      if(file.size>15_000_000)throw Error("O backup excede 15 MB.");
      const data=JSON.parse(await file.text());
      if(!window.confirm("Restaurar este backup? Registros com os mesmos IDs serão substituídos neste navegador."))return;
      const count=await importLocalBackup(data);
      await render(false);
      showToast("Backup restaurado: "+count.courses+" cursos, "+count.lessons+" aulas e "+count.states+" históricos.");
    }catch(err){showToast("Não foi possível restaurar: "+err.message);}
    finally{ev.target.value="";}
    return;
  }
  if(ev.target.id==="switch-role"){
    if(unsavedForms.size&&!confirmUnsaved()){ev.target.value=route().startsWith("/professor")?"#/professor":route().startsWith("/admin")?"#/admin":"#/aluno";return;}
    if(isStudioDirty()&&!confirmStudioLeave()){ev.target.value="#/professor";return;}
    if(unsavedNote&&!window.confirm("Anotação não salva. Deseja mudar de ambiente?"))return;
    if(unsavedForms.size||isStudioDirty()||unsavedNote)approvedNavigationHash=ev.target.value;
    window.location.hash=ev.target.value;return;
  }
  if(ev.target.id!=="draft-import-file")return;
  const file=ev.target.files?.[0];
  if(!file)return;
  const path=route(),match=path.match(/^\/professor\/cursos\/([\w-]+)\/aulas\/([\w-]+)\/json$/);
  if(!match)return;
  try{
    if(file.size>2_000_000)throw new Error("Arquivo muito grande para uma aula (limite: 2 MB).");
    const content=await file.text();
    const parsed=JSON.parse(content);
    const {course,module}=await getPublishedLesson(match[1],match[2]);
    if(parsed.id!==match[2])throw new Error("O arquivo pertence a outra aula.");
    validateLessonLink(parsed,course,module.id);
    const textarea=document.getElementById("lesson-json");
    if(textarea)textarea.value=JSON.stringify({...parsed,status:"draft"},null,2);
    statusMessage("Arquivo validado e carregado no editor. Clique em Salvar para guardá-lo neste navegador.");
  }catch(err){statusMessage("Falha ao importar: "+err.message,true);}
  ev.target.value="";
});
document.addEventListener("keydown",ev=>{
  if(ev.key==="Escape" && isMenuOpen && !currentDialog){
    setMenu(false);return;
  }
  const tab=ev.target.closest('[role="tab"][aria-controls]');
  if(!tab||!["ArrowLeft","ArrowRight","Home","End"].includes(ev.key))return;
  const group=tab.closest('[role="tablist"]');if(!group)return;
  const tabs=[...group.querySelectorAll('[role="tab"]')];const i=tabs.indexOf(tab);
  const j=ev.key==="Home"?0:ev.key==="End"?tabs.length-1:
    (i+(ev.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;
  ev.preventDefault();tabs[j].focus();tabs[j].click();
});
window.addEventListener("hashchange",event=>{
  // Também protege o botão Voltar/Avançar, que não dispara o clique dos links.
  // A mudança de hash já ocorreu; se for cancelada, restaure sem novo hashchange.
  const previousHash=new URL(event.oldURL).hash||"#/aluno";
  const leaving=previousHash!==(window.location.hash||"#/aluno");
  const alreadyApproved=approvedNavigationHash===window.location.hash;
  approvedNavigationHash=null;
  if(leaving && !alreadyApproved && (unsavedForms.size||isStudioDirty()||unsavedNote)){
    let permitted=true;
    if(unsavedForms.size&&!confirmUnsaved())permitted=false;
    if(permitted&&isStudioDirty()&&!confirmStudioLeave())permitted=false;
    if(permitted&&unsavedNote&&!window.confirm("Anotação não salva. Deseja descartá-la e continuar?"))permitted=false;
    if(!permitted){
      window.history.replaceState(null,"",previousHash);
      return;
    }
  }
  if(isMenuOpen)setMenu(false);
  closeDialog();
  render(true);
});
render(false);
showToast("Atelier beta: aulas, atividades e histórico locais. Sem login real.");
