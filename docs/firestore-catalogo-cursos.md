# Catálogo e aulas no Cloud Firestore — plano de migração

Situação em 09/11/2026: o Ateliê já usa Firebase Authentication e possui código para salvar perfis e progresso dos alunos. **O catálogo público e as duas aulas ainda são servidos por arquivos do repositório**. Esta proposta prepara os dados do curso para migração, mas **não declara que os documentos foram gravados no Firestore**.

## Conteúdo visível hoje

Somente **Formação Freudiana**, em dois módulos reais:

1. **As origens da investigação freudiana** → A escuta que mudou a clínica.
2. **A primeira tópica de Freud** → A primeira tópica de Freud.

Os outros módulos planejados, o material “Da histeria ao nascimento da psicanálise” e os cursos de demonstração continuam preservados no repositório, mas não integram o catálogo publicado.

## Pacote de importação

O arquivo [`content/firestore/catalogo-seed.json`](../content/firestore/catalogo-seed.json) contém cinco documentos preparados, com paths e dados:

- `courses/curso-formacao-freudiana` — curso, título, capa, descrição, visibilidade.
- `courses/curso-formacao-freudiana/modules/modulo-formacao-freudiana-01` — primeiro módulo.
- `courses/curso-formacao-freudiana/modules/modulo-formacao-freudiana-01/lessons/aula-escuta-que-mudou-a-clinica` — primeira aula.
- `courses/curso-formacao-freudiana/modules/modulo-formacao-freudiana-primeira-topica` — segundo módulo.
- `courses/curso-formacao-freudiana/modules/modulo-formacao-freudiana-primeira-topica/lessons/aula-primeira-topica-freud` — segunda aula.

Os documentos guardam **metadados e referências de conteúdo** (ordem, título, duração, status, URL da página HTML e vídeo), não cópias do vídeo, imagens ou código das interações.

## Por que não colocar as páginas HTML inteiras no Firestore?

Aulas atuais usam HTML, CSS, JavaScript, imagens e eventos do YouTube; não são apenas textos. É mais seguro, econômico e simples manter essas experiências como arquivos estáticos versionados no GitHub Pages ou, futuramente, em Firebase Storage/Hosting, enquanto o Firestore controla estrutura, publicação e conteúdo pedagógico estruturado.

Para aulas novas, poderemos criar blocos estruturados no banco (texto, imagem, vídeo, questão, dica, intervenção, atividade), com renderer próprio e validador. **Não executar HTML/JavaScript arbitrário proveniente do banco** no navegador de alunos.

## Etapas para ativar de verdade

1. Confirmar acesso administrativo ao projeto Firebase **ateliepsi** e à base Cloud Firestore, além de publicar as regras de perfil/progresso já preparadas.
2. Definir regras de leitura pública somente para documentos `status == 'published'`, com escritas negadas ao cliente comum. Publicações devem ocorrer por ambiente administrativo confiável (Firebase Admin SDK, conta de serviço protegida ou função backend com permissão específica).
3. Importar os cinco documentos do pacote por um ambiente confiável. **Nunca** incorporar credenciais administrativas ao GitHub Pages, ao JavaScript público ou ao repositório.
4. Validar os dois cursos/aulas e a ordem dos módulos; verificar permissões com uma sessão anônima e uma conta de aluno.
5. Criar leitor do catálogo Firestore no aplicativo, com fallback explícito para conteúdo estático até a migração estar estável.
6. Só então habilitar edição administrativa e publicação de novos cursos pelo sistema.

Até essa ativação, editar o seed **não altera** o banco remoto. O menu atual usa o cadastro `COURSES` e `ATELIE_COURSE_MODULES` do `app.js`, com `status:'published'` como condição de visibilidade; ele já comporta outros cursos sem reintroduzir módulos vazios.

## Segurança e privacidade

Catálogo público, perfis privados e registros de progresso são conjuntos de dados distintos:

- `courses/...`: conteúdo publicado para leitura pública.
- `users/{uid}/profile/main`: perfil pessoal do aluno.
- `users/{uid}/state/atelier`: progresso e anotações daquele usuário.

Não colocar dados clínicos de pacientes nas coleções de cursos nem nos perfis de alunos. Para conteúdos restritos/pagos, matrícula e autorização de acesso exigirão regras próprias.

## Estado da implementação

- [x] Catálogo visível com um curso e duas aulas.
- [x] Arquivos de conteúdo existentes preservados.
- [x] Cinco documentos de migração gerados.
- [ ] Importação no Firestore.
- [ ] Regras de leitura de cursos implantadas.
- [ ] Aplicativo lendo o catálogo remoto em produção.
- [ ] Painel administrativo de publicação.
