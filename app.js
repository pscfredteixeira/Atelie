'use strict';
// Ateliê · Beta funcional. Todos os textos das aulas abaixo são EXEMPLOS originais,
// não representam a migração das aulas publicadas no repositório Atelie.
const COURSES = [
  {slug:'introducao-a-psicanalise',title:'Introdução à Psicanálise',subtitle:'Primeiros encontros com a escuta',description:'Conheça a estrutura de uma aula, um exercício e seu caderno de estudos. O conteúdo é apenas ilustrativo.',image:'assets/cover-intro.svg',lesson:'escuta',label:'1 aula ilustrativa'},
  {slug:'formacao-freudiana',title:'Formação Freudiana',subtitle:'Estudo sistemático da obra de Sigmund Freud',description:'Duas aulas interativas disponíveis: A escuta que mudou a clínica e A primeira tópica de Freud. Outras nove aulas em preparação.',image:'assets/cover-freud.svg',lesson:'escuta-que-mudou-a-clinica',label:'2 de 11 aulas disponíveis'},
  {slug:'fundamentos-da-psicanalise',title:'Fundamentos da Psicanálise',subtitle:'Conflitos e sentidos possíveis',description:'Experimente o formato de leitura, quiz, anotações e acompanhamento do próprio estudo.',image:'assets/cover-fundamentos.svg',lesson:'conflito-exemplo',label:'1 aula ilustrativa'}
];
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
const accountKey = uid => STORE + ':account:' + uid;
const pendingKey = uid => STORE + ':pending:' + uid;
function loadLocal(key) {
 try { return normalize(JSON.parse(localStorage.getItem(key) || 'null')); }
 catch { return empty(); }
}
let activeUid = null;
const DEMO_SESSION = 'ateliepsi-demo-entry-v1';
// Acesso direto temporário: navegação pública sem exigir conta.
let demoMode = true;
let state = loadLocal(STORE);
function updateEntryGate() {
 // A tela de login foi retirada temporariamente; a plataforma está sempre disponível.
 const shell = $('#shell');
 if (shell) shell.hidden = false;
 const skip = $('#skipLink');
 if (skip) skip.href = '#main';
}
function enterDemo() {
 demoMode = true;
 try { sessionStorage.setItem(DEMO_SESSION, 'yes'); } catch {}
 updateEntryGate();
 render();
}
function exitDemo() {
 demoMode = false;
 try { sessionStorage.removeItem(DEMO_SESSION); } catch {}
 updateEntryGate();
 document.title = 'Entrar · Ateliê';
}

let courseFilter = 'all';
let cloudMessage = '';
let syncTimer;
let syncing = false;
let conflict = null;

