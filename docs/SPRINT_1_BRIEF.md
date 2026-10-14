# ATELIER — Brief de implementação do Sprint 1
**Preparado no fechamento do Sprint 0 · 14/10/2026**

## Missão do Sprint 1

Construir o **Design System real** do Atelier e a estrutura de navegação responsiva dos três ambientes, mantendo a identidade editorial aprovada e a compatibilidade do site estático no GitHub Pages.

**Não implementar neste sprint:** banco, Supabase, login real, armazenamento de aulas, renderizador definitivo de JSON, avaliações persistentes ou pagamentos. Essas funções têm sprints próprios.

## 1. Direção visual e experiência

### Identidade visual a preservar e refinar

- **Base:** grafite escuro e superfícies de carvão, com títulos editoriais.
- **Cor de marca:** roxo profundo/lavanda, utilizado para destacar contexto, etapas e foco.
- **Cor de ação:** laranja quente, usada com parcimônia para botões e chamadas de atenção.
- **Texto:** contraste confortável; fundos alternativos claros para leitura longa apenas quando melhorarem a experiência.
- **Tom:** refinado, contemporâneo, didático; não usar estética infantil nem dashboards genéricos.

As cores exatas deverão ser definidas como **tokens CSS**, com verificação de contraste antes da homologação. Tokens iniciais são candidatos, não valores obrigatórios:

```css
:root {
  --color-bg: #131218;
  --color-surface: #211e29;
  --color-text: #f5f0ec;
  --color-muted: #c2b9c5;
  --color-primary: #b9a1e0; /* lavanda */
  --color-action: #e7aa7a;  /* laranja */
  --color-border: #3a3541;
  --radius-card: 14px;
  --reading-width: 72ch;
}
```

### Tipografia e leitura

- Títulos: serifada editorial com fallback seguro (sem depender de um serviço de fonte).
- Interface: sem serifa de boa leitura e caracteres acentuados.
- Corpo de aula: 16–18 px como ponto de partida em mobile, espaçamento generoso e largura máxima confortável.
- Hierarquia `h1/h2/h3` sem pular níveis por mero efeito visual.
- Tamanho de fonte regulável futuramente sem quebrar layout.

## 2. Telas/shells do Sprint 1

| Área | Entregável mínimo | Não confundir com |
|---|---|---|
| Shell do Aluno | Cabeçalho, navegação mobile/desktop, breadcrumbs, área de leitura | Progresso real e cursos no banco |
| Shell do Professor | Menu de cursos, estrutura e Estúdio em layout responsivo | Editor com dados persistidos |
| Shell do Admin | Navegação e estados básicos da área organizacional | Permissão/autorização real |
| Home | Porta de entrada orientada aos ambientes | Tela de login verdadeiro |
| Padrões | Card, botão, campo, badge, progresso demonstrativo, toast, modal, tab | Biblioteca pedagógica completa |

Começar pela navegação e pelo **layout**, reutilizando conteúdo fictício existente. A partir do Sprint 2, essas telas receberão dados externos.

## 3. Componentes de UI a implementar

- `AppShell` (aluno, professor, admin); `Topbar`; `Navigation`; `Breadcrumbs`.
- `Button`, `IconButton`, `Card`, `Badge`, `ProgressBar`, `EmptyState`.
- `Field`, `Textarea`, `Tabs`, `Dialog`, `Toast`.
- `LoadingState`, `ErrorState`, `MissingContent`.
- `ReadingSurface` com largura de texto adequada.
- `BlockPlaceholder` para as posições em que haverá componentes pedagógicos.

Usar nomes, eventos e props documentados. Componente visual deve ser reutilizável sem consultar dados do curso por conta própria.

## 4. Arquitetura técnica do Sprint 1

Preferência inicial: **HTML, CSS e JavaScript modular (ES Modules)**, sem dependência de instalação e sem bundler obrigatório. Os arquivos devem funcionar por importações relativas quando publicados em `/Atelie/`.

Rotas com `#/...` (hash) e um **roteador pequeno e explícito** para montar cada shell. Ele deve:
- Permitir reload/abrir link diretamente sem erro de servidor.
- Preservar contexto de navegação ao alternar entre telas.
- Exibir NotFound para uma rota inválida.
- Permitir navegação pelo teclado.
- Montar títulos e breadcrumbs de forma consistente.
- Tratar mudanças de rota sem preservar foco indevidamente em controles que desapareceram.

Manter a página `wireframes.html` como **referência histórica**; não duplicar indevidamente seus estilos no produto novo.

## 5. Sequência de trabalho do Sprint 1

1. **1.1 Tokens visuais:** cores, tipografia, espaçamentos, sombras, bordas, estados de foco e documentação.
2. **1.2 Componentes base:** botões, cartões, menus, tabs, cabeçalho, indicadores e mensagens.
3. **1.3 Navegação:** shells e hash routing para três ambientes.
4. **1.4 Telas-base:** Aluno, Professor e Admin com conteúdos fictícios e estados coerentes.
5. **1.5 Adaptação mobile:** menus e barras com toque, hierarquia sem scroll horizontal; atenção ao teclado virtual no Estúdio.
6. **1.6 QA e revisão:** teclado, foco, redução de movimento, contraste, largura móvel e links diretos; atualizar documentação e capturas/feedback quando possível.

## 6. Critérios verificáveis de aceite

- [ ] Os três ambientes aparecem dentro de um sistema visual consistente.
- [ ] Cada rota prevista para o Sprint 1 tem título e saída clara, sem tela em branco.
- [ ] Abrir `https://pscfredteixeira.github.io/Atelie/#/aluno` e recarregar não requer reescritas do servidor.
- [ ] Layout mantém hierarquia correta em 320, 375, 430, 768, 1024 e 1440 px (verificar por testes de viewport).
- [ ] Não há corte de texto nem rolagem horizontal inesperada.
- [ ] Botões, menus e abas têm feedback de foco visível e são operáveis por teclado.
- [ ] `prefers-reduced-motion` é respeitado e controles não dependem somente da cor.
- [ ] Componentes repetidos usam o mesmo design system, não cópias independentes.
- [ ] Conteúdo mostrado como fictício/demonstrativo é identificado sem ambiguidade.
- [ ] GitHub Pages continua configurado em `main` + `/(root)`.
- [ ] `wireframes.html` e documentos permanecem acessíveis.
- [ ] Nenhum projeto Supabase é consultado ou modificado; repositório `sistema` intocado.

### Validação humana necessária

Convidar pelo menos uma pessoa no papel de aluno e uma no papel de professor para localizar o que procuram **sem instruções**. Registrar onde hesitam. Isso avalia a UX; não substituir essa etapa por somente verificações técnicas.

## 7. Sequência depois do Sprint 1

**Sprint 2:** estrutura JSON executável, catálogo em `content/`, validação e adaptadores para JSON/IndexedDB.

**Sprint 3:** motor de blocos consumindo o contrato da aula.

**Sprint 4–6:** experiência do aluno, gestão de cursos e edição real de aulas.

**Sprint 8:** experiências interativas reutilizáveis.

Não antecipar um recurso complexo apenas para demonstrar impacto visual; primeiro precisamos de padrões previsíveis e componentes corretos.

## 8. Provas e documentação

Ao finalizar o Sprint 1, registrar:
- arquivos criados/alterados;
- mapa das rotas implementadas;
- checklist testado e o que não foi verificado;
- questões visuais que precisam de feedback dos colaboradores;
- bugs não resolvidos, se houver.

**Documento de referência:** [Fechamento do Sprint 0](SPRINT_0_FECHAMENTO.md).
