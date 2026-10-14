# ATELIER — Rotas, estados e situações de erro
**Sprint 0.3 · especificação de navegação e comportamento · 14/10/2026**

> Documento de comportamento esperado. As rotas são propostas para o aplicativo definitivo do protótipo; **não estão implementadas no wireframe atual**.

## 1. Estratégia de rotas

Durante a demonstração no GitHub Pages, preferir **hash routing** (`#/...`), pois carregamentos diretos de caminhos internos não dependem de uma configuração de reescrita do servidor estático.

Raiz da demonstração prevista: `https://pscfredteixeira.github.io/Atelie/`.

| Rota proposta | Ambiente | Tela | Fonte |
|---|---|---|---|
| `#/` | Geral | Seleção de ambiente demonstrativo | Configuração local |
| `#/aluno` | Aluno | Início / retomar | Índice publicado + estado local |
| `#/cursos` | Aluno | Catálogo | JSON publicado |
| `#/cursos/:courseId` | Aluno | Curso e módulos | Manifesto JSON |
| `#/cursos/:courseId/aulas/:lessonId` | Aluno | Sala de aula | Aula JSON publicada |
| `#/aluno/caderno` | Aluno | Anotações | IndexedDB local |
| `#/aluno/progresso` | Aluno | Progresso | IndexedDB local |
| `#/professor` | Professor | Painel | Índice + rascunhos locais |
| `#/professor/cursos/:courseId` | Professor | Estrutura | Manifesto + rascunhos locais |
| `#/professor/cursos/:courseId/aulas/:lessonId/editar` | Professor | Estúdio | Rascunho local |
| `#/professor/cursos/:courseId/aulas/:lessonId/previa` | Professor | Prévia de aluno | Rascunho **explicitamente** selecionado |
| `#/admin` | Admin (demonstração) | Organização | Índice e metadados locais |

Rotas seguem IDs estáveis, não títulos. Usuário pode copiar links para cursos e aulas publicados; rascunhos locais não são compartilháveis por URL.

**Contexto de perfil na etapa beta é visual, não uma barreira de autorização.** Rotas de professor e admin podem ser acessadas por pessoas com o link, pois não há login real.

## 2. Estados globais de carregamento

Toda tela que depende de dados deve representar explicitamente estes estados:

| Estado | O que mostrar | Ação |
|---|---|---|
| `loading` | Indicador de progresso não intrusivo; título/estrutura preservados | Aguarde carregamento do recurso solicitado |
| `ready` | Dados corretos e ações disponíveis | Interação normal |
| `empty` | Orientação sobre o que fazer (curso sem aulas etc.) | Criar/voltar conforme contexto |
| `not_found` | Mensagem “não encontramos este conteúdo” | Retornar ao catálogo |
| `invalid` | Erro de formato com indicação do recurso | Ver detalhes técnicos (professor) ou voltar |
| `network_error` | “Não foi possível carregar o conteúdo” | Tentar novamente |
| `unsupported_block` | Componente indisponível com fallback | Continuar aula e registrar aviso |
| `storage_unavailable` | Aviso claro de que alterações não serão preservadas | Exportar dados, quando possível |

Não confundir `empty` com `loading`; evitar páginas totalmente em branco. Cada erro precisa oferecer uma saída.

## 3. Estados editoriais

```text
                   ┌──────────────┐
                   │ draft        │ ← criado/alterado localmente
                   └──────┬───────┘
                          │ “Preparar revisão”
                          ▼
                   ┌──────────────┐
                   │ review       │ ← checagens editoriais
                   └──────┬───────┘
                          │ Exportar + publicar no repositório
                          ▼
                   ┌──────────────┐
                   │ published    │ ← versão acessível pelo site público
                   └──────┬───────┘
                          │ Retirar do catálogo
                          ▼
                   ┌──────────────┐
                   │ archived     │
                   └──────────────┘
```

A sequência acima é **pedagógica/editorial**, não uma máquina de publicação automatizada: mesmo exportando um JSON com `status: "published"`, ele só entra no site após commit/deploy real.

**Editar publicado:** cria um novo rascunho da revisão seguinte e não afeta o conteúdo que os estudantes veem até publicação.

