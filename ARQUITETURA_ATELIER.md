# ATELIER — Arquitetura geral
**Documento mestre do produto · versão 0.1 · 14/10/2026**

> Estado: Sprint 0, etapa 0.1 — arquitetura de navegação e jornada de criação. Este documento é uma especificação; funcionalidades descritas aqui não estão necessariamente implementadas.

## 1. Visão

Atelier é uma plataforma de formação em psicanálise para criar, organizar, ensinar e explorar conteúdos em diferentes formatos: leitura, estudo de caso, atividades conceituais, mídia, laboratórios e jogos pedagógicos.

**Prioridade desta fase:** construir um protótipo funcional para professores e alunos convidados, não a infraestrutura comercial definitiva.

**Decisões firmadas:**
- Novo repositório: `pscfredteixeira/Atelie`; não modificar `sistema`.
- GitHub Pages: branch `main`, diretório `/ (root)`, para demonstração e testes temporários.
- Sem Supabase e sem banco de dados externo agora.
- Cursos e aulas representados em JSON versionado, separado da lógica de renderização.
- Rascunhos, progresso e notas armazenados localmente no navegador, com exportação/importação.
- Protótipo sem autenticação real; perfis simulados, sem conteúdo confidencial ou dados pessoais de alunos.
- Preparar interfaces de repositório para futura troca por servidor, banco e autenticação.
- Mobile-first, com navegação e edição acessíveis em desktop e celular.

## 2. Ambientes

### Aluno — Aprender
- **Início:** continuar estudando, cursos em andamento, progresso recente.
- **Catálogo:** procurar cursos, consultar ementa e objetivos.
- **Curso:** visão geral, módulos, sequência de aulas, carga estimada.
- **Sala de aula:** conteúdo em blocos, etapas, atividades, caderno e navegação entre aulas.
- **Meu caderno:** anotações por aula e conceitos marcados.
- **Meu progresso:** aulas iniciadas/concluídas, revisões e histórico local.
- **Preferências:** acessibilidade, fonte, tema e backup dos dados locais.

### Professor — Criar
- **Painel:** cursos e rascunhos recentes; criar aula ou curso.
- **Meus cursos:** listar, criar, editar, duplicar, arquivar.
- **Estrutura de curso:** ordenar módulos e aulas.
- **Estúdio de aula:** definir objetivo e organizar blocos; autosave local.
- **Biblioteca de blocos:** texto, conceitos, imagens, áudio, vídeo, pergunta, quiz, estudos de caso, referências, laboratórios.
- **Pré-visualizar como aluno:** mesmo motor de aula, sem ferramentas de edição.
- **Revisão:** avisos editoriais, validação e exportação JSON.
- **Biblioteca de experiências:** configurações reutilizáveis de interatividades.

### Administrador — Organizar (simulado nesta fase)
- **Painel:** visão geral dos cursos e estado editorial.
- **Organização:** categorias, ordem, professores demonstrativos, cursos.
- **Qualidade:** validação de JSON, IDs, referências e mídia.
- **Configurações:** modelos, backup e exportação.
- **Perfis de demonstração:** alternância de contexto visual, sem permissões reais.

## 3. Mapa de navegação

```text
ATELIER
├── Escolher perfil de demonstração
├── ALUNO
│   ├── Início
│   ├── Catálogo
│   │   └── Curso → Módulo → Sala de aula
│   ├── Meu caderno
│   ├── Meu progresso
│   └── Preferências / Backup
├── PROFESSOR
│   ├── Painel
│   ├── Meus cursos
│   │   └── Estrutura do curso → Estúdio da aula
│   │       ├── Propriedades da aula
│   │       ├── Blocos (reordenar / configurar)
│   │       ├── Prévia do aluno
│   │       └── Validação / Exportação
│   └── Biblioteca de experiências
└── ADMINISTRADOR
    ├── Painel geral
    ├── Organização
    ├── Qualidade dos conteúdos
    └── Configurações / Backups
```

