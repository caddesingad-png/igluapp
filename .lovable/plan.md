## Re-skin do IGLU — "Soft Atelier"

A essência atual (luxo discreto, beige + dourado, serif editorial) fica. O que muda é a **textura da interface**: sai o flat editorial com sombras secas, entra um sistema mais arejado, com superfícies macias que parecem esculpidas em porcelana, vidro fosco com gradiente sutil e profundidade tátil de wellness app.

A direção mistura os 4 referenciais que você pediu sem virar pastiche:
- **Soft Minimalism** dá a base — tipografia generosa, hierarquia clara, muito ar.
- **Neumorphism** entra só nas superfícies táteis (cards de produto, BottomNav, switches) — sombra dupla muito suave, nada de relevos pesados.
- **Wellness App UI** define a paleta — neutros quentes com toques de aurora pêssego/rosa pó/menta gelo.
- **Glassmorphism Soft Gradient** aparece nos headers fixos, sheets e overlays — blur + gradiente translúcido sobre um fundo com uma "aura" de cor.

A regra é gastar a ousadia em **um lugar**: a aura de gradiente do fundo + os cards "porcelana" são o signature. Tudo o mais fica disciplinado.

---

### Thesis visual

**Subject**: um caderno-altar de maquiagem pessoal. Toque suave, ritual, autocuidado.
**Risco assumido**: trocar o fundo beige chapado por uma **aura de gradiente** (peach → blush → mist) fixa no viewport com blur enorme, vista através de glass panels. O fundo respira; os cards flutuam sobre ele.

### Tokens (index.css)

Trocas em HSL (mantém o sistema semântico atual, sem hardcode em componentes):

```text
--background:      32 40% 96%    /* warm porcelain */
--foreground:      25 18% 14%    /* espresso suave, não preto */
--card:             0  0% 100%   /* porcelana pura translúcida */
--muted:           32 25% 92%
--muted-foreground: 25 10% 45%
--border:          30 20% 88%
--ring:            18 55% 72%

/* Aurora accents — usados como gradiente, não como blocos */
--aura-peach:      18 80% 82%    /* #FAC9A8 */
--aura-blush:     340 65% 88%    /* #F4CFDB */
--aura-mist:      170 35% 86%    /* #C9E4DD */
--aura-cream:      42 60% 92%    /* #F7EBD5 */

/* Primary vira pêssego morno em vez de dourado seco */
--primary:         18 55% 68%    /* #E8A88A — peach */
--primary-foreground: 25 18% 14%

/* Gold antigo preservado como acento secundário (favoritos, selos) */
--accent-gold:     38 47% 60%

/* Gradientes nomeados */
--gradient-aura:   radial-gradient(60% 50% at 20% 10%, hsl(var(--aura-peach)/0.55), transparent 60%),
                   radial-gradient(55% 45% at 90% 30%, hsl(var(--aura-blush)/0.45), transparent 65%),
                   radial-gradient(70% 60% at 50% 100%, hsl(var(--aura-mist)/0.40), transparent 70%);
--gradient-glass:  linear-gradient(180deg, hsl(0 0% 100%/0.72), hsl(0 0% 100%/0.45));

/* Sombras soft-neumorphic — dupla, baixa opacidade */
--shadow-soft:     8px 8px 24px hsl(25 20% 70% / 0.18),
                  -8px -8px 24px hsl(0 0% 100% / 0.9);
--shadow-soft-sm:  4px 4px 12px hsl(25 20% 70% / 0.14),
                  -4px -4px 12px hsl(0 0% 100% / 0.85);
--shadow-soft-inset: inset 3px 3px 8px hsl(25 20% 70% / 0.18),
                     inset -3px -3px 8px hsl(0 0% 100% / 0.9);
--shadow-glass:    0 8px 32px hsl(25 30% 40% / 0.10);

--radius: 1.25rem    /* 20px — base muito mais soft */
```

