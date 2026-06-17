## Objetivo

Reduzir a fricção de cadastro adicionando **Login com Google** (1 clique) e elevar a segurança com a checagem de senhas vazadas (HIBP). Confirmação de email continua obrigatória.

## O que será feito

### 1. Habilitar Google OAuth (gerenciado pela Lovable Cloud)
- Configurar o provider Google via Cloud — sem necessidade de credenciais próprias, sem chaves para você gerenciar.
- Será gerado o módulo `src/integrations/lovable/` que expõe `lovable.auth.signInWithOAuth("google", ...)`.

### 2. Atualizar a tela de Auth (`src/pages/Auth.tsx`)
- Adicionar botão **"Continuar com Google"** acima do formulário de email/senha, com ícone do Google e estilo luxo minimalista (botão branco/neutro, borda sutil — combina com a estética IGLU).
- Divisor elegante "ou" entre o botão Google e o form.
- Manter cadastro/login por email/senha como hoje.
- Tratar erros do OAuth com toast em PT-BR.

### 3. Pós-login social
- O `handle_new_user` trigger já cria o profile automaticamente — funciona igual para Google.
- O fluxo de onboarding (5 telas) seguirá funcionando: novos usuários Google entram, perfil é criado, e como `created_at` é recente, o onboarding aparece normalmente.

### 4. Ativar Proteção HIBP
- Ligar `password_hibp_enabled: true` na configuração de auth.
- Senhas que já vazaram em vazamentos públicos serão rejeitadas no cadastro/troca de senha, com mensagem clara em PT-BR.

### 5. PWA / Service Worker
- Verificar e garantir que o caminho `/~oauth` é excluído do cache do service worker (requisito para OAuth funcionar em PWA). Ajustar `vite.config.ts` (Workbox) se necessário.

## O que NÃO entra nesta rodada (posso fazer depois)
- Recuperação de senha (tela "esqueci minha senha" + `/reset-password`)
- Tradução completa de mensagens de erro do Supabase
- Emails de auth com a marca IGLU (templates customizados)

Posso emendar qualquer um destes em seguida — é só pedir.

## Resultado esperado
Novos usuários conseguem entrar em **1 clique** com Google, e contas com senhas comprometidas são bloqueadas automaticamente. Espera-se aumento mensurável na taxa de conversão de visitante → conta criada.
