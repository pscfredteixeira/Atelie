# ATELIER — Contrato de conteúdo, blocos e persistência
**Sprint 0.3 · versão de proposta 1 · 14/10/2026**

> Especificação para orientar a implementação do Sprint 2. Os exemplos JSON anexos são **modelos válidos de sintaxe e coerência entre IDs**, ainda não um esquema formal executável. O motor de aulas e o editor persistente não existem nesta etapa.

## 1. Objetivo e princípios

O Atelier deve criar e exibir aulas sem introduzir condições especiais para curso, módulo ou aula. O conteúdo é dado, o componente é código; os professores montam aulas por um editor, e a mesma composição é apresentada aos alunos.

- **Curso → Módulo → Aula → Bloco**, com IDs estáveis e sequência explícita.
- **JSON em arquivos públicos** para pacotes demonstrativos; **IndexedDB no navegador** para rascunhos locais, progresso e anotações.
- **Sem senha real em JSON, sem dados pessoais reais em conteúdos públicos.**
- O estado de publicação é um **controle editorial**, não um mecanismo de autorização.
- Migração futura para API e banco por interfaces de dados, sem refazer os blocos.
- Exemplos pedagógicos usados no protótipo devem ser fictícios e devidamente identificados.

## 2. Pacote de conteúdo (candidato à especificação v1)

```text
content/
  catalogo.json                            ← lista os cursos e localiza seus manifestos
  courses/
    fundamentos-da-psicanalise/
      curso.json                           ← metadados e ordem de módulos/aulas
      aulas/
        recalque-em-freud.json            ← conteúdo completo da aula
      media/
        ...                               ← imagens, trilhas, legendas (quando houver)
```

A localização física pode mudar durante o Sprint 2, desde que o catálogo sempre contenha o caminho para o manifesto e o manifesto contenha caminhos para as aulas. **Não concatenar paths a partir do título ou ID na UI.** URLs relativas são resolvidas contra a URL do documento que as declara, não contra a rota da tela.

Exemplos vinculados desta especificação:

- [Catálogo demonstrativo](exemplos/catalogo.v1.json).
- [Manifesto do curso demonstrativo](exemplos/curso-fundamentos.v1.json).
- [Aula com cinco blocos](exemplos/aula-recalque.v1.json).

Os três exemplos são material de projeto; ainda não são usados como fonte de dados da aplicação.

### Catálogo (`kind: "catalog"`)

Campos:
- `schemaVersion`: inteiro, inicialmente `1`.
- `courses[]`: identificador, título, slug, caminho `manifest`, status.
- A lista funciona como **índice publicado**. Em produção o servidor poderá oferecer exatamente a mesma consulta.

### Manifesto do curso (`kind: "course"`)

Campos obrigatórios propostos:
- `schemaVersion`, `kind`, `id`, `slug`, `revision`, `status`, `title`, `modules[]`.
- Cada módulo: `id`, `title`, `position`, `lessons[]`.
- Cada item de `lessons[]`: `id`, `path`, `position`.
- Descrição, objetivos, duração, autores e metadados são complementares.

`position` permite reordenar preservando `id`. O manifesto é a **fonte oficial da ordem do percurso**. Em especial, **uma aula não armazena a ordem do módulo**.

### Aula (`kind: "lesson"`)

Campos obrigatórios propostos:
- `schemaVersion`, `kind`, `id`, `courseId`, `moduleId`, `slug`, `revision`, `status`, `title`, `blocks[]`.
- Metadados desejáveis: `summary`, `objectives[]`, `estimatedMinutes`, `references[]`, `metadata`.
- Blocos aparecem **na ordem do array**, sem necessidade de `position`.

`courseId` e `moduleId` na aula devem concordar com o manifesto; a validação detectará conflitos. `slug` é voltado à apresentação, **não substitui** o ID estável.

## 3. Contrato de blocos

Formato comum a todos os blocos:

```json
{
  "id": "texto-001",
  "type": "rich_text",
  "version": 1,
  "data": {
    "title": "Um conceito, não uma tradução automática",
    "paragraphs": ["Parágrafo demonstrativo."]
  },
  "settings": {}
}
```

