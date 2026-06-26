## Estado atual da segurança

Boa notícia: o trabalho da última rodada deixou o app em ótimo estado. Validei agora:

- **Linter do banco**: 0 problemas.
- **Dependências npm**: 0 vulnerabilidades high/critical.
- **Scan fresco anterior**: só 3 warns informativos (avatares públicos por design, contagem de likes em sets públicos).

Mas o painel ainda mostra findings antigos porque ninguém os marcou como resolvidos. E descobri **1 bug real** que escapou.

## O que vou fazer

### 1. Corrigir bug real — política de upload de avatar (warn, mas explorável)

Hoje a política do bucket faz:
```
auth.uid()::text = replace(storage.filename(name), '.jpg', '')
```
Isso só remove `.jpg`. Se o usuário A subir `avatars/<uid-do-B>.png` (ou `.webp`), o `replace` não tira nada, e como `<uid-do-B>.png ≠ <uid-do-A>`, a checagem falha — **bom no INSERT**, mas o problema é o inverso: A pode subir `avatars/<uid-do-A>.png` e depois um arquivo chamado literalmente `<uid-do-A>` (sem extensão) para qualquer caminho que comece com `avatars/`, e variações com outras extensões aceitam só se o nome bater. O risco real é overwrite por colisão de nomes em extensões não previstas + inconsistência com o resto do app (que usa pasta-por-userId).

**Migration**: trocar as 2 políticas (INSERT e UPDATE) para o padrão folder-based já usado em product-photos:
```sql
DROP POLICY "Users can upload their own avatar" ON storage.objects;
DROP POLICY "Users can update their own avatar" ON storage.objects;

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'product-photos'
  AND (storage.foldername(name))[1] = 'avatars'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE TO authenticated USING (
  bucket_id = 'product-photos'
  AND (storage.foldername(name))[1] = 'avatars'
  AND (storage.foldername(name))[2] = auth.uid()::text
) WITH CHECK (
  bucket_id = 'product-photos'
  AND (storage.foldername(name))[1] = 'avatars'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
```
Novo caminho: `avatars/{userId}/avatar.jpg` (ou qualquer extensão/nome).

**Código frontend**: atualizar o lugar único que sobe avatar para usar o novo path (`avatars/${user.id}/avatar.<ext>`) e atualizar `profiles.avatar_url`. Vou identificar o componente exato e adaptar — sem mudar UX.

### 2. Marcar findings antigos como resolvidos no painel

Já foram corrigidos na rodada passada, mas o painel ainda lista:
- `profiles_public_readable` (error) → `profiles` foi fechado, leitura pública só via view `profiles_public`.
- `set_likes_no_select_for_public` (warn) → era falso positivo do próprio scanner.
- `SUPA_anon_security_definer_function_executable` + `SUPA_authenticated_*` (warn) → `REVOKE EXECUTE` aplicado nas funções trigger.
- `SUPA_public_bucket_allows_listing` (warn) → política de listing trocada.

Vou chamar `manage_security_finding` em batch com `mark_as_fixed` + explicação por item.

### 3. Atualizar security memory

Adicionar nota sobre o novo padrão `avatars/{userId}/` para o scanner não voltar a flagar o esquema antigo.

## O que NÃO vou fazer

- Não vou mexer em coisas já intencionais (bucket público por URL direta, avatares visíveis no feed social, likes_count em sets públicos).
- Não vou configurar e-mails com domínio próprio (você não tem domínio ainda — quando tiver, é outra rodada).
- Não vou adicionar rate-limit custom nas edge functions além do que a Lovable AI Gateway já oferece.

## Resultado esperado

Após essa rodada: 0 findings de error, 0 warns acionáveis, painel limpo, política de avatar consistente com o resto do storage.
