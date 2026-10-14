# ATELIER — Wireframes e experiência de navegação
**Sprint 0 · Etapa 0.2 · 14/10/2026 · Estado: protótipo navegável para avaliação**

- [Abrir protótipo das seis telas](./wireframes.html)
- [Voltar ao mapa mestre](./ARQUITETURA_ATELIER.md)
- [Página de apresentação](./index.html)

> Este documento descreve a experiência pretendida. O HTML é um protótipo de navegação com dados fictícios. Não contém login, um editor persistente de aulas, progresso verdadeiro, banco de dados ou publicação automática.

## 1. Resultado da etapa

Criamos seis wireframes navegáveis e responsivos, conectados numa única experiência de demonstração:

| Tela | Objetivo | Ação primária | Próximo destino |
|---|---|---|---|
| 01. Início do aluno | Retomar estudos e encontrar cursos | Continuar aula | Sala de aula |
| 02. Página do curso | Entender ementa, objetivos e sequência | Começar/continuar | Sala de aula |
| 03. Sala de aula | Compreender o conceito e experimentar | Ler e avançar | Curso ou próxima aula (futuro) |
| 04. Painel do professor | Localizar cursos e rascunhos | Criar/retomar aula | Estúdio |
| 05. Estrutura do curso | Definir módulos e a sequência pedagógica | Editar aula | Estúdio |
| 06. Estúdio de aula | Montar e pré-visualizar aula por blocos | Adicionar, mover e configurar blocos | Prévia do aluno |

As seis telas são navegáveis via barra lateral (desktop) ou barra horizontal (mobile), com ações de ligação internas.

## 2. Especificação de cada tela

### 01 — Início do aluno
**Elementos:** apresentação curta, curso em andamento, barra de progresso, chamada para retomar, cards de cursos e acesso ao catálogo.

**Regras:**
- A chamada principal deve apontar à última aula estudada quando houver progresso real.
- Sem progresso, exibir “Começar a estudar” no lugar de “Continuar”.
- Progresso no protótipo é fictício e deve ser rotulado; posteriormente será obtido do `ProgressRepository`.
- Cursos públicos em formato de cards, sem informação enganosa de matrícula.

### 02 — Página do curso
**Elementos:** título, apresentação, objetivos pedagógicos, estatísticas, módulos recolhíveis, aulas e ação principal.

**Regras:**
- A estrutura precisa ser compreensível antes da primeira aula.
- Módulos podem expandir/recolher por teclado e toque.
- Ações para abrir aulas não dependem de uma ordem de IDs codificada na UI.
- Na implementação, oferecer estados vazio, carregando, erro e conteúdo não encontrado.

### 03 — Sala de aula
**Elementos:** identificação do curso/módulo/aula, texto com boa legibilidade, pergunta disparadora, teoria, caso fictício, ponto reservado para laboratório, índice de etapas e caderno.

**Regras:**
- A aula deve ser renderizada pelo motor comum (Sprint 3), não pelo código exclusivo de um curso.
- O texto e as atividades se ajustam à tela estreita.
- O indicador de progresso real não deve avançar sem evento de conclusão previsto.
- Anotações no protótipo não são salvas; futuramente autosave local/backup.
- Cenas clínicas são ficcionais, sem conteúdo sensível de pessoas reais.

### 04 — Painel do professor
**Elementos:** cabeçalho, ação para criar aula, indicadores editoriais, lista de cursos e rascunhos recentes.

**Regras:**
- Criação e edição pertencem ao contexto do professor, separados da sala de aula.
- “Rascunhos” não devem aparecer como material publicado ao aluno.
- Ao iniciar curso vazio, apresentar instruções e caminho claro para criar módulo.

### 05 — Estrutura do curso
**Elementos:** mapa dos módulos, sequência de aulas, acesso ao editor, orientação pedagógica e estados.

**Regras:**
- Mover módulo ou aula não pode alterar seu ID estável.
- A interface real oferecerá reordenação acessível por botões, além de arrastar opcional.
- Excluir conteúdo exigirá confirmação e forma de recuperação quando viável.
- Operações estruturais serão implementadas nos sprints de autoria; no wireframe aparecem como exemplos visuais.

### 06 — Estúdio de aula
**Elementos:** identificação da aula, lista dos blocos, painel de configuração, biblioteca de tipos e botão de prévia.

**Regras:**
- Adicionar/remover/reordenar e editar título/conteúdo já são demonstrados **somente em memória**, sem persistência.
- A prévia visual é temporária; a versão definitiva deve usar o mesmo renderizador da Sala de Aula.
- A prévia precisa estar livre de controles editoriais.
- “Exportar JSON” está marcado como futuro e não finge baixar arquivos.
- Blocos adicionais devem ser compostos via registro de tipos, independentemente do ID da aula.

