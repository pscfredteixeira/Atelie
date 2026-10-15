# Atelier.

Protótipo de uma plataforma para ensinar, estudar e experimentar conceitos da psicanálise.

> **Estado atual:** Sprint 14 de estabilização implementado: edição offline de rascunhos, histórico local protegido, carregamento com limites de espera e ajustes no menu mobile. A criação de cursos e aulas continua na interface. **Não está homologado:** verificação completa no GitHub Pages, acessibilidade e testes com convidados continuam pendentes.

## Primeira aula publicada — O que é psicanálise?

A primeira aula do curso **Introdução à Psicanálise** já está disponível em [`#/cursos/curso-introducao-psicanalise/aulas/aula-o-que-e-psicanalise`](https://pscfredteixeira.github.io/Atelie/#/cursos/curso-introducao-psicanalise/aulas/aula-o-que-e-psicanalise).

Ela reúne 27 blocos (texto didático, conceitos reveláveis, cronologia, comparação, vinheta fictícia, laboratório de escuta, duas perguntas com correção e bibliografia com links). As outras sete aulas continuam honestamente sinalizadas como em preparação. [Leia o plano de pesquisa, referências e pontos de rigor](docs/AULA_01_O_QUE_E_PSICANALISE.md).

## Organização pedagógica: curso → aulas

O Atelier apresenta uma **sequência única de aulas dentro de cada curso**, sem subníveis de módulos na navegação ou na criação visual.

- **Introdução à Psicanálise:** oito aulas previstas, ainda em preparação.
- **Formação Freudiana:** dez aulas previstas, ainda em preparação.
- **Fundamentos da Psicanálise:** três aulas com conteúdo publicado, preservadas.

Ao clicar numa aula prevista, o estudante visualiza seu título, apresentação e a indicação honesta de que o conteúdo ainda está em preparação. Uma aula com conteúdo abre diretamente a Sala de Aula. No ambiente Professor, **Preparar conteúdo da aula** cria seu rascunho; **Adicionar uma aula ao curso** cria a aula e abre o Estúdio Visual.

**Compatibilidade:** os manifests JSON v1 continuam a armazenar `modules[]` internamente, para preservar os identificadores e os rascunhos já salvos no IndexedDB. A interface interpreta esses registros como aulas de um curso; as novas aulas usam automaticamente um contêiner técnico interno, que não aparece para o usuário. Não foram gerados textos de ensino fictícios para aulas ainda não escritas.

As verificações automáticas de navegação e dados estão em `tests/smoke.html`; conferência visual no navegador continua necessária.

## Entrada por três perfis demonstrativos (JSON)

Ao abrir a plataforma em um navegador sem perfil selecionado, aparece uma **tela de entrada** com três cartões:

- **Aluno**: cursos, aulas, caderno e progresso local.
- **Professor**: painel, criação de cursos, editor visual e rascunhos locais.
- **Administrador**: diagnóstico, backups, biblioteca de blocos e roteiro beta.

A configuração dos cartões está no arquivo [`content/perfis-acesso.json`](content/perfis-acesso.json). O papel escolhido é guardado na chave `atelier-demo-access-v1` de `localStorage`, até usar **Sair** ou selecionar outro perfil. **Trocar perfil** abre novamente os três cartões. As opções de menu e as rotas exibidas se adaptam ao perfil escolhido; o conteúdo e os rascunhos locais não são apagados ao sair.

**Isso não é autenticação:** não há usuário/senha, permissões de servidor ou segurança de rota. Como o site e o JSON estão no GitHub Pages, o código e o conteúdo publicado podem ser vistos independentemente da interface. **Não inserir senhas, hashes, credenciais ou conteúdo confidencial no JSON.** O acesso por contas reais exigirá backend, autenticação e autorização no servidor.

Acesse a seleção pelo link: `https://pscfredteixeira.github.io/Atelie/#/entrar`.

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

## Navegação por curso no menu

O menu principal foi organizado como no Atelier anterior: primeiro o usuário **seleciona o curso**, e depois aparecem **os módulos e as aulas daquele curso dentro do menu**. Não há uma longa lista fixa de cursos nem atalhos técnicos de demonstração.

- **Aluno:** selecione *Introdução à Psicanálise* ou *Formação Freudiana* e abra um dos 8 ou 10 módulos diretamente pelo menu. As aulas aparecem aninhadas quando forem produzidas e publicadas.
- **Professor:** use o seletor da área Criar para encontrar os módulos de cada curso e saltar à sua seção de edição; aulas existentes aparecem com link para o Estúdio Visual.
- **Celular:** o seletor também aparece na barra superior; no menu lateral, trocar o curso mantém o menu aberto para escolher um módulo.
- **Retomada:** o último curso selecionado em cada ambiente é lembrado durante a sessão no mesmo navegador. Não é uma inscrição ou matrícula.

[Seletor e sumário de cursos](src/features/navigation/course-menu.js) · [Testes funcionais](tests/smoke.html)

## Criação de cursos dentro da própria plataforma

**[Abrir o Estúdio do professor](https://pscfredteixeira.github.io/Atelie/#/professor)**

A criação de cursos agora ocorre completamente na interface, seguindo a experiência do Atelier anterior: professor informa **símbolo e título**, cria **módulos**, monta **aulas com blocos visuais**, salva e clica **Disponibilizar na área do aluno**.

Os cursos assim disponibilizados passam a aparecer no **catálogo do aluno do mesmo navegador**, sem abrir o GitHub nem editar JSON. O professor pode atualizar ou retirar o curso da biblioteca do dispositivo. O backup também inclui as versões disponibilizadas.

**Importante:** a disponibilização é local e **não coloca o curso na internet para outros estudantes**. Essa etapa exige uma futura publicação remota segura ou um commit manual no GitHub. Não há login real nem Supabase.

[Documentação do fluxo, limites e testes](docs/CRIACAO_CURSO_DENTRO_DA_PLATAFORMA.md)

## Sprints 6–13 — Piloto funcional

- [Resumo de implementação, limitações e testes pendentes](docs/SPRINTS_6_13_STATUS.md).
- **6 · Estúdio Visual:** [controlador de aula](src/features/authoring/studio-controller.js), [edição de blocos](src/features/authoring/lesson-editor.js) e [campos visuais](src/features/authoring/block-fields.js). Criar aula, organizar blocos, salvar e exportar.
- **7 · Modelos pedagógicos:** [seis templates editáveis](src/features/authoring/lesson-templates.js), selecionáveis ao criar uma aula.
- **8 · Interatividades:** escolhas e devolutivas contextualizadas nos [laboratórios](src/lesson-engine/block-renderers.js), exemplificados na [aula sobre o retorno do recalcado](content/courses/fundamentos/aulas/retorno.json).
- **9 · Avaliações:** múltipla escolha com correção formativa imediata. Ainda não há prova certificadora nem notas centrais.
- **10 · Progresso, notas e perfis simulados:** [IndexedDB local](src/repositories/learning-repository.js), [caderno e acompanhamento](src/features/learning/learning-ui.js). Dois perfis fictícios, sem senha.
- **11 · Revisão e backup:** [exportação/importação JSON](src/features/administration/backup.js) dos rascunhos locais e histórico; **não inclui mídia nem conteúdo público sem rascunho**.
- **12 · Qualidade:** [diagnóstico funcional](tests/smoke.html) e [checagens de navegador](tests/quality.html), com melhorias de foco, toque e movimento reduzido. Auditoria completa pendente.
- **13 · Beta com convidados:** [roteiro interativo](src/features/administration/beta-ui.js), checklist e download voluntário de feedback. **A etapa de aplicação dos testes com pessoas reais não aconteceu aqui.**

**Rotas para experimentar:** [Estúdio do professor](https://pscfredteixeira.github.io/Atelie/#/professor), [laboratório na aula](https://pscfredteixeira.github.io/Atelie/#/cursos/curso-fundamentos/aulas/aula-retorno), [caderno](https://pscfredteixeira.github.io/Atelie/#/aluno/caderno), [progresso](https://pscfredteixeira.github.io/Atelie/#/aluno/progresso), [administrador e backup](https://pscfredteixeira.github.io/Atelie/#/admin) e [roteiro beta](https://pscfredteixeira.github.io/Atelie/#/admin/beta).

## Sprint 5 — Estúdio de Criação: cursos e módulos

- [Resultado, roteiro de teste e limitações do Sprint 5](docs/SPRINT_5_RESULTADO.md).
- [Formulários de criação, informações do curso, módulos e reordenação](src/app/views.js).
- [Operações de edição preservando IDs](src/features/authoring/course-editor.js).
- [Persistência IndexedDB exclusivamente local](src/repositories/course-draft-repository.js).
- Testes técnicos na [página de diagnóstico](tests/smoke.html).

Abra `https://pscfredteixeira.github.io/Atelie/#/professor` para **criar um curso local**, adicionar e organizar módulos e exportar o manifesto para uma futura publicação manual. A área do aluno continua acessando **apenas JSON publicado no GitHub**, não os seus rascunhos. A criação visual das aulas ocorrerá no Sprint 6.

## Sprint 4 — Jornada de aprendizagem

- [Relatório de implementação e testes do Sprint 4](docs/SPRINT_4_RESULTADO.md).
- [Motor de sequência, aula anterior e próxima](src/features/learning/journey.js), independente dos IDs fixos de aulas.
- Curso [Fundamentos da Psicanálise](content/courses/fundamentos/curso.json) com três aulas em sequência: [Conflito psíquico](content/courses/fundamentos/aulas/conflito.json), [Recalque](content/courses/fundamentos/aulas/recalque.json) e [Retorno do recalcado](content/courses/fundamentos/aulas/retorno.json).
- Navegação do aluno: `https://pscfredteixeira.github.io/Atelie/#/cursos/curso-fundamentos`.
- [Diagnóstico no navegador](tests/smoke.html) atualizado para testar o novo percurso.

**Importante:** navegar não significa concluir uma aula. Progresso real e histórico individual continuam previstos para o Sprint 10.

## Sprint 3 — Motor pedagógico de blocos

- [Relatório, componentes e testes do Sprint 3](docs/SPRINT_3_RESULTADO.md).
- [Registro versionado de blocos](src/lesson-engine/block-registry.js), [renderizadores](src/lesson-engine/block-renderers.js) e [motor compartilhado](src/lesson-engine/engine.js).
- A [aula sobre o recalque](content/courses/fundamentos/aulas/recalque.json) agora usa nove blocos de tipos diferentes.
- Biblioteca de tipos: `https://pscfredteixeira.github.io/Atelie/#/admin/blocos`.
- [Diagnóstico em navegador](tests/smoke.html) ampliado com testes do motor e tratamento de erros.

O quiz ainda não corrige respostas e os laboratórios interativos são demonstrativos. Esses recursos serão desenvolvidos em sprints posteriores.

## Sprint 2 — Conteúdo JSON e rascunhos locais

- [Relatório, instruções e testes pendentes do Sprint 2](docs/SPRINT_2_RESULTADO.md).
- [Catálogo público](content/catalogo.json), [manifesto do curso](content/courses/fundamentos/curso.json) e [aula de exemplo](content/courses/fundamentos/aulas/recalque.json).
- [Leitura dos arquivos JSON](src/repositories/content-repository.js), [validação](src/repositories/validators.js), [salvamento local](src/repositories/draft-repository.js) e [renderização dos blocos](src/lesson-engine/basic-renderer.js).
- [Diagnóstico executável no navegador](tests/smoke.html): `https://pscfredteixeira.github.io/Atelie/tests/smoke.html`.

A **Sala de Aula** consome JSON publicado. O **Professor** pode editar tecnicamente o JSON, salvá-lo **somente neste navegador**, importar, exportar e visualizar sua prévia. Isso não publica conteúdos no GitHub. O editor visual segue planejado para o Sprint 6.

## Sprint 1 — Implementação

- [Relatório das telas, componentes, testes e pendências](docs/SPRINT_1_RESULTADO.md).
- [Design System e interface responsiva](src/styles/atelier.css) e [tokens de identidade](src/styles/tokens.css).
- [Navegação modular](src/app/main.js), [telas](src/app/views.js), [componentes](src/ui/components.js).
- O arquivo `src/app/data.js` contém dados históricos de demonstração do Sprint 1; as telas atuais usam os pacotes JSON de `content/`.

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
| 2 | JSON publicado, leitura, validação e rascunhos locais — **implementado; testes de navegador pendentes** |
| 3 | Motor de 14 blocos reutilizáveis — **implementado; QA em navegador pendente** |
| 4 | Jornada de estudo e navegação em três aulas — **implementado; QA visual pendente** |
| 5 | Estúdio de cursos e módulos — **implementado; QA em navegador pendente** |
| 6 | Editor visual de aulas — **código implementado; QA em navegador pendente** |
| 7 | Modelos pedagógicos — **código implementado; QA em navegador pendente** |
| 8 | Biblioteca de interatividades — **código implementado; QA em navegador pendente** |
| 9 | Avaliações — **código implementado; QA em navegador pendente** |
| 10 | Progresso, notas e perfis simulados — **código implementado; QA em navegador pendente** |
| 11 | Revisão, versões e exportação — **backup JSON local e validação de versões; publicação ainda manual** |
| 12 | Testes, acessibilidade e desempenho — **diagnóstico e melhorias de código; QA real pendente** |
| 13 | Beta e testes com convidados — **roteiro do beta disponível; aplicação com convidados pendente** |

## Sprint 14 — Estabilização do Atelier

[Relatório de correções, verificações e roteiro de homologação](docs/SPRINT_14_RESULTADO.md).

- O Estúdio e a gestão de cursos dão prioridade aos rascunhos locais, mesmo sem rede.
- Salvar uma aula relê a versão mais recente do manifesto e não elimina módulos reorganizados depois que o editor abriu.
- Gravações de nota, conclusão e quiz são sequenciais por perfil/curso/aula para evitar perda de alterações.
- Requisições de JSON têm limite de 10 s e o menu usa uma alternativa temporária após 3,5 s, em vez de manter a tela bloqueada.
- Não é possível disponibilizar um curso local sem aulas.
- Menu no celular sem sobreposição duplicada, com tecla Escape e melhorias de toque e rolagem.
- Diagnóstico de navegador ampliado com testes de simultaneidade e de curso vazio.

**Estado:** implementado e verificado parcialmente em testes isolados; a homologação no GitHub Pages, nos celulares e no IndexedDB real continua pendente.

## Antes de liberar o piloto aos convidados

**Prioridade imediata:** abrir o site publicado, executar `tests/smoke.html` e `tests/quality.html`, criar e salvar um curso e uma aula, conferir atividades e histórico, validar exportação/restauração e revisar o uso em celular. Corrigir qualquer erro encontrado antes de apresentar o sistema a alunos convidados.

**Limites:** GitHub Pages publica conteúdo sem autenticação. Os perfis A/B são simulações, não login; qualquer pessoa neste navegador pode alternar entre eles. Não inserir informações pessoais, casos clínicos reais ou conteúdo pago restrito. Nenhum projeto Supabase foi utilizado e o repositório antigo `sistema` permanece intocado.
