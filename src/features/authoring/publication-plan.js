/* Sprint JSON 5 — planejamento puro de publicação para o laboratório.
 * Não escreve em GitHub nem publica conteúdo. Apenas constrói um pacote
 * revisável a partir de um rascunho validado e do manifesto atual.
 */
import {validateCourse,validateLesson,validateLessonLink} from "../../repositories/validators.js";
import {BLOCK_TYPES} from "./lesson-editor.js";

const clone=x=>JSON.parse(JSON.stringify(x));
const ID=/^[A-Za-z0-9_-]+$/;
const SLUG=/^[A-Za-z0-9_-]+$/;
const MANIFEST=/^content\/piloto-json-sprint-02\/(?:[A-Za-z0-9_-]+\/)?curso\.json$/;
const PATH=/^\.\/aulas\/[A-Za-z0-9_-]+\.json$/;
const known=new Set(BLOCK_TYPES.map(([type])=>type));
const stringify=x=>JSON.stringify(x,null,2)+"\n";
function fail(message){throw new Error("Preparação da publicação: "+message)}
function pathFor(manifestPath,lessonRelativePath){
 const path=manifestPath.slice(0,manifestPath.lastIndexOf("/")+1)+lessonRelativePath.slice(2);
 if(!path.startsWith("content/piloto-json-sprint-02/")||path.includes("..")||!/^content\/piloto-json-sprint-02\/(?:[A-Za-z0-9_-]+\/)?aulas\/[A-Za-z0-9_-]+\.json$/.test(path))
  fail("Caminho gerado não permitido: "+path);
 return path;
}
export function planJSONPublication({draft,course,publishedLesson=null,manifestPath}){
 validateLesson(draft);
 validateCourse(course);
 if(draft.status!=="draft")fail("a aula precisa estar em rascunho antes da revisão.");
 if(course.status!=="published")fail("o manifesto de origem precisa estar publicado.");
 if(!MANIFEST.test(manifestPath||""))fail("este fluxo aceita somente manifests do catálogo técnico de laboratório.");
 if(draft.courseId!==course.id)fail("courseId não coincide com o manifesto.");
 if(!ID.test(draft.id)||!ID.test(draft.moduleId)||!SLUG.test(draft.slug)||draft.slug.length>90)
  fail("identificador, módulo ou slug inválido para um arquivo seguro.");
 if(!draft.blocks.length)fail("a aula precisa conter pelo menos um componente.");
 if(draft.metadata?.interactivePage)
  fail("aulas HTML especiais não podem ser publicadas pelo pacote de blocos JSON.");
 for(const block of draft.blocks){
  if(block.version!==1||!known.has(block.type))
   fail("componente sem suporte para publicação: "+block.type+" v"+block.version+".");
  if(block.type==="interactive_lab"&&block.data.engineId!=="choice-reflection-v1")
   fail("o laboratório utiliza um motor ainda não disponível: "+block.data.engineId+".");
  if(["image","audio","video"].includes(block.type)){
   for(const value of [block.data.src,...(block.type==="video"&&block.data.captions?[block.data.captions]:[])]){
    if(typeof value!=="string"||!/^\.\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+$/.test(value)||value.includes(".."))
     fail("mídia ou legenda com caminho relativo inadequado no bloco "+block.id+".");
   }
  }
 }
 const original=clone(course);
 const next=clone(course);
 const module=next.modules.find(m=>m.id===draft.moduleId);
 if(!module)fail("módulo da aula não consta do manifesto.");
 const duplicate=next.modules.flatMap(m=>m.lessons).filter(l=>l.id===draft.id);
 if(duplicate.length>1)fail("ID de aula duplicado no manifesto.");
 const existing=duplicate[0]||null;
 if(existing && !module.lessons.some(l=>l.id===draft.id))
  fail("a aula já existe em outro módulo.");
 const updating=!!existing;
 if(updating!==!!publishedLesson)
  fail(updating?"envie a versão publicada atual para conferir a revisão.":"uma aula nova não deve fornecer versão publicada anterior.");
 if(updating){
  validateLesson(publishedLesson);
  if(publishedLesson.status!=="published"||publishedLesson.id!==draft.id||
     publishedLesson.courseId!==draft.courseId||publishedLesson.moduleId!==draft.moduleId)
    fail("a versão publicada não corresponde ao rascunho.");
  if(draft.revision!==publishedLesson.revision+1)
    fail("revisão do rascunho não corresponde à versão publicada; recarregue e compare as alterações.");
  if(!PATH.test(existing.path))fail("caminho original não é elegível para este laboratório.");
 }else if(draft.revision!==1)fail("uma aula nova deve começar na revisão 1.");

 const lessonPath=updating?existing.path:"./aulas/"+draft.slug+".json";
 if(!PATH.test(lessonPath))fail("o caminho de destino não é seguro.");
 if(next.modules.some(m=>m.lessons.some(l=>l.id!==draft.id&&l.path===lessonPath)))
  fail("já existe outra aula usando o nome de arquivo "+lessonPath+". Escolha outro slug.");
 const target=pathFor(manifestPath,lessonPath);
 const lesson=clone(draft);
 lesson.status="published";
 if(updating){
  const item=module.lessons.find(l=>l.id===draft.id);
  item.title=lesson.title;
  item.summary=lesson.summary||"";
  item.estimatedMinutes=lesson.estimatedMinutes||15;
  item.status="published";
 }else{
  const position=module.lessons.reduce((max,l)=>Math.max(max,l.position),0)+1;
  module.lessons.push({
   id:lesson.id,title:lesson.title,summary:lesson.summary||"",
   path:lessonPath,position,status:"published",
   estimatedMinutes:lesson.estimatedMinutes||15
  });
 }
 next.revision=course.revision+1;
 validateCourse(next);
 validateLessonLink(lesson,next,draft.moduleId);
 const media=lesson.blocks.filter(b=>["image","audio","video"].includes(b.type))
    .map(b=>({id:b.id,type:b.type,src:b.data.src}));
 const warnings=[];
 if(media.length)warnings.push("Há "+media.length+" bloco(s) de mídia. Os arquivos binários NÃO estão incluídos no pacote: verifique caminhos, direitos e acessibilidade.");
 if(lesson.references.length===0)warnings.push("A aula não declara bibliografia: confirme se é adequado ao conteúdo.");
 if(!lesson.summary?.trim())warnings.push("O resumo está vazio. Revise a apresentação da aula.");
 if(lesson.blocks.some(b=>b.type==="clinical_vignette"))warnings.push("Vinhetas exigem revisão ética: confirmar que os casos são inteiramente fictícios.");
 const requiredReview=[
  {id:"academico",label:"Revisei a precisão teórica, a bibliografia e os objetivos pedagógicos."},
  {id:"privacidade",label:"Confirmei que não há dados identificáveis de pacientes, informações privadas ou credenciais."},
  {id:"acessibilidade",label:"Verifiquei textos alternativos, legendas, transcrições e experiência acessível."},
  {id:"teste",label:"Conferi o comportamento dos exercícios e a versão para celular."}
 ];
 const instructions=[
  "# Pacote de revisão — Ateliê / laboratório JSON",
  "",
  "Este ZIP NÃO publica uma aula e não dá acesso de escrita ao GitHub.",
  "Contém somente JSONs candidatos, relatório e instruções para revisão humana.",
  "",
  "## Arquivos a revisar",
  "- "+target+" — aula candidata (status published)",
  "- "+manifestPath+" — manifesto candidato atualizado (revision "+next.revision+")",
  "",
  "## Aplicação segura",
  "1. Confirme que os arquivos de origem ainda correspondem ao repositório.",
  "2. Revise diffs e conteúdo acadêmico; confira direitos e acessibilidade de mídias.",
  "3. Crie uma branch de revisão; não substitua a branch main diretamente.",
  "4. Adicione os dois arquivos do pacote nos caminhos indicados, sem modificar o catálogo principal.",
  "5. Execute os testes do projeto, abra a aula em navegador real e confira regressão.",
  "6. Abra uma pull request para aprovação humana. A integração é uma etapa posterior.",
  "",
  "Observação: o catálogo JSON deste ZIP é o laboratório técnico, não o catálogo público da Formação Freudiana."
 ].join("\n")+"\n";
 const report={
  kind:"atelier-json-publication-review",version:1,scope:"technical-lab-only",
  mode:updating?"update":"create",
  courseId:course.id,lessonId:lesson.id,manifestPath,lessonPath:target,
  baseCourseRevision:original.revision,nextCourseRevision:next.revision,
  baseLessonRevision:updating?publishedLesson.revision:null,nextLessonRevision:lesson.revision,
  requiredReview,warnings,
  automatedChecks:["schemaVersion e status","vínculos de IDs e módulo","componentes v1 conhecidos","conflitos de caminhos","revisão do manifesto","rastreio de revisões"],
  publicationPerformed:false
 };
 const files=[
  {path:target,content:stringify(lesson)},
  {path:manifestPath,content:stringify(next)},
  {path:"RELATORIO_REVISAO.json",content:stringify(report)},
  {path:"INSTRUCOES_PUBLICACAO.md",content:instructions}
 ];
 if(new Set(files.map(f=>f.path)).size!==files.length)fail("arquivos de saída duplicados.");
 return {mode:report.mode,lesson,manifest:next,files,report};
}
