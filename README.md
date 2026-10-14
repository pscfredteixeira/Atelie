# Atelier.

Protótipo de uma plataforma para ensinar, estudar e experimentar conceitos da psicanálise.

> **Estado atual:** Sprint 1 com interface modular e navegação demonstrativa implementadas. QA visual no site publicado e testes em dispositivos reais pendentes. Dados são fictícios; sem autenticação, dados remotos ou salvamento de aulas.

## Abrir o Atelier

Site principal (GitHub Pages em `main/(root)`):
https://pscfredteixeira.github.io/Atelie/

Rotas de demonstração:
- Aluno: https://pscfredteixeira.github.io/Atelie/#/aluno
- Professor: https://pscfredteixeira.github.io/Atelie/#/professor
- Administrador: https://pscfredteixeira.github.io/Atelie/#/admin
- Biblioteca visual: https://pscfredteixeira.github.io/Atelie/#/admin/identidade

Protótipos anteriores preservados:
- https://pscfredteixeira.github.io/Atelie/arquitetura.html
- https://pscfredteixeira.github.io/Atelie/wireframes.html

O código foi salvo no repositório, mas a publicação do Pages e os testes em dispositivos reais precisam de confirmação.

## Sprint 1 — Implementação

- [Relatório das telas, componentes, testes e pendências](docs/SPRINT_1_RESULTADO.md).
- [Design System e interface responsiva](src/styles/atelier.css) e [tokens de identidade](src/styles/tokens.css).
- [Navegação modular](src/app/main.js), [telas](src/app/views.js), [componentes](src/ui/components.js).
- Dados fictícios em [`src/app/data.js`](src/app/data.js); não são os JSON definitivos.

## O que já existe

- [Protótipo navegável das seis telas](wireframes.html) e sua [especificação de UX](WIREFRAMES_ATELIER.md).

- [Mapa de navegação e jornada dos três ambientes](ARQUITETURA_ATELIER.md).
- Página inicial responsiva com apresentação da arquitetura para colaboradores.
- Alternância visual entre os ambientes Aluno, Professor e Administrador, sem autenticação real.

## Fechamento da arquitetura e próximo desenvolvimento

- [Sprint 0.4 — Decisões finais, riscos e critérios de qualidade](docs/SPRINT_0_FECHAMENTO.md).
- [Sprint 1 — Brief do design system e navegação responsiva](docs/SPRINT_1_BRIEF.md).
- [Mapa mestre](ARQUITETURA_ATELIER.md) e [wireframes navegáveis](wireframes.html).

## Especificações da etapa 0.3

- [Contrato JSON: cursos, módulos, aulas, blocos e armazenamento](docs/CONTRATO_CONTEUDO.md).
- [Rotas, estados editoriais, aprendizagem e tratamento de erros](docs/ROTAS_E_ESTADOS.md).
- JSON de demonstração: [catálogo](docs/exemplos/catalogo.v1.json) → [curso](docs/exemplos/curso-fundamentos.v1.json) → [aula](docs/exemplos/aula-recalque.v1.json).

Os exemplos são propostas documentais verificadas quanto à sintaxe e às referências básicas, **não estão conectados ao motor de aulas**. A validação formal virá no Sprint 2.

## Decisões do protótipo

- Não usar Supabase nem banco de dados remoto.
- Conteúdo das aulas em arquivos JSON versionados.
- Rascunhos e progresso salvos localmente no navegador, com exportação e importação previstas.
- Repositório e GitHub Pages são **temporários para testes e demonstração**.
- Futuramente trocar o armazenamento por servidor e banco, mantendo o motor de aulas.
- Não guardar senhas reais ou dados pessoais de alunos em JSON público.
- O repositório antigo `sistema` permanece independente e intocado.

## Sprints previstos

| Sprint | Objetivo |
|---|---|
| 0 | Arquitetura, mapa, jornadas e decisões — **documentação concluída** |
| 1 | Design system, shells e rotas — **implementado; QA visual pendente** |
| 2 | Estrutura JSON e repositórios locais — **próximo** |
| 3 | Motor de aulas por blocos |
| 4 | Catálogo, cursos e jornada de estudo |
| 5 | Gestão de cursos e módulos |
| 6 | Editor visual de aulas |
| 7 | Modelos pedagógicos |
| 8 | Biblioteca de interatividades |
| 9 | Avaliações |
| 10 | Progresso, notas e perfis simulados |
| 11 | Revisão, versões e exportação |
| 12 | Testes, acessibilidade e desempenho |
| 13 | Beta e testes com convidados |

## Próxima etapa

**Sprint 2 — Conteúdo JSON executável e adaptadores de leitura/escrita local.** Trocar dados fictícios de `src/app/data.js` por leitura de JSON publicados; adicionar validação, fontes locais e preparação de backups.

Antes de homologar a experiência visual, testar o site no celular e em um navegador desktop. A documentação contém os testes já executados e os que faltam.
