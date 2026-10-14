# ATELIER — Sprint 4: Jornada de Aprendizagem
**14 de outubro de 2026 · Implementação registrada no GitHub · validação visual no navegador pendente**

## Objetivo

Transformar catálogo, curso e sala em um **percurso contínuo de aprendizagem**, dirigido pelo manifesto JSON, com navegação anterior/próxima e apresentação pedagógica clara. **Ainda não existe progresso persistente, matrícula ou certificação**: entrar e sair de uma aula não marca sua conclusão.

## Entregas desta etapa

| Recurso | Implementação |
|---|---|
| Trilha ordenada e desacoplada das telas | `src/features/learning/journey.js` |
| Identificação da aula atual, anterior e próxima | `getLessonContext(course, lessonId)` |
| Tempo estimado calculado a partir das aulas | `summarizeCourse(course)` |
| Apresentação de curso com objetivos e ementa | `src/app/views.js` |
| Primeira aula destacada no curso | `src/app/views.js` |
| Títulos, resumos e duração por aula no manifesto | `content/courses/fundamentos/curso.json` |
| Navegação anterior/próxima e programa recolhível | `src/app/views.js` |
| Estilos responsivos do percurso | `src/styles/atelier.css` |
| Metadados no catálogo e adaptador | `content/catalogo.json`, `src/repositories/content-repository.js` |
| Validação desses campos | `src/repositories/validators.js` e esquemas em `schemas/` |
| Diagnóstico de sequência e acesso às três aulas | `tests/smoke.js` |

## Três aulas demonstrativas publicadas em JSON

**Curso:** Fundamentos da Psicanálise — Módulo 1, *Conflito e defesa*.

| Ordem | ID imutável | Título | Duração indicativa |
|---|---|---|---|
| 1 | `aula-conflito` | O conflito psíquico: uma pergunta inicial | 16 min |
| 2 | `aula-recalque` | O recalque em Freud | 18 min |
| 3 | `aula-retorno` | O retorno do recalcado | 18 min |

Carga aproximada: **52 minutos**. São exemplos didáticos construídos para validar a estrutura, ainda sujeitos a revisão editorial e bibliográfica. Não utilizam informações de pacientes.

Os arquivos estão em `content/courses/fundamentos/aulas/`. O manifesto decide a ordem; a interface não precisa associar uma aula a uma posição fixa no código.

## Jornada do aluno

```text
Início
  → Catálogo
    → Curso e objetivos
      → Programa do módulo
        → 01 Conflito psíquico
          ↔ 02 Recalque
            ↔ 03 Retorno do recalcado
```

**Na página do curso:** o visitante vê os objetivos pedagógicos, a sequência das aulas, o tempo estimado e um botão inequívoco para iniciar pela primeira aula. Títulos e resumos vêm do JSON, não de condicionais de interface.

**Na sala de aula:** o visitante vê curso e localização no percurso, objetivos, blocos pedagógicos, índice interno e controles para navegar à aula anterior ou à próxima. Também pode consultar o programa completo em painel recolhível.

**Na última aula:** aparece o fim do conteúdo disponível, mas **não** uma mensagem de conclusão automática ou certificado. A conclusão real será desenvolvida no Sprint 10.

**No professor:** a estrutura dos módulos usa os mesmos títulos do manifesto e continua encaminhando ao editor JSON local, sem alterar o conteúdo público.

## Regras técnicas preservadas

1. `getCourseJourney` ordena módulos e aulas usando `position`, sem modificar o manifesto original.
2. Identificadores de aula não dependem do título ou posição.
3. A leitura percorre somente itens de aula com status ausente ou `published` no manifesto. **A publicação de fato exige que o arquivo de aula também esteja publicado.**
4. Navegar entre aulas não grava dados nem infere aprendizado.
5. A Sala de Aula continua usando o motor de blocos do Sprint 3; o JSON permanece independente.
6. Perfis de professor e administrador ainda são demonstrativos, sem proteção de acesso.
7. GitHub Pages hospeda a demonstração, mas não substitui o servidor da fase comercial.
8. Nenhuma conta, serviço ou projeto Supabase foi consultado ou alterado.

## Links de teste

Site previsto: `https://pscfredteixeira.github.io/Atelie/`.

- Catálogo: `#/cursos`.
- Curso: `#/cursos/curso-fundamentos`.
- Primeira aula: `#/cursos/curso-fundamentos/aulas/aula-conflito`.
- Segunda aula: `#/cursos/curso-fundamentos/aulas/aula-recalque`.
- Terceira aula: `#/cursos/curso-fundamentos/aulas/aula-retorno`.
- Diagnóstico executável em navegador: `tests/smoke.html`.

## Verificações executadas

**Testes isolados com o conteúdo efetivamente armazenado no GitHub:**
- [x] Sintaxe dos módulos JavaScript afetados.
- [x] Validação do catálogo, manifesto e três aulas em JSON.
- [x] Sequência calculada: conflito → recalque → retorno.
- [x] Duração total calculada em 52 minutos.
- [x] Primeira aula sem anterior; segunda com anterior e próxima; terceira sem próxima.
- [x] Treze rotas de demonstração renderizadas sem exceção no teste isolado.
- [x] Página do curso exibe títulos reais do manifesto, não IDs técnicos.
- [x] Botão de início aponta à primeira aula.
- [x] Links anterior/próxima apontam às aulas corretas.
- [x] Nenhuma mensagem automática de aprovação ou conclusão.
- [x] Diagnóstico de navegador atualizado para testar o percurso e as três aulas.

**Ainda não executados/homologados:**
- [ ] Abertura visual do site publicado e fluxos de navegação em navegador real.
- [ ] Testes em iPhone, Android e desktop, incluindo toque, teclado e rolagem.
- [ ] Revisão humana das três aulas e fontes bibliográficas.
- [ ] Auditoria de acessibilidade WCAG e leitores de tela.
- [ ] Avaliação com alunos convidados.

Não substituir essas verificações reais por testes sintéticos.

## Próximos passos

**Sprint 5 — Estúdio de Criação: gestão de cursos e módulos.** Implementar criação e organização local de cursos e módulos, separando rascunhos de conteúdos públicos e preparando exportação. O Sprint 6 cuidará do editor visual de blocos da aula.

**Não usar Supabase** agora; continuar com JSON público, IndexedDB local e publicação manual no GitHub. O repositório legado `sistema` permanece intocado.