function queueCloudSync(delay = 700) {
 clearTimeout(syncTimer);
 if (!activeUid || conflict || !window.AtelieCloud?.ready) return;
 const uid = activeUid;
 if (!localStorage.getItem(pendingKey(uid))) return;
 syncTimer = setTimeout(async () => {
   if (uid !== activeUid || conflict || !window.AtelieCloud?.ready || window.AtelieCloud.user?.uid !== uid) return;
   if (syncing) { queueCloudSync(1000); return; }
   const version = localStorage.getItem(pendingKey(uid));
   if (!version) return;
   syncing = true;
   cloudMessage = 'Sincronizando alterações...';
   renderStatus();
   try {
     await window.AtelieCloud.save(loadLocal(accountKey(uid)));
     if (uid === activeUid) {
       if (localStorage.getItem(pendingKey(uid)) === version) localStorage.removeItem(pendingKey(uid));
       cloudMessage = 'Alterações sincronizadas com o Firebase.';
     }
   } catch (error) {
     if (uid === activeUid) cloudMessage = 'Não foi possível sincronizar. Seus dados continuam salvos neste dispositivo (' + (error.code || error.message) + ').';
   } finally {
     syncing = false;
     renderStatus();
     if (activeUid && localStorage.getItem(pendingKey(activeUid)) && window.AtelieCloud?.ready && !conflict && cloudMessage.startsWith('Alterações sincronizadas')) queueCloudSync(100);
   }
 }, delay);
}
function saveState() {
 state.updatedAt = Math.max(Date.now(), (state.updatedAt || 0) + 1);
 try {
   localStorage.setItem(activeUid ? accountKey(activeUid) : STORE, JSON.stringify(state));
   if (activeUid) localStorage.setItem(pendingKey(activeUid), String(state.updatedAt));
 } catch {
   cloudMessage = 'Armazenamento local indisponível. Copie seus dados antes de sair.';
 }
 queueCloudSync();
 updateSavedCounter();
 renderStatus();
}
function updateSavedCounter() {
 const el = $('#savedCount');
 if (el) el.textContent = String(state.saved.length);
}
function renderStatus() {
 const el = $('#cloudStatus');
 if (el) {
   const pending = activeUid && localStorage.getItem(pendingKey(activeUid));
   el.textContent = conflict ? 'Conflito de versões: escolha qual estudo manter.'
     : pending && window.AtelieCloud?.ready && !syncing ? 'Alterações salvas neste dispositivo · sincronização pendente.'
     : cloudMessage || (activeUid ? 'Conta conectada.' : 'Seus estudos estão salvos somente neste navegador');
 }
 const btn = $('#loginButton');
 if (btn) btn.textContent = activeUid ? 'Sair da conta' : 'Acesso local';
 const actions = $('#syncConflict');
 if (actions) actions.hidden = !conflict;
}
function lesson(id){return {...LESSONS[id],...(state.drafts[id]||{})}}
function getCourse(id){return COURSES.find(c=>c.slug===id)}
function courseCard(c){const done=state.completed.includes(c.lesson);return '<article class="course-card"><a href="#/curso/'+c.slug+'" class="course-visual" aria-label="Abrir '+esc(c.title)+'"><img alt="" src="'+c.image+'" loading="lazy"><span class="pill">'+(done?'Concluído':(c.slug==='formacao-freudiana'?'Aula disponível':'Aula demonstrativa'))+'</span></a><div class="course-body"><h3><a href="#/curso/'+c.slug+'">'+esc(c.title)+'</a></h3><p>'+esc(c.description)+'</p><div class="course-meta"><span class="meta-left">'+icon(done?'check':'graduation')+esc(c.label)+'</span><a class="circle-link" href="#/curso/'+c.slug+'" aria-label="Abrir '+esc(c.title)+'">'+icon('arrow')+'</a></div></div></article>'}
function heading(k,t,sub){return '<header class="page-heading"><span class="eyebrow">'+esc(k)+'</span><h1>'+esc(t)+'</h1><p>'+esc(sub)+'</p></header>'}
function home(){return '<section class="hero"><div class="hero-copy"><span class="eyebrow">ATELIÊ · VERSÃO BETA</span><h1>Estudo e formação em psicanálise</h1><div class="mini-rule"></div><p>Um espaço para ler, pensar e construir perguntas. A Formação Freudiana já conta com duas aulas interativas publicadas. Os demais cursos e recursos continuam em desenvolvimento.</p><div class="hero-buttons"><a href="#/cursos" class="btn btn-primary">'+icon('layers')+' Explorar cursos</a><a href="#/progresso" class="btn btn-outline">'+icon('route')+' Meu progresso</a></div></div></section><section><div class="section-bar"><h2>Cursos para experimentar</h2><a class="section-link" href="#/cursos">Ver catálogo '+icon('arrow')+'</a></div><div class="course-grid">'+COURSES.map(courseCard).join('')+'</div></section><section class="feature-strip"><div class="feature">'+icon('book')+'<a href="#/cursos"><h3>Uma aula por curso</h3><p>Exemplos originais para testar leitura e quizzes.</p></a></div><div class="feature">'+icon('notebook')+'<a href="#/caderno"><h3>Caderno</h3><p>Escreva e retome suas anotações.</p></a></div><div class="feature">'+icon('graduation')+'<a href="#/estudio"><h3>Estúdio</h3><p>Experimente editar uma aula localmente.</p></a></div></section>'}
function courses(q=''){const filtered=COURSES.filter(c=>[c.title,c.subtitle,c.description].join(' ').toLocaleLowerCase('pt-BR').includes(q.toLocaleLowerCase('pt-BR'))&&(courseFilter==='all'||(courseFilter==='saved'&&state.saved.includes(c.slug))||(courseFilter==='completed'&&state.completed.includes(c.lesson))));return heading('CATÁLOGO','Cursos e percursos','As origens da escuta psicanalítica e a primeira tópica de Freud já podem ser estudadas dentro da Formação Freudiana. Outros conteúdos estão em desenvolvimento.')+'<div class="filter-bar" role="group" aria-label="Filtrar catálogo">'+[['all','Todos'],['saved','Salvos'],['completed','Concluídos']].map(([v,t])=>'<button class="filter" data-filter="'+v+'" aria-pressed="'+(courseFilter===v)+'">'+t+'</button>').join('')+'</div>'+(filtered.length?'<div class="course-grid">'+filtered.map(courseCard).join('')+'</div>':'<div class="empty"><h2>Sem resultados</h2><p>Experimente outro filtro ou outra busca.</p><a class="btn btn-primary" href="#/cursos">Ver todos</a></div>')}


