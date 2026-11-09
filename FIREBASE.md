# Ateliê — conexão do Firebase (Sprint 19)

**Projeto:** `ateliepsi` · **Hospedagem web:** GitHub Pages · **Banco:** Cloud Firestore.

O código do Sprint 19 usa configuração pública Firebase Web SDK no arquivo `firebase.js`. **Nunca adicione JSON de conta de serviço, senhas, tokens ou chaves privadas ao repositório.** Este arquivo não concede acesso administrativo ao Firebase.

## Ativação no Firebase Console (obrigatória)

1. Abra https://console.firebase.google.com/project/ateliepsi/overview e confirme que o projeto existe.
2. Em **Authentication → Sign-in method**, ative **Google**, escolhendo o e-mail de suporte do projeto.
3. Em **Authentication → Settings → Authorized domains**, adicione `pscfredteixeira.github.io` caso não esteja cadastrado.
4. Em **Firestore Database**, crie um banco no plano gratuito se ainda não existir; comece com regras restritivas.
5. Em **Firestore → Regras**, revise e publique exatamente o arquivo `firestore.rules`. O commit no GitHub não publica as regras no Firebase.
6. Entre em https://pscfredteixeira.github.io/Atelie/ e teste login, anotação e sincronização em dois navegadores/dispositivos usando a **mesma conta**.

## Diagnóstico do login Google — 03/11/2026

Uma consulta à configuração pública do Identity Toolkit para o Web SDK existente retornou **HTTP 400 · `CONFIGURATION_NOT_FOUND`**. Isso é compatível com Firebase Authentication ainda não inicializado, mas também exige confirmar se o projeto e a Web API Key correspondem à mesma instância. O código do site não pode habilitar o serviço sem autenticação administrativa.

Conferir no Firebase Console: Authentication → Get started → Sign-in method → Google → habilitar; Authentication → Settings → Authorized domains → `pscfredteixeira.github.io`. O código agora usa somente `signInWithPopup`, pois redirecionamentos usando `authDomain` em `firebaseapp.com` numa aplicação hospedada em GitHub Pages podem falhar no Safari devido a armazenamento de terceiros. No iPhone, teste no Safari real, não em navegador embutido.

Depois de ativar a autenticação, repita o diagnóstico no pipeline e faça um teste de login Google com conta real. Os testes CI de interface são simulados e não provam o serviço remoto.

## Estrutura de dados atual — conta Google como fonte de verdade

O Firebase Authentication identifica cada aluno pelo `uid`. O navegador não é mais usado para guardar os novos registros permanentes de estudo.

- `users/{uid}/state/atelier`: cursos salvos, aulas concluídas e anotações (`saved`, `completed`, `notes`, `answers`, `updatedAt`).
- `users/{uid}/lessonProgress/escuta-que-mudou-a-clinica`: seis momentos, vídeo assistido, consultório 1880, documentos, perguntas, linha do tempo, conceitos e reflexão.
- `users/{uid}/lessonProgress/primeira-topica-freud`: vídeo, respostas, 14 marcos, atividades de palavras, sistemas visitados e áudio.
- `users/{uid}/profile/main`: nome de preferência e telefone opcional.

As telas de aula, caderno, salvos e progresso exigem conta Google. O catálogo público continua acessível sem login. O sistema consulta os documentos do Firestore quando o aluno abre a aula; **não restaura os dados de aulas a partir do armazenamento local**.

A conclusão geral e a insígnia são atualizadas somente depois de a gravação do estado completo da aula ter sido confirmada pelo Firestore. O status de salvamento é exibido. Em caso de falha, há erro visível; a alteração pode ficar temporariamente na memória da aba, mas **não é considerada salva**.

## Conexão e disponibilidade

- Sem conexão Google, nenhuma etapa pessoal é aberta.
- Se a leitura do Firestore falhar, a aula não deve começar com um progresso zerado, evitando sobrescrever acidentalmente o histórico.
- Em caso de falha de escrita, o site informa que não houve confirmação. Não fechar o navegador com salvamento pendente; uma sessão offline não garante preservação.
- No uso simultâneo em vários dispositivos, as gravações completas de uma aula seguem ordem de envio **por aba**. Ainda não há reconciliação de edições simultâneas entre dispositivos: a última escrita aceita pode prevalecer. A concorrência precisa de teste real antes do lançamento.
- O Estúdio de demonstração não é um editor administrativo seguro e não publica nada no banco.

## Transferir progresso antigo

A versão anterior guardava etapas em `localStorage`. Esses registros **não são importados automaticamente**, porque o mesmo dispositivo pode ser usado por pessoas diferentes.

No **Meu perfil**, a opção **Importar minhas etapas antigas** aparece quando o navegador contém um dos registros antigos. O aluno precisa confirmar que o histórico é seu; a importação só grava cada aula quando ainda não houver documento remoto correspondente. Após a confirmação do Firestore, o registro antigo da aula é retirado do armazenamento local. Registros não importados permanecem intactos.

