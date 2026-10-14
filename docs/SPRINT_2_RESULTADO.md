# ATELIER — Resultado do Sprint 2
**14/10/2026 · Implementação concluída no GitHub; validação em navegador real ainda pendente**

## 1. Objetivo

Retirar cursos e aulas fixos do JavaScript e estabelecer a primeira camada funcional de leitura de **JSON publicado**, com validação, visualização no ambiente do aluno e um **editor técnico local** para testar rascunhos. Sem Supabase, login real ou infraestrutura paga.

## 2. Arquivos implantados

| Entrega | Caminho |
|---|---|
| Catálogo de cursos JSON | `content/catalogo.json` |
| Manifesto do curso | `content/courses/fundamentos/curso.json` |
| Aula de exemplo (cinco blocos) | `content/courses/fundamentos/aulas/recalque.json` |
| Esquemas formais JSON Schema 2020-12 | `schemas/catalog.schema.json`, `schemas/course.schema.json`, `schemas/lesson.schema.json` |
| Validações utilizadas pelo navegador | `src/repositories/validators.js` |
| Repositório de leitura de conteúdo | `src/repositories/content-repository.js` |
| Repositório de rascunhos locais | `src/repositories/draft-repository.js` |
| Renderizador básico seguro por tipo de bloco | `src/lesson-engine/basic-renderer.js` |
| Telas conectadas aos dados | `src/app/views.js` |
| Navegação assíncrona e comandos do editor | `src/app/main.js` |
| Diagnóstico executável no navegador | `tests/smoke.html`, `tests/smoke.js` |

Os JSON anteriores de `docs/exemplos/` continuam existindo como **referências de projeto**. A aplicação utiliza apenas os arquivos de `content/` para conteúdo publicado.

## 3. Rotas para experimentar

Base esperada do GitHub Pages: `https://pscfredteixeira.github.io/Atelie/`.

- **Aluno:** `#/aluno`.
- **Catálogo JSON:** `#/cursos`.
- **Curso:** `#/cursos/curso-fundamentos`.
- **Aula:** `#/cursos/curso-fundamentos/aulas/aula-recalque`.
- **Professor:** `#/professor`.
- **Estrutura do curso:** `#/professor/cursos/curso-fundamentos`.
- **Editor técnico JSON:** `#/professor/cursos/curso-fundamentos/aulas/aula-recalque/editar`.
- **Prévia do professor:** `#/professor/cursos/curso-fundamentos/aulas/aula-recalque/previa`.
- **Teste local no próprio navegador:** `tests/smoke.html`.

### Funcionamento do professor

1. O professor abre a aula já publicada no Estúdio técnico.
2. Se existir um rascunho salvo no dispositivo, o editor carrega esse rascunho. Caso contrário, abre uma cópia editável da aula publicada, marcada como `draft`.
3. É possível editar o **JSON completo**, validar e salvar o rascunho no **IndexedDB local**.
4. **Prévia como aluno** usa o rascunho salvo, se houver, e o mesmo renderizador básico da sala do aluno. O texto que ainda não foi salvo **não** entra na prévia.
5. **Exportar JSON** baixa o conteúdo editado; **Importar** lê e valida o arquivo e preenche o editor, sem salvar automaticamente.
6. **Descartar rascunho** apaga a cópia local mediante confirmação.

A operação **Salvar rascunho** não escreve no GitHub. **Exportar** não publica. Para atualizar o conteúdo visível aos alunos, um colaborador deverá revisar o JSON, definir `"status": "published"` no arquivo que será publicado e realizar o commit no repositório. Essa separação é deliberada.

A ferramenta técnica funciona apenas com aulas já registradas no manifesto publicado. A criação visual de novas aulas e módulos continua prevista para os Sprints 5–6.

## 4. O que a sala do aluno já exibe

