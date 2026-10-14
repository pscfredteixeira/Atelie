/* Sprint 13 — Beta com convidados: checklist de UX e relatório local.
   Não coleta dados automaticamente; o usuário escolhe baixar o feedback. */
export const BETA_TASKS=Object.freeze([
 {id:"aluno-catalogo",role:"Aluno",text:"Encontrar o curso de Fundamentos da Psicanálise e explicar os objetivos."},
 {id:"aluno-navegacao",role:"Aluno",text:"Abrir a primeira aula, usar anterior/próxima e navegar pelo índice."},
 {id:"aluno-atividades",role:"Aluno",text:"Responder ao quiz e explorar as escolhas de um laboratório de exemplo."},
 {id:"aluno-caderno",role:"Aluno",text:"Salvar uma anotação, marcar conclusão, recarregar e verificar o histórico."},
 {id:"professor-curso",role:"Professor",text:"Criar um curso local, dois módulos e alterar sua ordem."},
 {id:"professor-aula",role:"Professor",text:"Criar uma aula com modelo, editar blocos, duplicar e reorganizar."},
 {id:"professor-previa",role:"Professor",text:"Abrir a prévia como aluno e salvar o rascunho sem publicar."},
 {id:"backup",role:"Organização",text:"Exportar o backup JSON e identificar onde fazer a restauração."},
 {id:"acessibilidade",role:"Acessibilidade",text:"Percorrer menus, aula e Estúdio somente pelo teclado."}
]);
const KEY="atelier-beta-checks-v1";
export function getBetaChecks(){
 try{const data=JSON.parse(localStorage.getItem(KEY)||"{}");
  return typeof data==="object"&&data?data:{};
 }catch{return {}}
}
export function setBetaCheck(id,value){
 if(!BETA_TASKS.some(x=>x.id===id))throw Error("Tarefa de teste inválida.");
 const all=getBetaChecks();
 all[id]=!!value;
 try{localStorage.setItem(KEY,JSON.stringify(all));}
 catch{throw Error("O navegador não permitiu guardar o checklist.");}
 return all;
}
export function betaReport(details={}){
 const all=getBetaChecks();
 return {format:"atelier-beta-feedback",version:1,date:new Date().toISOString(),
  context:{device:String(details.device||"").slice(0,180),browser:String(details.browser||"").slice(0,180),
    role:String(details.role||"").slice(0,60)},
  checks:BETA_TASKS.map(x=>({id:x.id,role:x.role,task:x.text,done:all[x.id]===true})),
  difficulties:String(details.difficulties||"").slice(0,10000),
  suggestions:String(details.suggestions||"").slice(0,10000),
  warning:"Exportação voluntária: não envie dados pessoais, senhas nem casos clínicos reais."};
}
