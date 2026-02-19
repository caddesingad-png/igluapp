import { Layers } from "lucide-react";

const Sets = () => {
  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border px-5 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-foreground">SETs</h1>
        </div>
      </header>

      <div className="flex flex-col items-center justify-center px-6 pt-32 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-accent/30 flex items-center justify-center mb-6">
          <Layers className="w-10 h-10 text-accent-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">No sets yet</h2>
        <p className="text-muted-foreground text-center text-sm max-w-[260px]">
          Create sets to organize your products into looks and routines
        </p>
      </div>
    </div>
  );
};

export default Sets;
