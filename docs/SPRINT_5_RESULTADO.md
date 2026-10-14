# ATELIER — Sprint 5: Estúdio de cursos e módulos
**14 de outubro de 2026 · Implementação confirmada no GitHub · verificação visual e de IndexedDB em navegador real pendentes**

## Objetivo

Permitir que o professor **crie e organize cursos e módulos sem escrever JSON**, trabalhando sobre rascunhos salvos no próprio navegador. A versão pública utilizada pelo aluno continua em arquivos JSON estáticos do repositório.

Não existe cadastro real, servidor, Supabase nem controle de permissão. Qualquer visitante pode abrir a interface de professor; ela é uma demonstração, e suas alterações não modificam o conteúdo publicado no GitHub.

## Entregas implementadas

| Capacidade | Situação |
|---|---|
| Criar um curso com título e ID estável | Implementada |
| Editar título, subtítulo, apresentação e objetivos do curso | Implementada |
| Adicionar e editar módulos | Implementada |
| Mover módulos para cima/baixo por botões | Implementada |
| Remover módulos vazios com confirmação | Implementada |
| Reordenar aulas existentes dentro do seu módulo | Implementada |
| Proteger vínculos: bloquear remoção de módulo com aulas | Implementada |
| Abrir um curso publicado como **revisão local** | Implementada |
| Mostrar cursos publicados e rascunhos separadamente | Implementada |
| Salvar, recuperar, listar e descartar rascunhos de cursos no IndexedDB | Código implementado; teste real pendente |
| Exportar manifesto JSON do curso | Código implementado; teste de download pendente |
| Exportar entrada de catálogo JSON de curso novo | Código implementado; teste de download pendente |
| Alertar sobre alterações de formulários ainda não salvas | Implementado no código |
| Criar novas aulas visualmente | **Sprint 6** |
| Publicar diretamente no GitHub | **Não implementado; publicação manual** |
| Login real e gestão multiusuário | Fora da fase beta JSON |

## Arquivos principais

- `src/features/authoring/course-editor.js`: funções puras de criação, validação e alteração de curso/módulo. Reordenação preserva IDs.
- `src/repositories/course-draft-repository.js`: armazenamento local independente, usando IndexedDB `atelier-course-drafts-v1` com store `courses`.
- `src/app/views.js`: painel e formulários de autoria; carrega o curso público ou a revisão local conforme disponível.
- `src/app/main.js`: submissão de formulários, operações dos botões, gravação local e exportação.
- `src/styles/atelier.css`: layouts do Estúdio, formulário de curso, cartões de módulos e botões acessíveis de reordenação.
- `tests/smoke.js`: testes no navegador para a edição e a base IndexedDB, além dos testes anteriores.

A base `atelier-course-drafts-v1` é separada da base `atelier-local-v1` usada pelos rascunhos técnicos de aulas. **Essa separação evita upgrades acidentais que poderiam afetar os dados de aulas já salvos.**

## Experiência do professor

1. Abrir `#/professor`, o painel de cursos.
2. Digitar o nome no campo **Novo curso** e selecionar **Criar curso local**.
3. O curso passa a existir no IndexedDB **somente deste navegador**.
4. Abrir o curso para editar as informações e os objetivos.
5. Criar módulos, escrever seus nomes e descrições; ordenar com ↑ e ↓.
6. Se um módulo já possuir aulas, reordená-las dentro dele preservando seus IDs e caminhos.
7. Baixar **Manifesto JSON** e, no caso de um curso novo, a **Entrada do catálogo**.
8. Para uma publicação futura, revisar os arquivos, alterar os estados editoriais e colocá-los manualmente nos locais corretos do repositório.

### Publicação manual — diferenças importantes

O manifesto exportado está marcado como `"status": "draft"` e **não aparece para o aluno** sem publicação explícita. O caminho esperado para um curso novo é:

