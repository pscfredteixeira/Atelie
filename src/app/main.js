import {routeView} from "./views.js";
import {getPublishedLesson} from "../repositories/content-repository.js";
import {saveDraft,deleteDraft,downloadJSON} from "../repositories/draft-repository.js";
import {validateLessonLink} from "../repositories/validators.js";
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
 {name:"Organizar",links:[{href:"#/admin",name:"Administração",icon:"▦"},{href:"#/admin/identidade",name:"Biblioteca visual",icon:"◈"}]}
];
let isMenuOpen = false;
let currentDialog = null;
let opener = null;
let toastTimer;
let activeRender=0;
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
  '</nav><div class="sidebar-foot">Sprint 1 · Interface de demonstração.<br>Sem conta real, banco ou progresso salvo.<br>'+
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
    '<footer class="footer"><span>Atelier. · Sprint 1 · Protótipo</span><span>'+
    '<a href="./arquitetura.html">Mapa original</a> · <a href="./wireframes.html">Wireframes</a> · '+
    '<a href="https://github.com/pscfredteixeira/Atelie" target="_blank" rel="noopener noreferrer">Código no GitHub ↗</a></span></footer></main></div>'+
    '</div>'+bottomMenu(path)+(isMenuOpen?'<button class="sidebar-shade" id="sidebar-shade" type="button" aria-label="Fechar navegação"></button>':'');
  document.title = page.title + " · Atelier";
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

document.addEventListener("click",ev=>{
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
  const editorAction=ev.target.closest("[data-action]");
  if(editorAction){onEditorAction(editorAction);return}
  const info=ev.target.closest("[data-info]");
  if(info){showDemoInfo(info.dataset.info,info);return}
  const link=ev.target.closest('a[href^="#/"]');
  if(link&&isMenuOpen){
    setMenu(false);
    if(window.location.hash===link.getAttribute("href"))render(false);
  }
});
document.addEventListener("change",async ev=>{
  if(ev.target.id==="switch-role"){window.location.hash=ev.target.value;return;}
  if(ev.target.id!=="draft-import-file")return;
  const file=ev.target.files?.[0];
  if(!file)return;
  const path=route(),match=path.match(/^\\/professor\\/cursos\\/([\\w-]+)\\/aulas\\/([\\w-]+)\\/editar$/);
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
window.addEventListener("hashchange",()=>{isMenuOpen=false;closeDialog();render(true)});
render(false);
showToast("Sprint 2: cursos publicados em JSON e rascunhos salvos somente neste navegador.");
