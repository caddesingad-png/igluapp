# Corrigir falhas de login e logout

## Diagnóstico

Não é um bug no código de autenticação. O backend hospedado (banco + auth) está **pausado**.

Evidências:
- Todas as chamadas para `/auth/v1/token?grant_type=refresh_token` falham com `Load failed` (falha de rede, sem resposta HTTP).
- Um teste direto ao endpoint de saúde do auth não retorna nada (conexão recusada).
- A verificação de status do Lovable Cloud retorna: backend pausado.

Com o backend pausado, nenhum login, cadastro, refresh de sessão ou logout funciona — o app fica preso na tela de carregamento ou dispara `AuthRetryableFetchError`.

## O que fazer

1. **Reativar o backend** pelas configurações do Cloud (ação sua, no painel do projeto). Sem isso, nada mais adianta.
2. Após a reativação, confirmar que o backend está saudável e que login, logout e refresh de sessão respondem normalmente.
3. Verificar que o fluxo `/auth/callback` (rota atual do preview) conclui a troca de código por sessão e redireciona para `/library`.

## Melhoria opcional de UX (só depois que o backend voltar)

Hoje, quando o backend não responde, o app mostra apenas o loader pulsando indefinidamente e erros no console. Posso adicionar:

- Timeout na verificação inicial de sessão (ex.: 8s) com tela de "Não foi possível conectar" e botão "Tentar novamente".
- Mensagem específica para erro de rede no login/cadastro ("Serviço temporariamente indisponível"), em vez do erro genérico.
- Logout resiliente: limpar a sessão local mesmo quando a chamada de signOut falha por rede, para o usuário não ficar preso logado.

Arquivos envolvidos nessa parte: `src/hooks/useAuth.tsx`, `src/App.tsx`, `src/pages/Auth.tsx`, `src/pages/UserProfile.tsx` (botão de sair).

## Observação

Nenhuma mudança de schema, RLS ou Edge Function é necessária para o problema principal.
