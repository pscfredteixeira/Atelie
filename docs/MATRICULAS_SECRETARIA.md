# Matrículas independentes por curso — primeira implementação (09/11/2026)

## Escopo desta entrega

A página `#/matriculas` lê **somente** as matrículas da pessoa autenticada por Google no Firestore, sem copiar dados para o armazenamento do navegador. Nenhum registro é criado automaticamente quando alguém entra na plataforma. A ausência de matrícula é exibida como ausência de matrícula, não como erro de login.

Cada matrícula ocupa um documento `users/{uid}/enrollments/{courseId}` em que `courseId` é o slug estável do curso (por exemplo `formacao-freudiana`). A regra publicada no repositório permite leitura exclusivamente ao dono da conta; **toda escrita pelo cliente é proibida**. Criação, confirmação de pagamento, ativação, renovação, suspensão, cancelamento e recuperação de contas ainda precisam de um serviço administrativo confiável. Não executar essas alterações a partir de HTML/JS público.

Os campos na coleção do aluno são exclusivamente acadêmicos: `courseTitle`, `activatedOn`, `originalExpiresOn`, `expiresOn`, `renewalCount`, `state`, `lastRenewedOn` (opcional) e `updatedAt`. Os dados financeiros, CPF, responsáveis e logs administrativos não devem ser colocados nesse documento de leitura estudantil. O contrato está em [schemas/enrollment.schema.json](../schemas/enrollment.schema.json).

### Exemplo de documento (somente dados fictícios)

Caminho ilustrativo: `users/UID_FICTICIO/enrollments/formacao-freudiana`.

```json
{
  "courseTitle": "Formação Freudiana",
  "activatedOn": "2026-11-09",
  "originalExpiresOn": "2030-11-09",
  "expiresOn": "2030-11-09",
  "renewalCount": 0,
  "state": "active",
  "updatedAt": 1794182400000
}
```

O documento de exemplo **não foi criado no Firestore real**. O aplicativo somente consulta dados existentes; nenhuma matrícula foi concedida. Não utilizar credenciais, CPF ou dados de alunos em JSON público.

## Regras de negócio aprovadas

- **Matrícula inicial:** quatro anos contados da ativação individual do curso, não da data de criação da conta Google. Uma pessoa pode ter matrículas independentes em cursos distintos.
- **Prorrogação paga:** um ano adicional, somente após confirmação de pagamento e ativação administrativa. Antes do vencimento, soma-se um ano ao prazo vigente; após vencimento, o novo prazo conta da reativação.
- **Adiada:** indicação exibida quando `renewalCount > 0` e a matrícula está vigente. `Próxima do vencimento` é um alerta adicional, não um status persistido.
- **Suspensão:** decisão administrativa de congelar ou não o prazo em cada ocorrência. Ao reativar uma suspensão congelada, acrescentar os dias de congelamento ao vencimento e guardar o evento auditável no backend. `state: suspended` impede acesso quando a autorização real for implantada.
- **Vencida:** calculada no navegador quando a data de hoje é posterior a `expiresOn`, salvo estados de suspensão/cancelamento. A data `expiresOn` representa o **último dia com validade**, inclusive.
- **Cancelada:** estado persistido administrativamente, não apaga progresso. Matrícula vencida também não apaga progresso.
- **Conclusão:** 90% do conteúdo obrigatório efetivamente acompanhado, provas de múltipla escolha realizadas e envio do TCC. Este contrato **ainda não implementa** certificação ou medição antifraude desses requisitos.
- **Progresso:** permanece nos documentos atuais `state/atelier` e `lessonProgress`; matrícula não é calculada automaticamente a partir de insígnias.

## Separação de permissões

- **Aluno:** ler apenas suas matrículas, perfil e progresso; não alterar datas, prazos ou pagamentos.
- **Professor:** futuramente consultar dados acadêmicos apenas dos seus cursos e responder perguntas; não consultar CPF, valores, meios de pagamento nem operações financeiras.
- **Administrador:** futuramente criar/gerenciar matrículas, professor e pagamentos via backend autenticado e auditado. Nunca conceder permissões apenas alterando menu, e-mail ou valores de `localStorage`.
- **Dados financeiros:** devem ocupar documentos/coleções privados separados dos dados acadêmicos. A identidade acadêmica deverá ser permanente mesmo quando o Google UID for migrado por recuperação de conta verificada.

## Como testar esta etapa

1. Publicar o arquivo [firestore.rules](../firestore.rules) no **Firebase Console → Firestore Database → Regras → Publicar**; mudar o GitHub não publica as regras automaticamente.
2. Entrar no Ateliê com a conta Google e abrir **Minhas matrículas** no menu.
3. Se não houver documentos, a interface deve mostrar que não há matrícula cadastrada. Não é erro e não libera curso.
4. Para uma futura prova de leitura com registro de teste, criar manualmente um documento **fictício** na conta de testes pelo Firebase Console, seguindo os campos acima. Confirmar que somente aquela conta o consulta e que a interface não permite modificá-lo.
5. Confirmar que as páginas de aula e progresso continuam funcionando. Os cursos permanecem no modo demonstração e **a matrícula ainda não protege os arquivos públicos do GitHub Pages**.

## Limitações conhecidas

- Não há backend para criar ou alterar registros, nem painel administrativo real integrado a dados pessoais nesta fase.
- A página apenas consulta a coleção do UID autenticado. Regras, certificados e cobrança ainda não foram implantados em produção.
- Sem regras publicadas no Firebase a consulta poderá retornar `permission-denied`, com mensagem visível; não substituir a falha por dados vazios.
- O sistema de suspensão/congelamento e prorrogação está documentado, mas seu processamento exige backend confiável e histórico de eventos.
- A confirmação de progresso permanece no modelo atual de cada aula. Não alterar `users/{uid}/state/atelier` nem `lessonProgress` nesta entrega.
