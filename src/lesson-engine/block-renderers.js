import {escapeHTML as e} from "../ui/components.js";
import {registerBlockRenderer} from "./block-registry.js";

const txt=value=>e(value??"");
const ps=items=>(Array.isArray(items)?items:[]).map(p=>"<p>"+txt(p)+"</p>").join("");
function safeMediaURL(src,context){
  if(typeof src!=="string"||!/^\.\/[a-zA-Z0-9_-]/.test(src)||!context?.sourceURL)return null;
  try{
    const base=new URL(".",context.sourceURL),url=new URL(src,context.sourceURL);
    if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname)||url.search||url.hash)return null;
    if(!/^https?:$/.test(url.protocol))return null;
    return url.href;
  }catch{return null}
}
function refText(r){
  return (r.author?r.author+". ":"")+r.title+(r.year?" ("+r.year+")":"")+".";
}
function note(text){return '<p class="lesson-inline-note">'+txt(text)+'</p>'}
function register(type,label,render,outline){
  registerBlockRenderer({type,label,version:1,render,outline});
}
register("question","Pergunta inicial",(d)=>{
  return '<div class="reader-prompt"><h3>'+txt(d.prompt)+'</h3>'+
    (d.hint?'<p>'+txt(d.hint)+'</p>':"")+'</div>';
},(d)=>d.prompt);
register("rich_text","Leitura conceitual",(d)=>{
  return (d.title?'<h3>'+txt(d.title)+'</h3>':"")+ps(d.paragraphs);
},d=>d.title||"Leitura");
register("clinical_vignette","Situação fictícia",(d)=>{
  return '<div class="reader-prompt">'+(d.title?'<h3>'+txt(d.title)+'</h3>':"")+
    '<p>'+txt(d.narrative)+'</p><p><strong>Para pensar:</strong> '+txt(d.reflection)+'</p>'+
    (d.disclaimer?'<small>'+txt(d.disclaimer)+'</small>':"")+'</div>';
},d=>d.title||"Situação fictícia");
register("multiple_choice","Questão de revisão",(d)=>{
  return '<h3>'+txt(d.prompt)+'</h3><ol class="lesson-options">'+
    d.options.map(o=>'<li>'+txt(o.text)+'</li>').join("")+'</ol>'+
    note("Questão formativa em modo de leitura. As respostas e o feedback interativo entram no Sprint 9.");
},d=>d.prompt);
register("references","Referências",(d,ctx)=>{
  const refs=d.referenceIds.map(id=>ctx.lesson.references.find(r=>r.id===id)).filter(Boolean);
  return '<h3>Para aprofundar</h3><ul class="lesson-references">'+
    refs.map(r=>'<li>'+txt(refText(r))+(r.note?'<br><small>'+txt(r.note)+'</small>':"")+'</li>').join("")+'</ul>';
},()=> "Bibliografia");
register("heading","Seção",(d)=>{
  return '<h3>'+txt(d.text||"Seção")+'</h3>';
},d=>d.text);
register("concept","Conceito em foco",(d)=>{
  return '<div class="lesson-concept"><h3>'+txt(d.term)+'</h3>'+
    '<details><summary>Explorar o conceito</summary><div class="lesson-concept-body"><p>'+txt(d.definition)+'</p>'+
    (d.example?'<p><strong>Exemplo:</strong> '+txt(d.example)+'</p>':"")+'</div></details></div>';
},d=>d.term);
register("quote","Citação comentada",(d)=>{
  return '<figure class="lesson-quote"><blockquote>'+txt(d.text)+'</blockquote>'+
    '<figcaption>'+txt(d.attribution||"Fonte não informada")+
    (d.context?" · "+txt(d.context):"")+'</figcaption></figure>';
},d=>d.title||"Citação");
register("comparison","Comparação teórica",(d)=>{
  const cols=d.columns||[];
  return '<div class="lesson-comparison"><h3>'+txt(d.title||"Comparar ideias")+'</h3>'+
    '<div class="comparison-scroll" tabindex="0" role="region" aria-label="Tabela comparativa: '+txt(d.title||"perspectivas")+'">'+
    '<table><caption>'+txt(d.caption||"Comparação didática, não equivalência entre teorias")+'</caption><thead><tr>'+
    '<th scope="col">Critério</th>'+cols.map(c=>'<th scope="col">'+txt(c)+'</th>').join("")+
    '</tr></thead><tbody>'+d.rows.map(row=>'<tr><th scope="row">'+txt(row.criterion)+'</th>'+
     row.values.map(v=>'<td>'+txt(v)+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></div>';
},d=>d.title||"Comparação");
register("timeline","Linha do tempo",(d)=>{
  return '<div class="lesson-timeline"><h3>'+txt(d.title||"Marcos no tempo")+'</h3><ol>'+
    d.events.map(ev=>'<li><span class="timeline-year">'+txt(ev.date)+'</span><div><strong>'+txt(ev.title)+'</strong>'+
    (ev.description?'<p>'+txt(ev.description)+'</p>':"")+'</div></li>').join("")+'</ol></div>';
},d=>d.title||"Linha do tempo");
register("image","Imagem comentada",(d,ctx)=>{
  const url=safeMediaURL(d.src,ctx);
  if(!url)return note("Imagem indisponível: caminho do arquivo não foi informado ou não é permitido.");
  const alt=d.decorative?"":txt(d.alt);
  return '<figure class="lesson-media"><img src="'+txt(url)+'" alt="'+alt+'" loading="lazy" decoding="async">'+
    (d.caption||d.credit?'<figcaption>'+txt(d.caption||"")+(d.credit?" · "+txt(d.credit):"")+'</figcaption>':"")+'</figure>';
},d=>d.caption||"Imagem");
register("audio","Escuta e áudio",(d,ctx)=>{
  const url=safeMediaURL(d.src,ctx);
  return '<div class="lesson-media"><h3>'+txt(d.title||"Escuta guiada")+'</h3>'+
    (url?'<audio controls preload="none" src="'+txt(url)+'">Áudio indisponível neste navegador.</audio>':
      note("Áudio indisponível: não foi encontrada uma mídia válida."))+
    (d.transcript?'<details><summary>Ler transcrição</summary><p>'+txt(d.transcript)+'</p></details>':"")+'</div>';
},d=>d.title||"Áudio");
register("video","Vídeo de estudo",(d,ctx)=>{
  const url=safeMediaURL(d.src,ctx);
  const captions=safeMediaURL(d.captions,ctx);
  return '<div class="lesson-media"><h3>'+txt(d.title||"Vídeo de estudo")+'</h3>'+
    (url?'<video controls preload="metadata" playsinline src="'+txt(url)+'">'+
    (captions?'<track kind="captions" src="'+txt(captions)+'" srclang="pt-BR" label="Português" default>':"")+
    'Vídeo indisponível neste navegador.</video>':note("Vídeo indisponível: mídia ainda não adicionada."))+
    (d.transcript?'<details><summary>Ler transcrição</summary><p>'+txt(d.transcript)+'</p></details>':"")+'</div>';
},d=>d.title||"Vídeo");
register("interactive_lab","Laboratório pedagógico",(d)=>{
  return '<div class="lesson-lab"><h3>'+txt(d.title||"Laboratório")+'</h3>'+
    (d.description?'<p>'+txt(d.description)+'</p>':"")+
    note("Este laboratório será ativado com o motor de interatividades no Sprint 8; não é uma atividade concluível agora.")+
    (d.alternative?'<details><summary>Alternativa de estudo</summary><p>'+txt(d.alternative)+'</p></details>':"")+'</div>';
},d=>d.title||"Laboratório");
