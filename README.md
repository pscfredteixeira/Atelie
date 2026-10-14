# Atelier.

Protótipo de uma plataforma para ensinar, estudar e experimentar conceitos da psicanálise.

> **Estado atual:** Sprint 0 **concluído na documentação** (etapas 0.1–0.4). Arquitetura e wireframes prontos para iniciar o Sprint 1. O protótipo ainda **não é** a plataforma de aulas definitiva; testes reais de usabilidade e dispositivos continuam pendentes.

## Abrir a demonstração

GitHub Pages configurado em **main / (root)**:

https://pscfredteixeira.github.io/Atelie/

**Protótipo das seis telas:** https://pscfredteixeira.github.io/Atelie/wireframes.html

A publicação pode levar alguns minutos após o commit. Se a página não aparecer, verificar em Settings → Pages o status do deploy.

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
| 1 | Design system e UX responsiva — **próximo** |
| 2 | Estrutura JSON e repositórios locais |
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

**Sprint 1 — Implementar o Design System e as estruturas de navegação.** Os entregáveis, limitações e critérios de aceite estão descritos em [docs/SPRINT_1_BRIEF.md](docs/SPRINT_1_BRIEF.md). Nenhum recurso de banco de dados será usado nesta etapa.