A importação é pontual; todo progresso novo é salvo exclusivamente na conta.

**Atenção:** a publicação do código em GitHub Pages não publica regras do Firebase. Sem as permissões novas do Firestore, as aulas mostrarão erro ao carregar/salvar. Nunca abrir permissões globais para contornar isso.

## Meu perfil — primeira etapa do cadastro pessoal (09/11/2026)

A área **Meu perfil** está disponível em `#/perfil`, no menu de estudantes e no atalho no alto do site. Ela não exige que a pessoa tenha concluído uma aula.

- **Firebase Authentication:** autentica via conta Google. Nome, foto e e-mail são exibidos como dados somente leitura, provenientes da autenticação.
- **Cloud Firestore:** salva somente `preferredName` (nome de preferência, até 80 caracteres), `phone` (opcional, até 30 caracteres) e `updatedAt` (inteiro) no documento `users/{uid}/profile/main`.
- O documento de perfil é independente de `users/{uid}/state/atelier`, que guarda o progresso dos estudos.
- Nenhum campo de saúde, notas clínicas, prontuário ou informações de sessões deve ser inserido nesse cadastro. Uma área de pacientes clínicos exigiria uma avaliação específica de privacidade/LGPD e controles adicionais.
- As regras `firestore.rules` limitam a leitura e a escrita do perfil ao UID do usuário autenticado. Consultar ou editar o perfil de outra conta deve resultar em `permission-denied`.
- Nome, foto e e-mail do Google não são modificados pelo formulário do Ateliê. E-mail de autenticação deve ser gerenciado pela conta Google.

### Publicação das regras — etapa indispensável

**Editar `firestore.rules` no GitHub NÃO publica regras no Firestore.** Antes de testar a gravação real, quem administra o projeto precisa:

1. Abrir https://console.firebase.google.com/project/ateliepsi/firestore/rules
2. Garantir que o banco Firestore Database foi criado no projeto `ateliepsi`.
3. Conferir o arquivo atual [firestore.rules](firestore.rules) **por inteiro**, copiar o conteúdo atualizado para a aba **Regras** e clicar em **Publicar**.
4. Testar com uma conta Google: entrar no Ateliê, abrir `#/perfil`, editar os dois campos e observar a mensagem **Alterações salvas no banco de dados**.
5. Atualizar o navegador: os valores devem permanecer. Repetir em outro navegador usando a mesma conta.
6. Entrar com uma segunda conta para confirmar que ela não enxerga o perfil nem o progresso da primeira.

As novas regras também atualizam os identificadores de conclusão e notas para as aulas `escuta-que-mudou-a-clinica` e `primeira-topica-freud`. Sem a atualização publicada, a sincronização desses estudos pode retornar `permission-denied`.

**Diagnóstico:** se aparecer “O Firestore recusou a consulta” ou “não autorizou a gravação”, primeiro verifique a publicação das regras e o UID da conta. Não altere as regras para `allow read, write: if true` para contornar o erro.

 
## Progresso e insígnias por conta — revisão 09/11/2026

As duas insígnias da Formação Freudiana pertencem ao aluno autenticado. O Ateliê reconstrói o progresso geral a partir de `state/atelier` e verifica o estado de cada aula na coleção `lessonProgress`.

O código fonte e os testes de contrato estão no GitHub; **a ativação remota depende da publicação de `firestore.rules` no Firebase Console pelo administrador**.

### Etapa obrigatória no Console

1. Abrir https://console.firebase.google.com/project/ateliepsi/firestore/rules
2. Copiar **o arquivo inteiro** `firestore.rules` atualizado no GitHub. Preservar as regras privadas existentes de `users/{uid}/profile` e `users/{uid}/state`.
3. Clicar em **Publicar** no Firebase Console e confirmar que a publicação teve sucesso.
4. Entrar no Ateliê com uma conta Google e abrir a aula “A escuta que mudou a clínica”.
5. Completar uma interação, verificar a mensagem de progresso salvo, abrir o mesmo usuário em outro navegador e conferir se a etapa foi restaurada.
6. Repetir com a Primeira Tópica e depois entrar com outro Google para verificar que a segunda conta não recebe o histórico.

As regras permitem somente que um usuário leia e edite seus próprios documentos, sem listagem de registros de outras contas. As respostas e progresso educacional não equivalem a um certificado.

### Testes automatizados

`scripts/ci-cloud-account-progress.mjs` verifica acesso com login, separação de duas contas, restauração de progresso por UID, recuperação da Primeira Tópica e ausência de novas gravações em `localStorage`. Usa Firestore **simulado**; teste real do projeto depende da publicação das regras e do login na conta autorizada.
