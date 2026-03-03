import { useState, useRef, useEffect } from "react";
import { compressImage } from "@/lib/compressImage";
import { ArrowLeft, Camera, X, Plus, ScanBarcode, Loader2, Sparkles } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import BarcodeScanner from "@/components/BarcodeScanner";

const CATEGORIES = [
  "Base", "Batom", "Sombra", "Blush", "Máscara",
  "Corretivo", "Iluminador", "Contorno", "Primer", "Fixador", "Outro",
];

const PAO_OPTIONS = [
  { value: "3", label: "3 meses" },
  { value: "6", label: "6 meses" },
  { value: "12", label: "12 meses" },
  { value: "18", label: "18 meses" },
  { value: "24", label: "24 meses" },
];

const FREQUENCY_OPTIONS = ["Diária", "Semanal", "Ocasional"];

const mapCategory = (tags: string[] = []): string => {
  const joined = tags.join(" ").toLowerCase();
  if (joined.includes("lipstick") || joined.includes("lip-")) return "Lipstick";
  if (joined.includes("foundation") || joined.includes("base")) return "Foundation";
  if (joined.includes("mascara")) return "Mascara";
  if (joined.includes("eyeshadow") || joined.includes("eye-shadow")) return "Eyeshadow";
  if (joined.includes("blush")) return "Blush";
  if (joined.includes("concealer")) return "Concealer";
  if (joined.includes("highlight")) return "Highlighter";
  if (joined.includes("contour")) return "Contour";
  if (joined.includes("primer")) return "Primer";
  if (joined.includes("setting") || joined.includes("spray")) return "Setting Spray";
  return "Other";
};

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="label-overline block mb-2">{children}</label>
);

const AddProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [colorCodes, setColorCodes] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [weightGrams, setWeightGrams] = useState("");
  const [purchaseDate, setPurchaseDate] = useState<Date>(new Date());
  const [paoMonths, setPaoMonths] = useState("12");
  const [usageFrequency, setUsageFrequency] = useState("Ocasional");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(isEdit);

  useEffect(() => {
    if (!isEdit || !id) return;
    (supabase.from("products" as any) as any)
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }: any) => {
        if (data) {
          setName(data.name ?? "");
          setBrand(data.brand ?? "");
          setCategory(data.category ?? "");
          setColorCodes(data.color_codes ?? []);
          setPurchasePrice(data.purchase_price != null ? String(data.purchase_price) : "");
          setWeightGrams(data.weight_grams != null ? String(data.weight_grams) : "");
          if (data.purchase_date) setPurchaseDate(parseISO(data.purchase_date));
          setPaoMonths(data.pao_months ? String(data.pao_months) : "12");
          setUsageFrequency(data.usage_frequency ?? "Ocasional");
          setNotes(data.notes ?? "");
          if (data.photo_url) {
            setExistingPhotoUrl(data.photo_url);
            setPhotoPreview(data.photo_url);
          }
        }
        setLoadingProduct(false);
      });
  }, [isEdit, id]);

  const addColorCode = () => {
    const trimmed = colorInput.trim();
    if (trimmed && !colorCodes.includes(trimmed)) {
      setColorCodes([...colorCodes, trimmed]);
      setColorInput("");
    }
  };

  const removeColorCode = (code: string) => {
    setColorCodes(colorCodes.filter((c) => c !== code));
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file);
      setPhoto(compressed);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(compressed);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setExistingPhotoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleIdentifyProduct = async () => {
    const imageSource = photo || (existingPhotoUrl ? existingPhotoUrl : null);
    if (!imageSource) return;

    setIdentifying(true);
    try {
      let base64: string;

      if (imageSource instanceof File) {
        const compressed = await compressImage(imageSource);
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.readAsDataURL(compressed);
        });
      } else {
        // Fetch existing URL and convert
        const resp = await fetch(imageSource);
        const blob = await resp.blob();
        const file = new File([blob], "photo.jpg", { type: blob.type });
        const compressed = await compressImage(file);
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.readAsDataURL(compressed);
        });
      }

      const { data, error } = await supabase.functions.invoke("identify-product", {
        body: { imageBase64: base64 },
      });

      if (error) throw error;

      if (data?.name) setName(data.name);
      if (data?.brand) setBrand(data.brand);
      if (data?.category && CATEGORIES.includes(data.category)) setCategory(data.category);
      if (data?.color_codes?.length) setColorCodes(data.color_codes);

      toast.success("Produto identificado! Confira os dados. ✨");
    } catch (err: any) {
      console.error("Identify error:", err);
      toast.error(err?.message || "Não foi possível identificar o produto");
    } finally {
      setIdentifying(false);
    }
  };

  const handleBarcodeDetected = async (barcode: string) => {
    setShowScanner(false);
    setLookingUp(true);
    try {
      const res = await fetch(
        `https://world.openbeautyfacts.org/api/v2/product/${barcode}?fields=product_name,brands,categories_tags,image_url`
      );
      const data = await res.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        setName(p.product_name || "");
        setBrand(p.brands?.split(",")[0]?.trim() || "");
        setCategory(mapCategory(p.categories_tags || []));
        toast.success("Produto encontrado! Confira e complete os dados.");
      } else {
        toast.error("Produto não encontrado. Preencha manualmente.");
      }
    } catch {
      toast.error("Erro ao buscar produto. Preencha manualmente.");
    } finally {
      setLookingUp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim() || !brand.trim() || !category || !purchasePrice) {
      toast.error("Por favor preencha todos os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      let photoUrl: string | null = existingPhotoUrl;

      if (photo) {
        const filePath = `${user.id}/${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabase.storage.from("product-photos").upload(filePath, photo);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("product-photos").getPublicUrl(filePath);
        photoUrl = urlData.publicUrl;
      }

      const productPayload = {
        name: name.trim(),
        brand: brand.trim(),
        category,
        color_codes: colorCodes,
        purchase_price: parseFloat(purchasePrice),
        weight_grams: weightGrams ? parseFloat(weightGrams) : null,
        purchase_date: format(purchaseDate, "yyyy-MM-dd"),
        pao_months: parseInt(paoMonths),
        usage_frequency: usageFrequency,
        notes: notes.trim() || null,
        photo_url: photoUrl,
      };

      if (isEdit && id) {
        const { error } = await (supabase.from("products" as any) as any)
          .update(productPayload)
          .eq("id", id);
        if (error) throw error;
        toast.success("Produto atualizado! 💄");
        navigate(`/product/${id}`);
      } else {
        const { data: productData, error } = await (supabase.from("products" as any) as any)
          .insert({ user_id: user.id, ...productPayload })
          .select("id")
          .single();
        if (error) throw error;

        if (productData?.id) {
          await supabase.from("purchase_history").insert({
            user_id: user.id,
            product_id: productData.id,
            price: parseFloat(purchasePrice),
            purchase_date: format(purchaseDate, "yyyy-MM-dd"),
            color_code: colorCodes[0] || null,
            notes: null,
            store: null,
          });
        }
        toast.success("Produto adicionado! 💄");
        navigate("/library");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar produto");
    } finally {
      setSaving(false);
    }
  };

  const isValid = name.trim() && brand.trim() && category && purchasePrice;

  if (loadingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {showScanner && (
        <BarcodeScanner onDetected={handleBarcodeDetected} onClose={() => setShowScanner(false)} />
      )}

      <div className="min-h-screen bg-background screen-enter">
        <header className="sticky top-0 z-40 bg-background border-b border-border" style={{ height: "56px" }}>
          <div className="flex items-center gap-3 max-w-lg mx-auto px-4 h-full">
            <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center text-foreground">
              <ArrowLeft className="w-[20px] h-[20px]" strokeWidth={1.5} />
            </button>
            <h1 className="font-display text-[18px] font-normal text-foreground">
              {isEdit ? "Editar Produto" : "Adicionar Produto"}
            </h1>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-6 pt-6 pb-28 animate-fade-in">
          <div className="space-y-6">
            {/* Photo Upload */}
            <div>
            <FieldLabel>Foto</FieldLabel>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              {photoPreview ? (
                <div className="flex items-end gap-3">
                  <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-border">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-foreground/80 flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-btn-dark-fg" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleIdentifyProduct}
                    disabled={identifying}
                    className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary/10 text-primary font-body text-[13px] font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                  >
                    {identifying ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {identifying ? "Identificando…" : "✨ Identificar"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-28 h-28 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-foreground/30 transition-colors"
                >
                  <Camera className="w-6 h-6" strokeWidth={1.5} />
                  <span className="font-body text-[10px] uppercase tracking-[0.08em]">Adicionar foto</span>
                </button>
              )}
            </div>

            {/* Name + barcode */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <FieldLabel>Nome do Produto *</FieldLabel>
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="flex items-center gap-1.5 font-body text-[12px] text-muted-foreground"
                  disabled={lookingUp}
                >
                  {lookingUp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScanBarcode className="w-3.5 h-3.5" strokeWidth={1.5} />}
                  {lookingUp ? "Buscando…" : "Escanear"}
                </button>
              </div>
              <Input
                id="name"
                placeholder="e.g. Ruby Woo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
              />
            </div>

            {/* Brand */}
            <div>
              <FieldLabel>Marca *</FieldLabel>
              <Input
                id="brand"
                placeholder="e.g. MAC Cosmetics"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
                maxLength={100}
              />
            </div>

            {/* Category */}
            <div>
              <FieldLabel>Categoria *</FieldLabel>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-[52px] font-body text-[15px] rounded-md border-border bg-card focus:ring-0 focus:border-primary">
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="font-body">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color Codes */}
            <div>
              <FieldLabel>Códigos de Cor</FieldLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. #C41E3A or Red 01"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColorCode(); } }}
                  className="flex-1"
                  maxLength={50}
                />
                <button
                  type="button"
                  onClick={addColorCode}
                  className="h-[52px] w-[52px] shrink-0 rounded-md border border-border bg-card flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
              {colorCodes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {colorCodes.map((code) => (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-sm bg-muted font-body text-[12px] text-foreground"
                    >
                      {code}
                      <button type="button" onClick={() => removeColorCode(code)}>
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Price & Weight */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Preço *</FieldLabel>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  required
                />
              </div>
              <div>
                <FieldLabel>Peso (g)</FieldLabel>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Opcional"
                  value={weightGrams}
                  onChange={(e) => setWeightGrams(e.target.value)}
                />
              </div>
            </div>

            {/* Purchase Date */}
            <div>
              <FieldLabel>Data de Compra</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "w-full h-[52px] flex items-center px-3 rounded-md border border-border bg-card font-body text-[15px] text-left",
                      !purchaseDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    {purchaseDate ? format(purchaseDate, "dd/MM/yyyy") : "Escolher data"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={purchaseDate}
                    onSelect={(d) => d && setPurchaseDate(d)}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* PAO */}
            <div>
              <FieldLabel>Validade após abertura (PAO)</FieldLabel>
              <Select value={paoMonths} onValueChange={setPaoMonths}>
                <SelectTrigger className="h-[52px] font-body text-[15px] rounded-md border-border bg-card focus:ring-0 focus:border-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="font-body">{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Usage Frequency */}
            <div>
              <FieldLabel>Frequência de Uso</FieldLabel>
              <Select value={usageFrequency} onValueChange={setUsageFrequency}>
                <SelectTrigger className="h-[52px] font-body text-[15px] rounded-md border-border bg-card focus:ring-0 focus:border-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((freq) => (
                    <SelectItem key={freq} value={freq} className="font-body">{freq}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <FieldLabel>Notas</FieldLabel>
              <Textarea
                id="notes"
                placeholder="Observações sobre este produto..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={500}
                className="font-body text-[15px] rounded-md border-border bg-card focus-visible:border-primary focus-visible:ring-0 resize-none"
              />
            </div>

            <Button type="submit" className="w-full mt-2" disabled={!isValid || saving}>
              {saving ? "Salvando..." : isEdit ? "Salvar Alterações" : "Salvar Produto"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddProduct;