Regras:
1. `id` único dentro da aula; nunca reutilizar o ID de um bloco removido para outro conceito.
2. `type` identifica o **componente renderizador**; `version` controla o formato específico daquele componente.
3. `data` contém somente os dados daquele tipo de bloco; `settings` controla aspectos não essenciais (ex.: `isRequired`).
4. A UI não interpreta propriedades desconhecidas automaticamente. Um tipo/versão não suportado resulta em aviso de componente incompatível, sem travar a aula inteira.
5. Textos comuns são tratados como **texto**, nunca como HTML arbitrário. Caso no futuro haja rich text verdadeiro, será adotado formato estruturado e sanitização.
6. Conteúdo pedagógico não pode executar JavaScript arbitrário por vir de JSON.

## 4. Catálogo de componentes e prioridade

| Tipo de bloco | Configuração pedagógica mínima | Apresentação do aluno | Fase |
|---|---|---|---|
| `heading` | texto e nível | Título semânticamente hierárquico | P0 |
| `rich_text` | título e parágrafos | Texto editorial legível | P0 |
| `question` | pergunta e dica opcional | Pergunta para reflexão | P0 |
| `concept` | termo e explicação | Conceito revelável, acessível por teclado | P1 |
| `image` | asset, alt, legenda, crédito | Imagem responsiva e contexto | P1 |
| `quote` | citação curta, atribuição, fonte | Destaque tipográfico | P1 |
| `clinical_vignette` | cena fictícia, reflexão, ressalva | Exemplo para investigação, sem diagnóstico automático | P0 |
| `multiple_choice` | pergunta, opções com ID, ID correto, feedback | Feedback de compreensão; tentativa formativa | P0/P1 |
| `references` | IDs de referências bibliográficas da aula | Lista verificável de fontes | P0 |
| `audio` | asset e transcrição | Reprodutor com alternativa textual | P1 |
| `video` | asset, legenda/transcrição | Reprodutor com mídia acessível | P1 |
| `timeline` | eventos ordenados e fontes | Linha do tempo navegável | P1 |
| `comparison` | critérios e perspectivas | Comparação de ideias | P1 |
| `interactive_lab` | `engineId`, `engineVersion`, `config` | Experiência registrada no motor de laboratórios | P1 / Sprint 8 |

**P0/P1** indica prioridades de estrutura. O Sprint 3 poderá começar com apenas o conjunto mínimo de renderizadores e ampliar os demais nos sprints indicados. A prioridade não implica que os componentes já estejam implementados.

### Exemplos de validações específicas

- `multiple_choice`: ao menos duas opções, IDs distintos e `correctOptionId` existente em `options[]`; feedback obrigatório. A resposta correta estará exposta no JSON público, portanto **não constitui exame protegido contra consulta**.
- `image`: texto alternativo ou indicação explícita de imagem decorativa; caminhos não podem escapar das pastas de conteúdo permitidas.
- `audio`/`video`: dados de transcrição/legenda e indicação de direitos de uso.
- `references`: cada `referenceId` precisa existir em `lesson.references`.
- `interactive_lab`: se não houver motor compatível, mostrar instrução alternativa ou indisponibilidade sem quebrar a navegação.
- `clinical_vignette`: não publicar dados identificáveis de pacientes.

## 5. Conteúdo publicado, rascunho e prévia

**Três fontes separadas:**

| Fonte | Lê | Escreve | Visível ao aluno? |
|---|---|---|---|
| JSON público | Catálogo e aulas publicadas | Somente atualização do repositório | Sim |
| Rascunho em IndexedDB | Edição do professor no navegador | Editor local | Não, exceto prévia deliberada |
| Estado de aprendizagem local | Notas, respostas, conclusão | Aluno no navegador | Apenas no perfil local correspondente |

Regra de resolução:
1. **Sala do aluno** carrega exclusivamente o índice e os arquivos **publicados**.
2. **Estúdio** abre prioritariamente o rascunho local da aula; se não existir, cria uma cópia editável do JSON-base sem alterá-lo.
3. **Prévia** renderiza explicitamente o rascunho atual no mesmo motor pedagógico; não modifica a versão publicada.
4. **Exportar** serializa e valida uma versão portável.
5. **Publicar** é uma ação diferente: no protótipo, colocar JSON e mídias nos caminhos corretos do repositório, fazer commit e aguardar publicação do Pages. Trocar `status` para `published` **sozinho** não publica um arquivo local.

