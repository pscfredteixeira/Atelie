# Ateliê — Sprint JSON 2: aula-piloto no aplicativo atual
**14/11/2026 · Implementação em branch isolada · Revisão antes de publicar**

## Objetivo
Comprovar que uma aula composta de blocos **JSON v1** pode ser apresentada no **Ateliê atual**, sem precisar copiar uma página HTML completa para cada aula e sem alterar as aulas existentes.

## Diagnóstico importante
O `index.html` em produção carrega `app.js` como aplicativo principal. O motor JSON do projeto, em `src/lesson-engine/`, já existia, mas não era o responsável por desenhar as quatro aulas históricas do `app.js`, que usam experiências HTML próprias.

Por isso a Sprint 2 acrescenta uma rota de laboratório à aplicação atual, carregando e renderizando diretamente o motor v1. **Não substitui o app nem migra as aulas antigas.**

## Entregas
- `content/piloto-json-sprint-02/catalogo.json`: índice de teste isolado, **fora** do `content/catalogo.json` principal.
- `content/piloto-json-sprint-02/curso.json`: manifesto de teste com uma aula.
- `content/piloto-json-sprint-02/aulas/escuta-e-hipoteses.json`: aula completa e original sobre relato, hipótese e escuta.
- `json-pilot.js`: adaptador entre a aplicação atual e as funções existentes de validação, renderização e interatividade.
- `json-pilot.css`: visual de aula isolado por `.json-pilot`, cores claras, roxo e laranja, responsividade e respeito a movimento reduzido.
- `app.js`: adiciona **somente** a rota `#/laboratorio/json`, o link de acesso no Estúdio e o carregamento do módulo nessa rota.
- `index.html`: inclui apenas a folha de estilos isolada.
- `scripts/verify-json-pilot.mjs`: teste reproduzível que confere os três JSONs, motor real, quiz integrado, laboratório e integração da rota.

O piloto contém **13 blocos**: pergunta inicial, três seções, textos, conceito, quadro comparativo, vinheta totalmente fictícia, laboratório de escolhas, duas perguntas de revisão e bibliografia. **Não possui `metadata.interactivePage`**; a experiência é construída pelo motor de blocos.

## Como testar após obter a branch no computador
Na raiz da branch:
```bash
node scripts/verify-json-pilot.mjs
python -m http.server 4173
```

Abra `http://127.0.0.1:4173/#/laboratorio/json` (ou, a partir da própria aplicação, entre em `#/estudio` e use **Abrir aula-piloto JSON**).

**Atenção:** o site `https://pscfredteixeira.github.io/Atelie/` usa `main`. **Enquanto este pull request estiver em rascunho e sem merge, o URL de laboratório não ficará disponível no site público.**

## Verificações concluídas nesta execução
- [x] Conteúdo aprovado pelo validador **real** `validateCatalog` / `validateCourse` / `validateLessonLink` executados em isolamento.
- [x] Teste negativo: bloco com ID duplicado foi rejeitado.
- [x] Renderização real do `renderLessonBlocks` executada em isolamento: gerou 12 seções visuais, incluindo um quiz com duas perguntas e um slide final; laboratório presente.
- [x] Índice gerado com 12 itens (os dois quizzes tornam-se uma entrada).
- [x] Sintaxe do `app.js` e corpos do `json-pilot.js` e do verificador conferida em isolamento.
- [x] Nenhum arquivo das quatro experiências HTML existentes foi alterado; nenhum dado de aluno ou regra do Firebase foi alterado.
- [ ] Executar `node scripts/verify-json-pilot.mjs` numa cópia completa da branch (não realizado nesta execução).
- [ ] Verificar o fluxo completo **clicando no navegador real**, no Chrome desktop e Safari/iPhone: carregamento, menu, responsividade, laboratório, acertar/errar/repetir quiz e voltar ao Estúdio.
- [ ] Testar comportamento offline/timeout e conferir que nenhum progresso pessoal é escrito.
- [ ] Revalidar as quatro aulas HTML já usadas pelos alunos antes de integrar a branch.

## Regras editoriais e de proteção
- A aula-piloto é material técnico de demonstração; as situações são ficcionais. Sua inclusão não implica aprovação editorial de um novo curso.
- O índice do piloto está separado e **não cria um novo curso no catálogo principal**.
- As respostas do quiz e do laboratório **não são enviadas ao Firebase nem persistidas**; reiniciar ou sair da página as perde.
- Os quatro percursos das aulas históricas continuam em `app.js`, sem conversão.
- Não há avaliação certificadora nem acompanhamento de estudantes neste piloto.

## Próxima Sprint JSON 3
Somente depois de testar visualmente a rota, avaliar como transformar o adaptador específico do laboratório em uma integração genérica para **novas aulas** do Ateliê, com menu, editor e critérios de publicação, sem perder a flexibilidade das aulas HTML.

> **Controle de versões:** esta Sprint 2 nasce de `main` de forma independente do pull request [Sprint JSON 1 (#5)](https://github.com/pscfredteixeira/Atelie/pull/5), ainda em revisão. Os dois não precisam ser mesclados automaticamente.
