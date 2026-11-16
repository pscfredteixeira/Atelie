# Ateliê — Sprint JSON 1: contrato consolidado
**14/11/2026 · Proposta não publicada · Compatível com o repositório na branch `main`**

## Objetivo
Consolidar o formato atual de cursos e aulas em JSON, sem reconstruir o Ateliê nem alterar aulas publicadas. Este documento **complementa**, não substitui, o contrato histórico [`CONTRATO_CONTEUDO.md`](CONTRATO_CONTEUDO.md). A expressão "Sprint JSON 1" refere-se ao novo roteiro de evolução, não ao Sprint 1 histórico (implementação visual de outubro).

## Diagnóstico confirmado no código

O Ateliê **já utiliza JSON v1**. Não é preciso criar um formato paralelo:

- Índice de cursos: [`content/catalogo.json`](../content/catalogo.json).
- Manifests com percurso: `content/courses/<curso>/curso.json`.
- Aulas: `content/courses/<curso>/aulas/<aula>.json`.
- Contratos formais: [`schemas/catalog.schema.json`](../schemas/catalog.schema.json), [`schemas/course.schema.json`](../schemas/course.schema.json), [`schemas/lesson.schema.json`](../schemas/lesson.schema.json) (JSON Schema 2020-12).
- Validação que a aplicação realmente executa: [`src/repositories/validators.js`](../src/repositories/validators.js). Os arquivos JSON Schema existem, mas **não são executados automaticamente** pela aplicação.
- Leitura e resolução de caminhos: [`src/repositories/content-repository.js`](../src/repositories/content-repository.js).
- Renderizadores de blocos: [`src/lesson-engine/block-renderers.js`](../src/lesson-engine/block-renderers.js), [`src/lesson-engine/engine.js`](../src/lesson-engine/engine.js).
- Autoria visual já disponível: [`src/features/authoring/lesson-editor.js`](../src/features/authoring/lesson-editor.js) e `block-fields.js`.

**Atenção ao histórico:** o README mistura registros de diferentes sprints e estados. Para determinar o que é publicado no momento, consultar o catálogo e seus manifests na revisão analisada, não apenas descrições antigas do README.

## Dois formatos de aula convivem hoje

### A. Aula por blocos JSON (motor genérico)
`blocks[]` contém componentes tipados. O motor renderiza a aula e a prévia; o Estúdio Visual edita os tipos suportados. É o formato preferido **para novas aulas padrão**.

### B. Aula com experiência própria em HTML
Algumas aulas da Formação Freudiana têm `blocks: []` e uma propriedade `metadata.interactivePage`, por exemplo:

```json
"metadata": {
  "interactivePage": "./escuta-que-mudou-a-clinica.html"
}
```

O JSON registra a aula no curso, mas a experiência visual, as etapas e as interações vivem na página HTML. Isso acontece também em `primeira-topica.html` e `freud-antes-de-ser-freud.html`.

**Decisão:** manter ambos os formatos nesta fase. Não afirmar que mudar apenas o JSON altera automaticamente o conteúdo interno, o desbloqueio de etapas ou o acompanhamento dessas páginas especiais. Converter uma delas exige estudo específico de controles, progressão, inscrições e regressão visual em outra sprint.

## Contrato v1 obrigatório

### Catálogo: `kind: "catalog"`
- `schemaVersion: 1`; `courses[]`.
- Cada entrada publicada tem `id`, `title`, `manifest`, `status`. O manifesto começa com `./`.
- O catálogo é o índice de publicação; colocar um arquivo novo em `content/` não cria automaticamente um curso visível.

### Manifesto: `kind: "course"`
- `schemaVersion`, `id`, `slug`, `revision`, `status`, `title`, `modules[]`.
- Cada `module` tem `id`, `title`, `position`, `lessons[]`.
- Cada aula listada tem `id`, `path`, `position`; título, resumo e duração podem aparecer.
- Os `modules[]` são **contêineres técnicos de compatibilidade v1**. A navegação pedagógica atual pode mostrar somente `curso → aulas`, sem impor módulos visuais.

### Aula: `kind: "lesson"`
Campos obrigatórios:
```json
{
  "schemaVersion": 1,
  "kind": "lesson",
  "id": "aula-exemplo",
  "courseId": "curso-formacao-freudiana",
  "moduleId": "modulo-formacao-freudiana-01",
  "slug": "exemplo",
  "revision": 1,
  "status": "draft",
  "title": "Aula de exemplo",
  "blocks": [],
  "references": []
}
```

