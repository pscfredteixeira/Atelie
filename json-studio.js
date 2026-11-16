/* Ateliê · Sprint JSON 4 — Estúdio visual de rascunhos.
 * Reutiliza o contrato e os formulários existentes. Não publica no GitHub/Firebase.
 * O conteúdo técnico do laboratório é público: isto não é autenticação administrativa.
 */
import {readPilotCatalog,readPilotCourse,readPilotLesson} from "./json-pilot.js";
import {validateLesson} from "./src/repositories/validators.js";
import {createLesson,startLessonDraft,updateLesson,BLOCK_TYPES} from "./src/features/authoring/lesson-editor.js";
import {renderBlockFields,readBlockFields,formatReferences,parseReferences} from "./src/features/authoring/block-fields.js";
import {getDraft,saveDraft,deleteDraft,listDrafts,downloadJSON} from "./src/repositories/draft-repository.js";
import {renderLessonBlocks,getLessonOutline} from "./src/lesson-engine/engine.js";
import {checkQuiz,exploreLab} from "./src/features/learning/activities.js";
import {confirmQuizStep,advanceQuiz,retryQuizStep,restartQuiz} from "./src/features/learning/quiz-flow.js";
import {planJSONPublication} from "./src/features/authoring/publication-plan.js";
import {downloadReviewZIP} from "./src/features/authoring/review-zip.js";

const escapeHTML=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ID=/^[a-zA-Z0-9_-]+$/;
const linkEdit=(courseId,lessonId)=>"#/laboratorio/editor?curso="+encodeURIComponent(courseId)+"&aula="+encodeURIComponent(lessonId);
const linkNew=(courseId,moduleId)=>"#/laboratorio/editor?curso="+encodeURIComponent(courseId)+"&novo="+encodeURIComponent(moduleId);
const blockName=type=>BLOCK_TYPES.find(item=>item[0]===type)?.[1]||type;
const safeFile=x=>String(x||"aula").toLowerCase().replace(/[^a-z0-9_-]+/g,"-").replace(/^-|-$/g,"").slice(0,75)||"aula";
const clone=value=>JSON.parse(JSON.stringify(value));
let activeStudio=null;

