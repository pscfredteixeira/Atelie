# Ateliê — Sprint JSON 6: homologação e integração controlada
**16/11/2026 · Branch de revisão · SEM deploy, SEM merge automático**

## Objetivo e fronteira de segurança

Homologar as cinco entregas anteriores e preparar uma integração segura ao Ateliê, **sem alterar a versão pública antes de aprovação**. As rotas do laboratório, editor e preparo de revisão são ferramentas **experimentais**. Nenhuma delas dá acesso para gravar conteúdo no GitHub ou no Firestore.

A publicação de uma aula JSON na **Formação Freudiana real** continua fora do escopo: os ZIPs da Sprint 5 só preparam arquivos da pasta de laboratório. A versão atual do Ateliê continua a apresentar quatro aulas HTML protegidas por login.

## Diagnóstico de regressões históricas

A suíte antiga do GitHub Actions estava desatualizada **também na branch `main`**:

- `scripts/ci-sprint18.mjs` procurava `#lessonNote` e `#/caderno`, componentes já retirados da aplicação pública. Agora verifica as quatro aulas, acesso por conta, iframe de cada aula e menu no tamanho de celular.
- `scripts/ci-sprint19.mjs` esperava **três** aulas, rota `#/caderno` e visualização de notas antigas. Agora verifica as **quatro aulas** e a separação do progresso e dos cursos salvos entre contas A e B, com Firestore simulado.
- `scripts/ci-course-menu.mjs` utilizava `.locator('a').isVisible()` em um elemento contendo **três links**; o Playwright mais novo rejeitava a seleção ambígua. O teste agora verifica o primeiro link explicitamente.

Os testes foram atualizados sem mudar os conteúdos didáticos. A execução mais profunda identificou também **um defeito de JavaScript na quarta aula**, corrigido separadamente na própria branch (uma chamada com um caractere extra que interrompia a restauração do progresso).

## Integridade dos conteúdos oficiais

Comparação via GitHub dos hashes de conteúdo `main` versus a branch da Sprint 6 no momento da homologação:

| Conteúdo de produção | Situação |
|---|---|
| `content/catalogo.json` | Idêntico |
| `content/courses/formacao-freudiana/curso.json` | Idêntico |
| `escuta-que-mudou-a-clinica.html` | Idêntico |
| `primeira-topica.html` | Idêntico |
| `freud-antes-de-ser-freud.html` | Idêntico |
| `freud-obra-e-fundador.html` | Correção pontual de JavaScript para restaurar abertura e progresso; textos preservados |
| `firebase.js` | Idêntico |
| `firestore.rules` | Idêntico |

Os nomes HTML da tabela correspondem à pasta `content/courses/formacao-freudiana/aulas/`. A checagem de igualdade é pontual; deve ser repetida se `main` receber novos commits. A quarta aula é a única exceção deliberada; revisar seu diff e seus testes antes de qualquer integração.

## Novo teste de isolamento

`scripts/verify-json-release-readiness.mjs` verifica automaticamente:

1. Catálogo principal ainda possui apenas Formação Freudiana como curso publicado.
2. As quatro experiências HTML esperadas existem e continuam registradas no aplicativo.
3. As rotas `#/laboratorio/json` e `#/laboratorio/editor` continuam disponíveis apenas como fluxos técnicos.
4. O catálogo de laboratório separado, os dois manifestos e as três aulas JSON passam nos validadores de conteúdo reais.
5. O editor utiliza rascunhos locais; o gerador do pacote mantém o escopo da pasta `content/piloto-json-sprint-02/`.
6. As regressões legadas não usam novamente as rotas do caderno removido.

Este script não substitui a checagem de diffs, testes de segurança e inspeção visual. Está ligado à GitHub Action `Validar aulas e publicação JSON`.

## Como validar antes de publicar

1. Na PR da Sprint 6, abra a aba **Checks**. Exija sucesso no teste de contrato/motor/editor/pacote e no teste Chromium de revisão e ZIP.
2. Verifique o resultado da suíte **Ateliê — regressão no navegador** (inclui autenticação simulada, progresso, navegação, vídeos e cursos).
3. Faça a revisão humana da Formação Freudiana no Chrome desktop, Chrome Android e Safari/iPhone, conferindo as quatro aulas e os dois menus recolhíveis.
4. Confira `#/laboratorio/json`: dois cursos e três aulas, atividades interativas funcionando, sem resultados persistidos.
5. Confira `#/laboratorio/editor`: edite uma cópia, crie aula, feche com alterações não salvas, salve em IndexedDB, reabra e exporte um JSON.
6. Na aba **Revisão**, confira os alertas editoriais, os quatro checks e o download de um ZIP; abra o ZIP e compare o manifesto com o repositório.
7. Teste a ausência de escrita no Firestore por sessões de laboratório e a preservação do progresso pessoal das quatro aulas oficiais.
8. Não integre se qualquer etapa falhar sem investigação.

