## Objetivo

Fechar as 3 lacunas que faltam para deixar o login "perfeito": **Apple Sign-in**, **conformidade LGPD** (termos + privacidade + exclusão de conta) e **emails de auth com a marca IGLU**.

## 1. Apple Sign-in

- Habilitar o provider Apple via Cloud (gerenciado, sem precisar de credenciais Apple Developer próprias agora).
- Adicionar botão **"Continuar com Apple"** na tela `src/pages/Auth.tsx`, abaixo do botão Google, com ícone oficial da Apple, mesmo estilo neutro/minimalista (botão preto com texto branco — padrão Apple HIG).
- Mesma função `handleOAuth("apple"|"google")` (refatorar para evitar código duplicado).
- Tratamento de erros em PT-BR (já temos o helper `translateError`).

> Mais tarde, quando publicar na App Store, você pode trocar para credenciais Apple Developer próprias (BYOC) — eu aviso quando for a hora.

## 2. LGPD — Termos, Privacidade e Exclusão de Conta

### 2a. Páginas estáticas (rotas públicas)
- `src/pages/Terms.tsx` em `/termos` — Termos de Uso
- `src/pages/Privacy.tsx` em `/privacidade` — Política de Privacidade
- Conteúdo inicial baseado em template padrão de app brasileiro de coleção pessoal (sem coleta sensível, sem revenda de dados). Você poderá editar o texto livremente.
- Layout: tipografia luxo IGLU, header com voltar, navegação por âncoras das seções.
- Adicionar links no rodapé do `src/pages/Auth.tsx` e no perfil.

### 2b. Checkbox no cadastro
- Em `Auth.tsx` (modo cadastro), adicionar checkbox obrigatório:
  > "Li e aceito os [Termos de Uso] e a [Política de Privacidade]"
- Botão "Criar conta" fica desabilitado até marcar.
- Validar também antes de Google/Apple sign-up (mostrar antes do redirect).

### 2c. Exclusão de conta
- Adicionar seção "Excluir minha conta" em `src/pages/UserProfile.tsx` (visível apenas para o próprio usuário, no fim da página).
- Diálogo de confirmação dupla ("Digite EXCLUIR para confirmar").
- Edge Function `delete-account` (com `verify_jwt = true`) que usa service role para:
  - Deletar storage (avatar + product-photos do usuário)
  - Deletar registros do usuário em todas as tabelas (`products`, `sets`, `set_layers`, etc. — cascata já existente nos foreign keys cobre a maioria)
  - `auth.admin.deleteUser(userId)` no final
- Após sucesso: logout + redirect para `/auth` com toast de confirmação.

## 3. Emails de auth com marca IGLU

Pré-requisito: configurar um domínio de envio. Você precisa ter um domínio próprio (ex.: `iglu.app`, `igluapp.com.br`) com acesso ao DNS. Depois:
- Configurar o domínio de email no Cloud (adiciona um subdomínio tipo `notify.seudominio.com` para envio).
- Gerar templates customizados para: confirmação de cadastro, recuperação de senha, magic link, convite, mudança de email.
- Aplicar identidade IGLU: paleta neutra/bege/dourado (#C9A96E), tipografia display, copy em PT-BR amigável ("Olá! Confirme seu e-mail para começar a montar sua coleção ✨").
- Logo IGLU no topo de cada email.

**Importante:** essa parte só funciona depois que você fornecer um domínio. Se preferir, deixo essa parte para o final — aviso pra você setar o domínio quando chegar a vez.

## Ordem de implementação

1. Apple Sign-in (rápido)
2. Páginas Termos + Privacidade + links + checkbox
3. Exclusão de conta (edge function + UI)
4. Pausa para você configurar domínio de email
5. Templates de email branded

## O que NÃO entra
- Captcha (você optou por não)
- Login por SMS
- "Sair de todos os dispositivos" (posso adicionar depois se quiser)
