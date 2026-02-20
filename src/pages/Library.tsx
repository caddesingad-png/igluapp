import { useEffect, useState, useMemo, useCallback } from "react";
import { Plus, LayoutGrid, List, Search, SlidersHorizontal, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ProductCard from "@/components/ProductCard";
import igluLogo from "@/assets/iglu-logo.svg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sparkles } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  purchase_price: number;
  photo_url: string | null;
  pao_months: number;
  purchase_date: string;
  usage_frequency: string;
  is_favorite: boolean;
  created_at: string;
  sort_order: number | null;
  current_color?: string | null;
}

const CATEGORIES = [
  "Todas", "Base", "Batom", "Sombra", "Blush", "Máscara",
  "Corretivo", "Iluminador", "Contorno", "Primer", "Fixador", "Outro",
];

const SORT_OPTIONS = [
  { value: "custom", label: "Personalizado" },
  { value: "date_desc", label: "Mais recentes" },
  { value: "date_asc", label: "Mais antigas" },
  { value: "price_desc", label: "Preço: maior → menor" },
  { value: "price_asc", label: "Preço: menor → maior" },
  { value: "name_asc", label: "Nome A → Z" },
  { value: "favorites", label: "Favoritas primeiro" },
];

// ─── Sortable wrappers ────────────────────────────────────────────────────────

const SortableGridItem = ({
  product,
  onClick,
}: {
  product: Product;
  onClick: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: product.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: "relative",
      }}
    >
      {/* Drag handle overlay (top-left) — aria-hidden so no text leaks */}
      <div
        {...attributes}
        {...listeners}
        aria-hidden="true"
        className="absolute top-2 left-2 z-10 w-6 h-6 flex items-center justify-center rounded bg-background/60 touch-none cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
        style={{ WebkitUserSelect: "none", userSelect: "none" }}
      >
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <ProductCard product={product} viewMode="grid" onClick={onClick} />
    </div>
  );
};

