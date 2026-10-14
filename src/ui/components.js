/* Componentes HTML da interface; dados interpolados passam por escape. */
export function escapeHTML(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[c]);
}
export function badge(text, tone) {
  return '<span class="tag' + (tone ? ' ' + escapeHTML(tone) : '') + '">' + escapeHTML(text) + '</span>';
}
export function action(label, href, kind) {
  return '<a class="button' + (kind ? ' ' + escapeHTML(kind) : '') + '" href="' +
    escapeHTML(href) + '">' + escapeHTML(label) + '</a>';
}
export function demoAction(label, msg, kind) {
  return '<button class="button' + (kind ? ' ' + escapeHTML(kind) : '') +
    '" type="button" data-info="' + escapeHTML(msg) + '">' + escapeHTML(label) + '</button>';
}
export function note(inner) {
  return '<div class="footnote">' + inner + '</div>';
}
export function pageHead(eyebrow, title, lead) {
  return '<div class="overline">' + escapeHTML(eyebrow) + '</div><h1 class="page-title">' +
    title + '</h1>' + (lead ? '<p class="lead">' + escapeHTML(lead) + '</p>' : '');
}
export function sectionHead(title, aside) {
  return '<div class="section-header"><h2 class="section-title">' + escapeHTML(title) + '</h2>' +
    (aside || '') + '</div>';
}
export function card(label, title, description, cta) {
  return '<article class="card"><div class="card-label">' + escapeHTML(label) +
    '</div><h3>' + escapeHTML(title) + '</h3><p>' + escapeHTML(description) + '</p>' +
    (cta || '') + '</article>';
}
export function emptyState(title, text, linkHTML) {
  return '<section class="info-state"><div class="overline">Estado vazio</div><h2>' +
    escapeHTML(title) + '</h2><p>' + escapeHTML(text) + '</p>' + (linkHTML || '') + '</section>';
}
export function notFound() {
  return pageHead('Navegação / Não encontrado', 'Este endereço não existe.',
    'O conteúdo solicitado ainda não está disponível nesta demonstração.') +
    emptyState('Volte ao início', 'Você pode explorar os ambientes ou conhecer o protótipo anterior.',
    action('Voltar ao aluno →', '#/aluno', 'action'));
}
export function demoWarning() {
  return note('<strong>Ambiente de demonstração:</strong> cursos, estatísticas, aulas e perfis exibidos nesta etapa são fictícios. Ainda não há login, banco de dados, salvamento de notas nem publicação pelo editor.');
}
