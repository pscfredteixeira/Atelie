# ATELIER — Fechamento da arquitetura (Sprint 0.4)
**Versão 1.0 da especificação · 14/10/2026**

> Resultado: a **fundação documental do Sprint 0** está pronta para iniciar a implementação. Isso **não** significa que o produto, o editor ou a experiência mobile estejam homologados. A navegação e a usabilidade permanecem sujeitas a testes com pessoas nos sprints seguintes.

## 1. Escopo confirmado

O Atelier terá três ambientes na mesma aplicação: **Aluno (Aprender)**, **Professor (Criar)** e **Administrador (Organizar)**. O mesmo motor de blocos deve montar tanto a aula publicada quanto a prévia do professor.

O foco inicial é um **piloto público com dados fictícios**, sem infraestrutura comercial. O repositório antigo `sistema` permanecerá intacto.

### Entram na versão piloto (P0)

- Catálogo de cursos, módulos e aulas; navegação e leitura.
- Motor de blocos por tipo, sem código exclusivo para cada aula.
- Estúdio de Criação com rascunhos locais, prévia e reordenação acessível.
- Arquivos JSON versionados e fluxo manual de publicação pelo GitHub.
- Progresso e anotações locais + exportação e importação.
- Layout responsivo, boa leitura, navegação por teclado e feedback de erro.
- Testes com pessoas convidadas, **sem dados clínicos reais ou informações pessoais sensíveis**.

### Entram conforme o plano após a base (P1)

- Modelos de aula, mídias, biblioteca de experiências e laboratórios.
- Quizzes formativos e revisão de conceitos, com acessibilidade e feedback.
- Melhorias de autoria (duplicar, reorganizar, desfazer, validação).

### Fora desta fase (P2)

- Autenticação de verdade, autorização, cadastro real de alunos, matrículas e pagamento.
- Sincronização entre aparelhos e dados centralizados dos estudantes.
- Cursos pagos protegidos, relatórios globais e certificado verificável.
- Servidor próprio e banco externo (incluindo Supabase).

## 2. Decisões de arquitetura consolidadas

| ID | Decisão | Justificativa | Reavaliar quando |
|---|---|---|---|
| ADR-01 | Código e demonstração no GitHub Pages: `main` + `/(root)` | Facilita apresentação e testes temporários sem servidor próprio | Antes da comercialização |
| ADR-02 | Pacotes de conteúdo público em JSON estático | Facilita revisão, cópia, versionamento e migração | Necessidade de conteúdo protegido |
| ADR-03 | Rascunhos/progresso em **IndexedDB local** | Evita serviço pago e permite um protótipo real de edição | Precisarmos de sincronização |
| ADR-04 | Perfis fictícios **sem senha e sem acesso protegido** | Não simular segurança com credenciais expostas em JSON | Ao implementar autenticação real |
| ADR-05 | Componentes independentes do ID da aula | Permite montar conteúdos diversos pelo mesmo editor | Apenas se houver caso concreto de incompatibilidade |
| ADR-06 | Renderização única para aluno e prévia | Evita diferença entre a montagem e a aula publicada | Não previsto |
| ADR-07 | **Hash routes** (`#/...`) na fase de Pages | Funciona ao recarregar o endereço em hospedagem estática | Migração para servidor com fallback de rotas |
| ADR-08 | **JavaScript modular, HTML e CSS nativos** como base inicial | Zero etapa obrigatória de build no Pages; menos dependências | Se a complexidade real do editor justificar framework |
| ADR-09 | IDs imutáveis + `schemaVersion` e `revision` | Ordenação e revisão sem perder referências e progresso | Manter na migração |
| ADR-10 | Publicação **manual por commit** e separada de salvar/exportar | Não prometer escrita remota inexistente | Ao instalar um backend ou workflow de publicação |
| ADR-11 | Paleta **grafite, roxo/lavanda e laranja**, visual editorial | Evoluir linguagem atual preservando identidade do Atelier | Revisão visual do Sprint 1 |
| ADR-12 | Projeto **mobile-first** com controles de toque e teclado | Leitura e autoria devem funcionar em celular sem depender de mouse | Testes com usuários e dispositivos |

