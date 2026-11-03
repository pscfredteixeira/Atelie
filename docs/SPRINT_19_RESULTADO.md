# Sprint 19 — Autenticação e sincronização (implementação preparada)

## Escopo

Sem importação de conteúdo das aulas do repositório histórico. O beta continua com três cursos e uma aula fictícia por curso.

## Implementado no código

- Firebase Authentication com provedor Google, saída de conta e caminho alternativo para popup bloqueado.
- Leitura do documento do Firestore na autenticação, gravação de favoritos, respostas, notas e conclusão.
- Separação de armazenamento local por conta autenticada, isolada do modo anônimo e de outras contas.
- Gravação local imediata e fila de alterações pendentes para quando a rede falhar.
- Retentativa ao restaurar conexão, voltar à aba ou o Firestore ficar disponível.
- Detecção e resolução explícita de versão divergente mais recente na nuvem.
- Regras do Firestore para impedir acesso entre contas e limitar os tipos de dados.
- Testes automatizados de regressão do Sprint 18 e testes simulados do Sprint 19.

## Pendente para homologação

- Ativar Google Authentication e autorizar `pscfredteixeira.github.io` no console Firebase.
- Criar Firestore e **publicar** as regras de `firestore.rules` no console.
- Testar com conta real em dois dispositivos; conferir Safari/iPhone e login após redirecionamento.
- Verificar quotas, gravação com internet instável e comportamento após limpar armazenamento.

As alterações no GitHub **não** configuram automaticamente recursos do Firebase remoto. Não declarar sincronização real concluída antes do teste com projeto habilitado.

## Segurança e compatibilidade

Dados de usuário não são misturados entre contas. Rascunhos de professores permanecem locais. O site antigo continua na branch `backup/pre-sprint18-2026-11-02`; estado anterior ao Sprint 19 está em `backup/pre-sprint19-2026-11-03`.
