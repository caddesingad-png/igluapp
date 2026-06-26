## Diagnóstico (do que encontrei agora)

**🔴 Crítico**
1. **Tabela `profiles` exposta publicamente** — política `USING (true)` expõe `monthly_budget` (dado financeiro), `bio`, `display_name`, `avatar_url`, `onboarding_completed` para qualquer pessoa não autenticada. Vazamento de dados real.
2. **Bucket `product-photos` público com listing aberto** — qualquer um consegue listar todos os arquivos de todos os usuários (não só ler por URL conhecida).
3. **Edge functions `identify-product` e `review-product` com `verify_jwt = false`** — chamáveis sem login, podem ser abusadas para drenar créditos da Lovable AI por terceiros.

**🟡 Médio**
4. Funções `SECURITY DEFINER` com `EXECUTE` aberto a `anon`/`authenticated` (lint Supabase 0028/0029).
5. **HIBP (senhas vazadas)** — não está confirmado como ativo nas configurações do Auth.
6. Edge function `delete-account` valida JWT manualmente — ok, mas pode ser endurecida com rate-limit.
7. Sem **CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy** no `index.html` (ajuda contra XSS, clickjacking e melhora reputação do domínio).

**🟢 Reputação de e-mail (Google "perigoso/suspeito")**
8. E-mails de confirmação saem do domínio padrão do Supabase (`*.supabase.co`) sem SPF/DKIM/DMARC do seu domínio → Gmail marca como suspeito ou joga no spam.
9. Sem template de e-mail com marca IGLU + link de domínio próprio confiável.
10. Sem páginas públicas de `/termos` e `/privacidade` indexáveis (Google Safe Browsing valoriza isso).

---

## Plano de correção (em fases, sem quebrar nada)

### Fase 1 — Vazamento de dados (URGENTE)
- **Migration**: substituir a policy `Public profiles are viewable by anyone` por:
  - Manter `profiles_public` view (já existe) como única superfície pública, com `SELECT` só de `display_name`, `avatar_url`, `bio`.
  - Na tabela `profiles`: SELECT apenas `auth.uid() = user_id`. Remover policy `true`.
- Auditar componentes que leem `profiles` direto (Discover, UserProfile) e migrar para `profiles_public`.

### Fase 2 — Storage
- Manter bucket `product-photos` público para leitura por URL (necessário pro app), mas:
  - Adicionar policy que **bloqueia LISTING** (`SELECT` em `storage.objects` só para o dono da pasta `{userId}/...`).
  - Garantir que upload/delete já estão restritos por `auth.uid()`.

### Fase 3 — Edge functions
- Mudar `identify-product` e `review-product` para `verify_jwt = true` (em `config.toml`).
- Adicionar rate-limit simples por usuário (ex.: 30 chamadas / 10min) usando tabela `ai_usage`.
- Endurecer `delete-account` com confirmação por re-auth (já valida JWT).

### Fase 4 — Funções SECURITY DEFINER
- Revisar `handle_new_user`, `update_set_likes_count`, `update_updated_at_column`:
  - `update_updated_at_column` e `update_set_likes_count` são triggers — REVOKE EXECUTE de `public/anon/authenticated`.
  - `handle_new_user` é trigger no `auth.users` — REVOKE EXECUTE.

### Fase 5 — Auth hardening
- Ativar **HIBP password check** via `configure_auth`.
- Garantir **email confirmation obrigatório**.
- Reduzir tempo de sessão para 7 dias com refresh rotativo.

### Fase 6 — Headers de segurança no `index.html`
- Adicionar meta tags: `Content-Security-Policy` (compatível com Supabase + Lovable AI), `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, `Permissions-Policy` mínima.

### Fase 7 — Reputação de e-mail (resolve o "Google considera perigoso")
- Configurar **domínio de e-mail próprio** (ex.: `mail.iglu.app` ou subdomínio que você indicar) via `email_domain--check_email_domain_status` + setup dialog.
- Após DNS verificado (SPF/DKIM/DMARC alinhados), scaffoldar **templates de auth com marca IGLU** (`scaffold_auth_email_templates`).
- Resultado: e-mails saem de `no-reply@seudominio` com assinatura verificada → Gmail/Outlook tratam como confiável, sem aviso "link suspeito".

### Fase 8 — Páginas legais públicas
- Garantir `/termos` e `/privacidade` (já existem) com conteúdo completo LGPD e meta tags SEO — ajuda no Google Safe Browsing.

### Fase 9 — Monitoramento contínuo
- Atualizar `security-memory` com decisões tomadas.
- Rodar `security--run_security_scan` ao final para confirmar 0 erros críticos.

---

## ⚠️ Antes de eu executar, preciso confirmar 2 coisas:

1. **Domínio para envio de e-mails** — você tem um domínio próprio (ex.: `iglu.app`, `igluapp.com.br`)? Sem isso não consigo eliminar o aviso do Google nos e-mails de confirmação. Se sim, qual? Vou usar um subdomínio tipo `mail.<seu-domínio>`.

2. **Re-quebra do Discover/UserProfile** — ao fechar a tabela `profiles`, telas que leem `display_name`/`avatar_url` de outros usuários precisam passar a usar a view `profiles_public`. Posso refatorar essas telas no mesmo passo? (recomendo sim)

Se confirmar (1) o domínio e (2) que posso refatorar, executo tudo em sequência sem você precisar aprovar de novo cada fase.