import { useEffect, useRef, useState } from "react";
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

  // Products
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    // Load user's products
    (supabase.from("products" as any) as any)
      .select("id, name, brand, category, photo_url")
      .eq("user_id", user.id)
      .order("name")
      .then(({ data }: any) => setMyProducts(data ?? []));

    // If editing, load existing set data
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
    const ext = file.name.split(".").pop();
    const path = `sets/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-photos").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("product-photos").getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
    } else {
      toast({ title: "Photo upload failed", variant: "destructive" });
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

      // Sync products: delete all then re-insert
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
      <header className="sticky top-0 z-40 glass border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate("/sets")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-base font-semibold text-foreground">
            {isEdit ? "Edit set" : "New set"}
          </h1>
          <Button
            size="sm"
            className="rounded-full text-xs h-8"
            onClick={handleSave}
            disabled={!name.trim() || saving}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-5">
        {/* Photo */}
        <div
          className="w-full h-44 rounded-2xl bg-muted flex items-center justify-center cursor-pointer overflow-hidden relative"
          onClick={() => photoRef.current?.click()}
        >
          {photoUrl ? (
            <img src={photoUrl} alt="Set cover" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Camera className="w-8 h-8" />
              <span className="text-xs">{uploadingPhoto ? "Uploading…" : "Add cover photo"}</span>
            </div>
          )}
          {photoUrl && (
            <button
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center"
              onClick={(e) => { e.stopPropagation(); setPhotoUrl(null); }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

        {/* Name */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Set name *</label>
          <Input
            placeholder="e.g. Summer date night look"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10"
          />
        </div>

        {/* Occasion */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Occasion</label>
          <Input
            placeholder="e.g. Date night, Work, Festival…"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            className="h-10"
          />
        </div>

        {/* Visibility toggle */}
        <div
          className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 cursor-pointer select-none"
          onClick={() => setIsPublic((v) => !v)}
        >
          <div className="flex items-center gap-3">
            {isPublic ? <Globe className="w-4 h-4 text-primary" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
            <div>
              <p className="text-sm font-medium text-foreground">{isPublic ? "Public" : "Private"}</p>
              <p className="text-xs text-muted-foreground">
                {isPublic ? "Anyone with the link can view" : "Only you can see this set"}
              </p>
            </div>
          </div>
          <div className={`w-10 h-6 rounded-full transition-colors ${isPublic ? "bg-primary" : "bg-muted"} relative`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-background transition-transform ${isPublic ? "translate-x-5" : "translate-x-1"}`} />
          </div>
        </div>

        {/* Product picker */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-2">
            Products ({selectedIds.size} selected)
          </p>
          <Input
            placeholder="Search products…"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="h-9 mb-2 text-sm"
          />
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground px-4 py-4">No products found.</p>
            )}
            {filtered.map((p) => {
              const selected = selectedIds.has(p.id);
              return (
                <button
                  key={p.id}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                  onClick={() => toggleProduct(p.id)}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-primary border-primary" : "border-border"}`}>
                    {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-muted shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.brand}</p>
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