export function parseStudioSelection(hash){
 const parts=String(hash||"").split("?");
 if(parts[0]!=="#/laboratorio/editor"||parts.length>2)return {error:"Rota do Estúdio JSON inválida."};
 const params=new URLSearchParams(parts[1]||"");
 const keys=[...params.keys()];
 if(keys.some(k=>!["curso","aula","novo"].includes(k))||
   keys.some(k=>params.getAll(k).length>1))return {error:"Parâmetros desconhecidos ou duplicados."};
 if(!keys.length)return {mode:"dashboard"};
 const courseId=params.get("curso"),lessonId=params.get("aula"),moduleId=params.get("novo");
 if(typeof courseId!=="string"||!ID.test(courseId))return {error:"ID do curso inválido."};
 if(!!lessonId===!!moduleId)return {error:"Escolha uma aula existente OU um módulo para criar uma nova."};
 if(lessonId&&!ID.test(lessonId))return {error:"ID da aula inválido."};
 if(moduleId&&!ID.test(moduleId))return {error:"ID do módulo inválido."};
 return lessonId?{mode:"edit",courseId,lessonId}:{mode:"new",courseId,moduleId};
}
function header(title,lead){
 return '<a class="back-link" href="#/laboratorio/json">← Laboratório JSON</a>'+
 '<header class="json-pilot-hero"><span class="eyebrow">ATELIÊ · ESTÚDIO VISUAL JSON</span>'+
 '<h1>'+escapeHTML(title)+'</h1><p>'+escapeHTML(lead)+'</p></header>';
}
function caution(){
 return '<div class="json-studio-disclaimer" role="note"><strong>Editor experimental, sem controle administrativo.</strong> '+
  'Os rascunhos são armazenados somente neste navegador (IndexedDB). '+
  'Eles não são privados de outras pessoas que usem o mesmo perfil do navegador. '+
  'Salvar e exportar NÃO publicam a aula no GitHub, não alteram o Firebase e não modificam aulas oficiais. '+
  'Não insira dados de pacientes ou outras informações sensíveis.</div>';
}
function renderDashboard(root,rows,drafts,storageIssue){
 const courses=rows.map(item=>{
  const {course,lessons}=item;
  const owned=drafts.filter(d=>d.courseId===course.id&&
    !course.modules.some(m=>m.lessons.some(l=>l.id===d.lessonId)));
  const visible=lessons.map(l=>'<li><span class="json-studio-lesson-title">'+escapeHTML(l.title)+'</span>'+
   '<a class="btn btn-outline" href="'+linkEdit(course.id,l.id)+'">Editar cópia</a></li>').join("");
  const modules=course.modules.map(m=>'<a class="btn btn-primary" href="'+linkNew(course.id,m.id)+'">+ Criar aula em '+escapeHTML(m.title)+'</a>').join("");
  const local=owned.map(d=>'<li><span class="json-studio-lesson-title">'+escapeHTML(d.lesson.title)+
   '<small>Rascunho não publicado</small></span><a class="btn btn-outline" href="'+linkEdit(course.id,d.lessonId)+'">Continuar edição</a></li>').join("");
  return '<section class="json-studio-course"><h2>'+escapeHTML(course.title)+'</h2>'+
   '<p>Escolha uma aula do laboratório para editar uma cópia ou crie um rascunho novo.</p>'+
   '<ol class="json-studio-dashboard-list">'+visible+local+'</ol>'+
   '<div class="json-studio-inline-actions">'+modules+'</div></section>';
 }).join("");
 root.innerHTML=header("Editor de aulas por blocos","Crie e organize aulas sem escrever JSON manualmente. Nenhuma alteração sai deste navegador sem a exportação explícita.")+
 caution()+
 (storageIssue?'<p role="alert" class="json-studio-error">'+escapeHTML(storageIssue)+'</p>':'')+
 '<div class="json-studio-dashboard">'+courses+'</div>';
}
function formNew(course,module){
 return header("Criar aula no laboratório","O novo arquivo será um rascunho local. Para torná-lo visível aos estudantes no futuro será preciso revisar o conteúdo e atualizar o manifesto.")+
 caution()+
 '<section class="json-studio-form-card"><h2>'+escapeHTML(course.title)+'</h2>'+
 '<p>Módulo técnico: '+escapeHTML(module.title)+'</p>'+
 '<form data-json-studio-new><label class="json-studio-label" for="new-lesson-title">Título da nova aula</label>'+
 '<input class="json-studio-field" id="new-lesson-title" name="title" maxlength="160" required placeholder="Ex.: O inconsciente e suas manifestações">'+
 '<button type="submit" class="btn btn-primary">Criar rascunho</button></form>'+
 '<p class="json-studio-message" data-json-studio-new-message role="status"></p></section>';
}

