'use strict';
// Ateliê · Beta funcional. Todos os textos das aulas abaixo são EXEMPLOS originais,
// não representam a migração das aulas publicadas no repositório Atelie.
const COURSES = [
  {status:'draft',slug:'introducao-a-psicanalise',title:'Introdução à Psicanálise',subtitle:'Primeiros encontros com a escuta',description:'Conheça a estrutura de uma aula, um exercício e seu caderno de estudos. O conteúdo é apenas ilustrativo.',image:'assets/cover-intro.svg',lesson:'escuta',label:'1 aula ilustrativa'},
  {status:'published',slug:'formacao-freudiana',title:'Formação Freudiana',subtitle:'Estudo sistemático da obra de Sigmund Freud',description:'Duas aulas interativas: A escuta que mudou a clínica e A primeira tópica de Freud.',image:'assets/cover-freud.svg',lesson:'escuta-que-mudou-a-clinica',label:'2 aulas disponíveis'},
  {status:'draft',slug:'fundamentos-da-psicanalise',title:'Fundamentos da Psicanálise',subtitle:'Conflitos e sentidos possíveis',description:'Experimente o formato de leitura, quiz, anotações e acompanhamento do próprio estudo.',image:'assets/cover-fundamentos.svg',lesson:'conflito-exemplo',label:'1 aula ilustrativa'}
];
/* Cursos demonstrativos ficam arquivados no código. Novos cursos aparecem
   no catálogo assim que forem publicados e receberem módulos/links. */
const PUBLISHED_COURSES=()=>COURSES.filter(c=>c.status==='published');
const LESSONS = {
  'escuta-que-mudou-a-clinica':{course:1,title:'A escuta que mudou a clínica',minutes:35,prompt:'Como surgiu uma nova forma de escutar?',intro:'Uma aula interativa em nove etapas sobre Freud, Breuer e Anna O.',topic:'As origens da psicanálise',text:'Leia, explore e responda para avançar.',quiz:{question:'Interação dentro da aula',options:[],answer:0,explanation:''}},
  escuta:{course:0,title:'A escuta começa por uma pergunta',minutes:8,prompt:'O que muda quando, em vez de responder imediatamente, alguém faz uma pergunta?',intro:'Imagine uma conversa fictícia: uma pessoa conta que sempre adia decisões importantes. Em vez de oferecer uma receita de organização, seu interlocutor pergunta o que costuma acontecer justamente antes do adiamento. A intenção não é descobrir uma resposta correta, mas abrir espaço para que a experiência seja formulada.',topic:'Escutar não é apenas ouvir',text:'Uma escuta atenta acompanha as palavras, as pausas e o modo como a pessoa constrói suas próprias perguntas. Isso não significa atribuir um sentido secreto a cada frase. O exemplo serve apenas para ilustrar como uma aula pode combinar leitura e reflexão.',quiz:{question:'Nesta situação fictícia, qual atitude representa melhor a ideia apresentada?',options:['Oferecer rapidamente uma solução universal.','Investigar com curiosidade o que a pessoa diz de sua experiência.','Determinar um diagnóstico a partir de um único exemplo.'],answer:1,explanation:'A alternativa destaca a investigação sem impor explicações prontas. É um exercício didático, não um critério clínico.'}},
  'primeira-topica-freud':{course:1,title:'A primeira tópica de Freud',minutes:25,prompt:'Como estudar um autor sem transformar seus textos em respostas definitivas?',intro:'Pense em uma leitora que encontra uma hipótese de Freud e decide registrar duas coisas: o problema que ele procurava investigar e as dúvidas que o texto ainda provoca. Nesse exercício, a leitura vira um percurso, não uma coleção de frases para decorar.',topic:'Estudar é contextualizar',text:'Uma formação cuidadosa pode comparar momentos de uma obra, investigar mudanças de conceitos e distinguir afirmações históricas de discussões atuais. Nesta demonstração, praticamos o formato de uma aula com pergunta, leitura breve e revisão.',quiz:{question:'Qual é uma boa prática ao começar a estudar a obra de um autor?',options:['Examinar o contexto e as questões que motivaram o texto.','Tratar todas as ideias do autor como imutáveis.','Dispensar a leitura e memorizar citações isoladas.'],answer:0,explanation:'Contextualizar permite compreender o problema investigado e acompanhar eventuais mudanças conceituais.'}},
  'conflito-exemplo':{course:2,title:'Quando duas vontades se encontram',minutes:7,prompt:'É possível desejar duas coisas difíceis de conciliar?',intro:'Em uma situação inventada, alguém quer aceitar uma oportunidade profissional e, ao mesmo tempo, teme se afastar de pessoas importantes. Não basta dizer que uma vontade é verdadeira e a outra é falsa: a experiência pode ser mais complexa.',topic:'Uma tensão não é uma conclusão',text:'O exemplo permite experimentar como uma aula organiza uma vinheta, uma pergunta conceitual e uma pequena atividade. A análise de casos reais exige contexto, ética e cuidado; este texto não pretende oferecer interpretação clínica.',quiz:{question:'O que esse exemplo procura demonstrar?',options:['Que uma escolha sempre revela uma doença.','Que qualquer conflito tem solução imediata.','Que desejos e preocupações podem coexistir em tensão.'],answer:2,explanation:'O exemplo ilustra uma tensão entre possibilidades, sem pressupor diagnóstico ou explicação definitiva.'}}
};
const $=(s,root=document)=>root.querySelector(s);
const icon=n=>'<svg aria-hidden="true"><use href="#i-'+n+'"></use></svg>';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STORE='ateliepsi-beta-state-v1';
const empty=()=>({saved:[],completed:[],notes:{},answers:{},drafts:{},updatedAt:0});
function normalize(value){
 const o=empty();if(!value||typeof value!=='object')return o;
 o.saved=Array.isArray(value.saved)?value.saved.filter(s=>COURSES.some(c=>c.slug===s)):[];
 o.completed=Array.isArray(value.completed)?value.completed.filter(id=>Object.hasOwn(LESSONS,id)):[];
 for(const field of ['notes','answers','drafts'])if(value[field]&&typeof value[field]==='object'&&!Array.isArray(value[field])){
  for(const [key,val] of Object.entries(value[field]))if(Object.hasOwn(LESSONS,key)){
   if(field==='notes'&&typeof val==='string')o.notes[key]=val.slice(0,5000);
   if(field==='answers'&&Number.isInteger(val)&&val>=0&&val<LESSONS[key].quiz.options.length)o.answers[key]=val;
   if(field==='drafts'&&val&&typeof val==='object')o.drafts[key]={title:String(val.title??'').slice(0,120),intro:String(val.intro??'').slice(0,4000),text:String(val.text??'').slice(0,5000)};
  }
 }
 if(Number.isSafeInteger(value.updatedAt) && value.updatedAt>=0)o.updatedAt=value.updatedAt;
 return o;
}
// Progresso permanente não vem de localStorage: o servidor é a fonte de verdade.
let activeUid=null;
let demoMode=true;
let state=empty();
let appCloudLoaded=false;
let courseFilter='all';
let cloudMessage='';
let syncing=false;
let pendingAccountSave=false;
let savingAccountVersion=0;
let syncTimer=null;
let conflict=null;
let personalProfile=null;
let personalProfileStatus='signed-out';
let profileNotice='';
const pendingLessonWrites=new Map();
const writingLessonIds=new Set();
let accountGeneration=0;
function updateEntryGate(){
 const shell=$('#shell');if(shell)shell.hidden=false;
 const skip=$('#skipLink');if(skip)skip.href='#main';
}
function enterDemo(){render()}
function exitDemo(){render()}
function queueCloudSync(delay=350){
 clearTimeout(syncTimer);
 if(!pendingAccountSave||!activeUid||!appCloudLoaded||!window.AtelieCloud?.ready)return;
 const uid=activeUid;
 syncTimer=setTimeout(async()=>{
  if(uid!==activeUid||!window.AtelieCloud?.ready||!pendingAccountSave||syncing)return;
  syncing=true;
  const version=savingAccountVersion,copy=JSON.parse(JSON.stringify(state));
  cloudMessage='Salvando seus estudos na conta Google...';
  renderStatus();
  try{
   await window.AtelieCloud.save(copy);
   if(uid!==activeUid)return;
   if(version===savingAccountVersion)pendingAccountSave=false;
   cloudMessage=pendingAccountSave?'Há alterações aguardando sincronização.':'Progresso salvo no Firestore da sua conta Google.';
  }catch(error){
   if(uid===activeUid){
    cloudMessage='O Firestore não confirmou o salvamento ('+String(error.code||error.message||'erro')+'). Não saia desta página; tente novamente com conexão.';
   }
  }finally{
   syncing=false;renderStatus();
   if(uid===activeUid&&pendingAccountSave&&version!==savingAccountVersion)queueCloudSync(100);
  }
 },delay);
}
function saveState(){
 if(!activeUid||!appCloudLoaded){
  cloudMessage='Entre com Google e carregue sua conta para salvar alterações.';
  renderStatus();
  return;
 }
 state.updatedAt=Math.max(Date.now(),(state.updatedAt||0)+1);
 savingAccountVersion++;
 pendingAccountSave=true;
 queueCloudSync();
 updateSavedCounter();
 renderStatus();
}
function updateSavedCounter() {
 const el = $('#savedCount');
 if (el) el.textContent = String(state.saved.filter(slug=>PUBLISHED_COURSES().some(c=>c.slug===slug)).length);
}
function renderStatus() {
 const el = $('#cloudStatus');
 if(el)el.textContent=!activeUid?'Entre com Google para salvar o progresso.':
  !appCloudLoaded?'Carregando o progresso da sua conta...':
  pendingAccountSave?(syncing?'Salvando no Firestore...':'Salvamento pendente — não confirmado no Firestore.'):
  cloudMessage||'Progresso vinculado à sua conta Google.';
 const btn = $('#loginButton');
 if (btn) btn.textContent = activeUid ? 'Sair da conta' : 'Acesso local';
 const profileLink=$('#accountShortcut');
 if(profileLink){
  profileLink.textContent=activeUid?(personalProfile?.preferredName||window.AtelieCloud?.user?.displayName?.split(' ')[0]||'Meu perfil'):'Entrar com Google';
  profileLink.setAttribute('aria-label',activeUid?'Abrir meu perfil':'Entrar com Google e abrir meu perfil');
 }
 const actions = $('#syncConflict');
 if (actions) actions.hidden = !conflict;
}
function lesson(id){return {...LESSONS[id],...(state.drafts[id]||{})}}
function getCourse(id){return COURSES.find(c=>c.slug===id)}
function courseIsComplete(c){
 const available=(ATELIE_COURSE_MODULES[c.slug]||[]).flatMap(m=>m.lessons.filter(l=>l.href&&l.id).map(l=>l.id));
 const ids=available.length?available:[c.lesson];
 return ids.length>0&&ids.every(id=>state.completed.includes(id));
}
function courseCard(c){const done=courseIsComplete(c);return '<article class="course-card"><a href="#/curso/'+c.slug+'" class="course-visual" aria-label="Abrir '+esc(c.title)+'"><img alt="" src="'+c.image+'" loading="lazy"><span class="pill">'+(done?'Concluído':(c.slug==='formacao-freudiana'?'Aula disponível':'Aula demonstrativa'))+'</span></a><div class="course-body"><h3><a href="#/curso/'+c.slug+'">'+esc(c.title)+'</a></h3><p>'+esc(c.description)+'</p><div class="course-meta"><span class="meta-left">'+icon(done?'check':'graduation')+esc(c.label)+'</span><a class="circle-link" href="#/curso/'+c.slug+'" aria-label="Abrir '+esc(c.title)+'">'+icon('arrow')+'</a></div></div></article>'}
function heading(k,t,sub){return '<header class="page-heading"><span class="eyebrow">'+esc(k)+'</span><h1>'+esc(t)+'</h1><p>'+esc(sub)+'</p></header>'}
function home(){return '<section class="hero"><div class="hero-copy"><span class="eyebrow">ATELIÊ · VERSÃO BETA</span><h1>Estudo e formação em psicanálise</h1><div class="mini-rule"></div><p>Um espaço para ler, pensar e construir perguntas. A Formação Freudiana já conta com duas aulas interativas publicadas. Os demais cursos e recursos continuam em desenvolvimento.</p><div class="hero-buttons"><a href="#/cursos" class="btn btn-primary">'+icon('layers')+' Explorar cursos</a><a href="#/progresso" class="btn btn-outline">'+icon('route')+' Meu progresso</a></div></div></section><section><div class="section-bar"><h2>Cursos disponíveis</h2><a class="section-link" href="#/cursos">Ver catálogo '+icon('arrow')+'</a></div><div class="course-grid">'+PUBLISHED_COURSES().map(courseCard).join('')+'</div></section><section class="feature-strip"><div class="feature">'+icon('book')+'<a href="#/cursos"><h3>Aprendizagem interativa</h3><p>Vídeos, leituras e atividades para aprofundar o estudo.</p></a></div><div class="feature">'+icon('notebook')+'<a href="#/caderno"><h3>Caderno</h3><p>Escreva e retome suas anotações.</p></a></div><div class="feature">'+icon('graduation')+'<a href="#/estudio"><h3>Estúdio</h3><p>Experimente editar uma aula localmente.</p></a></div></section>'}
function courses(q=''){const filtered=PUBLISHED_COURSES().filter(c=>[c.title,c.subtitle,c.description].join(' ').toLocaleLowerCase('pt-BR').includes(q.toLocaleLowerCase('pt-BR'))&&(courseFilter==='all'||(courseFilter==='saved'&&state.saved.includes(c.slug))||(courseFilter==='completed'&&courseIsComplete(c))));return heading('CATÁLOGO','Cursos e percursos','As origens da escuta psicanalítica e a primeira tópica de Freud já podem ser estudadas dentro da Formação Freudiana. Outros conteúdos estão em desenvolvimento.')+'<div class="filter-bar" role="group" aria-label="Filtrar catálogo">'+[['all','Todos'],['saved','Salvos'],['completed','Concluídos']].map(([v,t])=>'<button class="filter" data-filter="'+v+'" aria-pressed="'+(courseFilter===v)+'">'+t+'</button>').join('')+'</div>'+(filtered.length?'<div class="course-grid">'+filtered.map(courseCard).join('')+'</div>':'<div class="empty"><h2>Sem resultados</h2><p>Experimente outro filtro ou outra busca.</p><a class="btn btn-primary" href="#/cursos">Ver todos</a></div>')}


