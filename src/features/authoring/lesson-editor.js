/* Sprint 6 — operações puras de autoria de aulas por blocos. */
import {validateLesson,validateCourse,validateLessonLink} from "../../repositories/validators.js";
const clone=value=>JSON.parse(JSON.stringify(value));
const trim=x=>String(x??"").trim();
function stableId(prefix){
 const suffix=globalThis.crypto?.randomUUID?.()||
   (Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,10));
 return prefix+"-"+suffix;
}
function slugify(value){
 return trim(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"")
   .toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,65)||"aula";
}
function nonempty(value,label,max=260){
 const text=trim(value);
 if(!text)throw Error(label+" não pode ficar vazio.");
 if(text.length>max)throw Error(label+" não pode exceder "+max+" caracteres.");
 return text;
}
export const BLOCK_TYPES=Object.freeze([
 ["question","Pergunta disparadora"],
 ["rich_text","Texto explicativo"],
 ["heading","Título de seção"],
 ["concept","Conceito revelável"],
 ["clinical_vignette","Caso fictício"],
 ["multiple_choice","Questão de revisão"],
 ["quote","Citação comentada"],
 ["comparison","Comparação"],
 ["timeline","Linha do tempo"],
 ["references","Bibliografia"],
 ["image","Imagem"],
 ["audio","Áudio"],
 ["video","Vídeo"],
 ["interactive_lab","Laboratório futuro"]
]);
export function blockTemplate(type){
 const defaults={
  question:{prompt:"Que pergunta queremos investigar?",hint:"Pense nas diferentes possibilidades antes de concluir."},
  rich_text:{title:"Uma ideia para desenvolver",paragraphs:["Escreva aqui o conteúdo da aula."]},
  heading:{text:"Nova seção"},
  concept:{term:"Um conceito",definition:"Explique o conceito com cuidado e contexto.",example:""},
  clinical_vignette:{title:"Situação fictícia",narrative:"Descreva uma situação inteiramente inventada.",reflection:"Que perguntas essa situação permite formular?",disclaimer:"Exemplo fictício, sem valor diagnóstico."},
  multiple_choice:{prompt:"Qual alternativa expressa melhor a ideia estudada?",
    options:[{id:"opcao-a",text:"Primeira alternativa"},{id:"opcao-b",text:"Segunda alternativa"}],
    correctOptionId:"opcao-a",feedbackCorrect:"Isso mesmo. Releia a explicação para consolidar.",feedbackIncorrect:"Volte à explicação e tente novamente."},
  quote:{text:"Insira aqui uma citação curta ou uma síntese editorial.",attribution:"Atelier — síntese editorial",context:""},
  comparison:{title:"Comparando perspectivas",caption:"Quadro didático",columns:["Primeira perspectiva","Segunda perspectiva"],
    rows:[{criterion:"Primeiro critério",values:["Primeira explicação","Segunda explicação"]}]},
  timeline:{title:"Um percurso no tempo",events:[{date:"1900",title:"Um marco para estudar",description:"Explique o contexto histórico."}]},
  references:{referenceIds:[]},
  image:{src:"./media/imagem.jpg",alt:"Descrição objetiva da imagem",caption:"",credit:""},
  audio:{title:"Escuta guiada",src:"./media/audio.mp3",transcript:"Transcrição do áudio."},
  video:{title:"Vídeo de estudo",src:"./media/video.mp4",captions:"./media/legendas.vtt",transcript:"Transcrição do vídeo."},
  interactive_lab:{engineId:"choice-reflection-v1",title:"Laboratório de reflexão",description:"Escolha um caminho de investigação e compare possibilidades.",prompt:"Qual pergunta abriria melhor a investigação?",choices:[
   {id:"caminho-1",label:"Investigar o contexto",feedback:"Uma pergunta sobre o contexto ajuda a ampliar a investigação sem antecipar conclusões."},
   {id:"caminho-2",label:"Aplicar uma interpretação imediata",feedback:"Uma conclusão imediata pode fechar a escuta. O que ainda precisaria ser investigado?"}
 ],alternative:"Escreva duas perguntas possíveis e compare o que cada uma permite investigar."}
 };
 if(!Object.hasOwn(defaults,type))throw Error("Tipo de bloco não suportado.");
 return {id:stableId("bloco"),type,version:1,data:clone(defaults[type]),settings:{}};
}
export function createLesson(course,moduleId,title){
 validateCourse(course);
 const module=course.modules.find(m=>m.id===moduleId);
 if(!module)throw Error("Escolha um módulo existente antes de criar uma aula.");
 if(course.status!=="draft")throw Error("Só é possível adicionar aulas a um rascunho de curso.");
 const name=nonempty(title,"Título da aula",160), id=stableId("aula");
 const lesson={schemaVersion:1,kind:"lesson",id,courseId:course.id,moduleId,
  slug:slugify(name)+"-"+id.slice(-8),revision:1,status:"draft",
  title:name,summary:"",objectives:[],estimatedMinutes:15,
  blocks:[blockTemplate("rich_text")],references:[],metadata:{demo:true}};
 const next=clone(course),target=next.modules.find(m=>m.id===moduleId);
 target.lessons.push({id:lesson.id,path:"./aulas/"+lesson.slug+".json",
   position:target.lessons.length+1,title:lesson.title,summary:lesson.summary,estimatedMinutes:lesson.estimatedMinutes});
 validateCourse(next);validateLessonLink(lesson,next,moduleId);
 return {course:next,lesson};
}
export function startLessonDraft(published){
 validateLesson(published);
 return {...clone(published),status:"draft",revision:published.revision+1};
}
export function updateLesson(lesson,action,payload={}){
 const result=clone(lesson);
 if(result.status!=="draft")throw Error("Só é possível modificar rascunhos.");
 const blocks=result.blocks;
 let index;
 switch(action){
  case "details":
    result.title=nonempty(payload.title,"Título da aula",160);
    result.summary=trim(payload.summary).slice(0,1200);
    result.objectives=trim(payload.objectives).split("\n").map(trim).filter(Boolean);
    result.estimatedMinutes=Number(payload.estimatedMinutes);
    if(!Number.isInteger(result.estimatedMinutes)||result.estimatedMinutes<1||result.estimatedMinutes>600)
      throw Error("Duração deve ficar entre 1 e 600 minutos.");
    break;
  case "references": {
    if(!Array.isArray(payload.references))throw Error("Lista de referências inválida.");
    const ids=new Set();
    result.references=payload.references.map(r=>{
      const id=r.id||stableId("ref");
      if(ids.has(id))throw Error("Referências duplicadas.");
      ids.add(id);
      return {id,author:trim(r.author),title:nonempty(r.title,"Título da referência",300),
        ...(r.year?{year:Number(r.year)}:{}),note:trim(r.note)};
    });
    result.blocks.filter(b=>b.type==="references").forEach(b=>{
      b.data.referenceIds=b.data.referenceIds.filter(id=>ids.has(id));
    });
    break;
  }
  case "add-block": {
    const block=blockTemplate(payload.type);
    const after=blocks.findIndex(b=>b.id===payload.afterId);
    blocks.splice(after<0?blocks.length:after+1,0,block);
    break;
  }
  case "edit-block": {
    index=blocks.findIndex(b=>b.id===payload.blockId);
    if(index<0)throw Error("Bloco não encontrado.");
    if(!payload.data||typeof payload.data!=="object"||Array.isArray(payload.data))
      throw Error("Dados do bloco inválidos.");
    blocks[index].data=clone(payload.data);
    blocks[index].settings={
      ...blocks[index].settings,
      showInOutline:payload.showInOutline!==false,
      emphasis:payload.featured?"featured":"normal"
    };
    break;
  }
  case "move-block": {
    index=blocks.findIndex(b=>b.id===payload.blockId);
    const next=index+Number(payload.direction);
    if(index<0||next<0||next>=blocks.length)throw Error("Movimento fora da sequência.");
    [blocks[index],blocks[next]]=[blocks[next],blocks[index]];
    break;
  }
  case "duplicate-block": {
    index=blocks.findIndex(b=>b.id===payload.blockId);
    if(index<0)throw Error("Bloco não encontrado.");
    const item=clone(blocks[index]);
    item.id=stableId("bloco");
    blocks.splice(index+1,0,item);
    break;
  }
  case "remove-block": {
    index=blocks.findIndex(b=>b.id===payload.blockId);
    if(index<0)throw Error("Bloco não encontrado.");
    blocks.splice(index,1);
    break;
  }
  default:throw Error("Comando de bloco não reconhecido.");
 }
 validateLesson(result);
 return result;
}
export function syncLessonManifest(course,lesson){
 validateLesson(lesson);
 const next=clone(course);
 if(next.status!=="draft")throw Error("Manifesto precisa ser um rascunho.");
 const module=next.modules.find(m=>m.id===lesson.moduleId);
 const entry=module?.lessons.find(l=>l.id===lesson.id);
 if(!entry)throw Error("Aula não cadastrada na estrutura do curso.");
 entry.title=lesson.title;entry.summary=lesson.summary;
 entry.estimatedMinutes=lesson.estimatedMinutes;
 validateCourse(next);
 return next;
}