**Nota de implementação:** a documentação do Sprint 0.3 usa interfaces TypeScript *como pseudocontratos*, não obriga instalar TypeScript ou frameworks. O Sprint 1 começará por uma base de HTML/CSS/JavaScript em módulos ES, sem bundler obrigatório. Se depois adotarmos um framework, o contrato de dados permanece independente.

## 3. Estrutura do repositório aprovada (objetivo, ainda não criada integralmente)

```text
Atelie/
├── index.html                     # Página principal / SPA futura
├── README.md
├── ARQUITETURA_ATELIER.md
├── WIREFRAMES_ATELIER.md
├── wireframes.html                # Protótipo histórico consultável
├── docs/
│   ├── SPRINT_0_FECHAMENTO.md
│   ├── SPRINT_1_BRIEF.md
│   ├── CONTRATO_CONTEUDO.md
│   ├── ROTAS_E_ESTADOS.md
│   └── exemplos/                 # JSON fictício de referência
├── src/
│   ├── app/                      # Bootstrap, rotas, shells
│   ├── ui/                       # Componentes de interface
│   ├── styles/                   # Tokens, tipografia, layout
│   ├── lesson-engine/            # Registro de blocos e renderização
│   ├── blocks/                   # Renderizadores por tipo
│   ├── features/
│   │   ├── learning/
│   │   ├── authoring/
│   │   └── administration/
│   ├── repositories/             # Interfaces e adaptadores
│   └── storage/                  # IndexedDB, validação, backup
├── content/
│   ├── catalogo.json
│   └── courses/                  # JSON publicado (Sprint 2)
└── public/
    └── media/                    # Arquivos públicos leves com licença
```

**Base de URLs:** carregar caminhos a partir de `import.meta.url`, `document.baseURI` ou URLs dos manifestos; nunca assumir que o site mora na raiz do domínio. Durante Pages, ele vive sob `/Atelie/`.

**Independência de conteúdo:** o índice aponta para o manifesto do curso e o manifesto aponta para suas aulas. O aluno não enumera pastas do GitHub nem deduz caminho pelo título. As aulas ficam públicas quando incluídas no pacote e publicadas por commit/deploy.

## 4. Fluxos fechados para o MVP

### A. Professor constrói uma aula

`Painel → Curso → Módulo → Nova aula → Adicionar blocos → Configurar → Reordenar → Salvar rascunho local → Prévia do aluno → Validar → Exportar JSON → Commit manual → Conferir site publicado`.

**Fonte da verdade:** no Estúdio, o rascunho local vence para edição; na Sala do Aluno, somente o JSON efetivamente publicado é usado. Um arquivo exportado não entra automaticamente no catálogo.

### B. Aluno estuda

`Início → Catálogo/Continuar → Curso → Aula → Atividade → Anotações → Concluir → Retomar`.

**Fonte da verdade:** aulas vêm do pacote público; as respostas e anotações ficam separadas, localmente. A conclusão depende de ação explícita; o aluno pode revisitar sem perder notas.

### C. Mudança de uma aula já publicada

`Publicado revision 1 → Criar rascunho de revision 2 → Prévia → Exportar/validar → Atualizar arquivo + manifesto quando necessário → Publicar via GitHub → Nova versão acessível`.

Questões antigas alteradas não devem reutilizar respostas como se fossem atuais sem um critério de compatibilidade; bloco com ID estável e revisão ajudam a detectar o caso.

## 5. Restrições e riscos: política de prevenção

