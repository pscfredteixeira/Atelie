# Ateliê — Sprint JSON 5: revisão e preparo de publicação
**16/11/2026 · Entrega em branch isolada · Publicação automática desativada**

## Objetivo
Preparar um caminho controlado **rascunho → validação → revisão humana → pacote para pull request**, sem expor credenciais de GitHub, dar acesso de escrita anônimo ou mexer nas aulas já publicadas.

Esta entrega é um **laboratório técnico**. O site público atual ainda usa `app.js` e páginas HTML de aulas. O processo implementado nesta sprint não converte as quatro aulas históricas, não insere novas aulas no catálogo principal e **não torna uma aula visível aos alunos automaticamente**.

## Como usar o fluxo de revisão

Depois de integrar e testar as branches dependentes em um ambiente de desenvolvimento:

1. Abra `#/estudio` → **Editor visual JSON** (`#/laboratorio/editor`).
2. Crie um rascunho ou edite uma cópia de uma aula do laboratório e confira seus blocos.
3. Abra a aba **Revisão** e clique em **Analisar arquivos**.
4. O sistema busca o manifesto e, se aplicável, a aula publicada **na sua revisão atual**, compara IDs e números de revisão e prepara os arquivos candidatos.
5. Leia os alertas e confirme manualmente os quatro itens editoriais: precisão acadêmica/bibliografia, privacidade e ética, acessibilidade, e testes de atividades/celular.
6. Clique em **Baixar ZIP para revisão**. Esse download **não faz commit** nem altera o servidor.
7. Abra os arquivos no ZIP e revise seus diffs em uma branch. Execute os testes, confira a exibição em navegadores reais e submeta pull request. Integre apenas após aprovação.

A conferência manual não é substituída por verificações automáticas. Os quatro controles do editor registram apenas confirmações na sessão local, sem assinatura nem prova de que a revisão ocorreu.

## Conteúdo do ZIP

| Arquivo | Finalidade |
|---|---|
| `content/piloto-json-sprint-02/.../aulas/<slug>.json` | Aula candidata com `status: "published"` |
| `content/piloto-json-sprint-02/.../curso.json` | Manifesto candidato com metadados da aula e `revision` incrementada |
| `RELATORIO_REVISAO.json` | Escopo, operação, caminhos, revisões, verificações e alertas |
| `INSTRUCOES_PUBLICACAO.md` | Passos manuais de revisão, testes e integração |

O pacote é um ZIP com conteúdo UTF-8, gerado localmente e **sem dependências**. O ZIP utiliza entradas sem compressão. Não inclui imagens, vídeos, áudio nem dados de pacientes.

## Novas aulas e alterações de aulas existentes

**Aula nova:** a estrutura usa `draft.id`, `courseId` e `moduleId` existentes e cria um único registro em `modules[].lessons[]`, no final do módulo, com caminho `./aulas/<slug>.json`. Rejeita conflito de ID ou nome de arquivo. A aula mantém `revision: 1` e recebe `status: "published"` somente no pacote candidato.

**Aula existente:** preserva o caminho e a posição no manifesto, atualiza título/resumo/duração e exige que a revisão do rascunho seja **exatamente a revisão publicada + 1**. Se a versão publicada mudou desde a edição, a preparação é bloqueada e precisa ser reconciliada.

Nos dois casos, o manifesto recebe `revision = revision original + 1`. Nunca se altera o objeto-fonte em memória por meio do planejador.

## Verificações automáticas

O módulo `src/features/authoring/publication-plan.js` reaproveita os validadores existentes e adiciona:

- Suporte apenas a **JSON v1 com blocos** e ao catálogo de laboratório `content/piloto-json-sprint-02`.
- Correspondência entre IDs, módulo, manifesto e arquivo de aula.
- Rejeição de revisões de atualização desatualizadas e duplicações de caminhos/IDs.
- Rejeição de tipos de bloco ou versões ainda não suportadas pelo motor.
- Rejeição de `metadata.interactivePage` (aulas HTML especiais não entram neste fluxo).
- Verificação de formato seguro para mídia e legendas relativas, sem `../`, `?token` ou URLs externas.
- Alertas de revisão quando existir mídia, vinheta fictícia, bibliografia vazia ou resumo em branco.
- Revalidação do JSON de aula e do manifesto **candidatos**.

O planejador não pode atestar a veracidade do conteúdo acadêmico, a licença de uma imagem, a existência real dos arquivos de mídia, nem a compatibilidade visual no navegador. Esses pontos ficam para análise humana.

## Arquivos alterados/criados

- `src/features/authoring/publication-plan.js`: regras puras de preparação e validação.
- `src/features/authoring/review-zip.js`: geração local de ZIP, com validação de nomes, CRC32 e limites de tamanho.
- `json-studio.js`: aba **Revisão**, alertas, checklist e download supervisionado.
- `json-studio.css`: interface responsiva e acessível para a revisão.
- `scripts/verify-json-publication.mjs`: testes automatizáveis para criação, atualização, colisões, versões e ZIP.
- `.github/workflows/json-sprints-validation.yml`: automação de testes em PR, **sem deploy, sem commit e sem escrita de segredos**.

Nenhum arquivo de aula HTML da Formação Freudiana, catálogo público, configuração do Firebase ou registro de progresso foi alterado.

## Testes e homologação

Verificações já realizadas nesta execução:

- [x] Execução isolada dos **validadores reais** para uma aula nova e a atualização de uma aula existente.
- [x] Simulação das transformações de manifesto e revisão, verificando preservação de arquivos-fonte.
- [x] Rejeição de revisão desatualizada, slug conflitante, caminho fora do laboratório e tipo de componente sem suporte.
- [x] Verificação isolada do ZIP: cabeçalho, diretório central, CRC32 conhecido e rejeição de nomes perigosos/duplicados.
- [x] Sintaxe do módulo de edição com nova aba de revisão conferida em isolamento.

Verificações ainda necessárias antes de integrar:

- [ ] Execução dos três scripts Node em checkout completo (ou aprovação dos três passos da GitHub Action).
- [ ] Conferir uma proposta de pacote no navegador, com os quatro itens marcados e o ZIP aberto depois do download.
- [ ] Testar no Safari/iPhone e Chrome desktop, inclusive um caso de erro e tentativas de salvar com campos incompletos.
- [ ] Verificar as aulas HTML históricas e regressão das rotas atuais.
- [ ] Revisar conteúdo acadêmico, privacidade, acessibilidade, licença de mídias e diferenças propostas no GitHub.

Comandos na raiz de um checkout desta branch:

```bash
node --experimental-default-type=module scripts/verify-json-pilot.mjs
node --experimental-default-type=module scripts/verify-json-studio.mjs
node --experimental-default-type=module scripts/verify-json-publication.mjs
```

## Limites e decisão de publicação

As branches da Sprint JSON 1 a 4 ainda dependem de revisão e integração. Esta Sprint 5 parte da branch da Sprint JSON 4 e deve ser submetida como **PR em rascunho**, empilhada sobre ela.

É possível preparar e baixar os arquivos **do laboratório** pelo navegador, mas isso não é permissão de publicação no site. A publicação real no Ateliê exigirá decidir o papel do catálogo público, validar a compatibilidade com a navegação e garantir que o editor tenha um fluxo administrativo autorizado. Não aplicar o ZIP diretamente à `main` sem uma revisão de código/experiência.

## Próxima Sprint JSON 6

Criar um procedimento final de integração e publicação: revisão das PRs empilhadas, homologação navegador/móvel, documentação para publicação supervisionada no GitHub Pages e plano de reversão, antes de qualquer uso na Formação Freudiana.