function reviewPanelContent(state){
 const plan=state.reviewPlan;
 if(!plan)return '<section class="json-studio-review"><h2>Revisão e publicação</h2>'+
 '<p>Valide a estrutura da aula e prepare os arquivos para revisão humana. O pacote ZIP não publica nada no GitHub.</p>'+
 '<button class="btn btn-primary" type="button" data-json-studio-action="analyse">Analisar arquivos</button></section>';
 const report=plan.report,checks=state.reviewChecks;
 const items=report.requiredReview.map(item=>'<label class="json-studio-review-check">'+
 '<input type="checkbox" data-json-studio-review="'+escapeHTML(item.id)+'"'+
 (checks.has(item.id)?' checked':'')+'><span>'+escapeHTML(item.label)+'</span></label>').join("");
 const ready=report.requiredReview.every(item=>checks.has(item.id));
 return '<section class="json-studio-review"><h2>Pacote para revisão humana</h2>'+
 '<p>Os arquivos passaram na validação estrutural. Confira os itens editoriais antes de exportar.</p>'+
 '<dl><div><dt>Operação</dt><dd>'+(report.mode==="create"?"Nova aula":"Atualização")+'</dd></div>'+
 '<div><dt>JSON da aula</dt><dd><code>'+escapeHTML(report.lessonPath)+'</code></dd></div>'+
 '<div><dt>Manifesto</dt><dd><code>'+escapeHTML(report.manifestPath)+'</code></dd></div>'+
 '<div><dt>Revisão do manifesto</dt><dd>'+report.baseCourseRevision+' → '+report.nextCourseRevision+'</dd></div></dl>'+
 (report.warnings.length?'<h3>Pontos de atenção</h3><ul>'+report.warnings.map(w=>'<li>'+escapeHTML(w)+'</li>').join("")+'</ul>':'')+
 '<fieldset class="json-studio-review-checklist"><legend>Conferência humana</legend>'+items+'</fieldset>'+
 '<p data-json-studio-review-count>'+checks.size+' de '+report.requiredReview.length+' itens confirmados</p>'+
 '<div class="json-studio-inline-actions">'+
 '<button type="button" class="btn btn-primary" data-json-studio-action="download-review"'+(ready?'':' disabled')+'>Baixar ZIP para revisão</button>'+
 '<button type="button" class="btn btn-outline" data-json-studio-action="analyse">Verificar novamente</button></div>'+
 '<p class="json-studio-review-disclaimer">O ZIP contém arquivos candidatos com status published, mas não modifica o GitHub, o site público ou o progresso dos alunos. '+
 'É necessária uma pull request revisada e testada antes de integrar.</p></section>';
}
function laboratoryManifestPath(courseURL){
 const marker="/content/piloto-json-sprint-02/";
 const index=courseURL.pathname.lastIndexOf(marker);
 if(index<0)throw Error("O manifesto está fora do laboratório.");
 return courseURL.pathname.slice(index+1);
}
async function analysePublication(state){
 commitForm(state);
 const latest=await readPilotCourse(state.course.id);
 const exists=latest.course.modules.some(m=>m.lessons.some(l=>l.id===state.lesson.id));
 const previous=exists?(await readPilotLesson(state.course.id,state.lesson.id)).lesson:null;
 const plan=planJSONPublication({
  course:latest.course,draft:state.lesson,publishedLesson:previous,
  manifestPath:laboratoryManifestPath(latest.courseURL)
 });
 state.reviewPlan=plan;state.reviewChecks=new Set();state.panel="review";
 state.message="Validação técnica concluída. A conferência humana ainda é necessária.";
 draw(state);
}

