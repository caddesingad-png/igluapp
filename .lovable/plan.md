Objetivo: mostrar a imagem exatamente como foi enviada — sem corte, sem zoom, sem deformação e sem fundo neutro preenchendo espaço vazio.

O que vou fazer

1. Remover o crop forçado das imagens
- O componente `ShimmerImage` hoje gera `srcset` usando transformação remota com `resize=cover`, o que entrega uma imagem já cortada do servidor mesmo quando o CSS pede `object-contain`. Vou ajustar para não forçar crop na otimização: a imagem servida vai manter a proporção original (equivalente a `contain`), apenas redimensionada por largura.
- Onde uso `object-cover` no CSS, vou trocar para `object-contain` nos previews/cards de produto e set.

2. Tirar a “moldura” quadrada e o fundo neutro dos cards
- Hoje `ProductCard.tsx` força `aspect-square` + `bg-muted`, o que cria as faixas/fundo quando a foto não é quadrada. Vou remover o quadrado fixo e o fundo, deixando o container se ajustar à proporção real da foto. O card continua com largura fixa da grid, mas a altura passa a respeitar a imagem original.
- Mesma lógica aplicada nos previews onde o usuário precisa ver a foto inteira:
  - `src/pages/AddProduct.tsx` (preview do upload)
  - `src/pages/ProductReview.tsx` (preview do upload)
  - `src/pages/ProductDetail.tsx` (foto principal)
  - `src/pages/SetDetail.tsx` (capa)
  - `src/pages/SetForm.tsx` (capa)
  - `src/pages/PublicSetView.tsx` (capa)
  - `src/pages/Sets.tsx` (capa do set na listagem)

3. Manter intacto só onde faz sentido
- Avatares circulares e a stream do scanner continuam como estão, porque ali o crop é parte do design e não tem foto de produto envolvida.
- Miniaturas muito pequenas usadas como “chips” (ex.: avatar do criador no feed) também continuam como estão, pois não são a foto principal do produto.

4. Considerações de layout
- Sem `aspect-square`, a grid de produtos pode ficar com cards de alturas diferentes. Vou usar layout em colunas (estilo masonry simples com `columns-2`) na biblioteca para acomodar isso de forma natural, mantendo a estética minimalista.
- Não vou adicionar nenhum fundo neutro novo. Onde o container atual tinha `bg-muted` só para preencher faixas, esse fundo será removido.

Resultado esperado
- A imagem aparece exatamente como foi enviada: proporção original, sem corte, sem zoom, sem fundo extra.
- O card se adapta à foto, em vez da foto se adaptar ao card.