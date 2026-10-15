# Atelier — Sprint 14: estabilização e experiência de uso
**Data: 14 de outubro de 2026 | Código atualizado no GitHub, homologação visual pendente**

## Objetivo e resultado

Prioridade à confiabilidade da experiência criada nos Sprints 0–13, especialmente **criar → editar → salvar → disponibilizar → estudar**. O sistema continua estático no GitHub Pages; não existe autenticação real nem sincronização entre aparelhos.

O Sprint 14 fez melhorias defensivas na arquitetura existente, sem substituir arquivos de cursos ou apagar dados locais. **Não equivale a uma auditoria completa em navegadores reais.**

## Correções efetivamente implantadas

| Área | Problema identificado | Ajuste |
|---|---|---|
| Cursos locais | O Estúdio podia aguardar uma consulta ao GitHub mesmo tendo o manifesto no navegador | Priorizar rascunho e catálogo locais em `src/app/views.js` |
| Edição de aulas | A abertura de aula salva consultava desnecessariamente a versão pública e podia falhar offline | Resolver a aula pelo rascunho/versão local primeiro, em `studio-controller.js` |
| Integridade editorial | Ao salvar uma aula, o Estúdio podia sobrescrever um manifesto modificado em outro momento | Reconsultar a versão atual do manifesto antes de sincronizar o título, resumo e duração da aula |
| Histórico do aluno | Ações quase simultâneas (anotar, marcar conclusão e responder) podiam ler a mesma versão antiga e perder alterações | Enfileirar gravações por **perfil + curso + aula** no IndexedDB |
| Rede | Uma requisição por JSON sem limite de duração podia deixar a aplicação na tela de carregamento | Cancelar leitura após 10 segundos, exibir erro legível e permitir tentar novamente |
| Menu | Busca lenta pelo seletor ou árvore de módulos podia bloquear a composição da página | Aplicar espera máxima de 3,5 s, com nomes dos cursos principais como alternativa |
| Publicação local | Cursos sem nenhuma aula podiam ser disponibilizados como se estivessem prontos | Exigir ao menos uma aula; a checagem anterior de integridade das aulas permanece |
| Mobile | A camada escura do menu podia se duplicar ao trocar de curso e prejudicar os toques | Renderizar/remover a camada no contêiner do app, não solta no `body` |
| Acessibilidade básica | O menu lateral não tinha fechamento direto por tecla Escape | Adicionar fechamento por teclado e reforçar áreas de toque e rolagem |
| Testes de regressão | Faltavam verificações para alterações concorrentes e curso vazio | Adicionar dois testes de navegador em `tests/smoke.js` |

## Fluxos para homologação manual

### Professor — criar e editar

1. Abrir `#/professor`, criar um curso fictício.
2. Adicionar dois módulos e uma aula fictícia; salvar pelo Estúdio Visual.
3. Fechar/reabrir a página ou recarregá-la; confirmar persistência do curso, módulos, aula e blocos.
4. Na mesma aula, alterar um texto e salvar; verificar se os módulos não desapareceram.
5. Disponibilizar o curso no navegador e encontrá-lo no catálogo do aluno.
6. Confirmar que não é possível disponibilizar um curso vazio.
7. Baixar um backup de teste, restaurá-lo em ambiente isolado e confirmar sua integridade.

### Aluno — navegação e histórico

1. Abrir `#/cursos` e encontrar **Introdução à Psicanálise** e **Formação Freudiana**.
2. Selecionar um curso no menu; abrir seus módulos e, quando houver aulas, navegar por eles.
3. Executar um quiz no curso demonstrativo e conferir o feedback.
4. Fazer anotações e marcar conclusão; conferir em `#/aluno/caderno` e `#/aluno/progresso`.
5. Testar mudança de perfil fictício A/B e a separação do histórico.
6. Testar simultaneidade de salvamento via diagnóstico funcional.

### Celular e acessibilidade

1. Testar em larguras de 320, 375, 390, 430 e 768 px, observando rolagem lateral.
2. Abrir o menu lateral, trocar de curso e conferir se ele permanece utilizável, sem duas camadas escuras.
3. Fechar o menu pelo botão e por Escape quando houver teclado.
4. Navegar pelos botões de mover bloco, formulários e links com teclado; testar foco visível.
5. Testar a opção do sistema de reduzir movimento e a recuperação de erros.

## Verificação realizada nesta implementação

- [x] 12 módulos principais (incluindo fluxo de inicialização, Estúdio, validação e testes) passaram em verificação isolada de sintaxe.
- [x] Dois manifestos públicos: **8 módulos** em Introdução à Psicanálise e **10 módulos** em Formação Freudiana.
- [x] Modelo de curso sem aulas rejeitado na função de disponibilização.
- [x] Curso com uma aula fictícia aceito em teste isolado de publicação.
- [x] Três atualizações concorrentes do mesmo registro (nota, conclusão e resposta) preservadas no teste simulado.
- [x] Abertura local do Estúdio preparada para não consultar a rede quando o rascunho da aula existe.
- [x] Diagnóstico em navegador ampliado para testar concorrência e rejeitar curso vazio.

### Pendências — **não homologadas**

- [ ] Executar `tests/smoke.html` e `tests/quality.html` num navegador real com IndexedDB disponível.
- [ ] Confirmar que o GitHub Pages disponibilizou a versão mais recente de todos os módulos.
- [ ] Conferir visual e funcionalmente iPhone, Android, Safari, Chrome e desktop.
- [ ] Realizar teste de backup e restauração com conteúdo fictício completo.
- [ ] Auditar acessibilidade com leitor de tela e usuário de teclado.
- [ ] Validar pedagogicamente as aulas antes da participação de alunos convidados.

O endereço do GitHub Pages não esteve acessível à ferramenta de inspeção remota nesta revisão. **Não afirmar que o site publicado foi testado ou que a experiência foi homologada.**

## Links

- Aplicação: `https://pscfredteixeira.github.io/Atelie/`
- Estúdio do professor: `https://pscfredteixeira.github.io/Atelie/#/professor`
- Diagnóstico funcional: `https://pscfredteixeira.github.io/Atelie/tests/smoke.html`
- Diagnóstico de interface: `https://pscfredteixeira.github.io/Atelie/tests/quality.html`
- Diagnóstico de inicialização: `https://pscfredteixeira.github.io/Atelie/tests/initialization.html`

**Próxima etapa:** Sprint 15 — planejamento editorial e produção didática do curso **Introdução à Psicanálise**, após conferir as rotas e salvar dados fictícios num navegador real. Não usar dados clínicos reais em cursos ou backups do protótipo.

**Restrições preservadas:** somente repositório `pscfredteixeira/Atelie` alterado. Sem Supabase e sem modificações no antigo `pscfredteixeira/sistema`.
