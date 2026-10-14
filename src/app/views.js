import {COURSE_ID, LESSON_ID, demoCourse, demoCourses, demoBlocks} from "./data.js";
import {escapeHTML as e, badge, action, demoAction, note, pageHead, sectionHead, card, emptyState, notFound, demoWarning} from "../ui/components.js";

const courseRoute = '#/cursos/' + COURSE_ID;
const lessonRoute = courseRoute + '/aulas/' + LESSON_ID;
const teacherCourse = '#/professor/cursos/' + COURSE_ID;
const editorRoute = teacherCourse + '/aulas/' + LESSON_ID + '/editar';
const previewRoute = teacherCourse + '/aulas/' + LESSON_ID + '/previa';

function metrics(items) {
  return '<div class="metrics">' + items.map(x => '<div class="metric"><strong>' + e(x[0]) +
    '</strong><span>' + e(x[1]) + '</span></div>').join('') + '</div>';
}
function courseCard(item, i) {
  const cta = i === 0 ? action('Conhecer o curso →',courseRoute,'small') :
    demoAction('Em planejamento', 'Este curso é apenas um exemplo visual nesta fase.', 'small');
  return card(item.category, item.title, item.summary, cta);
}
function home() {
  return pageHead('Atelier · Ambiente do aluno','Estudar pode ser uma <em>experiência.</em>',
    'Explore conceitos e autores por percursos que combinam leitura, reflexão e atividades significativas.') +
    '<section class="illustrated"><div><div class="overline">Percurso demonstrativo</div>' +
    '<h2>Fundamentos da Psicanálise</h2><p>Onde a escuta começa a se transformar em um problema teórico.</p>' +
    '<div class="progress-label"><span>Progresso fictício</span><span>38%</span></div>' +
    '<div class="progress" role="img" aria-label="Progresso ilustrativo de 38 por cento"><span style="width:38%"></span></div>' +
    action('Continuar a aula →',lessonRoute,'action') +
    '</div><div class="illustrated-symbol" aria-hidden="true">ψ</div></section>' +
    sectionHead('Cursos para explorar',action('Ver catálogo →','#/cursos','quiet small')) +
    '<div class="grid">' + demoCourses.map(courseCard).join('') + '</div>' +
    demoWarning();
}
function catalog() {
  return pageHead('Aprender / Cursos','O que você deseja <em>investigar?</em>',
    'O catálogo reunirá cursos com objetivos claros, ementas e percursos próprios. Estes três cards são exemplos.') +
    '<div class="grid">' + demoCourses.map(courseCard).join('') + '</div>' + demoWarning();
}
function listModule(mod, index, teacher) {
  const title = '<div><div class="overline">Módulo ' + String(index+1).padStart(2,'0') +
    ' · ' + mod.lessons.length + ' aulas</div><h3>' + e(mod.title) + '</h3></div><span class="chevron" aria-hidden="true">+</span>';
  const rows = mod.lessons.map((l, li) => '<div class="lesson-item"><div><span class="number">' +
    String(li+1).padStart(2,'0') + '</span>' + e(l.title) +
    '</div>' + (l.id === LESSON_ID ?
    action(teacher?'Editar →':'Abrir →',teacher?editorRoute:lessonRoute,'small') :
    demoAction('Prévia em breve','Esta aula ainda não foi conectada ao motor de dados.','small')) +
    '</div>').join('');
  return '<details class="module" ' + (index===1?'open':'') + '><summary>' + title +
    '</summary><div>' + rows + '</div></details>';
}
function course() {
  return pageHead('Catálogo / Formação introdutória',e(demoCourse.title),
    demoCourse.subtitle) + metrics([['3','Módulos (exemplo)'],['9','Aulas (exemplo)'],['3h','Carga aproximada']]) +
    '<section class="card" style="margin-top:21px"><div class="card-label">Objetivos de aprendizagem</div>' +
    '<ul class="muted" style="line-height:2">' + demoCourse.objectives.map(o=>'<li>'+e(o)+'</li>').join('') +
    '</ul>' + action('Abrir aula demonstrativa →',lessonRoute,'action') + '</section>' +
    sectionHead('Seu percurso',badge('Dados fictícios','purple')) +
    demoCourse.modules.map((m,i)=>listModule(m,i,false)).join('') +
    demoWarning();
}
function lesson(preview) {
  const heading = '<div class="topline"><span class="overline">Fundamentos / Conflito e defesa</span>' +
    badge(preview?'Prévia de autoria':'Aula fictícia',preview?'purple':'') + '</div>';
  const blocks = '<section class="reader"><div class="reader-inner"><div class="overline">Leitura guiada · Aula demonstrativa</div>' +
    '<h2>O recalque em Freud</h2>' +
    '<p>Uma hipótese para pensar o conflito psíquico sem confundir interpretação com uma conclusão automática.</p>' +
    '<hr><div class="inset"><b>01 — Antes de começar</b><h3>' + e(demoBlocks[0].title) + '</h3><p>' + e(demoBlocks[0].body) + '</p></div>' +
    '<h3>02 — Construindo o conceito</h3><p>' + e(demoBlocks[1].body) + '</p>' +
    '<hr><div class="inset"><b>03 — Situação fictícia</b><h3>' + e(demoBlocks[2].title) +
    '</h3><p>' + e(demoBlocks[2].body) + '</p></div>' +
    '<h3>04 — Verificação</h3><p>' + e(demoBlocks[3].body) + '</p>' +
    '<div class="inset"><b>Espaço reservado</b><p>O exercício funcional virá no Sprint 9, quando o sistema de avaliações estiver disponível.</p></div>' +
    '</div></section>';
  const sidebar = '<aside class="sidepanel"><div class="overline">Percurso da aula</div><h3>Quatro momentos</h3>' +
    '<ol><li>Uma pergunta</li><li>Teoria em contexto</li><li>Caso fictício</li><li>Verificação</li></ol>' +
    '<div class="rule"></div><p class="hint">No futuro, o caderno e o progresso serão salvos localmente. Esta versão não registra dados.</p>' +
    (preview?action('Voltar ao estúdio →',editorRoute,'small'):action('Ver programa do curso →',courseRoute,'small')) + '</aside>';
  return heading + (preview?'':pageHead('Sala de aula','O recalque em Freud','Uma leitura de demonstração com conteúdo separado da apresentação visual.')) +
    '<div class="reading-layout">' + blocks + sidebar + '</div>' +
    (preview?note('<strong>Prévia demonstrativa:</strong> esta página ainda utiliza dados fictícios de JavaScript. O mesmo motor JSON para aluno e professor será implementado no Sprint 3.') :
    note('<strong>Não é uma aula publicada:</strong> a sala de aula real passará a carregar arquivos JSON no Sprint 3.')) ;
}
function caderno() {
  return pageHead('Aprender / Meu caderno','Suas ideias, seu <em>percurso.</em>',
   'Este espaço será dedicado às anotações feitas durante a leitura e a investigação de conceitos.') +
   emptyState('Caderno ainda sem anotações','O salvamento local por aula será implementado no Sprint 10. Não registre informações pessoais ou casos reais nesta demonstração.',
    action('Conhecer uma aula →',lessonRoute,'action')) + demoWarning();
}
function progresso() {
  return pageHead('Aprender / Progresso','O conhecimento tem seu <em>tempo.</em>',
    'Nesta fase os indicadores são exclusivamente fictícios. O acompanhamento local de aprendizagem virá depois.') +
    metrics([['38%','Progresso fictício'],['3','Aulas concluídas (exemplo)'],['1','Curso em andamento (exemplo)']]) +
    sectionHead('Próximo passo', '') + card('Percurso de demonstração','O recalque em Freud',
     'A aula ilustrativa está pronta para você explorar a navegação e o formato de leitura.',
     action('Abrir aula →',lessonRoute,'small')) + demoWarning();
}
function teacher() {
  return pageHead('Atelier / Ambiente do professor','Ensinar começa com <em>uma pergunta.</em>',
    'Crie percursos de aprendizagem com componentes reutilizáveis, sem precisar programar cada nova aula.') +
    '<section class="illustrated"><div><div class="overline">Área de autoria · Protótipo</div><h2>Seu estúdio de criação</h2>' +
    '<p>Organize módulos, selecione blocos e visualize o resultado antes de publicar.</p>' +
    '<div class="button-row">' + action('Organizar curso →',teacherCourse,'action') +
    action('Abrir estúdio →',editorRoute,'') + '</div></div><div class="illustrated-symbol" aria-hidden="true">✧</div></section>' +
    sectionHead('Cursos em preparação',badge('Exemplos locais','purple')) +
    '<section class="card"><div class="course-line"><span aria-hidden="true">ψ</span>' +
    '<div><h3>Fundamentos da Psicanálise</h3><p>3 módulos · 9 aulas de exemplo</p></div>' +
    action('Organizar →',teacherCourse,'small')+'</div></section>' + demoWarning();
}
function teacherStructure() {
  return pageHead('Criar / Gestão de cursos','Arquitetura do <em>percurso.</em>',
    'A sequência pedagógica organiza os módulos e as aulas, mas os identificadores permanecem estáveis.') +
    '<div class="editor-shell"><section><div class="topline">' + badge('Rascunho de exemplo','purple') +
    action('Abrir estúdio →',editorRoute,'action small') + '</div>' +
    demoCourse.modules.map((m,i)=>listModule(m,i,true)).join('') + '</section>' +
    '<aside class="sidepanel"><div class="overline">Planejamento didático</div><h3>Curso → Módulo → Aula</h3>' +
    '<p class="hint">Primeiro planejamos o percurso. Depois cada aula recebe seus blocos de conteúdo e experiências.</p>' +
    demoAction('Criar módulo (futuro)','A gestão real de módulos será desenvolvida no Sprint 5.','small') +
    '<div class="rule"></div><p class="hint">Este painel ainda não altera os dados do curso.</p></aside></div>' + demoWarning();
}
function studio() {
  return pageHead('Criar / Estúdio de aula','O recalque em Freud',
    'Estrutura demonstrativa do editor: cada bloco terá seu tipo, conteúdo e configurações.') +
    '<div class="topline">' + badge('Rascunho não persistente','purple') +
    '<div class="button-row">' + action('Prévia como aluno →',previewRoute,'small') +
    action('Ver estrutura →',teacherCourse,'small') + '</div></div>' +
    '<div class="editor-shell" style="margin-top:17px"><div class="card">' +
    '<div class="card-label">Composição prevista</div><h3>Blocos da aula</h3>' +
    demoBlocks.map((b,i)=>'<div class="editor-block"><span class="index">' +
      String(i+1).padStart(2,'0') + '</span><div class="grow"><strong>' + e(b.title) +
      '</strong><small>' + e(b.label) + ' · ' + e(b.type) + '</small></div></div>').join('') +
    demoAction('+ Adicionar bloco (futuro)','O editor com salvamento e reordenação será implementado no Sprint 6.','small') +
    '</div><aside class="sidepanel"><div class="overline">Estúdio</div><h3>Uma ferramenta visual</h3>' +
    '<p class="hint">Texto, mídias e laboratórios poderão ser posicionados livremente, com prévia usando o mesmo motor do aluno.</p>' +
    '<div class="keyboard-help">Nesta etapa, os blocos são apenas uma representação visual. Para testar a edição temporária de blocos, use os wireframes do Sprint 0.2.</div>' +
    '<div style="margin-top:14px"><a class="button small" href="./wireframes.html">Experimentar wireframe ↗</a></div></aside></div>' + demoWarning();
}
function admin() {
  return pageHead('Atelier / Administração','Organizar para <em>crescer.</em>',
    'Uma visão da estrutura editorial, pensada para futuros cursos, professores e publicações.') +
    metrics([['3','Cursos de exemplo'],['9','Aulas fictícias no curso-base'],['0','Usuários reais cadastrados']]) +
    sectionHead('Operação editorial',badge('Modo de demonstração','purple')) +
    '<div class="grid two">' +
    card('Organização','Catálogo e percursos','Categorias, organização, professores demonstrativos e materiais.',
      demoAction('Ferramentas futuras','Gestão editorial funcional prevista para os sprints de autoria.','small')) +
    card('Qualidade','Verificação do conteúdo','Validação de IDs, blocos, referências e caminhos dos arquivos JSON.',
      demoAction('Validação futura','Os validadores serão implementados no Sprint 2.','small')) +
    '</div>' + demoWarning();
}
function designSystem() {
  return pageHead('Admin / Biblioteca visual','As peças do <em>Atelier.</em>',
    'Uma pequena vitrine dos componentes reutilizáveis. O Design System será refinado a partir dos testes com alunos e professores.') +
    '<div class="tabs" role="tablist" aria-label="Categorias de componentes">'+
      '<button type="button" class="tab" role="tab" id="ui-tab-components" aria-controls="ui-panel-components" aria-selected="true" tabindex="0">Componentes</button>'+
      '<button type="button" class="tab" role="tab" id="ui-tab-states" aria-controls="ui-panel-states" aria-selected="false" tabindex="-1">Estados</button>'+
    '</div>'+
    '<section role="tabpanel" id="ui-panel-components" aria-labelledby="ui-tab-components" tabindex="0">'+
      '<div class="grid two">'+
        '<section class="card"><div class="card-label">Botões e ações</div><h3>Hierarquia visual</h3>'+
          '<p>A ação principal usa laranja quente. A navegação de apoio é discreta e consistente.</p>'+
          '<div class="button-row" style="margin-top:15px">'+demoAction('Ação principal','Este botão é apenas um exemplo do Design System.','action')+
          demoAction('Ação secundária','Este botão é apenas um exemplo do Design System.','')+'</div></section>'+
        '<section class="card"><div class="card-label">Campos</div><h3>Editor amigável</h3>'+
          '<label class="field-label" for="ui-title">Título de exemplo</label>'+
          '<input class="field" id="ui-title" type="text" value="O recalque em Freud" aria-describedby="ui-help">'+
          '<p id="ui-help" style="margin-top:9px">Campo não persistente. As regras de salvamento entram nos sprints de autoria.</p></section>'+
        '<section class="card"><div class="card-label">Sinalização</div><h3>Estados identificáveis</h3>'+
          badge('Rascunho local','purple')+' '+badge('Publicado')+' '+badge('Concluído','green')+
          '<p style="margin-top:15px">As etiquetas precisam ser compreensíveis sem depender apenas das cores.</p></section>'+
        '<section class="card"><div class="card-label">Indicadores</div><h3>Progresso demonstrativo</h3>'+
          '<div class="progress-label"><span>Exemplo fictício</span><span>38%</span></div>'+
          '<div class="progress" role="img" aria-label="Progresso fictício de trinta e oito por cento"><span style="width:38%"></span></div>'+
          '<p style="margin-top:15px">Até haver persistência, este número permanece identificado como demonstração.</p></section>'+
      '</div>'+
    '</section>'+
    '<section role="tabpanel" id="ui-panel-states" aria-labelledby="ui-tab-states" tabindex="0" hidden>'+
      '<div class="grid two">'+
       '<section class="card" role="status"><div class="card-label">Carregando</div><h3>Preparando conteúdo</h3>'+
         '<p>Indicadores de carregamento devem explicar o que está acontecendo, sem uma tela vazia.</p></section>'+
       '<section class="card" role="alert"><div class="card-label">Erro recuperável</div><h3>Conteúdo indisponível</h3>'+
         '<p>Mostrar causa compreensível e uma ação para voltar ou tentar novamente.</p>'+
         action('Voltar ao catálogo →','#/cursos','small')+'</section>'+
       '<section class="card"><div class="card-label">Estado vazio</div><h3>Nenhuma aula criada</h3>'+
         '<p>Apresentar uma primeira ação concreta e acessível em vez de uma área silenciosa.</p></section>'+
       '<section class="card"><div class="card-label">Aviso</div><h3>Salvo neste dispositivo</h3>'+
         '<p>No futuro, este aviso só aparecerá depois de uma gravação local confirmada.</p></section>'+
      '</div>'+
    '</section>'+
    demoWarning();
}
export function routeView(path) {
  if (path === '/aluno' || path === '/') return {title:'Início do aluno',area:'Aluno',html:home()};
  if (path === '/cursos') return {title:'Catálogo',area:'Aluno',html:catalog()};
  if (path === '/cursos/'+COURSE_ID) return {title:'Fundamentos da Psicanálise',area:'Aluno',html:course()};
  if (path === '/cursos/'+COURSE_ID+'/aulas/'+LESSON_ID) return {title:'O recalque em Freud',area:'Aluno',html:lesson(false)};
  if (path === '/aluno/caderno') return {title:'Meu caderno',area:'Aluno',html:caderno()};
  if (path === '/aluno/progresso') return {title:'Meu progresso',area:'Aluno',html:progresso()};
  if (path === '/professor') return {title:'Painel do professor',area:'Professor',html:teacher()};
  if (path === '/professor/cursos/'+COURSE_ID) return {title:'Estrutura do curso',area:'Professor',html:teacherStructure()};
  if (path === '/professor/cursos/'+COURSE_ID+'/aulas/'+LESSON_ID+'/editar') return {title:'Estúdio de criação',area:'Professor',html:studio()};
  if (path === '/professor/cursos/'+COURSE_ID+'/aulas/'+LESSON_ID+'/previa') return {title:'Prévia como aluno',area:'Professor',html:lesson(true)};
  if (path === '/admin') return {title:'Administração',area:'Administrador',html:admin()};
  if (path === '/admin/identidade') return {title:'Biblioteca visual',area:'Administrador',html:designSystem()};
  return {title:'Página não encontrada',area:'Atelier',html:notFound()};
}