## Mapa de pull requests e dependências

| Etapa | PR | Base atual | Observação |
|---|---|---|---|
| Contrato e documentação v1 | [#5](https://github.com/pscfredteixeira/Atelie/pull/5) | `main` | Independente; não altera site |
| Aula JSON no Ateliê atual | [#6](https://github.com/pscfredteixeira/Atelie/pull/6) | `main` | Primeiro código de laboratório |
| Motor genérico | [#7](https://github.com/pscfredteixeira/Atelie/pull/7) | Branch da #6 | Depende da #6 |
| Editor Visual | [#8](https://github.com/pscfredteixeira/Atelie/pull/8) | Branch da #7 | Depende da #7 |
| Preparação do ZIP | [#9](https://github.com/pscfredteixeira/Atelie/pull/9) | Branch da #8 | Depende da #8 |
| Homologação e testes | [#10](https://github.com/pscfredteixeira/Atelie/pull/10) | Branch da #9 | Depende da #9 |

**Todas permanecem em rascunho e não devem ser mescladas automaticamente.** O merge de #6 em `main` iniciaria a disponibilização do laboratório na versão pública do GitHub Pages; isso requer autorização de publicação explícita.

### Ordem de integração após aprovação

1. Homologue e integre #5, separadamente, se desejado.
2. Homologue #6, altere o draft para pronto e integre na `main`.
3. Na #7, redefina a branch-base para `main`, confira o diff para garantir que só contém a Sprint 3; execute todos os testes e integre.
4. Repita o mesmo processo na ordem #8 → #9 → #10, sempre redefinindo **somente a base da PR já autorizada**, sem incluir mudanças não revisadas.
5. Não apague branches-base antes de ajustar as PRs dependentes.
6. Depois de cada merge, confira os checks da `main` e o site GitHub Pages; se uma alteração causar regressão, pare antes de seguir para a próxima.
7. Documente quem aprovou a publicação e quais dispositivos foram verificados.

## Plano de reversão

Se o site público apresentar um problema depois de um merge:

1. Pause novos merges e registre a PR/commit que desencadeou o problema.
2. No GitHub, use **Revert** da PR integrada (ou crie uma PR de reversão equivalente) sem reescrever o histórico de `main`.
3. Se várias PRs já tiverem sido integradas, reverta **na ordem inversa** da integração, começando pela mais recente.
4. Aguarde a conclusão do GitHub Pages e teste os endereços das quatro aulas e da vitrine pública.
5. Não apague dados de Firestore, IndexedDB ou contas de estudantes durante uma reversão de código.
6. Abra uma issue de incidente e reconcilie os rascunhos locais separadamente. Não force reset de `main` nem faça force-push.

## Limites explícitos

- Os testes Playwright em viewport mobile **simulam** dimensões e toque; não equivalem a teste manual no Safari/iPhone.
- O Estúdio JSON fica em rota pública, sem controle administrativo; aceita apenas rascunhos **locais do navegador**. Não armazenar informações sensíveis.
- `publication-plan.js` cria arquivos candidatos para a pasta do laboratório. A flag `status: "published"` dentro do ZIP **não significa que a aula está pública**.
- Não há autenticação de autor, fluxo de aprovação remota ou escrita segura em GitHub/Firebase nesta etapa.
- O catálogo principal `content/catalogo.json` e a rota oficial das quatro aulas não foram migrados para JSON.

## Critérios de aceite

- [ ] PR #10 com os checks de JSON e regressão histórica verdes.
- [ ] Quatro aulas HTML conferidas em navegador real.
- [ ] Teste manual no Safari/iPhone real.
- [ ] Diff de PRs anteriores revisado, sem atualização não intencional de conteúdo oficial.
- [ ] Decisão explícita sobre liberar o laboratório na versão pública.
- [ ] Estratégia de reversão aprovada.
- [ ] Homologação registrada antes de qualquer merge.

**Resultado esperado da Sprint 6:** entregar código, regressões e roteiro de lançamento preparados, preservando o ambiente público até aprovação.