`summary`, `objectives`, `estimatedMinutes` e `metadata` complementam o conteúdo. `schemaVersion` identifica a estrutura; `revision` acompanha a edição. **Não alterar IDs estáveis para renomear ou reorganizar.**

### Blocos
Cada entrada de `blocks[]` possui:
```json
{
  "id": "texto-inicial",
  "type": "rich_text",
  "version": 1,
  "data": {"title": "Começo", "paragraphs": ["Parágrafo didático."]},
  "settings": {}
}
```

Tipos disponíveis no registro v1: `question`, `rich_text`, `heading`, `concept`, `clinical_vignette`, `multiple_choice`, `quote`, `comparison`, `timeline`, `references`, `image`, `audio`, `video`, `interactive_lab`.

Os campos `data` dependem do tipo e são validados. O motor agrupa blocos `multiple_choice` em um quiz integrado, antes das referências; não é um novo tipo de JSON. O JSON não injeta JavaScript executável e um tipo desconhecido recebe um aviso, sem quebrar os demais blocos.

## Regras de compatibilidade e segurança

1. **Identificadores estáveis:** ID da aula deve coincidir com o manifesto; `courseId` e `moduleId` devem apontar ao curso e módulo corretos; IDs de blocos e alternativas não podem duplicar.
2. **Caminhos relativos:** a leitura de JSON aceita `./` dentro da pasta pública `content/`; arquivos de mídia do motor genérico devem respeitar a resolução local segura feita pelo renderizador. Não inventar URLs a partir do título.
3. **Rascunho ≠ publicação:** `status: "draft"`, exportar um JSON ou salvar no Estúdio não publica para todos. Publicação pública exige atualização dos arquivos vinculados e do catálogo/manifests por commit.
4. **Duas persistências diferentes:** o Estúdio histórico mantém rascunhos locais; partes mais recentes do fluxo de aluno já usam Firebase Authentication/Firestore. JSONs de conteúdo não devem armazenar progresso pessoal nem dados privados.
5. **Firebase não é ativado por commit:** regras do Firestore e login exigem configuração externa e teste real; este sprint não os altera.
6. **Aulas especiais:** preservar `metadata.interactivePage`, páginas HTML e a integração de progresso existente; não convertê-las implicitamente.
7. **Conteúdo sensível:** não colocar dados identificáveis de pacientes, senhas, tokens ou credenciais em JSON público. Vinhetas devem ser fictícias.

## Exemplo piloto e validação

Exemplo estrutural: [`docs/exemplos/aula-contrato-json-v1-piloto.json`](exemplos/aula-contrato-json-v1-piloto.json).

Ele contém seis blocos reais do contrato v1: seção, texto, conceito, quiz, laboratório de escolhas e bibliografia. É **apenas um modelo técnico**: `status: "draft"`, não consta de nenhum manifesto e não contém fonte bibliográfica acadêmica real. Não publicá-lo como aula.

Verificação reproduzível na raiz do repositório (Node.js 22+, sem instalar bibliotecas):

```bash
node scripts/verify-json-contract.mjs
```

O script:
- analisa a sintaxe dos três arquivos JSON Schema (não executa a validação formal 2020-12);
- valida o exemplo com os validadores JavaScript existentes e testa rejeições de ID duplicado, gabarito inexistente e referência inexistente;
- percorre o catálogo público, os manifests e suas aulas publicadas, verificando IDs, estados e vínculos;
- confirma a existência das páginas HTML apontadas por `metadata.interactivePage`.

**Não equivale a teste visual ou funcional em Safari/iPhone, nem testa banco remoto ou acesso de usuários.** Deve ser executado antes de aprovar esta branch, acompanhado dos diagnósticos já existentes em `tests/`.

## Critérios de aceite para esta Sprint JSON 1

- [x] Inventário de arquivos e arquitetura atual.
- [x] Contrato JSON v1 descrito sem criar esquema concorrente.
- [x] Diferença entre aulas de blocos e aulas HTML documentada.
- [x] Exemplo JSON de rascunho, não publicado.
- [x] Verificador reproduzível em Node.js, reutilizando o validador do aplicativo.
- [ ] Executar o verificador em uma cópia completa do repositório.
- [ ] Revisar a proposta e integrar a branch somente após aceite.
- [ ] Testar os fluxos reais no navegador; não faz parte da alteração documental desta sprint.

## Passagem para a Sprint JSON 2

Selecionar **uma nova aula piloto**, cadastrá-la corretamente no manifesto e renderizá-la pelo motor genérico; medir eventuais diferenças entre a edição visual e a leitura. Aulas HTML existentes permanecem intactas até haver um plano específico de migração.