const FREUD_PROGRAM=[
 'A escuta que mudou a clínica','A primeira tópica de Freud','Da hipnose à associação livre',
 'A interpretação dos sonhos','Vida cotidiana e formações do inconsciente',
 'Sexualidade infantil e teoria das pulsões','Metapsicologia: recalque e inconsciente',
 'Narcisismo, identificação e constituição do eu','Transferência, resistência e repetição',
 'Além do princípio do prazer e a segunda tópica','Psicanálise, cultura e os textos tardios'
];
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
 '<p class="muted-note">11 aulas no programa · 2 disponíveis para estudar · '+done+' de 2 concluídas</p>'+
 '<div class="course-actions"><button class="saved-btn" data-save="'+c.slug+'" aria-pressed="'+saved+'">'+icon(saved?'check':'heart')+
 (saved?'Curso salvo':'Salvar curso')+'</button><a class="btn btn-primary" href="'+FREUD_LESSON_ROUTE+'">'+icon('book')+' Começar aula 01</a></div></div>'+
 '<img src="assets/cover-freud.svg" alt="Capa da Formação Freudiana"></div>'+
 '<div class="section-bar"><h2>Programa do curso</h2><span class="freud-program-caption">Aulas organizadas em sequência</span></div>'+
 '<div class="freud-course-program">'+FREUD_PROGRAM.map((title,i)=>{
  const l=FREUD_LESSONS[i],completed=l&&state.completed.includes(l.id);
  return '<div class="freud-course-item'+(l?' freud-course-item-ready':'')+'"><span class="freud-course-no">'+
  String(i+1).padStart(2,'0')+'</span><div class="freud-course-item-copy"><strong>'+esc(title)+'</strong><small>'+
  (l?(completed?'Concluída':'Disponível')+' · '+l.stages+' etapas interativas':'Conteúdo em preparação')+'</small></div>'+
  (l?'<a class="freud-course-open" href="'+l.route+'">'+(completed?'Rever':'Estudar')+' →</a>':
  '<span class="freud-course-pending">Em preparação</span>')+'</div>';
 }).join('')+'</div>'+
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
  '?v=curso-integrado-20261109-hotspots-corrigidos-v9" title="Aula interativa '+esc(l.title)+
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
function freudSidebarNav(path){
 const isLesson=path.includes('/aula/')||path.includes('/aulas/');
 const current=path.includes(FREUD_SECOND_ID)?FREUD_SECOND_ID:path.includes(FREUD_FIRST_ID)?FREUD_FIRST_ID:'';
 return '<p class="sidebar-caption">FORMAÇÃO FREUDIANA</p>'+
 '<nav aria-label="Aulas do curso Formação Freudiana" class="freud-sidebar-links">'+
 '<a href="'+FREUD_COURSE_ROUTE+'" class="freud-sidebar-link'+(!isLesson?' is-selected':'')+'">Visão geral do curso</a>'+
 FREUD_LESSONS.map((l,i)=>'<a href="'+l.route+'" class="freud-sidebar-link'+(current===l.id?' is-selected':'')+'"><span>'+
 String(i+1).padStart(2,'0')+'</span> '+esc(l.title)+'</a>').join('')+'</nav>'+
 '<details class="freud-sidebar-upcoming"><summary>Outras 9 aulas</summary><ol>'+
 FREUD_PROGRAM.slice(2).map((t,i)=>'<li><span>'+String(i+3).padStart(2,'0')+'</span> '+esc(t)+'</li>').join('')+
 '</ol></details>';
}
function courseView(slug){const c=getCourse(slug);if(!c)return notFound();if(slug==='formacao-freudiana')return freudCourseView(c);const l=lesson(c.lesson);const isSaved=state.saved.includes(slug);const done=state.completed.includes(c.lesson);return '<div class="course-heading"><div><a class="back-link" href="#/cursos">← Voltar aos cursos</a><div style="margin-top:25px"><span class="eyebrow">CURSO · DEMONSTRAÇÃO</span></div><h1>'+esc(c.title)+'</h1><p>'+esc(c.description)+'</p><p class="muted-note">1 aula ilustrativa · '+l.minutes+' minutos estimados · '+(done?'Concluída':'Ainda não concluída')+'</p><div class="course-actions"><button class="saved-btn" data-save="'+c.slug+'" aria-pressed="'+isSaved+'">'+icon(isSaved?'check':'heart')+(isSaved?'Curso salvo':'Salvar curso')+'</button><a class="btn btn-primary" href="#/aula/'+c.lesson+'">'+icon('book')+' Abrir aula de exemplo</a></div></div><img src="'+c.image+'" alt=""></div><div class="section-bar"><h2>Programa demonstrativo</h2></div><section class="module"><div class="module-header"><span class="module-no">01</span><div><h3>Experimentação da plataforma</h3><p>Conteúdo fictício que será substituído quando a proposta pedagógica estiver definida.</p></div></div><div class="lesson-list"><div class="lesson"><div><div class="lesson-title">'+esc(l.title)+'</div><span>'+l.minutes+' min · quiz e caderno · '+(done?'concluída':'disponível')+'</span></div><a href="#/aula/'+c.lesson+'">Estudar →</a></div></div></section>'}
function lessonView(id){if(id===FREUD_FIRST_ID||id===FREUD_SECOND_ID)return freudLessonView(id);if(!Object.hasOwn(LESSONS,id))return notFound();const l=lesson(id),c=COURSES[l.course],selected=state.answers[id],done=state.completed.includes(id),valid=Number.isInteger(selected);return '<div class="reading"><a class="back-link" href="#/curso/'+c.slug+'">← Voltar ao curso</a>'+heading('AULA ILUSTRATIVA',l.title,c.title+' · '+l.minutes+' minutos')+'<div class="notice"><strong>Conteúdo fictício para testes.</strong> Esta aula não foi importada de outro repositório e será substituída depois.</div><article class="reading-panel"><span class="eyebrow">PARA COMEÇAR</span><h2>'+esc(l.prompt)+'</h2><p>'+esc(l.intro)+'</p><div class="mini-rule"></div><h3>'+esc(l.topic)+'</h3><p>'+esc(l.text)+'</p></article><section class="reading-panel quiz-panel"><span class="eyebrow">ATIVIDADE · 1 PERGUNTA</span><h2>'+esc(l.quiz.question)+'</h2><div class="quiz-options">'+l.quiz.options.map((op,i)=>'<button class="quiz-option" type="button" data-answer="'+id+'" data-index="'+i+'" aria-pressed="'+(i===selected)+'">'+String.fromCharCode(65+i)+' · '+esc(op)+'</button>').join('')+'</div>'+(valid?'<p class="quiz-feedback" role="status"><strong>'+(selected===l.quiz.answer?'Resposta correta.':'Vamos pensar mais um pouco.')+'</strong> '+esc(l.quiz.explanation)+'</p>':'<p class="muted-note">Escolha uma alternativa para conferir a resposta.</p>')+'</section><section class="reading-panel"><span class="eyebrow">CADERNO DE ESTUDOS</span><h2>Suas anotações</h2><label for="lessonNote" class="form-label">O que você gostaria de registrar?</label><textarea id="lessonNote" data-note="'+id+'" maxlength="5000" rows="5" placeholder="Anote suas perguntas e ideias...">'+esc(state.notes[id]||'')+'</textarea><p class="muted-note" id="noteSaveStatus">Salvo automaticamente neste navegador'+(window.AtelieCloud?.user?' e na sua conta':'')+'.</p><div class="lesson-controls"><button type="button" class="btn btn-primary" data-complete="'+id+'">'+icon(done?'check':'graduation')+(done?'Marcar como não concluída':'Concluir aula')+'</button><a class="btn btn-outline" href="#/progresso">Meu progresso</a></div></section></div>'}

