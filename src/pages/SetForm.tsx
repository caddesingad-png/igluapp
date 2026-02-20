import { useEffect, useRef, useState } from "react";
import { compressImage } from "@/lib/compressImage";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Camera, Globe, Lock, Plus, X, Check } from "lucide-react";
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
      next.has(pid) ? next.delete(pid) : next.add(pid);
      return next;
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

    setSaving(false);
    toast({ title: isEdit ? "Set updated!" : "Set created!" });
    navigate("/sets");
  };

  const filtered = myProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-10 bg-background">
      <header className="sticky top-0 z-40 bg-background border-b border-border" style={{ height: "56px" }}>
        <div className="flex items-center justify-between max-w-lg mx-auto px-4 h-full">
          <button onClick={() => navigate("/sets")} className="w-8 h-8 flex items-center justify-center text-foreground">
            <ArrowLeft className="w-[20px] h-[20px]" strokeWidth={1.5} />
          </button>
          <h1 className="font-display text-[18px] font-normal text-foreground">
            {isEdit ? "Edit set" : "New set"}
          </h1>
          <Button
            size="sm"
            className="h-8 px-4 text-[12px]"
            onClick={handleSave}
            disabled={!name.trim() || saving}
          >
            {saving ? "Saving…" : "Save"}
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
              <img src={photoUrl} alt="Set cover" className="w-full h-full object-cover" />
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
          <label className="label-overline block mb-2">Set name *</label>
          <Input
            placeholder="e.g. Summer date night look"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Occasion */}
        <div>
          <label className="label-overline block mb-2">Occasion</label>
          <Input
            placeholder="e.g. Date night, Work, Festival…"
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
              <p className="font-body font-medium text-[13px] text-foreground">{isPublic ? "Public" : "Private"}</p>
              <p className="font-body font-light text-[11px] text-muted-foreground">
                {isPublic ? "Anyone with the link can view" : "Only you can see this set"}
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
            Products <span className="font-body font-light text-[13px] text-muted-foreground">({selectedIds.size} selected)</span>
          </p>
          <input
            placeholder="Search products…"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="w-full h-[44px] px-3 rounded-md border border-border bg-card font-body text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors mb-2"
          />
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(26,23,20,0.06)" }}>
            {filtered.length === 0 && (
              <p className="font-body font-light text-[13px] text-muted-foreground px-4 py-4">No products found.</p>
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
                    <img src={p.photo_url} alt={p.name} className="w-9 h-9 rounded-[8px] object-cover shrink-0" />
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
      </div>
    </div>
  );
};

export default SetForm;
