# Criação de cursos diretamente no Atelier

**Atualizado em 14 de outubro de 2026.**

## Experiência implementada

O novo Atelier reproduz a experiência de criação do Atelier antigo: **o professor pode criar cursos, módulos e aulas pela própria plataforma, sem escrever código ou abrir arquivos JSON**. Os arquivos JSON continuam sendo usados internamente como formato de dados e para backups.

1. No menu **Professor**, acessar **Criar curso**.
2. Informar **símbolo (opcional)** e **título**. O curso é criado como rascunho no navegador.
3. Abrir o curso, preencher apresentação, objetivos e outros dados.
4. Criar módulos e reorganizá-los com botões ↑/↓.
5. Em cada módulo, criar aulas em branco ou a partir de um dos seis modelos pedagógicos.
6. No **Estúdio Visual**, escrever teoria e configurar blocos, imagens, conceitos, quizzes e atividades. Clicar **Aplicar** nos campos e depois **Salvar no dispositivo**.
7. Na página de gestão do curso ou dentro do editor visual, clicar **Disponibilizar na área do aluno** / **Disponibilizar curso**.
8. Abrir a área **Aluno → Cursos**: o curso recém-criado aparece no catálogo **deste mesmo navegador** e suas aulas podem ser lidas sem editar JSON.
9. Editar novamente um módulo ou aula, salvar e clicar **Atualizar curso na área do aluno** para atualizar a versão que aparece aos estudantes do dispositivo.
10. Se desejar, clicar **Retirar da área do aluno**; o rascunho e as anotações continuam preservados.

O aplicativo **não** aceita um curso com aulas faltantes: toda aula referenciada pelo manifesto deve existir como rascunho salvo ou como aula pública original. Caso contrário, o sistema informa qual aula precisa ser salva antes de disponibilizar o curso.

## Arquitetura

- `src/repositories/course-draft-repository.js`: rascunho de manifesto no IndexedDB.
- `src/repositories/draft-repository.js`: rascunho de aulas no IndexedDB.
- `src/features/authoring/course-editor.js`: criação e edição das informações e módulos.
- `src/features/authoring/lesson-editor.js`: criação de aulas e blocos.
- `src/features/authoring/studio-controller.js`: editor visual e botão **Disponibilizar curso**.
- `src/features/authoring/local-publication.js`: valida, reúne todas as aulas e prepara uma versão de leitura.
- `src/repositories/local-catalog-repository.js`: grava curso + aulas **juntos**, em um snapshot validado do IndexedDB `atelier-local-catalog-v1`.
- `src/repositories/learner-content-repository.js`: reúne cursos públicos do GitHub e cursos disponibilizados no navegador; se IDs coincidirem, o catálogo local prevalece só naquele aparelho.
- `src/app/views.js`: exibe cursos locais e públicos, e permite organizar, disponibilizar, visualizar como aluno e retirar.
- `src/features/administration/backup.js`: o backup JSON inclui também as cópias disponibilizadas no dispositivo; a importação restaura esse catálogo.

## Diferença entre disponibilizar e publicar na internet

**Disponibilizar na área do aluno:** funciona inteiramente no navegador usado para criar o curso, como no Atelier antigo. Não precisa de backend, banco de dados pago, token do GitHub ou login.

**Publicar na internet para outros estudantes:** **não é a mesma operação**. O GitHub Pages não permite que um visitante altere arquivos publicados de forma segura apenas com JavaScript. Nesta fase, enviar uma versão oficial para outros aparelhos exige atualização manual no repositório ou uma futura camada de publicação/autenticação segura.

Portanto, o curso local **não aparece automaticamente em outros computadores ou celulares**. Os perfis demonstrativos não são autenticação, não devem receber informações pessoais, e qualquer pessoa com acesso ao mesmo navegador pode visualizar os cursos ali disponibilizados.

O botão **Baixar backup** inclui rascunhos de curso/aula, o catálogo local disponibilizado e histórico de estudo. Ele não inclui as mídias binárias nem garante backup de conteúdos públicos do GitHub que não foram copiados para o dispositivo.

## Testes

Teste funcional para executar no navegador: `https://pscfredteixeira.github.io/Atelie/tests/smoke.html`. Foram adicionadas verificações que:

- Criam curso, módulo e aula fictícios.
- Salvam no IndexedDB, disponibilizam no catálogo local e leem de volta pela mesma camada usada pelo aluno.
- Confirmam que o curso aparece na listagem do aluno.
- Confirmam que um backup inclui a publicação local.
- Confirmam que não se pode publicar um manifesto com aulas ausentes.
- Apagam ao final os registros temporários de teste, sem tocar nos cursos existentes.

**Pendente:** executar os testes em um navegador conectado ao GitHub Pages, verificar visualmente em iPhone/Android/desktop, e conferir salvar → recarregar → estudar → backup/restaurar de ponta a ponta.

## Repositórios

Alterado apenas **`pscfredteixeira/Atelie`**. O projeto antigo **`pscfredteixeira/sistema`** não foi modificado. Nenhum projeto Supabase foi utilizado.