function studyIndex(){return COURSES.flatMap(c=>c.slug==='formacao-freudiana'?
 FREUD_LESSONS.map(l=>({id:l.id,title:l.title,course:c.title,route:l.route})):
 [{id:c.lesson,title:lesson(c.lesson).title,course:c.title,route:'#/aula/'+c.lesson}]);}
function progressView(){
 const all=studyIndex(),n=all.filter(l=>state.completed.includes(l.id)).length;
 return heading('MEU ESTUDO','Progresso','Acompanhamento local das aulas disponíveis. Marcar como concluída não certifica aprendizagem.')+
 '<div class="progress-head"><strong>'+n+' de '+all.length+'</strong><p>Aulas concluídas</p>'+
 '<div class="progress-bar" role="progressbar" aria-valuenow="'+n+'" aria-valuemin="0" aria-valuemax="'+all.length+
 '" aria-label="Aulas concluídas"><span style="width:'+(n/all.length*100)+'%"></span></div></div>'+
 '<div class="intro-grid">'+all.map(l=>'<article class="info-card"><span class="eyebrow">'+
 (state.completed.includes(l.id)?'CONCLUÍDA':'EM ABERTO')+'</span><h2>'+esc(l.course)+'</h2><p>'+esc(l.title)+
 '</p><a href="'+l.route+'" class="section-link">'+(state.completed.includes(l.id)?'Revisar aula':'Começar aula')+' '+icon('arrow')+'</a></article>').join('')+'</div>';
}
function notebookView(){
 const all=studyIndex();
 return heading('MEU ESTUDO','Meu caderno','Anotações por aula, salvas automaticamente neste navegador.')+
 '<div class="intro-grid">'+all.map(l=>'<article class="info-card"><span class="eyebrow">'+esc(l.course)+'</span><h2>'+esc(l.title)+
 '</h2><p class="note-preview">'+esc(state.notes[l.id]?.trim()||'Você ainda não escreveu uma anotação nesta aula.')+
 '</p><a class="section-link" href="'+l.route+'">Abrir caderno '+icon('arrow')+'</a></article>').join('')+'</div>';
}
function savedView(){const cs=COURSES.filter(c=>state.saved.includes(c.slug));return heading('MEU ESTUDO','Cursos salvos','Se você entrar com Google e o Firestore estiver configurado, seus favoritos poderão ser sincronizados entre dispositivos.')+(cs.length?'<div class="course-grid">'+cs.map(courseCard).join('')+'</div>':'<div class="empty"><h2>Você ainda não salvou cursos.</h2><p>Abra um curso e selecione “Salvar curso”.</p><a class="btn btn-primary" href="#/cursos">Explorar cursos</a></div>')}
function trails(){return heading('PERCURSOS','Trilhas de estudo','Por enquanto, estes percursos são apenas portas de entrada para as três aulas fictícias.')+'<div class="intro-grid">'+COURSES.map((c,i)=>'<article class="info-card"><span class="eyebrow">TRILHA 0'+(i+1)+'</span><h2>'+esc(c.title)+'</h2><p>'+esc(c.subtitle)+'</p><a class="section-link" href="#/aula/'+c.lesson+'">Experimentar aula '+icon('arrow')+'</a></article>').join('')+'</div>'}
function library(){return heading('BIBLIOTECA','Espaço de referências','A biblioteca será planejada posteriormente. Esta tela é uma estrutura funcional para futura organização de textos, links e leituras.')+'<div class="highlight-panel"><span class="eyebrow">EM DESENVOLVIMENTO</span><h2>As referências virão depois.</h2><p>Por enquanto, vamos testar a navegação, as aulas, os quizzes, o caderno e o progresso.</p></div>'}
function studioView(){return heading('ESTÚDIO · DEMONSTRAÇÃO','Editar uma aula de exemplo','Este editor modifica apenas uma cópia local no seu navegador. Não publica conteúdo nem modifica o banco ou o GitHub.')+'<div class="notice">A edição local é aberta para testar a interface; não é um painel administrativo autenticado. A publicação protegida será implementada em outro sprint.</div><div class="intro-grid">'+COURSES.filter(c=>c.slug!=='formacao-freudiana').map(c=>{const l=lesson(c.lesson);return '<article class="info-card"><span class="eyebrow">'+esc(c.title)+'</span><h2>'+esc(l.title)+'</h2><p>Edite o título, a introdução e o texto da aula fictícia.</p><a class="section-link" href="#/estudio/'+c.lesson+'">Abrir editor '+icon('arrow')+'</a></article>'}).join('')+'</div>'}
function studioEditor(id){if(id===FREUD_FIRST_ID||id===FREUD_SECOND_ID)return heading('ESTÚDIO','Aula interativa publicada','Esta aula foi integrada ao curso e não é editável pelo Estúdio de exemplos.');if(!Object.hasOwn(LESSONS,id))return notFound();const l=lesson(id),c=COURSES[l.course];return '<div class="reading"><a class="back-link" href="#/estudio">← Voltar ao Estúdio</a>'+heading('EDITOR LOCAL',l.title,c.title)+'<form id="editorForm" data-edit="'+id+'" class="reading-panel editor"><label class="form-label" for="editTitle">Título</label><input id="editTitle" name="title" maxlength="120" required value="'+esc(l.title)+'"><label class="form-label" for="editIntro">Introdução</label><textarea id="editIntro" name="intro" rows="7" required maxlength="4000">'+esc(l.intro)+'</textarea><label class="form-label" for="editText">Texto principal</label><textarea id="editText" name="text" rows="7" required maxlength="5000">'+esc(l.text)+'</textarea><div class="lesson-controls"><button type="submit" class="btn btn-primary">Salvar rascunho local</button><button type="button" class="btn btn-outline" data-reset="'+id+'">Restaurar exemplo</button></div><p class="muted-note" id="editorStatus">Nada aqui será publicado.</p></form></div>'}
function about(){return heading('SOBRE O PROJETO','O Ateliê está em construção','Estamos validando uma interface de estudos antes de produzir as aulas definitivas.')+'<div class="highlight-panel"><span class="eyebrow">BETA DE FUNCIONALIDADES</span><h2>Conteúdo de exemplo, ferramentas reais.</h2><p>Os textos fictícios são independentes do repositório anterior. Nesta etapa estamos testando catálogo, aulas, atividades, progresso, favoritos, anotações e edição local. Autenticação Google e sincronização Firestore dependem da ativação dos serviços e das regras de segurança no projeto Firebase.</p></div>'}
function notFound(){return '<div class="empty"><h2>Página não encontrada</h2><p>Confira o endereço.</p><a class="btn btn-primary" href="#/">Voltar ao início</a></div>'}
function parseRoute(){let hash='/';try{hash=decodeURIComponent(location.hash.slice(1)||'/')}catch{}const [path,query='']=hash.split('?');return{path:path||'/',q:new URLSearchParams(query).get('q')||''}}
function render(){updateEntryGate();const {path,q}=parseRoute(),routes={'/':home,'/cursos':()=>courses(q),'/trilhas':trails,'/biblioteca':library,'/salvos':savedView,'/progresso':progressView,'/caderno':notebookView,'/estudio':studioView,'/sobre':about};let html=routes[path]?.();if(html===undefined){if(path==='/cursos/curso-formacao-freudiana')html=courseView('formacao-freudiana');else if(path==='/cursos/curso-formacao-freudiana/aulas/aula-escuta-que-mudou-a-clinica')html=lessonView(FREUD_FIRST_ID);else if(path==='/cursos/curso-formacao-freudiana/aulas/aula-primeira-topica-freud')html=lessonView(FREUD_SECOND_ID);else if(path.startsWith('/curso/'))html=courseView(path.split('/')[2]);else if(path.startsWith('/aula/'))html=lessonView(path.split('/')[2]);else if(path.startsWith('/estudio/'))html=studioEditor(path.split('/')[2]);else html=notFound()}$('#main').innerHTML=html;const courseNav=$('#courseContextNav');if(courseNav){const freudContext=path==='/curso/formacao-freudiana'||path==='/aula/primeira-topica-freud'||path.startsWith('/cursos/curso-formacao-freudiana');courseNav.hidden=!freudContext;if(freudContext)courseNav.innerHTML=freudSidebarNav(path);}document.querySelectorAll('[data-nav]').forEach(a=>{const v=a.dataset.nav;const selected=v===path||(path.startsWith('/curso/')&&v==='/cursos')||(path.startsWith('/aula/')&&v==='/cursos')||(path.startsWith('/estudio/')&&v==='/estudio');if(selected)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});updateSavedCounter();renderStatus();const inp=$('#globalSearch');if(document.activeElement!==inp)inp.value=q;closeMenu();window.scrollTo({top:0,behavior:'instant'});document.title=(path==='/'?'Ateliê':path.replaceAll('/',' ').trim()+' · Ateliê')}
function closeMenu(){$('#sidebar').classList.remove('is-open');$('#overlay').hidden=true;$('#menuToggle').setAttribute('aria-expanded','false')}
function toggleMenu(){const opened=$('#sidebar').classList.toggle('is-open');$('#overlay').hidden=!opened;$('#menuToggle').setAttribute('aria-expanded',String(opened))}
document.addEventListener('click',e=>{
 const sv=e.target.closest('[data-save]');if(sv){const v=sv.dataset.save;state.saved=state.saved.includes(v)?state.saved.filter(x=>x!==v):[...state.saved,v];saveState();render();return}
 const filter=e.target.closest('[data-filter]');if(filter){courseFilter=filter.dataset.filter;render();return}
 const ans=e.target.closest('[data-answer]');if(ans){const id=ans.dataset.answer;state.answers[id]=Number(ans.dataset.index);saveState();render();return}
 const done=e.target.closest('[data-complete]');if(done){const id=done.dataset.complete;state.completed=state.completed.includes(id)?state.completed.filter(x=>x!==id):[...state.completed,id];saveState();render();return}
 const reset=e.target.closest('[data-reset]');if(reset&&confirm('Restaurar a aula ilustrativa original neste navegador?')){delete state.drafts[reset.dataset.reset];saveState();render();return}
});
let noteTimer;
document.addEventListener('input',e=>{const note=e.target.closest('[data-note]');if(!note)return;state.notes[note.dataset.note]=note.value.slice(0,5000);saveState();clearTimeout(noteTimer);const status=$('#noteSaveStatus');if(status)status.textContent='Anotação salva neste dispositivo.';});
document.addEventListener('submit',e=>{const f=e.target.closest('#editorForm');if(!f)return;e.preventDefault();const id=f.dataset.edit;const vals=new FormData(f);state.drafts[id]={title:String(vals.get('title')||'').trim(),intro:String(vals.get('intro')||'').trim(),text:String(vals.get('text')||'').trim()};saveState();$('#editorStatus').textContent='Rascunho salvo neste navegador. Veja a aula para conferir.'});
$('#searchForm').addEventListener('submit',e=>{e.preventDefault();const q=$('#globalSearch').value.trim();courseFilter='all';location.hash='#/cursos'+(q?'?q='+encodeURIComponent(q):'');render()});
$('#menuToggle').addEventListener('click',toggleMenu);$('#overlay').addEventListener('click',closeMenu);
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
window.addEventListener('atelie-cloud-auth', e => {
 activeUid = e.detail.uid || null;
 if (activeUid) {
   demoMode = false;
   try { sessionStorage.removeItem(DEMO_SESSION); } catch {}
 }
 conflict = null;
 clearTimeout(syncTimer);
 state = loadLocal(activeUid ? accountKey(activeUid) : STORE);
 render();
});
window.addEventListener('atelie-cloud-loaded', e => {
 if (!activeUid || e.detail.uid !== activeUid) return;
 const local = loadLocal(accountKey(activeUid));
 const remote = normalize(e.detail.state);
 const pending = localStorage.getItem(pendingKey(activeUid));
 if (pending && e.detail.exists && remote.updatedAt > local.updatedAt) {
   conflict = { uid: activeUid, remote };
   state = local;
   cloudMessage = 'Existe uma versão mais recente na nuvem. Escolha qual deseja manter.';
   render();
   return;
 }
 if (pending) state = local;
 else if (e.detail.exists) state = { ...remote, drafts: local.drafts };
 else state = local;
 try { localStorage.setItem(accountKey(activeUid), JSON.stringify(state)); } catch {}
 render();
 queueCloudSync(100);
});
window.addEventListener('atelie-cloud-ready', e => {
 if (e.detail.uid === activeUid) queueCloudSync(100);
});
window.addEventListener('online', () => queueCloudSync(500));
document.addEventListener('visibilitychange', () => { if (!document.hidden) queueCloudSync(500); });
document.addEventListener('click', e => {
 const choice = e.target.closest('[data-conflict]');
 if (!choice || !conflict || conflict.uid !== activeUid) return;
 const { remote } = conflict;
 conflict = null;
 if (choice.dataset.conflict === 'cloud') {
   state = { ...remote, drafts: state.drafts };
   try {
     localStorage.setItem(accountKey(activeUid), JSON.stringify(state));
     localStorage.removeItem(pendingKey(activeUid));
   } catch {}
   cloudMessage = 'Versão da nuvem restaurada neste dispositivo.';
   render();
   return;
 }
 state.updatedAt = Math.max(state.updatedAt, remote.updatedAt);
 saveState();
 cloudMessage = 'Versão deste dispositivo escolhida para sincronizar.';
 render();
});

