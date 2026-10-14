import {routeView} from "./views.js";
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
 {name:"Organizar",links:[{href:"#/admin",name:"Administração",icon:"▦"}]}
];
let isMenuOpen = false;
let currentDialog = null;
let opener = null;
let toastTimer;
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
function render(moveFocus) {
  const path=route();
  const page=routeView(path);
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
document.addEventListener("click",ev=>{
  const menu=ev.target.closest("#menu-toggle");
  if(menu){isMenuOpen=!isMenuOpen;render(false);const target=document.getElementById(isMenuOpen?"sidebar-shade":"menu-toggle");if(target)target.focus();return}
  if(ev.target.closest("#sidebar-shade")){isMenuOpen=false;render(false);document.getElementById("menu-toggle")?.focus();return}
  const info=ev.target.closest("[data-info]");
  if(info){showDemoInfo(info.dataset.info,info);return}
  const link=ev.target.closest('a[href^="#/"]');
  if(link&&isMenuOpen){
    isMenuOpen=false;
    if(window.location.hash===link.getAttribute("href"))render(false);
  }
});
document.addEventListener("change",ev=>{
  if(ev.target.id==="switch-role"){window.location.hash=ev.target.value}
});
window.addEventListener("hashchange",()=>{isMenuOpen=false;closeDialog();render(true)});
render(false);
showToast("Ambiente demonstrativo: os dados apresentados são fictícios.");