const FREUD_PROGRAM=['A escuta que mudou a clínica','A primeira tópica de Freud'];
const FREUD_COURSE_ROUTE='#/curso/formacao-freudiana';
const FREUD_FIRST_ID='escuta-que-mudou-a-clinica',FREUD_SECOND_ID='primeira-topica-freud';
const FREUD_LESSONS=[
 {id:FREUD_FIRST_ID,title:FREUD_PROGRAM[0],route:'#/aula/'+FREUD_FIRST_ID,stages:6,file:'escuta-que-mudou-a-clinica.html'},
 {id:FREUD_SECOND_ID,title:FREUD_PROGRAM[1],route:'#/aula/'+FREUD_SECOND_ID,stages:3,file:'primeira-topica.html'}
];
const FREUD_LESSON_ROUTE=FREUD_LESSONS[0].route;
function freudCourseView(c){
 const saved=state.saved.includes(c.slug),done=FREUD_LESSONS.filter(l=>state.completed.includes(l.id)).length;
 return '<div class="course-heading freud-course-heading"><div><a class="back-link" href="#/cursos">← Voltar aos cursos</a>'+
 '<div style="margin-top:25px"><span class="eyebrow">FORMAÇÃO FREUDIANA · PERCURSO DE ESTUDOS</span></div>'+
 '<h1>'+esc(c.title)+'</h1><p>'+esc(c.description)+'</p>'+
 '<p class="muted-note">2 aulas disponíveis · '+done+' de 2 concluídas</p>'+
 '<div class="course-actions"><button class="saved-btn" data-save="'+c.slug+'" aria-pressed="'+saved+'">'+icon(saved?'check':'heart')+
 (saved?'Curso salvo':'Salvar curso')+'</button><a class="btn btn-primary" href="'+FREUD_LESSON_ROUTE+'">'+icon('book')+' Começar aula 01</a></div></div>'+
 '<img src="assets/cover-freud.svg" alt="Capa da Formação Freudiana"></div>'+
 '<div class="section-bar"><h2>Programa do curso</h2><span class="freud-program-caption">Aulas organizadas em sequência</span></div>'+
 courseProgramAccordion(c.slug)+
 '<p class="freud-course-disclaimer">As aulas disponíveis são experiências independentes. A conclusão das etapas não certifica o curso completo.</p>';
}
function freudLessonView(id=FREUD_FIRST_ID){
 const i=FREUD_LESSONS.findIndex(l=>l.id===id);if(i<0)return notFound();
 const l=FREUD_LESSONS[i],prev=FREUD_LESSONS[i-1],next=FREUD_LESSONS[i+1];
 const intro='Assista ao vídeo, explore os sistemas psíquicos e responda aos desafios para avançar.';
 const videoFirst=i===0;
 const progress=videoFirst?'<div class="freud-live-progress" id="freudLiveProgress" aria-label="Progresso das atividades da aula">'+
  '<div class="freud-live-heading"><span>Seu progresso na aula</span><strong id="freudLiveCount">0 de 6 etapas</strong></div>'+
  '<div class="freud-progress-segments" id="freudLiveSegments" role="progressbar" aria-label="Etapas concluídas" aria-valuemin="0" aria-valuemax="6" aria-valuenow="0">'+
  Array.from({length:6},(_,n)=>'<span data-progress-step="'+n+'" aria-hidden="true"></span>').join('')+'</div></div>':'';
 const backlink=videoFirst?'':'<a class="back-link" href="'+FREUD_COURSE_ROUTE+'">← Voltar à Formação Freudiana</a>';
 const heading=videoFirst?
  '<header class="freud-lesson-heading freud-opening-heading"><h1>'+esc(l.title)+'</h1></header>':
  '<header class="freud-lesson-heading"><span class="eyebrow">FORMAÇÃO FREUDIANA · AULA '+String(i+1).padStart(2,'0')+
  ' DE 11</span><h1>'+esc(l.title)+'</h1><p>'+esc(intro)+'</p></header>';
 return '<div class="freud-reading'+(videoFirst?' freud-video-first':'')+'">'+backlink+heading+progress+
  '<iframe class="freud-lesson-frame" id="freudLessonFrame" src="content/courses/formacao-freudiana/aulas/'+l.file+
  '?v=linha-do-tempo-sanfona-20261110-v1" title="Aula interativa '+esc(l.title)+
  '" loading="eager" scrolling="no" referrerpolicy="strict-origin-when-cross-origin"></iframe>'+
  (videoFirst?'<div id="freudLessonExtras" hidden>':'')+
  '<section class="freud-note-panel"><span class="eyebrow">MEU CADERNO</span><h2>Registre suas reflexões</h2>'+
  '<label class="form-label" for="lessonNote">O que você gostaria de guardar desta aula?</label>'+
  '<textarea id="lessonNote" data-note="'+l.id+'" maxlength="5000" rows="5" placeholder="Escreva suas dúvidas, ideias e associações...">'+
  esc(state.notes[l.id]||'')+'</textarea><p class="muted-note" id="noteSaveStatus">Suas anotações são salvas no Ateliê.</p></section>'+
  '<nav class="lesson-controls" aria-label="Navegação entre aulas">'+
  (prev?'<a class="btn btn-outline" href="'+prev.route+'">← Aula anterior: '+esc(prev.title)+'</a>':'')+
  (next?'<a class="btn btn-primary" href="'+next.route+'">Próxima aula: '+esc(next.title)+' →</a>':'')+
  '</nav>'+(videoFirst?'</div>':'')+'</div>';
}
/* Menu de cursos com módulos expansíveis — mantém as rotas existentes das aulas.
 * Os títulos seguem os programas do acervo; itens sem página no app não fingem ser links.
 */
