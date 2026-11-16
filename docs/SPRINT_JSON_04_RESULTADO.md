# Ateliê — Sprint JSON 4: editor visual de aulas
**15/11/2026 · Desenvolvimento em branch isolada · Não publicado no GitHub Pages**

## Objetivo

Permitir criar, editar, reorganizar, visualizar e exportar aulas formadas por blocos JSON v1 usando uma interface visual, sem editar o JSON manualmente. A evolução reutiliza as operações e formulários existentes da arquitetura do Ateliê; **não introduz outro esquema concorrente**.

## Escopo implementado

- **Rota:** `#/laboratorio/editor`, acessível pelo Estúdio (`#/estudio`) ou pelo laboratório JSON (`#/laboratorio/json`).
- **Painel do editor:** apresenta os cursos de teste, as aulas existentes e rascunhos locais de aulas novas.
- **Criar aula:** escolhe um módulo técnico, informa um título e cria um rascunho com ID único.
- **Editar aula existente:** parte de uma **cópia local** da versão publicada; não altera os arquivos do GitHub.
- **Dados da aula:** título, resumo, objetivos e duração.
- **Blocos:** adicionar componentes v1, selecionar e editar campos, mover para cima/baixo, duplicar e excluir, preservando IDs dos demais blocos.
- **Bibliografia:** editar referências por linhas, com verificação de formato e vínculo com blocos bibliográficos.
- **Prévia:** usa `renderLessonBlocks` do motor de aulas com quiz e laboratório interativos. As respostas da prévia não são persistidas.
- **Salvar rascunho:** usa o `IndexedDB` existente por `courseId + lessonId` e marca `status: "draft"`.
- **Importar JSON:** lê um arquivo do computador e valida o contrato; somente aceita conteúdo com os mesmos IDs de aula, curso e módulo da edição aberta.
- **Exportar JSON:** baixa uma cópia portável para revisão/commit posterior; não publica.
- **Descartar rascunho:** remove a cópia local depois de confirmação. Para aulas que já existem publicadas, restaura a versão de referência.
- **Proteção contra perda:** avisa ao trocar de rota ou recarregar a página quando existem alterações não salvas.

Os 14 tipos de componentes com campos de autoria são os existentes em `src/features/authoring/lesson-editor.js` e `src/features/authoring/block-fields.js`.

## Arquivos e compatibilidade

| Arquivo | Responsabilidade |
|---|---|
| `json-studio.js` | Interface visual, navegação, validação, rascunho, importação e exportação |
| `json-studio.css` | Visual responsivo isolado no namespace `.json-studio` |
| `app.js` | Integra a rota `#/laboratorio/editor` e protege formulários em navegação |
| `index.html` | Carrega apenas a folha de estilos isolada |
| `json-pilot.js` | Links para o editor a partir de catálogo e aulas do laboratório |
| `scripts/verify-json-studio.mjs` | Testes automatizáveis em Node das operações puras de autoria |
| `tests/json-studio-smoke.html` | Verificação acionável no navegador para formulário, prévia e IndexedDB |

**Inalterados:** `content/catalogo.json` público, os manifests e arquivos HTML das quatro aulas históricas, regras do Firebase/Firestore e progresso dos estudantes.

## Como experimentar quando a branch estiver num servidor de desenvolvimento

1. Abra `#/estudio` e clique em **Abrir editor visual JSON**, ou entre diretamente em `#/laboratorio/editor`.
2. Escolha **Editar cópia** de uma aula existente ou **Criar aula** dentro de um módulo.
3. Clique num bloco para visualizar seus campos. Altere e use **Aplicar alterações**.
4. Adicione, duplique ou reorganize blocos pelas ferramentas da coluna lateral.
5. Use a aba **Prévia** para conferir o conteúdo; as respostas do quiz não são salvas.
6. Clique em **Salvar rascunho** para preservar localmente ou **Exportar JSON** para obter o arquivo.
7. Para continuar uma aula nova, abra o painel do editor no mesmo navegador e selecione o rascunho local.

Um arquivo `status: "draft"` baixado continua **não publicado**. A publicação exige revisão editorial, atualização do manifesto e commit no GitHub, em etapa posterior.

## Verificações técnicas realizadas

- [x] Sintaxe do novo módulo e integração no `app.js` verificadas em execução JavaScript isolada.
- [x] A interpretação das rotas do editor aceitou painel, edição e criação; rejeitou combinações inválidas e IDs com percurso `../`.
- [x] Validador real do Ateliê aplicado a rascunho criado e a operações de edição.
- [x] Fluxos de título, objetivos, adicionar, editar, mover, duplicar e remover blocos executados em isolamento; a aula original permaneceu intacta.
- [x] Os formulários dos **14 tipos de blocos** foram gerados com o módulo `block-fields.js` existente.
- [x] Arquivo `scripts/verify-json-studio.mjs` criado para repetir as verificações num checkout completo.
- [x] Teste de navegador `tests/json-studio-smoke.html` criado para leitura, formulário e IndexedDB temporário.

## Pendências para considerar a sprint homologada

- [ ] Rodar `node scripts/verify-json-studio.mjs` em uma cópia integral da branch com Node 22+.
- [ ] Rodar `node scripts/verify-json-pilot.mjs` para testar a herança das Sprints 2 e 3.
- [ ] Em servidor HTTP local, abrir `tests/json-studio-smoke.html`, clicar em **Executar testes** e conferir salvamento e remoção do rascunho temporário.
- [ ] Testar manualmente criação e edição no Chrome desktop, Safari/iPhone e Android: campos, importação/exportação, proteção de alterações, armazenamento bloqueado e navegação.
- [ ] Conferir acessibilidade de formulários, ordem de tabulação, responsividade e regressão das quatro aulas HTML existentes.

**Não foi possível testar navegador real nem o Node completo nesta execução.** Os testes marcados como executados acima foram realizados por execução isolada das funções efetivamente presentes no repositório; não substituem homologação ponta a ponta.

## Segurança e limites

O editor de laboratório **não é uma área administrativa autenticada**. Qualquer visitante com acesso ao site pode abrir o editor e criar rascunhos **na própria instância local do navegador**, sem poder publicar arquivos. Pessoas que compartilham o mesmo perfil de navegador podem ter acesso aos rascunhos locais; não usar para dados pessoais ou clínicos. Não há sincronização entre dispositivos, upload de mídia, permissões de professor, publicação automática, certificado ou escrita de progresso.

## Próxima etapa

A **Sprint JSON 5** deverá consolidar o fluxo editorial de revisão e publicação supervisionada: validar o JSON exportado, produzir instruções de atualização do manifesto e separar claramente **rascunho → revisão → publicação** sem fornecer acesso de escrita anônimo ao repositório ou ao banco.