## 3. Fluxos principais de navegação

### Jornada do estudante

```text
Início do aluno
  ├─ Continuar → Sala de aula
  └─ Explorar → Página do curso
                   ├─ Expandir módulo
                   └─ Abrir aula → Sala de aula
                                    └─ Voltar ao curso
```

### Jornada do professor

```text
Painel do professor
  ├─ Gerenciar curso → Estrutura de curso
  │                    └─ Editar aula → Estúdio
  └─ Criar aula → Estúdio
                   ├─ Adicionar / selecionar bloco
                   ├─ Editar texto
                   ├─ Mover / remover bloco
                   └─ Prévia do aluno
```

## 4. Regras de UX transversais

- **Mobile-first:** navegação horizontal rolável em telas estreitas; controles com largura e espaçamento suficientes; leitura sem scroll horizontal de conteúdo.
- **Desktop:** área de navegação persistente; conteúdo mais amplo; painéis laterais onde houver espaço.
- **Leitura:** títulos editoriais, tamanho confortável, contraste e respiro; evitar uma sequência de caixas genéricas sem progressão didática.
- **Feedback:** não sinalizar salvamento/publicação quando não houver operação real; mostrar claramente quando dados são fictícios.
- **Editor:** botões “↑/↓” com nomes acessíveis substituem dependência exclusiva de drag-and-drop.
- **Teclado:** ordem de foco lógica; botões interativos; `aria-expanded` nos módulos recolhíveis.
- **Acessibilidade futura:** verificar WCAG 2.2 AA, estados de erro, redução de movimento, contraste, legendas, transcrições e alternativas a exercícios puramente visuais.
- **Tema:** paleta inicial grafite, lavanda/roxo e laranja; tipografia serifada nos títulos e sem serifa nas interfaces.

## 5. Conteúdo usado na demonstração

**Curso fictício:** Fundamentos da Psicanálise.

**Módulos:**
1. O surgimento da escuta.
2. Conflito e defesa.
3. Sonhos e linguagem.

**Aula focal:** O recalque em Freud, com pergunta de abertura, explicação, caso fictício e uma área reservada para laboratório.

Módulos, estatísticas, estado de progresso e rascunhos da demonstração não refletem resultados de alunos reais.

## 6. Divisão de responsabilidades técnicas

```text
┌───────────────────────┐
│ Navegação / telas     │
├───────────────────────┤
│ Motor de aulas        │ <- Mesmo motor no editor e na sala
├───────────────────────┤
│ Blocos por tipo       │ <- Textos, perguntas, mídias, laboratórios
├───────────────────────┤
│ Contratos de dados    │ <- Course, Module, Lesson, Block, Progress
├───────────────────────┤
│ Adaptadores           │ <- JSON público + armazenamento local
└───────────────────────┘
```

O wireframe é independente dessa implementação, mas explica a interação esperada entre camadas.

## 7. Critérios de aceite do Sprint 0.2

- [x] Seis telas construídas e conectadas.
- [x] Navegação Aluno → Curso → Aula.
- [x] Navegação Professor → Estrutura → Estúdio.
- [x] Estúdio demonstrativo com ações temporárias de composição de blocos.
- [x] Prévia visual dos blocos sem falsa promessa de salvamento.
- [x] CSS responsivo mobile/desktop e rótulos de protótipo.
- [x] Documento de decisão de UX e especificação de telas.
- [ ] Validação visual com uso real em iPhone, Android e desktop.
- [ ] Avaliação do fluxo por professor e aluno de teste.
- [ ] Aprovação das telas antes do design system definitivo.

## 8. Pontos para validar com os testes

1. O aluno entende o que está estudando e encontra “continuar” facilmente?
2. A tela de leitura possui o equilíbrio certo entre conteúdo e ações?
3. O professor consegue perceber curso → módulo → aula → bloco sem explicação prévia?
4. O editor é usável por toque, sem depender de mouse ou teclado?
5. “Visualizar como aluno” transmite confiança no resultado?
6. Quais blocos pedagógicos são realmente necessários na primeira versão?

## 9. Próxima etapa

**Sprint 0.3 — Especificação de conteúdo e estados**: mapear a estrutura detalhada do modelo de aula (tipos e propriedades), a matriz de rotas, os estados vazios/erro/carregamento e os contratos de dados de alto nível. O esquema JSON executável e a persistência serão implementados no Sprint 2.

**Sem alterações no repositório legado `sistema` e sem uso de Supabase.**
