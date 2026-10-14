# Atelier — Auditoria de qualidade do piloto JSON

**Data:** 14 de outubro de 2026  
**Escopo:** repositório `pscfredteixeira/Atelie` (branch `main`), desenvolvido para demonstração.  
**Veredicto:** **parcialmente validado**, não homologado para convidados ou uso real.

## Como foi conferido

1. Confirmação do repositório GitHub público `Atelie`, branch `main`.
2. Leitura dos arquivos efetivos de entrada, componentes, importações JavaScript, repositórios JSON, formulários e adaptadores locais.
3. Verificação da sintaxe de módulos alterados e dos JSONs.
4. Execução isolada de validadores com o catálogo e os JSONs publicados do curso demonstrativo, inclusive suas relações.
5. Execução isolada de criação de cursos/aulas e dos seis modelos pedagógicos, validando os documentos produzidos.
6. Pré-validação de backup de aprendizagem: exemplo válido aceito e exemplo com resposta `correct` inválida rejeitado.
7. Conferência da estrutura de importações dos principais módulos, sem sinal de dependência remota/Supabase.

**Não concluído:** a ferramenta de acesso à web não conseguiu abrir o endereço do GitHub Pages; o ambiente de execução também não acessa esse endereço. Assim, não foi possível realizar clique a clique real na interface publicada, rodar o JavaScript no navegador conectado ao Pages, conferir CSS/renderização visual ou confirmar os testes de IndexedDB, download e restauração end-to-end.

## Problemas identificados e corrigidos nesta auditoria

| Problema | Correção aplicada |
|---|---|
| Ao marcar uma aula como concluída, uma anotação recém-digitada poderia se perder | Bloquear a marcação até salvar a anotação |
| Botões Voltar/Avançar do navegador podiam abandonar formulários e Estúdio com mudanças não salvas sem confirmação | Proteger `hashchange` e restaurar a rota se a saída for cancelada |
| Links comuns podiam pedir confirmação de saída duas vezes | Reconhecer navegação já aprovada |
| Criar um curso podia deixar o formulário marcado como não salvo depois de salvá-lo, levando a aviso indevido | Limpar a marcação pendente após criação concluída |
| Importar backup inválido podia salvar cursos e aulas antes de descobrir corrupção no histórico | Validar todos os registros de aprendizagem antes de iniciar a restauração |
| Regra de validação de IDs de histórico precisava de ajuste | Aplicar padrão explícito `[A-Za-z0-9_-]` |
| Mensagens na interface afirmavam que não havia progresso e que quizzes/laboratórios ainda não funcionavam | Atualizar os textos conforme os recursos presentes |
| Faltava teste de rejeição de histórico inválido no diagnóstico | Acrescentar teste de regressão à página de smoke tests |
| Metadescrição da página ainda indicava Sprint 1 | Atualizar para protótipo beta |

Essas mudanças foram feitas apenas no **novo repositório `Atelie`**.

## Itens que estão implementados, mas não foram homologados nesta auditoria

- Navegar entre cursos, módulos e aulas no GitHub Pages.
- Criar e salvar cursos, módulos e aulas no IndexedDB e recuperar depois de fechar/reabrir o navegador.
- Editor visual: campos, reorganização, prévia, mídia e tratamento de erro real.
- Atividades: clique, feedback, marcação, registro de resposta e perfis de teste.
- Backup: baixar, reimportar, validar conflitos e recuperar em outro navegador.
- Responsividade real em telas pequenas, teclado, foco e leitor de tela.
- Publicação do Pages e eventual cache/desatualização.
- Validação pedagógica e bibliográfica por uma pessoa revisora.
- Testes com professores e alunos convidados.

### Links de verificação manual

- Aplicação: `https://pscfredteixeira.github.io/Atelie/`
- Estúdio: `https://pscfredteixeira.github.io/Atelie/#/professor`
- Aula publicada: `https://pscfredteixeira.github.io/Atelie/#/cursos/curso-fundamentos/aulas/aula-recalque`
- Laboratório de escolhas: `https://pscfredteixeira.github.io/Atelie/#/cursos/curso-fundamentos/aulas/aula-retorno`
- Testes funcionais no navegador: `https://pscfredteixeira.github.io/Atelie/tests/smoke.html`
- Diagnóstico da experiência: `https://pscfredteixeira.github.io/Atelie/tests/quality.html`
- Roteiro beta: `https://pscfredteixeira.github.io/Atelie/#/admin/beta`

## Critérios para considerar o beta homologado

- [ ] Todas as rotas principais abrem e não há erros JavaScript no console.
- [ ] `tests/smoke.html` passa no navegador real.
- [ ] Curso fictício criado → dois módulos → aula visual → salvar → recarregar: sem perda de conteúdo.
- [ ] Quiz e laboratório apresentam feedback adequado.
- [ ] Perfis de teste A/B mantêm históricos locais separados, inclusive após recarregar.
- [ ] Caderno protege alterações não salvas e permite marcar/desmarcar conclusão.
- [ ] Backup de rascunhos + histórico baixa e pode ser restaurado num segundo ambiente de teste. **Mídias e cursos publicados sem rascunho não fazem parte desse backup.**
- [ ] Testes de teclado e responsividade em desktop e celular.
- [ ] Material didático revisto antes de apresentação pública.
- [ ] Roteiro beta aplicado a convidados de verdade, com observação dos problemas.

**Limite de segurança:** o conteúdo no GitHub Pages é público. Os perfis fictícios **não são contas**; os dados em IndexedDB são locais, sem autenticação ou sincronização, e não devem incluir informações de pacientes ou dados pessoais. Nenhum Supabase ou servidor externo foi conectado. O repositório legado `sistema` não foi alterado.

## Conclusão

O código revisado passou nas verificações isoladas que foram possíveis executar e os defeitos identificados foram corrigidos. **Não há base para afirmar que “está tudo certo” em produção ou que o beta está homologado** sem os testes de navegador, persistência, acessibilidade e pessoas convidadas listados acima.
