import { useEffect, useState, useMemo } from "react";
import { Plus, LayoutGrid, List, Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ProductCard from "@/components/ProductCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sparkles } from "lucide-react";

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
  current_color?: string | null;
}

const CATEGORIES = [
  "All",
  "Foundation",
  "Lipstick",
  "Eyeshadow",
  "Blush",
  "Mascara",
  "Concealer",
  "Highlighter",
  "Contour",
  "Primer",
  "Setting Spray",
  "Other",
];

const SORT_OPTIONS = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "price_desc", label: "Price: high → low" },
  { value: "price_asc", label: "Price: low → high" },
  { value: "name_asc", label: "Name A → Z" },
  { value: "favorites", label: "Favorites first" },
];

const Library = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("date_desc");

  useEffect(() => {
    if (!user) return;
    const fetchProducts = async () => {
      const [productsRes, colorsRes] = await Promise.all([
        (supabase.from("products" as any) as any)
          .select("id, name, brand, category, purchase_price, photo_url, pao_months, purchase_date, usage_frequency, is_favorite, created_at")
          .eq("user_id", user.id),
        (supabase.from("product_color_codes" as any) as any)
          .select("product_id, code")
          .eq("user_id", user.id)
          .eq("is_current", true),
      ]);

      if (!productsRes.error && productsRes.data) {
        // Attach current_color to each product
        const currentByProduct: Record<string, string> = {};
        if (!colorsRes.error && colorsRes.data) {
          for (const row of colorsRes.data) {
            currentByProduct[row.product_id] = row.code;
          }
        }
        setProducts(
          productsRes.data.map((p: Product) => ({
            ...p,
            current_color: currentByProduct[p.id] ?? null,
          }))
        );
      }
      setLoading(false);
    };
    fetchProducts();
  }, [user]);

  const filtered = useMemo(() => {
    let result = [...products];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
      );
    }

    // Category
    if (selectedCategory !== "All") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "date_desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "date_asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "price_desc":
          return b.purchase_price - a.purchase_price;
        case "price_asc":
          return a.purchase_price - b.purchase_price;
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "favorites":
          return (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0);
        default:
          return 0;
      }
    });

    return result;
  }, [products, search, selectedCategory, sortBy]);

  const isEmpty = !loading && products.length === 0;
  const noResults = !loading && products.length > 0 && filtered.length === 0;

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Sort";

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-foreground">Library</h1>
            <div className="flex items-center gap-1.5">
              {/* View toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="h-8 w-8"
              >
                {viewMode === "grid" ? (
                  <List className="w-4 h-4" />
                ) : (
                  <LayoutGrid className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/add-product")}
                className="rounded-full gap-1.5 h-8"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-2.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name or brand…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9 h-9 text-sm rounded-full bg-muted border-transparent focus-visible:bg-background"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter chips + Sort */}
          <div className="flex items-center gap-2">
            {/* Scrollable chips */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none flex-1 pb-0.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0 h-7 px-2.5 rounded-full text-xs gap-1 border-border">
                  <SlidersHorizontal className="w-3 h-3" />
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                  {SORT_OPTIONS.map((opt) => (
                    <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-sm">
                      {opt.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center pt-32">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center px-6 pt-32 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Your collection is empty</h2>
          <p className="text-muted-foreground text-center text-sm max-w-[260px] mb-8">
            Start building your beauty library by adding your first product
          </p>
          <Button
            onClick={() => navigate("/add-product")}
            className="rounded-full px-8 h-12 text-base font-semibold gap-2"
          >
            <Plus className="w-5 h-5" />
            Add your first product
          </Button>
        </div>
      )}

      {/* No results */}
      {noResults && (
        <div className="flex flex-col items-center justify-center px-6 pt-24 text-center">
          <p className="text-muted-foreground font-medium">No products match your search</p>
          <button
            onClick={() => { setSearch(""); setSelectedCategory("All"); }}
            className="text-sm text-primary mt-2"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Products */}
      {!loading && filtered.length > 0 && (
        <div className="max-w-lg mx-auto px-4 pt-4 animate-fade-in">
          <p className="text-xs text-muted-foreground mb-3">
            {filtered.length} product{filtered.length !== 1 ? "s" : ""}
            {selectedCategory !== "All" && ` · ${selectedCategory}`}
          </p>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  viewMode="grid"
                  onClick={() => navigate(`/product/${product.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  viewMode="list"
                  onClick={() => navigate(`/product/${product.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Library;