/* Estrutura expansível para futuros cursos; só aulas com página publicada. */
const ATELIE_COURSE_MODULES={
 'formacao-freudiana':[
  {title:'As origens da investigação freudiana',lessons:[
   {title:'A escuta que mudou a clínica',href:'#/aula/escuta-que-mudou-a-clinica',id:'escuta-que-mudou-a-clinica'}]},
  {title:'A primeira tópica de Freud',lessons:[
   {title:'A primeira tópica de Freud',href:'#/aula/primeira-topica-freud',id:'primeira-topica-freud'}]}
 ]
};
let selectedCourseSlug='formacao-freudiana';
const courseMenuOpenModules=new Set();
function inferSidebarCourse(path){
 if(path.startsWith('/curso/')){
  const slug=path.split('/')[2];
  return PUBLISHED_COURSES().some(c=>c.slug===slug)?slug:null;
 }
 if(path.startsWith('/cursos/curso-formacao-freudiana'))return 'formacao-freudiana';
 if(path.startsWith('/aula/')){
  const id=path.split('/')[2];
  if(id===FREUD_FIRST_ID||id===FREUD_SECOND_ID)return 'formacao-freudiana';
  const item=LESSONS[id];
  return item?COURSES[item.course]?.slug:null;
 }
 return null;
}
function courseModulesMarkup(slug,path){
 const modules=(ATELIE_COURSE_MODULES[slug]||[]).filter(m=>m.lessons.some(l=>l.href));
 return '<div class="course-drawer-modules" aria-label="Módulos e aulas">'+modules.map((m,i)=>{
  const key=slug+':'+i;
  const active=m.lessons.some(l=>l.href?.startsWith('#')&&l.href==='#'+path);
  const opened=courseMenuOpenModules.has(key)||active||(!courseMenuOpenModules.size&&i===0);
  return '<details class="course-drawer-module" data-course-module="'+esc(key)+'"'+(opened?' open':'')+'>'+
   '<summary><span class="course-drawer-module-label">Módulo '+String(i+1).padStart(2,'0')+'</span>'+
   '<span class="course-drawer-module-title">'+esc(m.title)+'</span>'+
   '<span class="course-drawer-chevron" aria-hidden="true">'+icon('chevron')+'</span></summary>'+
   '<div class="course-drawer-module-content">'+
   (m.lessons.length?m.lessons.map((l,j)=>{
    const isCurrent=l.href?.startsWith('#')&&l.href==='#'+path;
    const done=l.id&&state.completed.includes(l.id);
    const status=done?'Concluída':l.note||(l.href?'Aula disponível':'Em preparação');
    if(!l.href)return '<div class="course-drawer-lesson unavailable"><span class="course-drawer-lesson-no">'+String(j+1).padStart(2,'0')+'</span>'+
     '<span><strong>'+esc(l.title)+'</strong><small>'+esc(status)+'</small></span></div>';
    return '<a class="course-drawer-lesson'+(isCurrent?' is-current':'')+'" href="'+esc(l.href)+'"'+(isCurrent?' aria-current="page"':'')+'>'+
     '<span class="course-drawer-lesson-no">'+(done?'✓':String(j+1).padStart(2,'0'))+'</span>'+
     '<span><strong>'+esc(l.title)+'</strong><small>'+esc(status)+'</small></span></a>';
   }).join(''):'<p class="course-drawer-pending">Aulas em preparação</p>')+
   '</div></details>';
 }).join('')+'</div>';
}
function courseProgramAccordion(slug){
 const modules=(ATELIE_COURSE_MODULES[slug]||[]).filter(m=>m.lessons.some(l=>l.href));
 return '<div class="course-program-accordion" aria-label="Programa do curso por módulos">'+modules.map((m,i)=>{
  return '<details class="course-program-module"'+(i===0?' open':'')+'>'+
   '<summary><span class="course-program-module-no">'+String(i+1).padStart(2,'0')+'</span>'+
   '<span class="course-program-module-copy"><small>MÓDULO '+String(i+1).padStart(2,'0')+'</small>'+
   '<strong>'+esc(m.title)+'</strong><em>'+(!m.lessons.length?'Conteúdo em preparação':m.lessons.filter(l=>l.href).length+' aula(s) acessível(is)')+'</em></span>'+
   '<span class="course-program-chevron" aria-hidden="true">'+icon('chevron')+'</span></summary>'+
   '<div class="course-program-lessons">'+
   (m.lessons.length?m.lessons.map((l,j)=>{
    const done=l.id&&state.completed.includes(l.id);
    return '<div class="course-program-lesson">'+
     '<span class="course-program-lesson-no">'+String(j+1).padStart(2,'0')+'</span>'+
     '<div><strong>'+esc(l.title)+'</strong><small>'+esc(done?'Concluída':l.note||(l.href?'Disponível':'Em preparação'))+'</small></div>'+
     (l.href?'<a href="'+esc(l.href)+'" class="course-program-open">'+(done?'Rever':'Estudar')+' '+icon('arrow')+'</a>':'<span class="course-program-unavailable">Em preparação</span>')+
     '</div>';
   }).join(''):'<p class="course-program-empty">Novas aulas serão adicionadas a este módulo.</p>')+
   '</div></details>';
 }).join('')+'</div>';
}
function renderCourseNavigation(path=parseRoute().path,preserveSelectedCourse=false){
 const container=$('#courseContextNav');if(!container)return;
 const context=inferSidebarCourse(path);
 if(context&&!preserveSelectedCourse)selectedCourseSlug=context;
 if(!PUBLISHED_COURSES().some(c=>c.slug===selectedCourseSlug))selectedCourseSlug=PUBLISHED_COURSES()[0]?.slug||'formacao-freudiana';
 const slug=selectedCourseSlug;
 container.hidden=false;
 container.innerHTML='<div class="course-drawer-picker"><label for="sidebarCourseSelect">Selecione o curso</label>'+
  '<div class="course-drawer-select-wrap"><select id="sidebarCourseSelect" aria-label="Selecione o curso">'+
  PUBLISHED_COURSES().map(c=>'<option value="'+esc(c.slug)+'"'+(c.slug===slug?' selected':'')+'>'+esc(c.title)+'</option>').join('')+
  '</select>'+icon('chevron')+'</div>'+
  '<a class="course-drawer-overview" href="#/curso/'+esc(slug)+'">Visão geral do curso '+icon('arrow')+'</a></div>'+
  courseModulesMarkup(slug,path);
}
function courseView(slug){
 const c=getCourse(slug);if(!c||c.status!=='published')return notFound();
 if(slug==='formacao-freudiana')return freudCourseView(c);
 const l=lesson(c.lesson),isSaved=state.saved.includes(slug),done=state.completed.includes(c.lesson);
 return '<div class="course-heading"><div><a class="back-link" href="#/cursos">← Voltar aos cursos</a>'+
  '<div style="margin-top:25px"><span class="eyebrow">CURSO · DEMONSTRAÇÃO</span></div>'+
  '<h1>'+esc(c.title)+'</h1><p>'+esc(c.description)+'</p>'+
  '<p class="muted-note">Programa em desenvolvimento · '+(done?'1 aula concluída':'Aulas para conhecer')+'</p>'+
  '<div class="course-actions"><button class="saved-btn" data-save="'+c.slug+'" aria-pressed="'+isSaved+'">'+icon(isSaved?'check':'heart')+
  (isSaved?'Curso salvo':'Salvar curso')+'</button><a class="btn btn-primary" href="#/aula/'+c.lesson+'">'+icon('book')+' Abrir aula demonstrativa</a></div></div>'+
  '<img src="'+esc(c.image)+'" alt=""></div>'+
  '<div class="section-bar"><h2>Módulos do curso</h2><span class="freud-program-caption">Expanda para ver as aulas</span></div>'+
  courseProgramAccordion(slug);
}
function lessonView(id){if(id===FREUD_FIRST_ID||id===FREUD_SECOND_ID)return freudLessonView(id);if(!Object.hasOwn(LESSONS,id))return notFound();const l=lesson(id),c=COURSES[l.course],selected=state.answers[id],done=state.completed.includes(id),valid=Number.isInteger(selected);return '<div class="reading"><a class="back-link" href="#/curso/'+c.slug+'">← Voltar ao curso</a>'+heading('AULA ILUSTRATIVA',l.title,c.title+' · '+l.minutes+' minutos')+'<div class="notice"><strong>Conteúdo fictício para testes.</strong> Esta aula não foi importada de outro repositório e será substituída depois.</div><article class="reading-panel"><span class="eyebrow">PARA COMEÇAR</span><h2>'+esc(l.prompt)+'</h2><p>'+esc(l.intro)+'</p><div class="mini-rule"></div><h3>'+esc(l.topic)+'</h3><p>'+esc(l.text)+'</p></article><section class="reading-panel quiz-panel"><span class="eyebrow">ATIVIDADE · 1 PERGUNTA</span><h2>'+esc(l.quiz.question)+'</h2><div class="quiz-options">'+l.quiz.options.map((op,i)=>'<button class="quiz-option" type="button" data-answer="'+id+'" data-index="'+i+'" aria-pressed="'+(i===selected)+'">'+String.fromCharCode(65+i)+' · '+esc(op)+'</button>').join('')+'</div>'+(valid?'<p class="quiz-feedback" role="status"><strong>'+(selected===l.quiz.answer?'Resposta correta.':'Vamos pensar mais um pouco.')+'</strong> '+esc(l.quiz.explanation)+'</p>':'<p class="muted-note">Escolha uma alternativa para conferir a resposta.</p>')+'</section><section class="reading-panel"><span class="eyebrow">CADERNO DE ESTUDOS</span><h2>Suas anotações</h2><label for="lessonNote" class="form-label">O que você gostaria de registrar?</label><textarea id="lessonNote" data-note="'+id+'" maxlength="5000" rows="5" placeholder="Anote suas perguntas e ideias...">'+esc(state.notes[id]||'')+'</textarea><p class="muted-note" id="noteSaveStatus">Salvo automaticamente neste navegador'+(window.AtelieCloud?.user?' e na sua conta':'')+'.</p><div class="lesson-controls"><button type="button" class="btn btn-primary" data-complete="'+id+'">'+icon(done?'check':'graduation')+(done?'Marcar como não concluída':'Concluir aula')+'</button><a class="btn btn-outline" href="#/progresso">Meu progresso</a></div></section></div>'}