```text
content/
  catalogo.json                         # Acrescentar a entrada revisada e published
  courses/
    <slug-do-curso>/
      curso.json                        # Manifesto revisado e published
      aulas/
        ...                             # Futuras aulas em arquivos separados
```

A entrada exportada para o catálogo indica `"./courses/<slug-do-curso>/curso.json"` e começa como `draft`. O catálogo público deve conter o registro junto aos demais cursos, com status correto e caminho real, **após commit**. Nenhuma funcionalidade do Sprint 5 publica automaticamente.

**Os rascunhos de curso armazenam apenas o manifesto**. O conteúdo integral das aulas existentes continua nos seus JSON próprios. Assim, exportar um manifesto não faz backup completo das aulas ou mídias. A exportação de pacotes consolidados será ampliada no Sprint 11.

### Limites propositais

- Cursos novos podem conter módulos vazios. A criação de aulas visualmente está reservada ao Sprint 6.
- Não é possível mover uma aula para outro módulo neste sprint: isso exigiria atualizar também `moduleId` no JSON da aula. Reordenação funciona **dentro do módulo**.
- Não é possível remover um módulo com aulas, para evitar deixar o conteúdo órfão.
- Os formulários salvam quando você aciona o botão. Alterações digitadas não são autosalvas; há aviso ao navegar, exportar ou executar outra ação sem salvar.
- Não há edição simultânea, colaboração em tempo real, sincronização entre aparelhos ou recuperação remota.
- Se o navegador estiver sem IndexedDB, o salvamento local falhará com aviso.
- Não utilizar dados pessoais, material confidencial ou informações clínicas reais neste protótipo.

## Verificações executadas (sem navegador real)

- [x] Todos os módulos JavaScript alterados passaram na verificação de sintaxe.
- [x] Criação de curso gera ID estável, slug e JSON coerente com o validador.
- [x] Adicionar, editar, mover e remover módulos vazios preserva posições.
- [x] Reordenar aulas dentro de um módulo preserva os IDs.
- [x] Abrir um curso publicado para edição cria uma cópia `draft` e não modifica o objeto original.
- [x] Não é permitido excluir módulo que contém aulas.
- [x] A entrada de catálogo exportável aponta para o manifesto correto e permanece em estado `draft`.
- [x] As telas de painel, curso publicado e curso novo geraram HTML com formulários de autoria em testes isolados.
- [x] A camada de persistência de curso não faz chamadas de rede.
- [x] Diagnóstico de navegador ampliado para testes de autoria e IndexedDB.

## Pendências de verificação

- [ ] Confirmar que o deploy do GitHub Pages recebeu os commits recentes.
- [ ] Executar os testes de IndexedDB no Chrome, Safari e outros navegadores de teste.
- [ ] Criar curso, criar módulos e recarregar a página para confirmar a persistência.
- [ ] Confirmar a exportação/download e reimportação manual de JSON em dispositivo real.
- [ ] Revisar formulários e botões nas larguras de iPhone, Android e desktop.
- [ ] Conferir foco, avisos de alterações não salvas e leitor de tela.
- [ ] Avaliar o Estúdio com alguém que produzirá aulas de verdade.

**Roteiro manual de teste:** `https://pscfredteixeira.github.io/Atelie/#/professor` → Criar curso → Adicionar dois módulos → Trocar ordem → Recarregar → Conferir persistência → Exportar manifesto → Descartar um curso exclusivamente fictício.

**Diagnóstico automatizado no navegador:** `https://pscfredteixeira.github.io/Atelie/tests/smoke.html`, que grava e apaga um rascunho temporário de teste, sem tocar nos cursos do usuário.

## Próxima etapa

**Sprint 6 — Editor visual de aulas.** Criar, editar e reordenar blocos pedagógicos sem escrever JSON. O conteúdo publicado permanecerá protegido de alterações acidentais por meio da separação entre rascunho local e arquivo estático; exportação e publicação continuarão distintas.

O repositório legado `sistema` permanece intocado. Não há conexão com Supabase.
