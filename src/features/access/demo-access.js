/* Atelier — Entrada demonstrativa configurada em JSON (GitHub Pages).
 * IMPORTANTE: não é autenticação. Não oferece autorização, sigilo ou segurança.
 * Nenhuma senha, segredo ou dado pessoal deve ser incluído no arquivo JSON.
 */
import {escapeHTML as e} from "../../ui/components.js";

const STORAGE_KEY="atelier-demo-access-v1";
const PROFILE_PATH=new URL("../../../content/perfis-acesso.json",import.meta.url);
const HOME=Object.freeze({aluno:"/aluno",professor:"/professor",administrador:"/admin"});
const ALLOWED=Object.freeze(["aluno","professor","administrador"]);
let profilePromise=null,volatileRole=null;

export function getDemoRole(){
 try{
   const saved=localStorage.getItem(STORAGE_KEY);
   return ALLOWED.includes(saved)?saved:null;
 }catch{return ALLOWED.includes(volatileRole)?volatileRole:null}
}
export function setDemoRole(role){
 if(!ALLOWED.includes(role))throw Error("Perfil demonstrativo desconhecido.");
 volatileRole=role;
 try{localStorage.setItem(STORAGE_KEY,role)}catch{/* somente esta aba, caso o navegador bloqueie armazenamento */}
 return role;
}
export function clearDemoRole(){
 volatileRole=null;
 try{localStorage.removeItem(STORAGE_KEY)}catch{/* nenhum armazenamento persistente disponível */}
}
export function homeForRole(role){return HOME[role]||"/entrar"}
export function canVisit(role,path){
 if(!ALLOWED.includes(role))return false;
 if(!path||path==="/")return true;
 if(path==="/entrar")return true;
 if(role==="aluno")return /^\/(aluno|cursos)(\/|$)/.test(path);
 if(role==="professor")return /^\/professor(\/|$)/.test(path);
 return /^\/admin(\/|$)/.test(path);
}
export function roleForPath(path){
 if(/^\/(aluno|cursos)(\/|$)/.test(path))return "aluno";
 if(/^\/professor(\/|$)/.test(path))return "professor";
 if(/^\/admin(\/|$)/.test(path))return "administrador";
 return null;
}
export function labelForRole(role){
 return {aluno:"Aluno",professor:"Professor",administrador:"Administrador"}[role]||"Visitante";
}
export async function loadDemoProfiles(){
 if(!profilePromise){
  profilePromise=(async()=>{
   const response=await fetch(PROFILE_PATH.href,{cache:"no-cache"});
   if(!response.ok)throw Error("Não foi possível carregar os três perfis (HTTP "+response.status+").");
   const json=await response.json();
   if(json?.kind!=="demo_access"||json.schemaVersion!==1||!Array.isArray(json.profiles)||
      json.profiles.length!==3||new Set(json.profiles.map(p=>p?.id)).size!==3)
      throw Error("Configuração de entrada JSON inválida.");
   for(const p of json.profiles){
     if(!ALLOWED.includes(p.id)||p.home!==HOME[p.id]||
        !["title","description","label","symbol"].every(key=>typeof p[key]==="string"&&p[key].length>0&&p[key].length<400)||
        !Array.isArray(p.features)||p.features.length>6||
        !p.features.every(x=>typeof x==="string"&&x.length<120))
       throw Error("A configuração do perfil "+String(p.id)+" é inválida.");
   }
   return json.profiles;
  })().catch(error=>{profilePromise=null;throw error});
 }
 return profilePromise;
}
export function renderAccessScreen(profiles,{activeRole=null,requestedPath="/"}={}){
 const expected=roleForPath(requestedPath);
 const mismatch=activeRole&&expected&&expected!==activeRole;
 const intro=mismatch?
  '<p class="access-alert" role="status">Esta seção pertence ao perfil <strong>'+e(labelForRole(expected))+
  '</strong>. Escolha como deseja entrar para continuar.</p>':
  '<p class="access-description">Três caminhos, um mesmo espaço de formação. Selecione seu ambiente para começar.</p>';
 const cards=profiles.map((p,i)=>{
   const features=p.features.map(item=>'<li>'+e(item)+'</li>').join("");
   return '<button class="access-card access-card--'+e(p.id)+'" type="button" data-demo-enter="'+e(p.id)+'"'+
    (p.id===expected?' data-suggested="true"':'')+'>'+
    '<span class="access-card-top"><span class="access-symbol" aria-hidden="true">'+e(p.symbol)+'</span>'+
    '<span class="access-number">0'+(i+1)+'</span></span>'+
    '<span class="access-eyebrow">'+e(p.label)+'</span>'+
    '<strong class="access-card-title">'+e(p.title)+'</strong>'+
    '<span class="access-card-description">'+e(p.description)+'</span>'+
    '<span class="access-card-features">'+features+'</span>'+
    '<span class="access-card-footer">Entrar como '+e(p.title)+' <span aria-hidden="true">↗</span></span>'+
   '</button>';
 }).join("");
 return '<div class="access-page"><div class="access-wrap">'+
   '<header class="access-header"><span class="access-brand">Atelier<span>.</span></span>'+
   '<span class="access-header-tag">LABORATÓRIO DE PSICANÁLISE · DEMONSTRAÇÃO</span></header>'+
   '<section class="access-hero" aria-labelledby="access-title">'+
     '<span class="access-kicker">BEM-VINDO AO ATELIER</span>'+
     '<div class="access-headline-row"><div><h1 id="access-title">Um lugar para <em>pensar, criar e aprender.</em></h1>'+
      intro+'</div><div class="access-ornament" aria-hidden="true">ψ</div></div>'+
   '</section>'+
   '<div class="access-grid" role="group" aria-label="Escolha seu ambiente">'+cards+'</div>'+
   (activeRole?'<div class="access-resume"><span>Perfil atual: '+e(labelForRole(activeRole))+'</span>'+
     '<a class="button" href="#'+e(homeForRole(activeRole))+'">Voltar ao ambiente atual →</a></div>':"")+
   '<footer class="access-footer"><span>ACESSO DEMONSTRATIVO</span>'+
     '<p>Sem senha ou autenticação real. Qualquer visitante pode escolher um perfil; os conteúdos públicos continuam acessíveis. '+
     'Seus rascunhos e progresso permanecem neste navegador.</p></footer>'+
  '</div></div>';
}
