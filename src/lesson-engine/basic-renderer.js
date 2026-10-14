import {escapeHTML as e} from "../ui/components.js";
function paragraphs(lines){return (lines||[]).map(s=>'<p>'+e(s)+'</p>').join("");}
function one(block,lesson,index){
  const d=block.data,idx=String(index+1).padStart(2,"0");
  if(block.version!==1){
    return '<section class="lesson-block lesson-unsupported"><span class="block-kicker">'+idx+' · Bloco incompatível</span><p>Este componente precisa de uma versão mais recente do Atelier.</p></section>';
  }
  switch(block.type) {
    case "question":
      return '<section class="lesson-block reader-prompt"><span class="block-kicker">'+idx+' · Pergunta inicial</span><h3>'+e(d.prompt)+'</h3>'+(d.hint?'<p>'+e(d.hint)+'</p>':'')+'</section>';
    case "rich_text":
      return '<section class="lesson-block"><span class="block-kicker">'+idx+' · Leitura</span>'+(d.title?'<h3>'+e(d.title)+'</h3>':'')+paragraphs(d.paragraphs)+'</section>';
    case "clinical_vignette":
      return '<section class="lesson-block reader-prompt"><span class="block-kicker">'+idx+' · Situação fictícia</span>'+(d.title?'<h3>'+e(d.title)+'</h3>':'')+
      '<p>'+e(d.narrative)+'</p><p><strong>Para refletir:</strong> '+e(d.reflection)+'</p>'+
      (d.disclaimer?'<small>'+e(d.disclaimer)+'</small>':'')+'</section>';
    case "multiple_choice":
      return '<section class="lesson-block"><span class="block-kicker">'+idx+' · Revisão</span><h3>'+e(d.prompt)+'</h3>'+
        '<ul class="lesson-options">'+d.options.map(o=>'<li>'+e(o.text)+'</li>').join('')+'</ul>'+
        '<p class="lesson-inline-note">As alternativas aparecem para leitura. A correção interativa será implementada no Sprint 9.</p></section>';
    case "references": {
      const refs=d.referenceIds.map(id=>lesson.references.find(r=>r.id===id)).filter(Boolean);
      return '<section class="lesson-block"><span class="block-kicker">'+idx+' · Referências</span><h3>Para aprofundar</h3><ul>'+
        refs.map(r=>'<li>'+e((r.author? r.author+'. ':'')+r.title+(r.year?' ('+r.year+')':'')+'.')+
          (r.note?'<br><small>'+e(r.note)+'</small>':'')+'</li>').join('')+'</ul></section>';
    }
    case "heading": return '<section class="lesson-block"><h3>'+e(d.text||"")+'</h3></section>';
    default:
      return '<section class="lesson-block lesson-unsupported"><span class="block-kicker">'+idx+' · Experiência futura</span>'+
        '<p>O bloco '+e(block.type)+' ainda não possui renderizador nesta versão. O restante da aula continua disponível.</p></section>';
  }
}
export function renderLessonBlocks(lesson) {
  return (lesson.blocks||[]).map((b,i)=>one(b,lesson,i)).join("");
}
