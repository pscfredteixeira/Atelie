# Ateliê — identidade visual creme e laranja

**Data:** 19/10/2026
**Fonte:** arquivo de referência visual Getharvest / "Golden hour workbench" fornecido pelo projeto.
**Objetivo:** adaptar a linguagem, sem copiar marcas, imagens ou fontes comerciais.

## Parâmetros aplicados
- Canvas creme `#fff8f1` e cartões brancos `#fff`.
- Laranja `#fa5d00` para CTA, navegação selecionada e destaques.
- Preto quente `#1d1e1c` e cinzas quentes para texto.
- Botões e campos com raio 16px; cartões com raio 20px.
- Sombra suave aquecida e gradientes discretos.
- Fontes abertas DM Sans (funcional) e DM Serif Display (hero), com fallbacks locais.
- Modo claro por padrão. Modo escuro mantido, mas com paleta escura quente.
- Menu lateral preservado: função de navegação da plataforma, adaptada ao estilo.

## Escopo técnico
- Novo `src/styles/atelier-golden.css`, carregado após as camadas anteriores.
- `index.html` recebeu configuração do tema padrão, referência do CSS e fontes.
- `src/features/theme/theme.js` recebeu chave de preferência específica da identidade, sem deletar a anterior.
- `src/app/main.js` utiliza o tema claro inicial.
- Telas de diagnóstico recebem a mesma camada de estilo.
- Verificação automatizada das cores, raios e tema escuro no Chromium.

## Invariantes
Sem alterações no conteúdo de `content/`, nos validadores, nas rotas, na estrutura do IndexedDB
ou no processamento dos quizzes. Respostas corretas mantêm a cor verde (semântica de acerto),
mesmo com laranja como cor principal de navegação.

## Critérios de aceite
- Entrada com três perfis em layout claro, cartões arredondados e CTA laranja.
- Cursos, sala de aula, caderno, progresso, administração e Estúdio usando a mesma paleta.
- Alternância de tema preserva navegação e notas.
- Sem rolagem horizontal em 390px; revisão visual pendente em aparelhos reais.
- Testes do GitHub Actions sem erros de console e com as verificações de regressão aprovadas.