## 4. Jornada prioritária: criar uma aula

Caso-exemplo: o professor deseja montar “O recalque em Freud”.

| Etapa | Professor faz | Sistema responde |
|---|---|---|
| 1 | Abre ambiente de professor | Painel e rascunhos |
| 2 | Abre curso ou cria um novo | Apresenta estrutura de módulos |
| 3 | Escolhe módulo e “Nova aula” | Cria ID estável e rascunho local |
| 4 | Insere título, objetivos, duração e referências | Valida campos básicos |
| 5 | Escolhe template ou aula em branco | Propõe sequência editável de blocos |
| 6 | Adiciona texto, exemplo, imagem, pergunta e laboratório | Renderiza blocos com prévia instantânea |
| 7 | Reordena e configura blocos | Salva alterações localmente |
| 8 | Abre prévia como aluno | Usa o mesmo motor da sala de aula |
| 9 | Executa verificação | Lista erros impeditivos e alertas |
| 10 | Exporta aula/curso | Gera JSON versionado e arquivo de backup |
| 11 | Publica arquivos no GitHub | Atualiza o site de demonstração |
| 12 | Abre o curso publicado como aluno | Testa percurso e atividades |

**Cuidado:** salvar localmente, exportar JSON e publicar no GitHub são operações distintas. Nenhum botão poderá sugerir publicação remota sem realmente fazê-la.

### Estados editoriais
- `draft`: rascunho.
- `review`: preparado para revisão.
- `published`: somente conteúdo incluído na distribuição pública.
- `archived`: preservado, mas fora da navegação principal.

## 5. Jornada do aluno

1. Acessa a demonstração e seleciona “Aluno”.
2. Abre um curso, vê objetivos, programa, duração e progresso local.
3. Entra numa aula e percorre seus blocos em ordem.
4. Interage com atividades e recebe feedback pedagógico.
5. Registra anotações e marca a aula como concluída.
6. Retorna depois, no mesmo navegador, para continuar.
7. Pode exportar um backup dos dados.

**Limitações explícitas:** sem sincronização entre dispositivos; limpar dados do navegador pode apagar o progresso; não haverá painel central de resultados dos alunos nesta etapa.

## 6. Modelo pedagógico do motor de aulas

Hierarquia: **Curso → Módulo → Aula → Blocos**.

O bloco tem identificador, tipo, versão, dados específicos e configurações. O motor usa um **registro de renderizadores por tipo de bloco**, sem condicionais associadas ao ID de uma aula.

### Catálogo inicial (proposta)
- `heading`, `rich_text`, `image`, `quote`, `audio`, `video`
- `concept` (revelação de conceito), `clinical_vignette` (ficcional, com limites)
- `question` (reflexão), `multiple_choice` (avaliação com feedback)
- `timeline`, `comparison`, `interactive_lab`, `references`

Novos blocos devem ser acrescentados ao registro sem alterar o formato geral das aulas.

### Modos de aula (templates, não regras rígidas)
- Aula de leitura aprofundada.
- Aula investigativa / situação-problema.
- Estudo de caso fictício.
- Aula visual e interativa.
- Seminário e revisão de conceitos.

### Princípios editoriais
- Objetivo claro por aula; interatividade precisa ter propósito pedagógico.
- Comparar teorias sem reduzir uma escola a outra.
- Não transformar vinhetas em diagnóstico automático.
- Referências e distinção entre fonte, hipótese histórica e exemplo didático.
- Acessibilidade: teclado, contraste, legendas/transcrições quando pertinentes.

## 7. Modelo de dados: contrato conceitual

