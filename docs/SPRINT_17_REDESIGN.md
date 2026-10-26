# Sprint 17 — Redesign editorial do Ateliê

Aplicação visual feita em 26/10/2026 a partir da referência aprovada.

## Implementado
- Interface escura em grafite e violeta, lavanda nos detalhes e pêssego nas ações primárias.
- Dashboard do aluno com hero editorial, curso em destaque, galeria de cursos reais e atalhos para caderno e progresso.
- Nova identidade de navegação e cartões compartilhada entre Aluno, Professor e Administração.
- Composição vetorial abstrata própria, armazenada no repositório, sem dependência de imagens de terceiros.
- Refinamento de tipografia, espaçamentos, botões, leitura, responsividade e estilos do tema claro.
- Identidade exibida como **Ateliê** (rotas e dados internos permanecem inalterados).

## Preservado
- Três perfis demonstrativos, sem simulação de autenticação real.
- Curso → aulas e o Estúdio Visual do professor.
- Quizzes, laboratório, índices pedagógicos, caderno e progresso local.
- Rascunhos, backups, conteúdo JSON, manifests, IndexedDB e chaves do localStorage.
- O curso em destaque e os cartões são derivados do catálogo real; nenhum progresso fictício ou recurso inexistente aparece na interface.

## Arquitetura
A nova folha `src/styles/redesign.css` é carregada **após** `atelier.css` e `theme.css`, isolando a reforma visual das regras pedagógicas e diminuindo riscos de regressão. O vetor decorativo vive em `assets/atelier-hero-art.svg`.

## Conferência necessária
Revisar visualmente em navegador real nos perfis Aluno, Professor e Administração, temas claro/escuro e larguras de 390 px, 768 px e desktop. Validar interações de quiz, caderno, rascunho e recuperação após atualização. Não houve execução de testes de navegador nesta alteração.

## Revisão visual 17.1
- Removido o rosto geométrico e os anéis sobrepostos da capa, considerados artificiais na revisão.
- Capa usa agora uma fotografia documental de Sigmund Freud feita por Max Halberstadt (circa 1921), em domínio público segundo Wikimedia Commons: https://commons.wikimedia.org/wiki/File:Sigmund_Freud,_by_Max_Halberstadt.jpg
- A imagem é servida externamente pelo Wikimedia Commons, com fundo degradê de reserva caso ela não carregue.
- Refinados largura da área de texto e visibilidade do retrato por tamanho de tela.
- Revertida grade min-width implícita na leitura móvel: `minmax(0,1fr)`.
