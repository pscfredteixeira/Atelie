# Atelier.

Protótipo de uma plataforma para ensinar, estudar e experimentar conceitos da psicanálise.

> **Estado atual:** Sprint 0.2 — protótipo navegável de seis telas, sem login real, banco ou salvamento remoto. **Ainda não é** a plataforma de aulas definitiva.

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
| 0 | Arquitetura, mapa e jornadas |
| 1 | Design system e UX responsiva |
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

**Sprint 0.3 — Especificação detalhada dos contratos de conteúdo e estados de interface.**

Validar as seis telas com professores e alunos de teste antes da implementação definitiva.
