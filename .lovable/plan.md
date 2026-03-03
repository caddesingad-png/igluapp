

## Auditoria Completa do IGLU App

Analisei todas as telas, componentes, estilos, arquitetura e UX do app. Aqui vai a auditoria organizada por categoria, com os problemas encontrados e as soluções propostas.

---

### 1. BRANDING & CONSISTENCIA

**Problema: Referencias antigas ao "Glambook"**
- `PublicSetView.tsx` linha 101: OG meta ainda diz `"${setData.name} — Glambook"`
- `PublicSetView.tsx` linhas 199-205: Footer diz `"✨ Glambook"` e texto em ingles
- Deve ser atualizado para "IGLU" em todos os lugares

**Problema: Textos misturados PT-BR / EN**
- `SetForm.tsx`: labels em ingles ("Set name *", "Occasion", "Products", "Save", "Search products...")
- `SetDetail.tsx`: "Set not found" em ingles
- `PublicSetView.tsx`: "Public set", "Share", "products" em ingles
- `ProductDetail.tsx`: Placeholders em ingles ("Add a note...")
- `DiscoverFeed.tsx`: "Usuária" (ok) mas mistura com labels em EN
- **Solucao**: Padronizar tudo em PT-BR

---

### 2. UX & HIERARQUIA VISUAL

**Problema: ProductReview nao deveria ter seta de voltar na BottomNav**
- A tela de Review esta acessivel via BottomNav, mas tem uma seta `ArrowLeft` no header que chama `navigate(-1)`. Telas de BottomNav nao devem ter seta de voltar (Library, Sets, History, Profile nao tem). O header deve seguir o mesmo padrao das outras telas raiz.
- **Solucao**: Remover ArrowLeft, usar header padrao com logo IGLU a esquerda

**Problema: Inconsistencia nos headers**
- Library: logo + icones (list/grid, +)
- Sets: logo + tabs + botao +
- History: logo + tabs
- ProductReview: **seta voltar + logo** (inconsistente)
- Profile: logo + "Meu Perfil" + settings
- **Solucao**: ProductReview deve seguir o padrao das outras telas raiz

**Problema: Loading spinners inconsistentes**
- Library: `border-foreground border-t-transparent` (estilo A)
- ProductDetail: `border-primary border-t-transparent` (estilo B)
- AddProduct loading: `border-primary border-t-transparent` (estilo B)
- **Solucao**: Criar componente `LoadingSpinner` unificado ou padronizar todos para usar o logo IGLU pulsante (como ja esta no App.tsx global)

**Problema: BottomNav sem labels**
- Apenas icones sem texto, o que pode confundir usuarios. Apps de referencia (Instagram, Pinterest) usam icones + labels ou pelo menos labels em primeiro acesso.
- **Solucao**: Adicionar labels pequenos abaixo dos icones na BottomNav

---

### 3. ARQUITETURA & CODIGO

**Problema: `as any` excessivo no Supabase**
- Praticamente todas as queries usam `supabase.from("tabela" as any) as any`. Isso indica que as tabelas nao estao tipadas no `types.ts` auto-gerado. Nao ha o que fazer sobre isso diretamente (types.ts e auto-gerado), mas os casts podem ser centralizados em hooks customizados para limpar o codigo.
- **Solucao**: Criar hooks como `useProducts()`, `useSets()`, `usePurchases()` usando React Query, centralizando as queries e eliminando duplicacao

**Problema: Nenhuma tela usa React Query**
- Todas as telas fazem `useState + useEffect + fetch manual`. Isso significa: sem cache, sem refetch automatico, sem deduplicacao de requests, sem loading states reaproveitaveis.
- O `QueryClientProvider` ja esta configurado no App.tsx mas nao e usado em nenhum lugar.
- **Solucao**: Migrar gradualmente para `useQuery`/`useMutation` do TanStack Query

**Problema: Duplicacao de interfaces**
- `Product` e definida separadamente em Library, ProductDetail, ProductCard, SetForm, etc. Todas com campos ligeiramente diferentes.
- **Solucao**: Criar `src/types/index.ts` com interfaces compartilhadas

**Problema: `App.css` nao e usado**
- O arquivo contem estilos de template Vite (logo-spin, `.read-the-docs`) que nao sao usados no app.
- **Solucao**: Deletar `App.css`

---

### 4. PERFORMANCE

**Problema: Nenhuma lazy loading de rotas**
- Todas as paginas sao importadas estaticamente no App.tsx. Em um app com 12+ paginas, isso afeta o bundle size inicial.
- **Solucao**: Usar `React.lazy()` + `Suspense` para rotas

**Problema: Imagens sem otimizacao de tamanho**
- ProductCard mostra thumbnails em grid (aspect-square, ~170px), mas carrega a imagem full-size do storage.
- **Solucao**: Usar Supabase Image Transformation ou gerar thumbnails no upload

---

### 5. SEGURANCA & ACESSIBILIDADE

**Problema: `PublicSetView` nao filtra por `is_public`**
- Na verdade filtra sim (`.eq("is_public", true)`), esta ok.

**Problema: Botoes sem `aria-label`**
- Botoes apenas com icone (heart, share, edit, delete, navigation) nao tem `aria-label`.
- **Solucao**: Adicionar aria-labels nos botoes de icone

**Problema: Cores hardcoded no SetDetail**
- Linhas com `color: "#8C8480"`, `color: "#1A1714"`, `backgroundColor: "#E8E2DC"` em vez de usar as CSS variables do tema.
- **Solucao**: Substituir por `text-muted-foreground`, `text-foreground`, `border-border` etc.

---

### 6. POLISH FINAL — PRIORIZADO

Aqui o que recomendo implementar para a versao final, por ordem de impacto:

| # | Item | Impacto | Esforco |
|---|------|---------|---------|
| 1 | Traduzir todos os textos EN → PT-BR | Alto | Baixo |
| 2 | Corrigir "Glambook" → "IGLU" no PublicSetView | Alto | Baixo |
| 3 | Remover ArrowLeft do ProductReview (tela raiz) | Medio | Baixo |
| 4 | Adicionar labels na BottomNav | Medio | Baixo |
| 5 | Deletar App.css nao utilizado | Baixo | Baixo |
| 6 | Padronizar loading spinners com logo IGLU | Medio | Medio |
| 7 | Substituir cores hardcoded por CSS vars no SetDetail | Medio | Baixo |
| 8 | Adicionar aria-labels nos botoes de icone | Medio | Medio |
| 9 | Criar types compartilhados | Medio | Medio |
| 10 | Migrar para React Query (gradual) | Alto | Alto |
| 11 | Lazy loading de rotas | Medio | Baixo |

**Recomendacao**: Implementar itens 1-7 agora (alto impacto, baixo esforco). Itens 8-11 podem ser feitos incrementalmente.

