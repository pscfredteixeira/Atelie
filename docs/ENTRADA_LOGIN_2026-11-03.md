# Ateliê — Entrada antes da plataforma (03/11/2026)

## O que mudou
O site abre com uma tela de entrada editorial (desktop e mobile) contendo:
- **Entrar com Google:** usa Firebase Authentication quando habilitado;
- **Explorar versão demonstrativa:** acesso explícito sem autenticação para testar os três cursos fictícios e recursos locais;
- **Voltar à entrada:** disponível na barra superior enquanto o usuário está na demonstração;
- **Sair da conta:** quem estiver autenticado retorna à tela inicial.

A entrada demonstrativa fica guardada somente na aba do navegador para preservar navegação e atualização durante testes, não como login real.

## Limites e segurança
Esta tela organiza a experiência do usuário, **não protege arquivos públicos hospedados no GitHub Pages**. A proteção dos dados pessoais depende das regras reais no Firebase, que precisam ser publicadas no console e validadas. A autenticação Google depende de ativar o provedor e autorizar o domínio `pscfredteixeira.github.io`.

Não foram importadas aulas anteriores. Cada curso continua com uma única aula ilustrativa. O site anterior pode ser recuperado pela branch `backup/pre-login-gate-2026-11-03`.

## Critério de verificação
Testes de navegador conferem primeira visita, tela bloqueando a interface até uma ação explícita, escolha demonstrativa, saída, login simulado e comportamento no mobile. O login Google real e Firestore exigem testes manuais após ativação do serviço.