function studyIndex(){return PUBLISHED_COURSES().flatMap(c=>c.slug==='formacao-freudiana'?
 FREUD_LESSONS.map(l=>({id:l.id,title:l.title,course:c.title,route:l.route})):
 [{id:c.lesson,title:lesson(c.lesson).title,course:c.title,route:'#/aula/'+c.lesson}]);}
const ATELIE_BADGES=[
 {id:'escuta-que-mudou-a-clinica',title:'A escuta que mudou a clínica',image:'assets/insignia-escuta-que-mudou-a-clinica.webp',alt:'Insígnia roxa e dourada sobre a origem da escuta psicanalítica'},
 {id:'primeira-topica-freud',title:'A primeira tópica de Freud',image:'assets/insignia-primeira-topica-freud.png',alt:'Insígnia roxa e dourada com retrato de Freud'}
];
function studyStorageStatus(){
 if(!activeUid)return 'Entre com Google para consultar seu progresso pessoal.';
 if(!appCloudLoaded)return 'Carregando dados da sua conta Google...';
 if(pendingAccountSave||pendingLessonWrites.size||writingLessonIds.size)return 'Há alterações ainda não confirmadas pelo Firestore. Aguarde a confirmação antes de sair.';
 return 'Progresso e conquistas vinculados à sua conta Google no Firestore.';
}
function achievementsView(){
 const earned=ATELIE_BADGES.filter(b=>state.completed.includes(b.id)).length;
 return '<section class="personal-achievements" aria-labelledby="achievementTitle">'+
  '<div class="personal-achievements-heading"><div><span class="eyebrow">CONQUISTAS PESSOAIS</span>'+
  '<h2 id="achievementTitle">Minhas insígnias</h2></div>'+
  '<span class="achievement-summary">'+earned+' de '+ATELIE_BADGES.length+' conquistadas</span></div>'+
  '<p class="personal-achievement-note">'+esc(studyStorageStatus())+' As insígnias indicam conclusão de atividades, não certificação profissional.</p>'+
  '<div class="personal-badge-grid">'+ATELIE_BADGES.map(b=>{
   const unlocked=state.completed.includes(b.id);
   return '<article class="personal-badge-card'+(unlocked?' is-earned':'')+'">'+
    (unlocked?'<img loading="lazy" src="'+esc(b.image)+'" alt="'+esc(b.alt)+'" width="168" height="168">':
     '<div class="personal-badge-locked" aria-label="Insígnia ainda não conquistada">'+icon('graduation')+'</div>')+
    '<div><span class="personal-badge-state">'+(unlocked?'INSÍGNIA CONQUISTADA':'AINDA NÃO CONQUISTADA')+'</span>'+
    '<h3>'+esc(b.title)+'</h3><a href="#/aula/'+esc(b.id)+'" class="section-link">'+(unlocked?'Rever aula':'Estudar aula')+' '+icon('arrow')+'</a></div></article>';
  }).join('')+'</div></section>';
}
function progressView(){
 const all=studyIndex(),n=all.filter(l=>state.completed.includes(l.id)).length;
 return heading('MEU ESTUDO','Progresso',studyStorageStatus()+' Concluir uma aula não equivale a uma certificação profissional.')+
 '<div class="progress-head"><strong>'+n+' de '+all.length+'</strong><p>Aulas concluídas</p>'+
 '<div class="progress-bar" role="progressbar" aria-valuenow="'+n+'" aria-valuemin="0" aria-valuemax="'+all.length+
 '" aria-label="Aulas concluídas"><span style="width:'+(n/all.length*100)+'%"></span></div></div>'+
 '<div class="intro-grid">'+all.map(l=>'<article class="info-card"><span class="eyebrow">'+
 (state.completed.includes(l.id)?'CONCLUÍDA':'EM ABERTO')+'</span><h2>'+esc(l.course)+'</h2><p>'+esc(l.title)+
 '</p><a href="'+l.route+'" class="section-link">'+(state.completed.includes(l.id)?'Revisar aula':'Começar aula')+' '+icon('arrow')+'</a></article>').join('')+'</div>'+achievementsView();
}
function notebookView(){
 const all=studyIndex();
 return heading('MEU ESTUDO','Meu caderno','Anotações por aula vinculadas à sua conta Google.')+
 '<div class="intro-grid">'+all.map(l=>'<article class="info-card"><span class="eyebrow">'+esc(l.course)+'</span><h2>'+esc(l.title)+
 '</h2><p class="note-preview">'+esc(state.notes[l.id]?.trim()||'Você ainda não escreveu uma anotação nesta aula.')+
 '</p><a class="section-link" href="'+l.route+'">Abrir caderno '+icon('arrow')+'</a></article>').join('')+'</div>';
}

/* Importação pontual e voluntária: nunca usar esses dados antigos como
   origem do progresso durante o estudo. Só copiar com consentimento ao Firestore. */
