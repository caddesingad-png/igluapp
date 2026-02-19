import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, ShoppingBag, Store, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PurchaseEntry {
  id: string;
  price: number;
  color_code: string | null;
  purchase_date: string;
  store: string | null;
  notes: string | null;
  product_id: string;
  product_name: string;
  product_brand: string;
  product_category: string;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

const formatDate = (dateStr: string) =>
  new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

// Group purchases by month label
const groupByMonth = (entries: PurchaseEntry[]) => {
  const groups: Record<string, PurchaseEntry[]> = {};
  for (const entry of entries) {
    const label = new Date(entry.purchase_date + "T00:00:00").toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
    if (!groups[label]) groups[label] = [];
    groups[label].push(entry);
  }
  return Object.entries(groups);
};

const History = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<PurchaseEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      // Fetch purchase_history joined with product names
      const { data, error } = await (supabase.from("purchase_history" as any) as any)
        .select("id, price, color_code, purchase_date, store, notes, product_id")
        .eq("user_id", user.id)
        .order("purchase_date", { ascending: false });

      if (error || !data) { setLoading(false); return; }

      // Fetch all unique product ids
      const productIds: string[] = [...new Set((data as any[]).map((d) => d.product_id))];
      const { data: products } = await (supabase.from("products" as any) as any)
        .select("id, name, brand, category")
        .in("id", productIds);

      const productMap: Record<string, { name: string; brand: string; category: string }> = {};
      for (const p of (products ?? [])) {
        productMap[p.id] = { name: p.name, brand: p.brand, category: p.category };
      }

      const merged: PurchaseEntry[] = (data as any[]).map((d) => ({
        ...d,
        product_name: productMap[d.product_id]?.name ?? "Unknown product",
        product_brand: productMap[d.product_id]?.brand ?? "",
        product_category: productMap[d.product_id]?.category ?? "",
      }));

      setPurchases(merged);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const grouped = groupByMonth(purchases);
  const totalSpend = purchases.reduce((sum, p) => sum + p.price, 0);

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border px-5 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-foreground">Purchase History</h1>
          {purchases.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {purchases.length} purchase{purchases.length !== 1 ? "s" : ""} · {formatCurrency(totalSpend)} total spent
            </p>
          )}
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center pt-32">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : purchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 pt-32 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mb-6">
            <Clock className="w-10 h-10 text-secondary-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">No purchases yet</h2>
          <p className="text-muted-foreground text-center text-sm max-w-[260px]">
            Register a purchase on any product to start tracking your spending
          </p>
        </div>
      ) : (
        <div className="max-w-lg mx-auto px-4 pt-4 space-y-6">
          {grouped.map(([month, entries]) => (
            <div key={month}>
              {/* Month header */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {month}
                </span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(entries.reduce((s, e) => s + e.price, 0))}
                </span>
              </div>

              {/* Purchase cards */}
              <div className="space-y-2">
                {entries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => navigate(`/product/${entry.product_id}`)}
                    className="w-full text-left rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <ShoppingBag className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {entry.product_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {entry.product_brand}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-sm font-bold text-foreground">
                              {formatCurrency(entry.price)}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(entry.purchase_date)}
                          </span>
                          {entry.store && (
                            <>
                              <span className="text-muted-foreground/40 text-xs">·</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                <Store className="w-3 h-3" />
                                {entry.store}
                              </span>
                            </>
                          )}
                          {entry.color_code && (
                            <>
                              <span className="text-muted-foreground/40 text-xs">·</span>
                              <span className="text-xs font-mono text-muted-foreground">
                                {entry.color_code}
                              </span>
                            </>
                          )}
                        </div>
                        {entry.notes && (
                          <p className="text-xs text-muted-foreground italic mt-1">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
