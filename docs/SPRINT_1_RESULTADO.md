# ATELIER — Implementação do Sprint 1
**Data: 14/10/2026 · Situação: base visual implementada; homologação em dispositivos reais pendente**

## 1. O que entrou no repositório

- `index.html`: entrada real da aplicação demonstrativa, sem build nem dependências externas.
- `src/styles/tokens.css`: paleta, tipografia, espaçamentos e valores reutilizáveis.
- `src/styles/atelier.css`: layout, leitura editorial, navegação, componentes e adaptação mobile.
- `src/ui/components.js`: componentes e padrões de interface reutilizáveis, com escape de texto.
- `src/app/data.js`: dados **fictícios**; no Sprint 2 serão substituídos por leitura de JSON.
- `src/app/views.js`: telas da jornada do aluno, professor, admin e biblioteca visual.
- `src/app/main.js`: hash router, menu mobile, navegação entre ambientes, troca de perfil fictício, foco e estados de interação.
- `arquitetura.html`: cópia preservada da antiga home conceitual.
- `wireframes.html`: protótipo 0.2 intacto e acessível.

## 2. Links de navegação

Hospedagem prevista pelo GitHub Pages `main/(root)`:
- Principal: `https://pscfredteixeira.github.io/Atelie/`.
- Aluno: `#/aluno`.
- Catálogo: `#/cursos`.
- Curso ilustrativo: `#/cursos/curso-fundamentos`.
- Sala de aula ilustrativa: `#/cursos/curso-fundamentos/aulas/aula-recalque`.
- Meu caderno (estado vazio): `#/aluno/caderno`.
- Progresso (somente indicadores fictícios): `#/aluno/progresso`.
- Professor: `#/professor`.
- Estrutura: `#/professor/cursos/curso-fundamentos`.
- Estúdio: `#/professor/cursos/curso-fundamentos/aulas/aula-recalque/editar`.
- Prévia: `#/professor/cursos/curso-fundamentos/aulas/aula-recalque/previa`.
- Administrador: `#/admin`.
- Biblioteca visual: `#/admin/identidade`.
- Rota inválida: página não encontrada e saída para catálogo/início.

Os endereços são **rotas dentro da aplicação**, que deverão funcionar em recarga graças ao uso de hash routing. O URL público ainda depende da conclusão do deploy do GitHub Pages.

## 3. Interações implementadas

| Ação | Estado |
|---|---|
| Alternar Aluno/Professor/Admin | Operante como troca de ambiente demonstrativo |
| Navegar por cursos, aulas, estúdio, preview e painel | Operante com conteúdo fictício |
| Módulos recolhíveis | `details/summary` nativo |
| Menu lateral no celular | Implementado, com botão, sobreposição e tecla Esc |
| Navegação inferior mobile | Implementada |
| Foco ao trocar rota | Gerenciado pelo script |
| Abas da biblioteca visual | Clique e teclado (setas, Home e End) |
| Botões para funções futuras | Abrem diálogo explicativo; não alegam gravar nada |
| Tratamento de endereço inexistente | Estado `not_found` e ação de retorno |
| Leitura em papel claro sobre interface escura | Layout responsivo implementado em CSS |
| Avisos de demonstração | Visíveis em todas as telas |

## 4. Testes realizados nesta etapa

**Verificação direta do código no GitHub:**
- Todos os arquivos foram gravados e lidos de volta.
- Módulos JavaScript passaram por uma verificação de sintaxe após retirar apenas o cabeçalho `import/export` para análise.
- A função de renderização foi executada em isolamento, gerando HTML das **13 rotas previstas** e da rota inexistente sem lançar erros.
- O HTML criado não contém interpolação literal `undefined` nas páginas de teste.
- O CSS principal contém estilos de sidebar, barra mobile e abas.
- A raiz carrega o arquivo correto `src/app/main.js` como ES Module.
- Wireframes e mapa arquitetural originais foram preservados.
- Nenhum acesso ao Supabase foi implementado.

**Ainda não verificado:**
- Não foi possível testar o site público com um navegador externo nesta execução. O deploy do Pages **não está confirmado como concluído**.
- Não há teste com viewport real ou revisão visual de layout em iPhone, Android e desktop.
- Não houve auditoria automatizada de WCAG com navegador nem teste com leitor de tela.
- O funcionamento em navegador real (incluindo modais e menus) ainda requer smoke test no endereço publicado.
- Testes com um professor e um aluno convidados ainda não foram realizados.

Essas pendências precisam ser tratadas na revisão visual, mas não mudam o contrato de arquitetura do Sprint 2.

## 5. Limitações intencionais

- Não há login real, senha, autorização ou proteção de páginas.
- Não há sincronização, rascunhos persistidos, notas gravadas ou progresso verdadeiro.
- As aulas exibidas em `src/app/data.js` são demonstrativas; **a aplicação ainda não consome os JSON** que criamos no Sprint 0.3.
- Não há edição funcional do conteúdo nem publicação pelo Estúdio; ações marcadas “futuro” são explicadas via diálogo.
- O `wireframes.html` continua oferecendo a simulação temporária de mover blocos do Sprint 0.2, independente da aplicação nova.
- O repositório `sistema` não foi alterado.

## 6. Checklist de transição

- [x] Tokens CSS e identidade editorial.
- [x] Componentes básicos e tipos de estado.
- [x] Três shells/ambientes com navegação.
- [x] Páginas-base principais com conteúdo fictício.
- [x] Navegação responsiva no código e controles mobile.
- [x] Biblioteca visual de componentes para apresentar aos colaboradores.
- [x] Teste de sintaxe e renderização das rotas em isolamento.
- [ ] Verificação visual e funcional do site publicado, incluindo celulares.
- [ ] Revisão manual de contraste, teclado, modais e leitores de tela.
- [ ] Feedback de um aluno e um professor convidados.

## 7. Próximo sprint técnico

**Sprint 2 — JSON e adaptadores de dados.** Substituir conteúdo fictício em JavaScript por catálogo, manifesto de curso e arquivos de aula; implementar JSON Schema + validação, camada de leitura `fetch`, IndexedDB para rascunhos iniciais e diferenciação entre conteúdo público e rascunho local.

**Sequência prioritária:** `2.1` contratos executáveis; `2.2` carregamento de JSON por caminho; `2.3` tratamento de erros; `2.4` IndexedDB; `2.5` testes de compatibilidade, exportação e leitura.

**Atenção:** não usar qualquer senha no JSON público. Perfis continuam sendo simulações.