const LEGACY_PROGRESS_KEYS=['atelie-escuta-seis-momentos-v1','atelie-primeira-topica-2026-v1'];
function hasLegacyProgress(){
 try{return LEGACY_PROGRESS_KEYS.some(key=>localStorage.getItem(key)!==null)}catch{return false}
}
function legacyTransferView(){
 if(!activeUid||!appCloudLoaded||!hasLegacyProgress())return '';
 return '<section class="personal-achievements" aria-labelledby="legacyTitle">'+
 '<span class="eyebrow">TRANSFERÊNCIA OPCIONAL</span><h2 id="legacyTitle">Progresso anterior neste dispositivo</h2>'+
 '<p>Detectamos etapas salvas pelo sistema antigo. Se elas forem suas, você pode transferi-las para a conta Google conectada. O Ateliê não substituirá um progresso já existente no Firestore.</p>'+
 '<button type="button" class="btn btn-outline" id="importLegacyProgress">Importar minhas etapas antigas</button>'+
 '<p class="profile-form-status" id="legacyImportStatus" role="status" aria-live="polite"></p></section>';
}
function readLegacy(key){
 try{const value=JSON.parse(localStorage.getItem(key)||'null');
  return value&&typeof value==='object'&&!Array.isArray(value)?value:null;
 }catch{return null}
}
function legacyEscuta(x){
 const keys=(v,max)=>Array.isArray(v)?[...new Set(v.filter(n=>Number.isInteger(n)&&n>=0&&n<max))]:[];
 const done=Array.isArray(x.done)?[...new Set(x.done.filter(n=>Number.isInteger(n)&&n>=1&&n<=6))]:[];
 const visited=readLegacy('atelie-room-1880-v2');
 const spots=keys(x.spots,3);
 if(!spots.length&&visited)spots.push(...keys(visited.visited,3));
 return {
  unlocked:Math.max(1,Math.min(6,Number.isInteger(x.unlocked)?x.unlocked:1)),
  done,spots,files:keys(x.files,3),times:keys(x.times,4),
  concepts:keys(x.concepts,4),
  choices:Object.fromEntries(Object.entries(x.choices||{}).filter(([k,v])=>['3','5','6'].includes(k)&&Number.isInteger(v)&&v>=0&&v<=2)),
  passed:Array.isArray(x.passed)?x.passed.filter(n=>[3,5,6].includes(n)):[],
  reflection:typeof x.reflection==='string'?x.reflection.slice(0,5000):'',
  videoWatched:x.videoWatched===true,
  resumeUnlock:Math.max(1,Math.min(6,Number.isInteger(x.resumeUnlock)?x.resumeUnlock:2)),
  roomCompletedEarly:x.roomCompletedEarly===true
 };
}
function legacyTopica(x){
 return{
  passed:Array.isArray(x.passed)?[...new Set(x.passed.filter(v=>['q1','q2a','q2b','q3a','q3b'].includes(v)))]:[],
  visited:Array.isArray(x.visited)?[...new Set(x.visited.filter(v=>['ics','pcs','cs'].includes(v)))]:['ics'],
  videoFinished:x.videoFinished===true||Array.isArray(x.passed)&&x.passed.includes('q1'),
  thirdAudioDone:x.thirdAudioDone===true,
  wordsCompleted:Array.isArray(x.wordsCompleted)?[...new Set(x.wordsCompleted.filter(n=>Number.isInteger(n)&&n>=1&&n<=4))]:[]
 };
}
function profileView(){
 const user=window.AtelieCloud?.user;
 if(!activeUid||!user)return heading('CONTA PESSOAL','Meu perfil','Entre com Google para consultar e atualizar seus dados no Ateliê.')+
  '<section class="profile-signin-panel"><span class="profile-signin-icon" aria-hidden="true">ψ</span>'+
  '<h2>Seu espaço pessoal de estudos</h2><p>Entre com sua conta Google. Você poderá salvar um nome de preferência e um telefone opcional; seus dados não ficam visíveis para outros alunos.</p>'+
  '<button type="button" class="btn btn-primary" data-profile-login>Entrar com Google</button>'+
  '<p id="profileLoginStatus" class="profile-form-status" role="status" aria-live="polite"></p></section>';
 const fullName=String(user.displayName||'Não informado'),email=String(user.email||'Não informado');
 const photo=typeof user.photoURL==='string'&&user.photoURL.startsWith('https://')?user.photoURL:null;
 const ready=personalProfileStatus==='ready';
 const preferredName=ready?String(personalProfile?.preferredName||''):'';
 const phone=ready?String(personalProfile?.phone||''):'';
 const loadMessage=ready?'Os dados abaixo são pessoais e podem ser alterados. Nome e e-mail da conta Google permanecem sob controle do Google.':
  personalProfileStatus==='loading'?'Consultando seus dados no Firestore...':
  (profileNotice||'Não foi possível ler os dados no banco. Não alteraremos seu cadastro enquanto houver esse problema.');
 return heading('ÁREA PESSOAL','Meu perfil','Consulte e atualize seu cadastro vinculado à conta Google.')+
  '<div class="profile-layout"><aside class="profile-identity-panel">'+
  '<div class="profile-identity-head">'+
   (photo?'<img class="profile-avatar" src="'+esc(photo)+'" alt="Foto da conta Google" referrerpolicy="no-referrer">':
    '<span class="profile-avatar profile-avatar-fallback" aria-hidden="true">ψ</span>')+
   '<div><span class="profile-source">Conta Google conectada</span><h2>'+esc(fullName)+'</h2><p>'+esc(email)+'</p></div></div>'+
  '<div class="profile-metadata"><span class="profile-label">Nome na conta Google</span><strong>'+esc(fullName)+'</strong></div>'+
  '<div class="profile-metadata"><span class="profile-label">E-mail de acesso</span><strong>'+esc(email)+'</strong><small>Gerenciado na sua conta Google.</small></div>'+
  '<p class="profile-safety">Esta área é para cadastro do usuário, não para prontuários nem informações clínicas.</p>'+
  '<button class="profile-logout" type="button" data-profile-logout>Sair da conta</button></aside>'+
  '<section class="profile-edit-panel" aria-labelledby="profileEditHeading">'+
   '<div class="profile-edit-heading"><div><span class="eyebrow">CADASTRO DO ATELIÊ</span><h2 id="profileEditHeading">Informações editáveis</h2></div>'+
   '<span class="profile-state-badge">'+(ready?'Perfil disponível':personalProfileStatus==='loading'?'Carregando':'Conexão pendente')+'</span></div>'+
   '<p>'+esc(loadMessage)+'</p>'+
   (personalProfileStatus==='error'?'<button type="button" data-profile-retry class="btn btn-outline">Tentar novamente</button>':'')+
   '<form id="profileForm" autocomplete="on">'+
    '<div class="profile-form-field"><label for="profilePreferredName">Nome de preferência</label>'+
    '<input id="profilePreferredName" name="preferredName" type="text" maxlength="80" autocomplete="nickname" placeholder="Como deseja ser chamado" value="'+esc(preferredName)+'" '+(ready?'':'disabled')+'>'+
    '<small>Não altera o nome da conta Google.</small></div>'+
    '<div class="profile-form-field"><label for="profilePhone">Telefone (opcional)</label>'+
    '<input id="profilePhone" name="phone" type="tel" maxlength="30" autocomplete="tel" inputmode="tel" placeholder="(11) 99999-9999" value="'+esc(phone)+'" '+(ready?'':'disabled')+'>'+
    '<small>Este telefone fica restrito ao seu cadastro, sem divulgação pública.</small></div>'+
    '<div class="profile-form-actions"><button class="btn btn-primary" id="profileSave" type="submit" '+(ready?'':'disabled')+'>Salvar alterações</button>'+
    '<span class="profile-form-status" id="profileSaveStatus" role="status" aria-live="polite">'+esc(profileNotice)+'</span></div>'+
   '</form></section></div>'+legacyTransferView()+achievementsView();
}
function savedView(){const cs=PUBLISHED_COURSES().filter(c=>state.saved.includes(c.slug));return heading('MEU ESTUDO','Cursos salvos','Se você entrar com Google e o Firestore estiver configurado, seus favoritos poderão ser sincronizados entre dispositivos.')+(cs.length?'<div class="course-grid">'+cs.map(courseCard).join('')+'</div>':'<div class="empty"><h2>Você ainda não salvou cursos.</h2><p>Abra um curso e selecione “Salvar curso”.</p><a class="btn btn-primary" href="#/cursos">Explorar cursos</a></div>')}
function trails(){return heading('PERCURSOS','Trilhas de estudo','Percursos disponíveis para estudo.')+'<div class="intro-grid">'+PUBLISHED_COURSES().map((c,i)=>'<article class="info-card"><span class="eyebrow">TRILHA 0'+(i+1)+'</span><h2>'+esc(c.title)+'</h2><p>'+esc(c.subtitle)+'</p><a class="section-link" href="#/aula/'+c.lesson+'">Experimentar aula '+icon('arrow')+'</a></article>').join('')+'</div>'}
function library(){return heading('BIBLIOTECA','Espaço de referências','A biblioteca será planejada posteriormente. Esta tela é uma estrutura funcional para futura organização de textos, links e leituras.')+'<div class="highlight-panel"><span class="eyebrow">EM DESENVOLVIMENTO</span><h2>As referências virão depois.</h2><p>Por enquanto, vamos testar a navegação, as aulas, os quizzes, o caderno e o progresso.</p></div>'}
function studioView(){return heading('ESTÚDIO · DEMONSTRAÇÃO','Editar uma aula de exemplo','Este editor modifica apenas uma cópia local no seu navegador. Não publica conteúdo nem modifica o banco ou o GitHub.')+'<div class="notice">A edição local é aberta para testar a interface; não é um painel administrativo autenticado. A publicação protegida será implementada em outro sprint.</div><div class="intro-grid">'+COURSES.filter(c=>c.slug!=='formacao-freudiana').map(c=>{const l=lesson(c.lesson);return '<article class="info-card"><span class="eyebrow">'+esc(c.title)+'</span><h2>'+esc(l.title)+'</h2><p>Edite o título, a introdução e o texto da aula fictícia.</p><a class="section-link" href="#/estudio/'+c.lesson+'">Abrir editor '+icon('arrow')+'</a></article>'}).join('')+'</div>'}
function studioEditor(id){if(id===FREUD_FIRST_ID||id===FREUD_SECOND_ID)return heading('ESTÚDIO','Aula interativa publicada','Esta aula foi integrada ao curso e não é editável pelo Estúdio de exemplos.');if(!Object.hasOwn(LESSONS,id))return notFound();const l=lesson(id),c=COURSES[l.course];return '<div class="reading"><a class="back-link" href="#/estudio">← Voltar ao Estúdio</a>'+heading('EDITOR LOCAL',l.title,c.title)+'<form id="editorForm" data-edit="'+id+'" class="reading-panel editor"><label class="form-label" for="editTitle">Título</label><input id="editTitle" name="title" maxlength="120" required value="'+esc(l.title)+'"><label class="form-label" for="editIntro">Introdução</label><textarea id="editIntro" name="intro" rows="7" required maxlength="4000">'+esc(l.intro)+'</textarea><label class="form-label" for="editText">Texto principal</label><textarea id="editText" name="text" rows="7" required maxlength="5000">'+esc(l.text)+'</textarea><div class="lesson-controls"><button type="submit" class="btn btn-primary">Salvar rascunho local</button><button type="button" class="btn btn-outline" data-reset="'+id+'">Restaurar exemplo</button></div><p class="muted-note" id="editorStatus">Nada aqui será publicado.</p></form></div>'}
function about(){return heading('SOBRE O PROJETO','O Ateliê está em construção','Estamos validando uma interface de estudos antes de produzir as aulas definitivas.')+'<div class="highlight-panel"><span class="eyebrow">BETA DE FUNCIONALIDADES</span><h2>Conteúdo de exemplo, ferramentas reais.</h2><p>Os textos fictícios são independentes do repositório anterior. Nesta etapa estamos testando catálogo, aulas, atividades, progresso, favoritos, anotações e edição local. Autenticação Google e sincronização Firestore dependem da ativação dos serviços e das regras de segurança no projeto Firebase.</p></div>'}
function notFound(){return '<div class="empty"><h2>Página não encontrada</h2><p>Confira o endereço.</p><a class="btn btn-primary" href="#/">Voltar ao início</a></div>'}
function parseRoute(){let hash='/';try{hash=decodeURIComponent(location.hash.slice(1)||'/')}catch{}const [path,query='']=hash.split('?');return{path:path||'/',q:new URLSearchParams(query).get('q')||''}}
function render(){updateEntryGate();const {path,q}=parseRoute(),routes={'/':home,'/cursos':()=>courses(q),'/trilhas':trails,'/biblioteca':library,'/salvos':savedView,'/progresso':progressView,'/caderno':notebookView,'/perfil':profileView,'/matriculas':()=>window.AtelieEnrollments?.render()||notFound(),'/estudio':studioView,'/sobre':about};let html=routes[path]?.();if(html===undefined){if(path==='/cursos/curso-formacao-freudiana')html=courseView('formacao-freudiana');else if(path==='/cursos/curso-formacao-freudiana/aulas/aula-escuta-que-mudou-a-clinica')html=lessonView(FREUD_FIRST_ID);else if(path==='/cursos/curso-formacao-freudiana/aulas/aula-primeira-topica-freud')html=lessonView(FREUD_SECOND_ID);else if(path.startsWith('/curso/'))html=courseView(path.split('/')[2]);else if(path.startsWith('/aula/'))html=lessonView(path.split('/')[2]);else if(path.startsWith('/estudio/'))html=studioEditor(path.split('/')[2]);else html=notFound()}document.body.classList.toggle('is-lesson-page',path.startsWith('/aula/')||path.includes('/aulas/aula-'));const needsAccount=path.startsWith('/aula/')||path.includes('/aulas/aula-')||['/progresso','/caderno','/salvos','/matriculas'].includes(path);
 if(needsAccount&&!activeUid){
  html=heading('ACESSO ÀS AULAS','Entre para continuar','O progresso de cada etapa pertence à sua conta Google, não ao navegador.')+
   '<section class="profile-signin-panel"><h2>Seu estudo acompanha sua conta</h2>'+
   '<p>Entre com Google para carregar e salvar automaticamente seu progresso no Firestore.</p>'+
   '<button type="button" class="btn btn-primary" data-profile-login>Entrar com Google</button>'+
   '<p class="profile-form-status" id="profileLoginStatus" role="status"></p></section>';
 }else if(needsAccount&&!appCloudLoaded){
  html=heading('SEU ESTUDO','Carregando sua conta','A aula só abre quando o progresso pessoal for recuperado do Firestore.')+
   '<section class="profile-signin-panel"><h2>Carregando seu progresso...</h2>'+
   '<p>Se persistir, confira sua conexão e as regras de segurança do Firebase.</p>'+
   '<button type="button" class="btn btn-outline" onclick="location.reload()">Tentar novamente</button></section>';
 }
 $('#main').innerHTML=html;renderCourseNavigation(path);document.querySelectorAll('[data-nav]').forEach(a=>{const v=a.dataset.nav;const selected=v===path||(path.startsWith('/curso/')&&v==='/cursos')||(path.startsWith('/aula/')&&v==='/cursos')||(path.startsWith('/estudio/')&&v==='/estudio');if(selected)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});updateSavedCounter();renderStatus();const inp=$('#globalSearch');if(document.activeElement!==inp)inp.value=q;closeMenu();window.scrollTo({top:0,behavior:'instant'});document.title=(path==='/'?'Ateliê':path.replaceAll('/',' ').trim()+' · Ateliê');if(path==='/matriculas'&&activeUid&&appCloudLoaded)window.AtelieEnrollments?.load()}
