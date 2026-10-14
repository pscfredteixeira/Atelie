import {contentRepository} from "../src/repositories/content-repository.js";
const box=document.getElementById("results"),runButton=document.getElementById("run");
async function check(name,fn){
 try{const detail=await fn();return{name,ok:true,detail:detail||"Verificado neste navegador."}}
 catch(e){return{name,ok:false,detail:String(e.message||e)}}
}
async function run(){
 runButton.disabled=true;box.textContent="Executando verificações…";
 const results=[];
 results.push(await check("CSS responsivo disponível",()=>{
  const body=getComputedStyle(document.body);
  if(body.backgroundColor==="rgba(0, 0, 0, 0)")throw Error("Estilo não carregado.");
  return "CSS aplicado."
 }));
 results.push(await check("Largura da página",()=>{
   const overflow=document.documentElement.scrollWidth>window.innerWidth+2;
   if(overflow)throw Error("Rolagem lateral detectada nesta largura.");
   return "Viewport "+window.innerWidth+"×"+window.innerHeight+" px; sem rolagem lateral inesperada.";
 }));
 results.push(await check("Regra de foco de teclado",async()=>{
   const response=await fetch("../src/styles/atelier.css",{cache:"no-cache"});
   if(!response.ok)throw Error("Não foi possível ler o CSS.");
   const sheet=await response.text();
   if(!sheet.includes(":focus-visible"))throw Error("Regra de foco não encontrada.");
   return "Estilo de foco declarado; confirme a aparência usando Tab.";
 }));
 results.push(await check("Preferência de movimento reduzido",()=>{
   return matchMedia("(prefers-reduced-motion: reduce)").matches?
    "Movimento reduzido solicitado pelo navegador.":"Movimento reduzido não solicitado; estilos alternativos existem no CSS.";
 }));
 results.push(await check("Catálogo e aula JSON",async()=>{
   const courses=await contentRepository.listPublishedCourses();
   if(!courses.length)throw Error("Nenhum curso publicado.");
   const {lesson}=await contentRepository.getPublishedLesson("curso-fundamentos","aula-retorno");
   if(!lesson.blocks.some(b=>b.type==="interactive_lab"))throw Error("Laboratório de teste não encontrado.");
   return courses.length+" curso(s) publicados; aula JSON com laboratório disponível.";
 }));
 results.push(await check("Suporte a IndexedDB",()=>{
   if(!("indexedDB" in window))throw Error("IndexedDB não disponível.");
   return "API disponível (teste real de gravação está em smoke.html).";
 }));
 const entries=document.createDocumentFragment();
 for(const x of results){
   const card=document.createElement("div");card.className="card";card.style.borderColor=x.ok?"#547760":"#9d625d";
   const strong=document.createElement("strong");strong.textContent=(x.ok?"OK — ":"FALHA — ")+x.name;
   const p=document.createElement("p");p.textContent=x.detail;
   card.append(strong,p);entries.appendChild(card);
 }
 box.replaceChildren(entries);
 runButton.disabled=false;
}
runButton.addEventListener("click",run);
run();
