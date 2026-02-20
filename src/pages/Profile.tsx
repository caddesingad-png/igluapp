import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, TrendingUp, TrendingDown, Minus, Pencil, Check, ExternalLink, X } from "lucide-react";
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
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");
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
        supabase
          .from("purchase_history")
          .select("price, purchase_date, products(name, category, pao_months)")
          .eq("user_id", user.id),
        supabase
          .from("products")
          .select("id, name, purchase_price, pao_months, category")
          .eq("user_id", user.id),
      ]);

      if (profileRes.data) {
        setDisplayName(profileRes.data.display_name || "");
        setBio((profileRes.data as any).bio ?? "");
        setBioInput((profileRes.data as any).bio ?? "");
        setMonthlyBudget((profileRes.data as any).monthly_budget ?? null);
        setBudgetInput(String((profileRes.data as any).monthly_budget ?? ""));
      }
      if (purchaseRes.data) setPurchases(purchaseRes.data as PurchaseRow[]);
      if (productRes.data) setProducts(productRes.data as any);
      setLoading(false);
    };
    load();
  }, []);

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
      const cat = p.products?.category || "Other";
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
  };

  const saveBio = async () => {
    await supabase.from("profiles").update({ bio: bioInput } as any).eq("user_id", userId);
    setBio(bioInput);
    setEditingBio(false);
    toast.success("Bio atualizada");
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
    <div className="min-h-screen pb-24 bg-background screen-enter">
      <header className="sticky top-0 z-40 bg-background border-b border-border" style={{ height: "56px" }}>
        <div className="max-w-lg mx-auto px-6 h-full flex items-center">
          <h1 className="font-display text-[18px] font-normal text-foreground">Perfil & Finanças</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 pt-6 space-y-5 animate-fade-in">
        {/* Avatar + profile info */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center shrink-0">
              <span className="font-body font-medium text-[18px] text-muted-foreground">{initials}</span>
            </div>
            <div>
              <h2 className="font-body font-medium text-[15px] text-foreground">{displayName || "Usuária"}</h2>
              <p className="font-body font-light text-[11px] text-muted-foreground">{email}</p>
              {/* Bio */}
              {editingBio ? (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <input
                    autoFocus
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    maxLength={80}
                    placeholder="Bio curta..."
                    className="h-7 text-[12px] bg-muted rounded-md px-2 border border-border font-body text-foreground outline-none w-[160px]"
                  />
                  <button onClick={saveBio} className="w-6 h-6 flex items-center justify-center text-foreground"><Check className="w-3.5 h-3.5" strokeWidth={2} /></button>
                  <button onClick={() => setEditingBio(false)} className="w-6 h-6 flex items-center justify-center text-muted-foreground"><X className="w-3.5 h-3.5" strokeWidth={2} /></button>
                </div>
              ) : (
                <button
                  className="flex items-center gap-1 mt-1"
                  onClick={() => { setBioInput(bio); setEditingBio(true); }}
                >
                  <span className="font-body font-light text-[12px] text-muted-foreground">
                    {bio || "Adicionar bio..."}
                  </span>
                  <Pencil className="w-2.5 h-2.5 text-muted-foreground/50" strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>
          {/* Ver perfil público */}
          {userId && (
            <button
              onClick={() => navigate(`/user/${userId}`)}
              className="shrink-0 flex items-center gap-1 h-8 px-3 rounded-lg border border-border font-body text-[11px] text-muted-foreground transition-colors hover:bg-muted"
            >
              <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
              Ver perfil
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center pt-10">
            <div className="w-6 h-6 border-[1.5px] border-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
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
                <button
                  className="text-muted-foreground"
                  onClick={() => { setEditingBudget((v) => !v); setBudgetInput(String(monthlyBudget ?? "")); }}
                >
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
                        backgroundColor: budgetOver
                          ? "hsl(var(--destructive))"
                          : budgetWarn
                          ? "hsl(38 70% 55%)"
                          : "hsl(var(--primary))",
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
                  <p className="font-body font-medium text-[18px] text-foreground mt-1">{fmt(metrics.bestCpb.cpd)}<span className="text-[11px] font-light text-muted-foreground">/dia</span></p>
                </div>
              )}
            </div>

            {/* Account */}
            <div className="rounded-xl border border-border bg-card p-4" style={{ boxShadow: "0 1px 3px rgba(26,23,20,0.06)" }}>
              <p className="font-body font-medium text-[13px] text-foreground">Conta</p>
              <p className="font-body font-light text-[12px] text-muted-foreground mt-0.5 truncate">{email}</p>
            </div>
          </>
        )}

        <Button
          variant="outline"
          onClick={handleSignOut}
          className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.5} />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default Profile;