- `Course`: id, slug, title, subtitle, description, objectives, category, cover, authorIds, version, status, moduleIds.
- `Module`: id, courseId, title, description, order, lessonIds.
- `Lesson`: id, moduleId, title, summary, objectives, estimatedMinutes, version, status, blocks[], references[].
- `Block`: id, type, version, data{}, settings{}.
- `LearningState`: profileId (simulado), lessonId, status, completedAt, answers, notes, lastBlockId.
- `MediaAsset`: id, type, path, alternativeText, caption, licensing metadata.

**IDs permanecem estáveis após reordenação e edição.** Ordem é um atributo separado de identidade. A versão de esquema permite migrações futuras.

Exemplo abreviado:

```json
{
  "schemaVersion": 1,
  "id": "aula-recalque-01",
  "moduleId": "modulo-fundamentos",
  "title": "O recalque em Freud",
  "objectives": ["Distinguir recalque de esquecimento comum"],
  "status": "draft",
  "blocks": [
    {
      "id": "bloco-abertura",
      "type": "question",
      "version": 1,
      "data": { "prompt": "Esquecer algo é sempre recalcar?" }
    },
    {
      "id": "bloco-conceito",
      "type": "rich_text",
      "version": 1,
      "data": { "paragraphs": ["Texto didático de exemplo."] }
    }
  ],
  "references": []
}
```

Este exemplo é apenas uma proposta, ainda não o esquema definitivo validado do Sprint 2.

## 8. Arquitetura técnica pretendida

```text
Atelie/
├── index.html                  # Entrada publicada pelo GitHub Pages (main / root)
├── README.md
├── ARQUITETURA_ATELIER.md
├── docs/                       # Decisões, mapas, jornadas, testes
├── src/
│   ├── app/                    # Navegação e inicialização
│   ├── design-system/          # Tokens e componentes de interface
│   ├── features/
│   │   ├── learning/           # Experiência do aluno
│   │   ├── authoring/          # Estúdio e autoria
│   │   └── administration/     # Administração
│   ├── lesson-engine/          # Registro e renderização de blocos
│   ├── blocks/                 # Blocos reutilizáveis
│   ├── repositories/           # Contratos e adaptadores de dados
│   └── storage/                # JSON / IndexedDB / exportações
├── content/
│   └── courses/                # Pacotes versionados de cursos
└── public/
    └── media/                  # Recursos estáticos
```

O protótipo inicial poderá começar como HTML/CSS/JS puro, sem instalar dependências. A escolha final de framework e build será consolidada antes do Sprint 1, considerando a edição visual e a futura manutenção.

### Interfaces de dados (conceituais)
- `CourseRepository`: list, get, saveDraft, export.
- `LessonRepository`: listByModule, get, saveDraft, validate, export.
- `ProgressRepository`: getState, saveState, export, import.
- `MediaRepository`: resolve, listAvailable.

**Agora:** adaptadores para JSON estático + rascunhos/progresso em IndexedDB (fallback/backup quando apropriado).

**Futuro:** adaptadores para API e banco de dados, autenticação real, permissões de leitura/escrita, histórico de publicação e sincronização, sem trocar os renderizadores.

## 9. Regras de navegação e UX

- Mobile-first e legibilidade editorial; identidade refinada, sem interface genérica.
- **Aluno em celular:** navegação inferior curta, leitura focada e progresso contextual.
- **Professor em celular:** editor com seleção de blocos e setas para mover, além de drag-and-drop opcional no desktop.
- Desktop: navegação lateral e área de conteúdo ampla.
- Prévia usa o mesmo renderizador da sala do aluno.
- Exibir estado de salvamento e alerta antes de descartar rascunho.
- Não misturar edição e consumo na mesma tela.
- Tema, tipografia responsiva, estados de foco e controles acessíveis.

## 10. Critérios de aceite da etapa 0.1

- [x] Três ambientes e responsabilidades descritos.
- [x] Mapa de navegação registrado.
- [x] Jornada de criação de aula ponta a ponta.
- [x] Jornada do aluno com limitações.
- [x] Premissas JSON/local/GitHub Pages e migração futura registradas.
- [ ] Revisão e validação do mapa pelo responsável do produto.
- [ ] Wireframes das telas-chave (etapa 0.2).
- [ ] Contrato de blocos JSON e validação (Sprint 2).