| Risco | Consequência | Mitigação necessária |
|---|---|---|
| Expor senhas em JSON no Pages | Qualquer visitante pode obtê-las | **Nenhuma senha real.** Seleção de papel só demonstrativa |
| Publicar material restrito ou dado sensível | Cópias e histórico podem permanecer públicos | Trabalhar apenas com material liberado/fictício; não usar relatos clínicos identificáveis |
| Limpar cache/dados ou mudar dispositivo | Perder rascunhos, notas e progresso | Indicar “salvo neste dispositivo”; exportação/importação e aviso de risco |
| JSON inválido ou referência quebrada | Aula não carrega | Validação estrutural, fallback legível, testes de caminhos e IDs |
| Mudança de esquema | Progresso/respostas inconsistentes | `schemaVersion`, migrações e IDs estáveis |
| Vídeos ou imagens pesadas | Carregamento lento e custos futuros | Começar leve, compactar mídias, licença/créditos e lazy-loading |
| Dependência de página única sem reescritas | Endereços internos falham após reload | Hash routing durante Pages |
| Editor e aluno renderizarem diferente | Professor aprova experiência incorreta | Mesmo motor para editor/prévia e leitura |
| Simular progresso como dado real | Usuários tiram conclusões erradas | Indicadores fictícios rotulados até haver rastreamento |
| GitHub Pages como hospedagem permanente comercial | Incompatibilidade com necessidades de negócio | Migrar para hospedagem apropriada antes do curso comercial |

### Capacidade operacional / privacidade

- Não coletar nomes, e-mails, senhas, prontuários, casos clínicos reais ou outras informações sensíveis dos testadores nesta fase.
- Profiles fictícios podem ser trocados na mesma sessão, sem alegação de isolamento seguro; armazenamento local de demonstração não é espaço privado.
- Não existe análise agregada de alunos, controle de acesso por matrícula nem sincronização.
- Evitar dependências de CDN, rastreadores e bibliotecas remotas sem necessidade.
- Acessibilidade é requisito de implementação, não apenas nota editorial.

## 6. Portões de qualidade (Definition of Done)

A cada sprint, antes de declarar pronto:
1. **Arquivo criado e lido de volta do GitHub:** commit e conteúdo confirmados.
2. **Comportamento verificado:** executar teste apropriado à entrega (validador, interação, fluxo).
3. **Caminho do usuário claro:** navegação e estados vazio/erro documentados.
4. **Responsividade:** revisar larguras móveis e desktop, sem rolagem lateral indevida.
5. **Acessibilidade:** teclado/foco, contraste, nomes dos controles e movimento reduzido.
6. **Persistência honesta:** diferenciar memória, IndexedDB, exportação e publicação.
7. **Sem regressão do protótipo:** manter URLs importantes; não tocar no repositório `sistema`.
8. **Documentar limitações reais e pendências:** nunca marcar testes de dispositivo como realizados sem executá-los.

## 7. Auditoria do que existe hoje

| Item | Evidência | Estado |
|---|---|---|
| Mapa geral dos três ambientes | `ARQUITETURA_ATELIER.md` e `index.html` | Documentado e disponível no repositório |
| Seis telas de UX | `wireframes.html` e `WIREFRAMES_ATELIER.md` | Protótipo navegável, não produto |
| Especificação de JSON e blocos | `docs/CONTRATO_CONTEUDO.md` | Contrato proposto |
| Regras de rotas e erros | `docs/ROTAS_E_ESTADOS.md` | Contrato proposto |
| Catálogo, curso e aula de exemplo | `docs/exemplos/*.json` | Arquivos de referência, **não ligados ao motor** |
| Editor persistente, runtime de blocos | Não implementados | Sprints 2–6 |
| Login real, Supabase, API de escrita | Fora do escopo | Não implementados |
| Verificação com alunos, iPhone e Android | Não realizada aqui | Pendente de testes reais |

**Observação:** a nomenclatura existente utiliza “Atelier.” visualmente e `Atelie` como nome técnico do repositório. Títulos, telas e materiais podem escrever “Atelier”; manter a URL/case efetivos do GitHub sem supor “ateliê” acentuado.

## 8. Critérios de encerramento da etapa 0.4

- [x] Escopo P0/P1/P2 consolidado.
- [x] Decisões de tecnologias e formato inicial registradas.
- [x] Contrato único de publicação/rascunho explicitado.
- [x] Riscos de perfil falso, mídia e dados locais revisados.
- [x] Estrutura de pastas e critérios de qualidade documentados.
- [x] Brief com entregáveis do Sprint 1 preparado.
- [ ] Homologação visual em dispositivos reais e observações dos colaboradores — **pendência explícita**, não bloqueia iniciar o Sprint 1.

**Próxima entrega:** [Sprint 1 — Design System e UX responsiva](SPRINT_1_BRIEF.md).
