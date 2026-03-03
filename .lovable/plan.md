

## Plano: Review Inteligente de Produto antes da Compra

### O que o usuário verá

Uma nova tela/seção "Consultar Produto" acessível a partir da tela principal ou de um botão dedicado. O fluxo:

1. Usuário digita o nome do produto **ou** tira/escolhe uma foto
2. Se foto: usa a edge function `identify-product` existente para extrair nome e marca
3. App chama uma nova edge function `review-product` que:
   - Recebe nome + marca do produto consultado
   - Recebe a lista resumida dos produtos que o usuário já possui (nome, marca, categoria, preço)
   - Usa IA (Gemini) com um prompt que instrui a buscar conhecimento público sobre o produto
   - Retorna uma review estruturada com streaming

4. O resultado exibido inclui:
   - **Resumo do produto** (o que é, para que serve)
   - **O que dizem na internet** (opinião geral, prós e contras baseados em conhecimento público)
   - **Nota geral** (1-5 estrelas)
   - **Comparação com seus produtos** (se já tem algo similar, se vale a pena comprar ou é redundante)
   - **Veredicto**: "Vale a pena" / "Você já tem similar" / "Considere alternativas"

### Implementação técnica

**1. Nova edge function `review-product`**
- Recebe: `{ productName, productBrand, userProducts: [{ name, brand, category, price }] }`
- Usa `google/gemini-2.5-flash` via Lovable AI Gateway
- Prompt instrui o modelo a usar seu conhecimento sobre reviews públicos, opiniões de beauty influencers, e comparar com os produtos que o usuário já possui
- Retorna JSON estruturado via tool calling com: `summary`, `public_opinion`, `pros`, `cons`, `rating`, `comparison_verdict`, `recommendation`
- Streaming não é necessário aqui pois o resultado é estruturado

**2. Nova página `src/pages/ProductReview.tsx`**
- Input de texto para nome do produto OU botão de foto (reutiliza lógica de câmera/galeria)
- Se foto: chama `identify-product` primeiro, preenche nome/marca
- Botão "Consultar Review" dispara chamada à edge function
- Exibe resultado em cards organizados com a review, nota, prós/contras e veredicto de comparação
- Loading state com skeleton/shimmer durante a consulta (~5-8s)

**3. Rota e navegação**
- Nova rota `/review` no App.tsx
- Botão de acesso na tela principal ou na BottomNav (ícone de lupa/estrela)

**4. Dados do usuário**
- Ao abrir a tela, busca produtos do usuário no Supabase (nome, marca, categoria, preço) para enviar como contexto à IA
- Nenhuma tabela nova necessária

### Arquivos envolvidos
- `supabase/functions/review-product/index.ts` (novo)
- `src/pages/ProductReview.tsx` (novo)
- `src/App.tsx` (nova rota)
- `src/components/BottomNav.tsx` (link de acesso)
- `supabase/config.toml` (registrar nova function)

### Limitações e considerações
- A IA usa conhecimento geral (treinamento) para reviews, não faz scraping em tempo real de sites. Para a maioria dos produtos de maquiagem conhecidos, o Gemini tem bom conhecimento sobre opiniões públicas
- Se quiser reviews em tempo real de sites, seria necessário integrar Firecrawl ou Perplexity (conector disponível), mas adiciona complexidade e custo. Podemos começar sem e evoluir depois

