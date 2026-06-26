## Mapeamento do fluxo atual

```text
┌─ Cadastro (email+senha) ──────────────────────────────────────────────┐
│ Auth.tsx → supabase.auth.signUp({ emailRedirectTo: igluapp.lovable }) │
│   ↓                                                                    │
│ Supabase Auth cria usuário (não confirmado) + envia evento "signup"   │
│   ↓                                                                    │
│ auth-email-hook → renderiza signup.tsx → fila → Lovable Email         │
│   ↓                                                                    │
│ Usuária recebe e-mail em "notify.weareiglu.com"                       │
│   ↓ clica "Confirmar meu e-mail"                                       │
│ Supabase verifica token → redireciona p/ igluapp.lovable.app/?code=X  │
│   ↓                                                                    │
│ App.tsx carrega → useAuth → detectSessionInUrl exchange ?code         │
│   ↓ (race condition aqui)                                              │
│ Navigate("/library")                                                   │
└────────────────────────────────────────────────────────────────────────┘

┌─ Reset de senha ───────────────────────────────────────────────────────┐
│ ForgotPassword → resetPasswordForEmail({ redirectTo: /reset-password })│
│   ↓ → recovery.tsx → e-mail                                            │
│ Clica link → /reset-password#access_token=...&type=recovery            │
│   ↓ onAuthStateChange("PASSWORD_RECOVERY") → setReady(true)           │
│ updateUser({ password }) → navigate("/library")                       │
└────────────────────────────────────────────────────────────────────────┘

┌─ Login Google ─────────────────────────────────────────────────────────┐
│ lovable.auth.signInWithOAuth("google", { redirect_uri: origin })      │
│   ↓ popup /~oauth/initiate → broker Lovable → Google → callback       │
│ Sessão setada pelo wrapper. (PWA SW exclui /~oauth — OK)              │
└────────────────────────────────────────────────────────────────────────┘
```

## Problemas encontrados (ordem de impacto)

### 🔴 Crítico

1. **Cadastro com e-mail já existente é silencioso.** Os logs do Supabase mostram `user_repeated_signup` retornando 200 sem enviar e-mail (anti-enumeração). Hoje a UI mostra `"Confira seu e-mail para confirmar a conta ✨"` em qualquer caso → usuária espera um e-mail que nunca chega. É **o motivo nº 1** de reclamações tipo "não recebi e-mail".

2. **Sem `/auth/callback` para o link de confirmação.** O link aterrissa em `https://igluapp.lovable.app/?code=XXX`. O `detectSessionInUrl` do client troca o code por sessão, mas:
   - O `?code=` continua na URL após a troca.
   - O App.tsx faz `<Navigate to="/library" replace />` na rota `/` antes da troca completar em alguns casos → usuária vê o **Onboarding pré-auth** por uma fração de segundo, ou cai no `/auth` se a troca falhar sem feedback.
   - Não há tratamento de erro de confirmação (link expirado, já usado).

3. **Sem botão "reenviar e-mail de confirmação"** na tela de login. Quando a usuária tenta entrar e recebe `"Confirme seu e-mail antes de entrar"`, fica sem saída.

### 🟡 Médio

4. **Tradução de erro do Apple/Google genérica.** Erros de OAuth (popup bloqueado, usuária cancela, redirect URL não autorizado) viram a string técnica original.

5. **ResetPassword fallback de 1.5s** marca `ready=true` mesmo sem sessão. Se a usuária abre o link em outro browser, ela preenche a nova senha, clica "Salvar" e recebe um erro genérico. Deveria mostrar estado "Link inválido — solicitar novo" antes de mostrar o form.

6. **Sem validação de força de senha** no signup (só `minLength={6}`). Como você ativou HIBP, a primeira senha fraca/vazada que a usuária digitar vai vir do servidor — UX ruim. Indicador visual previne a frustração.

7. **`onAuthStateChange` no `useAuth` não diferencia `PASSWORD_RECOVERY`.** Funciona por sorte porque o App.tsx checa o pathname. Marcar o evento explicitamente é mais robusto.

### 🟢 Baixo

8. Botões OAuth não desabilitam loading visual com spinner — só trocam texto.
9. `Auth.tsx` não foca o primeiro input ao montar (perda de acessibilidade mobile).
10. Ao redirecionar para `igluapp.lovable.app`, perdemos qualquer deep-link de onde a usuária estava (ex: convite para um set). Hoje sem impacto, mas vale para o futuro.

---

## Plano de correção (somente front-end + email template)

### 1. Criar rota `/auth/callback` (nova página)
- Recebe `?code=`, `#access_token=` ou `?error=`.
- Mostra estado de loading enquanto `supabase.auth.exchangeCodeForSession` resolve.
- Em sucesso: limpa a URL e `navigate("/library", { replace: true })`.
- Em erro (`access_denied`, `otp_expired`, `invalid_token`): tela amigável com CTA "Solicitar novo link" → `/forgot-password` ou `/auth`.
- Atualizar `emailRedirectTo` no signUp para `${origin}/auth/callback`.

