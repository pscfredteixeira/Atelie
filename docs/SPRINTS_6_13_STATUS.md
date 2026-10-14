# Atelier — Sprints 6 a 13

Implementações: editor visual de aulas e blocos (6); modelos pedagógicos (7); laboratórios reflexivos com escolhas (8); quiz com feedback formativo (9); notas, conclusão e perfis locais simulados (10); backup JSON local com importação e exportação (11); página de diagnóstico e verificação técnica (12); roteiro de beta com checklist e exportação voluntária de feedback (13).

**Estado:** Código integrado no repositório para testes. Não homologado em navegador real. Acessibilidade completa, desempenho em dispositivos reais e testes com convidados seguem pendentes. O histórico real dos alunos e seus logins ainda não têm backend; nunca use dados confidenciais. Não há Supabase. O antigo `sistema` não foi alterado.

## Rotas de demonstração

- Professor: `#/professor`.
- Editor visual: `#/professor/cursos/curso-fundamentos/aulas/aula-recalque/editar`.
- Aula com laboratório: `#/cursos/curso-fundamentos/aulas/aula-retorno`.
- Progresso: `#/aluno/progresso`.
- Caderno: `#/aluno/caderno`.
- Backup e administração: `#/admin`.
- Roteiro do beta: `#/admin/beta`.
- Diagnóstico funcional: `tests/smoke.html`.
- Diagnóstico de experiência e navegador: `tests/quality.html`.

## Pendências prioritárias

1. Abrir o site publicado e verificar se todas as rotas estão acessíveis.
2. Executar os diagnósticos no Chrome/Safari e conferir eventuais falhas.
3. Criar curso e aula local, salvar e recarregar; testar exportação/importação em aparelho real.
4. Testar quiz e laboratório com mouse, toque, teclado e leitor de tela.
5. Validar o backup de rascunhos e progresso antes de limpar cache.
6. Convidar alunos e professores para o beta e registrar feedback. O checklist disponível não representa que esses testes já ocorreram.

GitHub Pages é público e não equivale a autenticação nem a hospedagem comercial definitiva.