function closeMenu(){
 $('#sidebar').classList.remove('is-open');
 $('#overlay').hidden=true;
 $('#menuToggle').setAttribute('aria-expanded','false');
 document.body.classList.remove('course-drawer-visible');
}
function toggleMenu(){
 const drawer=$('#sidebar');
 const opened=drawer.classList.toggle('is-open');
 $('#overlay').hidden=!opened;
 $('#menuToggle').setAttribute('aria-expanded',String(opened));
 document.body.classList.toggle('course-drawer-visible',opened);
 if(opened){
  // O Safari preservava a rolagem anterior do menu e escondia o seletor.
  drawer.scrollTop=0;
  // Revalidar a navegação caso o usuário tenha trocado de rota.
  renderCourseNavigation(parseRoute().path);
  requestAnimationFrame(()=>{
   if(!drawer.classList.contains('is-open'))return;
   drawer.scrollTop=0;
   $('#sidebarClose')?.focus({preventScroll:true});
  });
 }
}
document.addEventListener('click',e=>{
 const sv=e.target.closest('[data-save]');if(sv){if(!activeUid||!appCloudLoaded){location.hash='#/perfil';return;}const v=sv.dataset.save;state.saved=state.saved.includes(v)?state.saved.filter(x=>x!==v):[...state.saved,v];saveState();render();return}
 const filter=e.target.closest('[data-filter]');if(filter){courseFilter=filter.dataset.filter;render();return}
 const ans=e.target.closest('[data-answer]');if(ans){const id=ans.dataset.answer;state.answers[id]=Number(ans.dataset.index);saveState();render();return}
 const done=e.target.closest('[data-complete]');if(done){const id=done.dataset.complete;state.completed=state.completed.includes(id)?state.completed.filter(x=>x!==id):[...state.completed,id];saveState();render();return}
 const reset=e.target.closest('[data-reset]');if(reset&&confirm('Restaurar a aula ilustrativa original neste navegador?')){delete state.drafts[reset.dataset.reset];saveState();render();return}
});
let noteTimer;
document.addEventListener('input',e=>{const note=e.target.closest('[data-note]');if(!note)return;state.notes[note.dataset.note]=note.value.slice(0,5000);saveState();clearTimeout(noteTimer);const status=$('#noteSaveStatus');if(status)status.textContent='Salvando anotação na sua conta Google...';});
document.addEventListener('submit',e=>{const f=e.target.closest('#editorForm');if(!f)return;e.preventDefault();const id=f.dataset.edit;const vals=new FormData(f);state.drafts[id]={title:String(vals.get('title')||'').trim(),intro:String(vals.get('intro')||'').trim(),text:String(vals.get('text')||'').trim()};saveState();$('#editorStatus').textContent='Rascunho salvo neste navegador. Veja a aula para conferir.'});
$('#searchForm').addEventListener('submit',e=>{e.preventDefault();const q=$('#globalSearch').value.trim();courseFilter='all';location.hash='#/cursos'+(q?'?q='+encodeURIComponent(q):'');render()});
$('#menuToggle').addEventListener('click',toggleMenu);
$('#sidebarClose').addEventListener('click',()=>{closeMenu();$('#menuToggle').focus({preventScroll:true});});
$('#overlay').addEventListener('click',closeMenu);
document.addEventListener('change',event=>{
 if(event.target.id!=='sidebarCourseSelect')return;
 const slug=event.target.value;
 if(!PUBLISHED_COURSES().some(c=>c.slug===slug))return;
 selectedCourseSlug=slug;
 courseMenuOpenModules.clear();
 courseMenuOpenModules.add(slug+':0');
 renderCourseNavigation(parseRoute().path,true);
 $('#sidebarCourseSelect')?.focus({preventScroll:true});
});
document.addEventListener('toggle',event=>{
 const module=event.target;
 if(!event.isTrusted||!module?.matches?.('[data-course-module]'))return;
 const key=module.dataset.courseModule;
 if(module.open)courseMenuOpenModules.add(key);else courseMenuOpenModules.delete(key);
},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();if(e.key==='/'&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)&&!e.altKey&&!e.ctrlKey&&!e.metaKey){e.preventDefault();$('#globalSearch').focus()}});
$('#loginButton')?.addEventListener('click', async () => {
 if (demoMode && !activeUid) { exitDemo(); return; }
 if (activeUid && window.AtelieCloud) {
   try {
     await window.AtelieCloud.logout();
   } catch (error) { cloudMessage = 'Não foi possível sair: ' + (error.code || error.message); renderStatus(); }
   return;
 }
 updateEntryGate();
});
$('#gateDemoButton')?.addEventListener('click', enterDemo);
function googleLoginError(error) {
 const code = error?.code || '';
 switch (code) {
  case 'auth/unauthorized-domain':
    return 'O domínio pscfredteixeira.github.io não está autorizado no Firebase. O responsável precisa adicioná-lo em Authentication → Settings → Authorized domains.';
  case 'auth/operation-not-allowed':
    return 'O provedor Google está desativado. É preciso ativá-lo em Firebase → Authentication → Sign-in method.';
  case 'auth/configuration-not-found':
  case 'auth/project-not-found':
    return 'O Firebase Authentication ainda não está configurado para este projeto. O responsável deve abrir Firebase → Authentication → Começar e habilitar Google.';
  case 'auth/internal-error':
    return 'O Firebase retornou um erro ao iniciar o Google Login. Confira se Authentication já foi ativado no projeto e se o domínio está autorizado.';
  case 'auth/popup-blocked':
  case 'auth/operation-not-supported-in-this-environment':
    return 'O navegador bloqueou a janela do Google. Abra o site diretamente no Safari ou Chrome, fora do navegador interno de aplicativos, e permita pop-ups.';
  case 'auth/popup-closed-by-user':
  case 'auth/cancelled-popup-request':
    return 'A autenticação não foi concluída. Tente novamente.';
  case 'auth/network-request-failed':
    return 'Não conseguimos acessar o Firebase. Confira sua internet ou bloqueadores de conteúdo e tente novamente.';
  case 'auth/invalid-api-key':
  case 'auth/app-not-authorized':
    return 'A configuração do Firebase precisa ser revisada pelo responsável. Código: ' + code;
  default:
    return 'Não foi possível entrar. Código: ' + (code || error?.message || 'desconhecido') + '. Você ainda pode explorar a demonstração.';
 }
}

