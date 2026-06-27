# Migração de Lovable Emails → Resend

## Aviso importante antes de começar

Trocar de provedor **não garante sair do spam do Gmail**. Spam em signup geralmente tem 3 causas, nenhuma delas resolvida só com a troca:

1. **Subdomínio novo sem reputação** (warm-up). Resend novo começa igual.
2. **Conteúdo do email** (palavras gatilho, proporção texto/HTML, links).
3. **Falta de DMARC com policy `quarantine`/`reject`** alinhado.

A vantagem real do Resend aqui é: dashboard próprio com métricas de open/bounce/spam complaint, e você pode trocar de subdomínio sem depender da delegação NS da Lovable.

Se quiser pausar e tentar resolver o spam mantendo Lovable Emails antes, é só me avisar.

---

## Pré-requisito que só você consegue fazer

A Lovable hoje delega `notify.weareiglu.com` para os nameservers dela. **Resend não consegue verificar nada nesse subdomínio enquanto a delegação existir.** Então usaremos um subdomínio **novo** para o Resend: sugiro `send.weareiglu.com` (ou `mail.weareiglu.com`).

Decisão sobre o Lovable Emails atual:
- **Opção A (recomendada)**: manter `notify.weareiglu.com` ativo como fallback durante a migração e desativar depois que Resend estiver enviando OK.
- **Opção B**: desativar agora via Cloud → Emails e remover os NS records `ns3.lovable.cloud`/`ns4.lovable.cloud` no registrar.

---

## Etapas

### 1. Conectar o Resend
Vou abrir o fluxo de conexão do conector Resend (já existe nativo na Lovable). Você cria/usa sua conta Resend, gera uma API key e cola.

### 2. Verificar o subdomínio `send.weareiglu.com` no Resend
Esta parte é manual no painel do Resend:
- Adicionar domínio → `send.weareiglu.com`
- Resend mostra 3–4 registros DNS (MX, SPF/TXT, DKIM, DMARC)
- Você adiciona esses registros no registrar de `weareiglu.com`
- Aguardar verificação (geralmente minutos)

Eu te passo o passo-a-passo exato quando chegarmos aqui.

### 3. Reescrever o `auth-email-hook` para enviar via Resend
Hoje ele enfileira em `auth_emails` (pgmq) e o `process-email-queue` despacha. Vou trocar para enviar **direto via gateway do Resend** (assíncrono mas sem fila própria — Resend já tem retry interno).

Mantenho:
- Os 6 templates React Email atuais (`signup`, `recovery`, `magic-link`, `invite`, `email-change`, `reauthentication`) já brandeados em PT-BR — só muda o transporte.
- A validação de assinatura do webhook (`@lovable.dev/webhooks-js`).
- O redirect público para `https://igluapp.lovable.app/auth/callback`.

Troco:
- `supabase.rpc('enqueue_email', ...)` → `fetch` no gateway Resend (`POST /emails`) com `from: "IGLU <no-reply@send.weareiglu.com>"`.

### 4. Adicionar boas práticas anti-spam no template de signup
Como o problema é especificamente signup no Gmail, vou aplicar:
- **Reply-To** real (ex.: `contato@weareiglu.com`) — Gmail penaliza no-reply puro.
- **Versão texto/plain** além do HTML (Resend gera, mas garanto o opt-in).
- **Headers `List-Unsubscribe`** (mesmo sendo transacional, melhora score no Gmail).
- **Preview text** descritivo (já existe, vou revisar).
- Reduzir proporção de imagem/link no corpo.

### 5. Manter app emails (transacionais) também no Resend
O `send-transactional-email` (se/quando você usar) também passa a apontar para Resend, mesmo padrão.

### 6. Limpeza do antigo (depois de validar)
Quando Resend estiver entregando 100%:
- Desativo Lovable Emails (`toggle_project_emails enabled: false`)
- Te passo as instruções para remover os NS `ns3/ns4.lovable.cloud` do registrar
- Deixo `process-email-queue` e tabelas pgmq quietos (não estorvam) ou removo se você preferir

---

## O que vou modificar no código

| Arquivo | Mudança |
|---|---|
| `supabase/functions/auth-email-hook/index.ts` | Trocar `enqueue_email` por `fetch` no gateway Resend |
| `supabase/functions/auth-email-hook/deno.json` | (nenhuma — já tem JSX) |
| `supabase/functions/_shared/email-templates/signup.tsx` | Adicionar preheader/copy mais "humano" + ajustes anti-spam |
| (opcional futuro) `send-transactional-email` | Apontar para Resend também |

Nenhuma mudança no frontend, no fluxo de signup, em RLS ou no banco.

---

## O que você vai precisar fazer (mão na massa)

1. Criar conta Resend (gratuita até 3k emails/mês, $20/mês acima).
2. Quando eu pedir, autorizar o conector e gerar a API key.
3. Adicionar `send.weareiglu.com` no painel do Resend e copiar/colar os DNS records dele no registrar do `weareiglu.com`.
4. Esperar verificação no painel do Resend.
5. Definir `contato@weareiglu.com` (ou similar) como Reply-To real — precisa existir e receber respostas.

---

## Detalhes técnicos (para referência)

- **Conector usado**: Resend (gateway nativo Lovable, sem armazenar API key no seu código).
- **Gateway URL**: `https://connector-gateway.lovable.dev/resend/emails`.
- **Auth headers**: `Authorization: Bearer ${LOVABLE_API_KEY}` + `X-Connection-Api-Key: ${RESEND_API_KEY}`.
- **Sem fila própria**: Resend tem retry interno e tracking. Removo dependência do `process-email-queue` para auth emails.
- **`auth-email-hook`** continua usando `@lovable.dev/webhooks-js` para validar a assinatura do Supabase Auth — essa parte é obrigatória e não muda.

Confirma que quer seguir assim e me diz qual subdomínio você prefere (`send.weareiglu.com`, `mail.weareiglu.com` ou outro)?
