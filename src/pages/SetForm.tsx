import { useEffect, useRef, useState } from "react";
import ShimmerImage from "@/components/ShimmerImage";
import { compressImage } from "@/lib/compressImage";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Camera, Globe, Lock, X, Check, ChevronDown, ChevronUp, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  photo_url: string | null;
}

const PREDEFINED_LAYERS = [
  { order: 1, name: "Skincare", icon: "🧴" },
  { order: 2, name: "Primer", icon: "🫧" },
  { order: 3, name: "Base/Foundation", icon: "🎨" },
  { order: 4, name: "Concealer", icon: "🔴" },
  { order: 5, name: "Setting Powder", icon: "🌸" },
  { order: 6, name: "Contour/Blush/Highlighter", icon: "🌟" },
  { order: 7, name: "Eyes", icon: "👁️" },
  { order: 8, name: "Lips", icon: "👄" },
  { order: 9, name: "Setting Spray", icon: "💧" },
];

interface LayerState {
  product_ids: string[];
  note: string;
  expanded: boolean;
}

const defaultLayers = (): Record<number, LayerState> =>
  Object.fromEntries(PREDEFINED_LAYERS.map((l) => [l.order, { product_ids: [], note: "", expanded: false }]));

const SetForm = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const photoRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [occasion, setOccasion] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [productSearch, setProductSearch] = useState("");

  const [layers, setLayers] = useState<Record<number, LayerState>>(defaultLayers);
  const [layersSectionOpen, setLayersSectionOpen] = useState(!isEdit);
  const [linkingLayer, setLinkingLayer] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    (supabase.from("products" as any) as any)
      .select("id, name, brand, category, photo_url")
      .eq("user_id", user.id)
      .order("name")
      .then(({ data }: any) => setMyProducts(data ?? []));

    if (isEdit && id) {
      (supabase.from("sets" as any) as any)
        .select("name, occasion, photo_url, is_public")
        .eq("id", id)
        .single()
        .then(({ data }: any) => {
          if (data) {
            setName(data.name);
            setOccasion(data.occasion ?? "");
            setIsPublic(data.is_public);
            setPhotoUrl(data.photo_url);
          }
        });

      (supabase.from("set_products" as any) as any)
        .select("product_id")
        .eq("set_id", id)
        .then(({ data }: any) => {
          if (data) setSelectedIds(new Set(data.map((r: any) => r.product_id)));
        });

      (supabase.from("set_layers" as any) as any)
        .select("*")
        .eq("set_id", id)
        .then(({ data }: any) => {
          if (data && data.length > 0) {
            setLayersSectionOpen(true);
            setLayers((prev) => {
              const next = { ...prev };
              data.forEach((row: any) => {
                next[row.layer_order] = {
                  product_ids: row.product_ids ?? [],
                  note: row.note ?? "",
                  expanded: (row.product_ids?.length ?? 0) > 0 || !!row.note,
                };
              });
              return next;
            });
          }
        });
    }
  }, [user, id, isEdit]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingPhoto(true);
    const compressed = await compressImage(file);
    const path = `sets/${user.id}/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("product-photos").upload(path, compressed, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("product-photos").getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
    } else {
      toast({ title: "Erro ao subir foto", variant: "destructive" });
    }
    setUploadingPhoto(false);
  };

  const toggleProduct = (pid: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) {
        next.delete(pid);
        // Remove from all layers when deselecting a product
        setLayers((prevL) => {
          const nl = { ...prevL };
          PREDEFINED_LAYERS.forEach(({ order }) => {
            nl[order] = { ...nl[order], product_ids: nl[order].product_ids.filter((x) => x !== pid) };
          });
          return nl;
        });
      } else {
        next.add(pid);
      }
      return next;
    });
  };

  const updateLayerNote = (order: number, note: string) => {
    setLayers((prev) => ({ ...prev, [order]: { ...prev[order], note: note.slice(0, 200) } }));
  };

  const toggleLayerExpanded = (order: number) => {
    setLayers((prev) => ({ ...prev, [order]: { ...prev[order], expanded: !prev[order].expanded } }));
  };

  const toggleLayerProduct = (layerOrder: number, pid: string) => {
    setLayers((prev) => {
      const current = prev[layerOrder].product_ids;
      const next = current.includes(pid) ? current.filter((x) => x !== pid) : [...current, pid];
      return { ...prev, [layerOrder]: { ...prev[layerOrder], product_ids: next } };
    });
  };

  const handleSave = async () => {
    if (!name.trim() || !user) return;
    setSaving(true);

    let setId = id;

    if (isEdit && id) {
      await (supabase.from("sets" as any) as any)
        .update({ name: name.trim(), occasion: occasion.trim() || null, photo_url: photoUrl, is_public: isPublic })
        .eq("id", id);
      await (supabase.from("set_products" as any) as any).delete().eq("set_id", id);
    } else {
      const { data } = await (supabase.from("sets" as any) as any)
        .insert({ user_id: user.id, name: name.trim(), occasion: occasion.trim() || null, photo_url: photoUrl, is_public: isPublic })
        .select("id")
        .single();
      setId = data?.id;
    }

    if (setId && selectedIds.size > 0) {
      const rows = [...selectedIds].map((pid) => ({ set_id: setId, product_id: pid, user_id: user.id }));
      await (supabase.from("set_products" as any) as any).insert(rows);
    }

    if (setId) {
      await (supabase.from("set_layers" as any) as any).delete().eq("set_id", setId);
      const layerRows = PREDEFINED_LAYERS
        .map(({ order, name: lName, icon }) => ({
          set_id: setId,
          layer_order: order,
          layer_name: lName,
          layer_icon: icon,
          product_ids: layers[order].product_ids,
          note: layers[order].note.trim() || null,
        }))
        .filter((r) => r.product_ids.length > 0 || r.note);
      if (layerRows.length > 0) {
        await (supabase.from("set_layers" as any) as any).insert(layerRows);
      }
    }

    setSaving(false);
    toast({ title: isEdit ? "Set atualizado!" : "Set criado!" });
    navigate("/sets");
  };

  const filtered = myProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(productSearch.toLowerCase())
  );

  const linkableProducts = myProducts.filter((p) => selectedIds.has(p.id));
  const linkingLayerObj = linkingLayer !== null ? PREDEFINED_LAYERS.find((l) => l.order === linkingLayer) : null;

  const filledLayersCount = PREDEFINED_LAYERS.filter(
    (l) => layers[l.order].product_ids.length > 0 || layers[l.order].note.trim().length > 0
  ).length;

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom, 20px) + 60px)" }}>
      <header className="sticky top-0 z-40 bg-background border-b border-border" style={{ height: "56px" }}>
        <div className="flex items-center justify-between max-w-lg mx-auto px-4 h-full">
          <button onClick={() => navigate("/sets")} className="w-8 h-8 flex items-center justify-center text-foreground">
            <ArrowLeft className="w-[20px] h-[20px]" strokeWidth={1.5} />
          </button>
          <h1 className="font-display text-[18px] font-normal text-foreground">
            {isEdit ? "Editar set" : "Novo set"}
          </h1>
          <Button
            size="sm"
            className="h-8 px-4 text-[12px]"
            onClick={handleSave}
            disabled={!name.trim() || saving}
          >
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 pt-6 space-y-5">
        {/* Photo */}
        <div className="flex justify-center">
          <div
            className="w-36 h-36 rounded-xl bg-muted flex items-center justify-center cursor-pointer overflow-hidden relative border border-border"
            onClick={() => photoRef.current?.click()}
          >
            {photoUrl ? (
              <ShimmerImage src={photoUrl} alt="Set cover" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Camera className="w-7 h-7" strokeWidth={1.5} />
                <span className="font-body text-[11px] text-center">{uploadingPhoto ? "Enviando…" : "Adicionar foto"}</span>
              </div>
            )}
            {photoUrl && (
              <button
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/90 flex items-center justify-center"
                onClick={(e) => { e.stopPropagation(); setPhotoUrl(null); }}
              >
                <X className="w-3 h-3 text-foreground" />
              </button>
            )}
          </div>
        </div>
        <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

        {/* Name */}
        <div>
          <label className="label-overline block mb-2">Nome do set *</label>
          <Input
            placeholder="ex: Look de verão para date"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Occasion */}
        <div>
          <label className="label-overline block mb-2">Ocasião</label>
          <Input
            placeholder="ex: Date, Trabalho, Festival…"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
          />
        </div>

        {/* Visibility toggle */}
        <div
          className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 cursor-pointer select-none"
          style={{ boxShadow: "0 1px 3px rgba(26,23,20,0.06)" }}
          onClick={() => setIsPublic((v) => !v)}
        >
          <div className="flex items-center gap-3">
            {isPublic ? (
              <Globe className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            ) : (
              <Lock className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            )}
            <div>
              <p className="font-body font-medium text-[13px] text-foreground">{isPublic ? "Público" : "Privado"}</p>
              <p className="font-body font-light text-[11px] text-muted-foreground">
                {isPublic ? "Qualquer pessoa com o link pode ver" : "Apenas você pode ver este set"}
              </p>
            </div>
          </div>
          <div
            className="w-10 h-6 rounded-full relative transition-colors"
            style={{ backgroundColor: isPublic ? "hsl(var(--foreground))" : "hsl(var(--muted))" }}
          >
            <div
              className="absolute top-1 w-4 h-4 rounded-full bg-card transition-transform"
              style={{ transform: isPublic ? "translateX(20px)" : "translateX(4px)" }}
            />
          </div>
        </div>

        {/* Product picker */}
        <div>
          <p className="font-display text-[16px] font-normal text-foreground mb-3">
            Produtos <span className="font-body font-light text-[13px] text-muted-foreground">({selectedIds.size} selecionado{selectedIds.size !== 1 ? "s" : ""})</span>
          </p>
          <input
            placeholder="Buscar produtos…"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="w-full h-[44px] px-3 rounded-md border border-border bg-card font-body text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors mb-2"
          />
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(26,23,20,0.06)" }}>
            {filtered.length === 0 && (
              <p className="font-body font-light text-[13px] text-muted-foreground px-4 py-4">Nenhum produto encontrado.</p>
            )}
            {filtered.map((p) => {
              const selected = selectedIds.has(p.id);
              return (
                <button
                  key={p.id}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                  onClick={() => toggleProduct(p.id)}
                >
                  <div
                    className="w-5 h-5 rounded-sm border-2 flex items-center justify-center shrink-0 transition-colors"
                    style={{
                      backgroundColor: selected ? "hsl(var(--foreground))" : "transparent",
                      borderColor: selected ? "hsl(var(--foreground))" : "hsl(var(--border))",
                    }}
                  >
                    {selected && <Check className="w-3 h-3 text-btn-dark-fg" />}
                  </div>
                  {p.photo_url ? (
                    <div className="w-9 h-9 rounded-[8px] overflow-hidden shrink-0 relative">
                      <ShimmerImage src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-[8px] bg-muted shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-body font-medium text-[13px] text-foreground truncate">{p.name}</p>
                    <p className="font-body font-light text-[11px] text-muted-foreground uppercase tracking-[0.06em] truncate">{p.brand}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── CAMADAS (collapsible) ── */}
        <div>
          {/* Toggle button */}
          <button
            className="w-full flex items-start justify-between py-2"
            onClick={() => setLayersSectionOpen((v) => !v)}
          >
            <div className="flex flex-col items-start gap-0.5 text-left">
              <span className="font-body font-medium text-[14px] text-foreground">
                Camadas{" "}
                <span className="font-normal text-[13px] text-muted-foreground">(opcional)</span>
                {!layersSectionOpen && filledLayersCount > 0 && (
                  <span className="font-normal text-[12px] text-primary ml-1.5">
                    · {filledLayersCount} adicionada{filledLayersCount !== 1 ? "s" : ""}
                  </span>
                )}
              </span>
              <span className="font-body font-light text-[12px] italic text-muted-foreground">
                Registre e documente sua técnica
              </span>
            </div>
            <ChevronDown
              className="w-4 h-4 mt-1 shrink-0 text-muted-foreground transition-transform"
              strokeWidth={1.5}
              style={{
                transform: layersSectionOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            />
          </button>

          {/* Expanded section */}
          {layersSectionOpen && (
            <div className="mt-3">

              <div
                className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border"
                style={{ boxShadow: "0 1px 3px rgba(26,23,20,0.06)" }}
              >
                {PREDEFINED_LAYERS.map((layer) => {
                  const state = layers[layer.order];
                  const isFilled = state.product_ids.length > 0 || state.note.trim().length > 0;

                  return (
                    <div
                      key={layer.order}
                      style={{
                        opacity: isFilled ? 1 : 0.5,
                        borderLeft: isFilled ? "2px solid #C9A96E" : "2px solid transparent",
                        transition: "opacity 0.2s, border-color 0.2s",
                      }}
                    >
                      {/* Row header */}
                      <button
                        className="w-full flex items-center gap-3 px-6 text-left hover:bg-muted/30 transition-colors"
                        style={{ minHeight: "56px" }}
                        onClick={() => toggleLayerExpanded(layer.order)}
                      >
                        <span className="text-[18px] leading-none shrink-0">{layer.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-medium text-[13px] text-foreground">{layer.name}</p>
                          {state.product_ids.length > 0 && (
                            <p className="font-body font-light text-[11px] text-muted-foreground">
                              {state.product_ids.length} produto{state.product_ids.length !== 1 ? "s" : ""}
                              {state.note.trim() && " · nota"}
                            </p>
                          )}
                        </div>
                        {state.expanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                        )}
                      </button>

                      {/* Expanded content */}
                      {state.expanded && (
                        <div className="px-6 pb-4 space-y-3">
                          {/* Selected product chips */}
                          {state.product_ids.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {state.product_ids.map((pid) => {
                                const prod = myProducts.find((p) => p.id === pid);
                                if (!prod) return null;
                                return (
                                  <div key={pid} className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1">
                                    {prod.photo_url && (
                                      <div className="w-4 h-4 rounded-full overflow-hidden relative">
                                        <ShimmerImage src={prod.photo_url} alt="" className="w-full h-full object-cover" />
                                      </div>
                                    )}
                                    <span className="font-body text-[11px] text-foreground">{prod.name}</span>
                                    <button
                                      onClick={() => toggleLayerProduct(layer.order, pid)}
                                      className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Link product button */}
                          <button
                            className="flex items-center gap-2 font-body text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setLinkingLayer(layer.order)}
                            disabled={selectedIds.size === 0}
                          >
                            <Link2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                            {state.product_ids.length > 0 ? "Editar produtos" : "Vincular produto"}
                            {selectedIds.size === 0 && (
                              <span className="text-muted-foreground/50 ml-1">(selecione produtos acima)</span>
                            )}
                          </button>

                          {/* Note field */}
                          <input
                            type="text"
                            maxLength={200}
                            placeholder="Adicione uma dica ou técnica..."
                            value={state.note}
                            onChange={(e) => updateLayerNote(layer.order, e.target.value)}
                            className="w-full h-[38px] px-3 rounded-md border border-border bg-background font-body text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom sheet: link products to layer */}
      {linkingLayer !== null && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-foreground/20" onClick={() => setLinkingLayer(null)} />
          <div className="relative bg-background rounded-t-2xl flex flex-col" style={{ boxShadow: "0 -4px 20px rgba(26,23,20,0.12)", maxHeight: "calc(70vh - env(safe-area-inset-bottom, 0px))" }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="flex items-center justify-between px-6 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-[20px]">{linkingLayerObj?.icon}</span>
                <p className="font-body font-medium text-[14px] text-foreground">{linkingLayerObj?.name}</p>
              </div>
              <button onClick={() => setLinkingLayer(null)} className="w-7 h-7 flex items-center justify-center text-muted-foreground">
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-border">
              {linkableProducts.length === 0 && (
                <p className="font-body font-light text-[13px] text-muted-foreground px-6 py-6 text-center">
                  Selecione produtos no set primeiro.
                </p>
              )}
              {linkableProducts.map((p) => {
                const selected = layers[linkingLayer].product_ids.includes(p.id);
                return (
                  <button
                    key={p.id}
                    className="w-full flex items-center gap-3 px-6 py-3 hover:bg-muted/30 transition-colors text-left"
                    onClick={() => toggleLayerProduct(linkingLayer, p.id)}
                  >
                    <div
                      className="w-5 h-5 rounded-sm border-2 flex items-center justify-center shrink-0 transition-colors"
                      style={{
                        backgroundColor: selected ? "hsl(var(--foreground))" : "transparent",
                        borderColor: selected ? "hsl(var(--foreground))" : "hsl(var(--border))",
                      }}
                    >
                      {selected && <Check className="w-3 h-3 text-btn-dark-fg" />}
                    </div>
                    {p.photo_url ? (
                      <div className="w-9 h-9 rounded-[8px] overflow-hidden shrink-0 relative">
                        <ShimmerImage src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-[8px] bg-muted shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-body font-medium text-[13px] text-foreground truncate">{p.name}</p>
                      <p className="font-body font-light text-[11px] text-muted-foreground uppercase tracking-[0.06em] truncate">{p.brand}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="px-6 pt-4 border-t border-border" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 16px) + 60px)" }}>
              <Button className="w-full" onClick={() => setLinkingLayer(null)}>
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SetForm;
