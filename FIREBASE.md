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

## Estrutura de dados

A plataforma grava somente estudos pessoais em `users/{uid}/state/atelier`:
- `saved` — slugs dos cursos fictícios favoritos
- `completed` — IDs das três aulas demonstrativas concluídas
- `notes` — anotações da pessoa por aula ilustrativa
- `answers` — respostas dos três quizzes
- `updatedAt` — horário numérico local utilizado para conciliação

A autenticação do Firebase valida a identidade de quem usa o serviço. As regras do Firestore restringem leitura e escrita ao proprietário do `uid`. Elas não concedem edição administrativa de cursos.

## Offline e conflitos

- Sem login, dados ficam apenas na chave anônima `ateliepsi-beta-state-v1` do navegador.
- Com login, dados ficam em chave local separada por `uid`, além de serem sincronizados quando o Firestore está disponível.
- Nenhum dado anônimo é associado automaticamente à conta para evitar cruzamento entre pessoas no mesmo dispositivo.
- Se a gravação falhar, a alteração fica pendente no navegador e a plataforma tenta novamente ao recuperar conexão ou reabrir a aba.
- Se houver versões divergentes e a nuvem tiver `updatedAt` maior, a pessoa escolhe se prefere a cópia da nuvem ou a do dispositivo, evitando sobrescrita silenciosa.
- Em uso simultâneo em dois dispositivos, o modelo ainda não oferece merge de cada campo. Não use como armazenamento crítico até validar conflitos de edição reais.
- Os rascunhos do Estúdio são **locais**, não são publicados nem enviados para o Firestore.

**Limitações do Sprint 19:** Console e regras requerem configuração e publicação manual pela conta do responsável. O CI testa navegação e simula sincronização; não comprova a conexão real com o projeto Firebase. Login por redirecionamento pode exigir configuração extra em navegadores com restrições de armazenamento entre domínios, como versões recentes do Safari. Prefira testar o popup primeiro.