O usuário deve ver em todos os momentos **“Rascunho local”**, **“Prévia”** ou **“Publicado”**. Proibir textos como “Salvo na nuvem” nesta fase.

## 6. Repositórios de dados (interfaces propostas)

```ts
interface ContentRepository {
  listPublishedCourses(): Promise<CourseSummary[]>;
  getCourse(courseId: string): Promise<Course>;
  getPublishedLesson(lessonId: string): Promise<Lesson>;
}
interface DraftRepository {
  getDraft(entityKind: "course"|"lesson", id: string): Promise<unknown|null>;
  saveDraft(entityKind: "course"|"lesson", entity: unknown): Promise<void>;
  deleteDraft(entityKind: "course"|"lesson", id: string): Promise<void>;
  exportPackage(courseId: string): Promise<ExportBundle>;
}
interface LearningRepository {
  getLessonState(profileId: string, lessonId: string): Promise<LearningState|null>;
  saveLessonState(state: LearningState): Promise<void>;
  exportProfile(profileId: string): Promise<ExportBundle>;
  importProfile(bundle: ExportBundle): Promise<void>;
}
```

Os tipos TypeScript são **referências de contrato**, não uma escolha definitiva de linguagem para o projeto. O adaptador de leitura usará `fetch` de JSON estático, e o de escrita usará IndexedDB. Mais adiante, a mesma interface poderá conectar um servidor próprio.

### Dados do estudante

- Separados do conteúdo da aula.
- Chave local composta: `profileId + lessonId`; IDs de perfil são fictícios durante testes.
- Respostas referenciam `blockId` e a versão do bloco para detectar mudanças.
- Progresso: `not_started`, `in_progress`, `completed`; `completedAt` e último bloco visto.
- Notas: texto local, momento de edição, ID da aula.
- Dados nunca embutidos no JSON distribuído do curso.
- Exportação/importação devem incluir versão do formato e validação antes de substituir dados.

## 7. Invariantes e migrações

1. Cada entidade tem `schemaVersion`; `revision` identifica uma revisão editorial dentro do mesmo esquema.
2. IDs não mudam porque título, ordem ou caminho mudaram. Mover arquivo exige atualizar manifesto; ID permanece.
3. Revisar aula publicada gera novo rascunho; a versão atual publicada permanece até substituição explícita.
4. Não assumir que todos os componentes existem em todas as versões: uma aula incompatível gera diagnóstico.
5. Ao atualizar uma pergunta, respostas anteriores são preservadas como histórico local, mas **não tratadas automaticamente como válidas** para a nova versão.
6. Futuras migrações devem preservar IDs do conteúdo, estados dos estudantes e datas quando houver equivalência.
7. Histórico de versões no protótipo: commits do GitHub para pacotes publicados + exportações de rascunho; não prometer histórico remoto automático do editor.
8. Uma exportação deve trazer `format`, `schemaVersion`, `exportedAt`, índice de arquivos e conteúdo; mídia externa pode requerer arquivos adicionais — avisar explicitamente.

## 8. Testes que orientarão o Sprint 2

- Carregar índice → manifesto → aula de um subdiretório com caminhos relativos.
- Rejeitar arquivo JSON inválido sem travar as demais páginas.
- Rejeitar IDs duplicados ou referência inexistente.
- Validar `correctOptionId` de quiz e IDs bibliográficos.
- Adicionar, mover e excluir blocos preservando IDs dos restantes.
- Editar um rascunho sem alterar a aula publicada.
- Recarregar o navegador e recuperar o rascunho local.
- Exportar JSON e importá-lo em outra instalação local.
- Testar indisponibilidade de IndexedDB (aviso + exportação manual).
- Garantir que o aluno não veja um rascunho do professor só porque estão no mesmo dispositivo.

## 9. O que NÃO está sendo implementado agora

- Schema formal (JSON Schema) com validador automático; fará parte do Sprint 2.
- Motor de renderização; Sprint 3.
- Persistência IndexedDB no produto; Sprints 2, 5, 6 e 10.
- Login real, autorização, matrículas pagas e sincronização; fase comercial posterior.
- Interatividades avançadas; Sprint 8.

**Situação:** contrato de arquitetura documentado, pronto para revisão; exemplos de JSON criados e conferidos quanto à sintaxe e vínculos básicos.