### 2. Detectar "e-mail já cadastrado" no signup
Após `supabase.auth.signUp` retornar 200, inspecionar a resposta:
- Se `data.user && data.user.identities?.length === 0` → e-mail já existe (Supabase anti-enumeração).
- Mostrar toast informativo: `"Este e-mail já tem uma conta. Faça login ou recupere sua senha."` e alternar para a aba de login automaticamente.

### 3. Botão "Reenviar e-mail de confirmação"
- Aparece embaixo do form de login quando o erro retornado for `email not confirmed`.
- Chama `supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: ${origin}/auth/callback } })`.
- Rate-limit de 60s no client (estado local) para não ser abusado.

### 4. Melhorar ResetPassword
- Estado `ready` vira `'checking' | 'ready' | 'invalid'`.
- Se em 2s não houver sessão E não veio nenhum evento de auth → `invalid` → tela "Link inválido ou expirado" com botão "Solicitar novo link".

### 5. Indicador de força de senha (signup + reset)
- Componente simples com 3 barras + label ("Fraca" / "Média" / "Forte").
- Regras: ≥8 chars, mistura de tipos, sem ser óbvia (`123456`, `password`).
- Não bloqueia submit; só orienta. HIBP continua sendo a barreira final do servidor.

### 6. Tratamento de erros OAuth
- Adicionar mapeamentos em `translateError` para: `popup_closed`, `popup_blocked`, `user_cancelled`, `redirect_uri_mismatch`.
- Botões OAuth ganham spinner real (lucide `Loader2 animate-spin`).

### 7. Marcar evento `PASSWORD_RECOVERY` explicitamente no useAuth
- Exportar flag `isRecoveryFlow` do hook → App.tsx usa em vez de inspecionar `window.location.pathname`.

### 8. Atualizar template signup.tsx
- Garantir que `confirmationUrl` no template aponte para `/auth/callback` (Supabase usa o `emailRedirectTo` que passarmos no signUp, então isso flui automaticamente; só verificar o copy do template).
- Adicionar linha curta "Se você não criou esta conta, ignore este e-mail" (já existe — manter).

### 9. Auto-focus + autocomplete refinado
- `Auth.tsx`: `autoFocus` no primeiro input vazio (e-mail no login, senha se já tiver e-mail salvo).
- `inputMode="email"` no campo de e-mail (teclado mobile correto).

---

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/pages/Auth.tsx` | Detecção de e-mail repetido, reenvio de confirmação, OAuth com spinner, auto-focus, erros traduzidos |
| `src/pages/AuthCallback.tsx` | **Novo.** Página de callback de confirmação/OAuth |
| `src/pages/ResetPassword.tsx` | Estado `checking/ready/invalid` com CTA de novo link |
| `src/pages/ForgotPassword.tsx` | Usa `getAppOrigin()` extraído + redireciona para `/auth/callback`? não — mantém `/reset-password` (fluxo correto) |
| `src/hooks/useAuth.tsx` | Expõe `isRecoveryFlow` |
| `src/lib/passwordStrength.ts` | **Novo.** Função utilitária |
| `src/components/PasswordStrength.tsx` | **Novo.** UI de 3 barras |
| `src/App.tsx` | Adiciona rota `/auth/callback` pública + usa `isRecoveryFlow` do hook |
| `supabase/functions/_shared/email-templates/signup.tsx` | Pequenos ajustes de copy (se necessário) |

## Como vou validar

1. **Cadastro novo:** criar conta com e-mail descartável → verificar que e-mail chega de `notify.weareiglu.com` → clicar botão → cair em `/auth/callback` → ver loading → navegar para `/library` autenticada.
2. **Cadastro com e-mail existente:** tentar criar conta com `review.iglu@gmail.com` → ver toast "Este e-mail já tem uma conta..." e alternar para login.
3. **Reset:** pedir reset → clicar link → preencher nova senha → entrar.
4. **Link expirado:** abrir um link de confirmação antigo → ver tela de erro com CTA "Solicitar novo link".
5. **Login sem confirmar:** tentar logar antes de confirmar → ver botão "Reenviar e-mail" → reenviar → confirmar entrega via `email_send_log`.
6. **Google OAuth:** continuar funcionando idêntico (sem mudanças no fluxo, só spinner + erros traduzidos).

## Notas

- O **backend de auth continua sendo Supabase via Lovable Cloud** — nenhuma mudança em RLS, edge functions de negócio, ou Supabase Auth settings.
- O domínio `notify.weareiglu.com` já está ativo e enviando — não mexo nele.
- A skill carregada foi `nextjs-supabase-auth`, mas seu projeto é **Vite + React Router** (não Next.js App Router). Vou aplicar os princípios equivalentes (callback page, evento `PASSWORD_RECOVERY` explícito, never expose tokens) adaptados ao Vite, sem usar `@supabase/ssr` que é específico de Next.
