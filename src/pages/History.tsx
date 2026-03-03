import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import igluLogo from "@/assets/iglu-logo.svg";
import { Clock, ShoppingBag, Store, ChevronRight, TrendingUp, TrendingDown, Minus, Pencil, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SkeletonHistoryEntry } from "@/components/SkeletonCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";

type Tab = "historico" | "financas";

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

interface ProductRow {
  id: string;
  name: string;
  purchase_price: number;
  pao_months: number;
  category: string;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatDate = (dateStr: string) =>
  new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR", {
    year: "numeric", month: "short", day: "numeric",
  });

const groupByMonth = (entries: PurchaseEntry[]) => {
  const groups: Record<string, PurchaseEntry[]> = {};
  for (const entry of entries) {
    const label = new Date(entry.purchase_date + "T00:00:00").toLocaleDateString("pt-BR", {
      year: "numeric", month: "long",
    });
    if (!groups[label]) groups[label] = [];
    groups[label].push(entry);
  }
  return Object.entries(groups);
};

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const History = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("historico");

  // Shared data
  const [purchases, setPurchases] = useState<PurchaseEntry[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [userId, setUserId] = useState("");
  const [monthlyBudget, setMonthlyBudget] = useState<number | null>(null);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setUserId(user.id);
    const load = async () => {
      const [purchaseRes, productRes, profileRes] = await Promise.all([
        (supabase.from("purchase_history" as any) as any)
          .select("id, price, color_code, purchase_date, store, notes, product_id")
          .eq("user_id", user.id)
          .order("purchase_date", { ascending: false }),
        (supabase.from("products" as any) as any)
          .select("id, name, purchase_price, pao_months, category")
          .eq("user_id", user.id),
        supabase.from("profiles").select("monthly_budget").eq("user_id", user.id).single(),
      ]);

      // enrich purchases with product info
      const productMap: Record<string, { name: string; brand: string; category: string }> = {};
      for (const p of (productRes.data ?? [])) {
        productMap[p.id] = { name: p.name, brand: p.brand, category: p.category };
      }
      setPurchases((purchaseRes.data ?? []).map((d: any) => ({
        ...d,
        product_name: productMap[d.product_id]?.name ?? "Produto desconhecido",
        product_brand: productMap[d.product_id]?.brand ?? "",
        product_category: productMap[d.product_id]?.category ?? "",
      })));
      setProducts(productRes.data ?? []);

      if (profileRes.data) {
        const budget = (profileRes.data as any).monthly_budget ?? null;
        setMonthlyBudget(budget);
        setBudgetInput(String(budget ?? ""));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const saveBudget = async () => {
    const val = parseFloat(budgetInput.replace(",", "."));
    const budget = isNaN(val) ? null : val;
    await supabase.from("profiles").update({ monthly_budget: budget } as any).eq("user_id", userId);
    setMonthlyBudget(budget);
    setEditingBudget(false);
  };

  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();

  const metrics = useMemo(() => {
    const totalSpent = purchases.reduce((s, p) => s + Number(p.price), 0);

    const thisMonthSpent = purchases
      .filter((p) => {
        const d = new Date(p.purchase_date);
        return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
      })
      .reduce((s, p) => s + Number(p.price), 0);

    const lastMonthSpent = purchases
      .filter((p) => {
        const d = new Date(p.purchase_date);
        const lm = thisMonth === 0 ? 11 : thisMonth - 1;
        const ly = thisMonth === 0 ? thisYear - 1 : thisYear;
        return d.getFullYear() === ly && d.getMonth() === lm;
      })
      .reduce((s, p) => s + Number(p.price), 0);

    const catMap: Record<string, number> = {};
    for (const p of purchases) {
      const cat = p.product_category || "Other";
      catMap[cat] = (catMap[cat] ?? 0) + Number(p.price);
    }
    const byCategory = Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const mostExpensive = [...products].sort((a, b) => b.purchase_price - a.purchase_price)[0] ?? null;

    const withCpd = products
      .filter((p) => p.pao_months > 0)
      .map((p) => ({ ...p, cpd: p.purchase_price / (p.pao_months * 30) }))
      .sort((a, b) => a.cpd - b.cpd);
    const bestCpb = withCpd[0] ?? null;

    const last6: { month: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(thisYear, thisMonth - i, 1);
      const mm = d.getMonth();
      const yy = d.getFullYear();
      const sum = purchases
        .filter((p) => {
          const pd = new Date(p.purchase_date);
          return pd.getFullYear() === yy && pd.getMonth() === mm;
        })
        .reduce((s, p) => s + Number(p.price), 0);
      last6.push({ month: MONTH_NAMES[mm], value: sum });
    }
    const avg6 = last6.reduce((s, m) => s + m.value, 0) / 6;

    return { totalSpent, thisMonthSpent, lastMonthSpent, byCategory, mostExpensive, bestCpb, last6, avg6 };
  }, [purchases, products, thisMonth, thisYear]);

  const momDiff = metrics.thisMonthSpent - metrics.lastMonthSpent;
  const momPct = metrics.lastMonthSpent > 0
    ? Math.abs(Math.round((momDiff / metrics.lastMonthSpent) * 100))
    : null;
  const budgetPct = monthlyBudget && monthlyBudget > 0
    ? Math.min(Math.round((metrics.thisMonthSpent / monthlyBudget) * 100), 100)
    : 0;
  const budgetOver = monthlyBudget ? metrics.thisMonthSpent > monthlyBudget : false;
  const budgetWarn = monthlyBudget ? metrics.thisMonthSpent >= monthlyBudget * 0.8 : false;

  const grouped = groupByMonth(purchases);

  return (
    <div className="min-h-screen pb-20 bg-background screen-enter">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border" style={{ height: "auto" }}>
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <img
            src={igluLogo}
            alt="IGLU"
            className="h-[22px]"
            style={{ filter: "brightness(0) saturate(100%) invert(10%) sepia(8%) saturate(800%) hue-rotate(340deg) brightness(90%) contrast(90%)" }}
          />
          {tab === "historico" && purchases.length > 0 && (
            <p className="font-body text-[11px] text-muted-foreground">
              {fmt(purchases.reduce((s, p) => s + p.price, 0))} total
            </p>
          )}
        </div>

        {/* Sub-tabs */}
        <div className="max-w-lg mx-auto px-6 pb-3 flex gap-1 bg-muted/40 rounded-md p-1" style={{ margin: "0 24px 12px" }}>
          <button
            onClick={() => setTab("historico")}
            className={`flex-1 py-2 rounded-sm font-body text-[12px] font-medium transition-colors ${
              tab === "historico" ? "bg-card text-foreground" : "text-muted-foreground"
            }`}
          >
            Histórico
          </button>
          <button
            onClick={() => setTab("financas")}
            className={`flex-1 py-2 rounded-sm font-body text-[12px] font-medium transition-colors ${
              tab === "financas" ? "bg-card text-foreground" : "text-muted-foreground"
            }`}
          >
            Finanças
          </button>
        </div>
      </header>

      {loading ? (
        <div className="max-w-lg mx-auto px-6 pt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonHistoryEntry key={i} />
          ))}
        </div>
      ) : tab === "historico" ? (
        /* ── HISTÓRICO ── */
        purchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 pt-32 animate-fade-in text-center">
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-6">
              <Clock className="w-7 h-7 text-muted-foreground/50" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-[20px] font-normal text-foreground mb-3">Sem compras ainda</h2>
            <p className="font-body font-light text-[14px] text-muted-foreground leading-relaxed max-w-[240px]">
              Registre uma compra em qualquer produto para começar a acompanhar seus gastos
            </p>
          </div>
        ) : (
          <div className="max-w-lg mx-auto px-6 pt-6 space-y-8">
            {grouped.map(([month, entries]) => (
              <div key={month}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="label-overline">{month}</span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="font-body text-[12px] text-muted-foreground">
                    {fmt(entries.reduce((s, e) => s + e.price, 0))}
                  </span>
                </div>
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => navigate(`/product/${entry.product_id}`)}
                      className="w-full text-left rounded-xl border border-border bg-card px-4 py-3 transition-colors"
                      style={{ boxShadow: "0 1px 3px rgba(26,23,20,0.06)" }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                          <ShoppingBag className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-body font-medium text-[13px] text-foreground truncate">{entry.product_name}</p>
                              <p className="font-body font-light text-[11px] text-muted-foreground uppercase tracking-[0.06em] truncate">{entry.product_brand}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="font-body font-medium text-[15px] text-foreground">{fmt(entry.price)}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="font-body text-[11px] text-muted-foreground">{formatDate(entry.purchase_date)}</span>
                            {entry.store && (
                              <>
                                <span className="text-muted-foreground/40 text-xs">·</span>
                                <span className="font-body text-[11px] text-muted-foreground flex items-center gap-0.5">
                                  <Store className="w-3 h-3" strokeWidth={1.5} />{entry.store}
                                </span>
                              </>
                            )}
                            {entry.color_code && (
                              <>
                                <span className="text-muted-foreground/40 text-xs">·</span>
                                <span className="font-mono text-[11px] text-muted-foreground">{entry.color_code}</span>
                              </>
                            )}
                          </div>
                          {entry.notes && (
                            <p className="font-body font-light text-[11px] text-muted-foreground italic mt-1">{entry.notes}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ── FINANÇAS ── */
        <div className="max-w-lg mx-auto px-6 pt-6 space-y-5">
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-5" style={{ boxShadow: "0 1px 3px rgba(26,23,20,0.06)" }}>
              <p className="label-overline mb-2">Total gasto</p>
              <p className="font-body font-medium text-[22px] text-foreground">{fmt(metrics.totalSpent)}</p>
              <p className="font-body font-light text-[11px] text-muted-foreground mt-1">em maquiagens</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5" style={{ boxShadow: "0 1px 3px rgba(26,23,20,0.06)" }}>
              <p className="label-overline mb-2">Este mês</p>
              <p className="font-body font-medium text-[22px] text-foreground">{fmt(metrics.thisMonthSpent)}</p>
              {momPct !== null && (
                <div className={`flex items-center gap-1 mt-1 font-body text-[11px] ${momDiff > 0 ? "text-destructive" : momDiff < 0 ? "text-status-green" : "text-muted-foreground"}`}>
                  {momDiff > 0 ? <TrendingUp className="w-3 h-3" /> : momDiff < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {momPct}% vs mês passado
                </div>
              )}
            </div>
          </div>

          {/* Budget */}
          <div className="rounded-xl border border-border bg-card p-5" style={{ boxShadow: "0 1px 3px rgba(26,23,20,0.06)" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-display text-[16px] font-normal text-foreground">Orçamento mensal</p>
              <button className="text-muted-foreground" onClick={() => { setEditingBudget((v) => !v); setBudgetInput(String(monthlyBudget ?? "")); }}>
                <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
            {editingBudget ? (
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Ex: 500"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="h-[44px] text-sm"
                  type="number"
                  inputMode="decimal"
                />
                <Button size="sm" className="h-[44px] px-3" onClick={saveBudget}>
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            ) : null}
            {monthlyBudget ? (
              <>
                <div className="flex justify-between font-body text-[12px] text-muted-foreground mb-2">
                  <span>{fmt(metrics.thisMonthSpent)} gastos</span>
                  <span>{fmt(monthlyBudget)} limite</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${budgetPct}%`,
                      backgroundColor: budgetOver ? "hsl(var(--destructive))" : budgetWarn ? "hsl(38 70% 55%)" : "hsl(var(--primary))",
                    }}
                  />
                </div>
                <p className={`font-body text-[12px] mt-2 ${budgetOver ? "text-destructive" : budgetWarn ? "text-primary" : "text-muted-foreground"}`}>
                  {budgetOver
                    ? `⚠️ Orçamento ultrapassado em ${fmt(metrics.thisMonthSpent - monthlyBudget)}`
                    : `${budgetPct}% do orçamento usado — faltam ${fmt(monthlyBudget - metrics.thisMonthSpent)}`}
                </p>
              </>
            ) : (
              !editingBudget && (
                <p className="font-body font-light text-[13px] text-muted-foreground">
                  Defina um orçamento mensal para acompanhar seus gastos.
                </p>
              )
            )}
          </div>

          {/* Line chart */}
          <div className="rounded-xl border border-border bg-card p-5" style={{ boxShadow: "0 1px 3px rgba(26,23,20,0.06)" }}>
            <div className="flex items-center justify-between mb-1">
              <p className="font-display text-[16px] font-normal text-foreground">Gastos mensais</p>
              <p className="font-body text-[11px] text-muted-foreground">Média: <span className="text-foreground">{fmt(metrics.avg6)}</span>/mês</p>
            </div>
            <p className="label-overline mb-4">Últimos 6 meses</p>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={metrics.last6} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontFamily: "'DM Sans'" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "'DM Sans'" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  formatter={(v: number) => [fmt(v), "Gasto"]}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12, fontFamily: "'DM Sans'" }}
                />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* By category */}
          {metrics.byCategory.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5" style={{ boxShadow: "0 1px 3px rgba(26,23,20,0.06)" }}>
              <p className="font-display text-[16px] font-normal text-foreground mb-4">Por categoria</p>
              <ResponsiveContainer width="100%" height={metrics.byCategory.length * 36 + 8}>
                <BarChart data={metrics.byCategory} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }} barSize={14}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "'DM Sans'" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontFamily: "'DM Sans'" }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip
                    formatter={(v: number) => [fmt(v), "Gasto"]}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12, fontFamily: "'DM Sans'" }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} opacity={0.9} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Highlights */}
          <div className="grid grid-cols-2 gap-3">
            {metrics.mostExpensive && (
              <div className="rounded-xl border border-border bg-card p-4" style={{ boxShadow: "0 1px 3px rgba(26,23,20,0.06)" }}>
                <p className="label-overline mb-2">💎 Mais caro</p>
                <p className="font-body font-medium text-[13px] text-foreground line-clamp-2 leading-snug">{metrics.mostExpensive.name}</p>
                <p className="font-body font-medium text-[18px] text-foreground mt-1">{fmt(metrics.mostExpensive.purchase_price)}</p>
              </div>
            )}
            {metrics.bestCpb && (
              <div className="rounded-xl border border-border bg-card p-4" style={{ boxShadow: "0 1px 3px rgba(26,23,20,0.06)" }}>
                <p className="label-overline mb-2">⭐ Melhor custo</p>
                <p className="font-body font-medium text-[13px] text-foreground line-clamp-2 leading-snug">{metrics.bestCpb.name}</p>
                <p className="font-body font-medium text-[18px] text-foreground mt-1">
                  {fmt(metrics.bestCpb.cpd)}<span className="text-[11px] font-light text-muted-foreground">/dia</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
