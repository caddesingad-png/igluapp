import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Heart, Pencil, Trash2, Calendar, DollarSign,
  Clock, Repeat, Weight, StickyNote, Plus, Check, X, Star,
  ShoppingBag, Store, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sparkles, FlaskConical, Eye, Wind, Wand2, Layers, Sun, Droplets, Palette, Heart as HeartIcon
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  purchase_price: number;
  weight_grams: number | null;
  purchase_date: string;
  pao_months: number;
  usage_frequency: string;
  notes: string | null;
  photo_url: string | null;
  is_favorite: boolean;
}

interface ColorCode {
  id: string;
  code: string;
  note: string | null;
  is_current: boolean;
}

interface PurchaseRecord {
  id: string;
  price: number;
  color_code: string | null;
  purchase_date: string;
  store: string | null;
  notes: string | null;
  created_at: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  Foundation: Layers,
  Lipstick: HeartIcon,
  Eyeshadow: Eye,
  Blush: Sparkles,
  Mascara: Wand2,
  Concealer: FlaskConical,
  Highlighter: Sun,
  Contour: Palette,
  Primer: Droplets,
  "Setting Spray": Wind,
  Other: Star,
};

const isValidColor = (c: string) => {
  if (!c) return false;
  const s = new Option().style;
  s.color = c;
  return s.color !== "";
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Color codes state
  const [colorCodes, setColorCodes] = useState<ColorCode[]>([]);
  const [addingColor, setAddingColor] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newNote, setNewNote] = useState("");
  const [savingColor, setSavingColor] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState("");
  const newCodeRef = useRef<HTMLInputElement>(null);

  // Purchase history state
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [addingPurchase, setAddingPurchase] = useState(false);
  const [savingPurchase, setSavingPurchase] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    price: "",
    color_code: "",
    purchase_date: new Date().toISOString().slice(0, 10),
    store: "",
    notes: "",
  });
  const [showAllPurchases, setShowAllPurchases] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      const [productRes, colorsRes, purchasesRes] = await Promise.all([
        (supabase.from("products" as any) as any).select("*").eq("id", id).single(),
        (supabase.from("product_color_codes" as any) as any)
          .select("id, code, note, is_current")
          .eq("product_id", id)
          .order("created_at", { ascending: true }),
        (supabase.from("purchase_history" as any) as any)
          .select("id, price, color_code, purchase_date, store, notes, created_at")
          .eq("product_id", id)
          .order("purchase_date", { ascending: false }),
      ]);
      if (!productRes.error && productRes.data) setProduct(productRes.data);
      if (!colorsRes.error && colorsRes.data) setColorCodes(colorsRes.data);
      if (!purchasesRes.error && purchasesRes.data) setPurchases(purchasesRes.data);
      setLoading(false);
    };
    fetchAll();
  }, [id]);

  useEffect(() => {
    if (addingColor) newCodeRef.current?.focus();
  }, [addingColor]);

  const toggleFavorite = async () => {
    if (!product) return;
    setFavoriteLoading(true);
    const { error } = await (supabase.from("products" as any) as any)
      .update({ is_favorite: !product.is_favorite })
      .eq("id", product.id);
    if (!error) setProduct((p) => p ? { ...p, is_favorite: !p.is_favorite } : p);
    setFavoriteLoading(false);
  };

  const handleDelete = async () => {
    if (!product) return;
    const { error } = await (supabase.from("products" as any) as any)
      .delete().eq("id", product.id);
    if (error) {
      toast({ title: "Error", description: "Could not delete product.", variant: "destructive" });
    } else {
      toast({ title: "Product deleted" });
      navigate("/library");
    }
  };

  // ── Color code actions ──

  const handleAddColor = async () => {
    if (!newCode.trim() || !user || !id) return;
    setSavingColor(true);
    const { data, error } = await (supabase.from("product_color_codes" as any) as any)
      .insert({
        product_id: id,
        user_id: user.id,
        code: newCode.trim(),
        note: newNote.trim() || null,
        is_current: colorCodes.length === 0,
      })
      .select("id, code, note, is_current")
      .single();
    if (!error && data) {
      setColorCodes((prev) => [...prev, data]);
      setNewCode("");
      setNewNote("");
      setAddingColor(false);
    } else {
      toast({ title: "Error", description: "Could not add color code.", variant: "destructive" });
    }
    setSavingColor(false);
  };

  const handleSetCurrent = async (ccId: string) => {
    if (!id) return;
    await (supabase.from("product_color_codes" as any) as any)
      .update({ is_current: false }).eq("product_id", id);
    await (supabase.from("product_color_codes" as any) as any)
      .update({ is_current: true }).eq("id", ccId);
    setColorCodes((prev) => prev.map((c) => ({ ...c, is_current: c.id === ccId })));
  };

  const handleDeleteColor = async (ccId: string) => {
    const { error } = await (supabase.from("product_color_codes" as any) as any)
      .delete().eq("id", ccId);
    if (!error) {
      const remaining = colorCodes.filter((c) => c.id !== ccId);
      const wasCurrent = colorCodes.find((c) => c.id === ccId)?.is_current;
      if (wasCurrent && remaining.length > 0) {
        await (supabase.from("product_color_codes" as any) as any)
          .update({ is_current: true }).eq("id", remaining[0].id);
        remaining[0].is_current = true;
      }
      setColorCodes(remaining);
    }
  };

  const handleSaveNote = async (ccId: string) => {
    await (supabase.from("product_color_codes" as any) as any)
      .update({ note: editingNoteValue.trim() || null }).eq("id", ccId);
    setColorCodes((prev) =>
      prev.map((c) => c.id === ccId ? { ...c, note: editingNoteValue.trim() || null } : c)
    );
    setEditingNoteId(null);
  };

  // ── Purchase history actions ──

  const handleAddPurchase = async () => {
    if (!purchaseForm.price || !user || !id) return;
    const priceNum = parseFloat(purchaseForm.price);
    if (isNaN(priceNum) || priceNum < 0) {
      toast({ title: "Invalid price", variant: "destructive" });
      return;
    }
    setSavingPurchase(true);
    const { data, error } = await (supabase.from("purchase_history" as any) as any)
      .insert({
        product_id: id,
        user_id: user.id,
        price: priceNum,
        color_code: purchaseForm.color_code.trim() || null,
        purchase_date: purchaseForm.purchase_date,
        store: purchaseForm.store.trim() || null,
        notes: purchaseForm.notes.trim() || null,
      })
      .select("id, price, color_code, purchase_date, store, notes, created_at")
      .single();
    if (!error && data) {
      setPurchases((prev) => [data, ...prev]);
      setPurchaseForm({
        price: "",
        color_code: "",
        purchase_date: new Date().toISOString().slice(0, 10),
        store: "",
        notes: "",
      });
      setAddingPurchase(false);
      toast({ title: "Purchase recorded!" });
    } else {
      toast({ title: "Error", description: "Could not save purchase.", variant: "destructive" });
    }
    setSavingPurchase(false);
  };

  const handleDeletePurchase = async (pId: string) => {
    const { error } = await (supabase.from("purchase_history" as any) as any)
      .delete().eq("id", pId);
    if (!error) setPurchases((prev) => prev.filter((p) => p.id !== pId));
  };

  // Price trend helper
  const getPriceTrend = (idx: number): React.ReactNode => {
    if (idx >= purchases.length - 1) return null; // oldest purchase, no comparison
    const current = purchases[idx].price;
    const previous = purchases[idx + 1].price;
    const diff = current - previous;
    if (Math.abs(diff) < 0.01) return null;
    const sign = diff > 0 ? "↑" : "↓";
    const color = diff > 0 ? "text-destructive" : "text-green-600 dark:text-green-400";
    const label = diff > 0 ? "more expensive" : "cheaper";
    return (
      <span className={`text-xs font-medium ${color}`}>
        {sign} {formatCurrency(Math.abs(diff))} {label} than last time
      </span>
    );
  };

  // ──────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Product not found.</p>
      </div>
    );
  }

  const Icon = categoryIcons[product.category] ?? Star;

  const InfoRow = ({
    icon: RowIcon,
    label,
    value,
  }: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
  }) => (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <RowIcon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );

  const visiblePurchases = showAllPurchases ? purchases : purchases.slice(0, 3);

  return (
    <div className="min-h-screen pb-10 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate("/library")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggleFavorite} disabled={favoriteLoading}>
              <Heart
                className={`w-5 h-5 transition-colors ${
                  product.is_favorite ? "fill-primary text-primary" : "text-muted-foreground"
                }`}
              />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate(`/edit-product/${product.id}`)}>
              <Pencil className="w-5 h-5 text-muted-foreground" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="w-5 h-5 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete product?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove <strong>{product.name}</strong> from your library.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Photo / Hero */}
        <div className="w-full aspect-square rounded-2xl bg-muted overflow-hidden flex items-center justify-center">
          {product.photo_url ? (
            <img src={product.photo_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Icon className="w-20 h-20 text-muted-foreground/20" />
          )}
        </div>

        {/* Title block */}
        <div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
            {product.category}
          </span>
          <h1 className="text-2xl font-bold text-foreground mt-2">{product.name}</h1>
          <p className="text-muted-foreground">{product.brand}</p>
        </div>

        {/* ── Color Codes Section ── */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Color Codes</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddingColor(true)}
              className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </Button>
          </div>

          {colorCodes.length === 0 && !addingColor && (
            <p className="text-sm text-muted-foreground px-4 py-4">
              No color codes yet. Tap Add to track your shades.
            </p>
          )}

          <div className="divide-y divide-border">
            {colorCodes.map((cc) => {
              const swatch = isValidColor(cc.code);
              return (
                <div key={cc.id} className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full border border-border shrink-0 shadow-sm"
                      style={swatch ? { backgroundColor: cc.code } : { background: "var(--muted)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-mono font-medium text-foreground">{cc.code}</span>
                        {cc.is_current && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                            Current
                          </span>
                        )}
                      </div>
                      {editingNoteId === cc.id ? (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Input
                            autoFocus
                            value={editingNoteValue}
                            onChange={(e) => setEditingNoteValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveNote(cc.id);
                              if (e.key === "Escape") setEditingNoteId(null);
                            }}
                            placeholder="Add a note…"
                            className="h-7 text-xs px-2 py-0"
                          />
                          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => handleSaveNote(cc.id)}>
                            <Check className="w-3.5 h-3.5 text-primary" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditingNoteId(null)}>
                            <X className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingNoteId(cc.id); setEditingNoteValue(cc.note ?? ""); }}
                          className="mt-0.5 text-left"
                        >
                          {cc.note ? (
                            <span className="text-xs text-muted-foreground italic">{cc.note}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">+ add note</span>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {!cc.is_current && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Set as current" onClick={() => handleSetCurrent(cc.id)}>
                          <Check className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete color code?</AlertDialogTitle>
                            <AlertDialogDescription>Remove <strong>{cc.code}</strong> from this product.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteColor(cc.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {addingColor && (
            <div className="px-4 py-3 border-t border-border bg-muted/30">
              <p className="text-xs font-medium text-foreground mb-2">New color code</p>
              <div className="flex gap-2 mb-2">
                <Input
                  ref={newCodeRef}
                  placeholder="e.g. #C4856A or N30"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddColor(); if (e.key === "Escape") setAddingColor(false); }}
                  className="h-9 text-sm font-mono"
                />
                {isValidColor(newCode) && (
                  <div className="w-9 h-9 rounded-md border border-border shrink-0" style={{ backgroundColor: newCode }} />
                )}
              </div>
              <Input
                placeholder="Note (optional) — e.g. too orange for summer"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddColor(); if (e.key === "Escape") setAddingColor(false); }}
                className="h-9 text-sm mb-2"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddColor} disabled={!newCode.trim() || savingColor} className="rounded-full flex-1">
                  {savingColor ? "Saving…" : "Save"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setAddingColor(false); setNewCode(""); setNewNote(""); }} className="rounded-full">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Purchase History Section ── */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Purchase History</h2>
              {purchases.length > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                  {purchases.length}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddingPurchase(true)}
              className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary"
            >
              <Plus className="w-3.5 h-3.5" />
              Register
            </Button>
          </div>

          {purchases.length === 0 && !addingPurchase && (
            <p className="text-sm text-muted-foreground px-4 py-4">
              No purchases recorded yet.
            </p>
          )}

          {/* Purchase list */}
          <div className="divide-y divide-border">
            {visiblePurchases.map((p, idx) => (
              <div key={p.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(p.price)}
                      </span>
                      {idx === 0 && purchases.length > 1 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                          Latest
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {new Date(p.purchase_date + "T00:00:00").toLocaleDateString("en-US", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </span>
                      {p.store && (
                        <>
                          <span className="text-muted-foreground/40 text-xs">·</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <Store className="w-3 h-3" />
                            {p.store}
                          </span>
                        </>
                      )}
                      {p.color_code && (
                        <>
                          <span className="text-muted-foreground/40 text-xs">·</span>
                          <span className="text-xs font-mono text-muted-foreground">{p.color_code}</span>
                        </>
                      )}
                    </div>
                    {/* Price trend */}
                    <div className="mt-1">{getPriceTrend(idx)}</div>
                    {p.notes && (
                      <p className="text-xs text-muted-foreground italic mt-1">{p.notes}</p>
                    )}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 mt-0.5">
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete purchase?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Remove this purchase record from the history.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeletePurchase(p.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>

          {purchases.length > 3 && (
            <button
              onClick={() => setShowAllPurchases(!showAllPurchases)}
              className="w-full flex items-center justify-center gap-1 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border"
            >
              {showAllPurchases ? (
                <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
              ) : (
                <><ChevronDown className="w-3.5 h-3.5" /> Show {purchases.length - 3} more</>
              )}
            </button>
          )}

          {/* Add purchase form */}
          {addingPurchase && (
            <div className="px-4 py-3 border-t border-border bg-muted/30">
              <p className="text-xs font-medium text-foreground mb-3">New purchase</p>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Price *</label>
                    <Input
                      autoFocus
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={purchaseForm.price}
                      onChange={(e) => setPurchaseForm((f) => ({ ...f, price: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Date *</label>
                    <Input
                      type="date"
                      value={purchaseForm.purchase_date}
                      onChange={(e) => setPurchaseForm((f) => ({ ...f, purchase_date: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Color code</label>
                    <Input
                      placeholder="e.g. N30"
                      value={purchaseForm.color_code}
                      onChange={(e) => setPurchaseForm((f) => ({ ...f, color_code: e.target.value }))}
                      className="h-9 text-sm font-mono"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Store</label>
                    <Input
                      placeholder="e.g. Sephora"
                      value={purchaseForm.store}
                      onChange={(e) => setPurchaseForm((f) => ({ ...f, store: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                  <Input
                    placeholder="Optional note…"
                    value={purchaseForm.notes}
                    onChange={(e) => setPurchaseForm((f) => ({ ...f, notes: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={handleAddPurchase}
                    disabled={!purchaseForm.price || savingPurchase}
                    className="rounded-full flex-1"
                  >
                    {savingPurchase ? "Saving…" : "Save purchase"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAddingPurchase(false)}
                    className="rounded-full"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Details card */}
        <div className="rounded-xl border border-border bg-card px-4">
          <InfoRow icon={DollarSign} label="Purchase Price" value={`$${product.purchase_price.toFixed(2)}`} />
          <InfoRow
            icon={Calendar}
            label="Purchase Date"
            value={new Date(product.purchase_date).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric",
            })}
          />
          <InfoRow icon={Clock} label="PAO (Period After Opening)" value={`${product.pao_months} months`} />
          <InfoRow icon={Repeat} label="Usage Frequency" value={product.usage_frequency} />
          {product.weight_grams != null && (
            <InfoRow icon={Weight} label="Weight" value={`${product.weight_grams}g`} />
          )}
        </div>

        {/* Notes */}
        {product.notes && (
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <StickyNote className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{product.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