window.addEventListener('message',event=>{
 if(event.origin!==window.location.origin)return;
 const frame=$('#freudLessonFrame');
 if(!frame||event.source!==frame.contentWindow)return;
 const data=event.data;
 if(!data||typeof data!=='object')return;
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
 }else if(data.type==='atelie-lesson-progress'&&['aula-primeira-topica-freud','aula-escuta-que-mudou-a-clinica'].includes(data.lessonId)){
   const done=data.completed===true;
   const id=data.lessonId==='aula-primeira-topica-freud'?FREUD_SECOND_ID:FREUD_FIRST_ID;
   const was=state.completed.includes(id);
   if(done!==was){
     state.completed=done?[...state.completed,id]:state.completed.filter(x=>x!==id);
     saveState();
   }
 }
});
window.addEventListener('hashchange',render);
render();
// Firebase modules may initialize before this deferred script registers listeners.
if (window.AtelieCloud?.user) {
 const cloud = window.AtelieCloud;
 window.dispatchEvent(new CustomEvent('atelie-cloud-auth', { detail: { uid: cloud.user.uid } }));
 if (cloud.snapshot?.uid === cloud.user.uid) {
   window.dispatchEvent(new CustomEvent('atelie-cloud-loaded', { detail: cloud.snapshot }));
   if (cloud.ready) window.dispatchEvent(new CustomEvent('atelie-cloud-ready', { detail: { uid: cloud.user.uid } }));
 }
}
