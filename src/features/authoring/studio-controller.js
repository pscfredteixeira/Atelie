/* Sprint 6 — Estúdio visual de aulas com prévia compartilhada.
   Sem backend: sessão em memória + salvamento explícito no IndexedDB. */
import {contentRepository} from "../../repositories/content-repository.js";
import {getDraft,saveDraft,deleteDraft,downloadJSON} from "../../repositories/draft-repository.js";
import {getCourseDraft,saveCourseDraft} from "../../repositories/course-draft-repository.js";
import {getLocalAvailableCourse} from "../../repositories/local-catalog-repository.js";
import {makeCourseAvailableOnDevice} from "./local-publication.js";
import {startCourseDraft} from "./course-editor.js";
import {startLessonDraft,updateLesson,syncLessonManifest,BLOCK_TYPES} from "./lesson-editor.js";
import {renderBlockFields,readBlockFields,formatReferences,parseReferences} from "./block-fields.js";
import {renderLessonBlocks,getLessonOutline,getBlockLabel} from "../../lesson-engine/engine.js";
import {validateLessonLink} from "../../repositories/validators.js";
import {escapeHTML as e} from "../../ui/components.js";

let active=null;
export const isStudioDirty=()=>!!active?.dirty||!!active?.formDirty;
export function confirmStudioLeave(){
 return !isStudioDirty()||window.confirm("Existem alterações no Estúdio que ainda não foram salvas neste navegador. Deseja descartá-las?");
}
export function unmountStudio(){if(active){active.root.replaceChildren();active=null;}}
const lessonLocation=(cid,lid)=>"#/professor/cursos/"+encodeURIComponent(cid)+"/aulas/"+encodeURIComponent(lid);
const summary=(block,lesson)=>{
 const item=getLessonOutline({...lesson,blocks:[block]})[0];
 return item?.label||getBlockLabel(block.type,block.version)||"Bloco";
};
function message(state,text,error=false){
 state.message=text;state.error=error;
 const node=state.root.querySelector("[data-studio-status]");
 if(node){node.textContent=text;node.classList.toggle("is-error",error);}
}
function ensureApplied(state){
 if(state.formDirty)throw Error("Você digitou informações ainda não aplicadas. Use “Aplicar alterações” no formulário antes de continuar.");
}
function markChanged(state){
 state.dirty=true;state.formDirty=false;state.message="Alterações ainda não salvas neste navegador.";
 state.error=false;
}
function blockCard(block,index,state){
 const selected=state.selected===block.id,readable=summary(block,state.lesson);
 return '<article class="studio-item'+(selected?" is-selected":"")+'">'+
  '<button class="studio-select" type="button" data-studio="select" data-id="'+e(block.id)+'"'+
   (selected?' aria-current="true"':'')+'><span class="studio-item-no">'+String(index+1).padStart(2,"0")+
   '</span><span><strong>'+e(readable)+'</strong><small>'+e(getBlockLabel(block.type,block.version))+
   '</small></span></button>'+
  '<div class="studio-item-tools">'+
   '<button type="button" data-studio="move" data-id="'+e(block.id)+'" data-dir="-1" aria-label="Mover '+e(readable)+' para cima"'+
   (index===0?" disabled":"")+'>↑</button>'+
   '<button type="button" data-studio="move" data-id="'+e(block.id)+'" data-dir="1" aria-label="Mover '+e(readable)+' para baixo"'+
   (index===state.lesson.blocks.length-1?" disabled":"")+'>↓</button>'+
   '<button type="button" data-studio="duplicate" data-id="'+e(block.id)+'" aria-label="Duplicar '+e(readable)+'">⧉</button>'+
   '<button type="button" data-studio="remove" data-id="'+e(block.id)+'" aria-label="Excluir '+e(readable)+'">×</button>'+
   '</div></article>';
}
function details(state){
 const l=state.lesson;
 return '<details class="studio-details"><summary>Informações gerais da aula</summary>'+
  '<form data-studio-form="details" class="studio-form">'+
  '<label class="field-label" for="studio-title">Título da aula</label><input class="field" id="studio-title" name="title" required maxlength="160" value="'+e(l.title)+'">'+
  '<label class="field-label" for="studio-summary">Apresentação</label><textarea class="field" id="studio-summary" name="summary" rows="3">'+e(l.summary||"")+'</textarea>'+
  '<label class="field-label" for="studio-time">Tempo estimado, em minutos</label><input class="field" id="studio-time" name="estimatedMinutes" type="number" min="1" max="600" value="'+e(l.estimatedMinutes||15)+'">'+
  '<label class="field-label" for="studio-objectives">Objetivos — um por linha</label><textarea class="field" id="studio-objectives" name="objectives" rows="4">'+e((l.objectives||[]).join("\n"))+'</textarea>'+
  '<button class="button action" type="submit">Aplicar informações da aula</button></form></details>';
}
function library(){
 return '<section class="studio-library" aria-labelledby="studio-library-title"><h3 id="studio-library-title">Adicionar um bloco</h3>'+
 '<p>Escolha o formato pedagógico e configure os campos ao lado.</p><div class="studio-library-grid">'+
 BLOCK_TYPES.map(([type,label])=>'<button type="button" data-studio="add" data-type="'+e(type)+'">'+
 '<span aria-hidden="true">＋</span>'+e(label)+'</button>').join("")+'</div></section>';
}
function inspector(state){
 const l=state.lesson,b=l.blocks.find(x=>x.id===state.selected);
 if(!b)return '<section class="studio-inspector"><div class="overline">Configuração</div><h3>Escolha um bloco</h3>'+
 '<p class="muted">Selecione um bloco na sequência ou adicione um novo formato pela biblioteca.</p></section>';
 return '<section class="studio-inspector" aria-labelledby="studio-inspector-title"><span class="overline">Configuração do bloco</span>'+
 '<h3 id="studio-inspector-title" tabindex="-1">'+e(getBlockLabel(b.type,b.version))+'</h3>'+
 '<form data-studio-form="block" class="studio-form">'+renderBlockFields(b,l)+
 '<label class="studio-check"><input type="checkbox" name="showInOutline"'+(b.settings?.showInOutline!==false?' checked':'')+
 '><span>Mostrar no índice da aula</span></label>'+
 '<label class="studio-check"><input type="checkbox" name="featured"'+(b.settings?.emphasis==="featured"?' checked':'')+
 '><span>Dar destaque visual ao bloco</span></label>'+
 '<button class="button action" type="submit">Aplicar alterações no bloco</button></form></section>';
}
function bibliography(state){
 return '<details class="studio-details"><summary>Bibliografia da aula ('+state.lesson.references.length+')</summary>'+
 '<form data-studio-form="references" class="studio-form">'+
 '<p class="muted">Uma referência por linha: autor | título | ano | observação. Depois selecione as fontes no bloco Bibliografia.</p>'+
 '<label class="field-label" for="studio-references">Referências bibliográficas</label>'+
 '<textarea class="field" rows="6" id="studio-references" name="references">'+e(formatReferences(state.lesson.references))+'</textarea>'+
 '<button class="button" type="submit">Aplicar bibliografia</button></form></details>';
}
function preview(state){
 const l=state.lesson;
 return '<div class="studio-preview"><div class="overline">Prévia instantânea · Dados atuais em memória</div>'+
  '<article class="reader"><div class="reader-inner"><h2>'+e(l.title)+'</h2>'+
  (l.summary?'<p>'+e(l.summary)+'</p>':'')+
  renderLessonBlocks(l,{sourceURL:state.sourceURL})+
  '</div></article>'+
  '<p class="tiny">Esta prévia usa o mesmo motor de blocos da Sala de Aula. Ela não publica nem salva a aula.</p></div>';
}
function draw(state){
 if(active!==state||!state.root.isConnected)return;
 const l=state.lesson, selected=state.selected;
 const top='<div class="studio-toolbar"><div><span class="overline">Estúdio visual / Edição local</span>'+
 '<h2>'+e(l.title)+'</h2><div class="studio-subtitle">'+l.blocks.length+' bloco(s) · revisão '+l.revision+
 ' · <strong>'+(state.dirty||state.formDirty?'Alterações não salvas':'Nenhuma alteração pendente')+'</strong></div></div>'+
 '<div class="studio-toolbar-actions">'+
 '<button type="button" class="button" data-studio="toggle-preview">'+(state.preview?'Voltar a editar':'Visualizar como aluno')+'</button>'+
 '<button type="button" class="button action" data-studio="save">Salvar no dispositivo</button>'+
 '<button type="button" class="button" data-studio="publish">Disponibilizar curso</button>'+
 (state.isAvailable?'<a class="button" href="#/cursos/'+e(l.courseId)+'/aulas/'+e(l.id)+'">Abrir como aluno</a>':'')+
 '<button type="button" class="button" data-studio="export">Exportar JSON</button>'+
 (state.sourceURL?'<a class="button quiet" href="'+lessonLocation(l.courseId,l.id)+'/json">Modo JSON</a>':"")+
 '<a class="button quiet" href="#/professor/cursos/'+e(l.courseId)+'">Voltar ao curso</a></div></div>'+
 '<div class="studio-alert" role="status" aria-live="polite" data-studio-status>'+e(state.message||"Tudo pronto para editar. Os dados não são salvos automaticamente.")+'</div>';
 if(state.preview){
   state.root.innerHTML=top+preview(state);
   return;
 }
 const body='<div class="studio-board"><section class="studio-canvas" aria-label="Blocos da aula">'+
 details(state)+
 '<div class="studio-section-head"><h3>Sequência de estudo</h3><span class="tiny">Mover por ↑ ↓ · clique para editar</span></div>'+
 (l.blocks.length?'<div class="studio-item-list">'+l.blocks.map((b,i)=>blockCard(b,i,state)).join("")+'</div>':
 '<p class="studio-empty">Esta aula ainda não possui blocos. Escolha um componente na biblioteca abaixo.</p>')+
 library()+bibliography(state)+'</section>'+inspector(state)+'</div>';
 state.root.innerHTML=top+body;
}
async function loadState(root){
 const cid=root.dataset.courseId,lid=root.dataset.lessonId;
 const saved=await getDraft(cid,lid).catch(err=>{throw Error("Não foi possível consultar os rascunhos locais: "+err.message)});
 const localCourse=await getCourseDraft(cid).catch(err=>{throw Error("Não foi possível consultar o curso local: "+err.message)});
 let published=null,publishedCourse=null,available=null;
 try{available=await getLocalAvailableCourse(cid);}catch(err){console.warn("Catálogo local indisponível:",err);}
 try{published=await contentRepository.getPublishedLesson(cid,lid);}
 catch(err){if(err.code!=="not_found")throw err;}
 if(!localCourse){
   try{publishedCourse=(await contentRepository.getPublishedCourse(cid)).course;}
   catch(err){if(err.code!=="not_found")throw err;}
 }
 const course=localCourse?.course||published?.course||publishedCourse||available?.course;
 if(!course)throw Error("Curso não encontrado no navegador nem no catálogo.");
 const original=published?.lesson||available?.lessons?.[lid]||null;
 const lesson=saved?.lesson||(original?startLessonDraft(original):null);
 if(!lesson)throw Error("Aula não encontrada no armazenamento local nem no catálogo publicado.");
 validateLessonLink(lesson,course,lesson.moduleId);
 return {root,cid,lid,lesson,course,sourceURL:published?.contentURL,
   selected:lesson.blocks[0]?.id||null,preview:false,dirty:false,formDirty:false,isAvailable:!!available,
   message:saved?"Rascunho recuperado deste navegador.":"Editando uma cópia local; a versão publicada permanece intacta.",error:false,busy:false};
}
export async function mountVisualStudio(root){
 if(!root)return;
 const state=await loadState(root);
 if(!root.isConnected)return;
 active=state;
 draw(state);
 root.addEventListener("input",event=>{
   if(event.target.closest("form[data-studio-form]")){
     state.formDirty=true;
     message(state,"Há informações digitadas ainda não aplicadas. Clique em “Aplicar” neste formulário.");
   }
 });
 root.addEventListener("submit",event=>{
   const form=event.target.closest("form[data-studio-form]");
   if(!form)return;
   event.preventDefault();
   if(state.busy)return;
   state.busy=true;
   try{
     const kind=form.dataset.studioForm,input=new FormData(form);
     let next;
     if(kind==="details")next=updateLesson(state.lesson,"details",Object.fromEntries(input));
     else if(kind==="references")next=updateLesson(state.lesson,"references",{
       references:parseReferences(input.get("references")||"",state.lesson.references)});
     else if(kind==="block"){
       const selected=state.lesson.blocks.find(b=>b.id===state.selected);
       if(!selected)throw Error("Escolha um bloco antes de editar.");
       next=updateLesson(state.lesson,"edit-block",{blockId:selected.id,
         data:readBlockFields(selected,form),
         showInOutline:input.has("showInOutline"),featured:input.has("featured")});
     }else throw Error("Formulário não reconhecido.");
     state.lesson=next;
     markChanged(state);
     draw(state);
     message(state,"Alterações aplicadas à aula em memória. Clique em Salvar no dispositivo para preservá-las.");
   }catch(err){message(state,err?.message||"Não foi possível aplicar o conteúdo.",true);}
   finally{state.busy=false;}
 });
 root.addEventListener("click",async event=>{
   const btn=event.target.closest("button[data-studio]");
   if(!btn||state.busy)return;
   const action=btn.dataset.studio;
   try{
     if(action==="save"||action==="export"||action==="publish")ensureApplied(state);
     if(action==="select"||action==="add"||action==="duplicate"||action==="move"||
        action==="remove"||action==="toggle-preview")ensureApplied(state);
     if(action==="publish"){
       if(state.dirty)throw Error("Salve primeiro as alterações da aula para disponibilizar o curso.");
       state.busy=true;
       try{
         const result=await makeCourseAvailableOnDevice(state.cid);
         state.isAvailable=true;
         draw(state);
         message(state,"Curso “"+result.title+"” disponível para estudo neste navegador ("+result.lessonCount+" aulas).");
       }finally{state.busy=false;}
       return;
     }
     if(action==="save"||action==="export"){
       if(action==="export"){
         const course=state.course.status==="draft"?state.course:
           startCourseDraft(state.course);
         validateLessonLink(state.lesson,course,state.lesson.moduleId);
         downloadJSON(state.lesson,state.lesson.slug+"-rascunho.json");
         message(state,"Arquivo JSON exportado. Isso não publicou a aula.");
       }else{
         state.busy=true;
         try{
           const base=state.course.status==="draft"?state.course:startCourseDraft(state.course);
           const updated=syncLessonManifest(base,state.lesson);
           validateLessonLink(state.lesson,updated,state.lesson.moduleId);
           await saveDraft(state.cid,state.lesson);
           await saveCourseDraft(updated);
           state.course=updated;state.dirty=false;
           draw(state);
           message(state,"Aula e manifesto salvos neste navegador. Para publicar, exporte os arquivos e faça o commit manual.");
         }finally{state.busy=false;}
       }
       return;
     }
     if(action==="select"){state.selected=btn.dataset.id;draw(state);state.root.querySelector("#studio-inspector-title")?.focus();return;}
     if(action==="toggle-preview"){state.preview=!state.preview;draw(state);return;}
     if(action==="remove"&&!window.confirm("Remover este bloco do rascunho? Você poderá recuperá-lo apenas se tiver uma exportação anterior."))return;
     const kind={add:"add-block",move:"move-block",duplicate:"duplicate-block",remove:"remove-block"}[action];
     if(!kind)return;
     const next=updateLesson(state.lesson,kind,{type:btn.dataset.type,blockId:btn.dataset.id,
       direction:Number(btn.dataset.dir)});
     if(action==="add"||action==="duplicate"){
       const ids=new Set(state.lesson.blocks.map(b=>b.id));
       state.selected=next.blocks.find(b=>!ids.has(b.id))?.id||state.selected;
     }else if(action==="remove"&&state.selected===btn.dataset.id){
       state.selected=next.blocks[0]?.id||null;
     }
     state.lesson=next;markChanged(state);draw(state);
   }catch(err){message(state,err?.message||"Operação não concluída.",true);}
 });
}
