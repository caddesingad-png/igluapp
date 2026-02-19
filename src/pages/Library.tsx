import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Library = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border px-5 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-foreground">Library</h1>
          <Button
            size="sm"
            onClick={() => navigate("/add-product")}
            className="rounded-full gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </header>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center px-6 pt-32 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Your collection is empty</h2>
        <p className="text-muted-foreground text-center text-sm max-w-[260px] mb-8">
          Start building your beauty library by adding your first product
        </p>
        <Button
          onClick={() => navigate("/add-product")}
          className="rounded-full px-8 h-12 text-base font-semibold gap-2"
        >
          <Plus className="w-5 h-5" />
          Add your first product
        </Button>
      </div>
    </div>
  );
};

export default Library;
