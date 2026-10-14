# ATELIER — Sprint 3: motor pedagógico de aulas
**14 de outubro de 2026 · Implementação registrada no GitHub · homologação visual pendente**

## Objetivo e resultado

O Atelier não precisa mais decidir como exibir uma aula por seu identificador ou por condicionais concentradas num único renderizador. Cada tipo de conteúdo possui um **componente versionado**, registrado num catálogo. O mesmo motor lê as aulas públicas e os rascunhos de prévia do professor.

O motor **não faz login**, **não salva progresso**, **não conecta ao Supabase** e **não executa scripts presentes no JSON**. As funções avançadas de avaliação, autoria visual e laboratórios continuam nas etapas específicas do plano.

## Implementação

| Arquivo | Responsabilidade |
|---|---|
| `src/lesson-engine/block-registry.js` | Registro de tipos e versões; consulta e inventário |
| `src/lesson-engine/block-renderers.js` | Renderizadores de cada componente com escape de texto e fontes seguras |
| `src/lesson-engine/engine.js` | Renderização sequencial, estrutura comum, índice da aula e isolamento de falhas |
| `src/lesson-engine/basic-renderer.js` | Compatibilidade com imports antigos do Sprint 2 |
| `src/app/views.js` | Sala do aluno, prévia e biblioteca de blocos reutilizam o motor |
| `src/app/main.js` | Navegação por bloco com foco e suporte a movimento reduzido |
| `src/styles/atelier.css` | Estilos editoriais responsivos de conceitos, mídias, comparações, cronologias e índice |
| `src/repositories/validators.js` | Regras para novos componentes |
| `schemas/lesson.schema.json` | Contrato formal de aula atualizado para componentes de versão 1 |
| `content/courses/fundamentos/aulas/recalque.json` | Aula demonstrativa expandida para nove blocos |

## Biblioteca inicial: 14 tipos

| `type` | O que faz agora | Etapa de amadurecimento |
|---|---|---|
| `question` | Pergunta de abertura e dica | Atividades reflexivas mais sofisticadas: Sprint 9 |
| `rich_text` | Texto editorial em parágrafos | Sprint 7 |
| `heading` | Título de seção | Disponível |
| `clinical_vignette` | Situação fictícia e reflexão sem diagnóstico | Sprint 7 |
| `multiple_choice` | Exibe pergunta e alternativas | **Respostas e correção: Sprint 9** |
| `references` | Lista referências vinculadas aos IDs bibliográficos da aula | Disponível |
| `concept` | Conceito com explicação revelável por teclado ou toque | Disponível |
| `quote` | Citação ou síntese editorial com atribuição | Disponível |
| `comparison` | Tabela de duas perspectivas com rolagem horizontal interna em telas estreitas | Disponível |
| `timeline` | Linha do tempo sem ordem rigidamente amarrada à aula | Disponível |
| `image` | Imagem com texto alternativo, legenda e crédito | Requer arquivos reais em caminho permitido |
| `audio` | Reprodutor e transcrição recolhível | Requer mídia e transcrição |
| `video` | Reprodutor, faixa de legendas e transcrição | Requer mídia e recursos de acessibilidade |
| `interactive_lab` | Apresentação e alternativa de estudo | **Motor de experiências: Sprint 8** |

**Importante:** “tipo registrado” não equivale a “toda a funcionalidade final pronta”. O motor exibe fallback compreensível para tipo desconhecido, versão incompatível, mídia ausente ou falha no componente, sem interromper os outros blocos.

## Regras pedagógicas e técnicas

1. Cada bloco é um objeto `{id,type,version,data,settings}`. A ordem no array define a ordem de leitura.
2. `id` não muda ao reordenar; links de índice apontam para `bloco-<id>` e seções aceitam foco.
3. `settings.showInOutline === false` remove o bloco apenas do índice, não da leitura.
4. `settings.emphasis === "featured"` destaca um bloco sem alterar seus dados.
5. A criação de componentes novos depende de `registerBlockRenderer`. Não altera IDs nem nomes de cursos.
6. Os renderizadores recebem `data` e `context`, incluindo a aula e a URL do arquivo quando necessário.
7. Textos do JSON são codificados como texto HTML, sem interpretar código nem HTML arbitrário.
8. Mídias são aceitas somente se o caminho relativo permanecer **dentro da pasta da aula que os referencia**, na mesma origem, sem parâmetros externos. Arquivos reais de mídia ainda não foram incluídos.
9. A aula do aluno usa somente o JSON publicado; a prévia do professor usa o rascunho local salvo, quando existir.
10. A sessão atual de edição técnica ainda exige salvar o JSON para que a prévia reflita as modificações.

## Aula demonstrativa

A aula *O recalque em Freud*, revisão 2, passa a incluir nove momentos:
- Pergunta inicial;
- Leitura teórica;
- Conceito em foco;
- Comparação entre observação e hipótese;
- Vinheta inteiramente fictícia;
- Linha do tempo histórica;
- Nota editorial (explicitamente não atribuída a Freud);
- Questão formativa em modo de leitura;
- Referência bibliográfica.

A nova organização também foi feita para avaliar legibilidade e densidade de diferentes blocos no celular.

## Como verificar

**Atelier:** `https://pscfredteixeira.github.io/Atelie/`

- Aula JSON: `#/cursos/curso-fundamentos/aulas/aula-recalque`.
- Prévia: `#/professor/cursos/curso-fundamentos/aulas/aula-recalque/previa`.
- Biblioteca de blocos: `#/admin/blocos`.
- Diagnóstico executável: `tests/smoke.html` (agora com testes de registro, índice, fallback e escape de HTML).

### Verificações realizadas em isolamento

- [x] Sintaxe JavaScript dos módulos alterados.
- [x] A aula publicada passou na validação de dados.
- [x] O registro reconheceu 14 tipos v1.
- [x] Os nove blocos renderizam com índice e identificadores correspondentes.
- [x] Seção de destino recebe `tabindex="-1"`.
- [x] Falha deliberada num bloco não derruba os demais.
- [x] Tipo/versão sem renderizador recebe fallback.
- [x] HTML malicioso em texto é escapado.
- [x] Tentativa de caminho de imagem fora da pasta da aula é rejeitada.
- [x] Arquivo JSON Schema é sintaticamente válido e declara os novos tipos.

### Verificações ainda pendentes

- [ ] Confirmar publicação e funcionamento no navegador real com conexão ao Pages.
- [ ] Executar `tests/smoke.html` no navegador para confirmar os testes (inclusive IndexedDB).
- [ ] Avaliar leitura, foco, responsividade, comparações e navegação na tela pequena de um iPhone e Android.
- [ ] Testar mídia real, legendas, transcrição e leitores de tela.
- [ ] Conferir a experiência com alunos e professores convidados.

**Nenhuma dessas pendências é dada como concluída apenas por passar num teste sintético.**

## Próximo Sprint — 4: Jornada de estudo

Consolidar a experiência do aluno, do catálogo ao curso e à aula, com navegação anterior/próxima, estados de módulo e programa, visualização didática de objetivos e acessibilidade móvel. O progresso persistente e as avaliações completas permanecem para os Sprints 10 e 9.

Referências: [Arquitetura mestre](../ARQUITETURA_ATELIER.md), [contrato JSON](CONTRATO_CONTEUDO.md), [resultado do Sprint 2](SPRINT_2_RESULTADO.md).

**Sem uso de Supabase e sem alterações no projeto legado `sistema`.**