function panelContent(state){
 const lesson=state.lesson;
 if(state.panel==="preview"){
  const html=renderLessonBlocks(lesson,{sourceURL:state.sourceURL});
  const outline=getLessonOutline(lesson);
  return '<div class="json-studio-preview json-pilot" data-json-studio-preview>'+
   '<h2>Prévia do aluno — rascunho não publicado</h2><p>As atividades funcionam nesta tela, mas respostas não são gravadas.</p>'+
   '<p class="json-studio-outline">'+outline.map(item=>escapeHTML(item.label)).join(" · ")+'</p>'+
   html+'</div>';
 }
 if(state.panel==="review")return reviewPanelContent(state);
 if(state.panel==="details")return '<form data-json-studio-edit="details" class="json-studio-form">'+
  '<h2>Informações da aula</h2>'+
  '<label for="js-title" class="json-studio-label">Título</label><input class="json-studio-field" id="js-title" name="title" required maxlength="160" value="'+escapeHTML(lesson.title)+'">'+
  '<label for="js-summary" class="json-studio-label">Resumo</label><textarea class="json-studio-field" id="js-summary" name="summary" rows="4" maxlength="1200">'+escapeHTML(lesson.summary||"")+'</textarea>'+
  '<label for="js-objectives" class="json-studio-label">Objetivos — um por linha</label><textarea class="json-studio-field" id="js-objectives" name="objectives" rows="5">'+escapeHTML((lesson.objectives||[]).join("\n"))+'</textarea>'+
  '<label for="js-minutes" class="json-studio-label">Duração estimada (minutos)</label><input class="json-studio-field" id="js-minutes" name="estimatedMinutes" required type="number" min="1" max="600" value="'+escapeHTML(lesson.estimatedMinutes||15)+'">'+
  '<button type="submit" class="btn btn-primary">Aplicar informações</button></form>';
 if(state.panel==="references")return '<form data-json-studio-edit="references" class="json-studio-form">'+
  '<h2>Bibliografia</h2><p>Uma referência por linha, no formato <code>autor | título | ano | nota</code>. O ano e a nota podem ficar vazios.</p>'+
  '<label for="js-references" class="json-studio-label">Referências da aula</label>'+
  '<textarea id="js-references" class="json-studio-field" rows="10" name="references">'+escapeHTML(formatReferences(lesson.references))+'</textarea>'+
  '<button type="submit" class="btn btn-primary">Aplicar bibliografia</button></form>';
 const block=lesson.blocks.find(item=>item.id===state.selectedId);
 if(!block)return '<section class="json-studio-form"><h2>Selecione um bloco</h2><p>Escolha um componente na lista ao lado para editar seus campos.</p></section>';
 return '<form data-json-studio-edit="block" class="json-studio-form">'+
  '<h2>'+escapeHTML(blockName(block.type))+'</h2><p class="json-studio-tech">ID: '+escapeHTML(block.id)+' · versão '+escapeHTML(block.version)+'</p>'+
  renderBlockFields(block,lesson)+
  '<fieldset class="json-studio-settings"><legend>Apresentação</legend>'+
  '<label><input type="checkbox" name="showInOutline"'+(block.settings?.showInOutline!==false?' checked':'')+'> Mostrar no índice</label>'+
  '<label><input type="checkbox" name="featured"'+(block.settings?.emphasis==="featured"?' checked':'')+'> Destacar o bloco</label></fieldset>'+
  '<button type="submit" class="btn btn-primary">Aplicar alterações do bloco</button></form>';
}
function draw(state){
 const root=state.root,lesson=state.lesson;
 const types=BLOCK_TYPES.map(([id,label])=>'<option value="'+escapeHTML(id)+'">'+escapeHTML(label)+'</option>').join("");
 const rows=lesson.blocks.map((block,index)=>
  '<li class="json-studio-block-row'+(state.panel==="block"&&state.selectedId===block.id?' is-selected':'')+'">'+
  '<button type="button" class="json-studio-block-pick" data-json-studio-pick="'+escapeHTML(block.id)+'">'+
  '<span>'+String(index+1).padStart(2,"0")+'</span> '+escapeHTML(blockName(block.type))+'</button>'+
  '<div class="json-studio-block-actions">'+
  '<button type="button" data-json-studio-block-action="move-up" data-block-id="'+escapeHTML(block.id)+'" aria-label="Mover bloco para cima"'+(index===0?' disabled':'')+'>↑</button>'+
  '<button type="button" data-json-studio-block-action="move-down" data-block-id="'+escapeHTML(block.id)+'" aria-label="Mover bloco para baixo"'+(index===lesson.blocks.length-1?' disabled':'')+'>↓</button>'+
  '<button type="button" data-json-studio-block-action="duplicate" data-block-id="'+escapeHTML(block.id)+'" aria-label="Duplicar bloco">⧉</button>'+
  '<button type="button" data-json-studio-block-action="remove" data-block-id="'+escapeHTML(block.id)+'" aria-label="Excluir bloco">×</button></div></li>'
 ).join("");
 root.innerHTML=header(lesson.title,"Edite os campos, reorganize blocos e visualize a aula antes de exportar.")+
  caution()+
  '<div class="json-studio-toolbar"><span data-json-studio-state role="status" class="json-studio-state">'+
  (state.dirty||state.formDirty?"Alterações não salvas":state.savedAt?"Rascunho salvo neste navegador":"Cópia de trabalho não salva")+'</span>'+
  '<div class="json-studio-inline-actions">'+
  '<button type="button" class="btn btn-primary" data-json-studio-action="save">Salvar rascunho</button>'+
  '<button type="button" class="btn btn-outline" data-json-studio-action="export">Exportar JSON</button>'+  '<label class="btn btn-outline json-studio-import-label" for="js-import-file">Importar JSON'+  '<input id="js-import-file" type="file" accept=".json,application/json" data-json-studio-import hidden></label>'+
  '<button type="button" class="btn btn-outline" data-json-studio-action="discard">Descartar rascunho</button></div></div>'+
  '<p data-json-studio-message class="json-studio-message" role="status">'+escapeHTML(state.message||"")+'</p>'+
  '<div class="json-studio-grid"><aside class="json-studio-list" aria-label="Estrutura da aula">'+
  '<nav class="json-studio-tabs" aria-label="Editar aula">'+
  [['details',"Dados"],['references',"Bibliografia"],['preview',"Prévia"],['review',"Revisão"]].map(([id,label])=>
   '<button type="button" class="'+(state.panel===id?'is-active':'')+'" data-json-studio-panel="'+id+'">'+label+'</button>').join("")+
  '</nav><h2>Blocos da aula <small>('+lesson.blocks.length+')</small></h2>'+
  '<ol>'+rows+'</ol>'+
  '<form data-json-studio-add class="json-studio-add"><label class="json-studio-label" for="js-block-add">Adicionar componente</label>'+
  '<select class="json-studio-field" name="type" id="js-block-add">'+types+'</select>'+
  '<button type="submit" class="btn btn-primary">+ Adicionar bloco</button></form></aside>'+
  '<section class="json-studio-edit-area">'+panelContent(state)+'</section></div>';
}
function alertMessage(state,message,error=false){
 state.message=message;
 const node=state.root.querySelector("[data-json-studio-message]");
 if(node){node.textContent=message;node.dataset.error=error?"true":"false"}
}
function markDirty(state){
 state.formDirty=true;
 const status=state.root.querySelector("[data-json-studio-state]");
 if(status)status.textContent="Alterações não salvas";
}
function commitForm(state){
 if(!state.formDirty)return false;
 const form=state.root.querySelector("form[data-json-studio-edit]");
 if(!form)return false;
 const kind=form.dataset.jsonStudioEdit,formData=new FormData(form);
 let next;
 if(kind==="details"){
  next=updateLesson(state.lesson,"details",{
   title:formData.get("title"),summary:formData.get("summary"),objectives:formData.get("objectives"),
   estimatedMinutes:formData.get("estimatedMinutes")
  });
 }else if(kind==="references"){
  next=updateLesson(state.lesson,"references",{
   references:parseReferences(String(formData.get("references")||""),state.lesson.references)
  });
 }else if(kind==="block"){
  const block=state.lesson.blocks.find(item=>item.id===state.selectedId);
  if(!block)throw Error("Bloco não encontrado.");
  next=updateLesson(state.lesson,"edit-block",{
   blockId:block.id,data:readBlockFields(block,form),
   showInOutline:formData.has("showInOutline"),featured:formData.has("featured")
  });
 }else return false;
 state.lesson=next;
 state.reviewPlan=null;state.reviewChecks=new Set();
 state.formDirty=false;state.dirty=true;
 return true;
}
function applyAndDraw(state){commitForm(state);draw(state)}
async function save(state){
 commitForm(state);
 validateLesson(state.lesson);
 const record=await saveDraft(state.lesson.courseId,state.lesson);
 state.dirty=false;state.formDirty=false;state.savedAt=record.savedAt;
 state.message="Rascunho salvo localmente em "+new Date(record.savedAt).toLocaleString("pt-BR")+". Não foi publicado.";
 draw(state);
}
function exportDraft(state){
 commitForm(state);
 validateLesson(state.lesson);
 downloadJSON({...clone(state.lesson),status:"draft"},safeFile(state.lesson.slug||state.lesson.id)+".json");
 state.message="JSON exportado como rascunho. Para publicar, é necessário revisar e atualizar o manifesto no repositório.";
 draw(state);
}
function previewInteractions(root){
 root.addEventListener("submit",event=>{
  const form=event.target.closest('form[data-activity="quiz"]');
  if(!form||!root.contains(form))return;
  event.preventDefault();
  if(form.closest(".quiz-carousel-slide")?.dataset.answered==="true")return;
  const result=checkQuiz(form);
  if(result.answered)confirmQuizStep(form,result);
 });
 root.addEventListener("click",event=>{
  const lab=event.target.closest("[data-branch]");
  if(lab&&root.contains(lab)){exploreLab(lab);return;}
  const retry=event.target.closest("[data-quiz-retry]");
  if(retry&&root.contains(retry)){retryQuizStep(retry);return;}
  const next=event.target.closest("[data-quiz-next]");
  if(next&&root.contains(next)){advanceQuiz(next);return;}
  const restart=event.target.closest("[data-quiz-restart]");
  if(restart&&root.contains(restart))restartQuiz(restart);
 });
}
function wireEditor(state){
 const root=state.root;
 previewInteractions(root);
 root.addEventListener("input",event=>{
  if(event.target.closest("form[data-json-studio-edit]"))markDirty(state);
 });
 root.addEventListener("change",event=>{
  if(event.target.closest("form[data-json-studio-edit]"))markDirty(state);
 });
 root.addEventListener("submit",async event=>{
  const form=event.target;
  if(!form.matches("form[data-json-studio-edit],form[data-json-studio-add]"))return;
  event.preventDefault();
  try{
   if(form.matches("form[data-json-studio-edit]")){
    state.formDirty=true;applyAndDraw(state);
    alertMessage(state,"Alterações aplicadas à cópia. Use Salvar rascunho para mantê-las após sair.");
   }else{
    commitForm(state);
    const type=String(new FormData(form).get("type")||"");
    const previousIds=new Set(state.lesson.blocks.map(b=>b.id));
    state.lesson=updateLesson(state.lesson,"add-block",{type,afterId:state.panel==="block"?state.selectedId:null});
    state.selectedId=state.lesson.blocks.find(b=>!previousIds.has(b.id))?.id||null;
    state.panel="block";state.dirty=true;state.formDirty=false;state.reviewPlan=null;state.reviewChecks=new Set();draw(state);
    alertMessage(state,"Novo bloco criado. Edite seu conteúdo e salve o rascunho.");
   }
  }catch(error){alertMessage(state,error?.message||"Não foi possível aplicar alterações.",true)}
 });
 root.addEventListener("click",async event=>{
  const pick=event.target.closest("[data-json-studio-pick]");
  const panel=event.target.closest("[data-json-studio-panel]");
  const op=event.target.closest("[data-json-studio-block-action]");
  const action=event.target.closest("[data-json-studio-action]");
  if(!pick&&!panel&&!op&&!action)return;
  try{
   if(action){
    const cmd=action.dataset.jsonStudioAction;
    if(cmd==="save"){await save(state);return}
    if(cmd==="export"){exportDraft(state);return}
    if(cmd==="analyse"){await analysePublication(state);return}
    if(cmd==="download-review"){
     const plan=state.reviewPlan;
     if(!plan||!plan.report.requiredReview.every(item=>state.reviewChecks.has(item.id)))
      throw Error("Confirme todos os itens de revisão antes de baixar.");
     const filename="atelie-revisao-"+safeFile(state.lesson.id)+".zip";
     const info=downloadReviewZIP(plan.files,filename);
     alertMessage(state,"Pacote "+info.filename+" preparado ("+Math.ceil(info.bytes/1024)+" KB). Nada foi publicado.");
     return;
    }
    if(cmd==="discard"){
     if(!confirm("Descartar o rascunho deste navegador? A cópia publicada, se existir, não será alterada."))return;
     await deleteDraft(state.lesson.courseId,state.lesson.id);
     if(state.published){
      state.lesson=startLessonDraft(state.published);state.savedAt=null;state.panel="details";
      state.selectedId=null;state.dirty=false;state.formDirty=false;
      state.message="Rascunho descartado. A cópia de edição foi restaurada a partir da aula publicada.";
      draw(state);
     }else{activeStudio=null;location.hash="#/laboratorio/editor";}
     return;
    }
   }
   commitForm(state);
   if(pick){state.selectedId=pick.dataset.jsonStudioPick;state.panel="block";}
   else if(panel){state.panel=panel.dataset.jsonStudioPanel;}
   else if(op){
    const id=op.dataset.blockId,kind=op.dataset.jsonStudioBlockAction;
    if(kind==="remove"&&!confirm("Excluir este bloco da sua cópia de trabalho?"))return;
    if(kind==="remove"){
     state.lesson=updateLesson(state.lesson,"remove-block",{blockId:id});
     if(state.selectedId===id)state.selectedId=null;
    }else if(kind==="duplicate"){
     const idx=state.lesson.blocks.findIndex(b=>b.id===id);
     state.lesson=updateLesson(state.lesson,"duplicate-block",{blockId:id});
     state.selectedId=state.lesson.blocks[idx+1]?.id||null;
     state.panel="block";
    }else if(kind==="move-up"||kind==="move-down"){
     state.lesson=updateLesson(state.lesson,"move-block",{blockId:id,direction:kind==="move-up"?-1:1});
    }else return;
    state.dirty=true;state.reviewPlan=null;state.reviewChecks=new Set();
   }
   draw(state);
  }catch(error){alertMessage(state,error?.message||"Operação não concluída.",true)}
 });
 root.addEventListener("change",async event=>{
  const checkbox=event.target.closest("input[data-json-studio-review]");
  if(checkbox&&state.reviewPlan){
   const id=checkbox.dataset.jsonStudioReview;
   const review=state.reviewPlan.report.requiredReview;
   if(!review.some(item=>item.id===id))return;
   if(checkbox.checked)state.reviewChecks.add(id);
   else state.reviewChecks.delete(id);
   const btn=root.querySelector('[data-json-studio-action="download-review"]');
   if(btn)btn.disabled=!review.every(item=>state.reviewChecks.has(item.id));
   const counter=root.querySelector("[data-json-studio-review-count]");
   if(counter)counter.textContent=state.reviewChecks.size+" de "+review.length+" itens confirmados";
   return;
  }
  if(!event.target.matches("input[data-json-studio-import]"))return;
  const input=event.target,file=input.files?.[0];
  if(!file)return;
  if(file.size>2*1024*1024){alertMessage(state,"O arquivo JSON não pode superar 2 MB.",true);return}
  try{
   if(state.dirty||state.formDirty){
    if(!confirm("Substituir as alterações não salvas pelo JSON selecionado?"))return;
   }
   const imported=JSON.parse(await file.text());
   validateLesson(imported);
   if(imported.id!==state.lesson.id||imported.courseId!==state.course.id||
      imported.moduleId!==state.lesson.moduleId)throw Error("O arquivo não pertence a esta aula. IDs e vínculo com o módulo devem coincidir.");
   state.lesson={...clone(imported),status:"draft"};
   state.panel="details";state.selectedId=null;state.dirty=true;state.formDirty=false;
   state.reviewPlan=null;state.reviewChecks=new Set();
   state.message="JSON importado para a cópia local. Confira e salve antes de sair.";
   draw(state);
  }catch(error){alertMessage(state,error?.message||"Não foi possível importar este JSON.",true)}
 });
}
async function showDashboard(root){
 const catalog=await readPilotCatalog();
 const rows=await Promise.all(catalog.map(entry=>readPilotCourse(entry.id)));
 let drafts=[],storageIssue="";
 try{drafts=await listDrafts()}catch(error){storageIssue="Não foi possível consultar rascunhos locais: "+error.message}
 if(root.isConnected)renderDashboard(root,rows,drafts,storageIssue);
}
async function showNew(root,courseId,moduleId){
 const {course}=await readPilotCourse(courseId);
 const module=course.modules.find(m=>m.id===moduleId);
 if(!module)throw Error("Módulo de autoria não encontrado.");
 if(!root.isConnected)return;
 root.innerHTML=formNew(course,module);
 root.querySelector("form[data-json-studio-new]").addEventListener("submit",async event=>{
  event.preventDefault();
  const form=event.currentTarget,msg=root.querySelector("[data-json-studio-new-message]");
  try{
   const name=String(new FormData(form).get("title")||"").trim();
   const {lesson}=createLesson({...course,status:"draft"},moduleId,name);
   await saveDraft(course.id,lesson);
   location.hash=linkEdit(course.id,lesson.id);
  }catch(error){if(msg){msg.textContent=error?.message||"Não foi possível criar a aula.";msg.dataset.error="true"}}
 });
}
async function showEdit(root,courseId,lessonId){
 const {course,courseURL}=await readPilotCourse(courseId);
 const listed=course.modules.some(m=>m.lessons.some(l=>l.id===lessonId));
 const published=listed?await readPilotLesson(courseId,lessonId):null;
 let stored=null,storageError="";
 try{stored=await getDraft(courseId,lessonId)}
 catch(error){storageError="Armazenamento local indisponível. Você ainda pode editar e exportar JSON, mas não poderá salvar um rascunho aqui."}
 if(!stored&&!published)throw Error("Aula não encontrada no manifesto nem nos rascunhos deste navegador.");
 const lesson=stored?.lesson?clone(stored.lesson):startLessonDraft(published.lesson);
 validateLesson(lesson);
 if(lesson.id!==lessonId||lesson.courseId!==course.id||lesson.status!=="draft"||
   !course.modules.some(m=>m.id===lesson.moduleId))throw Error("Rascunho local incompatível com a estrutura do curso.");
 if(published&&lesson.moduleId!==published.lesson.moduleId)throw Error("O módulo da aula foi alterado indevidamente.");
 if(!root.isConnected)return;
 const safeSlug=/^[a-z0-9_-]+$/i.test(lesson.slug)?lesson.slug:"aula-temporaria";
 const sourceURL=published?.lessonURL.href||new URL("./aulas/"+safeSlug+".json",courseURL).href;
 const state={root,course,lesson,published:published?.lesson||null,sourceURL,savedAt:stored?.savedAt||null,
  panel:"details",selectedId:null,dirty:false,formDirty:false,message:storageError,hash:location.hash,
  reviewPlan:null,reviewChecks:new Set()};
 activeStudio=state;
 draw(state);wireEditor(state);
}
export async function mountJSONStudio(root,hash=location.hash){
 if(!root?.isConnected)return;
 activeStudio=null;
 root.innerHTML='<p role="status" class="json-pilot-loading">Abrindo Estúdio Visual JSON…</p>';
 try{
  const selection=parseStudioSelection(hash);
  if(selection.error)throw Error(selection.error);
  if(selection.mode==="dashboard")await showDashboard(root);
  else if(selection.mode==="new")await showNew(root,selection.courseId,selection.moduleId);
  else await showEdit(root,selection.courseId,selection.lessonId);
 }catch(error){
  if(!root.isConnected)return;
  root.innerHTML=header("Editor indisponível","Não foi possível carregar este rascunho.")+
   '<p role="alert" class="json-studio-error">'+escapeHTML(error?.message||"Erro inesperado.")+'</p>'+
   '<a class="btn btn-outline" href="#/laboratorio/editor">Voltar ao painel de edição</a>';
 }
}
// O app principal consulta este guardião antes de trocar de rota.
// Em testes Node, a ausência de window não deve causar efeitos colaterais.
if(typeof window!=="undefined"){
window.AtelieJSONStudio={
 canNavigate(nextHash){
  const state=activeStudio;
  if(!state?.root.isConnected)return true;
  if(nextHash===state.hash)return !(state.dirty||state.formDirty);
  if(!state.dirty&&!state.formDirty){activeStudio=null;return true}
  if(window.confirm("Há alterações não salvas no Estúdio JSON. Sair e descartá-las?")){
   activeStudio=null;return true;
  }
  if(location.hash!==state.hash)location.hash=state.hash;
  return false;
 }
};
window.addEventListener("beforeunload",event=>{
 if(activeStudio?.root.isConnected&&(activeStudio.dirty||activeStudio.formDirty)){
  event.preventDefault();event.returnValue="";
 }
});
}
