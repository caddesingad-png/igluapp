## Diagnóstico

- DNS de `notify.weareiglu.com`: **verificado** ✅
- Setup de envio do projeto: **"Setting up — Confirming email delivery is ready"** ⏳
- Enquanto esse passo final não termina, **o Lovable continua enviando os e-mails de auth pelo remetente padrão `@auth.lovable.app`** — é por isso que o Gmail mostra "suspeito". Nenhum template novo é usado ainda; nada quebrado no código.

Os templates branded de IGLU já estão deployados e vão entrar em uso automaticamente assim que o setup virar **Active**.

## O que fazer

### 1. Aguardar o setup terminar (sem mexer em nada)
A confirmação final de envio costuma levar de minutos até algumas horas após o DNS verificar. Você acompanha em **Cloud → Emails**. Quando o status virar **Active**:
- O remetente passa a ser `IGLU <no-reply@notify.weareiglu.com>` (ou similar)
- SPF, DKIM e DMARC do subdomínio já estão configurados pelo Lovable via NS delegation
- O alerta "suspeito" do Gmail desaparece em novos envios

### 2. Testar deliverability quando ficar Active
- Criar conta de teste com Gmail, Outlook e iCloud
- Conferir cabeçalho do e-mail: `SPF=pass`, `DKIM=pass`, `DMARC=pass`
- Rodar um teste em https://www.mail-tester.com/ (cola o endereço, cria conta, vê a nota — alvo 9/10+)

### 3. Boas práticas adicionais para reputação
- **Não alterar** os templates removendo o footer de unsubscribe (o Lovable injeta automaticamente — necessário para Gmail/Yahoo bulk sender rules)
- **Não habilitar** Resend/SendGrid no mesmo subdomínio — quebraria a delegação NS
- **Manter HIBP + confirmação obrigatória** (já está ligado) — reduz contas falsas que geram bounce
- Pedir aos primeiros usuários para marcar como "Não é spam" / mover para caixa de entrada na primeira vez — isso treina o filtro do Gmail rapidamente para o domínio novo

### 4. Se após 24h o status ainda estiver "Setting up"
Me avise — aí faço re-trigger do setup via deploy do `auth-email-hook` (force reconcile) ou abro um diagnóstico mais profundo.

## Resumo técnico

| Item | Estado |
|---|---|
| DNS NS + SPF/DKIM/DMARC de `notify.weareiglu.com` | Verificado |
| Templates branded IGLU (6 arquivos) | Deployados |
| `auth-email-hook` edge function | Deployado |
| Project email setup (último passo) | Em andamento |
| Remetente atual dos e-mails | Ainda `@auth.lovable.app` até virar Active |

**Não há mudança de código pendente.** A próxima ação é esperar o setup virar Active e validar com um teste real.
