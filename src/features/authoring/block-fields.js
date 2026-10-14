/* Campos acessíveis de todos os componentes v1, sem exigir edição de JSON. */
import {escapeHTML as e} from "../../ui/components.js";
const def=(name,label,kind="text",help="")=>({name,label,kind,help});
export const FIELD_DEFINITIONS={
 question:[def("prompt","Pergunta principal","textarea"),def("hint","Dica (opcional)","textarea")],
 rich_text:[def("title","Título da explicação"),def("paragraphs","Parágrafos — separe com uma linha em branco","textarea")],
 heading:[def("text","Título da seção")],
 concept:[def("term","Nome do conceito"),def("definition","Explicação do conceito","textarea"),def("example","Exemplo didático","textarea")],
 clinical_vignette:[def("title","Título da situação"),def("narrative","Cena inteiramente fictícia","textarea"),def("reflection","Pergunta para reflexão","textarea"),def("disclaimer","Ressalva ética","textarea")],
 multiple_choice:[def("prompt","Enunciado","textarea"),
  def("options","Alternativas — uma por linha","textarea"),
  def("correctIndex","Alternativa correta (número começando em 1)","number"),
  def("feedbackCorrect","Feedback para resposta correta","textarea"),
  def("feedbackIncorrect","Feedback para resposta incorreta","textarea")],
 quote:[def("text","Trecho ou síntese editorial","textarea"),def("attribution","Fonte/autoria"),def("context","Contexto (opcional)")],
 comparison:[def("title","Título da comparação"),def("caption","Legenda"),
  def("columnA","Nome da primeira coluna"),def("columnB","Nome da segunda coluna"),
  def("rows","Linhas: critério | primeira explicação | segunda explicação","textarea",
   "Separe cada linha em três partes usando |.")],
 timeline:[def("title","Título"),def("events","Eventos: data | título | explicação","textarea",
  "Um evento por linha; use | para separar as partes.")],
 references:[def("referenceIds","Referências da aula (selecione abaixo)","references")],
 image:[def("src","Caminho da imagem (./media/arquivo.jpg)"),def("alt","Descrição alternativa da imagem"),
  def("caption","Legenda"),def("credit","Créditos"),def("decorative","Imagem decorativa","checkbox")],
 audio:[def("title","Título do áudio"),def("src","Arquivo relativo (./media/audio.mp3)"),
  def("transcript","Transcrição do áudio","textarea")],
 video:[def("title","Título do vídeo"),def("src","Arquivo relativo (./media/video.mp4)"),
  def("captions","Legenda em VTT (./media/legenda.vtt)"),def("transcript","Transcrição","textarea")],
 interactive_lab:[def("title","Nome do laboratório"),def("engineId","Identificador técnico do motor"),
  def("description","Apresentação","textarea"),def("alternative","Alternativa de estudo enquanto o laboratório não está ativo","textarea")]
};
const text=x=>String(x??"");
function valueFor(block,name){
 const d=block.data;
 switch(name){
  case "paragraphs":return (d.paragraphs||[]).join("\n\n");
  case "options":return (d.options||[]).map(o=>o.text).join("\n");
  case "correctIndex":return (d.options||[]).findIndex(o=>o.id===d.correctOptionId)+1;
  case "columnA":return d.columns?.[0]||"";
  case "columnB":return d.columns?.[1]||"";
  case "rows":return (d.rows||[]).map(r=>[r.criterion,...r.values].join(" | ")).join("\n");
  case "events":return (d.events||[]).map(ev=>[ev.date,ev.title,ev.description||""].join(" | ")).join("\n");
  default:return d[name]??"";
 }
}
export function renderBlockFields(block,lesson){
 const defs=FIELD_DEFINITIONS[block.type];
 if(!defs)return '<p class="notice">Esta versão do bloco ainda não tem formulário visual. O conteúdo original será preservado.</p>';
 return defs.map((f,i)=>{
  const id="studio-field-"+i, val=valueFor(block,f.name);
  const help=f.help?'<small class="studio-help">'+e(f.help)+'</small>':"";
  if(f.kind==="references"){
    return '<fieldset class="studio-reference-field"><legend>'+e(f.label)+'</legend>'+
    (lesson.references.length?lesson.references.map(r=>'<label class="studio-check"><input type="checkbox" name="referenceIds" value="'+e(r.id)+'"'+
      ((block.data.referenceIds||[]).includes(r.id)?" checked":"")+'><span>'+e((r.author?r.author+" — ":"")+r.title)+'</span></label>').join(""):
    '<p class="muted">Adicione primeiro uma referência na seção “Bibliografia da aula”.</p>')+'</fieldset>';
  }
  const label='<label class="field-label" for="'+id+'">'+e(f.label)+'</label>';
  if(f.kind==="checkbox")return '<label class="studio-check"><input type="checkbox" id="'+id+'" name="'+e(f.name)+'"'+(val?" checked":"")+
    '><span>'+e(f.label)+'</span></label>';
  if(f.kind==="textarea")return '<div class="studio-field">'+label+
    '<textarea class="field" id="'+id+'" name="'+e(f.name)+'" rows="'+(f.name==="paragraphs"?8:4)+'">'+e(val)+'</textarea>'+help+'</div>';
  return '<div class="studio-field">'+label+'<input class="field" id="'+id+'" name="'+e(f.name)+'" type="'+
    (f.kind==="number"?"number":"text")+'"'+(f.kind==="number"?' min="1" step="1"':'')+
    ' value="'+e(val)+'">'+help+'</div>';
 }).join("");
}
function splitLines(text){return text.replace(/\r/g,"").split("\n").map(x=>x.trim()).filter(Boolean);}
function columns(lines,length,label){
 return lines.map((line,i)=>{
   const cells=line.split(" | ").map(x=>x.trim());
   if(cells.length!==length||cells.some(x=>!x))throw Error(label+": linha "+(i+1)+" deve conter "+length+" partes separadas por |.");
   return cells;
 });
}
export function readBlockFields(block,form){
 const inputs=new FormData(form),d={...block.data};
 for(const f of FIELD_DEFINITIONS[block.type]||[]){
  const name=f.name;
  if(name==="referenceIds"){d.referenceIds=inputs.getAll("referenceIds").map(String);continue}
  if(f.kind==="checkbox"){d[name]=inputs.has(name);continue}
  const val=text(inputs.get(name));
  if(name==="paragraphs"){d.paragraphs=val.replace(/\r/g,"").split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);continue}
  if(name==="options"){
    const labels=splitLines(val);
    const old=d.options||[];
    d.options=labels.map((title,i)=>({id:old[i]?.id||"opcao-"+(i+1),text:title}));
    continue;
  }
  if(name==="correctIndex")continue;
  if(name==="columnA"||name==="columnB")continue;
  if(name==="rows"){
    d.rows=columns(splitLines(val),3,"Comparação").map(c=>({criterion:c[0],values:c.slice(1)}));continue;
  }
  if(name==="events"){
    d.events=columns(splitLines(val),3,"Linha do tempo").map(c=>({date:c[0],title:c[1],description:c[2]}));continue;
  }
  d[name]=val.trim();
 }
 if(block.type==="multiple_choice"){
   const idx=Number(inputs.get("correctIndex"))-1;
   if(!Number.isInteger(idx)||idx<0||idx>=d.options.length)throw Error("Escolha um número de alternativa correta que exista na lista.");
   d.correctOptionId=d.options[idx].id;
 }
 if(block.type==="comparison"){
   d.columns=[text(inputs.get("columnA")).trim(),text(inputs.get("columnB")).trim()];
 }
 return d;
}
export function formatReferences(refs){
 return (refs||[]).map(r=>[r.author||"",r.title||"",r.year||"",r.note||""].join(" | ")).join("\n");
}
export function parseReferences(input,existing=[]){
 const rows=splitLines(input),old=existing||[];
 return rows.map((line,i)=>{
   const cells=line.split(" | ").map(x=>x.trim());
   if(cells.length<2||!cells[1])throw Error("Bibliografia: linha "+(i+1)+" precisa de autor | título | ano | nota.");
   if(cells[2]&&!/^\d{4}$/.test(cells[2]))throw Error("Bibliografia: o ano precisa conter quatro dígitos.");
   return {id:old[i]?.id,author:cells[0],title:cells[1],year:cells[2],note:cells.slice(3).join(" | ")};
 });
}
