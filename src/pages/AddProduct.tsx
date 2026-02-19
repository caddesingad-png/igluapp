import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AddProduct = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border px-5 py-4">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Add Product</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 pt-6 pb-8 animate-fade-in">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input id="name" placeholder="e.g. MAC Ruby Woo" className="h-12" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" placeholder="e.g. MAC Cosmetics" className="h-12" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" placeholder="e.g. Lipstick" className="h-12" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shade">Shade</Label>
            <Input id="shade" placeholder="e.g. Ruby Woo" className="h-12" />
          </div>

          <Button className="w-full h-12 text-base font-semibold mt-4" disabled>
            Save Product
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Product saving coming soon
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
