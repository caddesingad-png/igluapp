import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, User, TrendingUp, TrendingDown, Minus, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";

interface PurchaseRow {
  price: number;
  purchase_date: string;
  products: { name: string; category: string; pao_months: number } | null;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const Profile = () => {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [userId, setUserId] = useState("");
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; purchase_price: number; pao_months: number; category: string }[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState<number | null>(null);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      setEmail(user.email || "");

      const [profileRes, purchaseRes, productRes] = await Promise.all([
        supabase.from("profiles").select("display_name, monthly_budget").eq("user_id", user.id).single(),
        (supabase.from("purchase_history" as any) as any)
          .select("price, purchase_date, products(name, category, pao_months)")
          .eq("user_id", user.id),
        (supabase.from("products" as any) as any)
          .select("id, name, purchase_price, pao_months, category")
          .eq("user_id", user.id),
      ]);

      if (profileRes.data) {
        setDisplayName(profileRes.data.display_name || "");
        setMonthlyBudget((profileRes.data as any).monthly_budget ?? null);
        setBudgetInput(String((profileRes.data as any).monthly_budget ?? ""));
      }
      if (purchaseRes.data) setPurchases(purchaseRes.data as PurchaseRow[]);
      if (productRes.data) setProducts(productRes.data as any);
      setLoading(false);
    };
    load();
  }, []);

  // ── Metrics ────────────────────────────────────────────────────────────────
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

    // Spent by category (from purchase_history)
    const catMap: Record<string, number> = {};
    for (const p of purchases) {
      const cat = p.products?.category || "Other";
      catMap[cat] = (catMap[cat] ?? 0) + Number(p.price);
    }
    const byCategory = Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Most expensive product
    const mostExpensive = [...products].sort((a, b) => b.purchase_price - a.purchase_price)[0] ?? null;

    // Best cost-benefit: price / (pao_months * 30) = R$/day
    const withCpd = products
      .filter((p) => p.pao_months > 0)
      .map((p) => ({ ...p, cpd: p.purchase_price / (p.pao_months * 30) }))
      .sort((a, b) => a.cpd - b.cpd);
    const bestCpb = withCpd[0] ?? null;

    // Last 6 months line chart
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
  };

  const saveBudget = async () => {
    const val = parseFloat(budgetInput.replace(",", "."));
    const budget = isNaN(val) ? null : val;
    await supabase.from("profiles").update({ monthly_budget: budget } as any).eq("user_id", userId);
    setMonthlyBudget(budget);
    setEditingBudget(false);
  };

  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase();

  const momDiff = metrics.thisMonthSpent - metrics.lastMonthSpent;
  const momPct = metrics.lastMonthSpent > 0
    ? Math.abs(Math.round((momDiff / metrics.lastMonthSpent) * 100))
    : null;

  const budgetPct = monthlyBudget && monthlyBudget > 0
    ? Math.min(Math.round((metrics.thisMonthSpent / monthlyBudget) * 100), 100)
    : 0;
  const budgetOver = monthlyBudget ? metrics.thisMonthSpent > monthlyBudget : false;
  const budgetWarn = monthlyBudget ? metrics.thisMonthSpent >= monthlyBudget * 0.8 : false;

  return (
    <div className="min-h-screen pb-24 bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border px-5 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-foreground">Perfil & Finanças</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5 animate-fade-in">

        {/* Avatar */}
        <div className="flex items-center gap-4 px-1">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-primary">{initials}</span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">{displayName || "Usuária"}</h2>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center pt-10">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Top KPI row ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">Total gasto</p>
                <p className="text-xl font-bold text-foreground">{fmt(metrics.totalSpent)}</p>
                <p className="text-xs text-muted-foreground mt-1">em maquiagens</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">Este mês</p>
                <p className="text-xl font-bold text-foreground">{fmt(metrics.thisMonthSpent)}</p>
                {momPct !== null && (
                  <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${momDiff > 0 ? "text-destructive" : momDiff < 0 ? "text-green-600" : "text-muted-foreground"}`}>
                    {momDiff > 0 ? <TrendingUp className="w-3 h-3" /> : momDiff < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {momPct}% vs mês passado
                  </div>
                )}
                {momPct === null && <p className="text-xs text-muted-foreground mt-1">sem dados mês passado</p>}
              </div>
            </div>

            {/* ── Budget ── */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-foreground">Orçamento mensal</p>
                <button
                  className="text-muted-foreground"
                  onClick={() => { setEditingBudget((v) => !v); setBudgetInput(String(monthlyBudget ?? "")); }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>

              {editingBudget ? (
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="Ex: 500"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    className="h-9 text-sm"
                    type="number"
                    inputMode="decimal"
                  />
                  <Button size="sm" className="h-9 px-3" onClick={saveBudget}>
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              ) : null}

              {monthlyBudget ? (
                <>
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>{fmt(metrics.thisMonthSpent)} gastos</span>
                    <span>{fmt(monthlyBudget)} limite</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${budgetOver ? "bg-destructive" : budgetWarn ? "bg-orange-400" : "bg-primary"}`}
                      style={{ width: `${budgetPct}%` }}
                    />
                  </div>
                  <p className={`text-xs mt-2 font-medium ${budgetOver ? "text-destructive" : budgetWarn ? "text-orange-500" : "text-muted-foreground"}`}>
                    {budgetOver
                      ? `⚠️ Orçamento ultrapassado em ${fmt(metrics.thisMonthSpent - monthlyBudget)}`
                      : `${budgetPct}% do orçamento usado — faltam ${fmt(monthlyBudget - metrics.thisMonthSpent)}`}
                  </p>
                </>
              ) : (
                !editingBudget && (
                  <p className="text-xs text-muted-foreground">
                    Defina um orçamento mensal para acompanhar seus gastos.
                  </p>
                )
              )}
            </div>

            {/* ── Avg spend + Line chart ── */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-foreground">Gastos mensais</p>
                <p className="text-xs text-muted-foreground">Média: <span className="font-medium text-foreground">{fmt(metrics.avg6)}</span>/mês</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Últimos 6 meses</p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={metrics.last6} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip
                    formatter={(v: number) => [fmt(v), "Gasto"]}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: "hsl(var(--primary))", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* ── By category ── */}
            {metrics.byCategory.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-sm font-semibold text-foreground mb-3">Por categoria</p>
                <ResponsiveContainer width="100%" height={metrics.byCategory.length * 36 + 8}>
                  <BarChart
                    data={metrics.byCategory}
                    layout="vertical"
                    margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
                    barSize={16}
                  >
                    <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip
                      formatter={(v: number) => [fmt(v), "Gasto"]}
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ── Highlights ── */}
            <div className="grid grid-cols-2 gap-3">
              {metrics.mostExpensive && (
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground mb-2">💎 Mais caro</p>
                  <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">{metrics.mostExpensive.name}</p>
                  <p className="text-lg font-bold text-primary mt-1">{fmt(metrics.mostExpensive.purchase_price)}</p>
                </div>
              )}
              {metrics.bestCpb && (
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground mb-2">⭐ Melhor custo-benefício</p>
                  <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">{metrics.bestCpb.name}</p>
                  <p className="text-lg font-bold text-primary mt-1">{fmt(metrics.bestCpb.cpd)}<span className="text-xs font-normal text-muted-foreground">/dia</span></p>
                </div>
              )}
            </div>

            {/* ── Account ── */}
            <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Conta</p>
                <p className="text-xs text-muted-foreground truncate">{email}</p>
              </div>
            </div>
          </>
        )}

        <Button
          variant="outline"
          onClick={handleSignOut}
          className="w-full h-12 gap-2 text-destructive border-destructive/20 hover:bg-destructive/5"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default Profile;
