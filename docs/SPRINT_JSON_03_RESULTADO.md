# Ateliê — Sprint JSON 3: motor genérico de aulas

**15/11/2026 · Implementação em branch isolada · Testes de navegador real pendentes**

## Objetivo

Transformar a demonstração de uma única aula da Sprint JSON 2 em um sistema capaz de descobrir cursos, listar aulas e renderizar automaticamente seus blocos, usando exclusivamente IDs, manifests e arquivos JSON. O objetivo é criar novos conteúdos **sem editar o HTML/JavaScript para cada aula**.

Esta sprint se apoia na branch `feature/sprint-json-02-aula-piloto-20261114`. A Sprint 2 ainda está em revisão na [PR #6](https://github.com/pscfredteixeira/Atelie/pull/6); a Sprint 3 **não foi aplicada à `main`**.

## O que mudou

- `json-pilot.js` não guarda mais IDs de aula e curso fixos. O novo carregador oferece:
  - `readPilotCatalog()`: cursos disponíveis no catálogo técnico;
  - `readPilotCourse(courseId)`: manifesto e aulas em ordem;
  - `readPilotLesson(courseId,lessonId)`: leitura e validação do JSON da aula;
  - `parsePilotSelection(hash)`: interpretação de endereços de catálogo ou aula;
  - `mountJSONPilot(root)`: tela de catálogo e sala de aula, reutilizando `renderLessonBlocks`.
- Rota preexistente `#/laboratorio/json`: agora é o catálogo de laboratório.
- Endereço reutilizável para cada aula: `#/laboratorio/json?curso=ID_DO_CURSO&aula=ID_DA_AULA`.
- Navegação entre aulas do mesmo curso e índice de blocos, sem novas rotas codificadas.
- `json-pilot.css`: estilos isolados para cartões de curso, aulas e botões de sequência.
- O catálogo técnico agora possui dois cursos e três aulas para comprovar a ausência de dependência de nomes de arquivos fixos.
- `scripts/verify-json-pilot.mjs`: valida o fluxo completo `catálogo → manifesto → aula → renderizador`, com a implementação real e simulação de `fetch` dos JSONs locais.

## Como adicionar uma nova aula ao laboratório SEM mudar HTML ou JavaScript

1. Crie um JSON de aula baseado em `content/piloto-json-sprint-02/aulas/perguntas-e-contexto.json` ou `content/piloto-json-sprint-02/conceitos/aulas/conflito.json`.
2. Use um `id` novo e estável, `schemaVersion: 1`, `kind: "lesson"`, `status: "published"`, e preencha `courseId` e `moduleId` com valores existentes do manifesto.
3. Monte `blocks[]` com os tipos v1 disponíveis, cada um com `id`, `type`, `version: 1`, `data` e `settings: {}`. Inclua `references: []` mesmo sem bibliografia.
4. No manifesto do curso, inclua a aula em `modules[].lessons[]`:

```json
{
  "id": "aula-meu-novo-exemplo",
  "path": "./aulas/meu-novo-exemplo.json",
  "position": 3,
  "title": "Meu novo exemplo",
  "summary": "Texto curto de apresentação",
  "estimatedMinutes": 15,
  "status": "published"
}
```

5. Se for um novo **curso**, crie seu `curso.json` e o adicione ao `content/piloto-json-sprint-02/catalogo.json` com `id`, `title`, `manifest` e `status`.
6. Execute `node scripts/verify-json-pilot.mjs`; se o novo arquivo estiver vinculado corretamente, aparecerá automaticamente na listagem do laboratório ao carregar a branch no navegador.

**Não é preciso editar `app.js`, `index.html` ou `json-pilot.js` para cada nova aula compatível.** É preciso, sim, atualizar o JSON do manifesto/catálogo e realizar commit. Este piloto **ainda não é um editor visual com publicação automática**.

## Conteúdos que comprovam a reutilização

| Curso técnico | Aula | Formato |
|---|---|---|
| Laboratório JSON — Sprint 2 | A escuta psicanalítica: relato e hipótese | 13 blocos, laboratório e quiz duplo |
| Laboratório JSON — Sprint 2 | Perguntas abertas e contexto | 7 blocos, laboratório e quiz |
| Conceitos em movimento | Conflito psíquico: uma introdução | 6 blocos, vinheta e quiz |

Os textos são originais para demonstração, com situações inteiramente fictícias, sem pacientes reais. A validação estrutural não substitui revisão acadêmica.

## Validações executadas e pendentes

- [x] Os três conteúdos foram validados com `validateLessonLink`, os dois manifests com `validateCourse` e o catálogo com `validateCatalog` reais, em isolamento.
- [x] O motor real `renderLessonBlocks` renderizou as três aulas; quizzes e laboratórios foram identificados, e nenhum bloco ficou indisponível.
- [x] A leitura do catálogo e das três aulas pelo adaptador genérico funcionou em teste isolado com rede simulada.
- [x] `parsePilotSelection` interpretou links corretos e recusou IDs inválidos.
- [x] Não há edição das quatro páginas HTML da Formação Freudiana, do catálogo público principal ou das regras/Firebase.
- [ ] Executar `node scripts/verify-json-pilot.mjs` em checkout integral da branch.
- [ ] Testar manualmente catálogo, links individuais, sequência de aulas, quizzes, laboratório e layout no Chrome e Safari/iPhone.
- [ ] Confirmar regressão das aulas HTML existentes e acessibilidade antes de integrar com o site público.

**Limites:** não há registro de respostas, conclusão, matrícula, certificado ou sincronização no laboratório. Os arquivos são públicos no GitHub e não devem conter informações confidenciais.

## Próximo passo

Quando aprovada e testada em navegador real, a próxima sprint pode melhorar o fluxo de **autoria e publicação**, conectando o Estúdio Visual à exportação de JSON, validação e atualização supervisionada dos manifests. Publicação remota com conta real e permissões seguras é outra etapa e não deve ser confundida com esta.