Dark mode recebe versões equivalentes com porcelana → "noite morna" (#1C1916) e auras dessaturadas. Mantenho `--accent-gold` como ele é.

### Tipografia

Mantém a alma editorial mas suaviza:
- **Display**: troco `Playfair Display` por **`Fraunces`** (variável, com `opsz` e `soft`=100) — mesma família serif elegante, porém com cortes mais arredondados e modernos, perfeita para wellness premium.
- **Body**: `DM Sans` fica (já performa bem) — peso 400 padrão, 500 para ênfase.
- **Numeric/meta**: adiciono `Fraunces` em `font-feature-settings: "tnum"` para preços, mantendo coerência sem importar uma 3ª família.
- Escala: H1 `clamp(28px, 6vw, 40px)`, eyebrow 10px tracking 0.16em, body 14px.

### Signature: a "aura"

Em `body::before`, fixed, full-viewport, `background: var(--gradient-aura)`, `filter: blur(80px)`, `opacity: 0.85`. Não rola junto. Todo o resto do app vive sobre ela usando glass panels.

### Componentes — o que muda

| Componente | Antes | Depois |
|---|---|---|
| **Body / fundo** | beige chapado | Aura gradiente fixa + porcelana |
| **Sticky headers** (Library, Sets, History, Profile, ProductDetail) | `bg-background` opaco | `.glass-header` = `backdrop-blur-xl bg-white/55 border-b border-white/40` |
| **BottomNav** | borda + sombra para cima | Pílula flutuante glass: `mx-4 mb-[safe] rounded-full bg-white/60 backdrop-blur-xl shadow-glass`, ícone ativo num "poço" neumórfico (`shadow-soft-inset`) com tinta peach |
| **ProductCard** | borda 12px + shadow seca | "Porcelana": `rounded-3xl bg-white/80 backdrop-blur-sm shadow-soft`, sem borda, hover `shadow-soft-sm + translate-y-[-2px]`, press `shadow-soft-inset` |
| **Botões primários** | preto chapado | Variante `pebble`: pílula `rounded-full`, gradiente peach→blush sutil, `shadow-soft`, press afunda (`shadow-soft-inset`) |
| **Botões secundários** | borda fina | Ghost-glass: `bg-white/40 backdrop-blur border border-white/60` |
| **Inputs / Textarea** | borda + bg branco | Neumórfico inset: `bg-background shadow-soft-inset border-0 rounded-2xl` |
| **Switch / Checkbox / Radio** | shadcn default | Track com `shadow-soft-inset`, thumb com `shadow-soft-sm` |
| **Tabs / Chips de categoria** | retângulo `bg-muted` | Pílulas com `shadow-soft-sm`; ativo afunda (`shadow-soft-inset` + foreground) |
| **Sheets / Drawer / Dialog** | card opaco | `bg-white/70 backdrop-blur-2xl rounded-t-[32px] shadow-glass` |
| **Toast / Sonner** | card sólido | Glass pill com leve gradiente |
| **Skeletons / ShimmerImage** | shimmer cinza | Shimmer perolado (branco→aura-cream→branco) |
| **Loader global (Splash)** | logo pulsando | Logo dentro de "moeda" porcelana com `shadow-soft` respirando |
| **Empty states** | ícone Lucide cinza | Mesmo ícone num círculo porcelana neumórfico, fundo com aura visível |
| **Status dots** | verde/amarelo/vermelho saturados | Versões "pastel": menta, peach, blush-clay |
| **Tags PAO / categoria** | `bg-muted` retangular | Pílula `bg-white/60 backdrop-blur shadow-soft-sm` |

### Microinterações

- Press universal: `transition-shadow 180ms ease`, troca `shadow-soft` por `shadow-soft-inset` no `:active` em vez do `scale-98` atual — sensação tátil real, não cartoonesca.
- Hover em cards: `translateY(-2px)` + reforço do shadow.
- Page transitions: o `screen-fade` atual ganha `translateY(6px)` e duração 240ms.
- BottomNav: ao trocar de tab, o "poço" do ativo desliza horizontalmente com `transition-all 280ms cubic-bezier(0.22, 1, 0.36, 1)`.
- Respeitar `prefers-reduced-motion`: sem aura blur animada, sem translate.

### Arquivos a editar

1. `src/index.css` — substituir tokens, adicionar utilities `.glass`, `.glass-header`, `.aura-bg`, `.shadow-soft*`, `.pebble` e o `body::before` da aura.
2. `tailwind.config.ts` — novos `borderRadius` (base 1.25rem, full), novos `boxShadow` (soft, soft-sm, soft-inset, glass), nova family `fraunces`, cores `aura-*` e `accent-gold`.
3. `index.html` — trocar import de Fonts (remover Playfair, adicionar Fraunces variável) e ajustar `theme-color` para o novo porcelain.
4. `src/components/BottomNav.tsx` — pílula glass flutuante com indicador neumórfico.
5. `src/components/ProductCard.tsx` — superfície porcelana + chips pílula.
6. `src/components/ui/button.tsx` — adicionar variantes `pebble` (primary) e `ghost-glass`; manter as existentes para não quebrar chamadas atuais.
7. `src/components/ui/input.tsx`, `textarea.tsx`, `select.tsx`, `switch.tsx`, `checkbox.tsx`, `radio-group.tsx`, `tabs.tsx`, `badge.tsx` — encostar nos tokens novos (sem mudar API).
8. `src/components/ui/sheet.tsx`, `drawer.tsx`, `dialog.tsx`, `toast.tsx`, `sonner.tsx` — superfícies glass + radius 32px no topo.
9. `src/components/ShimmerImage.tsx` + `src/components/SkeletonCard.tsx` / `SkeletonProductDetail.tsx` / `SkeletonSetDetail.tsx` — shimmer perolado.
10. `src/components/Onboarding.tsx` — aura visível, botão pebble, dots ativos com shadow-inset.
11. `src/pages/*` (Library, Sets, History, Profile, UserProfile, ProductDetail, SetDetail, AddProduct, SetForm, ProductReview, Auth, Onboarding, Terms, Privacy, NotFound) — aplicar `glass-header` nos headers fixos, remover `bg-background` redundante onde a aura precisa aparecer, padding rítmico, FAB "Adicionar" como pebble flutuante na Library.
12. `src/App.tsx` — splash com logo em moeda porcelana.

### O que NÃO muda (preservar a essência)

- Estrutura de navegação (BottomNav com as 5 abas atuais).
- Português + BRL.
- Acento `--accent-gold` mantido para favoritos (coração), selos de "atual" em cores e ícones premium — vira o detalhe quente em meio à paleta fria-quente.
- Hierarquia editorial dos títulos (display serif grande, eyebrow uppercase).
- Todos os comportamentos, rotas, dados, edge functions, RLS, safe-areas e PWA continuam exatamente como estão.

### Quality bar antes de finalizar

- Contraste AA em todos os tokens (texto sobre porcelana e sobre glass-header sobre aura).
- Dark mode equivalente: aura escurece para "noite morna", glass vira `bg-black/40`.
- `prefers-reduced-motion`: desliga translate/blur animations.
- Sem cor hardcoded em nenhum componente — tudo via tokens.
- Build typecheck limpo; sem regressão de safe-area.

### Fora de escopo

- Reescrita de lógica/edge functions/queries.
- Novos recursos.
- Mudança de fluxo, copy ou idioma.

Se aprovar, eu já implemento direto — começando por `index.css` + `tailwind.config.ts` + `index.html` (a base do sistema), depois `BottomNav` + `ProductCard` + variantes de Button (os componentes mais visíveis), e por fim varro os pages e os primitives shadcn restantes.