document.addEventListener('click',async e=>{
 const btn=e.target.closest('#importLegacyProgress');
 if(!btn)return;
 if(!activeUid||!appCloudLoaded||!window.AtelieCloud?.ready)return;
 if(!confirm('Importar para sua conta Google apenas as etapas antigas que pertencem a você? Nenhum registro existente no Firestore será sobrescrito.'))return;
 const uid=activeUid,status=$('#legacyImportStatus');btn.disabled=true;
 if(status)status.textContent='Verificando o progresso na sua conta...';
 let imported=0,skipped=0;
 for(const [lessonId,key,converter] of [
  ['escuta-que-mudou-a-clinica',LEGACY_PROGRESS_KEYS[0],legacyEscuta],
  ['primeira-topica-freud',LEGACY_PROGRESS_KEYS[1],legacyTopica]
 ]){
  if(uid!==activeUid)break;
  const old=readLegacy(key);
  if(!old)continue;
  try{
   const existing=await window.AtelieCloud.loadLessonProgress(lessonId);
   if(existing!==null){skipped++;continue}
   const restored=converter(old);
   await window.AtelieCloud.saveLessonProgress(lessonId,restored);
   if(uid!==activeUid)break;
   confirmedLessonCompletion(lessonId,restored);
   localStorage.removeItem(key);
   if(lessonId==='escuta-que-mudou-a-clinica')localStorage.removeItem('atelie-room-1880-v2');
   imported++;
  }catch(error){
   if(status)status.textContent='A importação foi interrompida: '+String(error.code||error.message||'Falha no Firestore')+'. Os dados não importados foram preservados.';
   btn.disabled=false;return;
  }
 }
 if(uid!==activeUid)return;
 const finalMessage=imported+' aula(s) importada(s) para sua conta. '+(skipped?skipped+' já tinha(m) progresso remoto e não foi(ram) alterada(s).':'');
 if(status)status.textContent=finalMessage;
 btn.disabled=false;
 renderStatus();
});
document.addEventListener('click',async e=>{
 const login=e.target.closest('[data-profile-login]');
 const retry=e.target.closest('[data-profile-retry]');
 const logout=e.target.closest('[data-profile-logout]');
 if(login){
  const msg=$('#profileLoginStatus');login.disabled=true;
  if(msg)msg.textContent='Abrindo o acesso do Google...';
  try{
   if(!window.AtelieCloud?.login)throw new Error('A integração do Firebase não carregou. Atualize o navegador.');
   await window.AtelieCloud.login();
  }catch(error){if(msg)msg.textContent=error?.code?googleLoginError(error):String(error?.message||'Falha ao entrar.')}
  finally{if(login.isConnected)login.disabled=false;}
  return;
 }
 if(retry){
  retry.disabled=true;profileNotice='';
  try{
   if(!window.AtelieCloud?.loadProfile)throw new Error('Firebase indisponível.');
   await window.AtelieCloud.loadProfile();
  }catch(error){
   profileNotice=error?.code==='permission-denied'?
    'O Firestore recusou a consulta. As novas regras do perfil precisam ser publicadas no Firebase Console.':
    'Erro ao carregar o perfil: '+String(error?.code||error?.message||'desconhecido');
   if(location.hash.startsWith('#/perfil'))render();
  }
  return;
 }
 if(logout){
  logout.disabled=true;
  try{await window.AtelieCloud?.logout();}
  catch(error){
   profileNotice='Não foi possível sair: '+String(error?.code||error?.message||'erro');
   if(location.hash.startsWith('#/perfil'))render();
  }
 }
});
document.addEventListener('submit',async e=>{
 const form=e.target.closest('#profileForm');
 if(!form)return;
 e.preventDefault();
 const uid=activeUid,btn=form.querySelector('#profileSave'),status=form.querySelector('#profileSaveStatus');
 if(!uid||window.AtelieCloud?.user?.uid!==uid){if(status)status.textContent='Entre com Google antes de salvar.';return;}
 if(personalProfileStatus!=='ready'){if(status)status.textContent='Carregue seu cadastro no banco antes de editá-lo.';return;}
 const preferredName=String(form.elements.namedItem('preferredName')?.value||'').trim();
 const phone=String(form.elements.namedItem('phone')?.value||'').trim();
 if(preferredName.length>80||phone.length>30){if(status)status.textContent='Nome: máximo 80 caracteres. Telefone: máximo 30.';return;}
 if(btn)btn.disabled=true;
 if(status)status.textContent='Salvando no Firestore...';
 try{
  const data=await window.AtelieCloud.saveProfile({preferredName,phone});
  if(uid!==activeUid)return;
  if(!data)throw new Error('A conta mudou durante o salvamento.');
  profileNotice='Alterações salvas no banco de dados.';
  if(status)status.textContent=profileNotice;
  renderStatus();
 }catch(error){
  if(uid===activeUid){
   profileNotice=error?.code==='permission-denied'?
    'O Firestore não autorizou a gravação. É preciso publicar as novas regras de acesso no Firebase Console.':
    'Não foi possível salvar: '+String(error?.code||error?.message||'erro');
   if(status)status.textContent=profileNotice;
  }
 }finally{if(btn&&btn.isConnected&&uid===activeUid)btn.disabled=false;}
});
document.addEventListener('input',e=>{
 if(e.target.closest('#profileForm')){
  const status=$('#profileSaveStatus');if(status)status.textContent='Alterações ainda não salvas.';
 }
});
$('#gateGoogleButton')?.addEventListener('click', async () => {
 const status = $('#gateStatus');
 const btn = $('#gateGoogleButton');
 if (!window.AtelieCloud) {
   status.textContent = 'O Firebase não carregou. Abra o site diretamente no Safari ou Chrome e atualize a página. Se persistir, verifique a configuração do projeto.';
   return;
 }
 btn.disabled = true;
 status.textContent = 'Abrindo a janela de acesso do Google...';
 try {
   await window.AtelieCloud.login();
   if (!window.AtelieCloud.user) status.textContent = 'Verificando sua sessão com o Firebase...';
 } catch (error) {
   status.textContent = googleLoginError(error);
 } finally {
   btn.disabled = false;
 }
});
window.addEventListener('atelie-cloud-state', e => {
 cloudMessage = e.detail.message || '';
 renderStatus();
 if (!activeUid && !demoMode && cloudMessage && !cloudMessage.includes('modo local')) {
   const gateStatus = $('#gateStatus');
   if (gateStatus) gateStatus.textContent = cloudMessage;
 }
});
window.addEventListener('atelie-cloud-auth',e=>{
 activeUid=e.detail.uid||null;
 accountGeneration++;
 syncing=false;
 personalProfile=null;
 personalProfileStatus=activeUid?'loading':'signed-out';
 profileNotice='';
 appCloudLoaded=false;
 pendingAccountSave=false;
 savingAccountVersion=0;
 pendingLessonWrites.clear();
 writingLessonIds.clear();
 clearTimeout(syncTimer);
 state=empty();
 conflict=null;
 cloudMessage=activeUid?'Carregando estudos do Firestore...':'Faça login para guardar seu progresso.';
 render();
});
window.addEventListener('atelie-cloud-profile', e=>{
 const info=e.detail||{};
 if(info.uid&&info.uid!==activeUid)return;
 const alreadyReady=personalProfileStatus==='ready';
 personalProfileStatus=info.status||'error';
 personalProfile=personalProfileStatus==='ready'?info.profile||null:null;
 if(personalProfileStatus==='error'){
  profileNotice=info.errorCode==='permission-denied'?
   'O Firestore negou o acesso. Publique as regras de perfil no Console do Firebase.':
   'Falha ao carregar o perfil: '+String(info.errorCode||'desconhecida');
 }
 // Salvar campos não deve recriar o formulário nem levar a página ao topo.
 // Ao carregar pela primeira vez ou recuperar erro, a tela é atualizada.
 if(location.hash.startsWith('#/perfil')&&!(alreadyReady&&personalProfileStatus==='ready'))render();
});
window.addEventListener('atelie-cloud-loaded',e=>{
 if(!activeUid||e.detail.uid!==activeUid)return;
 state=normalize(e.detail.state);
 appCloudLoaded=true;
 cloudMessage='Estudos recuperados do Firestore da sua conta.';
 render();
});
window.addEventListener('atelie-cloud-ready',e=>{
 if(e.detail.uid===activeUid&&pendingAccountSave)queueCloudSync(80);
});
window.addEventListener('online',()=>{if(pendingAccountSave)queueCloudSync(100);});
// A sessão não é persistida pelo app no navegador. O Firebase Authentication
// recupera a sessão Google; toda leitura de conteúdo pessoal vem do servidor.
function currentLessonId(){
 const path=parseRoute().path;
 if(path.startsWith('/aula/'))return path.split('/aula/')[1];
 if(path.includes('/aulas/aula-escuta-que-mudou-a-clinica'))return 'escuta-que-mudou-a-clinica';
 if(path.includes('/aulas/aula-primeira-topica-freud'))return 'primeira-topica-freud';
 return null;
}
function confirmedLessonCompletion(lessonId,progress){
 const complete=lessonId==='escuta-que-mudou-a-clinica'
  ?progress?.videoWatched===true&&Array.isArray(progress.done)&&progress.done.includes(6)
  :Array.isArray(progress?.passed)&&['q1','q2a','q2b','q3a','q3b'].every(x=>progress.passed.includes(x))&&
    ['ics','pcs','cs'].every(x=>Array.isArray(progress.visited)&&progress.visited.includes(x));
 const previous=state.completed.includes(lessonId);
 if(complete===previous)return;
 state.completed=complete?[...state.completed,lessonId]:state.completed.filter(id=>id!==lessonId);
 saveState();
}
async function sendLessonProgress(lessonId,progress,frame,requestId){
 if(!activeUid||!appCloudLoaded||!window.AtelieCloud?.user||
    window.AtelieCloud.user.uid!==activeUid)return;
 if(!['escuta-que-mudou-a-clinica','primeira-topica-freud'].includes(lessonId))return;
 const copy=JSON.parse(JSON.stringify(progress));
 if(JSON.stringify(copy).length>15000)return;
 pendingLessonWrites.set(lessonId,{state:copy,requestId});
 if(writingLessonIds.has(lessonId))return;
 writingLessonIds.add(lessonId);
 const uid=activeUid,gen=accountGeneration;
 try{
  while(pendingLessonWrites.has(lessonId)&&activeUid===uid){
   const current=pendingLessonWrites.get(lessonId);
   pendingLessonWrites.delete(lessonId);
   try{
    await window.AtelieCloud.saveLessonProgress(lessonId,current.state);
    if(uid!==activeUid)return;
    confirmedLessonCompletion(lessonId,current.state);
    frame?.contentWindow?.postMessage({type:'atelie-progress-saved',lessonId,requestId:current.requestId},location.origin);
   }catch(error){
    if(uid!==activeUid)return;
    pendingLessonWrites.set(lessonId,current);
    frame?.contentWindow?.postMessage({type:'atelie-progress-error',lessonId,requestId:current.requestId,errorCode:String(error.code||error.message||'erro')},location.origin);
    cloudMessage='Não foi possível gravar uma etapa da aula no Firestore. Verifique a conexão e as regras de segurança.';
    renderStatus();
    break;
   }
  }
 }finally{if(gen===accountGeneration)writingLessonIds.delete(lessonId)}
}
window.addEventListener('online',()=>{
 const frame=$('#freudLessonFrame'),lessonId=currentLessonId();
 if(frame&&pendingLessonWrites.has(lessonId)){const p=pendingLessonWrites.get(lessonId);sendLessonProgress(lessonId,p.state,frame,p.requestId);}
});
window.addEventListener('message',event=>{
 if(event.origin!==window.location.origin)return;
 const frame=$('#freudLessonFrame');
 if(!frame||event.source!==frame.contentWindow)return;
 const data=event.data;
 if(!data||typeof data!=='object')return;
 const routeLessonId=currentLessonId();
 if(data.type==='atelie-progress-request'){
  if(data.lessonId!==routeLessonId||!appCloudLoaded||!activeUid)return;
  const uid=activeUid,windowFrame=frame;
  window.AtelieCloud.loadLessonProgress(routeLessonId).then(progress=>{
   if(uid!==activeUid||frame!==windowFrame||currentLessonId()!==routeLessonId)return;
   confirmedLessonCompletion(routeLessonId,progress);
   windowFrame.contentWindow?.postMessage({type:'atelie-progress-load',lessonId:routeLessonId,state:progress},location.origin);
  }).catch(error=>{
   if(uid!==activeUid)return;
   windowFrame.contentWindow?.postMessage({type:'atelie-progress-error',lessonId:routeLessonId,errorCode:String(error.code||error.message||'erro')},location.origin);
  });
  return;
 }
 if(data.type==='atelie-progress-save'){
  if(data.lessonId===routeLessonId&&data.state&&typeof data.state==='object'&&!Array.isArray(data.state))sendLessonProgress(routeLessonId,data.state,frame,data.requestId);
  return;
 }
 if(data.type==='atelie-lesson-height'){
   const height=Number(data.height);
   if(Number.isFinite(height)&&height>=100&&height<=30000){
     const next=Math.ceil(height+3);
     if(frame.style.height!==next+'px')frame.style.height=next+'px';
   }
 }else if(data.type==='atelie-lesson-stage-progress'&&data.lessonId==='aula-escuta-que-mudou-a-clinica'){
   const count=Math.max(0,Math.min(6,Math.floor(Number(data.completed)||0)));
   const meter=$('#freudLiveSegments'),value=$('#freudLiveCount');
   if(meter)meter.setAttribute('aria-valuenow',String(count));
   document.querySelectorAll('#freudLiveSegments [data-progress-step]').forEach((segment,i)=>segment.classList.toggle('done',i<count));
   if(value)value.textContent=count+' de 6 etapas';
   const extras=$('#freudLessonExtras');
   if(extras)extras.hidden=count===0;
 }else if(data.type==='atelie-lesson-progress'){
  // O estado permanente é atualizado apenas depois da confirmação de escrita.
 }
});
window.addEventListener('beforeunload',event=>{
 if(pendingAccountSave||pendingLessonWrites.size||writingLessonIds.size){
  event.preventDefault();
  event.returnValue='';
 }
});
window.addEventListener('atelie-enrollments-updated',()=>{if(parseRoute().path==='/matriculas')render()});
 window.addEventListener('hashchange',render);
render();
// Firebase modules may initialize before this deferred script registers listeners.
if (window.AtelieCloud?.user) {
 const cloud = window.AtelieCloud;
 window.dispatchEvent(new CustomEvent('atelie-cloud-auth', { detail: { uid: cloud.user.uid } }));
 if(cloud.profileStatus){
  window.dispatchEvent(new CustomEvent('atelie-cloud-profile',{detail:{
   uid:cloud.user.uid,status:cloud.profileStatus,profile:cloud.profile
  }}));
 }
 if (cloud.snapshot?.uid === cloud.user.uid) {
   window.dispatchEvent(new CustomEvent('atelie-cloud-loaded', { detail: cloud.snapshot }));
   if (cloud.ready) window.dispatchEvent(new CustomEvent('atelie-cloud-ready', { detail: { uid: cloud.user.uid } }));
 }
}