## 11. Sequência de sprints aprovada como roteiro inicial

| Sprint | Entrega |
|---|---|
| 0 | Arquitetura, mapa, jornadas e especificações |
| 1 | Design system e experiência responsiva |
| 2 | Contrato JSON, esquemas e repositórios locais |
| 3 | Motor de aulas por blocos |
| 4 | Catálogo, curso, módulos e jornada de estudo |
| 5 | Estúdio: gestão de cursos e módulos |
| 6 | Editor visual de aulas |
| 7 | Modelos pedagógicos e multimídia |
| 8 | Biblioteca reutilizável de interatividades |
| 9 | Quizzes e avaliação pedagógica |
| 10 | Progresso, notas e perfis simulados |
| 11 | Revisão editorial, versão e exportação |
| 12 | Acessibilidade, performance, QA |
| 13 | Beta demonstrável e testes com convidados |

**Próximo trabalho da etapa 0.2:** wireframes e critérios de comportamento para Início do Aluno, Curso, Sala de Aula, Painel do Professor, Estrutura de Curso e Estúdio da Aula.

## 12. Riscos e decisões pendentes

1. GitHub Pages fornece hospedagem estática: salvar rascunhos localmente não altera os JSON publicados no repositório.
2. Em repositório público, todo conteúdo entregue ao navegador pode ser obtido por visitantes. Não publicar material sigiloso ou cursos pagos protegidos nesse modelo.
3. Simulação de login não é autenticação; não armazenar senhas reais em JSON público.
4. Dados locais não sincronizam entre dispositivos; exportação/importação e avisos explícitos são necessários.
5. Para preservar conteúdo editado, exportar rascunhos e versioná-los antes de publicar novos pacotes.
6. O desenho de autorização e matrícula comercial fica para a infraestrutura de produção.
7. Confirmar formato definitivo dos esquemas, estratégia de mídia e framework apenas após as primeiras provas de conceito.


## 13. Protótipo navegável da etapa 0.2

- [Wireframes das seis telas](wireframes.html)
- [Especificação de UX, fluxos e critérios de aceite](WIREFRAMES_ATELIER.md)

A etapa 0.2 apresenta o percurso do aluno e do professor com dados fictícios e composição temporária de blocos no Estúdio. Não implementa autenticação, persistência ou publicação.

## 14. Etapa 0.3 — Contratos e estados documentados

- [Especificação de conteúdo e blocos (JSON)](docs/CONTRATO_CONTEUDO.md)
- [Rotas, estados de interface e comportamento de erro](docs/ROTAS_E_ESTADOS.md)
- [Exemplos portáveis de catálogo, curso e aula](docs/exemplos/catalogo.v1.json)

Esta etapa define o formato de dados e o comportamento esperado sem implementar o motor nem conectar banco de dados. O esquema executável e os adaptadores serão construídos nos sprints posteriores.

**A etapa 0.4 consolidou estas decisões:** [Fechamento do Sprint 0](docs/SPRINT_0_FECHAMENTO.md).

## 15. Sprint 0.4 — Fechamento e transição

A documentação de arquitetura está **consolidada**; os protótipos continuam sendo demonstrações e não constituem homologação da aplicação. O fechamento definiu as escolhas provisórias de JS modular, IndexedDB, hash routing e publicação manual.

- [Fechamento do Sprint 0: decisões, riscos e definição de pronto](docs/SPRINT_0_FECHAMENTO.md)
- [Brief do Sprint 1: UI, navegação, responsividade e critérios de aceite](docs/SPRINT_1_BRIEF.md)

**Próximo sprint:** começar a implementação de design system, componentes-base e shells de Aluno, Professor e Administrador. Testes em dispositivos reais e feedback humano continuam pendentes.
