import { useState, useRef } from "react";
import { ArrowLeft, Camera, X, Plus, ScanBarcode, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import BarcodeScanner from "@/components/BarcodeScanner";

const CATEGORIES = [
  "Foundation", "Lipstick", "Eyeshadow", "Blush", "Mascara",
  "Concealer", "Highlighter", "Contour", "Primer", "Setting Spray", "Other",
];

const PAO_OPTIONS = [
  { value: "3", label: "3 months" },
  { value: "6", label: "6 months" },
  { value: "12", label: "12 months" },
  { value: "18", label: "18 months" },
  { value: "24", label: "24 months" },
];

const FREQUENCY_OPTIONS = ["Daily", "Weekly", "Occasional"];

// Map OBF categories to app categories
const mapCategory = (tags: string[] = []): string => {
  const joined = tags.join(" ").toLowerCase();
  if (joined.includes("lipstick") || joined.includes("lip-")) return "Lipstick";
  if (joined.includes("foundation") || joined.includes("base")) return "Foundation";
  if (joined.includes("mascara")) return "Mascara";
  if (joined.includes("eyeshadow") || joined.includes("eye-shadow")) return "Eyeshadow";
  if (joined.includes("blush") || joined.includes("blush")) return "Blush";
  if (joined.includes("concealer")) return "Concealer";
  if (joined.includes("highlight")) return "Highlighter";
  if (joined.includes("contour")) return "Contour";
  if (joined.includes("primer")) return "Primer";
  if (joined.includes("setting") || joined.includes("spray")) return "Setting Spray";
  return "Other";
};

const AddProduct = () => {
  const navigate = useNavigate();
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
  const [usageFrequency, setUsageFrequency] = useState("Occasional");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Barcode scanner
  const [showScanner, setShowScanner] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);

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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Barcode lookup ──────────────────────────────────────────────────────────
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
        const cat = mapCategory(p.categories_tags || []);
        setCategory(cat);
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
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      let photoUrl: string | null = null;

      if (photo) {
        const ext = photo.name.split(".").pop();
        const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-photos")
          .upload(filePath, photo);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("product-photos")
          .getPublicUrl(filePath);
        photoUrl = urlData.publicUrl;
      }

      const { error } = await (supabase.from("products" as any) as any).insert({
        user_id: user.id,
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
      });

      if (error) throw error;
      toast.success("Product added! 💄");
      navigate("/library");
    } catch (error: any) {
      toast.error(error.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const isValid = name.trim() && brand.trim() && category && purchasePrice;

  return (
    <>
      {showScanner && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 glass border-b border-border px-5 py-4">
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <button onClick={() => navigate(-1)} className="text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Add Product</h1>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-5 pt-6 pb-28 animate-fade-in">
          <div className="space-y-5">
            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Photo</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              {photoPreview ? (
                <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-border">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-foreground/70 flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5 text-background" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-28 h-28 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 transition-colors"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-[10px] font-medium">Add photo</span>
                </button>
              )}
            </div>

            {/* Product Name + barcode button */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="name">Product Name *</Label>
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="flex items-center gap-1.5 text-xs text-primary font-medium"
                  disabled={lookingUp}
                >
                  {lookingUp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ScanBarcode className="w-4 h-4" />
                  )}
                  {lookingUp ? "Buscando…" : "Escanear código"}
                </button>
              </div>
              <Input
                id="name"
                placeholder="e.g. Ruby Woo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12"
                required
                maxLength={100}
              />
            </div>

            {/* Brand */}
            <div className="space-y-2">
              <Label htmlFor="brand">Brand *</Label>
              <Input
                id="brand"
                placeholder="e.g. MAC Cosmetics"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="h-12"
                required
                maxLength={100}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color Codes */}
            <div className="space-y-2">
              <Label>Color Codes</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. #C41E3A or Red 01"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColorCode(); } }}
                  className="h-12 flex-1"
                  maxLength={50}
                />
                <Button type="button" variant="outline" size="icon" className="h-12 w-12 shrink-0" onClick={addColorCode}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {colorCodes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {colorCodes.map((code) => (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-sm text-foreground"
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

            {/* Price & Weight row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="h-12"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (g)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Optional"
                  value={weightGrams}
                  onChange={(e) => setWeightGrams(e.target.value)}
                  className="h-12"
                />
              </div>
            </div>

            {/* Purchase Date */}
            <div className="space-y-2">
              <Label>Purchase Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 justify-start text-left font-normal",
                      !purchaseDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {purchaseDate ? format(purchaseDate, "PPP") : "Pick a date"}
                  </Button>
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
            <div className="space-y-2">
              <Label>Expiry after opening (PAO)</Label>
              <Select value={paoMonths} onValueChange={setPaoMonths}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Usage Frequency */}
            <div className="space-y-2">
              <Label>Usage Frequency</Label>
              <Select value={usageFrequency} onValueChange={setUsageFrequency}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((freq) => (
                    <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any notes about this product..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold mt-2"
              disabled={!isValid || saving}
            >
              {saving ? "Saving..." : "Save Product"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddProduct;