A aula de exemplo contém: uma pergunta de abertura, um bloco teórico, uma situação inteiramente fictícia, alternativas de um quiz formativo e referências bibliográficas. O conteúdo é carregado do JSON e apresentado em blocos padronizados.

**Limitação atual:** o bloco de múltipla escolha mostra as alternativas, mas não coleta/corrige respostas (Sprint 9). Blocos desconhecidos recebem aviso em vez de impedir a leitura. Essa primeira versão do renderizador prepara o motor pedagógico completo do Sprint 3.

## 5. Testes executados durante a implementação

- [x] Os arquivos foram gravados e lidos de volta do repositório.
- [x] Sintaxe básica dos módulos JavaScript verificada.
- [x] Fluxo `catálogo → manifesto → aula` executado num ambiente isolado com respostas JSON simuladas (mesmos arquivos do repositório).
- [x] Validador rejeita ID de bloco duplicado, quiz com gabarito inexistente, referência ausente, vínculo incorreto com curso e versão de esquema incompatível.
- [x] Renderizador gerou cinco seções e codificou conteúdo HTML injetado como texto.
- [x] Rotas principais de Aluno, Professor e Admin renderizadas em isolamento, incluindo curso, aula, editor e prévia.
- [x] Arquivos JSON Schema criados; ainda não foram conectados a um mecanismo automático de validação em tempo de execução (o navegador usa os validadores JavaScript).
- [ ] **Site público**: confirmação do deploy não disponível nesta execução.
- [ ] **Navegador real**: clique, edição, importação, download, confirmação, persistência/reabertura do IndexedDB e atualização entre rotas ainda precisam de teste de ponta a ponta.
- [ ] **Dispositivos**: verificar layout, teclado e leitura em iPhone, Android e desktop.
- [ ] **Acessibilidade**: auditoria visual, WCAG, teclado e leitor de tela pendentes.

**Diagnóstico disponível:** `/tests/smoke.html`, que executa sete verificações no próprio navegador, incluindo criação e remoção de um rascunho **temporário fictício** no IndexedDB. Não altera dados do aluno nem envia dados a um servidor.

## 6. Segurança e limites

- O repositório do GitHub Pages é **público**; toda aula enviada para o browser poderá ser visualizada por terceiros.
- Não existe autenticação verdadeira. As opções Aluno, Professor e Administrador são apenas interfaces de demonstração.
- IndexedDB é local ao navegador e à origem. Trocar de aparelho ou limpar os dados locais pode eliminar rascunhos.
- Nunca colocar senhas, informações de pacientes ou dados pessoais sensíveis em JSON, rascunhos compartilhados ou arquivos publicados.
- Não há sincronização nem painel central de alunos. O Supabase permanece **totalmente fora deste projeto**.
- O histórico dos conteúdos publicados fica no GitHub; rascunhos locais ainda exigem exportação manual para backup.

## 7. Critérios e passagem ao Sprint 3

| Critério | Estado |
|---|---|
| Conteúdo separado de componentes | Implementado |
| Um curso e uma aula carregáveis via JSON | Implementado e testado em isolamento |
| IDs, referências e vínculos validados | Implementado |
| Salvar, importar e exportar rascunhos | Código implementado; teste de navegador pendente |
| Renderização inicial a partir de blocos | Implementada (cinco tipos) |
| Editor visual completo | Planejado para Sprint 6 |
| Progresso de alunos | Planejado para Sprint 10 |

**Próximo: Sprint 3 — Motor pedagógico de aulas.** Evoluir o renderizador básico para componentes registrados por tipo, suporte a ordem e configurações, estados de bloco, comportamento de leitura e prévia idêntica à sala do aluno; manter avaliação interativa avançada para o Sprint 9.

Documentos de referência: [Arquitetura geral](../ARQUITETURA_ATELIER.md), [Contrato de conteúdo](CONTRATO_CONTEUDO.md), [Rotas e estados](ROTAS_E_ESTADOS.md).

**O repositório legado `sistema` não foi alterado.**
