# Ateliê — Sprint 15: estabilização

**Data:** 15 de outubro de 2026  
**Branch:** `main`  
**Escopo:** somente `pscfredteixeira/Atelie`. Nenhuma alteração nos JSONs dos cursos ou no conteúdo das aulas.

## Alterações

1. **Navegação do professor:** o teste de identificadores de aulas previstas deixou de usar o padrão de caracteres escapado incorretamente no handler de navegação. O predicado validado passou a ser compartilhado com os testes.
2. **Progresso:** uma métrica distingue `total` (programa), `available` (aulas com conteúdo), `planned` (em preparação) e `completed` (conclusões válidas). O percentual usa apenas o denominador disponível e recebe um rótulo inequívoco. Cursos sem aulas disponíveis exibem 0%, não 100%.
3. **Leitura:** a contagem "Aula X de Y" considera o programa completo, em vez de somente as aulas já publicadas. A navegação anterior/próxima continua restrita às aulas realmente estudáveis.
4. **Restaurar backup:** a importação validada cria um checkpoint anterior; em erro posterior, um processo de compensação restaura as chaves alteradas nos quatro repositórios locais. As cópias do catálogo são recuperadas com o timestamp anterior. Se a gravação de recuperação também falhar, o problema é comunicado expressamente e o backup original deve ser usado.
5. **Validação de histórico:** entradas duplicadas para mesmo perfil/curso/aula são rejeitadas antes de gravar.
6. **Quizzes e tema:** os tons verdes aprovados nos dois temas foram preservados. Um teste de cor computada confere ambos os estados no navegador.
7. **Testes:** ampliada `tests/smoke.html` com os cenários de navegação, progresso, acertos verdes, registros de backup duplicados e importação fictícia.
8. **Cache:** atualizado o identificador da inicialização e dos módulos alterados, sem limpar o IndexedDB.

## Preservação

Não há migração de esquema IndexedDB; os nomes das bases e identificadores permanecem iguais. A restauração continua uma operação explícita do usuário. O protótipo não possui autenticação real nem sincronização entre aparelhos.

## O que falta conferir manualmente

- Executar `https://pscfredteixeira.github.io/Atelie/tests/smoke.html` e verificar todas as linhas.
- Abrir o curso Introdução à Psicanálise e conferir "Aula 1 de 8 no programa".
- Marcar a primeira aula como concluída com perfil fictício; conferir "1 de 1 aula disponível" e "7 aulas em preparação".
- Abrir Estúdio e clicar em uma aula prevista; confirmar destaque e rolagem.
- Responder um quiz correto nos modos escuro e claro e verificar a cor verde.
- Exercitar backup de dados fictícios e restauração em perfil/navegador de teste. Evitar substituir dados importantes.
- Inspecionar em Safari/iPhone, Chrome/Android e desktop (larguras 320, 375, 390, 430, 768 px).
- Testar o fluxo de backup sob falha real de armazenamento; nenhuma implementação cliente pode prometer rollback caso o IndexedDB seja bloqueado ou esteja sem espaço.

**Estado:** alterações de código feitas; homologação visual/end-to-end em navegadores reais não foi concluída por esta etapa.
