## Problema

Hoje as imagens (produtos, sets, avatar, capa) usam `object-cover`, que **preenche o container cortando as bordas** — por isso parecem "com zoom". Você quer ver a imagem inteira.

A solução é trocar para `object-contain` nos previews, mantendo a proporção original e mostrando a imagem completa (com possíveis faixas neutras nas laterais quando a proporção da foto não bate com o container).

## O que vou alterar

Substituir `object-cover` → `object-contain` (com fundo `bg-muted` quando faltar, para as faixas ficarem suaves) nos previews de imagem em:

1. **`src/components/ProductCard.tsx`** — thumbnail do card (grid e list).
2. **`src/components/DiscoverFeed.tsx`** — cards do feed.
3. **`src/pages/ProductDetail.tsx`** — foto principal do produto.
4. **`src/pages/Sets.tsx`** — capas dos sets na listagem.
5. **`src/pages/SetDetail.tsx`** — capa e thumbnails de produtos do set.
6. **`src/pages/SetForm.tsx`** — preview ao montar/editar set.
7. **`src/pages/PublicSetView.tsx`** — capa pública e thumbs.
8. **`src/pages/ProductReview.tsx`** — preview da foto enviada.
9. **`src/pages/AddProduct.tsx`** — preview da foto antes de salvar.

## O que NÃO vou mexer

- **`src/pages/UserProfile.tsx`** e **`AvatarCropModal`**: avatar é circular e tem crop dedicado — `object-cover` é o correto ali. Mantenho.
- **`BarcodeScanner.tsx`**: é a stream da câmera, precisa preencher — mantenho.

## Detalhes técnicos

- O `ShimmerImage` repassa `className`/`style`, então a troca é direta nos chamadores.
- Containers continuam com `aspect-square` / altura fixa para evitar CLS — só muda como a imagem se ajusta dentro.
- Onde já existe `bg-muted` no container, as faixas laterais ficam discretas. Vou garantir esse fundo nos poucos casos que ainda não têm.
