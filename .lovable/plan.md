# Correção de safe-areas (iPhone notch + home indicator + Android)

## Diagnóstico do print

No iPhone, o `viewport-fit=cover` já está ativo no `index.html`, mas o app **não consome as variáveis CSS `env(safe-area-inset-*)`** na maioria das telas. Resultado visível no seu print:

1. **Topo**: o header da Biblioteca (`sticky top-0`, 56px) começa colado em `top:0`, fazendo o logo IGLU sobrepor o relógio "18:59" / Dynamic Island.
2. **Base**: a `BottomNav` (fixa, 64px) não tem `padding-bottom: env(safe-area-inset-bottom)`, então a barra de gestos do iPhone sobrepõe os labels "Biblioteca / SETs / Review…".
3. **Conteúdo**: telas usam `pb-24` (96px) fixo — em iPhones modernos isso é insuficiente (nav 64 + ~34 da home bar = 98px), e o último item da lista pode ser tocado pela home bar.
4. Telas full-screen (`Auth`, `Onboarding`, `ForgotPassword`, `ResetPassword`, etc.) e modais (`SetForm`, `AddProduct`) também não respeitam os insets superior/inferior.
5. Android com gesture navigation tem o mesmo `env(safe-area-inset-bottom)` quando a PWA roda em modo standalone — a mesma correção atende ambos.

## Estratégia

Tratar safe-area como **token global**, não ad-hoc em cada arquivo. Centralizar em `index.css` e aplicar via classes utilitárias do Tailwind para não espalhar `style={{}}` inline.

### 1. `tailwind.config.ts` — adicionar utilitários de safe-area

Habilitar plugin/spacing extra:
```ts
spacing: {
  'safe-top': 'env(safe-area-inset-top)',
  'safe-bottom': 'env(safe-area-inset-bottom)',
  'safe-left': 'env(safe-area-inset-left)',
  'safe-right': 'env(safe-area-inset-right)',
}
```
Habilita classes `pt-safe-top`, `pb-safe-bottom`, etc.

### 2. `src/index.css` — classes utilitárias semânticas

```css
@layer utilities {
  .safe-top    { padding-top: env(safe-area-inset-top); }
  .safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
  .safe-x      { padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right); }
  .min-h-dvh   { min-height: 100dvh; }   /* substitui min-h-screen no mobile */
}
```
Definir CSS var `--nav-height: 64px;` e `--nav-total: calc(var(--nav-height) + env(safe-area-inset-bottom));` para uso global.

### 3. `BottomNav.tsx`

- Container ganha `padding-bottom: env(safe-area-inset-bottom)` e altura total dinâmica.
- Visualmente o "fundo claro" se estende até a borda física do device (correto pelo HIG da Apple), mas os ícones/labels ficam acima da home bar.

### 4. Headers `sticky top-0` (Library, Sets, History, Profile, Discover, etc.)

Mudar de altura fixa 56px para:
- `padding-top: env(safe-area-inset-top)`
- conteúdo do header dentro de wrapper com altura 56px constante
- background do header preenche a área do notch (look nativo)

Arquivos afetados: `Library.tsx`, `Sets.tsx`, `History.tsx`, `Profile.tsx`, `ProductReview.tsx`, `SetDetail.tsx`, `ProductDetail.tsx`, `AddProduct.tsx`, `SetForm.tsx`, `UserProfile.tsx`, `PublicSetView.tsx`.

### 5. Padding inferior das páginas com scroll

Trocar `pb-24` por `pb-[calc(6rem+env(safe-area-inset-bottom))]` (ou classe `pb-nav` definida no css). Aplicar em todas as páginas que mostram `BottomNav`.

### 6. Telas full-screen sem BottomNav (Auth, Onboarding, Forgot/Reset Password, Terms, Privacy, NotFound, Index, Offline)

- Trocar `min-h-screen` por `min-h-dvh` (resolve barra do Safari móvel "pulando").
- Adicionar `safe-top safe-bottom safe-x` no container raiz para que conteúdo (botões de login, etc.) não fique sob o notch nem sob a home bar.

### 7. Modais bottom-sheet (`SetForm`, `AddProduct` quando aplicável, `BarcodeScanner`, sheets do shadcn)

Garantir `paddingBottom: calc(<gap> + env(safe-area-inset-bottom))` nos botões "Salvar" ancorados no rodapé. Já existe parcialmente em `SetForm.tsx` — padronizar.

### 8. Toaster / Sonner

Posicionamento padrão pode ficar atrás da home bar. Ajustar offset com `env(safe-area-inset-bottom)` no `<Toaster />` para que toasts mobile fiquem acima da nav.

### 9. PWA standalone

`index.html` já tem `viewport-fit=cover`. Adicionar `<meta name="theme-color">` (claro/escuro) e `apple-mobile-web-app-status-bar-style="default"` para que a área do notch use a cor de fundo do app (sem barra preta).

## Detalhes técnicos

- **Não tocar lógica de negócio** — só estilização e estrutura de containers.
- **Sem novas dependências.**
- **Compatibilidade**: `env(safe-area-inset-*)` retorna `0` em browsers sem notch, então desktop não muda visualmente.
- **`100dvh` vs `100vh`**: `dvh` evita o pulo de altura no Safari iOS quando a barra de URL aparece/some — adotaremos em todos os layouts full-screen.
- **Validação visual**: após implementar, abrir preview em viewport 390×844 (iPhone 14) e conferir Library, BottomNav, Auth e um modal (SetForm).

## Escopo fechado

✅ Inclui: insets globais, headers, bottom nav, paddings de scroll, telas full-screen, modais, toaster, meta tags PWA.
❌ Não inclui: redesign visual, mudanças em ícones, ajustes de tipografia/cores.

Sem mudanças em backend, Edge Functions, RLS ou tipos.