const SortableListItem = ({
  product,
  onClick,
}: {
  product: Product;
  onClick: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: product.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <div
        {...attributes}
        {...listeners}
        className="shrink-0 w-7 h-7 flex items-center justify-center text-muted-foreground touch-none cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <ProductCard product={product} viewMode="list" onClick={onClick} />
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const Library = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [sortBy, setSortBy] = useState("custom");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  useEffect(() => {
    if (!user) return;
    const fetchProducts = async () => {
      const [productsRes, colorsRes] = await Promise.all([
        supabase
          .from("products" as any)
          .select("id, name, brand, category, purchase_price, photo_url, pao_months, purchase_date, usage_frequency, is_favorite, created_at, sort_order")
          .eq("user_id", user.id),
        supabase
          .from("product_color_codes" as any)
          .select("product_id, code")
          .eq("user_id", user.id)
          .eq("is_current", true),
      ]);

      if (!productsRes.error && productsRes.data) {
        const currentByProduct: Record<string, string> = {};
        if (!colorsRes.error && colorsRes.data) {
          for (const row of colorsRes.data as any[]) {
            currentByProduct[row.product_id] = row.code;
          }
        }
        const mapped = (productsRes.data as any[]).map((p) => ({
          ...p,
          current_color: currentByProduct[p.id] ?? null,
        }));
        // Sort by sort_order initially
        mapped.sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999));
        setProducts(mapped);
      }
      setLoading(false);
    };
    fetchProducts();
  }, [user]);

  const filtered = useMemo(() => {
    let result = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== "Todas") {
      result = result.filter((p) => p.category === selectedCategory);
    }
    if (sortBy !== "custom") {
      result.sort((a, b) => {
        switch (sortBy) {
          case "date_desc": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case "date_asc": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case "price_desc": return b.purchase_price - a.purchase_price;
          case "price_asc": return a.purchase_price - b.purchase_price;
          case "name_asc": return a.name.localeCompare(b.name);
          case "favorites": return (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0);
          default: return 0;
        }
      });
    }
    return result;
  }, [products, search, selectedCategory, sortBy]);

  const isDraggable = sortBy === "custom" && !search.trim() && selectedCategory === "Todas";

  const persistOrder = useCallback(
    async (orderedIds: string[]) => {
      if (!user) return;
      const updates = orderedIds.map((id, i) =>
        supabase.from("products" as any).update({ sort_order: i + 1 } as any).eq("id", id).eq("user_id", user.id)
      );
      await Promise.all(updates);
    },
    [user]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setProducts((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id);
      const newIndex = prev.findIndex((p) => p.id === over.id);
      const next = arrayMove(prev, oldIndex, newIndex);
      persistOrder(next.map((p) => p.id));
      return next;
    });
  };

  const isEmpty = !loading && products.length === 0;
  const noResults = !loading && products.length > 0 && filtered.length === 0;

  return (
    <div className="min-h-screen pb-24 bg-background screen-enter">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border" style={{ height: "56px" }}>
        <div className="max-w-lg mx-auto px-6 h-full flex items-center justify-between">
          <img
            src={igluLogo}
            alt="IGLU"
            className="h-[22px]"
            style={{ filter: "brightness(0) saturate(100%) invert(10%) sepia(8%) saturate(800%) hue-rotate(340deg) brightness(90%) contrast(90%)" }}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="w-8 h-8 flex items-center justify-center text-foreground"
            >
              {viewMode === "grid" ? <List className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <LayoutGrid className="w-[18px] h-[18px]" strokeWidth={1.5} />}
            </button>
            <button
              onClick={() => navigate("/add-product")}
              className="w-8 h-8 flex items-center justify-center text-foreground"
            >
              <Plus className="w-[20px] h-[20px]" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Search + filters */}
      <div className="max-w-lg mx-auto px-6 pt-4 pb-2 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" strokeWidth={1.5} />
          <input
            placeholder="Buscar por nome ou marca…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-[44px] pl-9 pr-9 rounded-md border border-border bg-card text-[14px] font-body text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1 pb-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 h-8 px-3.5 rounded-sm font-body text-[12px] uppercase tracking-[0.08em] transition-colors ${
                  selectedCategory === cat
                    ? "bg-foreground text-btn-dark-fg"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`shrink-0 h-8 w-8 flex items-center justify-center rounded-sm transition-colors ${
                  sortBy !== "custom" ? "bg-foreground text-btn-dark-fg" : "bg-muted text-muted-foreground"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                {SORT_OPTIONS.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-sm font-body">
                    {opt.label}
                    {opt.value === "custom" && (
                      <span className="ml-1.5 text-[10px] text-muted-foreground">arraste ✦</span>
                    )}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Hint when drag is active */}
        {isDraggable && products.length > 1 && (
          <p className="font-body text-[11px] text-muted-foreground flex items-center gap-1.5">
            <GripVertical className="w-3 h-3" strokeWidth={1.5} />
            Segure e arraste para reordenar
          </p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center pt-32">
          <div className="w-6 h-6 border-[1.5px] border-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center px-6 pt-32 animate-fade-in text-center">
          <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-6">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h2 className="font-display text-[20px] font-normal text-foreground mb-3">Sua coleção está vazia</h2>
          <p className="font-body font-light text-[14px] text-muted-foreground leading-relaxed max-w-[240px] mb-8">
            Comece a construir sua biblioteca de beleza adicionando seu primeiro produto
          </p>
          <Button onClick={() => navigate("/add-product")} className="gap-2 px-8">
            <Plus className="w-4 h-4" />
            Adicionar primeiro produto
          </Button>
        </div>
      )}

      {/* No results */}
      {noResults && (
        <div className="flex flex-col items-center justify-center px-6 pt-24 text-center">
          <p className="font-body text-[14px] text-muted-foreground">Nenhum produto encontrado</p>
          <button
            onClick={() => { setSearch(""); setSelectedCategory("Todas"); }}
            className="font-body text-[13px] text-foreground mt-2 underline underline-offset-2"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {/* Products */}
      {!loading && filtered.length > 0 && (
        <div className="max-w-lg mx-auto px-6 pt-4 animate-fade-in">
          <p className="font-body text-[11px] text-muted-foreground uppercase tracking-[0.08em] mb-3">
            {filtered.length} produto{filtered.length !== 1 ? "s" : ""}
            {selectedCategory !== "Todas" && ` · ${selectedCategory}`}
          </p>

          {isDraggable ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={filtered.map((p) => p.id)}
                strategy={viewMode === "grid" ? rectSortingStrategy : verticalListSortingStrategy}
              >
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-2 gap-3">
                    {filtered.map((product) => (
                      <SortableGridItem
                        key={product.id}
                        product={product}
                        onClick={() => navigate(`/product/${product.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {filtered.map((product) => (
                      <SortableListItem
                        key={product.id}
                        product={product}
                        onClick={() => navigate(`/product/${product.id}`)}
                      />
                    ))}
                  </div>
                )}
              </SortableContext>
            </DndContext>
          ) : (
            viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-3">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} viewMode="grid" onClick={() => navigate(`/product/${product.id}`)} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} viewMode="list" onClick={() => navigate(`/product/${product.id}`)} />
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default Library;