**Arquivar:** retirar do catálogo não garante que o arquivo público anterior deixe de ser acessível por URL ou histórico Git. Proteção de conteúdo virá apenas com servidor e autorização.

## 4. Estados da aprendizagem

```text
not_started ── aluno entra na aula ──→ in_progress
in_progress ── ação explícita de concluir ──→ completed
completed ── revisitar ──→ completed (não perder conclusão)
completed ── ação explícita de reiniciar ──→ not_started
```

- Estar na aula não significa compreendê-la.
- Quizzes são **formativos** por padrão e não bloqueiam avanço.
- Avaliações obrigatórias poderão ser configuradas mais adiante, com regras claras e acessíveis.
- O progresso poderá usar `lastBlockId` para retomar um percurso longo.
- Concluir aula não pode apagar respostas ou notas.
- Exibir progresso demonstrativo **como dado fictício** até haver persistência implementada.

## 5. Casos de interface que precisam estar desenhados

### Aluno
- Primeiro acesso: curso sem progresso → “Começar a estudar”, nunca “Continuar”.
- Catálogo vazio → explicação e link para voltar; sem indicação de erro técnico.
- Curso sem módulos → mensagem contextual de curso em preparação.
- Módulo sem aulas → não apresentar botão enganoso para iniciar.
- Aula sem quiz → leitura continua normalmente; a aula não é considerada inválida.
- Questão respondida → feedback sem depender só de cor e com opção de revisar.
- Conteúdo não encontrado → referência amigável ao curso/catálogo.
- Navegador sem armazenamento → aviso sobre perda de progresso.

### Professor
- Novo curso sem módulos → ação criar primeiro módulo.
- Novo módulo sem aulas → ação criar aula.
- Aula vazia → biblioteca de blocos + modelo recomendado.
- Bloco selecionado → propriedades acessíveis com controles adequados a toque.
- Remover bloco → confirmação ou desfazer.
- Sair do estúdio com alterações não preservadas → aviso de perda de dados.
- Salvar local → confirmação **somente após sucesso efetivo** do armazenamento.
- Exportar sem validar → exibir erros impeditivos e avisos separados.
- Publicar → explicar ação manual no repositório, sem botão fictício de publicação na nuvem.

### Administrador demonstrativo
- Visão geral apenas organizacional; não mostra estatísticas reais de alunos.
- Perfis são fictícios e não servem como proteção de edição.
- Mídias ausentes e IDs duplicados entram numa lista de verificações.

## 6. Componentes de feedback

**Notificações de estado:** “Rascunho salvo neste navegador”, “Você tem alterações não salvas”, “Não foi possível carregar esta aula”, “JSON inválido: bloco X”.

**Acessibilidade e transparência:**
- Alertas relevantes com `aria-live`; não usar apenas mudança de cor.
- Foco volta ao lugar correto após ação de diálogo, remoção e mudança de rota.
- Em toda ação, distinguir “exibir prévia”, “salvar no dispositivo”, “exportar arquivo” e “publicar”.
- Quando armazenamento falhar, manter a edição na memória apenas enquanto a página permanecer aberta e alertar imediatamente.
- O site não promete sincronização nem proteção por senha.

## 7. Critérios de aceite do Sprint 0.3

- [x] Mapa de rotas separado por ambiente.
- [x] Estados globais de carregamento, vazio e erro definidos.
- [x] Ciclos editoriais e de aprendizagem explicitados.
- [x] Fluxos de fallback e perda de armazenamento descritos.
- [x] Limitações do GitHub Pages e dos perfis fictícios registradas.
- [x] Contratos de arquivo e dados documentados em `CONTRATO_CONTEUDO.md`.
- [ ] Validar decisões com uso no celular e com colaboradores.
- [ ] Converter a proposta em esquema formal e testes automatizados (Sprint 2).
- [ ] Implementar rotas reais no aplicativo (Sprints 1–4).

## 8. Próxima etapa

**Sprint 0.4 — Fechamento do Sprint 0:** revisar nomenclatura das telas, fluxos de publicação, riscos de dados locais e critérios que orientarão o Design System (Sprint 1). Registrar decisões finais sem adicionar recursos que desviem a fase inicial.
